var Backbone = require('backbone');
var _ = require('underscore');

module.exports = Backbone.Model.extend({
	urlRoot: 'sites/@site/account/groups',
	idAttribute: 'group_id',
	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			if (_.isNumber(response.data)) {
				return {
					group_id: response.data
				};
			}
			return response.data;
		}
		return response;
	},

	defaults: {
		group_id: null,
		name: '',
		customer_count: 0,
		is_enabled: false,
		target_type: '',
		target_page: '',
		target_key: ''
	}

});
