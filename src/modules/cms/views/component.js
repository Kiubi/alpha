var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var Forms = require('kiubi/utils/forms.js');
var _ = require('underscore');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var WysiwygBehavior = require('kiubi/behaviors/tinymce.js');
var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');
var SelectifyBehavior = require('kiubi/behaviors/selectify.js');
var FilePickerView = require('kiubi/modules/media/views/file.picker.js');

var SelectView = require('kiubi/core/views/ui/select.js');
var ListView = require('kiubi/core/views/ui/list.js');

var NewRowView = Marionette.View.extend({
	template: require('../templates/items.new.html'),
	className: 'post-content post-list',

	behaviors: [RowActionsBehavior, WysiwygBehavior],

	ui: {
		'form': 'form[data-role="new"]',
		'errors': 'div[data-role="errors"]'
	},

	type: null,

	initialize: function(options) {
		this.mergeOptions(options, ['type', 'content_id']);
	},

	templateContext: function() {
		return {
			item_id: 'new',
			collection: this.type.collection
		};
	},

	onRender: function() {
		_.each(this.type.collection, function(field) {
			if (field.type != 'image' && field.type != 'file') return;

			var regName = 'filepicker-' + field.field;
			if (!this.getRegion(regName)) {
				this.addRegion(regName, 'div[data-role="' + regName + '"]');
			}

			this.showChildView(regName, new FilePickerView({
				fieldname: field.field,
				fieldLabel: field.name,
				type: field.type,
				comment: field.help ? field.help : null
			}));
		}.bind(this));
	},

	onActionSave: function() {
		var data = Forms.extractFields(['is_visible'], this);
		data.fields = Forms.extractFields(_.reduce(this.type.collection, function(acc, field) {
			acc.push(field.field);
			return acc;
		}, []), this, {
			autoCast: false
		});

		var m = new this.collection.model();
		m.set('content_id', this.content_id);
		return m.save(data)
			.done(function() {
				this.getUI('form').hide();
				this.collection.add(m);
				this.$el.find('input[type=text]').val('');
			}.bind(this))
			.fail(function(error) {
				Forms.displayErrors(error, this.getUI('errors'), this.el);
			}.bind(this));
	}

});

var RowView = Marionette.View.extend({
	template: require('../templates/items.row.html'),
	className: 'list-item',

	behaviors: [RowActionsBehavior, SelectifyBehavior, WysiwygBehavior],

	ui: {
		'list': 'div[data-role="list"]',
		'form': 'form[data-role="edit"]',
		'errors': 'div[data-role="errors"]'
	},

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'type', 'content_id']);
	},

	templateContext: function() {
		return {
			collection: this.type.collection,
			label: this.model.getLabel()
		};
	},

	onRender: function() {
		_.each(this.type.collection, function(field) {
			if (field.type != 'image' && field.type != 'file') return;

			var regName = 'filepicker-' + field.field;
			if (!this.getRegion(regName)) {
				this.addRegion(regName, 'div[data-role="' + regName + '"]');
			}

			this.showChildView(regName, new FilePickerView({
				fieldname: field.field,
				fieldLabel: field.name,
				type: field.type,
				value: this.model.get('fields')[field.field],
				comment: field.help ? field.help : null
			}));
		}.bind(this));
	},

	onActionDelete: function() {
		return this.model.destroy();
	},

	onActionSave: function() {
		var data = Forms.extractFields(['is_visible'], this);
		data.fields = Forms.extractFields(_.reduce(this.type.collection, function(acc, field) {
			acc.push(field.field);
			return acc;
		}, []), this, {
			autoCast: false
		});

		return this.model.save(
			data, {
				patch: true,
				wait: true
			}
		).fail(function(error) {
			Forms.displayErrors(error, this.getUI('errors'), this.el);
		}.bind(this));
	}

});

