var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = CollectionUtils.KiubiModel.extend({

	group_id: null,

	url: function() {
		return 'sites/@site/account/groups/' + this.group_id + '/discounts';
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
