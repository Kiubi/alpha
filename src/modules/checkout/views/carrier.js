var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');
var moment = require('moment');
var format = require('kiubi/utils/format.js');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');
var Session = Backbone.Radio.channel('app').request('ctx:session');
var WysiwygBehavior = require('kiubi/behaviors/tinymce.js');
var SelectifyBehavior = require('kiubi/behaviors/selectify.js');

var SelectView = require('kiubi/core/views/ui/select.js');
var StepsView = require('./carrier.steps.js');
var TagView = require('kiubi/core/views/ui/tag.search.js');

/*
 * Magasin
 */

var InfosMagasinView = Marionette.View.extend({
	template: require('../templates/carrier/magasin/infos.html'),

	behaviors: [WysiwygBehavior],

	regions: {
		countries: {
			el: "div[data-role='countries']",
			replaceElement: true
		}
	},

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'countries']);
	},

	onRender: function() {
		this.showChildView('countries', new SelectView({
			collection: this.countries,
			selected: this.model.get('country_id'),
			name: 'country_id'
		}));
		this.countries.fetch();
	}

});

var ScheduleRowView = Marionette.View.extend({

	className: 'row',
	template: require('../templates/carrier/schedule.row.html'),

	behaviors: [SelectifyBehavior],

	templateContext: function() {

		var name = moment().day(this.model.get('day_of_week')).format('dddd');
		name = name.charAt(0).toUpperCase() + name.slice(1); // ucfirst

		var frames = this.model.get('time_frames') && _.isArray(this.model.get('time_frames')) ? this.model.get(
			'time_frames').join(',') : ''

		return {
			name: name,
			frames: frames
		};
	}

});
var SpotlightsCollectionView = Marionette.CollectionView.extend({
	className: '',
	childView: ScheduleRowView
});

var ScheduleView = Marionette.View.extend({
	template: require('../templates/carrier/schedule.html'),

	regions: {
		'days': {
			el: 'div[data-role="days"]',
			replaceElement: true
		}
	},

	ui: {
		'require_scheduling': 'select[name="require_scheduling"]'
	},

	events: {
		'change @ui.require_scheduling': function() {
			this.model.set('require_scheduling', this.getUI('require_scheduling').val());
			this.updateDays();
			this.getChildView('days').render();
		}
	},

	initialize: function(options) {
		this.mergeOptions(options, ['model']);

		this.days = new Backbone.Collection();
		this.days.model = Backbone.Model.extend({
			idAttribute: 'day_of_week',
			defaults: {
				day_of_week: 0,
				is_open: false,
				require_scheduling: 'datetime',
				time_frames: []
			}
		});
	},

	templateContext: function() {
		return {
			'closed_days': this.model.get('closed_days') && _.isArray(this.model.get('closed_days')) ? this.model.get(
				'closed_days').join(',') : '',
		};
	},

	onRender: function() {
		this.updateDays();
		this.showChildView('days', new SpotlightsCollectionView({
			collection: this.days
		}));
	},

	updateDays: function() {
		this.days.reset();

		if (this.model.get('require_scheduling') == 'no') {
			return;
		}

		for (var i = 0; i < 7; i++) {
			this.days.add({
				day_of_week: i,
				require_scheduling: this.model.get('require_scheduling')
			});
		}

		if (!this.model.get('open_days') || !_.isArray(this.model.get('open_days'))) {
			return;
		}

		_.each(this.model.get('open_days'), function(day) {

			var d = this.days.get(day.day_of_week);
			d.set('is_open', day.is_open);
			d.set('time_frames', day.time_frames);

		}.bind(this));

	}

});

/*
 * Socol
 */

