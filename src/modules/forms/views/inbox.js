var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var CollectionUtils = require('kiubi/utils/collections.js');
var _ = require('underscore');
var format = require('kiubi/utils/format.js');

var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');

var DetailView = Marionette.View.extend({
	template: require('../templates/inbox.detail.html'),
	className: 'post-content answer-detail',

	templateContext: function() {
		return {
			'response_id': this.model ? this.model.get('response_id') : '',
			creation_date: format.formatDateTime(this.model.get('creation_date')),
			nl2br: function(text) {
				return _.escape('' + text).replace(/(\r\n|\n\r|\r|\n)+/g, '<br />');
			}
		};
	},

	showDetail: function(model) {
		this.model = model;
		this.render();
	}

});

var RowView = Marionette.View.extend({
	template: require('../templates/inbox.row.html'),
	className: 'list-item',

	ui: {
		'read': 'span[data-role="read"]'
	},

	events: {
		'click .row': 'onSelect',
		'click @ui.read': 'onToggleRead'
	},

	behaviors: [RowActionsBehavior],

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'proxy']);
	},

	templateContext: function() {
		return {
			creation_date: format.formatDateTime(this.model.get('creation_date')),
			summary: this.model.getSummary()
		};
	},

	onSelect: function(event) {
		// Hugly hack to  intercept clic on selection input
		if (event.target.tagName == 'LABEL' || event.target.tagName == 'INPUT') {
			return;
		}
		this.proxy.trigger('select:row', this.model);
	},

	onToggleRead: function(event) {
		event.preventDefault();
		this.model.save({
			is_read: !this.model.get('is_read')
		}, {
			patch: true
		});
		return false;
	}

});

var ListView = require('kiubi/views/ui/list.js');

module.exports = Marionette.View.extend({
	template: require('../templates/inbox.html'),
	className: 'container-fluid',
	service: 'forms',

	regions: {
		list: {
			el: "article[data-role='list']",
			replaceElement: true
		}
	},

	detailView: null,
	filters: {
		'id': null,
		'u': null // [null,1] => all, only unread
	},

	initialize: function(options) {
		this.mergeOptions(options, ['collection', 'filters']);

		this.empty = new this.collection.model();

		this.detailView = new DetailView({
			model: this.empty
		}); // empty model

		this.listenTo(this.collection, 'sync', function(modelOrCollection) {

			// Sync event from collection
			if (!modelOrCollection.model) return;
			if (this.collection.length > 0) {
				this.onChildviewSelectRow(this.collection.at(0));
			} else {
				this.onChildviewSelectRow(this.empty);
			}

		}.bind(this));
	},

	onRender: function() {

		var c = new CollectionUtils.SelectCollection();
		c.add({
			'value': 'unread',
			'label': 'Non-lues',
			'selected': this.filters.u == 1
		});

		this.showChildView('list', new ListView({
			collection: this.collection,
			rowView: RowView,
			extraClassname: 'answers',
			extraListClassname: 'answers-list',
			detailView: this.detailView,
			scrollContentEl: 'div.answers-list',

			title: 'Liste des réponses',
			selection: [{
				title: 'Marquer lue',
				callback: this.readRep.bind(this)
			}, {
				title: 'Marquer non-lue',
				callback: this.unreadRep.bind(this)
			}, {
				title: 'Supprimer',
				callback: this.deleteRep.bind(this),
				confirm: true
			}],
			filters: [{
				selectExtraClassname: 'select-category',
				title: 'Tous les formulaires',
				collectionPromise: this.getOption('forms').promisedSelect(this.filters.id)
			}, {
				selectExtraClassname: 'select-state',
				title: 'États',
				collection: c
			}]
		}));
	},

	start: function() {
		this.collection.fetch({
			data: {
				form_id: this.filters.id,
				unread_only: this.filters.u == '1' ? 1 : null,
				extra_fields: 'forms'
			}
		}, {
			reset: true
		});
	},

	readRep: function(ids) {
		return this.collection.bulkRead(ids);
	},

	unreadRep: function(ids) {
		return this.collection.bulkUnred(ids);
	},

	deleteRep: function(ids) {
		return this.collection.bulkDelete(ids);
	},

	onChildviewFilterChange: function(filter) {

		if (filter.index == 0) {
			this.filters.id = filter.value == '' ? null : filter.value;
		} else if (filter.index == 1) {
			this.filters.u = filter.value == 'unread' ? '1' : null;
		}

		this.start();
	},

	onChildviewSelectRow: function(model) {
		if (!model.isNew() && !model.get('is_read')) {
			model.save({
				is_read: true
			}, {
				patch: true
			});
		}

		this.getChildView('list').getChildren().each(function(rowView) {
			if (rowView.model == model) {
				rowView.$el.addClass('active');
			} else {
				rowView.$el.removeClass('active');
			}
		});

		this.detailView.showDetail(model);
	}

});
