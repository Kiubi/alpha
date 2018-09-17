var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var LayoutSelectorView = require('kiubi/modules/appearance/views/layout.selector.js');
var SeoView = require('kiubi/views/ui/seo.js');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');

module.exports = Marionette.View.extend({
	template: require('../templates/home.html'),
	className: 'container',
	service: 'catalog',

	behaviors: [FormBehavior],

	regions: {
		layout: {
			el: "article[data-role='layout']",
			replaceElement: true
		},
		seo: {
			el: "article[data-role='seo']",
			replaceElement: true
		}
	},

	fields: [
		'name',
		'is_visible',
		'meta_title',
		'meta_description',
		'meta_keywords',
		'js_head',
		'js_body'
	],

	initialize: function(options) {
		this.mergeOptions(options, ['model']);

		if (this.getOption('enableLayout')) {
			this.layoutSelector = new LayoutSelectorView({
				layout_id: this.model.get('layout_id'),
				type: 'catalog-home',
				apply: this.model.get('category_id'),
				applyName: this.model.get('name')
			});
		}

		// Seo
		if (this.getOption('enableSeo')) {
			this.showChildView('seo', new SeoView({
				slug_prefix: false,
				model: this.model
			}));
		}
	},

	onRender: function() {
		if (this.getOption('enableLayout')) {
			this.showChildView('layout', this.layoutSelector);
		}
	},

	onChildviewChangeLayout: function(layout_id) {
		if (layout_id == this.model.get('layout_id')) return;

		this.model.save({
			layout_id: layout_id
		}, {
			patch: true
		});
	},

	onSave: function() {
		return this.model.save(
			Forms.extractFields(this.fields, this), {
				patch: true,
				wait: true
			}
		);
	}

});
