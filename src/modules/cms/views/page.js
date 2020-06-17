var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

var LayoutSelectorView = require('kiubi/modules/appearance/views/layout.selector');
var SelectView = require('kiubi/core/views/ui/select.js');
var FormBehavior = require('kiubi/behaviors/simple_form.js');
var SaveBehavior = require('kiubi/behaviors/save_detection.js');
var Forms = require('kiubi/utils/forms.js');
var RestrictionsView = require('kiubi/modules/customers/views/restrictions');
var SeoView = require('kiubi/core/views/ui/seo.js');

var Contents = require('../models/contents');
var Restrictions = require('kiubi/modules/customers/models/restrictions');

/**
 * Type : Page
 */

var ContentsView = require('./contents.js');
var PageView = Marionette.View.extend({
	template: require('../templates/page.page.html'),

	regions: {
		list: {
			el: "article[data-role='list']",
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
		this.mergeOptions(options, ['model', 'contents']);
	},

	templateContext: function() {
		return {
			enableExtranet: this.getOption('enableExtranet')
		};
	},

	onRender: function() {
		this.showChildView('list', new ContentsView({
			zoneList: this.model.get('zones') || [],
			collection: this.contents,
			enableZones: this.getOption('enableZones'),

			title: 'Contenu de la page',
			selection: [{
				title: 'Afficher',
				callback: this.showContents.bind(this)
			}, {
				title: 'Masquer',
				callback: this.hideContents.bind(this)
			}, {
				title: 'Supprimer',
				callback: this.deleteContents.bind(this),
				confirm: true
			}],
			scrollThreshold: 920, // TODO
			xtra: [{
				id: 'export',
				extraClassname: 'md-export',
				type: 'button',
				collectionPromise: new CollectionUtils.SelectCollection([{
					'value': 'export-page',
					'label': 'Exporter les contenus',
					'selected': false
				}])
			}]
		}));
		if (this.getOption('enableExtranet')) {
			this.showChildView('restrictions', new RestrictionsView({
				restrictions: this.model.get('restrictions')
			}));
		}

		// Seo
		if (this.getOption('enableSeo')) {
			this.showChildView('seo', new SeoView({
				model: this.model
			}));
		}
	},

	start: function() {
		this.contents.fetch({
			data: {
				limit: 40
			}
		});
	},

	showContents: function(ids) {
		return this.contents.bulkShow(ids);
	},

	hideContents: function(ids) {
		return this.contents.bulkHide(ids);
	},

	deleteContents: function(ids) {
		return this.contents.bulkDelete(ids);
	},

	onAddSymbol: function() {
		// Refetch collection when a new symbol is added
		this.start();
	},

	onChildviewSortChange: function(data) {
		this.contents.reOrder(this.model.get('page_id'), data.list);
	},

	/* Filters */

	onChildviewFilterChange: function(filter) {
		this.triggerMethod(filter.model.get('id') + ':filter:change', filter);
	},

	onExportFilterChange: function(filter) {

		if (!filter.view) return;
		var view = filter.view;

		if (filter.value == 'export-page') {

			if (view.collection.length > 2) {
				return;
			}

			view.overrideExtraClassname('md-loading');
			view.render();

			var data = {
				container_id: this.model.get('page_id'),
				container_type: 'page'
			};

			this.contents.exportAll(data).done(function(data) {
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
			}.bind(this)).fail(function(error) {
				var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
				navigationController.showErrorModal(error);

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

	behaviors: [SaveBehavior],

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
			this.triggerMethod('field:change');
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
	className: 'container container-large',
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
		},
		layout: {
			el: "article[data-role='layout']",
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

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'menus']);
	},

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
	},

	onRender: function() {
		// Complementary Type View
		var view;
		switch (this.model.get('page_type')) {
			case 'page':
				var collection = new Contents();
				collection.page_id = this.model.get('page_id');
				view = new PageView({
					model: this.model,
					contents: collection,
					enableSeo: this.getOption('enableSeo'),
					enableExtranet: this.getOption('enableExtranet'),
					enableZones: this.getOption('enableZones')
				});
				view.start();
				if (this.getOption('enableLayout')) {
					this.showChildView('layout', new LayoutSelectorView({
						layout_id: this.model.get('layout_id'),
						type: 'cms-page',
						apply: this.model.get('page_id'),
						applyName: this.model.get('name')
					}));
				}
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

	onChildviewChangeLayout: function(layout_id, model) {
		if (layout_id == this.model.get('layout_id')) return;

		this.model.save({
			layout_id: layout_id
		}, {
			patch: true
		}).done(function() {
			if (this.model.get('page_type') !== 'page' || !this.getChildView('detail')) {
				return;
			}
			this.getChildView('detail').getChildView('list').resetZones(model.get('model').zones);
		}.bind(this));
	},


	onAddSymbol: function() {
		// a symbol has been added, need to refetch content
		if (this.model.get('page_type') == 'page' && this.getChildView('detail')) {
			this.getChildView('detail').onAddSymbol();
		}
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
