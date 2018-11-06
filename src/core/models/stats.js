var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

	url: 'sites/@site/stats',

	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			return response.data;
		}
		return response;
	},

	isNew: function() {
		return false;
	},

	defaults: {

		forms: {
			unread_responses: 0
		},

		catalog: {
			stock_shortage_count: 0
		},

		checkout: {
			"pending_orders": 0,
			"pending_orders_amount": 0,
			"pending_orders_amount_label": 0,
			"average_cart": 0,
			"average_cart_label": "-",
			"monthly_transformation": 0,
			"monthly_transformation_label": "-"
		}
	}

});
