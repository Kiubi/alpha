var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = CollectionUtils.KiubiModel.extend({

	url: 'sites/@site/prefs/gdpr',

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
