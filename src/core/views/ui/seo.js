var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var CharCountBehavior = require('kiubi/behaviors/char_count.js');
var Session = Backbone.Radio.channel('app').request('ctx:session');

module.exports = Marionette.View.extend({
	template: require('../../templates/ui/seo.html'),

	tagName: 'article',
	className: 'post-article',

	behaviors: [CharCountBehavior],

	slug_prefix: null,
	slug_suffix: '.html',

	/**
	 *
	 * @param {Object} options
	 */
	initialize: function(options) {
		this.slug_prefix = '';
		this.slug_suffix = '.html';
		this.mergeOptions(options, ['model', 'slug_prefix', 'slug_suffix']);
	},

	templateContext: function() {
		return {
			slug_prefix: this.slug_prefix !== false ? Session.site.get('domain') + this.slug_prefix : false,
			slug_suffix: this.slug_suffix,
			// slug : this.model.get('slug') ? this.model.get('slug') : '', 

			defaults_meta_title: this.model.get('defaults') ? this.model.get('defaults').meta_title : 'Contenu de la balise <title> qui remplacera celle définie par défaut',
			defaults_meta_description: this.model.get('defaults') ? this.model.get('defaults').meta_description : 'Contenu de la balise <meta description> qui remplacera celle définie par défaut',
			defaults_meta_keywords: this.model.get('defaults') ? this.model.get('defaults').meta_keywords : 'Contenu de la balise <meta keywords> qui remplacera celle définie par défaut',
			defaults_js_head: this.model.get('defaults') ? this.model.get('defaults').js_head : 'Code placé avant la balise </head> qui remplacera celui défini par défaut',
			defaults_js_body: this.model.get('defaults') ? this.model.get('defaults').js_body : 'Code placé avant la balise </body> qui remplacera celui défini par défaut'
		};
	}

});
