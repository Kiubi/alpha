var Marionette = require('backbone.marionette');
var _ = require('underscore');
var format = require('kiubi/utils/format.js');
var moment = require('moment');

var Orders = require('kiubi/modules/checkout/models/orders.js');

var RowView = Marionette.View.extend({
	template: require('../../templates/dashboard/orders.row.html'),
	className: 'list-item list-item-sm',


	templateContext: function() {

		var creation_date = moment(this.model.get('creation_date'), 'YYYY-MM-DD HH:mm:ss');
		var diff = moment().diff(creation_date, 'days');

		var creation_date_fromnow;
		if (diff >= 1) {
			creation_date_fromnow = format.formatLongDateTime(this.model.get('creation_date'));
		} else {
			creation_date_fromnow = creation_date.fromNow();
		}

		return {
			creation_date_fromnow: creation_date_fromnow
		};
	}

});

var NoChildrenView = Marionette.View.extend({
	template: _.template(
		'<span class="list-item-empty"><span class="md-icon md-empty mb-2"></span>Il n\'y a encore rien à afficher</span>'
	)
});

var ListView = Marionette.CollectionView.extend({
	className: 'post-content post-list',
	childView: RowView,
	emptyView: NoChildrenView
});

module.exports = Marionette.View.extend({
	template: require('../../templates/dashboard/orders.html'),

	attributes: function() {
		return {
			class: 'col-12 col-lg-' + this.model.get('size') + ' order-lg-' + this.model.get('order') + ' d-flex'
		};
	},

	regions: {
		list: {
			el: "div[data-role='list']",
			replaceElement: true
		}
	},

	initialize: function(options) {

		this.mergeOptions(options, []);

		this.collection = new Orders();

		this.start();
	},

	onRender: function() {

		this.showChildView('list', new ListView({
			collection: this.collection
		}));

	},

	start: function(term) {

		this.collection.fetch({
			reset: true, // require to resolve merging concurrent requests
			data: {
				'limit': 5,
				'sort': '-date',
				extra_fields: 'price_label'
			}
		});

	}

});
