var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var ListView = require('kiubi/views/ui/list.js');
var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');
var format = require('kiubi/utils/format');

var RowView = Marionette.View.extend({
	template: require('../templates/forms.row.html'),
	className: 'list-item',

	behaviors: [RowActionsBehavior],

	templateContext: function() {
		return {
			creation_date: format.formatDateTime(this.model.get('creation_date'))
		};
	},

	onActionDelete: function() {
		return this.model.destroy();
	}

});

module.exports = Marionette.View.extend({
	template: require('../templates/forms.html'),
	className: 'container',
	service: 'forms',

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

			title: 'Liste des formulaires' // TODO (X sur Y)
		}));
	},

	start: function() {
		this.collection.fetch();
	}
});
