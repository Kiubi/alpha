var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');
var Chart = require('chart.js');
var format = require('kiubi/utils/format.js');
var moment = require('moment');

var TooltipBehavior = require('kiubi/behaviors/tooltip');
var SelectifyBehavior = require('kiubi/behaviors/selectify.js');
var Session; // Must wait because this model is loaded BEFORE session start
var Datepicker = require('kiubi/behaviors/datepicker.js');

var ListView = require('kiubi/core/views/ui/list.js');
var RowView = Marionette.View.extend({
	template: require('../templates/dashboard.row.html'),
	className: 'list-item',

	behaviors: [TooltipBehavior],

	templateContext: function() {
		return {
			creation_date: format.formatLongDateTime(this.model.get('creation_date')),
			creation_date_fromnow: moment(this.model.get('creation_date'), 'YYYY-MM-DD HH:mm:ss').fromNow(),
			convertMediaPath: Session.convertMediaPath.bind(Session)
		};
	}
});

var SummaryView = Marionette.View.extend({
	template: require('../templates/dashboard.summary.html'),
	className: 'post-article post-acticle-empty dashboard-stats',
	tagName: 'article',

	behaviors: [TooltipBehavior],

	ui: {
		'selectSales': '[data-role="select-sales"]',
		'selectVisitors': '[data-role="select-visitors"]',
		'selectPageviews': '[data-role="select-pageviews"]'
	},

	events: {
		'click @ui.selectSales': 'onSalesSelect',
		'click @ui.selectVisitors': 'onVisitorsSelect',
		'click @ui.selectPageviews': 'onPageviewsSelect'
	},

	current: 'visitors', // visitors, pageviews

	reportData: null,

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'current', 'live', 'report']);

		this.reportData = {
			visitors: '-',
			pageviews: '-',
			sales: '-',
			live: ''
		};

		this.listenTo(this.model, 'sync', this.render);
		this.listenTo(this.live, 'sync', function() {
			this.reportData.live = this.live.get('visitors');

			this.render();
		}.bind(this));
		this.listenTo(this.report, 'report', function(data) {
			this.reportData.visitors = data.visitors;
			this.reportData.pageviews = data.pageviews;
			this.reportData.sales = data.sales_label ? data.sales_label : '-';

			this.render();
		}.bind(this));
		this.interval = null;
	},

	onAttach: function() {
		this.live.fetch(); // now
		this.interval = setInterval(function() {
			this.live.fetch();
		}.bind(this), 15000); // 15 seconds
	},

	onDestroy: function() {
		clearInterval(this.interval);
	},

	templateContext: function() {
		return {
			current: this.current,
			live: this.reportData.live,

			visitors: this.reportData.visitors,
			pageviews: this.reportData.pageviews,
			sales: this.reportData.sales,

			average_cart_label: this.model.get('checkout') ? this.model.get('checkout').average_cart_label : '-',
			monthly_transformation_label: this.model.get('checkout') ? this.model.get('checkout').monthly_transformation_label :
				'-',
		};
	},

	onSalesSelect: function() {
		this.current = 'sales';
		this.trigger('select:stat', this.current);
		this.getUI('selectSales').addClass('active');
		this.getUI('selectVisitors').removeClass('active');
		this.getUI('selectPageviews').removeClass('active');
	},

	onVisitorsSelect: function() {
		this.current = 'visitors';
		this.trigger('select:stat', this.current);
		this.getUI('selectSales').removeClass('active');
		this.getUI('selectVisitors').addClass('active');
		this.getUI('selectPageviews').removeClass('active');
	},

	onPageviewsSelect: function() {
		this.current = 'pageviews';
		this.trigger('select:stat', this.current);
		this.getUI('selectSales').removeClass('active');
		this.getUI('selectVisitors').removeClass('active');
		this.getUI('selectPageviews').addClass('active');
	}

});