var InfosSocolView = Marionette.View.extend({
	template: require('../templates/carrier/socolissimo/infos.html'),

	behaviors: [WysiwygBehavior],

	regions: {
		taxes: {
			el: "div[data-role='taxes']",
			replaceElement: true
		}
	},

	ui: {
		'delay': 'input[name="delay"]',
		'free_threshold': 'input[name="free_threshold"]'
	},

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'taxes']);
		this.taxes.fetch();

		this.listenTo(this.model, 'change', function() {
			this.updateView();
		});
	},

	templateContext: function() {
		return {
			'threshold': format.formatFloat(this.model.get('threshold'), 2),
			'base_price': this.model.meta.base_price,
			'currency': format.currencyEntity(this.model.meta.currency)
		};
	},

	onRender: function() {
		this.showChildView('taxes', new SelectView({
			collection: this.taxes,
			selected: this.model.get('tax_id'),
			name: 'tax_id'
		}));
	},

	updateView: function() {
		this.model.hasChanged('free_threshold') && this.getUI('free_threshold').val(format.formatFloat(this.model.get(
			'free_threshold'), 2));
		this.model.hasChanged('delay') && this.getUI('delay').val(this.model.get('delay'));
	},

	extractFields: function() {
		return {
			free_threshold: this.getUI('free_threshold').val(),
			delay: this.getUI('delay').val()
		};
	}

});

var ChargesSocolView = Marionette.View.extend({
	template: require('../templates/carrier/socolissimo/charges.html'),

	regions: {
		steps: {
			el: "div[data-role='steps']",
			replaceElement: true
		},
		pickup: {
			el: "div[data-role='pickup']",
			replaceElement: true
		}
	},

	ui: {
		'pickup_free_threshold': 'input[name="socolissimo_pickup_free_threshold"]',
		'be_extra': 'input[name="socolissimo_be_extra"]',
		'be_enabled': 'input[name="socolissimo_be_enabled"]',

		'addStepBtn': 'a[data-role="step-add"]',
		'addPickupBtn': 'a[data-role="pickup-add"]',

		'form_pickup': 'form[data-role="pickup"]',
		'form_steps': 'form[data-role="steps"]'
	},

	events: {
		'click @ui.addStepBtn': function() {
			var view = this.getChildView('steps');
			if (!view) {
				return;
			}
			view.collection.add({
				weight: '',
				price_ex_vat: '',
				price_inc_vat: ''
			});
		},
		'click @ui.addPickupBtn': function() {
			var view = this.getChildView('pickup');
			if (!view) {
				return;
			}
			view.collection.add({
				weight: '',
				price_ex_vat: '',
				price_inc_vat: ''
			});
		}
	},

	fields: [
		'socolissimo_pickup_free_threshold',
		'socolissimo_be_extra',
		'socolissimo_be_enabled'
	],

	rate: null,
	country: null,
	pickup: null,

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'carrierCountries']);
		this.rate = null;
		this.country = null;
		this.pickup = null;
	},

	templateContext: function() {
		return {
			'base_price': this.model.meta.base_price,
			'currency': format.currencyEntity(this.model.meta.currency),
			socolissimo_pickup_free_threshold: this.model.get('socolissimo_pickup_free_threshold') != '' ?
				format.formatFloat(this.model.get('socolissimo_pickup_free_threshold'), 4) : '',
			socolissimo_be_extra: this.model.get('socolissimo_be_extra') != '' ?
				format.formatFloat(this.model.get('socolissimo_be_extra'), 4) : ''
		};
	},

	onRender: function() {
		this.country = this.carrierCountries.add({
			carrier_id: this.model.get('carrier_id'),
			country_id: 73 // France
		});
		this.country.fetch().done(function() {
			this.showChildView('steps', new StepsView({
				collection: this.country.get('steps'),
				childViewOptions: {
					taxesProxy: this,
					currency: format.currencyEntity(this.model.meta.currency)
				}
			}));
			this.model.set({
				delay: this.country.get('delay'),
				free_threshold: this.country.get('free_threshold')
			});
		}.bind(this));

		this.pickup = this.carrierCountries.add({
			carrier_id: this.model.get('carrier_id'),
			country_id: 0 // Pickup
		});
		this.pickup.fetch().done(function() {
			this.showChildView('pickup', new StepsView({
				collection: this.pickup.get('steps'),
				childViewOptions: {
					taxesProxy: this,
					currency: format.currencyEntity(this.model.meta.currency)
				}
			}));
		}.bind(this));

	},

	/* Handle Tax change */

	onTaxChange: function(rate) {
		this.rate = rate;
	},

	taxRate: function() {
		return this.rate;
	},

	extractFields: function() {
		return {
			socolissimo_pickup_free_threshold: this.getUI('pickup_free_threshold').val(),
			socolissimo_be_extra: this.getUI('be_extra').val(),
			socolissimo_be_enabled: this.getUI('be_enabled').filter(":checked").val()
		};
	},

	onSave: function(data_country) {


		var steps = Forms.extractFields(['weight', 'price_ex_vat'], this, this.getUI('form_steps'));
		if (steps.weight) {
			data_country.steps = {};
			for (var i = 0; i < steps.weight.length; i++) {
				var w = Math.round(format.unformatFloat(steps.weight[i]) * 1000);
				if (isNaN(w)) continue;
				data_country.steps[w] = steps.price_ex_vat[i];
			}
		} else {
			data_country.steps = ''; // hack
		}

		var data_pickup = {};
		var steps = Forms.extractFields(['weight', 'price_ex_vat'], this, this.getUI('form_pickup'));
		if (steps.weight) {
			data_pickup.steps = {};
			for (var i = 0; i < steps.weight.length; i++) {
				var w = Math.round(format.unformatFloat(steps.weight[i]) * 1000);
				if (isNaN(w)) continue;
				data_pickup.steps[w] = steps.price_ex_vat[i];
			}
		} else {
			data_pickup.steps = ''; // hack
		}

		return Backbone.$.when(
			this.country.save(data_country, {
				patch: true,
				wait: true
			}),
			this.pickup.save(data_pickup, {
				patch: true,
				wait: true
			})
		);

	}

});

