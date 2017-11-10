var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var moment = require('moment');
var _string = require('underscore.string');

var RowActionsBehavior = require('../../../behaviors/ui/row_actions');

var RowView = Marionette.View.extend({
	template: require('../templates/files.row.html'),
	className: 'list-item list-media',
	templateContext: function() {
		var last = this.model.get('modification_date') > 0 ?
			this.model.get('modification_date') : this.model.get('creation_date');
		return {
			last_date: moment(new Date(last)).format('DD/MM/YYYY hh:mm:ss'),
			size: this.formatBytes(this.model.get('weight'), 2)
		}
	},

	formatBytes: function(bytes, decimals) {
		if (bytes == 0) return '0 octets';
		var k = 1000,
			dm = decimals || 2,
			sizes = ['octets', 'Ko', 'Mo', 'Go'],
			i = Math.floor(Math.log(bytes) / Math.log(k));
		return _string.numberFormat(bytes / Math.pow(k, i), dm, ',', ' ') + ' ' +
			sizes[i];
	},

	behaviors: [RowActionsBehavior],

	onActionDelete: function() {
		return this.model.destroy();
	}
});

var ListView = require('../../../views/ui/list');

module.exports = Marionette.View.extend({
	template: require('../templates/files.html'),
	className: 'container',
	service: 'media',

	initialize: function(options) {
		this.mergeOptions(options, ['collection']);
		this.collection.fetch();
	},

	regions: {
		list: {
			el: "article[data-role='list']",
			replaceElement: true
		}
	},

	onRender: function() {
		this.showChildView('list', new ListView({
			collection: this.collection,
			rowView: RowView,

			title: 'Liste des fichiers',
			order: [{
				title: 'Fichier',
				is_active: true,
				data: {
					sort: 'name'
				}
			}, {
				title: 'Modification',
				is_active: false,
				data: {
					sort: '-date'
				}
			}],
			selection: [
				/*{
								title: 'Déplacer',
								callback: this.showPosts.bind(this)
							}, {
								title: 'Télécharger',
								callback: this.hidePosts.bind(this)
							},*/
				{
					title: 'Supprimer',
					callback: this.deletePosts.bind(this),
					confirm: true
				}
			]
			/*,
						filters: [{
							selectExtraClassname: 'select-category',
							title: 'Destination',
							collection: this.getOption('categories'),
							selected: this.collection.category_id
						}]*/
		}));
	},

	deletePosts: function(ids) {
		return this.collection.bulkDelete(ids);
	}

});
