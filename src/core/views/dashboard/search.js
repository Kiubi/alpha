var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');
var format = require('kiubi/utils/format.js');

var Paginate = require('kiubi/core/models/graphs');

function mapSearch(top) {
	if (!top) return [];

	return _.reduce(top, function(acc, word) {

		if (acc.length >= 5) return acc; // Top 5 only

		acc.push({
			'position': word.position,
			'name': word.word,
			'count': word.count
		});

		return acc;
	}, []);
}


module.exports = Marionette.View.extend({
	template: require('../../templates/dashboard/search.html'),

	attributes: function() {
		return {
			class: 'col-12 col-lg-' + this.model.get('size') + ' order-lg-' + this.model.get('order')
		};
	},

	ui: {
		'next': '[data-role="next"]',
		'previous': '[data-role="previous"]'
	},

	events: {
		'click @ui.next': function() {

			var next = this.isPaging ? this.paginate.meta.next_search_top : this.report.meta.next_search_top;

			if (next) {
				this.paginate.fetch({
					url: next
				});
			}

		},
		'click @ui.previous': function() {

			var previous = this.isPaging ? this.paginate.meta.previous_search_top : this.report.meta.previous_search_top;

			if (previous) {
				this.paginate.fetch({
					url: previous
				});
			}
		}
	},

	paginate: null,
	isPaging: null,
	hasNext: null,
	hasPrevious: null,

	initialize: function(options) {

		this.mergeOptions(options, ['report']);

		this.isPaging = false;
		this.hasNext = false;
		this.hasPrevious = false;
		this.paginate = new Paginate();

		this.listenTo(this.report, 'report', this.onReport);
		this.listenTo(this.paginate, 'sync', this.onPaginate);
	},

	onReport: function() {

		this.isPaging = false;

		this.hasNext = (this.report.meta.next_search_top && this.report.meta.next_search_top != false);
		this.hasPrevious = (this.report.meta.previous_search_top && this.report.meta.previous_search_top != false);

		this.render();
	},

	onPaginate: function() {

		this.isPaging = true;

		this.hasNext = (this.paginate.meta.next_search_top && this.paginate.meta.next_search_top != false);
		this.hasPrevious = (this.paginate.meta.previous_search_top && this.paginate.meta.previous_search_top != false);

		this.render();
	},

	templateContext: function() {

		return {
			has_next: this.hasNext,
			has_previous: this.hasPrevious,
			list: mapSearch(this.isPaging ? this.paginate.get('top').search : this.report.get('top').search),
			formatPrct: function(number) {
				return format.formatFloat(number, 2, '');
			},
			formatNumber: function(number) {
				return format.formatFloat(number, 0, ' ');
			}
		};
	}

});
