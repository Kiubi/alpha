var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

	url: 'sites/@site/prefs/fidelity',

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
		gain_rate: 0,
		reward_first_order: 0,
		reward_subscriber: 0,
		is_creation_enabled: false,
		creation_cost: 0,
		voucher_mail_subject: '',
		voucher_value: 0,
		voucher_validity: 0,
		voucher_threshold: 0,
		is_voucher_restricted: false
	}

});