function getGraphTitle(stat) {
	if (stat == 'sales') {
		return 'Chiffre d\'affaires sur la période sélectionnée';
	} else if (stat == 'visitors') {
		return 'Visiteurs sur la période sélectionnée';
	}
	return 'Pages vues sur la période sélectionnée';
}

var GraphView = Marionette.View.extend({
	template: require('../templates/dashboard.graph.html'),
	className: 'post-article dashboard-graph',
	tagName: 'article',

	ui: {
		'chart': 'canvas[data-role="chart"]',
		'title': '[data-role="title"]',
		'endDate': "input[name='end_date']",
		'startDate': "input[name='start_date']"
	},

	behaviors: [SelectifyBehavior, Datepicker, TooltipBehavior],

	chart: null,

	stat: null,

	startDate: null,
	endDate: null,
	compareDate: null,

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'stat']);

		this.startDate = moment().add(-31, 'days');
		this.endDate = moment().add(-1, 'days');
		this.compareDate = null;
	},

	templateContext: function() {

		var Session = Backbone.Radio.channel('app').request('ctx:session');

		return {
			title: getGraphTitle(this.stat),
			startDate: this.startDate.format('DD/MM/YYYY'),
			endDate: this.endDate.format('DD/MM/YYYY'),
			stats_url: 'https://' + Session.site.get('backoffice') + '/awstats/'
		};
	},

	changeStat: function(stat) {
		if (stat == this.stat) return;
		this.stat = stat;

		this.getUI('title').text(getGraphTitle(this.stat));
		this.fetch();
	},

	fetch: function() {

		var promise;

		if (!this.compareDate) { // startDate & endDate optional

			var data = {};
			if (this.startDate) data.start_date = this.startDate.format('DD/MM/YYYY');
			if (this.endDate) data.end_date = this.endDate.format('DD/MM/YYYY');

			promise = this.model.fetch({
				data: data,
				reset: true
			}).done(function() {
				this.model.trigger('report', this.model.toJSON());
				this.onDataUpdate([this.model.get('days')]);
			}.bind(this));

		} else if (this.startDate && this.compareDate) {

			var diff = this.endDate ? this.endDate.diff(this.startDate, 'days') : 30;

			promise = this.model.compare(this.startDate, this.compareDate, diff).done(function(data) {
				this.model.trigger('report', data[0]);
				this.onDataUpdate([data[0].days, data[1].days]);
			}.bind(this));
		}

		promise.fail(function(xhr) {
			var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
			navigationController.showErrorModal(xhr);
		});

		return promise;
	},

	onLoadDatepicker: function($datepickers) {
		$datepickers.each(function(i, el) {

			var $el = Backbone.$(el);
			$el.data('DateTimePicker').showTodayButton(false);

			if (el.name == 'start_date') {
				$el.data('DateTimePicker').maxDate(moment().add(-1, 'days'));
			} else if (el.name == 'end_date') {
				$el.data('DateTimePicker').maxDate(moment().add(-1, 'days'));
			} else if (el.name == 'compare_date') {
				$el.data('DateTimePicker').useCurrent(false)
					.maxDate(moment().add(-1, 'days'));
			}
		});
	},

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
		Chart.defaults.global.tooltips.titleFontFamily = "'Open Sans', sans-serif";
		Chart.defaults.global.tooltips.bodyFontFamily = "'Open Sans', sans-serif";
		Chart.defaults.global.tooltips.cornerRadius = 4;

		this.chart = new Chart(this.getUI('chart'), {
			options: {
				layout: {
					padding: {
						top: 10,
						right: 10,
						left: 5
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
						ticks: {
							suggestedMax: 5,
							maxTicksLimit: 5,
							min: 0
						},
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

	onDataUpdate: function(sets) {

		var tooltipstitle;
		if (this.stat == 'sales') {
			tooltipstitle = 'Ventes';
		} else if (this.stat == 'visitors') {
			tooltipstitle = 'Visiteurs';
		} else {
			tooltipstitle = 'Pages vues';
		}

		var labels = [];
		var datasets = [
			[]
		];
		_.each(sets[0], function(day) {
			labels.push(moment(day.date, 'YYYY-MM-DD').format('DD/MM'));
			if (this.stat == 'visitors') {
				datasets[0].push(day.visitors !== null ? day.visitors : null);
			} else if (this.stat == 'sales') {
				datasets[0].push(day.sales !== null ? day.sales : null);
			} else {
				datasets[0].push(day.pageviews !== null ? day.pageviews : null);
			}

		}.bind(this));
		datasets[0] = this.skinDataset(datasets[0], tooltipstitle, true);

		if (sets.length == 2) {
			datasets[1] = [];
			_.each(sets[1], function(day) {
				if (this.stat == 'visitors') {
					datasets[1].push(day.visitors !== null ? day.visitors : null);
				} else if (this.stat == 'sales') {
					datasets[1].push(day.sales !== null ? day.sales : null);
				} else {
					datasets[1].push(day.pageviews !== null ? day.pageviews : null);
				}
			}.bind(this));
			datasets[1] = this.skinDataset(datasets[1], tooltipstitle, false);
		}

		this.updateChart(labels, datasets);
	},

	updateChart: function(labels, datasets) {

		this.chart.data = {
			labels: labels,
			datasets: datasets
		};

		this.chart.update();
	},

	skinDataset: function(data, label, is_primary) {

		var dataset = {
			type: 'line',
			borderColor: "",
			backgroundColor: "",
			pointBackgroundColor: "",
			pointBorderColor: "#fff",
			pointHoverBorderColor: '',
			pointHoverBackgroundColor: '#fff',
			label: label,
			data: data
		};

		if (is_primary) {
			dataset.borderColor = "#337ab7";
			dataset.backgroundColor = "rgba(51,122,183,0.1)";
			dataset.pointBackgroundColor = "#337ab7";
			dataset.pointHoverBorderColor = '#373737';

		} else {
			dataset.borderColor = "#c4b1c4";
			dataset.backgroundColor = "rgba(196,177,196,0.1)";
			dataset.pointBackgroundColor = "#c4b1c4";
			dataset.pointHoverBorderColor = '#373737';
		}

		return dataset;

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
	},

	onBeforeDetach: function() {
		this.chart.destroy();
	}

});

module.exports = Marionette.View.extend({
	template: require('../templates/dashboard.html'),
	pageTitle: 'Tableau de bord',

	regions: {
		summary: {
			el: "article[data-role='summary']",
			replaceElement: true
		},
		graph: {
			el: "article[data-role='graph']",
			replaceElement: true
		},
		list: {
			el: "article[data-role='list']",
			replaceElement: true
		}
	},

	initialize: function(options) {
		this.mergeOptions(options, ['stats', 'activity', 'report', 'live']);

		// Must wait because this module is loaded BEFORE session start
		Session = Backbone.Radio.channel('app').request('ctx:session');

		this.live.fetch();
	},

	onRender: function() {

		var stat = 'visitors';
		this.showChildView('summary', new SummaryView({
			model: this.stats,
			current: stat,
			report: this.report,
			live: this.live
		}));
		this.stats.clear().set(this.stats.defaults); // RAZ stats when changing site
		this.stats.fetch();

		var view = new GraphView({
			model: this.report,
			stat: stat
		});
		this.showChildView('graph', view);
		view.fetch();

		this.showChildView('list', new ListView({
			collection: this.activity,
			rowView: RowView,
			extraClassname: 'dashboard-activity',
			extraListClassname: 'no-hover',

			title: 'Activités récentes'
			/*
			filters: [{
				extraClassname: 'select-category',
				title: 'Toutes les catégories',
				collectionPromise: this.getOption('categories').promisedSelect(this.collection.category_id)
			}]*/
		}));
		this.activity.fetch({
			reset: true
		});
	},

	onChildviewSelectStat: function(stat) {
		this.getChildView('graph').changeStat(stat);
	}

});
