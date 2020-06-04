var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');
var Chart = require('chart.js');
var format = require('kiubi/utils/format.js');
var moment = require('moment');

var TooltipBehavior = require('kiubi/behaviors/tooltip');
var SelectifyBehavior = require('kiubi/behaviors/selectify.js');
var Datepicker = require('kiubi/behaviors/datepicker.js');

var Session; // Must wait because this model is loaded BEFORE session start

function skinDataset(data, label, is_primary, formatAsFloat, tooltipsTitles) {

	var dataset = {
		type: 'line',
		borderColor: "",
		backgroundColor: "rgba(255,255,255,0.1)",
		pointBorderWidth: 0,
		borderWidth: 1,
		pointBackgroundColor: "#0a477b",
		pointRadius: 3,
		hoverRadius: 5,
		pointBorderColor: "#fff",
		pointHoverBorderColor: '#fff',
		pointHoverBackgroundColor: '#fff',
		label: label,
		data: data,
		formatAsFloat: formatAsFloat,
		tooltipsTitles: tooltipsTitles
	};

	if (is_primary) {
		dataset.borderColor = "#fff";
	} else {
		dataset.borderColor = "#fed558";
		dataset.pointBorderColor = "#fed558";
		dataset.pointHoverBorderColor = '#fed558';
		dataset.pointHoverBackgroundColor = '#fed558';
		dataset.backgroundColor = "rgba(253,169,81,0.1)";
	}

	return dataset;

}


var SummaryView = Marionette.View.extend({
	template: require('../../templates/dashboard/graph.summary.html'),
	className: 'dashboard-stats',
	tagName: 'div',

	behaviors: [TooltipBehavior],

	ui: {
		'selectSales': '[data-role="select-sales"]',
		'selectVisitors': '[data-role="select-visitors"]',
		'selectPageviews': '[data-role="select-pageviews"]',
		'selectOrders': '[data-role="select-orders"]',
		'selectCart': '[data-role="select-cart"]'
	},

	events: {
		'click @ui.selectSales': 'onSalesSelect',
		'click @ui.selectVisitors': 'onVisitorsSelect',
		'click @ui.selectPageviews': 'onPageviewsSelect',
		'click @ui.selectOrders': 'onOrdersSelect',
		'click @ui.selectCart': 'onCartSelect'
	},

	current: 'visitors', // visitors, pageviews

	reportData: null,

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'current', 'live', 'report']);

		this.reportData = {
			visitors: '-',
			pageviews: '-',
			orders: '-',
			sales: '-',
			cart: '-',
			live: ''
		};

		this.listenTo(this.model, 'sync', this.render);
		this.listenTo(this.live, 'sync', function() {
			this.reportData.live = this.live.get('visitors');

			this.render();
		}.bind(this));
		this.listenTo(this.report, 'report', function(data) {
			this.reportData.visitors = data.summary.visits.count !== null ? data.summary.visits.count : '-';
			this.reportData.pageviews = data.summary.visits.pageviews !== null ? data.summary.visits.pageviews : '-';
			this.reportData.orders = data.summary.orders && data.summary.orders.count !== null ? data.summary.orders.count : '-';
			this.reportData.sales = data.summary.orders && data.summary.orders.total !== null ? data.summary.orders.total : '-';
			this.reportData.cart = data.summary.orders && data.summary.orders.cart !== null ? data.summary.orders.cart : '-';
			this.reportData.currency = data.summary.orders && data.summary.orders.currency !== null ? data.summary.orders.currency : '';

			this.render();
		}.bind(this));
		this.interval = null;
	},

	templateContext: function() {

		return {
			current: this.current,
			live: this.reportData.live,

			visitors: this.reportData.visitors !== '-' ? format.formatFloat(this.reportData.visitors, 0, ' ') : '-',
			pageviews: this.reportData.pageviews !== '-' ? format.formatFloat(this.reportData.pageviews, 0, ' ') : '-',

			sales: this.reportData.orders !== '-' ? format.formatFloat(this.reportData.sales, 2, ' ') + format.currencyEntity(this.reportData.currency) : '-',
			orders: this.reportData.orders !== '-' ? format.formatFloat(this.reportData.orders, 0, ' ') : '-',
			cart_mean: this.reportData.orders > 0 ? format.formatFloat(this.reportData.sales / this.reportData.orders, 2, ' ') + format.currencyEntity(this.reportData.currency) : '-'
		};
	},

	onAttach: function() {
		this.live.fetch(); // now
		this.interval = setInterval(function() {
			this.live.fetch();
		}.bind(this), 30000); // 30 seconds
	},

	onDestroy: function() {
		clearInterval(this.interval);
	},

	onSalesSelect: function() {
		this.current = 'sales';
		this.trigger('select:stat', this.current);
		this.getUI('selectSales').addClass('active');
		this.getUI('selectVisitors').removeClass('active');
		this.getUI('selectPageviews').removeClass('active');
		this.getUI('selectOrders').removeClass('active');
		this.getUI('selectCart').removeClass('active');
	},

	onVisitorsSelect: function() {
		this.current = 'visitors';
		this.trigger('select:stat', this.current);
		this.getUI('selectSales').removeClass('active');
		this.getUI('selectVisitors').addClass('active');
		this.getUI('selectPageviews').removeClass('active');
		this.getUI('selectOrders').removeClass('active');
		this.getUI('selectCart').removeClass('active');
	},

	onPageviewsSelect: function() {
		this.current = 'pageviews';
		this.trigger('select:stat', this.current);
		this.getUI('selectSales').removeClass('active');
		this.getUI('selectVisitors').removeClass('active');
		this.getUI('selectPageviews').addClass('active');
		this.getUI('selectOrders').removeClass('active');
		this.getUI('selectCart').removeClass('active');
	},

	onOrdersSelect: function() {
		this.current = 'orders';
		this.trigger('select:stat', this.current);
		this.getUI('selectSales').removeClass('active');
		this.getUI('selectVisitors').removeClass('active');
		this.getUI('selectPageviews').removeClass('active');
		this.getUI('selectOrders').addClass('active');
		this.getUI('selectCart').removeClass('active');
	},

	onCartSelect: function() {
		this.current = 'cart';
		this.trigger('select:stat', this.current);
		this.getUI('selectSales').removeClass('active');
		this.getUI('selectVisitors').removeClass('active');
		this.getUI('selectPageviews').removeClass('active');
		this.getUI('selectOrders').removeClass('active');
		this.getUI('selectCart').addClass('active');
	}

});

