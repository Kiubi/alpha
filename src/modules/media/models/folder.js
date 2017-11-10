var Backbone = require('backbone');
var _ = require('underscore');

module.exports = Backbone.Model.extend({
	urlRoot: 'sites/@site/media/folders',
	idAttribute: 'folder_id',
	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			if (_.isNumber(response.data)) {
				return {
					folder_id: response.data
				};
			}
			return response.data;
		}
		return response;
	},

	defaults: {
		folder_id: null,
		name: '',
		folder_key: '',
		parent_folder_id: 0,
		is_bookmarked: false,
		has_restrictions: false
	}

});
