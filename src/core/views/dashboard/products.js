var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');
var format = require('kiubi/utils/format.js');

const tabShow = 1;
const tabSold = 2;

var Paginate = require('kiubi/core/models/graphs');

function mapProducts(top) {
	if (!top) return [];

	return _.reduce(top, function(acc, product) {

		if (acc.length >= 5) return acc; // Top 5 only

		acc.push({
			'href': '/catalog/products/' + product.id,
			'name': product.name,
			'count': format.formatFloat(product.count, 0, ' '),
			'position': product.position
		});

		return acc;
	}, []);
}

module.exports = Marionette.View.extend({
	template: require('../../templates/dashboard/products.html'),

	attributes: function() {
		return {
			class: 'col-12 col-lg-' + this.model.get('size') + ' order-lg-' + this.model.get('order') + ' d-flex'
		};
	},

	ui: {
		'switch': '[data-role="switch"]',
		'next': '[data-role="next"]',
		'previous': '[data-role="previous"]'
	},

	events: {
		'click @ui.switch': 'onSwitch',
		'click @ui.next': function() {

			var next;
			if (this.enabledTab == tabShow) {
				next = this.isPaging ? this.paginate.meta.next_views_top : this.report.meta.next_views_top;
			} else {
				next = this.isPaging ? this.paginate.meta.next_sales_top : this.report.meta.next_sales_top;
			}
			if (next) {
				this.paginate.fetch({
					url: next
				});
			}
		},
		'click @ui.previous': function() {

			var previous;
			if (this.enabledTab == tabShow) {
				previous = this.isPaging ? this.paginate.meta.previous_views_top : this.report.meta.previous_views_top;
			} else {
				previous = this.isPaging ? this.paginate.meta.previous_sales_top : this.report.meta.previous_sales_top;
			}
			if (previous) {
				this.paginate.fetch({
					url: previous
				});
			}
		}
	},

	enabledTab: null,
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
		this.enabledTab = tabSold;

		this.listenTo(this.report, 'report', this.onReport);
		this.listenTo(this.paginate, 'sync', this.onPaginate);
	},

	templateContext: function() {

		var list;
		if (this.report.get('top')) {
			switch (this.enabledTab) {
				case tabSold:
					list = mapProducts(this.isPaging ? this.paginate.get('top').products_sales : this.report.get('top').products_sales);
					break;
				case tabShow:
					list = mapProducts(this.isPaging ? this.paginate.get('top').products_views : this.report.get('top').products_views);
					break;
			}
		}

		return {
			enabledTab: this.enabledTab,
			tabShow: tabShow,
			tabSold: tabSold,
			has_next: this.hasNext,
			has_previous: this.hasPrevious,
			list: list
		};
	},

	onReport: function() {

		this.isPaging = false;

		if (this.enabledTab == tabShow) {
			this.hasNext = (this.report.meta.next_views_top && this.report.meta.next_views_top != false);
			this.hasPrevious = (this.report.meta.previous_views_top && this.report.meta.previous_views_top != false);
		} else {
			this.hasNext = (this.report.meta.next_sales_top && this.report.meta.next_sales_top != false); // TODO
			this.hasPrevious = (this.report.meta.previous_sales_top && this.report.meta.previous_sales_top != false);
		}

		this.render();
	},

	onPaginate: function() {

		this.isPaging = true;

		if (this.enabledTab == tabShow) {
			this.hasNext = (this.paginate.meta.next_views_top && this.paginate.meta.next_views_top != false);
			this.hasPrevious = (this.paginate.meta.previous_views_top && this.paginate.meta.previous_views_top != false);
		} else {
			this.hasNext = (this.paginate.meta.next_sales_top && this.paginate.meta.next_sales_top != false);
			this.hasPrevious = (this.paginate.meta.previous_sales_top && this.paginate.meta.previous_sales_top != false);
		}

		this.render();
	},

	onSwitch: function(event) {
		var tab = Backbone.$(event.currentTarget).data('tab');

		if (tab == this.enabledTab) return;

		this.enabledTab = tab;
		this.isPaging = false;
		this.render();
	}

});
