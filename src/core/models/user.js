var Backbone = require('backbone');
var _ = require('underscore');

module.exports = Backbone.Model.extend({
	urlRoot: 'users',
	idAttribute: 'user_id',
	parse: function(response) {
		if (response.data) {
			if (_.isNumber(response.data)) {
				return {
					user_id: response.data
				};
			}
			return response.data;
		}
		return response;
	},

	defaults: {
		user_id: 0,
		lastname: '',
		firstname: '',
		avatar: '',
		email: ''
	},

	/**
	 * Test if user is currently authenticated 
	 * 
	 * @returns {boolean}
	 */
	isAuth: function() {
		return this.get('user_id') > 0;
	}

});