/*
 * TranchesPoids
 */

var InfosView = Marionette.View.extend({
	template: require('../templates/carrier/infos.html'),

	behaviors: [WysiwygBehavior],

	regions: {
		taxes: {
			el: "div[data-role='taxes']",
			replaceElement: true
		}
	},

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'taxes']);
		this.taxes.fetch();
	},

	templateContext: function() {
		return {
			'threshold': format.formatFloat(this.model.get('threshold'), 2),
			'base_price': this.model.meta.base_price,
			'currency': format.currencyEntity(this.model.meta.currency)
		};
	},

	onRender: function() {
		this.showChildView('taxes', new SelectView({
			collection: this.taxes,
			selected: this.model.get('tax_id'),
			name: 'tax_id'
		}));
	}

});

var ExportView = Marionette.View.extend({
	template: require('../templates/carrier/export.html'),

	initialize: function(options) {
		this.mergeOptions(options, ['model']);
	}

});

var ChargesTranchesView = Marionette.View.extend({
	template: require('../templates/carrier/charges.html'),

	regions: {
		countries: {
			el: "div[data-role='countries']",
			replaceElement: true
		},
		steps: {
			el: "div[data-role='steps']",
			replaceElement: true
		}
	},

	ui: {
		'delay': 'input[name="delay"]',
		'free_threshold': 'input[name="free_threshold"]',

		'addStepBtn': 'a[data-role="step-add"]'
	},

	events: {
		'click @ui.addStepBtn': function() {
			var view = this.getChildView('steps');
			if (!view) {
				return;
			}
			view.collection.add({
				weight: '',
				price_ex_vat: '',
				price_inc_vat: ''
			});
		}
	},


	fields: [
		'delay',
		'free_threshold',
		'country_id'
	],

	rate: null,
	country: null,

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'carrierCountries']);
		this.rate = null;
		this.country = null;
	},

	templateContext: function() {
		return {
			'base_price': this.model.meta.base_price,
			'currency': format.currencyEntity(this.model.meta.currency)
		};
	},

	updateView: function() {
		if (!this.country) return;
		this.getUI('free_threshold').val(format.formatFloat(this.country.get('free_threshold'), 2));
		this.getUI('delay').val(this.country.get('delay'));
	},

	onRender: function() {
		this.showChildView('countries', new SelectView({
			collectionPromise: this.carrierCountries.promisedSelect().done(function(result) {
				if (result.length > 0) {
					if (!result.at(0).get('is_group')) {
						this.selectContry(result.at(0).get('value'));
					} else if (result.length > 1) {
						this.selectContry(result.at(1).get('value'));
					}
				}
			}.bind(this)),
			name: 'country_id'
		}));

	},

	/* Handle Country change */

	onChildviewChange: function(country_id) {
		this.selectContry(parseInt(country_id));
	},

	selectContry: function(country_id) {

		this.country = this.carrierCountries.get(country_id);
		if (!this.country) return;

		this.country.fetch().done(function() {
			this.updateView();

			var view = this.getChildView('steps');
			if (!view) {
				view = new StepsView({
					collection: this.country.get('steps'),
					childViewOptions: {
						taxesProxy: this,
						currency: format.currencyEntity(this.model.meta.currency)
					}
				});
				this.showChildView('steps', view);
			} else {
				view.collection.set(this.country.get('steps').toJSON(), {
					reset: true
				});
			}

		}.bind(this));
	},

	/* Handle Tax change */

	onTaxChange: function(rate) {
		this.rate = rate;
	},

	taxRate: function() {
		return this.rate;
	},

	onSave: function() {
		var data = Forms.extractFields(this.fields, this);
		var steps = Forms.extractFields(['weight', 'price_ex_vat'], this);
		if (steps.weight) {
			data.steps = {};
			for (var i = 0; i < steps.weight.length; i++) {
				var w = Math.round(format.unformatFloat(steps.weight[i]) * 1000);
				if (isNaN(w)) continue;
				data.steps[w] = steps.price_ex_vat[i];
			}
		} else {
			data.steps = ''; // hack
		}

		return this.country.save(data, {
			patch: true,
			wait: true
		}).done(function() {
			var view = this.getChildView('countries');
			var option = view.collection.get(this.country.get('country_id'));
			var index_undefined = view.collection.findLastIndex({
				is_group: true
			});

			// At least the 2 groups => steps defined and steps undefined
			// Move an undefined country to the defined group
			if (index_undefined > 0 && view.collection.indexOf(option) > index_undefined) {
				view.collection.remove(option, {
					silent: true
				});
				view.collection.add(option, {
					at: 1
				});
				view.render();
			}

		}.bind(this));
	}

});

