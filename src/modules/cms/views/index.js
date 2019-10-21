var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var CollectionUtils = require('kiubi/utils/collections.js');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');

var LayoutSelectorView = require('kiubi/modules/appearance/views/layout.selector');
var SeoView = require('kiubi/core/views/ui/seo.js');

var Forms = require('kiubi/utils/forms.js');
var Posts = require('../models/posts');

var ListView = require('kiubi/core/views/ui/list.js');

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


module.exports = Marionette.View.extend({
	template: require('../templates/index.html'),
	className: 'container container-large',
	service: 'cms',

	behaviors: [FormBehavior],

	regions: {
		list: {
			el: "article[data-role='list']",
			replaceElement: true
		},
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
		this.mergeOptions(options, ['model', 'collection']);

		if (this.getOption('enableLayout')) {
			this.layoutSelector = new LayoutSelectorView({
				layout_id: this.model.get('layout_id'),
				type: 'cms-home',
				apply: this.model.get('page_id'),
				applyName: this.model.get('name')
			});
		}
	},

	onRender: function() {
		this.collection = new Posts();
		this.collection.page_id = this.model.get('page_id');

		this.showChildView('list', new ListView({
			collection: this.collection,
			rowView: RowView,
			fixRelativeDragNDrop: true,

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
		// Seo
		if (this.getOption('enableSeo')) {
			this.showChildView('seo', new SeoView({
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

	onSave: function() {
		return this.model.save(
			Forms.extractFields(this.fields, this), {
				patch: true,
				wait: true
			}
		);
	}

});
