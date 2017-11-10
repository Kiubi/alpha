var Backbone = require('backbone');
var _ = require('underscore');

module.exports = Backbone.Model.extend({
	urlRoot: 'sites/@site/cms/menus',
	idAttribute: 'menu_id',
	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			if (_.isNumber(response.data)) {
				return {
					menu_id: response.data
				};
			}
			return response.data;
		}
		return response;
	},

	defaults: {
		menu_id: null,
		name: '',
		is_main: false,
		api_key: '',
		pages: []
	}

});