/*
 * Local
 */

var ChargesLocalView = Marionette.View.extend({
	template: require('../templates/carrier/local/charges.html'),

	regions: {
		zones: {
			el: "div[data-role='zones']",
			replaceElement: true
		},
		steps: {
			el: "div[data-role='steps']",
			replaceElement: true
		},
		'tags': {
			el: "div[data-role='tags']",
			replaceElement: true
		}
	},

	ui: {
		'free_threshold': 'input[name="free_threshold"]',

		'addStepBtn': 'a[data-role="step-add"]',

		'selectZone': 'div[data-role="select-zone"]',
		'zoneForm': 'div[data-role="edit-zone"]',
		'cancelZoneBtn': 'button[data-role="cancel-zone"]',
		'saveZoneBtn': 'button[data-role="save-zone"]',
		'addZoneBtn': 'a[data-role="add-zone"]',
		'editZoneBtn': 'a[data-role="edit-zone"]',
		'deleteZoneBtn': 'a[data-role="delete-zone"]'
	},

	events: {
		'click @ui.addStepBtn': function() {
			var view = this.getChildView('steps');
			if (!view) {
				return;
			}
			view.collection.add({
				weight: '',
				price_ex_vat: '',
				price_inc_vat: ''
			});
		},

		// Handle Zone Edition

		'click @ui.addZoneBtn': function() {
			var view = this.getChildView('tags');
			if (!view) return;
			view.clearTags();

			this.addingZone = true;

			this.getUI('selectZone').hide();
			this.getUI('zoneForm').show();
		},
		'click @ui.editZoneBtn': function() {
			var view = this.getChildView('tags');
			if (!view) return;
			var tags = _.map(this.zone.get('postal_codes'), function(code) {
				return {
					label: code,
					value: code
				};
			});
			view.setTags(tags);
			this.addingZone = false;

			this.getUI('selectZone').hide();
			this.getUI('zoneForm').show();
		},
		'click @ui.cancelZoneBtn': function() {
			this.getUI('zoneForm').hide();
			this.getUI('selectZone').show();
		},
		'click @ui.saveZoneBtn': function() {

			var view = this.getChildView('tags');
			if (!view) return;
			var postal_codes = _.map(view.getTags(), function(tag) {
				return tag.value
			});

			var p, model;
			if (this.addingZone) {
				model = this.carrierZones.add({
					postal_codes: postal_codes,
					carrier_id: this.carrierZones.carrier_id
				}, {
					wait: true
				});
				p = model.save();
			} else {
				model = this.zone;
				p = model.save({
					postal_codes: postal_codes
				}, {
					patch: true,
					wait: true
				});
			}

			p.done(function() {
				this.currentZone = model.get('zone_id');
				this.render();
			}.bind(this)).fail(function(xhr) {
				var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
				navigationController.showErrorModal(xhr);
			}.bind(this));
		},

		'click @ui.deleteZoneBtn': function() {
			this.zone.destroy();
			this.currentZone = null;
			this.zone = null;

			this.render();
		}
	},

	fields: [
		'free_threshold',
		'zone_id'
	],

	rate: null,
	zone: null,
	addingZone: null,
	currentZone: null,

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'carrierZones', 'search']);
		this.rate = null;
		this.zone = null;
		this.addingZone = null;
		this.currentZone = null;
	},

	templateContext: function() {
		return {
			'base_price': this.model.meta.base_price,
			'currency': format.currencyEntity(this.model.meta.currency)
		};
	},

	updateView: function() {
		if (!this.zone) return;
		this.getUI('free_threshold').val(format.formatFloat(this.zone.get('free_threshold'), 2));
	},

	onRender: function() {
		this.showChildView('zones', new SelectView({
			collectionPromise: this.carrierZones.promisedSelect(null, this.currentZone).done(function(result) {
				if (result.length > 0) {
					this.selectZone(this.currentZone ? this.currentZone : result.at(0).get('value'));
				}
			}.bind(this)),
			name: 'zone_id'
		}));

		this.showChildView('tags', new TagView({
			evtSuffix: 'tags',
			searchPlaceholder: "Rechercher et ajouter jusqu'à 20 codes postaux par zone"
		}));
	},

	/* Handle Zone change */

	onChildviewChange: function(zone_id) {
		this.selectZone(parseInt(zone_id));
	},

	selectZone: function(zone_id) {

		this.zone = this.carrierZones.get(zone_id);
		if (!this.zone) return;

		this.currentZone = zone_id;

		this.zone.fetch().done(function() {
			this.updateView();

			var view = this.getChildView('steps');
			if (!view) {
				view = new StepsView({
					collection: this.zone.get('steps'),
					childViewOptions: {
						taxesProxy: this,
						currency: format.currencyEntity(this.model.meta.currency)
					}
				});
				this.showChildView('steps', view);
			} else {
				view.collection.set(this.zone.get('steps').toJSON(), {
					reset: true
				});
			}

		}.bind(this));
	},

	/* Handle Zone edition/creation */

	onChildviewInputTags: function(term, view) {

		if (term === '') return;

		this.search.fetch({
			data: {
				term: term
			}
		}).done(function() {
			var results = _.map(this.search.toJSON(), function(city) {
				return {
					label: city.postal_code + ' (' + city.cities + ')',
					value: city.postal_code
				};
			});

			view.showResults(results);

		}.bind(this));
	},

	/* Handle Tax change */

	onTaxChange: function(rate) {
		this.rate = rate;
	},

	taxRate: function() {
		return this.rate;
	},

	onSave: function() {
		var data = Forms.extractFields(this.fields, this);
		var steps = Forms.extractFields(['weight', 'price_ex_vat'], this);
		if (steps.weight) {
			data.steps = {};
			for (var i = 0; i < steps.weight.length; i++) {
				var w = Math.round(format.unformatFloat(steps.weight[i]) * 1000);
				if (isNaN(w)) continue;
				data.steps[w] = steps.price_ex_vat[i];
			}
		} else {
			data.steps = ''; // hack
		}

		this.zone.set(data);

		return this.zone.save(data, {
			patch: true,
			wait: true
		});
	}

});

