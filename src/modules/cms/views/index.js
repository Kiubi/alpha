var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var CharCountBehavior = require('kiubi/behaviors/char_count.js');
var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');

var LayoutSelectorView = require(
	'kiubi/modules/appearance/views/layout.selector');

var Forms = require('kiubi/utils/forms.js');

var Posts = require('../models/posts');

var ListView = require('kiubi/views/ui/list.js');

var RowView = Marionette.View.extend({
	template: require('../templates/posts.row.html'),
	className: 'list-item',

	behaviors: [RowActionsBehavior],

	onActionDelete: function() {
		return this.model.destroy();
	},

	templateContext: function() {
		return {
			label: this.model.getLabel()
		};
	}

});


module.exports = Marionette.View.extend({
	template: require('../templates/index.html'),
	className: 'container',
	service: 'cms',

	behaviors: [FormBehavior, CharCountBehavior],

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
		this.mergeOptions(options, ['model', 'collection']);

		this.layoutSelector = new LayoutSelectorView({
			layout_id: this.model.get('layout_id'),
			type: 'cms-home',
			apply: this.model.get('page_id'),
			applyName: this.model.get('name')
		});
	},

	onRender: function() {
		this.collection = new Posts();
		this.collection.page_id = this.model.get('page_id');

		this.showChildView('list', new ListView({
			collection: this.collection,
			rowView: RowView,

			title: 'Liste des billets',
			selection: [{
				title: 'Afficher',
				callback: this.showPosts.bind(this)
			}, {
				title: 'Masquer',
				callback: this.hidePosts.bind(this)
			}, {
				title: 'Supprimer',
				callback: this.deletePosts.bind(this),
				confirm: true
			}],
			scrollThreshold: 920 // TODO

		}));
		this.showChildView('layout', this.layoutSelector);
	},

	start: function() {
		this.collection.fetch();
	},

	showPosts: function(ids) {
		return this.collection.bulkShow(ids);
	},

	hidePosts: function(ids) {
		return this.collection.bulkHide(ids);
	},

	deletePosts: function(ids) {
		return this.collection.bulkDelete(ids);
	},

	onChildviewChangeLayout: function(layout_id) {
		if (layout_id == this.model.get('layout_id')) return;

		this.model.save({
			layout_id: layout_id
		}, {
			patch: true
		});
	},

	onChildviewSortChange: function(data) {
		this.collection.reOrder(this.model.get('page_id'), data.list);
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
