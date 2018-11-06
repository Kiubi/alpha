var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var CollectionUtils = require('kiubi/utils/collections.js');
var format = require('kiubi/utils/format.js');
var ClipboardJS = require('clipboard');

var ControllerChannel = Backbone.Radio.channel('controller');
var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');

var Session = Backbone.Radio.channel('app').request('ctx:session');

var RowView = Marionette.View.extend({
	template: require('../templates/files.row.html'),
	className: 'list-item list-media',

	behaviors: [RowActionsBehavior],

	ui: {
		'clipboard': '[data-role="clipboard"]'
	},

	clipboard: null,

	templateContext: function() {
		return {
			last_date: format.formatLongDateTime(this.model.get('modification_date')),
			size: format.formatBytes(this.model.get('weight'), 2),
			convertMediaPath: Session.convertMediaPath.bind(Session),
			is_copy_supported: ClipboardJS.isSupported()
		};
	},

	onAttach: function() {
		if (ClipboardJS.isSupported() && this.getUI('clipboard').length) {
			this.clipboard = new ClipboardJS(this.getUI('clipboard')[0]);
		} else {
			this.clipboard = null;
		}
	},

	onDestroy: function() {
		this.clipboard.destroy();
	},

	onActionDelete: function() {
		return this.model.destroy();
	}
});

var ListView = require('kiubi/core/views/ui/list.js');

module.exports = Marionette.View.extend({
	template: require('../templates/files.html'),
	className: 'container-fluid',
	service: 'media',

	regions: {
		list: {
			el: "article[data-role='list']",
			replaceElement: true
		}
	},

	filters: null,
	sortOrder: '-date',

	initialize: function(options) {
		this.mergeOptions(options, ['collection', 'folders']);
		this.filters = {
			folder_id: null,
			term: this.getOption('filters') && this.getOption('filters').term ? this.getOption('filters').term : null
		};

		this.start();

		// Refetch when files have being uploaded in this folder
		this.listenTo(ControllerChannel, 'uploaded:files',
			function(folder_id) {
				if (folder_id != this.collection.folder_id) {
					return;
				}
				this.start();
			}.bind(this));

		this.listenTo(this.collection, 'sync', this.onSync);
	},

	onRender: function() {

		this.showChildView('list', new ListView({
			collection: this.collection,
			rowView: RowView,

			title: 'Liste des fichiers',
			order: [{
				title: 'Intitulé',
				is_active: false,
				value: 'name'
			}, {
				title: 'Modification',
				is_active: true,
				value: '-date'
			}],
			selection: [{
					title: 'Déplacer',
					callback: this.movePosts.bind(this)
				},
				{
					title: 'Supprimer',
					callback: this.deletePosts.bind(this),
					confirm: true
				}
			],
			filters: [{
				id: 'folder',
				extraClassname: 'select-category',
				title: 'Destination',
				collectionPromise: this.folders.promisedSelect(this.collection.folder_id)
			}, {
				id: 'term',
				title: 'Rechercher',
				type: 'input',
				value: this.filters.term
			}, {
				id: 'export',
				extraClassname: 'md-export',
				type: 'button',
				collectionPromise: new CollectionUtils.SelectCollection([{
					'value': 'export',
					'label': 'Exporter les fichiers',
					'selected': false
				}])
			}]
		}));
	},

	start: function() {

		var data = {
			sort: this.sortOrder ? this.sortOrder : null
		};
		if (this.filters.term) data.term = this.filters.term;

		this.collection.fetch({
			reset: true,
			data: data
		});
	},

	onSync: function(model) {

		if (!(model instanceof Backbone.Model)) { // could be a Backbone.Collection
			return;
		}

		if (model.get('folder_id') != this.collection.folder_id) {
			this.collection.remove(model);
		}
	},

	movePosts: function(ids) {
		if (this.filters.folder_id == '' || this.filters.folder_id == null) return;

		var currentFolder = this.collection.folder_id;

		return this.collection.bulkMove(ids, this.filters.folder_id);
	},

	deletePosts: function(ids) {
		return this.collection.bulkDelete(ids);
	},

	onChildviewFilterChange: function(filter) {

		switch (filter.model.get('id')) {
			case 'folder':
				this.onFolderFilterChange(filter);
				break;
			case 'term':
				this.onTermFilterChange(filter);
				break;
			case 'export':
				this.onExportFilterChange(filter);
				break;
		}

	},

	onFolderFilterChange: function(filter) {
		this.filters.folder_id = filter.value;
		this.start();
	},

	onTermFilterChange: function(filter) {
		this.filters.term = filter.value != '' ? filter.value : null;
		this.start();
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
			this.collection.exportAll({
				folder_id: this.collection.folder_id
			}).done(function(data) {
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

	onChildviewChangeOrder: function(order) {
		this.sortOrder = order;
		this.start();
	}

});
