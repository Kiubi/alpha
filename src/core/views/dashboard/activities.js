var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');
var format = require('kiubi/utils/format.js');
var moment = require('moment');

var Activities = require('kiubi/core/models/activities.js');

var RowView = Marionette.View.extend({
	template: require('../../templates/dashboard/activities.row.html'),
	className: 'list-item border-0',

	templateContext: function() {

		var type = this.model.get('type');

		if (type == 'comment') {
			type = this.model.get('urn').match(/^\/blog\//) ? 'comment' : 'evaluation';
		}

		return {
			creation_date_fromnow: moment(this.model.get('creation_date'), 'YYYY-MM-DD HH:mm:ss').fromNow(),
			url: this.model.mapUrnToUrl(),
			type: type
		};
	}

});

var NoChildrenView = Marionette.View.extend({
	template: _.template(
		'<span class="list-item-empty"><span class="md-icon md-empty mb-2"></span>Il n\'y a encore rien à afficher</span>'
	)
});

var ListView = Marionette.CollectionView.extend({
	className: 'post-content post-list no-hover ',
	childView: RowView,
	emptyView: NoChildrenView,

	initialize: function(options) {
		this.renderInterval = setInterval(this.render.bind(this), 30 * 1000); // 30 sec
	},

	onBeforeDestroy: function() {
		if (this.renderInterval) clearInterval(this.renderInterval);
	}

});


function fetchPage(collection, page) {
	collection.fetch({
		url: page
	});
}

module.exports = Marionette.View.extend({
	template: require('../../templates/dashboard/activities.html'),

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

	ui: {
		'next': '[data-role="next"]',
		'previous': '[data-role="previous"]'
	},

	events: {
		'click @ui.next': function() {

			if (this.collection.meta.link.next_page) {
				fetchPage(this.collection, this.collection.meta.link.next_page);
			}

		},
		'click @ui.previous': function() {

			if (this.collection.meta.link.previous_page) {
				fetchPage(this.collection, this.collection.meta.link.previous_page);
			}

		}
	},

	initialize: function(options) {

		this.mergeOptions(options, []);

		this.collection = new Activities();

		this.listenTo(this.collection, 'sync', this.onFetch);

		var notificationcenter = Backbone.Radio.channel('app').request('ctx:notificationCenter');
		if (notificationcenter) {
			this.listenTo(notificationcenter, 'notification:comment notification:response notification:order notification:evaluation', function() {
				this.start();
			});
		}

		this.start();
	},

	onRender: function() {

		this.showChildView('list', new ListView({
			collection: this.collection
		}));
	},

	start: function() {

		this.collection.fetch({
			reset: true, // require to resolve merging concurrent requests
			data: {
				'limit': 7
			}
		});
	},

	onFetch: function() {
		var has_next = false;
		var has_previous = false;
		if (this.collection.meta && this.collection.meta.link) {
			has_next = (this.collection.meta.link.next_page != false);
			has_previous = (this.collection.meta.link.previous_page != false);
		}

		if (has_next) {
			this.getUI('next').removeClass('disabled');
		} else {
			this.getUI('next').addClass('disabled');
		}

		if (has_previous) {
			this.getUI('previous').removeClass('disabled');
		} else {
			this.getUI('previous').addClass('disabled');
		}

	}

});
