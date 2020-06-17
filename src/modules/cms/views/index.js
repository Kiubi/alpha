var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var CollectionUtils = require('kiubi/utils/collections.js');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');

var LayoutSelectorView = require('kiubi/modules/appearance/views/layout.selector');
var SeoView = require('kiubi/core/views/ui/seo.js');

var Forms = require('kiubi/utils/forms.js');
var Contents = require('../models/contents');

var ContentsView = require('./contents.js');

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
		this.mergeOptions(options, ['model', 'contents']);

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
		this.contents = new Contents();
		this.contents.page_id = this.model.get('page_id');

		this.showChildView('list', new ContentsView({
			zoneList: this.model.get('zones'),
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

	onChildviewChangeLayout: function(layout_id, model) {
		if (layout_id == this.model.get('layout_id')) return;

		this.model.save({
			layout_id: layout_id
		}, {
			patch: true
		}).done(function() {
			this.getChildView('list').resetZones(model.get('model').zones);
		}.bind(this));
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

			if (view.collection.length > 1) {
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

	onAddSymbol: function() {
		// a symbol has been added, need to refetch content
		this.start();
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
