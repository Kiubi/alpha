var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _string = require('underscore.string');
var _ = require('underscore');
var moment = require('moment');
var format = require('kiubi/utils/format.js');

var CharCountBehavior = require('kiubi/behaviors/char_count.js');
var Session = Backbone.Radio.channel('app').request('ctx:session');

var Contact = require('kiubi/modules/prefs/models/contact');
var Theme = require('kiubi/modules/prefs/models/theme');

var PreviewRender = Marionette.Object.extend({

	matchingReg: null,
	parseFilters: {
		left: function(value, args) {
			return value.substring(0, args[0] && args[0] <= value.length ? args[0] : value.length);
		},
		ucfirst: function(value) {
			return _string.capitalize(value);
		},
		strtoupper: function(value) {
			return value.toUpperCase();
		},
		strtolower: function(value) {
			return value.toLowerCase();
		},
		rawurlencode: function(value) {
			return encodeURIComponent(value);
		},
		htmlentities: function(value, args) {
			return _string.escapeHTML(value);
		},
		escapejs: function(value) {
			return _string.quote(value);
		},
		stripText: function(value, args) {
			return _string.truncate(_string.stripTags(value), args[0] || 0, '...');
		},
		mot: function(value, args) {
			value = value.split(/[\s,.;?!:]+/);
			var n = args[0] ? args[0] - 1 : 0;
			if (n > (value.length - 1)) n = value.length - 1;
			else if (n < 0) n = 0;
			return value[n];
		},
		mapValue: function(value, args) {
			var trueval = args[0] || '';
			var falseval = args[1] || '';
			return (value === 1 || value === '1' || value == 'actif' || value == 'selected' || value == 'checked' || value == 'erreur') ? trueval : falseval;
		},
		sanitize: function(value) {
			if (value.length > 120) return value;
			value = _string.cleanDiacritics(value)
				.toLowerCase()
				.replace(/[^a-zA-Z0-9_\.\/]/g, '-')
				.replace(/[_-]+$/g, '-')
				.replace(/-+/g, '-');
			return value;
		},
		alternate: function(value, args) {
			var base = args[0] || 2;
			if (base > 1 && base <= 12) {
				value = ((parseInt(value) - 1) % (parseInt(base)) + 1);
			} else {
				value = '';
			}
			return value;
		},
		formatFloat: function(value, args) {
			var nbDec = args[0] || 2;
			nbDec = Math.min(10, Math.max(0, nbDec)); // min 0, max 10
			if (value.length <= 10) { // max 10 milliards -1
				value = format.formatFloat(value, nbDec, ' ');
			} else {
				value = '';
			}
			return value;
		},
		empty: function(value, args) {
			var emptyVal = args[0] || '';
			var filledVal = args[1] || '';
			return (value === '' || value === null) ? emptyVal : filledVal;
		},
		slice: function(value, args) {
			var sepVal = args[0] || '-';
			value = value.split(sepVal); // max 20
			var n = value.length;
			var beginVal = parseInt(args[1]) || 0;
			if (beginVal > n) beginVal = n;
			if (beginVal < -n) beginVal = -n;
			var endVal = beginVal + (parseInt(args[2]) || n);
			if (endVal > n) endVal = n;
			if (beginVal < 0) endVal = undefined;
			value = value.slice(beginVal, endVal);
			return value.join(sepVal);
		}
	},

	initialize: function(options) {

		this.mergeOptions(options, ['slug', 'link', 'name']);
		this.matchingReg = /{([a-zA-Z0-9_]+)\.?([a-zA-Z0-9_]+)?\|?([a-zA-Z0-9_|-]+)?}/g;
	},

	render: function(data) {
		var promise;

		var Session = Backbone.Radio.channel('app').request('ctx:session');
		var renderValues = Session.cache.get('preview.values');

		if (renderValues === null) {
			return this.fetch()
				.done(function(renderValues) {
					Session.cache.set('preview.values', renderValues);
				})
				.then(function(renderValues) {
					return this.parse(data, renderValues);
				}.bind(this));
		}

		return Backbone.$.Deferred().resolve(this.parse(data, renderValues));
	},

	fetch: function() {

		var Session = Backbone.Radio.channel('app').request('ctx:session');
		var modelContact = new Contact();
		var modelTheme = new Theme();

		return Backbone.$.when(
			modelContact.fetch(),
			modelTheme.fetch()
		).then(function() {

			var now = moment();

			return {
				racine: '/',
				lg: 'fr',
				baseLangue: '/',
				lien_pagecourante: '', // local data
				intitule_pagecourante: '', // local data
				optim_pagecourante: '', // local data
				canonical: '', // local data
				// contexte_pagecourante : '',  // local data
				// lien_pageparente : '', intitule_pageparente : '',  // local data
				accroche_site: modelTheme.get('site_excerpt'),
				desc_site: modelTheme.get('site_description'),
				logo_site: modelTheme.get('logo_media_id'),
				url_logo_site: '/media/' + modelTheme.get('logo_media_id'),
				domaine: Session.site.get('domain'),
				schema: Session.site.get('domain').substr(0, 7) === 'https://' ? 'https' : 'http',
				liste_domaines: Session.site.get('domain'),
				site_nom: Session.site.get('name'),
				// g_vignette_l: '', vignette_l: '', g_vignette_h: '', vignette_h: '', g_miniature_l: '', miniature_l: '', g_miniature_h: '', miniature_h: '',
				// cdn : '', referer: '',
				// devise: '', devise_iso: '',
				// theme : '',
				// illustration_pagecourante: '', illustration_pagecourante_miniature: '', illustration_pagecourante_vignette: '', illustration_pagecourante_g_vignette: '', illustration_pagecourante_g_miniature: '',
				SOCIETE: {
					contact_nom: modelContact.get('lastname'),
					contact_prenom: modelContact.get('firstname'),
					contact_email: modelContact.get('email'),
					societe_nom: modelContact.get('company_name'),
					societe_adresse: modelContact.get('company_address'),
					societe_cp: modelContact.get('company_zipcode'),
					societe_ville: modelContact.get('company_city'),
					societe_pays: modelContact.get('company_country'),
					societe_tel: modelContact.get('phone'),
					societe_mobile: modelContact.get('mobile'),
					societe_fax: modelContact.get('fax'),
					societe_cnil: modelContact.get('company_cnil'),
					societe_capital: modelContact.get('company_capital'),
					societe_siret: modelContact.get('company_siret'),
					societe_rcs: modelContact.get('company_rcs'),
					societe_ape: modelContact.get('company_naf'),
					societe_tva: modelContact.get('company_tva'),
					societe_forme: modelContact.get('company_forme'),
					// old compatibilty
					site_nom: Session.site.get('name'),
				},
				num_jour_maintenant: now.date(),
				jour_semaine_maintenant: now.format('dddd'),
				num_mois_maintenant: now.month(),
				mois_maintenant: now.format('MMMM'),
				mois_abrev_maintenant: now.format('MMM'),
				annee_maintenant: now.year(),
				heure_maintenant: now.hour(),
				minute_maintenant: now.minute(),
				seconde_maintenant: now.second(),
				timestamp_maintenant: now.unix(),
				// CLIENT : {}, GET : {}, POST : {}, REQUEST : {}, API.actif
			};

		}.bind(this));
	},

	parse: function(data, values) {

		// locales data
		values.lien_pagecourante = this.link;
		values.intitule_pagecourante = this.name;
		values.optim_pagecourante = this.slug;
		values.canonical = this.link;
		// TODO contexte_pagecourante,
		// TODO lien_pageparente, intitule_pageparente,
		values.intitule_pageparente = '#page parente#'; // FIXME

		return _.mapObject(data, function(text) {
			return text.replace(this.matchingReg, function(match, first, second, fct) {
				var value;

				if (!values.hasOwnProperty(first)) return match;
				if (second) {
					if (!values[first].hasOwnProperty(second)) return match;
					value = values[first][second];
				} else {
					if (!_.isString(values[first]) && !_.isNumber(values[first])) return match;
					value = values[first];
				}

				if (fct) {
					var params = fct.split('|');
					if (params.length === 0 || !this.parseFilters.hasOwnProperty(params[0])) return match;
					var fctName = params.shift();
					value = this.parseFilters[fctName](value, params);
				}

				return value;
			}.bind(this));
		}.bind(this));
	},

});