module.exports = Marionette.View.extend({
	template: require('../templates/component.html'),
	className: 'container container-large',
	service: 'cms',

	behaviors: [FormBehavior, WysiwygBehavior],

	regions: {
		page: {
			el: 'div[data-role="page"]',
			replaceElement: true
		},
		list: {
			el: "article[data-role='list']",
			replaceElement: true
		}
	},

	ui: {
		'form': 'form'
	},

	fields: [
		'title',
	],

	type: null,

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'content', 'container', 'collection', 'menus', 'type']);
	},

	templateContext: function() {
		return {
			type: this.type, // TODO not safe
			'is_visible': this.content.get('is_visible'),
			'container': this.container.get('page_id') ? 'page' : 'symbol'
		};
	},

	onRender: function() {

		// If container is a page
		if (this.menus) {
			this.showChildView('page', new SelectView({
				collection: this.menus,
				selected: this.container.get('page_id'),
				name: 'page_id'
			}));
			this.menus.fetch({
				data: {
					extra_fields: 'pages'
				}
			});
			this.menus.selectPayloadFilter = function(item, page) {
				if (page == null || page.page_type != 'page') {
					item.is_group = true;
				}
				return item;
			};
		}

		if (this.type.has_collection) {
			var listView = new ListView({
				collection: this.collection,
				rowView: RowView,
				newRowView: NewRowView,
				fixRelativeDragNDrop: true,
				enableQuota: true,
				childViewOptions: {
					type: this.type,
					content_id: this.model.get('content_id')
				},

				title: 'Contenu de la collection',
				selection: [{
					title: 'Afficher',
					callback: this.showItems.bind(this)
				}, {
					title: 'Masquer',
					callback: this.hideItems.bind(this)
				}, {
					title: 'Supprimer',
					callback: this.deleteItems.bind(this),
					confirm: true
				}],
				scrollThreshold: 920, // TODO
			});

			this.showChildView('list', listView);

			this.collection.fetch({
				data: {
					limit: 24,
					extra_fields: 'fields'
				}
			});
		}

		_.each(this.type.fields, function(field) {
			if (field.type != 'image' && field.type != 'file') return;

			var regName = 'filepicker-' + field.field;
			if (!this.getRegion(regName)) {
				this.addRegion(regName, 'div[data-role="' + regName + '"]');
			}

			this.showChildView(regName, new FilePickerView({
				fieldname: field.field,
				fieldLabel: field.name,
				type: field.type,
				value: this.model.get('fields')[field.field],
				comment: field.help ? field.help : null
			}));
		}.bind(this));

	},

	showItems: function(ids) {
		return this.collection.bulkShow(ids);
	},

	hideItems: function(ids) {
		return this.collection.bulkHide(ids);
	},

	deleteItems: function(ids) {
		return this.collection.bulkDelete(ids);
	},

	onChildviewSortChange: function(data) {
		this.collection.reOrder(data.list);
	},

	onPageChange: function(page_id) {
		this.container.clear({
			silent: true
		});
		this.container.set('page_id', page_id);
		this.container.fetch();
	},

	onSave: function() {

		if (this.type.has_collection && this.getChildView('list')) {
			this.getChildView('list').getChildren().each(function(rowView) {
				if (rowView.isEditing) {
					rowView.onActionSave();
				}
			});
		}

		var contentData = Forms.extractFields(['is_visible'], this, {
			selector: 'form[data-role="part"]'
		});
		if (this.container.get('page_id')) {
			if (this.container.get('page_id') != this.getChildView('page').selected) {
				contentData.container_id = this.getChildView('page').selected;
				this.onPageChange(contentData.container_id);
			}
		}

		var data = {};
		var fields = this.fields;
		_.reduce(this.type.fields, function(acc, field) {
			acc.push(field.field);
			return acc;
		}, fields);
		data.fields = Forms.extractFields(fields, this, {
			selector: 'form[data-role="part"]',
			autoCast: false
		});
		return Backbone.$.when(
			this.content.save(contentData, {
				patch: true,
				wait: true
			}),
			this.model.save(data, {
				patch: true,
				wait: true
			})
		);
	},

	onDelete: function() {
		return this.content.destroy({
			wait: true
		});
	}

});
