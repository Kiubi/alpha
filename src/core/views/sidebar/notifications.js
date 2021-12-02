var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');
var moment = require('moment');

var Activities = require('kiubi/core/models/activities.js');

var RowView = Marionette.View.extend({
	template: _.template('<a class="dropdown-item py-3" href="<%- url %>" title=""><span><div class="md-icon md-activity-<%- type %> mr-3"></div></span><span><%- text %><br/><small><%- creation_date_fromnow %></small></span></a>'),
	className: '',

	templateContext: function() {

		var type = this.model.get('type');

		if (type == 'comment') {
			type = this.model.get('urn').match(/^\/blog\//) ? 'comment' : 'evaluation';
		}

		return {
			creation_date_fromnow: moment(this.model.get('creation_date'), 'YYYY-MM-DD HH:mm:ss').fromNow(),
			url: this.model.mapUrnToUrl() || '#',
			type: type
		};
	}

});

var NoChildrenView = Marionette.View.extend({
	template: _.template(
		'<span class="list-item-empty">Il n\'y a encore rien à afficher</span>'
	)
});

var ListView = Marionette.CollectionView.extend({
	childView: RowView,
	emptyView: NoChildrenView,

	initialize: function(options) {
		this.renderInterval = setInterval(this.render.bind(this), 30 * 1000); // 30 sec
	},

	onBeforeDestroy: function() {
		if (this.renderInterval) clearInterval(this.renderInterval);
	}

});

module.exports = Marionette.View.extend({

	template: _.template('<div class="dropdown-item-text py-3"><strong>Notifications récentes</strong></div><div data-role="list"></div>'),

	className: 'dropdown-menu mb-2',

	regions: {
		'list': {
			el: '[data-role="list"]',
			replaceElement: true
		}
	},

	initialize: function(options) {
		this.collection = new Activities();
	},

	onRender: function() {
		this.showChildView('list', new ListView({
			collection: this.collection
		}));
	},

	fetch: function() {
		this.collection.fetch({
			reset: true,
			data: {
				limit: 10,
				type: 'comment,checkout,form'
			}
		}).done(function() {
			this.$el.siblings().dropdown('update');
		}.bind(this));
	}

});
