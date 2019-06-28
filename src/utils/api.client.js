var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var $ = require('jquery');
var _ = require('underscore');

/**
 * Return object without null or undefined properties
 * 
 * @param {Object} hash
 * @returns {Object}
 */
function withoutNull(hash) {
	if (!hash) return {};
	var clean = {};
	_.each(hash, function(value, key) {
		if (value !== null && value !== undefined) clean[key] = value;
	});
	return clean;
}

if (Backbone.__sync === undefined) {
	Backbone.__sync = Backbone.sync;
	Backbone.sync = function(method, model, options) {

		// Stop Backbone to stringify params 
		if (options.data == null && model && (method === 'create' || method === 'update' || method === 'patch')) {
			options.data = options.attrs || model.toJSON(options);
		}
		options.data = withoutNull(options.data); // clean up null

		return Backbone.__sync(method, model, options);
	};
}

var Errors = {};

Errors.E_UNKNOWN_RESOURCE = 4401;
Errors.E_MAINTENANCE = 5300;
Errors.E_REQUEST_TOO_LARGE = 413;
Errors.E_ACCESS_ABUSE = 4300;
Errors.E_ACCESS_AUTH_NEEDED = 4307;
Errors.E_ACCESS_DENIED = 4308;
Errors.E_ACCESS_IDENTIFICATION_FAILED = 4309;
Errors.E_ACCESS_NOT_YOURS = 4310;
Errors.E_ACCESS_TOKEN = 4311;
Errors.E_ACCESS_INSUFFICIENT_SCOPE = 4312;
Errors.E_ACCESS_CLIENT_TOO_OLD = 4313;
Errors.E_ACCESS_UNKNOWN_USER = 4314;
Errors.E_ACCESS_REGISTRATION_NEEDED = 4320;
Errors.E_USER_REQUIRED_PARAMS = 4001;
Errors.E_USER_PARAMS_VALIDATION = 4002;
Errors.E_USER_PARAMS_ENCODING = 4012;

