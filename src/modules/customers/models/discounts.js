var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

	customer_id: null,

	url: function() {
		return 'sites/@site/account/customers/' + this.customer_id + '/discounts';
	},

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
		discount: null,
		group_discount: null,
		categories: []
	}

});
