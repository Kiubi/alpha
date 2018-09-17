var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');

var RowView = Marionette.View.extend({
	template: require('../templates/options.row.html'),
	className: 'list-item',

	behaviors: [RowActionsBehavior],

	templateContext: function() {

		var type_label;
		switch (this.model.get('type')) {
			case 'simple':
				type_label = 'Option simple';
				break;
			case 'textarea':
				type_label = 'Zone de texte';
				break;
			case 'select':
				type_label = 'Liste de valeurs';
				break;
			default:
				break;
		}

		return {
			is_supported: this.model.isSupported(),
			type_label: type_label
		};
	},

	onActionDelete: function() {
		return this.model.destroy();
	}

});

var ListView = require('kiubi/views/ui/list.js');

module.exports = Marionette.View.extend({
	template: require('../templates/options.html'),
	className: 'container',
	service: 'checkout',

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

			title: 'Liste des options'
		}));
	},

	start: function() {
		this.collection.fetch({
			reset: true,
			data: {
				extra_fields: 'price_label'
			}
		});
	},

	onChildviewSortChange: function(data) {
		this.collection.reOrder(data.list);
	}
});
