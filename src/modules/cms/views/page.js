var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

var LayoutSelectorView = require('kiubi/modules/appearance/views/layout.selector');
var SelectView = require('kiubi/core/views/ui/select.js');
var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');
var RestrictionsView = require('kiubi/modules/customers/views/restrictions');
var SeoView = require('kiubi/core/views/ui/seo.js');

var Posts = require('../models/posts');
var Restrictions = require('kiubi/modules/customers/models/restrictions');

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
			label: this.model.getLabel(),
			showType: true,
			canMove: true
		};
	}

});
var ListView = require('kiubi/core/views/ui/list.js');
var PageView = Marionette.View.extend({
	template: require('../templates/page.page.html'),

	regions: {
		list: {
			el: "article[data-role='list']",
			replaceElement: true
		},
		layout: {
			el: "article[data-role='layout']",
			replaceElement: true
		},
		restrictions: {
			el: "div[data-role='restrictions']",
			replaceElement: true
		},
		seo: {
			el: "article[data-role='seo']",
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

		if (this.getOption('enableLayout')) {
			this.layoutSelector = new LayoutSelectorView({
				layout_id: this.model.get('layout_id'),
				type: 'cms-page',
				apply: this.model.get('page_id'),
				applyName: this.model.get('name')
			});
		}
	},

	templateContext: function() {
		return {
			enableExtranet: this.getOption('enableExtranet')
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
			scrollThreshold: 920, // TODO
			xtra: [{
				id: 'export',
				extraClassname: 'md-export',
				type: 'button',
				collectionPromise: new CollectionUtils.SelectCollection([{
					'value': 'export-page',
					'label': 'Exporter les billets',
					'selected': false
				}, {
					'value': 'export',
					'label': 'Exporter tout le site web',
					'selected': false
				}])
			}]
		}));
		if (this.getOption('enableLayout')) {
			this.showChildView('layout', this.layoutSelector);
		}
		if (this.getOption('enableExtranet')) {
			this.showChildView('restrictions', new RestrictionsView({
				restrictions: this.model.get('restrictions')
			}));
		}

		// Seo
		if (this.getOption('enableSeo')) {
			this.showChildView('seo', new SeoView({
				slug_prefix: '/',
				model: this.model
			}));
		}
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

	onChildviewChangeRestrictions: function() {
		this.triggerMethod('field:change');
	},

	/* Filters */

	onChildviewFilterChange: function(filter) {
		this.triggerMethod(filter.model.get('id') + ':filter:change', filter);
	},

	onExportFilterChange: function(filter) {

		if (!filter.view) return;
		var view = filter.view;

		if (filter.value == 'export' || filter.value == 'export-page') {

			if (view.collection.length > 2) {
				return;
			}

			view.overrideExtraClassname('md-loading');
			view.render();

			var data = {
				format: 'xls'
			};
			if (filter.value == 'export-page') data.page_id = this.model.get('page_id');

			this.collection.exportAll(data).done(function(data) {
				view.overrideExtraClassname('');
				view.collection.add([{
					value: null,
					label: '---'
				}, {
					value: data.url,
					label: 'Télécharger le fichier',
					extraClassname: 'md-export'
				}]);
				view.toggleDropdown(); // open
			}.bind(this)).fail(function(xhr) {
				var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
				navigationController.showErrorModal(xhr);

				view.overrideExtraClassname('');
				while (view.collection.length > 2) {
					view.collection.pop();
				}
			}.bind(this));

		} else {
			view.toggleDropdown(); // close
			view.overrideExtraClassname('');
			while (view.collection.length > 2) {
				view.collection.pop();
			}
		}
	},

	getRestrictions: function() {
		return this.getChildView('restrictions').getRestrictions();
	}

});

/**
 * Type : Internal Link
 */

var InternalLinkView = Marionette.View.extend({
	template: require('../templates/page.internal.html'),

	regions: {
		'type': {
			el: 'div[data-role="type"]',
			replaceElement: true
		},
		'page': {
			el: 'div[data-role="page"]',
			replaceElement: true
		}
	},

	fields: [
		'target_type',
		'target_page'
	],

	onRender: function() {

		this.showChildView('page', new SelectView({
			selected: this.model.get('target_page') + '@@' + this.model.get('target_key'),
			name: 'target_page',
			direction: 'up'
		}));

		var typesPromise = this.model.getInternalLinkTypes(this.model.get('target_type')).done(function() {
			this.changeType(this.model.get('target_type'));
		}.bind(this));
		this.showChildView('type', new SelectView({
			collectionPromise: typesPromise,
			name: 'target_type',
			direction: 'up'
		}));
	},

	onChildviewChange: function(value, field) {
		if (field == 'target_type') this.changeType(value);
	},

	changeType: function(type) {

		var that = this;

		this.getChildView('page').loadCollection(
			this.model.getInternalLinkTargets(type)
			.then(function(targets) {

				// exclude current page
				if (type == 'cms') {
					targets = _.filter(targets, function(target) {
						return (!target.is_linkable || target.target_key != that.model.get('page_id'));
					});
				}

				var options = _.map(targets, function(target) {
					var value = target.is_linkable ? target.target_page + '@@' + target.target_key : null;
					var indent = 0;
					if (target.depth && target.depth > 0) {
						indent += target.depth;
					}

					return {
						value: value,
						label: target.name,
						indent: type == 'cms' ? indent : null,
						is_group: !target.is_linkable
					};
				});
				return new CollectionUtils.SelectCollection(options);
			}, function() {
				// TODO
				return [];
			})
		);
	}


});

