var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var Chart = require('chart.js');

var TooltipBehavior = require('kiubi/behaviors/tooltip');
var SelectifyBehavior = require('kiubi/behaviors/selectify.js');

module.exports = Marionette.View.extend({
	template: require('../templates/dashboard.html'),
	behaviors: [TooltipBehavior, SelectifyBehavior],
	pageTitle: 'Tableau de bord',

	ui: {
		'chart': 'canvas[data-role="chart"]'
	},

	chart: null,

	onAttach: function() {

		Chart.defaults.global.maintainAspectRatio = false;
		Chart.defaults.global.animation.duration = 0;
		Chart.defaults.global.defaultFontColor = "#ccc";
		Chart.defaults.global.defaultFontFamily = "'Open Sans', sans-serif";
		Chart.defaults.global.elements.line.borderWidth = "2";
		Chart.defaults.global.elements.point.radius = "5";
		Chart.defaults.global.elements.point.borderWidth = "2";
		Chart.defaults.global.elements.point.hitRadius = "2";
		Chart.defaults.global.elements.point.hoverRadius = "7";
		Chart.defaults.global.legend.display = false;
		Chart.defaults.global.tooltips.backgroundColor = "#000";
		Chart.defaults.global.tooltips.displayColors = false;
		Chart.defaults.global.tooltips.intersect = false;
		Chart.defaults.global.tooltips.titleFontFamily = "'Helvetica Neue',Helvetica,Arial,sans-serif";
		Chart.defaults.global.tooltips.bodyFontFamily = "'Helvetica Neue',Helvetica,Arial,sans-serif";
		Chart.defaults.global.tooltips.cornerRadius = 4;

		this.chart = new Chart(this.getUI('chart'), {
			data: {
				labels: ["01/03", "06/03", "11/03", "16/03", "21/03", "26/03", "31/03"],
				datasets: [{
						type: 'line',
						borderColor: "#337ab7",
						backgroundColor: "rgba(51,122,183,0.1)",
						pointBackgroundColor: "#337ab7",
						pointBorderColor: "#fff",
						pointHoverBorderColor: '#373737',
						pointHoverBackgroundColor: '#fff',
						label: "Visiteurs",
						data: [65, 59, 80, 81, 56, 55, 40]
					},
					{
						type: 'line',
						borderColor: "#c4b1c4",
						backgroundColor: "rgba(196,177,196,0.1)",
						pointBackgroundColor: "#c4b1c4",
						pointBorderColor: "#fff",
						pointHoverBorderColor: '#373737',
						pointHoverBackgroundColor: '#fff',
						label: "Période précédente",
						data: [35, 78, 53, 90, 32, 12, 65]
					}
				]
			},
			options: {
				layout: {
					padding: {
						top: 10
					}
				},
				scales: {
					xAxes: [{
						position: 'bottom',
						gridLines: {
							color: "rgba(0, 0, 0, 0.05)",
							zeroLineColor: "rgba(0, 0, 0, 0.1)"

						}

					}],
					yAxes: [{
						type: 'linear',
						position: 'left',
						gridLines: {
							color: "rgba(0, 0, 0, 0.05)",
							zeroLineColor: "rgba(0, 0, 0, 0.1)"
						}

					}]

				}
			}
		});
	},

	onBeforeDetach: function() {
		this.chart.destroy();
	}

});
