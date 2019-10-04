var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var CollectionUtils = require('kiubi/utils/collections.js');
var _ = require('underscore');
var format = require('kiubi/utils/format.js');
var moment = require('moment');

var ControllerChannel = Backbone.Radio.channel('controller');

var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');

var Session = Backbone.Radio.channel('app').request('ctx:session');

var DetailView = Marionette.View.extend({
	template: require('../templates/inbox.detail.html'),
	className: 'post-content answer-detail',

	templateContext: function() {
		return {
			'response_id': this.model ? this.model.get('response_id') : '',
			creation_date: format.formatLongDateTime(this.model.get('creation_date')),
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
	className: 'list-item answers-item',

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

		var creation_date = moment(this.model.get('creation_date'), 'YYYY-MM-DD HH:mm:ss');
		var diff = moment().diff(creation_date, 'days');

		var creation_date_fromnow;
		if (diff >= 7) {
			creation_date_fromnow = format.formatLongDateTime(this.model.get('creation_date'));
		} else {
			creation_date_fromnow = creation_date.fromNow();
		}

		return {
			creation_date: format.formatLongDateTime(this.model.get('creation_date')),
			creation_date_fromnow: creation_date_fromnow,
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
		var delta = this.model.get('is_read') ? 1 : -1;
		this.model.save({
			is_read: !this.model.get('is_read')
		}, {
			patch: true
		}).done(function() {
			ControllerChannel.trigger('refresh:forms', delta);
		});
		return false;
	}

});

var ListView = require('kiubi/core/views/ui/list.js');

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
			'id': this.getOption('filters') && this.getOption('filters').id ? this.getOption('filters').id : null,
			'is_read': this.getOption('filters') && this.getOption('filters').is_read ? this.getOption('filters').is_read : null
		};

		this.empty = new this.collection.model();

		this.detailView = new DetailView({
			model: this.empty
		}); // empty model

		this.listenTo(this.collection, 'sync', function(modelOrCollection) {

			// Sync event from collection
			if (!modelOrCollection.model) return;
			if (this.collection.length > 0) {
				var model;
				if (this.getOption('filters') && this.getOption('filters').r) {
					model = this.collection.findWhere({
						response_id: parseInt(this.getOption('filters').r) // routing gives a string
					});
				}
				if (!model) model = this.collection.at(0);

				this.onChildviewSelectRow(model);
			} else {
				this.onChildviewSelectRow(this.empty);
			}

		}.bind(this));
	},

	onRender: function() {

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
				id: 'form',
				extraClassname: 'select-category',
				title: 'Tous les formulaires',
				collectionPromise: this.getOption('forms').promisedSelect(this.filters.id)
			}, {
				id: 'read',
				extraClassname: 'select-state',
				title: 'Tous les états',
				collectionPromise: new CollectionUtils.SelectCollection([{
					'value': 'read',
					'label': 'Lues',
					'selected': this.filters.is_read == 1
				}, {
					'value': 'unread',
					'label': 'Non-lues',
					'selected': this.filters.is_read == 0
				}])
			}],
			xtra: [{
				id: 'export',
				extraClassname: 'md-export',
				type: 'button',
				collectionPromise: new CollectionUtils.SelectCollection({
					'value': 'export',
					'label': 'Exporter les réponses',
					'selected': false
				})
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

		var delta = this.collection.reduce(function(acc, model) {
			if (!model.get('is_read') && _.contains(ids, '' + model.get('response_id'))) { // FIXME ids is String[]
				acc--;
			}
			return acc;
		}, 0);

		return this.collection.bulkRead(ids).done(function() {
			ControllerChannel.trigger('refresh:forms', delta);
		});
	},

	unreadRep: function(ids) {

		var delta = this.collection.reduce(function(acc, model) {
			if (model.get('is_read') && _.contains(ids, '' + model.get('response_id'))) { // FIXME ids is String[]
				acc++;
			}
			return acc;
		}, 0);

		return this.collection.bulkUnred(ids).done(function() {
			ControllerChannel.trigger('refresh:forms', delta);
		});
	},

	deleteRep: function(ids) {
		return this.collection.bulkDelete(ids);
	},

	onChildviewFilterChange: function(filter) {
		switch (filter.model.get('id')) {
			case 'form':
				this.onFormFilterChange(filter);
				break;
			case 'read':
				this.onReadFilterChange(filter);
				break;
			case 'export':
				this.onExportFilterChange(filter);
				break;
		}
	},

	onFormFilterChange: function(filter) {
		this.filters.id = filter.value == '' ? null : filter.value;
		this.start();
	},

	onReadFilterChange: function(filter) {
		if (filter.value === '' || filter.value === null) {
			this.filters.is_read = null;
		} else {
			this.filters.is_read = (filter.value == 'read') ? '1' : '0';
		}
		this.start();
	},

	onExportFilterChange: function(filter) {
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
	},

	onChildviewSelectRow: function(model) {
		if (!model.isNew() && !model.get('is_read')) {
			model.save({
				is_read: true
			}, {
				patch: true
			}).done(function() {
				ControllerChannel.trigger('refresh:forms', -1);
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