/**
 * Type : External
 */

var ExternalLinkView = Marionette.View.extend({
	template: require('../templates/page.external.html'),

	fields: [
		'url',
		'url_target'
	]
});


/**
 * Type : Parent
 */

var ParentView = Marionette.View.extend({
	template: require('../templates/page.parent.html'),

	ui: {
		'drop': '.dropdown',
		'actionBtn': 'li a',
		'posBtn': 'li .md-before, li .md-after',
		'label': '[data-role="label"]'
	},

	events: {
		'click @ui.actionBtn': function(event) {

			var id = Backbone.$(event.currentTarget).parent().data('value');

			var parent = {
				parent_id: id,
				after_id: null,
				before_id: null
			};

			this.getUI('label').text(this.pageTitle(id));
			this.triggerMethod('select:parent', parent);
		},
		'click @ui.posBtn': function(event) {

			event.preventDefault();

			var id = Backbone.$(event.currentTarget).parent().parent().data('value');

			var parent = {
				parent_id: null,
				after_id: null,
				before_id: null
			};

			var target = Backbone.$(event.target);

			if (target.hasClass('md-before')) {
				parent.before_id = id;
			} else {
				parent.after_id = id;
			}

			this.getUI('label').text(this.parentTitle(id));
			this.triggerMethod('select:parent', parent);

			this.getUI('drop').removeClass('show'); // manually close dropdown
			this.getUI('drop').children('.dropdown-menu').removeClass('show'); // manually close dropdown
			return false; // prevent click @ui.actionBtn from firing
		}
	},

	selected: null,

	initialize: function(options) {
		this.mergeOptions(options, ['collection', 'selected', 'current']);

		this.collection.fetch({
			data: {
				extra_fields: 'pages'
			}
		});

		this.listenTo(this.collection, 'sync', this.render);
	},

	pageTitle: function(id) {

		if (this.collection.length == 0) return ''; // Still loading

		if (id.toString().match(/^m/g) == 'm') {
			id = parseInt(id.substring(1));
			var menu = this.collection.findWhere({
				menu_id: id
			});
			return menu ? menu.get('name') : 'Menu ' + id;
		}

		id = parseInt(id);
		var title = null;
		_.each(this.collection.toJSON(), function(menu) {
			if (menu.pages && title == null) {
				_.each(menu.pages.toJSON(), function(page) {
					if (page.page_id == id) {
						title = menu.name + ' : ' + page.name;
					}
				});
			}
		});

		return title;
	},

	parentTitle: function(id) {

		if (this.collection.length == 0) return ''; // Still loading

		id = parseInt(id);
		var title = null;

		var view = this;

		_.each(this.collection.toJSON(), function(menu) {
			if (menu.pages && title == null) {
				_.each(menu.pages.toJSON(), function(page) {
					if (page.page_id == id) {
						title = view.pageTitle(page.page_parent_id > 0 ? page.page_parent_id : 'm' + page.menu_id);
					}
				});
			}
		});

		return title;
	},

	templateContext: function() {

		return {
			label: this.pageTitle(this.selected),
			selected: this.selected,
			options: this.collection.parentList(this.current),
		};
	}
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
			el: "div[data-role='parent']",
			replaceElement: true
		}
	},

	ui: {
		'type': "select[name='page_type']"
	},

	events: {
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
		if (this.getUI('type').val() == this.model.get('page_type')) return;
		this.triggerMethod('simpleForm:save');
	},

	onChildviewSelectParent: function(value) {
		this.parent = value;
		this.triggerMethod('field:change'); // Explicit change event
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
					collection: collection,
					enableSeo: this.getOption('enableSeo'),
					enableLayout: this.getOption('enableLayout'),
					enableExtranet: this.getOption('enableExtranet')
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

		this.showChildView('parent', new ParentView({
			collection: this.menus,
			selected: selected,
			current: this.model.get('page_id')
		}));
	},

	onChildviewFieldChange: function() {
		// proxy PageView event
		this.triggerMethod('field:change');
	},

	onSave: function() {

		var promise;
		if (this.model.get('page_type') == 'page' && this.getChildView('detail') && this.getOption('enableExtranet')) {
			var r = this.getChildView('detail').getRestrictions();
			var collection = new Restrictions();
			collection.setType('cms/pages', this.model.get('page_id'));
			collection.set('customer_id', r.customers);
			collection.set('group_id', r.groups);
			promise = collection.save();
		} else {
			promise = Backbone.$.Deferred().resolve();
		}

		var data = Forms.extractFields(this.getFields(), this);

		if (this.parent) {
			if (this.parent.after_id) {
				data.after_id = this.parent.after_id;
			} else if (this.parent.before_id) {
				data.before_id = this.parent.before_id;
			} else if (this.parent.parent_id.toString().match(/^m/g) == 'm') {
				data.menu_id = this.parent.parent_id.substring(1);
			} else {
				data.page_parent_id = this.parent.parent_id;
			}
		}

		if (data.target_page) {
			// split page
			var s = data.target_page.split('@@', 2);
			data.target_page = s[0];
			data.target_key = s[1];
		}

		if (this.model.get('page_type') == 'page' && this.getOption('enableSeo') && Forms.isTmpSlug(data.slug)) {
			data.slug = data.name;
		}

		var that = this;

		return promise.then(function() {
			return that.model.save(
				data, {
					patch: true,
					wait: true
				}
			);
		}).done(function() {
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