var ChartView = Marionette.View.extend({
	template: _.template('<iframe class="chartjs-hidden-iframe" style="display: block; overflow: hidden; border: 0px none; margin: 0px; top: 0px; left: 0px; bottom: 0px; right: 0px; height: 100%; width: 100%; position: absolute; pointer-events: none; z-index: -1;" tabindex="-1"></iframe>' +
		'<canvas data-role="chart" style="display: block; width: 100%; height: 280px;"></canvas>'),
	tagName: 'p',

	ui: {
		'chart': 'canvas[data-role="chart"]'
	},

	chart: null,

	onAttach: function() {

		Chart.defaults.global.defaultFontColor = "rgba(255, 255, 255, 0.5)";
		Chart.defaults.global.defaultFontFamily = "'Open Sans', sans-serif";
		Chart.defaults.global.tooltips.backgroundColor = "#000";
		Chart.defaults.global.tooltips.displayColors = false;
		Chart.defaults.global.tooltips.intersect = false;
		Chart.defaults.global.tooltips.titleFontFamily = "'Open Sans', sans-serif";
		Chart.defaults.global.tooltips.bodyFontFamily = "'Open Sans', sans-serif";
		Chart.defaults.global.tooltips.cornerRadius = 4;

		this.chart = new Chart(this.getUI('chart'), {
			options: {
				maintainAspectRatio: false,
				animation: {
					duration: 0
				},
				elements: {
					line: {
						borderWidth: "2"
					},
					point: {
						radius: "5",
						borderWidth: "2",
						hitRadius: "2",
						hoverRadius: "7"
					}
				},
				legend: {
					display: false
				},
				layout: {
					padding: {
						top: 10,
						right: 10,
						left: 5
					}
				},
				scales: {
					xAxes: [{
						offset: false,
						position: 'bottom',
						gridLines: {
							color: "rgba(255, 255, 255, 0.1)",
							zeroLineColor: "rgba(255, 255, 255, 0.2)"
						}

					}],
					yAxes: [{
						ticks: {
							suggestedMax: 5,
							maxTicksLimit: 5,
							min: 0
						},
						type: 'linear',
						position: 'left',
						gridLines: {
							color: "rgba(255, 255, 255, 0.1)",
							zeroLineColor: "rgba(255, 255, 255, 0.2)"
						}

					}]

				},
				tooltips: {
					callbacks: {
						title: function(tooltipItems, data) {

							if (tooltipItems[0].datasetIndex == 1 && tooltipItems[0].index < data.datasets[1].tooltipsTitles.length) {
								return data.datasets[1].tooltipsTitles[tooltipItems[0].index];
							}

							return tooltipItems[0].xLabel; // default
						},
						label: function(tooltipItem, data) {
							var formatAsFloat = data.datasets[0].formatAsFloat;
							return data.datasets[0].label + ' : ' + format.formatFloat(tooltipItem.value, formatAsFloat ? 2 : 0, ' ');
						}
					}
				}
			}
		});
	},

	updateChart: function(labels, datasets) {

		this.chart.data = {
			labels: labels,
			datasets: datasets
		};
		this.chart.options.scales.xAxes[0].offset = (datasets[0].data.length == 1);

		this.chart.update();
	},

	onBeforeDetach: function() {
		this.chart.destroy();
	}

});


