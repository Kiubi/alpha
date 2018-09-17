var Backbone = require('backbone');
var _ = require('underscore');
require('jquery.cookie');
var api = require('../utils/api.client.js');
var createHash = require('sha.js');

var Site = require('./site.js');

/**
 * Test token validity
 * 
 * @param {String} token
 * @returns {Promise}
 */
function isTokenValid(token) {
	return api.get(
		'auth/token/' + token, {}, {
			access_token: token
		} // require also token in authorize header
	);
}

/**
 * Check acces to a site
 *
 * @param {String} site
 * @returns {Promise}
 */
function allowedSite(site) {
	var d = Backbone.$.Deferred();

	api.get('sites/' + site, {
		extra_fields: 'scopes,features'
	}).done(function(meta, data) {
		d.resolve(data);
	}).fail(function(meta, error) {
		d.reject(error.message);
	});
	return d.promise();
}

/**
 * Get first allowed site
 *
 * @returns {Promise}
 */
function pickFirstSite() {
	var d = Backbone.$.Deferred();

	api.get('sites', {
		limit: 1
	}).done(function(meta, data) {
		allowedSite(data[0].code_site).done(function(site) {
			d.resolve(site);
		}).fail(function(msg) {
			d.reject(msg);
		});
	}).fail(function(meta, error) {
		d.reject(error.message);
	});
	return d.promise();
}

/**
 * Store current token in cookie and setup ajax client
 *
 * @param {String} token
 */
function storeToken(token) {
	Backbone.$.cookie('AccesToken', token, {
		path: '/'
	});
	api.access_token = token;
}

/**
 * Return last used code site
 *
 * @param {Number} user_id
 * @returns {undefined|String}
 */
function getLastSite(user_id) {
	var cookie = Backbone.$.cookie('LastSite');

	if (!cookie) return;
	cookie = cookie.split(',');

	if (cookie[0] == '' + user_id) {
		return cookie[1];
	}
}

/**
 * Store last used code site
 *
 * @param {String} code_site
 * @param {Number} user_id
 */
function storeLastSite(code_site, user_id) {
	Backbone.$.cookie('LastSite', user_id + ',' + code_site, {
		path: '/'
	});
}

/**
 * Clear token stored in cookie and reset ajax client access
 */
function clearToken() {
	Backbone.$.removeCookie('AccesToken');
	api.access_token = null;
}

function setCredidentials(AuthPromise, Session) {
	return AuthPromise.done(function(meta, data) {
		storeToken(data.token);
		Session.set('token_media', data.token_media);

		Session.user.set('user_id', data.user.user_id);
		Session.user.set('firstname', data.user.firstname);
		Session.user.set('lastname', data.user.lastname);
		Session.user.set('avatar', data.user.avatar);
		Session.user.set('email', data.user.email);

		Session.user.trigger('authenticate');
	}).then(null, function(meta, error) {
		// FAIL
		return Backbone.$.Deferred().reject(error.message);
	});
}

function setSiteContext(SitePromise, Session) {
	return SitePromise.done(function(site) {
		console.log('Set session site', site.code_site);

		if (Session.site && site.code_site == Session.site.get('code_site')) return;
		Session.site.set(site);

		storeLastSite(Session.site.get('code_site'), Session.user.get('user_id'));

		api.current_site = Session.site.get('code_site');
		Session.site.trigger('change:site');
	}).fail(function() {
		Backbone.$.removeCookie('LastSite');
		api.current_site = null;
	});
}

var Session = Backbone.Model.extend({
	urlRoot: 'auth/token',

	initialize: function(options) {
		this.user = options.user;
		this.site = new Site();
	},

	defaults: {
		token: '',
		token_media: '',
		user: null,
		site: null
	},

	/**
	 * Test current cookie token validity
	 *
	 * @returns {Promise}
	 */
	start: function() {
		var token = Backbone.$.cookie('AccesToken');
		if (!token) {
			return Backbone.$.Deferred().reject();
		}

		return setCredidentials(isTokenValid(token), this).then(function() {
			var promise = getLastSite(this.user.get('user_id')) ?
				allowedSite(getLastSite(this.user.get('user_id'))) :
				pickFirstSite();
			return setSiteContext(promise, this);
		}.bind(this));
	},

	/**
	 * Authenticate user
	 *
	 * @param {String} login
	 * @param {String} password
	 * @returns Promise
	 */
	authenticate: function(login, password) {
		clearToken();

		return setCredidentials(api.post('auth/token', {
			login: login,
			password: password
		}), this).then(function() {
			var promise;

			if (getLastSite(this.user.get('user_id'))) {
				// try last site stored in cookie
				// fallback => first allowed site
				promise = Backbone.$.Deferred();
				allowedSite(getLastSite(this.user.get('user_id'))).done(function(meta, data) {
					promise.resolve(meta, data);
				}).fail(function() {
					pickFirstSite().done(function(meta, data) {
						promise.resolve(meta, data);
					}).fail(function(meta, error) {
						promise.reject(meta, error);
					});
				});
			} else {
				promise = pickFirstSite();
			}

			return setSiteContext(promise, this);
		}.bind(this));
	},

	/**
	 * Authenticate user
	 *
	 * @param {String} code_site
	 * @returns Promise
	 */
	changeSite: function(code_site) {
		return setSiteContext(allowedSite(code_site), this);
	},

	/**
	 * Compute media hash
	 *
	 * @param {Number} media_id
	 * @returns {string}
	 */
	hashMedia: function(media_id) {
		var payload = this.get('token_media') + ';' + media_id + ';' + this.site.get('code_site');

		return this.user.get('user_id') + '-' + createHash('sha256').update(payload).digest('hex');
	},

	/**
	 * Convert path to allow rendering in browser
	 *
	 * @param {String} path. Ex : /media/123
	 * @returns {String}
	 */
	convertMediaPath: function(path) {

		var id = path.match(/(^|\/)([0-9]+)($|\/|\.)/);
		if (id) {
			return 'https://' + this.site.get('backoffice') + path + '?sign=' + this.hashMedia(parseInt(id[2]));
		}

		return path;
	},

	/**
	 * Convert path to allow rendering in browser
	 *
	 * @param {String} path. Ex : /themes/theme/illustration.jpg
	 * @returns {String}
	 */
	convertThemePath: function(path) {
		return 'https://' + this.site.get('backoffice') + path + '?sign=' + this.hashMedia(path);
	},

	/**
	 * Test if user has a scope in the current session
	 * 
	 * @param {String} name
	 * @returns {boolean}
	 */
	hasScope: function(name) {

		if (!this.site.get('scopes')) return false;

		return _.contains(this.site.get('scopes'), name);
	},

	/**
	 * Test if site has a feature
	 *
	 * @param {String} name
	 * @returns {boolean}
	 */
	hasFeature: function(name) {

		if (!this.site.get('features')) return false;

		return (this.site.get('features')[name] === true);
	}

});

module.exports = Session;
