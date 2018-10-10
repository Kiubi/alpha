var Backbone = require('backbone');
var _ = require('underscore');
require('jquery.cookie');
var api = require('../utils/api.client.js');
var createHash = require('sha.js');

var Site = require('./site.js');

/* Storage */

var CookieStorage = function() {

	this.getItem = function(label) {
		return Backbone.$.cookie(label);
	};
	this.setItem = function(label, value, inSession) {
		Backbone.$.cookie(label, value, {
			path: '/'
		});
	};
	this.clearItem = function(label) {
		Backbone.$.removeCookie(label);
	};
};

var LocalStorage = function() {

	var localStorage = window.localStorage;
	var sessionStorage = window.sessionStorage;

	this.getItem = function(label) {
		var value = sessionStorage.getItem(label);
		if (value === null) {
			value = localStorage.getItem(label);
		}
		return value;
	};
	this.setItem = function(label, value, inSession) {
		localStorage.setItem(label, value);
		if (inSession) {
			sessionStorage.setItem(label, value);
		}
	};
	this.clearItem = function(label) {
		localStorage.removeItem(label);
		sessionStorage.removeItem(label);
	};
};

function storageFactory() {

	try {
		var storage = window['localStorage'],
			x = '__storage_test__';
		storage.setItem(x, x);
		storage.removeItem(x);
		return new LocalStorage();
	} catch (e) {
		return new CookieStorage();
	}
}

/* Auth */

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

function setCredidentials(AuthPromise, Session) {
	return AuthPromise.done(function(meta, data) {
		Session.storeToken(data.token);
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

		Session.storeLastSite();
		api.current_site = Session.site.get('code_site');
		Session.site.trigger('change:site');
	}).fail(function() {
		Session.clearLastSite();
		api.current_site = null;
	});
}

var Session = Backbone.Model.extend({
	urlRoot: 'auth/token',

	initialize: function(options) {
		this.user = options.user;
		this.site = new Site();
		this.storage = storageFactory();
	},

	defaults: {
		token: '',
		token_media: '',
		user: null,
		site: null
	},

	/**
	 * Test current token validity
	 *
	 * @returns {Promise}
	 */
	start: function() {
		var token = this.storage.getItem('AccesToken');
		if (!token) {
			return Backbone.$.Deferred().reject();
		}

		return setCredidentials(isTokenValid(token), this).then(function() {
			var lastSite = this.getLastSite();
			var promise = lastSite ? allowedSite(lastSite) : pickFirstSite();
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
		this.clearToken();

		return setCredidentials(api.post('auth/token', {
			login: login,
			password: password
		}), this).then(function() {
			var promise;
			var lastSite = this.getLastSite();

			if (lastSite) {
				// try last site 
				// fallback => first allowed site
				promise = Backbone.$.Deferred();
				allowedSite(lastSite).done(function(meta, data) {
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
	 * @param {boolean} forceDownload
	 * @returns {String}
	 */
	convertMediaPath: function(path, forceDownload) {

		var id = path.match(/(^|\/)([0-9]+)($|\/|\.)/);
		if (id) {
			var params = forceDownload ? '&a=download' : '';
			return 'https://' + this.site.get('backoffice') + path + '?sign=' + this.hashMedia(parseInt(id[2])) + params;
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
	},

	/**
	 * Return last used code site
	 *
	 * @returns {undefined|String}
	 */
	getLastSite: function() {

		var user_id = this.user.get('user_id');
		var lastSite = this.storage.getItem('LastSite');

		if (!lastSite) return;
		lastSite = lastSite.split(',');

		if (lastSite[0] == '' + user_id) {
			return lastSite[1];
		}
	},

	/**
	 * Store last used code site
	 *
	 */
	storeLastSite: function() {
		this.storage.setItem('LastSite', this.user.get('user_id') + ',' + this.site.get('code_site'), true);
	},

	/**
	 * Clear last used code site
	 */
	clearLastSite: function() {
		this.storage.clearItem('LastSite');
	},

	/**
	 * Store current token and setup ajax client
	 *
	 * @param {String} token
	 */
	storeToken: function(token) {
		this.storage.setItem('AccesToken', token);
		api.access_token = token;
	},

	/**
	 * Clear token stored and reset ajax client access
	 */
	clearToken: function() {
		this.storage.clearItem('AccesToken');
		api.access_token = null;
	}

});

module.exports = Session;
