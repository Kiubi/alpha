var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var Builder = require('../models/builder');

var RowView = Marionette.View.extend({
	template: require('../templates/layouts.row.html'),
	className: 'col-xs-12',

	ui: {
		'duplicate': '[data-role="duplicate"]',
		'delete': '[data-role="delete"]'
	},

	events: {
		'click @ui.duplicate': 'onDuplicate',
		'click @ui.delete': 'onDelete',
		'hidden.bs.dropdown .btn-group': 'onHiddenDropDown'
	},

	templateContext: function() {
		return {
			structure: this.getStructure(this.model)
		};
	},

	onDuplicate: function() {
		var m = new Builder({
			layout_id: this.model.get('layout_id'),
			page: this.model.get('page'),
			name: 'Copie de ' + this.model.get('name')
		});
		var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
		m.save().done(function() {
			navigationController.navigate('/appearance/drafts/' + m.get('draft_id'));
		}.bind(this)).fail(function(xhr) {
			navigationController.showErrorModal(xhr);
		}.bind(this));
	},

	onDelete: function(event) {

		var $btn = Backbone.$(event.currentTarget);

		if (!$btn.parent().hasClass("confirm-warning")) {
			event.preventDefault();
			$btn.data('title', $btn.text());
			$btn.parent().addClass("confirm-warning");
			$btn.text('Êtes-vous sûr ?');
			return false;
		}

		this.model.destroy();
	},

	/**
	 * Restore confirmation buttons on dropdown menu hidding
	 *
	 * @param {Event} event
	 */
	onHiddenDropDown: function(event) {
		Backbone.$('.dropdown-menu a', event.currentTarget)
			.each(function(index, el) {
				el = Backbone.$(el);
				if (el.parent().hasClass('confirm-warning')) {
					el.text(el.data('title'));
					el.parent().removeClass('confirm-warning');
				}
			});
	},

	/**
	 * Get HTML structure of the layout
	 *
	 * @param {Backbone.Model} model
	 * @returns {String}	HTML table
	 */
	getStructure: function(model) {

		if (!model || !model.get('model') || !model.get('model').structure) {
			return '';
		}

		return model.get('model').structure.replace('<table>',
			'<table class="template">');
	}

});

var ListView = Marionette.CollectionView.extend({
	className: 'row flex-row',
	childView: RowView
});

module.exports = Marionette.View.extend({
	template: require('../templates/layouts.html'),
	className: 'container container-large',
	service: 'appearance',

	ui: {
		'order': '[data-role="order"] li'
	},

	events: {
		'click @ui.order': 'changeOrder'
	},

	regions: {
		list: {
			el: "div[data-role='list']"
		}
	},

	initialize: function(options) {
		this.mergeOptions(options, ['collection']);
	},

	onRender: function() {
		this.showChildView('list', new ListView({
			collection: this.collection
		}));
	},

	/**
	 * Triggered when a new order is selected
	 *
	 * @param {Event} event
	 */
	changeOrder: function(event) {

		var $li = Backbone.$(event.currentTarget);

		// already active
		if ($li.hasClass('active')) return;

		this.getUI('order').removeClass('active');
		$li.addClass('active');

		switch ($li.data('id')) {
			case 'date':
				this.collection.comparator = 'layout_id';
				break;
			case 'name':
				this.collection.comparator = 'name';
				break;
			case 'usage':
				this.collection.comparator = function(model) {
					return -1 * model.get('usage_count');
				};
				break;
		}

		this.collection.sort();
	}

});
