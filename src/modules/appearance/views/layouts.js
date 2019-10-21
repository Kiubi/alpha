var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var format = require('kiubi/utils/format.js');
var moment = require('moment');

var Builder = require('../models/builder');

function mapPage(page, count) {

	var link;

	switch (page) {
		case 'cms-home':
			link = {
				link: count > 0 ? '/cms' : '#',
				label: count > 0 ? 'Page d\'accueil' : 'Aucune page'
			};
			break;
		case 'cms-page':
			link = {
				link: '#', // TODO
				label: count > 0 ? format.plural(count, '%d page', ' %d pages') : 'Aucune page'
			};
			break;
		case 'blog-category':
			link = {
				link: '#', // TODO
				label: count > 0 ? format.plural(count, '%d catégorie', ' %d catégories') : 'Aucune catégorie'
			};
			break;
		case 'blog-post':
			link = {
				link: '#', // TODO
				label: count > 0 ? format.plural(count, '%d billet', ' %d billets') : 'Aucun billet'
			};
			break;
		case 'catalog-home':
			link = {
				link: count > 0 ? '/catalog/home' : '#',
				label: count > 0 ? 'Page d\'accueil' : 'Aucune page'
			};
			break;
		case 'catalog-category':
			link = {
				link: '#', // TODO
				label: count > 0 ? format.plural(count, '%d catégorie', ' %d catégories') : 'Aucune categorie'
			};
			break;
		case 'catalog-product':
			link = {
				link: '#', // TODO
				label: count > 0 ? format.plural(count, '%d produit', ' %d produits') : 'Aucun produit'
			};
			break;
		default:
			link = {
				link: '#',
				label: count > 0 ? format.plural(count, '%d page', ' %d pages') : 'Aucune page'
			};
			break;
	}

	return link;
}

var RowView = Marionette.View.extend({
	template: require('../templates/layouts.row.html'),
	className: 'col-auto d-flex',

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

		var usage = mapPage(this.model.get('page'), this.model.get('usage_count'));

		return {
			usage_link: usage.link,
			usage_label: usage.label,
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
		}.bind(this)).fail(function(error) {
			navigationController.showErrorModal(error);
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
	className: 'row',
	childView: RowView
});

module.exports = Marionette.View.extend({
	template: require('../templates/layouts.html'),
	className: 'container-fluid alerte-rwd',
	service: 'appearance',

	ui: {
		'order': '[data-role="order"] li'
	},

	events: {
		'click @ui.order': 'onChangeOrder'
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

		this.sortCollection('date');

		this.showChildView('list', new ListView({
			collection: this.collection
		}));
	},

	/**
	 * Triggered when a new order is selected
	 *
	 * @param {Event} event
	 */
	onChangeOrder: function(event) {

		var $li = Backbone.$(event.currentTarget);

		// already active
		if ($li.hasClass('active')) return;

		this.getUI('order').removeClass('active');
		$li.addClass('active');

		this.sortCollection($li.data('id'));

	},

	/**
	 * Triggered when a new order is selected
	 *
	 * @param {String} order
	 */
	sortCollection: function(order) {

		switch (order) {
			case 'date':
				this.collection.comparator = function(model) {
					return -1 * moment(model.get('modification_date'), "YYYY-MM-DD HH:mm:ss").format('x');
				};
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