module.exports = Marionette.View.extend({
	template: require('../templates/carrier.html'),
	className: 'container',
	service: 'checkout',

	behaviors: [FormBehavior],

	regions: {
		'infos': {
			el: 'div[data-role="infos"]',
			replaceElement: true
		},
		'schedule': {
			el: 'div[data-role="schedule"]',
			replaceElement: true
		},
		'export': {
			el: 'div[data-role="export"]',
			replaceElement: true
		},
		'charges': {
			el: 'div[data-role="charges"]',
			replaceElement: true
		}
	},

	fields: [
		'name',
		'is_enabled',
		'is_default',
		'description',
		'threshold',
		'tax_id',

		// magasin
		'company',
		'address',
		'zipcode',
		'city',
		'country_id',

		// tranchespoids
		'coliship_type',
		'use_coliship',

		// scheduling
		'require_scheduling',
		'open_days',
		'closed_days',
		'limit_hour',
		'scheduling_interval_min',
		'scheduling_interval_max',

		// socol
		'socolissimo_id',
		'socolissimo_secret',
		'coliship_tradername'
	],

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'taxes', 'countries', 'cities', 'carrierCountries', 'carrierZones',
			'search'
		]);
	},

	templateContext: function() {
		return {
			is_deletable: this.model.isDeletable(),
			domain: Session.site.get('domain')
		};
	},

	onRender: function() {

		switch (this.model.get('type')) {
			case 'magasin':
				this.showChildView('infos', new InfosMagasinView({
					model: this.model,
					countries: this.countries
				}));
				this.showChildView('schedule', new ScheduleView({
					model: this.model
				}));
				break;
			case 'socolissimo':
				var view = new InfosSocolView({
					model: this.model,
					taxes: this.taxes
				});
				this.listenTo(view, 'childview:change', this.onTaxChange);
				this.listenTo(view, 'childview:load', this.onTaxChange);
				this.showChildView('infos', view);
				this.showChildView('charges', new ChargesSocolView({
					model: this.model,
					carrierCountries: this.carrierCountries
				}));
				break;
			case 'local':
				var view = new InfosView({
					model: this.model,
					taxes: this.taxes
				});
				this.listenTo(view, 'childview:change', this.onTaxChange);
				this.listenTo(view, 'childview:load', this.onTaxChange);
				this.showChildView('infos', view);
				this.showChildView('schedule', new ScheduleView({
					model: this.model
				}));
				this.showChildView('charges', new ChargesLocalView({
					model: this.model,
					carrierZones: this.carrierZones,
					search: this.search
				}));
				break;
			case 'tranchespoids':
				var view = new InfosView({
					model: this.model,
					taxes: this.taxes
				});
				this.listenTo(view, 'childview:change', this.onTaxChange);
				this.listenTo(view, 'childview:load', this.onTaxChange);
				this.showChildView('infos', view);
				this.showChildView('charges', new ChargesTranchesView({
					model: this.model,
					carrierCountries: this.carrierCountries
				}));
				this.showChildView('export', new ExportView({
					model: this.model
				}));
				break;
		}

	},

	onTaxChange: function(tax_id) {
		var tax = this.taxes.get(tax_id);
		if (!tax) return;

		this.getChildView('charges').triggerMethod('tax:change', (1 + tax.get('vat_rate') / 100));
	},

	onSave: function() {

		var promise;
		switch (this.model.get('type')) {
			case 'socolissimo':
				promise = function() {
					return this.getChildView('charges').onSave(this.getChildView('infos').extractFields());
				}.bind(this);
				break;
			case 'local':
				promise = function() {
					return this.getChildView('charges').onSave();
				}.bind(this);
				break;
			case 'tranchespoids':
				promise = function() {
					return this.getChildView('charges').onSave();
				}.bind(this);
				break;
			default:
				promise = function() {
					return Backbone.$.Deferred().resolve();
				}.bind(this);
				break;
		}

		var data = Forms.extractFields(this.fields, this);
		if (this.model.get('type') == 'socolissimo') {
			_.extend(data, this.getChildView('charges').extractFields());
		}
		if (data.open_days) {
			_.map(data.open_days, function(day) {
				day.time_frames = !day.time_frames || day.time_frames == '' ? [] : day.time_frames.split(',');
			});
		}

		return this.model.save(data, {
			patch: true,
			wait: true
		}).then(promise);
	},

	onDelete: function() {
		if (!this.model.isDeletable()) return null;
		return this.model.destroy({
			wait: true
		});
	}

});
