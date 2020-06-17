var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var LayoutSelectorView = require('kiubi/modules/appearance/views/layout.selector.js');
var FilePickerView = require('kiubi/modules/media/views/file.picker.js');
var SeoView = require('kiubi/core/views/ui/seo.js');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var WysiwygBehavior = require('kiubi/behaviors/tinymce.js');
var Forms = require('kiubi/utils/forms.js');

module.exports = Marionette.View.extend({
	template: require('../templates/category.html'),
	className: 'container container-large',
	service: 'catalog',

	behaviors: [FormBehavior, WysiwygBehavior],

	regions: {
		layout: {
			el: "article[data-role='layout']",
			replaceElement: true
		},
		image: {
			el: "div[data-role='image']",
			replaceElement: true
		},
		seo: {
			el: "article[data-role='seo']",
			replaceElement: true
		}
	},

	fields: [
		'name',
		'description',
		'media_id',
		'is_visible',
		'slug',
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
				type: 'catalog-category',
				apply: this.model.get('category_id'),
				applyName: this.model.get('name')
			});
		}

		this.listenTo(this.model, 'change', this.render);
	},

	onBeforeRender: function() {
		if (this.getOption('enableLayout') && this.layoutSelector.isAttached()) {
			this.detachChildView('layout');
		}
	},

	onRender: function() {
		if (this.getOption('enableLayout')) {
			this.showChildView('layout', this.layoutSelector);
		}
		this.showChildView('image', new FilePickerView({
			fieldname: 'media_id',
			fieldLabel: 'Illustration',
			type: 'image',
			value: this.model.get('media_id') ? this.model.get('media_id') : ''
		}));

		// Seo
		if (this.getOption('enableSeo')) {
			this.showChildView('seo', new SeoView({
				slug_suffix: '/',
				model: this.model
			}));
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

		var data = Forms.extractFields(this.fields, this);

		if (this.getOption('enableSeo') && Forms.isTmpSlug(data.slug)) {
			data.slug = data.name;
		}

		return this.model.save(
			data, {
				patch: true,
				wait: true
			}
		);
	},

	onDelete: function() {
		return this.model.destroy({
			wait: true
		});
	}

});
