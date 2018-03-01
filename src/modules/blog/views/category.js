var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var LayoutSelectorView = require(
	'kiubi/modules/appearance/views/layout.selector.js');

var CharCountBehavior = require('kiubi/behaviors/char_count.js');
var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');

var Session = Backbone.Radio.channel('app').request('ctx:session');

module.exports = Marionette.View.extend({
	template: require('../templates/category.html'),
	className: 'container',
	service: 'blog',

	behaviors: [CharCountBehavior, FormBehavior],

	regions: {
		layout: {
			el: "article[data-role='layout']",
			replaceElement: true
		}
	},

	fields: [
		'name',
		'is_visible',
		'slug',
		'meta_title',
		'meta_description',
		'meta_keywords',
		'js_head',
		'js_body'
	],

	templateContext: function() {
		return {
			domain: Session.site.get('domain')
		};
	},

	initialize: function(options) {
		this.mergeOptions(options, ['model']);

		this.layoutSelector = new LayoutSelectorView({
			layout_id: this.model.get('layout_id'),
			type: 'blog-category',
			apply: this.model.get('category_id'),
			applyName: this.model.get('name')
		});

		this.listenTo(this.model, 'change', this.render);
	},

	onBeforeRender: function() {
		if (this.layoutSelector.isAttached()) {
			this.detachChildView('layout');
		}
	},

	onRender: function() {
		this.showChildView('layout', this.layoutSelector);
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
		return this.model.destroy({
			wait: true
		});
	}

});
