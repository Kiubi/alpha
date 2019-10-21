var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _string = require('underscore.string');

var CharCountBehavior = require('kiubi/behaviors/char_count.js');
var Session = Backbone.Radio.channel('app').request('ctx:session');

module.exports = Marionette.View.extend({
	template: require('../../templates/ui/seo.html'),

	tagName: 'article',
	className: 'post-article',

	behaviors: [CharCountBehavior],

	slug_suffix: null,

	/**
	 *
	 * @param {Object} options
	 */
	initialize: function(options) {
		this.slug_suffix = '.html';
		this.mergeOptions(options, ['model', 'slug_suffix']);

		this.listenTo(this.model, 'sync', this.render);
	},

	templateContext: function() {

		var defaults_meta_title = this.model.get('defaults') ? this.model.get('defaults').meta_title : 'Contenu de la balise <title> qui remplacera celle définie par défaut';
		var defaults_meta_description = this.model.get('defaults') ? this.model.get('defaults').meta_description : 'Contenu de la balise <meta description> qui remplacera celle définie par défaut';

		return {
			slug_prefix: Session.site.get('domain') + this.model.get('service_path') + '/',
			slug_suffix: this.model.has('slug') ? this.slug_suffix : '',
			slug_edit: this.model.has('slug'),
			slug: this.model.get('slug') ? this.model.get('slug') : '',

			preview_meta_title: _string.truncate(this.model.get('meta_title') ? this.model.get('meta_title') : defaults_meta_title, 70, '...'),
			preview_meta_description: _string.truncate(this.model.get('meta_description') ? this.model.get('meta_description') : defaults_meta_description, 170, '...'),

			defaults_meta_title: defaults_meta_title,
			defaults_meta_description: defaults_meta_description,
			defaults_meta_keywords: this.model.get('defaults') ? this.model.get('defaults').meta_keywords : 'Contenu de la balise <meta keywords> qui remplacera celle définie par défaut',
			defaults_js_head: this.model.get('defaults') ? this.model.get('defaults').js_head : 'Code placé avant la balise </head> qui remplacera celui défini par défaut',
			defaults_js_body: this.model.get('defaults') ? this.model.get('defaults').js_body : 'Code placé avant la balise </body> qui remplacera celui défini par défaut'
		};
	}

});
