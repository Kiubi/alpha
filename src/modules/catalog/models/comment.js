var Backbone = require('backbone');
var _ = require('underscore');

module.exports = Backbone.Model.extend({
	urlRoot: 'sites/@site/catalog/comments',
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
		is_visible: false,
		date: '',
		comment: '',
		origin: '',
		author: '',
		ip: '',
		rate: null,
		reverse_host: '',
		product_id: null,
		product_name: '',
		customer_id: null,
		customer_name: '',
		customer_email: '',
		customer_nickname: '',
		avatar_url: '',
		avatar_thumb_url: ''
	}

});
