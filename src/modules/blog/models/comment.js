var Backbone = require('backbone');
var _ = require('underscore');

module.exports = Backbone.Model.extend({
	urlRoot: 'sites/@site/blog/comments',
	idAttribute: 'comment_id',
	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			if (_.isNumber(response.data)) {
				return {
					comment_id: response.data
				};
			}
			return response.data;
		}
		return response;
	},

	defaults: {
		comment_id: null,
		date: '',
		comment: '',
		origin: '',
		is_visible: false,
		author: '',
		email: '',
		post_id: 0,
		post_title: '',
		customer_id: null,
		avatar_url: '',
		avatar_thumb_url: '',
		ip: '',
		reverse_host: ''
	}

});
