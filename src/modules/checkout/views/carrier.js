var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');
var Session = Backbone.Radio.channel('app').request('ctx:session');

/*
 * Magasin
 */

var InfosMagasinView = require('./carrier/magasin/infos');

/*
 * Socol
 */

var InfosSocolView = require('./carrier/socolissimo/infos');
var ChargesSocolView = require('./carrier/socolissimo/charges');

/*
 * TranchesPoids
 */

var InfosView = require('./carrier/infos');
var ExportView = require('./carrier/export');
var ChargesTranchesView = require('./carrier/charges');

/*
 * Local
 */

var ChargesLocalView = require('./carrier/local/charges');

/*
 * DPD
 */

var InfosDpdView = require('./carrier/dpd/infos');
var ChargesDpdView = require('./carrier/dpd/charges');

/*
 * Schedule
 */

var ScheduleView = require('./carrier/schedule');

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
		'export_type',
		//'dpd_customer_center',
		//'dpd_customer',

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
		'coliship_tradername',

		// dpd
		'dpd_customer_center',
		'dpd_customer',
		'dpd_gmaps',
		'dpd_insurance_threshold',
		'dpd_gsm_notification',
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
			case 'dpd':
				// InfosDpdView
				var view = new InfosDpdView({
					model: this.model,
					taxes: this.taxes
				});
				this.listenTo(view, 'childview:change', this.onTaxChange);
				this.showChildView('infos', view);
				this.showChildView('charges', new ChargesDpdView({
					model: this.model,
					carrierCountries: this.carrierCountries
				}));
				break;
			case 'tranchespoids':
				var view = new InfosView({
					model: this.model,
					taxes: this.taxes
				});
				this.listenTo(view, 'childview:change', this.onTaxChange);
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

		if (this.getChildView('charges')) this.getChildView('charges').triggerMethod('tax:change', (1 + tax.get('vat_rate') / 100));
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
			case 'tranchespoids':
			case 'dpd':
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

		var data = Forms.extractFields(this.fields, this, {
			autoCast: false
		});
		if (this.model.get('type') == 'socolissimo') {
			_.extend(data, this.getChildView('charges').extractFields());
		}
		if (data.open_days) {
			_.map(data.open_days, function(day) {
				day.time_frames = !day.time_frames || day.time_frames == '' ? [] : day.time_frames.split(',');
			});
		}

		if (this.model.get('type') == 'tranchespoids') {
			if (data.export_type === 'coliship') {
				delete data.dpd_customer_center;
				delete data.dpd_customer;
				delete data.dpd_insurance_threshold;
			} else if (data.export_type === 'dpd') {
				delete data.coliship_type;
			} else {
				delete data.coliship_type;
				delete data.dpd_customer_center;
				delete data.dpd_insurance_threshold;
				delete data.dpd_customer;
			}
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
