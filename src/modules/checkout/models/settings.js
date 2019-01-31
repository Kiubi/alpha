var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

	url: 'sites/@site/prefs/checkout',

	meta: null,

	parse: function(response) {
		this.meta = {};
		if ('meta' in response && response.meta.base_price) {
			this.meta = {
				'base_price': response.meta.base_price,
				'currency': response.meta.currency
			};
		}
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
		min_order_amount: 0.01,
		decrement_stock: 'at_payment',
		mail_recipients: '',
		mail_pending: '',
		mail_processing: '',
		mail_processed: '',
		mail_shipped: '',
		mail_cancelled: ''
	}

});
