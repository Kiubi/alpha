var Marionette = require('backbone.marionette');
var _ = require('underscore');
var format = require('kiubi/utils/format.js');
var Chart = require('chart.js');

module.exports = Marionette.View.extend({
	template: require('../../templates/dashboard/sources.mobility.html'),

	className: 'post-article dashboard-mobility flex-fill w-100',
	tagName: 'article',

	ui: {
		'chart': 'canvas[data-role="chart"]',
		'desktop-value': '[data-role="desktop-value"]',
		'desktop-prct': '[data-role="desktop-prct"]',
		'mobile-value': '[data-role="mobile-value"]',
		'mobile-prct': '[data-role="mobile-prct"]',
		'tablet-value': '[data-role="tablet-value"]',
		'tablet-prct': '[data-role="tablet-prct"]'
	},

	chart: null,

	initialize: function(options) {

		this.mergeOptions(options, ['report']);

		this.listenTo(this.report, 'report', this.onData);

	},

	onAttach: function() {

		this.chart = new Chart(this.getUI('chart'), {
			type: 'doughnut',
			options: {
				maintainAspectRatio: false,
				legend: {
					display: false
				},
				tooltips: {
					callbacks: {
						label: function(tooltipItem, data) {
							return data.labels[tooltipItem.index];
						},
						afterLabel: function(tooltipItem, data) {
							var total = _.reduce(data.datasets[0].data, function(acc, num) {
								return acc + num;
							}, 0);
							var prct = (total > 0) ? ' (' + format.formatFloat(data.datasets[0].data[tooltipItem.index] * 100 / total, 2, ' ') + '%)' : '';
							return format.formatFloat(data.datasets[0].data[tooltipItem.index], 0, ' ') + ' visites' + prct;

						}
					}
				}
			}
		});
	},

	onBeforeDetach: function() {
		this.chart.destroy();
	},

	onData: function() {
		if (!this.report.get('summary') || !this.report.get('summary').mobility) return;

		var mobility = this.report.get('summary').mobility;

		this.chart.data = {
			labels: ['Ordinateurs', 'Tablettes', 'Mobiles'],
			datasets: [{
				data: [mobility.desktop, mobility.tablet, mobility.mobile],
				"backgroundColor": ["#77A8FF", "#d6e9c6", "#fed558"]
			}]
		};

		this.chart.update();

		if (mobility.desktop != null) {
			var total = mobility.desktop + mobility.tablet + mobility.mobile;
			this.getUI('desktop-value').text(format.formatFloat(mobility.desktop, 0, ' '));
			this.getUI('mobile-value').text(format.formatFloat(mobility.mobile, 0, ' '));
			this.getUI('tablet-value').text(format.formatFloat(mobility.tablet, 0, ' '));

			if (total > 0) {
				this.getUI('desktop-prct').text(format.formatFloat(mobility.desktop * 100 / total, 2, '') + ' %');
				this.getUI('mobile-prct').text(format.formatFloat(mobility.mobile * 100 / total, 2, '') + ' %');
				this.getUI('tablet-prct').text(format.formatFloat(mobility.tablet * 100 / total, 2, '') + ' %');
			} else {
				this.getUI('desktop-prct').text('');
				this.getUI('mobile-prct').text('');
				this.getUI('tablet-prct').text('');
			}
		} else {
			this.getUI('desktop-value').text('-');
			this.getUI('mobile-value').text('-');
			this.getUI('tablet-value').text('-');
			this.getUI('desktop-prct').text('-');
			this.getUI('mobile-prct').text('-');
			this.getUI('tablet-prct').text('-');
		}
	}

});
