var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

	url: 'sites/@site/prefs/checkout',

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
		is_enabled: false,
		order_prefix: 'C',
		stockout_selling: false,
		stockout_threshold: 0,
		decrement_stock: 'at_payment',
		mail_pending: '',
		mail_processing: '',
		mail_processed: '',
		mail_shipped: '',
		mail_cancelled: ''
	}

});
