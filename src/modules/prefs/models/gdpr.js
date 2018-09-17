var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

	url: 'sites/@site/prefs/gdpr',

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
		is_customers_consent_required: false,
		is_comments_consent_required: false,
		is_evaluations_consent_required: false,
		is_newsletter_consent_required: false,
		is_checkout_consent_required: false
	}

});
