var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');
var format = require('kiubi/utils/format.js');
var l10n = require('kiubi/utils/translate');

require('jqvmap-novulnerability');
require('jqvmap-novulnerability/dist/maps/jquery.vmap.world.js');
require('jqvmap-novulnerability/dist/maps/jquery.vmap.france.js');

module.exports = Marionette.View.extend({
	template: require('../../templates/dashboard/map.html'),

	attributes: function() {
		return {
			class: 'col-12 col-lg-' + this.model.get('size') + ' order-lg-' + this.model.get('order') + ' d-flex'
		};
	},

	ui: {
		'map': '[data-role="map"]',
		'switch': '[data-role="switch"]'
	},

	events: {
		'click @ui.switch': function(event) {
			this.mode = Backbone.$(event.currentTarget).data('mode');
			this.onBeforeDetach();
			this.render();
		}
	},

	mode: null,

	initialize: function(options) {
		this.mergeOptions(options, ['report']);

		this.listenTo(this.report, 'report', this.render);

		this.mode = 'france'; // world | france
	},

	templateContext: function() {
		return {
			mode: this.mode
		};
	},

	onDomRefresh: function() {
		var origins = this.report.get('origins');

		if (this.mode == 'world') {
			this.renderWorld(origins && origins.countries ? origins.countries : []);
		} else if (this.mode == 'france') {
			this.renderFrance(origins && origins.departments ? origins.departments : []);
		}
	},

	renderFrance: function(departments) {

		var gdpData = _.reduce(departments, function(acc, dept, index) {
			if (dept >= 0) {
				acc['fr-' + index] = dept;
			}
			return acc;
		}, {});

		this.getUI('map').vectorMap({
			map: 'france_fr',
			backgroundColor: '#fafafc',
			borderColor: '#fafafc',
			color: '#E2E5EB',
			borderOpacity: 1,
			hoverOpacity: 0.7,
			enableZoom: false,
			showTooltip: true,
			values: gdpData,
			scaleColors: ['#C3D9FF', '#337ab7'],
			normalizeFunction: 'polynomial',

			onLabelShow: function(event, label, code) {
				if (!gdpData[code]) {
					event.preventDefault();
					return;
				}

				var name = label.text();
				label.text(name + ' : ' + format.plural(gdpData[code], '%d commande', '%d commandes'));
			},

			onRegionClick: function(event, code) {
				// disable region selection
				event.preventDefault();

				if (!gdpData[code]) {
					return;
				}

				var days;
				// this.report.get('days') can be an array or a double dimensionnal array
				if (this.report.get('days')[0].date) {
					days = this.report.get('days');
				} else {
					days = this.report.get('days')[0];
				}

				var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
				navigationController.navigate('/checkout/orders?status=all&department=' + code.substring(3) +
					'&creation_date_min=' + days[0].date +
					'&creation_date_max=' + days[days.length - 1].date);
			}.bind(this)
		});
	},

	renderWorld: function(countries) {

		var gdpData = _.reduce(countries, function(acc, country, index) {
			if (country >= 0) {
				acc[index.toLowerCase()] = country;
			}
			return acc;
		}, {});

		this.getUI('map').vectorMap({
			map: 'world_en',
			backgroundColor: '#fafafc',
			borderColor: '#fafafc',
			color: '#E2E5EB',
			hoverOpacity: 0.7,
			enableZoom: false,
			showTooltip: true,
			values: gdpData,
			scaleColors: ['#C3D9FF', '#337ab7'],
			normalizeFunction: 'polynomial',

			onLabelShow: function(event, label, code) {
				if (!gdpData[code]) {
					event.preventDefault();
					return;
				}
				var name = l10n.translate('country.' + code.toUpperCase());
				if (name == 'country.' + code.toUpperCase()) name = code.toUpperCase(); // Fallback

				label.text(name + ' : ' + format.plural(gdpData[code], '%d commande', '%d commandes'));
			},

			onRegionClick: function(event, code) {
				// disable region selection
				event.preventDefault();
			}.bind(this)
		});
	},

	onBeforeDetach: function() {
		// jqvmap add a nasty div directly in body
		Backbone.$('.jqvmap-label').remove();
	}

});
