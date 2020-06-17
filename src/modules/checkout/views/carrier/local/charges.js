var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var Forms = require('kiubi/utils/forms.js');
var _ = require('underscore');
var format = require('kiubi/utils/format.js');

var StepsView = require('../steps.js');
var SelectView = require('kiubi/core/views/ui/select.js');
var TagView = require('kiubi/core/views/ui/tag.search.js');


module.exports = Marionette.View.extend({
	template: require('../../../templates/carrier/local/charges.html'),

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
				return tag.value;
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
			}.bind(this)).fail(function(error) {
				var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
				navigationController.showErrorModal(error);
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
		this.rate = 1;
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
			collectionPromise: this.carrierZones.promisedSelect(this.currentZone).done(function(result) {
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
		if (!this.zone) return Backbone.$.Deferred().resolve();

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
