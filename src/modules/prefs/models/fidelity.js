var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = CollectionUtils.KiubiModel.extend({

	url: 'sites/@site/prefs/fidelity',

	meta: {},

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
