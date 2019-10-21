var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = CollectionUtils.KiubiModel.extend({
	urlRoot: 'sites/@site/account/groups',
	idAttribute: 'group_id',

	defaults: {
		group_id: null,
		name: '',
		customer_count: 0,
		is_enabled: false,
		target_type: '',
		target_page: '',
		target_key: '',

		// extra_fields : target
		target_name: '',
		target_service: ''
	}

});
