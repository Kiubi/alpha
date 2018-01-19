var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

	group_id: null,

	url: function() {
		return 'sites/@site/account/groups/' + this.group_id + '/discounts';
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
