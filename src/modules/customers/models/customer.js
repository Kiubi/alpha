var Backbone = require('backbone');
var _ = require('underscore');

module.exports = Backbone.Model.extend({
	urlRoot: 'sites/@site/account/customers',
	idAttribute: 'customer_id',

	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			if (_.isNumber(response.data)) {
				return {
					customer_id: response.data
				};
			}
			return response.data;
		}
		return response;
	},

	defaults: {
		customer_id: null,
		is_enabled: false,
		number: '',
		firstname: '',
		lastname: "",
		gender: "",
		email: "",
		password: "",
		group_id: 0,
		website: "",
		nickname: "",
		avatar_url: '',
		avatar_thumb_url: '',
		/*creation_date": "string",
		creation_date_f": "string",
		creation_date_timestamp": "integer",*/
		is_in_mailinglist: false,
		order_count: 0,
		order_revenues: 0,
		order_revenues_label: ''
	}

});
