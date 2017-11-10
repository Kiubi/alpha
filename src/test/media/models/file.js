var Backbone = require('backbone');
var _ = require('underscore');

module.exports = Backbone.Model.extend({
	urlRoot: 'sites/@site/media/files',
	idAttribute: 'media_id',

	previewLink: null,

	parse: function(response) {
		if (response.data) {
			if (_.isNumber(response.data)) {
				return {
					media_id: response.data
				};
			}

			return response.data;
		}
		return response;
	},

	defaults: {
		media_id: null,
		name: '',
		folder_id: 0,
		description: '',
		original_name: '',
		type: '',
		ext: '',
		mime: '',
		weight: '',
		width: '',
		height: '',
		creation_date: '',
		modification_date: '',
		thumb: []
	}

});
