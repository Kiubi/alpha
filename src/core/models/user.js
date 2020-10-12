var CollectionUtils = require('kiubi/utils/collections.js');
var _ = require('underscore');

module.exports = CollectionUtils.KiubiModel.extend({
	urlRoot: 'users',
	idAttribute: 'user_id',

	defaults: {
		user_id: 0,
		lastname: '',
		firstname: '',
		avatar: '',
		email: '',
		gender: '',
		is_admin: false,
		scopes: []
	},

	/**
	 * Test if user is currently authenticated
	 *
	 * @returns {boolean}
	 */
	isAuth: function() {
		return this.get('user_id') > 0;
	},

	/**
	 * Test user scope
	 *
	 * @param name
	 * @returns {boolean}
	 */
	hasScope: function(name) {
		if (!this.get('scopes')) return false;
		return _.contains(this.get('scopes'), name);
	},

	/**
	 * Test if user is an administrator
	 *
	 * @returns {boolean}
	 */
	isAdmin: function() {
		return this.get('is_admin') === true;
	},

	/**
	 * Create user avatar file
	 *
	 */
	getAvatar: function() {
		var avatar;
		if (this.get('gender') == 'M') {
			avatar = 'user-avatar-m.png'
		} else {
			avatar = 'user-avatar-f.png'
		}
		return avatar;
	}

});
