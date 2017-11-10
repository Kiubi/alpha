var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var format = require('kiubi/utils/format.js');

var ControllerChannel = Backbone.Radio.channel('controller');
var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');

var Session = Backbone.Radio.channel('app').request('ctx:session');

var RowView = Marionette.View.extend({
	template: require('../templates/files.row.html'),
	className: 'list-item list-media',
	templateContext: function() {
		return {
			last_date: format.formatDateTime(this.model.get('modification_date')),
			size: format.formatBytes(this.model.get('weight'), 2),
			convertMediaPath: Session.convertMediaPath.bind(Session)
		};
	},

	behaviors: [RowActionsBehavior],

	onActionDelete: function() {
		return this.model.destroy();
	}
});

var ListView = require('kiubi/views/ui/list.js');

module.exports = Marionette.View.extend({
	template: require('../templates/files.html'),
	className: 'container-fluid',
	service: 'media',

	initialize: function(options) {
		this.mergeOptions(options, ['collection']);
		this.collection.fetch({
			data: {
				sort: '-date'
			}
		});

		// Refetch when files have being uploaded in this folder
		this.listenTo(ControllerChannel, 'uploaded:files',
			function(folder_id) {
				if (folder_id != this.collection.folder_id) {
					return;
				}
				this.collection.fetch({
					data: {
						sort: '-date'
					}
				});
			}.bind(this));

		this.listenTo(this.collection, 'sync', this.onSync);
	},

	onSync: function(model) {

		if (!(model instanceof Backbone.Model)) { // could be a Backbone.Collection
			return;
		}

		if (model.get('folder_id') != this.collection.folder_id) {
			this.collection.remove(model);
		}
	},

	regions: {
		list: {
			el: "article[data-role='list']",
			replaceElement: true
		}
	},

	filterFolderID: null,

	onRender: function() {
		this.showChildView('list', new ListView({
			collection: this.collection,
			rowView: RowView,

			title: 'Liste des fichiers',
			order: [{
				title: 'Intitulé',
				is_active: false,
				data: {
					sort: 'name'
				}
			}, {
				title: 'Modification',
				is_active: true,
				data: {
					sort: '-date'
				}
			}],
			selection: [{
					title: 'Déplacer',
					callback: this.movePosts.bind(this)
				},
				/*, {
					title: 'Télécharger',
					callback: this.hidePosts.bind(this)
				},*/
				{
					title: 'Supprimer',
					callback: this.deletePosts.bind(this),
					confirm: true
				}
			],
			filters: [{
				selectExtraClassname: 'select-category',
				title: 'Destination',
				collection: this.getOption('folders'),
				selected: null //this.collection.folder_id
			}]
		}));
	},

	onChildviewFilterChange: function(filter) {
		this.filterFolderID = filter.value;
	},

	movePosts: function(ids) {
		if (this.filterFolderID == '' || this.filterFolderID == null) return;

		var currentFolder = this.collection.folder_id;

		return this.collection.bulkMove(ids, this.filterFolderID);
	},

	deletePosts: function(ids) {
		return this.collection.bulkDelete(ids);
	}

});
