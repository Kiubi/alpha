var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var TagView = Marionette.View.extend({
	template: _.template(
		'<span class="label-content" title="<%- label %>"><%- label %></span><span data-role="delete" class="md-icon md-close"></span>'
	),

	className: 'label label-tag label-list',
	tagName: 'span',

	ui: {
		'deleteBtn': 'span[data-role="delete"]'
	},

	events: {
		'click @ui.deleteBtn': function() {
			this.model.destroy();
		}
	}

});

var TagsView = Marionette.CollectionView.extend({
	className: '',
	// emptyView: EmptyView,
	childView: TagView
});

module.exports = Marionette.View.extend({
	template: require('../../templates/ui/tag.search.html'),
	tagName: 'div',

	regions: {
		'list': {
			el: 'span[data-role="list"]',
			replaceElement: true
		}
	},

	ui: {
		'drop': '.dropdown',
		'sel': '.dropdown li[data-role="selection"]',
		'lixtra': '.dropdown li[data-role="xtra"]'
	},

	events: {
		'keyup @ui.drop input': _.debounce(function(event) {
			this.term = Backbone.$(event.currentTarget).val();
			this.triggerMethod(this.eventName('input'), this.term, this);
		}, 300),

		'click @ui.sel': function(event) {
			var index = parseInt(Backbone.$(event.currentTarget).data('index'));

			if (isNaN(index) || index > this.suggestions.length) return;

			this.collection.add(this.suggestions[index]);

			Backbone.$('input', this.el).val('');
		},

		'click @ui.lixtra': function(event) {
			var eventName = Backbone.$(event.currentTarget).data('event');

			this.triggerMethod(this.eventName(eventName), this.term, this);
		}
	},

	suggestions: null,

	searchPlaceholder: 'Rechercher',
	inputName: '',

	evtSuffix: '',
	eventName: function(base) {
		return this.evtSuffix ? base + ':' + this.evtSuffix : base;
	},

	initialize: function(options) {

		this.mergeOptions(options, ['evtSuffix', 'searchPlaceholder', 'inputName']);

		this.collection = new Backbone.Collection();
		this.collection.model = Backbone.Model.extend({
			idAttribute: 'value',
			defaults: {
				label: '',
				value: null
			},
			isNew: function() {
				return true;
			}
		});

		if (this.getOption('tags')) {
			this.collection.add(this.getOption('tags'));
		}

	},

	onRender: function() {

		this.showChildView('list', new TagsView({
			collection: this.collection
		}));

	},

	templateContext: function() {

		return {
			'searchPlaceholder': this.searchPlaceholder,
			'inputName': this.inputName
		};

	},

	showResults: function(results, xtra) {
		this.suggestions = results;

		var list = '';
		if (results.length > 0) {
			list = _.reduce(results, function(acc, result, index) {
				return acc + '<li data-role="selection" data-index="' + index + '"><a href="#">' + result.label + '</a></li>';
			}, '');
		} else {
			list = '<li><a href="#">-- Aucun résultat --</a></li>';
		}

		if (xtra) {
			xtra = _.extend({
				title: 'Ajouter',
				iconClass: 'md-add-outline',
				eventName: 'xtra'
			}, xtra);

			list += '<li role="separator" class="divider"></li><li data-role="xtra" data-event="' + xtra.eventName +
				'"><a href="#">' + xtra.title + '<span class="md-icon ' + xtra.iconClass + '"></span></a></li>';
		}

		this.getUI('drop').children('ul').html(list);
		this.getUI('drop').addClass('open'); // Force opening
	},

	/**
	 *
	 * @param {Object} tag
	 * 					{String} label
	 * 					{Number} value
	 */
	addTag: function(tag) {
		this.collection.add(tag);
		Backbone.$('input', this.el).val('');
	},

	getTags: function() {
		return this.collection.toJSON();
	}

});
