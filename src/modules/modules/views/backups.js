var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var format = require('kiubi/utils/format.js');

var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');

var RowView = Marionette.View.extend({
	template: require('../templates/backups.row.html'),
	className: 'list-item visible-btn',

	behaviors: [RowActionsBehavior],

	templateContext: function() {
		return {
			creation_date: format.formatLongDateTime(this.model.get('creation_date'))
		};
	},

	onActionRestore: function() {
		var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
		navigationController.showOverlay();

		return this.model.restore().done(function(error) {
			if (error != '') {
				navigationController.showErrorModal(error, 4000);
				return;
			}
			navigationController.hideModal();
			this.render();
		}.bind(this)).fail(function(error) {
			navigationController.showErrorModal(error);
		});

	}
});

var ListView = require('kiubi/core/views/ui/list.js');

module.exports = Marionette.View.extend({
	template: require('../templates/backups.html'),
	className: 'container',
	service: 'modules',

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
		this.showChildView('list', new ListView({
			collection: this.collection,
			rowView: RowView,
			title: 'Dernières sauvegardes'
		}));
	},

	start: function() {
		this.collection.fetch();
	}

});
