var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var LayoutSelectorView = require('kiubi/modules/appearance/views/layout.selector');
var SelectView = require('kiubi/views/ui/select.js');
var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');

var Posts = require('../models/posts');

var Session = Backbone.Radio.channel('app').request('ctx:session');
var CharCountBehavior = require('kiubi/behaviors/char_count.js');
var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');


/**
 * Type : Page
 */

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
var ListView = require('kiubi/views/ui/list.js');
PageView = Marionette.View.extend({
	template: require('../templates/page.page.html'),

	behaviors: [CharCountBehavior],

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
		'slug',
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
			type: 'cms-page',
			apply: this.model.get('page_id'),
			applyName: this.model.get('name')
		});
	},

	templateContext: function() {
		return {
			domain: Session.site.get('domain')
		};
	},

	onRender: function() {
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
	}

});

/**
 * Type : Internal Link
 */

InternalLinkView = Marionette.View.extend({
	template: require('../templates/page.internal.html'),

	regions: {
		'type': {
			el: 'select[data-role="type"]',
			replaceElement: true
		}
	},

	ui: {
		'type': "select[name='target_type']",
		'target': "select[name='target_page']"
	},

	events: {
		'change @ui.type': "onChangeType"
	},

	fields: [
		'target_type',
		'target_page'
	],

	onRender: function() {

		this.model.getInternalLinkTypes().done(function() {
			this.changeType(this.model.get('target_type'));
		}.bind(this));

		this.showChildView('type', new SelectView({
			dataSource: this.model.getInternalLinkTypes(),
			selected: this.model.get('target_type'),
			name: 'target_type'
		}));
	},

	onChangeType: function(event) {
		this.changeType(Backbone.$(event.currentTarget).val());
	},

	changeType: function(type) {

		var selected = this.model.get('target_page') + '@@' + this.model.get(
			'target_key');

		this.model.getInternalLinkTargets(type)
			.done(function(targets) {

				var options = _.map(targets, function(target) {
					if (!target.is_linkable) return '<optgroup label="' + (target.name) +
						'" class="disabled"></optgroup>';

					var value = target.target_page + '@@' + target.target_key;
					var indent = '';
					if (target.depth && target.depth > 0) {
						for (var i = 0; i < target.depth; i++) {
							indent = '&nbsp;&nbsp;' + indent;
						}
					}

					return '<option value="' + value + '" ' + (selected == value ?
							'selected="selected"' : '') + '>' + indent + _.escape(target.name) +
						'</option>';
				});

				this.getUI('target').html(options.join(''));

			}.bind(this))
			.fail(function() {
				// TODO
			});
	}


});

/**
 * Type : External
 */

ExternalLinkView = Marionette.View.extend({
	template: require('../templates/page.external.html'),

	fields: [
		'url',
		'url_target'
	]
});


/**
 * Main view
 */
module.exports = Marionette.View.extend({
	template: require('../templates/page.html'),
	className: 'container',
	service: 'cms',

	behaviors: [FormBehavior],

	fields: [
		'name',
		'is_visible',
		'page_type'
	],

	regions: {
		detail: "div[data-role='detail']",
		parent: {
			el: "select[data-role='parent']",
			replaceElement: true
		}
	},

	ui: {
		'parent': "select[name='page_parent_id']",
		'type': "select[name='page_type']",
		'position': "select[name='position']"
	},

	events: {
		'change @ui.parent': 'onSelectParent',
		'change @ui.type': 'changeType'
	},

	parent: null,

	getFields: function() {
		if (this.getChildView('detail') && this.getChildView('detail').fields) {
			return this.fields.concat(this.getChildView('detail').fields);
		}
		return this.fields;
	},

	changeType: function() {
		this.triggerMethod('simpleForm:save');
	},

	onSelectParent: function(event) {
		this.selectParent(Backbone.$(event.currentTarget).val());
	},

	selectParent: function(parent_id) {
		this.parent = parent_id;

		var sibling;
		if (this.parent.toString().match(/^m/g) == 'm') {
			sibling = this.menus.childPages(this.parent.substring(1), 0);
		} else {
			var selected = this.menus.findPage(this.parent);
			sibling = this.menus.childPages(selected.menu_id, selected.page_id);
		}

		var currentPage = this.model.get('page_id');
		// Filter out currentPage from siblings
		sibling = _.filter(sibling, function(page) {
			return page.page_id != currentPage;
		});

		var positions = [];
		if (sibling.length > 0) {
			positions.push('<option value=""> </option>');
			var last = null;
			_.each(sibling, function(page) {
				positions.push('<option value="' + page.page_id +
					'">--- Déplacer ici ---</option>');
				positions.push('<option value="" disabled="disabled">' + page.name +
					'</option>');
				last = page;
			});
			positions.push('<option value="after,' + last.page_id +
				'">--- Déplacer ici ---</option>');

		}

		this.getUI('position').html(positions.join(''));
	},

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'menus']);
	},

	onRender: function() {
		// Complementary Type View
		var view;
		switch (this.model.get('page_type')) {
			case 'page':
				var collection = new Posts();
				collection.page_id = this.model.get('page_id');
				view = new PageView({
					model: this.model,
					collection: collection
				});
				view.start();
				break;
			case 'lien_int':
				view = new InternalLinkView({
					model: this.model
				});
				break;
			case 'lien_ext':
				view = new ExternalLinkView({
					model: this.model
				});
				break;
		}

		if (view) {
			this.showChildView('detail', view);
		}

		// Parent + Position selector
		if (this.model.get('is_home')) {
			return;
		}
		var selected = this.model.get('page_parent_id') == 0 ?
			'm' + this.model.get('menu_id') :
			this.model.get('page_parent_id');

		this.menus.selectPayloadFilter = function(item, page) {
			if (page && page.is_home) return false;
			return item;
		};

		this.menus.fetch({
			data: {
				extra_fields: 'pages'
			}
		}).done(function() {
			this.selectParent(selected);
		}.bind(this));

		this.showChildView('parent', new SelectView({
			collection: this.menus,
			selected: selected,
			name: 'page_parent_id'
		}));
	},

	onSave: function() {
		var data = Forms.extractFields(this.getFields(), this);

		if (this.parent) {
			var position = this.getUI('position').val();
			if (position) {
				if (position.substring(0, 6) == 'after,') {
					data.after_id = position.substr(6);
				} else {
					data.before_id = position;
				}
			} else if (this.parent.toString().match(/^m/g) === null) {
				data.page_parent_id = this.parent;
			} else {
				data.menu_id = this.parent.substring(1);
			}
		}

		if (data.target_page) {
			// split page
			var s = data.target_page.split('@@', 2);
			data.target_page = s[0];
			data.target_key = s[1];
		}

		var that = this;

		return this.model.save(
			data, {
				patch: true,
				wait: true
			}
		).done(function() {
			that.model.fetch().done(function() {
				that.render();
			});
		});
	},

	onDelete: function() {
		return this.model.destroy({
			wait: true
		});
	}
});
