var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = CollectionUtils.KiubiModel.extend({

	url: 'sites/@site/prefs/checkout',

	meta: null,

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
