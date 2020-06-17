var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');
var Forms = require('kiubi/utils/forms.js');
var CollectionUtils = require('kiubi/utils/collections.js');

var RowView = Marionette.View.extend({
	template: require('../templates/l10n.row.html'),
	className: 'list-item',

	behaviors: [RowActionsBehavior],

	ui: {
		'list': 'div[data-role="list"]',
		'form': 'form[data-role="edit"]',
		'errors': 'div[data-role="errors"]'
	},

	onActionDelete: function() {
		return this.model.save({
			msgstr: ''
		}, {
			patch: false, // send msgstr AND msgid
			wait: true
		}).fail(function(error) {
			Forms.displayErrors(error, this.getUI('errors'), this.el);
		}.bind(this));
	},

	onActionSave: function() {

		return this.model.save(
			Forms.extractFields(['msgstr'], this), {
				patch: false, // send msgstr AND msgid
				wait: true
			}
		).fail(function(error) {
			Forms.displayErrors(error, this.getUI('errors'), this.el);
		}.bind(this));
	}

});

var ListView = require('kiubi/core/views/ui/list.js');

module.exports = Marionette.View.extend({
	template: require('../templates/l10n.html'),
	className: 'container-fluid',
	service: 'prefs',

	initialize: function(options) {
		this.mergeOptions(options, ['collection']);
	},

	regions: {
		list: {
			el: "article[data-role='list']",
			replaceElement: true
		}
	},

	onRender: function() {

		var c = new CollectionUtils.SelectCollection();
		c.add({
			'value': 'export',
			'label': 'Exporter les traductions',
			'selected': false
		});

		this.showChildView('list', new ListView({
			collection: this.collection,
			rowView: RowView,

			title: 'Liste des traductions',
			filters: [{
				id: 'term',
				title: 'Rechercher',
				type: 'input',
				value: ''
			}, {
				id: 'export',
				extraClassname: 'md-export',
				title: 'Export',
				type: 'button',
				collectionPromise: c
			}]
		}));
	},

	start: function() {
		this.collection.fetch({
			reset: true
		});
	},

	onChildviewFilterChange: function(filter) {
		if (filter.model.get('id') == 'export') {
			this.onExportFilterChange(filter);
		} else {
			this.onSearchFilterChange(filter);
		}
	},

	onExportFilterChange: function(filter) {

		if (!filter.view) return;
		var view = filter.view;

		if (filter.value == 'export') {

			if (view.collection.length > 1) {
				return;
			}

			view.overrideExtraClassname('md-loading');
			view.render();

			this.collection.exportAll().done(function(data) {

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
				while (view.collection.length > 1) {
					view.collection.pop();
				}
			}.bind(this));

		} else {
			view.toggleDropdown(); // close
			view.overrideExtraClassname('');
			while (view.collection.length > 1) {
				view.collection.pop();
			}
		}

	},

	onSearchFilterChange: function(filter) {
		this.collection.fetch({
			reset: true,
			data: {
				term: filter.value
			}
		});
	}

});
