var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = CollectionUtils.KiubiModel.extend({

	customer_id: null,

	url: function() {
		return 'sites/@site/account/customers/' + this.customer_id + '/discounts';
	},

	isNew: function() {
		return false;
	},

	defaults: {
		discount: null,
		group_discount: null,
		categories: []
	}

});
