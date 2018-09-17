var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var CollectionUtils = require('kiubi/utils/collections.js');
var _ = require('underscore');
var format = require('kiubi/utils/format.js');

var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');

var Session = Backbone.Radio.channel('app').request('ctx:session');

var DetailView = Marionette.View.extend({
	template: require('../templates/inbox.detail.html'),
	className: 'post-content answer-detail',

	templateContext: function() {
		return {
			'response_id': this.model ? this.model.get('response_id') : '',
			creation_date: format.formatDateTime(this.model.get('creation_date')),
			convertMediaPath: Session.convertMediaPath.bind(Session),
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
	filters: null,

	initialize: function(options) {
		this.mergeOptions(options, ['collection']);

		this.filters = {
			'id': null,
			'is_read': null
		};

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

		var c_state = new CollectionUtils.SelectCollection();
		c_state.add([{
			'value': 'read',
			'label': 'Lues',
			'selected': this.filters.is_read == 1
		}, {
			'value': 'unread',
			'label': 'Non-lues',
			'selected': this.filters.is_read == 0
		}]);

		var c_export = new CollectionUtils.SelectCollection();
		c_export.add({
			'value': 'export',
			'label': 'Exporter les réponses',
			'selected': false
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
				extraClassname: 'select-category',
				title: 'Tous les formulaires',
				collectionPromise: this.getOption('forms').promisedSelect(this.filters.id)
			}, {
				extraClassname: 'select-state',
				title: 'Tous les états',
				collectionPromise: c_state
			}, {
				extraClassname: 'md-export',
				type: 'button',
				collectionPromise: c_export
			}]
		}));
	},

	start: function() {
		var data = {
			form_id: this.filters.id,
			extra_fields: 'forms'
		};
		if (this.filters.is_read != null) {
			data.is_read = this.filters.is_read;
		}

		this.collection.fetch({
			reset: true,
			data: data
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
		} else if (filter.index == 2) {
			if (!filter.view) return;
			var view = filter.view;

			if (filter.value == 'export') {

				if (view.collection.length > 1) {
					return;
				}

				if (!this.filters.id) {
					var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
					navigationController.showErrorModal('Veuillez choisir un formulaire');
					return;
				}

				view.overrideExtraClassname('md-loading');
				view.render();
				this.collection.exportAll({
					form_id: this.filters.id
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
