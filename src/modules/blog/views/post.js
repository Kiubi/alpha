var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var LayoutSelectorView = require('kiubi/modules/appearance/views/layout.selector.js');
var SelectView = require('kiubi/views/ui/select.js');
var FilePickerView = require('kiubi/modules/media/views/file.picker.js');

var CharCountBehavior = require('kiubi/behaviors/char_count.js');
var FormBehavior = require('kiubi/behaviors/simple_form.js');
var WysiwygBehavior = require('kiubi/behaviors/tinymce.js');
var Forms = require('kiubi/utils/forms.js');
var Datepicker = require('kiubi/behaviors/datepicker.js');

var Session = Backbone.Radio.channel('app').request('ctx:session');

var TypeSelectorView = Marionette.View.extend({
	template: require('../templates/post.type.html'),
	className: 'post-article',
	tagName: 'article',

	types: [],
	fields: [],
	type: '',
	post: null,

	ui: {
		'select': "select[name='type']"
	},

	events: {
		'change @ui.select': function() {
			this.selectType(this.getUI('select').val());
		}
	},

	behaviors: [WysiwygBehavior],

	initialize: function(options) {
		this.mergeOptions(options, ['type', 'typesSource', 'post']);

		this.typesSource.done(function(types) {
			this.types = types;
			this.selectType(this.type);
		}.bind(this));
	},

	templateContext: function() {
		return {
			type: this.type,
			types: this.types,
			post: this.post,
			fields: this.fields
		};
	},

	selectType: function(type) {
		this.type = type;
		var fields = [];
		var current = _.find(this.types, function(type) {
			return type.type == this.type;
		}.bind(this));
		if (current && current.fields) {
			fields = current.fields;
		}

		// Remove unwanted regions
		_.each(this.getRegions(), function(region, index) {
			if (index.substring(0, 11) == 'filepicker-') {
				this.removeRegion(index);
			}
		}.bind(this));

		// Add new regions
		_.each(fields, function(field) {
			if (field.type != 'image' && field.type != 'file') return;

			var regName = 'filepicker-' + field.field;
			if (this.getRegion(regName)) return;
			this.addRegion(regName, 'div[data-role="' + regName + '"]');
		}.bind(this));

		// Render new fields
		this.fields = fields;
		this.render();
	},

	onRender: function() {
		// Add file pickers
		_.each(this.fields, function(field) {
			if (field.type != 'image' && field.type != 'file') return;

			var regName = 'filepicker-' + field.field;
			this.showChildView(regName, new FilePickerView({
				fieldname: field.field,
				fieldLabel: field.name,
				type: field.type,
				value: this.post.get(field.field)
			}));
		}.bind(this));
	}
});

module.exports = Marionette.View.extend({
	template: require('../templates/post.html'),
	className: 'container',
	service: 'blog',

	behaviors: [CharCountBehavior, FormBehavior, WysiwygBehavior, Datepicker],

	fields: [
		'title',
		'category_id',
		'media_id',
		'publication_date',
		'is_visible',
		'header',
		'content',
		//'author',
		'has_comments_open',
		'type',
		'text1',
		'text2',
		'text3',
		'text4',
		'text5',
		'text6',
		'text7',
		'text8',
		'text9',
		'text10',
		'text11',
		'text12',
		'text13',
		'text14',
		'text15',
		'slug',
		'meta_title',
		'meta_description',
		'meta_keywords',
		'js_head',
		'js_body'
	],

	regions: {
		layout: {
			el: "article[data-role='layout']",
			replaceElement: true
		},
		categories: {
			el: "select[data-role='categories']",
			replaceElement: true
		},
		type: {
			el: "article[data-role='type']",
			replaceElement: true
		},
		image: {
			el: "div[data-role='image']",
			replaceElement: true
		}
	},

	templateContext: function() {
		return {
			domain: Session.site.get('domain')
		};
	},

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'categories', 'typesSource']);

		this.layoutSelector = new LayoutSelectorView({
			layout_id: this.model.get('layout_id'),
			type: 'blog-post',
			apply: this.model.get('post_id'),
			applyName: this.model.get('title')
		});
	},

	onRender: function() {
		this.showChildView('layout', this.layoutSelector);
		this.showChildView('categories', new SelectView({
			collection: this.categories,
			selected: this.model.get('category_id'),
			name: 'category_id'
		}));
		this.showChildView('type', new TypeSelectorView({
			type: this.model.get('type'),
			post: this.model,
			typesSource: this.typesSource
		}));
		this.showChildView('image', new FilePickerView({
			fieldname: 'media_id',
			fieldLabel: 'Image',
			type: 'image',
			value: this.model.get('thumb') ? this.model.get('thumb').id : ''
		}));
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
	},

	onDelete: function() {
		return this.model.destroy().done(function() {
			this.trigger('delete:post');
		}.bind(this));
	}

});