var Client = Marionette.Object.extend({

	current_site: null,
	api_version: 1,
	api_url: '',
	version: 1,

	initialize: function(options) {
		this.access_token = null;
		this.max_post_size = (1024 * 1024 * 8);
		this._rate_remaining = null;

		var config = Backbone.Radio.channel('app').request('ctx:config');
		this.api_version = config.get('api_version');
		this.api_url = config.get('api');
		this.version = config.get('client_version');

		$(document).ajaxError(function(e, xhr, options) {
			if (xhr.responseJSON &&
				xhr.responseJSON.error &&
				xhr.responseJSON.error.code == Errors.E_ACCESS_TOKEN) {
				$(document).trigger('application:logout');
			}
		});
	},
	/**
	 * Uniformise l'URL d'appelle pour un endpoint donné
	 * exemples :
	 *   auth/authorize -> http://.../v1/auth/authorize.json
	 *   /auth/authorize -> http://.../v1/auth/authorize.json
	 *   v1/auth/authorize -> http://.../v1/auth/authorize.json
	 *   /v1/auth/authorize -> http://.../v1/auth/authorize.json
	 *   auth/authorize.json -> http://.../v1/auth/authorize.json
	 *   /auth/authorize.json -> http://.../v1/auth/authorize.json
	 *   v1/auth/authorize.json -> http://.../v1/auth/authorize.json
	 *   /v1/auth/authorize.json -> http://.../v1/auth/authorize.json
	 *   
	 * @param {String} url
	 * @returns {String}
	 */
	normalize_url: function(url) {
		if (url.indexOf('/') !== 0) {
			url = '/' + url;
		}
		if (url.indexOf('/v' + this.api_version) === 0) {
			url = url.substring(1);
		} else {
			url = 'v' + this.api_version + url;
		}

		if (url.indexOf('.json') == -1) {
			url += '.json';
		}
		// Add current site
		if (url.indexOf('/sites/@site/') > 0 && this.current_site) {
			url = url.replace('/sites/@site/', '/sites/' + this.current_site + '/');
		}

		return (this.api_url + "/" + url);
	},

	/**
	 * Backbone Adaptater
	 *
	 * @param {Object} params
	 * @param {Object} options
	 */
	ajax: function(params, options) {
		params = params || {};
		var headers = params.headers || {};
		headers['X-Client'] = 'Kiubi/' + this.version;
		var token = params.access_token || this.access_token || null;
		if (token) {
			headers.Authorization = 'token ' + token;
		}
		params.headers = headers;
		params.url = this.normalize_url(params.url);

		// Handle HTTP METHOD
		if (params.type && !params.method) params.method = params.type; // type is an old JQuery alias
		delete params.type;
		if (params.method == 'PATCH') params.method = 'PUT';

		// Params encoding
		if (params.data instanceof FormData) {

			if (params.method == 'PUT' || params.method == 'DELETE') {
				// Fake PUT & DELETE, API Limitation
				params.data.append('method', params.method);
				params.method = 'POST';
			}

		} else if (params.data && _.size(params.data)) {

			if (params.method == 'PUT' || params.method == 'DELETE') {
				// Fake PUT & DELETE, API Limitation
				params.data.method = params.method;
				params.method = 'POST';
			}

			var files = _.filter(params.data, function(param) {
				return param instanceof File;
			});
			if (files.length == 0) {
				params.contentType = 'application/x-www-form-urlencoded';
				params.data = $.param(params.data);
			} else {
				// Found at least one file => multipart
				params.contentType = false;
				var data = new FormData();
				_.each(params.data, function(v, k) {
					data.append(k, v);
				});
				params.data = data;
			}

		} else {
			params.data = null;
		}

		return Backbone.$.ajax.apply(Backbone.$, [params, options]);
	},

	/**
	 * Effectue une requête concrète vers l'api
	 * puis résout ou rejette la demande suivant le retour
	 *
	 * @param {String} type
	 * @param {String} endpoint
	 * @param {Object} params
	 * @param {Object} ajax_options
	 * @returns Promise
	 */
	query: function(type, endpoint, params, ajax_options) {
		var d = $.Deferred();
		var client = this;

		var query = this.ajax($.extend({
			type: type,
			dataType: 'json',
			data: params || {},
			url: endpoint,
		}, ajax_options || {}));

		query.done(function(s) {
			if (s.meta.status_code != 200) {
				// cas spécifique ou une erreur est
				// retournée dans un code 200
				d.reject(s.meta, s.error, s.data);
				return;
			}
			d.resolve(s.meta, s.data);
		});

		query.fail(function(s) {
			var payload = {};
			if (s.responseText) {
				try {
					// sur un fail jQuery stocke le retour json sous forme de texte
					payload = $.parseJSON(s.responseText);
				} catch (e) {
					payload.error = {
						'message': "An unexpected error has occurred.",
						'fields': []
					};
				}
			}
			// on rejette la promesse
			d.reject.apply(this, [
				payload.meta || {},
				payload.error || {},
				payload.data || {}
			]);
		});

		query.always(function(s) {
			if (!s.meta) {
				// try reading meta from responseText
				try {
					s = $.parseJSON(s.responseText);
				} catch (e) {
					return;
				}
			}
			client._rate_remaining = s.meta.rate_remaining;
		});

		return d.promise();
	},

	/**
	 * Effectue une requête de type POST
	 *
	 * @param {String} endpoint
	 * @param {Object} params
	 * @returns Promise
	 */
	post: function(endpoint, params) {
		$.ajaxSetup({
			cache: false
		});
		return this.query('POST', endpoint, params);
	},

	/**
	 * Effectue une requête de type GET
	 *
	 * @param {String} endpoint
	 * @param {Object} params
	 * @param {Object} options
	 * @returns Promise
	 */
	get: function(endpoint, params, options) {
		$.ajaxSetup({
			cache: true
		});
		return this.query('GET', endpoint, params, options);
	},

	/**
	 * Effectue une requête de type PUT
	 *
	 * @param {String} endpoint
	 * @param {Object} params
	 * @returns Promise
	 */
	put: function(endpoint, params) {
		$.ajaxSetup({
			cache: false
		});
		return this.query('PUT', endpoint, params);
	},

	/**
	 * Effectue une requête de type DELETE
	 *
	 * @param {String} endpoint
	 * @param {Object} params
	 * @returns Promise
	 */
	'delete': function(endpoint, params) {
		$.ajaxSetup({
			cache: false
		});
		return this.query('DELETE', endpoint, params);
	},

	/**
	 * Effectue une connexion d'un utilisateur
	 *
	 * @param {String} login
	 * @param {String} password
	 * @param {Object} params Paramètres additionnels (optionel)
	 * @returns Promise
	 */
	login: function(login, password, params) {
		params = $.extend(params || {}, {
			"login": login,
			"password": password
		});
		return this.post('auth/authorize', params);
	},

	/**
	 * Effectue une déconnexion de l'utilisateur courant
	 *
	 * @returns Promise
	 */
	logout: function() {
		return this['delete']('auth/session');
	},

	/**
	 * Parse la première page d'une liste de résultats
	 *
	 * @param {Object} meta
	 * @returns Promise
	 */
	getFirstPage: function(meta) {
		if (meta && meta.link && meta.link.first_page) {
			return this.crawl(meta.link.first_page);
		} else {
			return this.fail();
		}
	},

	/**
	 * Parse la page précédente d'une liste de résultats
	 *
	 * @param {Object} meta
	 * @returns Promise
	 */
	getPreviousPage: function(meta) {
		if (meta && meta.link && meta.link.previous_page) {
			return this.crawl(meta.link.previous_page);
		} else {
			return this.fail();
		}
	},

	/**
	 * Parse la page suivante d'une liste de résultats
	 *
	 * @param {Object} meta
	 * @returns Promise
	 */
	getNextPage: function(meta) {
		if (meta && meta.link && meta.link.next_page) {
			return this.crawl(meta.link.next_page);
		} else {
			return this.fail();
		}
	},

	/**
	 * Parse la dernière page d'une liste de résultats
	 *
	 * @param {Object} meta
	 * @returns Promise
	 */
	getLastPage: function(meta) {
		if (meta && meta.link && meta.link.last_page) {
			return this.crawl(meta.link.last_page);
		} else {
			return this.fail();
		}
	},

	/**
	 * Parse la page numéro X d'une liste de résultats
	 *
	 * @param {Object} meta
	 * @param {Integer} num
	 * @returns Promise
	 */
	getPage: function(meta, num) {
		if (meta && meta.link && meta.link.first_page) {
			return this.crawl(meta.link.first_page + '&page=' + parseInt(num));
		} else {
			return this.fail();
		}
	},

	/**
	 * Indique si une page suivante existe
	 *
	 * @param {Object} meta
	 * @returns Boolean
	 */
	hasNextPage: function(meta) {
		return meta && meta.link && meta.link.next_page;
	},

	/**
	 * Indique si une page précédente existe
	 *
	 * @param {Object} meta
	 * @returns Boolean
	 */
	hasPreviousPage: function(meta) {
		return meta && meta.link && meta.link.previous_page;
	},

	/**
	 * Requete un lien
	 *
	 * @param {String} link
	 * @returns Promise
	 */
	crawl: function(link) {
		link = link.replace(this.base + 'v' + this.api_version, '');
		return this.get(link);
	},

	/**
	 * Gestion de l'erreur sur la requête d'un lien
	 *
	 * @returns Promise
	 */
	fail: function() {
		var d = new $.Deferred();
		d.reject({}, {}, {});
		return d.promise();
	},

	/**
	 * Encode une chaine de texte unicode dans
	 * l'encodage utilisé par la plateforme
	 *
	 * @param {String} bytes
	 * @returns String
	 */
	escape: function(bytes) {
		var cp1252 =
			"\x80\x82\x83\x84\x85\x86\x87\x88\x89\x8A\x8B\x8C\x8E\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9A\x9B\x9C\x9E\x9F";
		var unicode =
			"\u20AC\u201A\u0192\u201E\u2026\u2020\u2021\u02C6\u2030\u0160\u2039\u0152\u017D\u2018\u2019\u201C\u201D\u2022\u2013\u2014\u02DC\u2122\u0161\u203A\u0153\u017E\u0178";
		var n = bytes.length;
		var chars = new Array(n);
		for (var i = 0; i < n; i++) {
			var index = unicode.indexOf(bytes[i]);
			if (index < 0) chars[i] = bytes[i];
			else chars[i] = cp1252.charAt(index);
		}
		return window.escape(chars.join(''));
	},

	/**
	 * Retourne le quota de requêtes restantes
	 *
	 * @param {Boolean} remote_check si ce paramètre est à true, le quota est
	 *     vérifié sur le serveur, dans le cas contraire, lorsque
	 *     sa valeur est disponible, le quota est recherché dans
	 *     l'objet kiubi, mis à jour lors de chaque appelle à la
	 *     méthode kiubi.query()
	 * @returns Integer
	 */
	getRateRemaining: function(remote_check) {
		if (remote_check || this._rate_remaining === undefined) {
			var result = $.ajax({
				dataType: 'json',
				url: this.base + 'v' + this.api_version + '/rate',
				async: false
			});
			try {
				var meta = $.parseJSON(result.responseText).meta;
				this._rate_remaining = meta && meta.rate_remaining;
			} catch (e) {
				return -1;
			}
		}
		return this._rate_remaining;
	}
});

module.exports = new Client();
module.exports.Errors = Errors;
