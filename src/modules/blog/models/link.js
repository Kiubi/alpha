var Backbone = require('backbone');
var _ = require('underscore');

module.exports = Backbone.Model.extend({
	urlRoot: 'sites/@site/blog/links',
	idAttribute: 'link_id',
	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			if (_.isNumber(response.data)) {
				return {
					link_id: response.data
				};
			}
			return response.data;
		}
		return response;
	},

	defaults: {
		link_id: null,
		name: '',
		description: '',
		url: '',
		is_enabled: false,
		position: 0
	}

});