module.exports = Marionette.View.extend({
	template: require('../../templates/dashboard/graph.html'),
	className: 'post-article dashboard-graph',
	tagName: 'article',

	regions: {
		summary: {
			el: "[data-role='summary']",
			replaceElement: true
		},
		chart: {
			el: "[data-role='chart']",
			replaceElement: true
		}
	},

	ui: {
		'endDate': "input[name='end_date']",
		'startDate': "input[name='start_date']",
		'compareDate': "input[name='compare_date']",
		'compareShort': "button[data-role='compare']"
	},

	events: {
		'click a[data-role="stats"]': function() {
			window.open(Session.autologBackLink('/awstats/'));
		},
		'click @ui.compareShort': function(event) {

			switch (Backbone.$(event.currentTarget).data('delta')) {
				case 'days':
					this.startDate = this.endDate.clone();
					break;
				case 'weeks':
					this.startDate = this.endDate.clone().add(-6, 'days');
					break;
				case 'months':
					this.startDate = this.endDate.clone().add(-30, 'days');
					break;
			}
			this.getUI('startDate').val(this.startDate.format('DD/MM/YYYY'));

			var compareDate = this.startDate.clone().add(-1, Backbone.$(event.currentTarget).data('delta'));
			this.getUI('compareDate').val(compareDate.format('DD/MM/YYYY'));
			this.onFieldChange({
				name: 'compare_date',
				date: compareDate
			});

		}
	},

	behaviors: [SelectifyBehavior, Datepicker, TooltipBehavior],

	stat: null,

	startDate: null,
	endDate: null,
	compareDate: null,
	datas: null,
	extra_fields: null,

	initialize: function(options) {
		this.mergeOptions(options, ['report', 'stat', 'live', 'stats', 'extra_fields']);

		// Must wait because this module is loaded BEFORE session start
		Session = Backbone.Radio.channel('app').request('ctx:session');

		this.startDate = moment().add(-31, 'days');
		this.endDate = moment().add(-1, 'days');
		this.compareDate = null;
		this.datas = null;
	},

	templateContext: function() {

		var Session = Backbone.Radio.channel('app').request('ctx:session');

		return {
			startDate: this.startDate.format('DD/MM/YYYY'),
			endDate: this.endDate.format('DD/MM/YYYY')
		};
	},

	onRender: function() {

		this.showChildView('summary', new SummaryView({
			model: this.stats,
			current: this.stat,
			report: this.report,
			live: this.live
		}));

		this.showChildView('chart', new ChartView({
			report: this.report
		}));
	},

	onLoadDatepicker: function($datepickers) {
		$datepickers.each(function(i, el) {

			var $el = Backbone.$(el);
			$el.data('DateTimePicker')
				.showTodayButton(false)
				.minDate(moment("2019-09-06")); // no reliable data before this date

			if (el.name == 'start_date') {
				$el.data('DateTimePicker').maxDate(moment().add(-1, 'days'));
			} else if (el.name == 'end_date') {
				$el.data('DateTimePicker').maxDate(moment().add(-1, 'days'));
			} else if (el.name == 'compare_date') {
				$el.data('DateTimePicker').useCurrent(false).maxDate(moment().add(-1, 'days'));
			}
		});
	},

	onChildviewSelectStat: function(stat) {
		if (stat == this.stat) return;
		this.stat = stat;

		this.onDataUpdate();
	},

	fetch: function() {

		var promise;

		var data = {
			'extra_fields': this.extra_fields //'funnel,orders,visits,referer,search,products,origins'
		};

		if (!this.compareDate) { // startDate & endDate optional

			if (this.startDate) data.start_date = this.startDate.format('DD/MM/YYYY');
			if (this.endDate) data.end_date = this.endDate.format('DD/MM/YYYY');

			data.extra_fields += ',trends';

			promise = this.report.fetch({
				data: data,
				reset: true
			}).done(function() {
				this.report.trigger('report', this.report.toJSON());
				this.datas = [this.report.get('days')];
				this.onDataUpdate();
			}.bind(this));

		} else if (this.startDate && this.compareDate) {

			var diff = this.endDate ? this.endDate.diff(this.startDate, 'days') : 30;

			promise = this.report.compare(this.startDate, this.compareDate, diff, data).done(function(data) {
				this.report.trigger('report', data);
				this.datas = data.days;
				this.onDataUpdate();
			}.bind(this));
		}

		promise.fail(function(error, meta) {

			if (meta.status_code == 404) {
				// TODO : stats not yet available
				return;
			}

			var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
			navigationController.showErrorModal(error);
		});

		return promise;
	},

	onDataUpdate: function() {

		var tooltipstitle;
		var formatAsFloat = false;
		if (this.stat == 'sales') {
			tooltipstitle = 'Ventes';
			formatAsFloat = true;
		} else if (this.stat == 'visitors') {
			tooltipstitle = 'Visiteurs';
		} else if (this.stat == 'orders') {
			tooltipstitle = 'Commandes';
		} else if (this.stat == 'cart') {
			tooltipstitle = 'Panier moyen';
			formatAsFloat = true;
		} else {
			tooltipstitle = 'Pages vues';
		}

		var labels = [];
		var datasets = [
			[]
		];
		_.each(this.datas[0], function(day) {
			labels.push(moment(day.date, 'YYYY-MM-DD').format('DD/MM'));
			if (this.stat == 'visitors') {
				datasets[0].push(day.visits ? day.visits.count : null);
			} else if (this.stat == 'sales') {
				datasets[0].push(day.orders ? day.orders.total : null);
			} else if (this.stat == 'orders') {
				datasets[0].push(day.orders ? day.orders.count : null);
			} else if (this.stat == 'cart') {
				datasets[0].push(day.orders ? day.orders.cart_mean : null);
			} else {
				datasets[0].push(day.visits ? day.visits.pageviews : null);
			}

		}.bind(this));
		datasets[0] = skinDataset(datasets[0], tooltipstitle, true, formatAsFloat, null);

		if (this.datas.length == 2) {
			datasets[1] = [];
			var tooltipsTitles = [];
			_.each(this.datas[1], function(day) {
				tooltipsTitles.push(moment(day.date, 'YYYY-MM-DD').format('DD/MM'));
				if (this.stat == 'visitors') {
					datasets[1].push(day.visits ? day.visits.count : null);
				} else if (this.stat == 'sales') {
					datasets[1].push(day.orders ? day.orders.total : null);
				} else if (this.stat == 'orders') {
					datasets[1].push(day.orders ? day.orders.count : null);
				} else if (this.stat == 'cart') {
					datasets[1].push(day.orders ? day.orders.cart_mean : null);
				} else {
					datasets[1].push(day.visits ? day.visits.pageviews : null);
				}
			}.bind(this));
			datasets[1] = skinDataset(datasets[1], tooltipstitle, false, formatAsFloat, tooltipsTitles);
		}

		this.getChildView('chart').updateChart(labels, datasets);
	},

	onFieldChange: function(field) {
		if (!field.name) return;

		if (field.name == 'start_date') {
			if (!field.date) {
				this.startDate = null;
				return;
			}

			// On start date modification
			// => update end date automatical if end date is not in a 30 day interval
			if (field.date.isSame(this.startDate, 'day')) return;
			this.startDate = field.date;

			var diff = this.endDate ? this.endDate.diff(this.startDate, 'days') : -1;
			if (diff > 30 || diff < 0) {
				var end = this.startDate.clone().add(30, 'days');
				var hier = moment().add(-1, 'days');
				this.endDate = hier.diff(end, 'days') >= 0 ? end : hier;
				this.getUI('endDate').val(this.endDate.format('DD/MM/YYYY'));
			}
		} else if (field.name == 'end_date') {
			if (!field.date) {
				this.endDate = null;
				return;
			}

			if (field.date.isSame(this.endDate, 'day')) return;
			this.endDate = field.date;

			var diff = this.startDate ? this.endDate.diff(this.startDate, 'days') : -1;
			if (diff > 30 || diff < 0) {
				this.startDate = this.endDate.clone().subtract(30, 'days');
				this.getUI('startDate').val(this.startDate.format('DD/MM/YYYY'));
			}

		} else if (field.name == 'compare_date') {
			if (this.compareDate && field.date && field.date.isSame(this.compareDate, 'day')) return;

			if (!field.date) {
				this.compareDate = null;
			} else {
				if (this.startDate.isSame(field.date, 'day')) {
					return;
				}
				this.compareDate = field.date;
			}
		}

		if (this.startDate) {
			this.fetch();
		}
	}

});
