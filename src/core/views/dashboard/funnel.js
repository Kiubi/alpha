var Marionette = require('backbone.marionette');
var _ = require('underscore');

var format = require('kiubi/utils/format.js');
var TooltipBehavior = require('kiubi/behaviors/tooltip');

module.exports = Marionette.View.extend({
	template: require('../../templates/dashboard/funnel.html'),

	attributes: function() {
		return {
			class: 'col-12 col-lg-' + this.model.get('size') + ' order-lg-' + this.model.get('order') + ' d-flex'
		};
	},

	behaviors: [TooltipBehavior],


	initialize: function(options) {

		this.mergeOptions(options, ['report']);

		this.listenTo(this.report, 'report', this.render);

	},

	templateContext: function() {

		var total = 0;
		var funnel = null;
		var hasData = false;
		if (this.report.get('summary') && this.report.get('summary').funnel) {
			total = this.report.get('summary').visits.count;
			funnel = this.report.get('summary').funnel;
			hasData = this.report.get('summary').visits != null && funnel.cart != null;
		}

		return {
			hasData: hasData,
			funnel: funnel,
			conversion: {
				cart: funnel && total > 0 ? format.formatFloat((funnel.cart / total) * 100) + '%' : '-',
				checkout: funnel && total > 0 ? format.formatFloat((funnel.checkout / total) * 100) + '%' : '-',
				pending: funnel && total > 0 ? format.formatFloat((funnel.pending / total) * 100) + '%' : '-',

				cart_trends: funnel ? funnel.conversion_cart_trends * 100 : '-', // in points
				checkout_trends: funnel ? funnel.conversion_checkout_trends * 100 : '-', // in points
				pending_trends: funnel ? funnel.conversion_pending_trends * 100 : '-', // in points

				step_checkout: funnel && funnel.cart > 0 ? ((funnel.checkout / funnel.cart) * 100) + '%' : '-', // cart => checkout
				step_pending: funnel && funnel.cart > 0 ? ((funnel.pending / funnel.cart) * 100) + '%' : '-' // cart => pending
			},
			plural: format.plural,
			formatNumber: function(number, dec) {
				return format.formatFloat(number, dec, ' ');
			}
		};
	}

});