var PreviewView = Marionette.View.extend({
	template: _.template('<div class="post-group seo-layout">' +
		'<h3><%- meta_title %></h3>' +
		'<p class="seo-breadcrumb mb-2"><%- slug_prefix %><%- slug %><%- slug_suffix %></p>' +
		'<p class="seo-desc mb-0"><%- meta_description %></p>' +
		'</div>'),

	initialize: function(options) {
		this.mergeOptions(options, ['model']);
		this.listenTo(this.model, 'change', this.render);
	},

	templateContext: function() {
		return {
			meta_title: _string.truncate(this.model.get('preview_meta_title'), 70, '...'),
			meta_description: _string.truncate(this.model.get('preview_meta_description'), 170, '...'),
		};
	}

});

module.exports = Marionette.View.extend({
	template: require('../../templates/ui/seo.html'),

	tagName: 'article',
	className: 'post-article',

	behaviors: [CharCountBehavior],

	ui: {
		'inputTitle': "input[name='meta_title']",
		'inputDescription': "textarea[name='meta_description']",
	},

	events: {
		'keyup @ui.inputTitle': _.debounce(function() {
			this.onTitleUpdate();
		}, 300),
		'keyup @ui.inputDescription': _.debounce(function() {
			this.onDescUpdate();
		}, 300)
	},

	regions: {
		preview: {
			el: "div[data-role='preview']",
			replaceElement: true
		}
	},

	slug_suffix: null,
	previewer: null,
	previewModel: null,

	/**
	 *
	 * @param {Object} options
	 */
	initialize: function(options) {
		this.slug_suffix = '.html';
		this.mergeOptions(options, ['model', 'slug_suffix']);

		this.previewModel = new Backbone.Model();
		this.previewer = new PreviewRender({
			slug: this.model.has('slug') ? this.model.get('slug') : '',
			link: Session.site.get('domain') + this.model.get('service_path') + '/' + (this.model.has('slug') ? this.model.get('slug') : '') + (this.model.has('slug') ? this.slug_suffix : ''),
			name: this.model.get('name') || this.model.get('title')
		});

		this.listenTo(this.model, 'sync', this.render);
	},

	templateContext: function() {
		var defaults = this.getDefaultsMetas();

		return {
			slug_prefix: Session.site.get('domain') + this.model.get('service_path') + '/',
			slug_suffix: this.model.has('slug') ? this.slug_suffix : '',
			slug_edit: this.model.has('slug'),
			slug: this.model.get('slug') ? this.model.get('slug') : '',

			defaults_meta_title: defaults.meta_title,
			defaults_meta_description: defaults.meta_description,
			defaults_meta_keywords: this.model.get('defaults') ? this.model.get('defaults').meta_keywords : 'Contenu de la balise <meta keywords> qui remplacera celle définie par défaut',
			defaults_js_head: this.model.get('defaults') ? this.model.get('defaults').js_head : 'Code placé avant la balise </head> qui remplacera celui défini par défaut',
			defaults_js_body: this.model.get('defaults') ? this.model.get('defaults').js_body : 'Code placé avant la balise </body> qui remplacera celui défini par défaut'
		};
	},

	onRender: function() {
		var defaults = this.getDefaultsMetas();

		this.previewModel.set({
			preview_meta_title: this.model.get('meta_title') ? this.model.get('meta_title') : defaults.meta_title,
			preview_meta_description: this.model.get('meta_description') ? this.model.get('meta_description') : defaults.meta_description,
			slug_prefix: Session.site.get('domain') + this.model.get('service_path') + '/',
			slug: this.model.get('slug') ? this.model.get('slug') : '',
			slug_suffix: this.model.has('slug') ? this.slug_suffix : '',
		});

		this.showChildView('preview', new PreviewView({
			model: this.previewModel
		}));

		this.previewer.render({
			preview_meta_title: this.previewModel.get('preview_meta_title'),
			preview_meta_description: this.previewModel.get('preview_meta_description'),
		}).done(function(parsed) {
			this.previewModel.set(parsed);
		}.bind(this));

	},

	getDefaultsMetas: function() {
		return {
			meta_title: this.model.get('defaults') ? this.model.get('defaults').meta_title : 'Contenu de la balise <title> qui remplacera celle définie par défaut',
			meta_description: this.model.get('defaults') ? this.model.get('defaults').meta_description : 'Contenu de la balise <meta description> qui remplacera celle définie par défaut'
		};
	},

	onTitleUpdate: function() {
		this.previewer.render({
			preview_meta_title: this.getUI('inputTitle').val() ? this.getUI('inputTitle').val() : this.model.get('defaults').meta_title,
		}).done(function(parsed) {
			this.previewModel.set(parsed);
		}.bind(this));
	},

	onDescUpdate: function() {
		this.previewer.render({
			preview_meta_description: this.getUI('inputDescription').val() ? this.getUI('inputDescription').val() : this.model.get('defaults').meta_description,
		}).done(function(parsed) {
			this.previewModel.set(parsed);
		}.bind(this));
	}

});
