var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var LayoutSelectorView = require(
	'kiubi/modules/appearance/views/layout.selector.js');

var CharCountBehavior = require('kiubi/behaviors/char_count.js');
var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');
var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');

var ControllerChannel = Backbone.Radio.channel('controller');
var Session = Backbone.Radio.channel('app').request('ctx:session');

var RowView = Marionette.View.extend({
	template: require('../templates/categories.row.html'),
	className: 'list-item',
	templateContext: function() {
		return {
			plural: function(nb, singular, plural) {
				return nb > 1 ? plural : singular;
			},
			preview: Session.site.get('domain') + '/blog/' + this.model.get('slug') + '/'
		};
	},

	behaviors: [RowActionsBehavior],

	onActionDelete: function() {
		return this.model.destroy().done(function() {
			ControllerChannel.trigger('refresh:categories');
		});
	},

	onSortChange: function(data) {
		this.model.save(
			data, {
				patch: true
			}
		).done(function() {
			ControllerChannel.trigger('refresh:categories');
		});
	}

});

var ListView = require('kiubi/views/ui/list.js');

module.exports = Marionette.View.extend({
	template: require('../templates/home.html'),
	className: 'container',
	service: 'blog',

	behaviors: [CharCountBehavior, FormBehavior],

	regions: {
		list: {
			el: "article[data-role='list']",
			replaceElement: true
		},
		layout: {
			el: "article[data-role='layout']",
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
		this.mergeOptions(options, ['collection', 'model']);

		this.layoutSelector = new LayoutSelectorView({
			layout_id: this.model.get('layout_id'),
			type: 'blog-category', // like a category
			apply: 0,
			applyName: this.model.get('name')
		});
	},

	onRender: function() {
		this.showChildView('list', new ListView({
			collection: this.collection,
			rowView: RowView,

			title: 'Liste des catégories',
			selection: [{
				title: 'Afficher',
				callback: this.showCategories.bind(this)
			}, {
				title: 'Masquer',
				callback: this.hideCategories.bind(this)
			}, {
				title: 'Supprimer',
				callback: this.deleteCategories.bind(this),
				confirm: true
			}],
			scrollThreshold: 920

		}));
		this.showChildView('layout', this.layoutSelector);
	},

	start: function() {
		this.collection.fetch();
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

	showCategories: function(ids) {
		return this.collection.bulkShow(ids).done(function() {
			ControllerChannel.trigger('refresh:categories');
		});
	},

	hideCategories: function(ids) {
		return this.collection.bulkHide(ids).done(function() {
			ControllerChannel.trigger('refresh:categories');
		});
	},

	deleteCategories: function(ids) {
		return this.collection.bulkDelete(ids).done(function() {
			ControllerChannel.trigger('refresh:categories');
		});
	}

});
