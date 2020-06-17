var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var SaveBehavior = require('kiubi/behaviors/save_detection.js');

var TagView = Marionette.View.extend({
	template: _.template(
		'<span class="badge-content" title="<%- label %>"><%- label %></span><span data-role="delete" class="md-icon md-close"></span>'
	),

	className: 'badge badge-primary badge-list',
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

	behaviors: [SaveBehavior],

	regions: {
		'list': {
			el: 'span[data-role="list"]',
			replaceElement: true
		}
	},

	ui: {
		'drop': '.dropdown',
		'sel': '.dropdown li[data-role="selection"]',
		'lixtra': '.dropdown li[data-role="xtra"]',
		'input': 'input[data-role="input"]'
	},

	events: {
		'keyup @ui.input': _.debounce(function(event) {
			this.triggerInput();
		}, 300),

		'mousedown @ui.input': function(event) {
			this.triggerInput();
		},

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
	term: null,

	searchPlaceholder: 'Rechercher',
	inputName: '',

	evtSuffix: '',
	eventName: function(base) {
		return this.evtSuffix ? base + ':' + this.evtSuffix : base;
	},

	initialize: function(options) {

		this.mergeOptions(options, ['evtSuffix', 'searchPlaceholder', 'inputName']);

		this.term = null;

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
			this.collection.add(this.getOption('tags'), {
				silent: true
			});
		}

		this.listenTo(this.collection, 'update', function() {
			this.triggerMethod('field:change');
		}.bind(this));

	},

	templateContext: function() {
		return {
			'searchPlaceholder': this.searchPlaceholder,
			'inputName': this.inputName
		};
	},

	onRender: function() {

		this.showChildView('list', new TagsView({
			collection: this.collection
		}));

	},

	triggerInput: function() {
		if (this.getUI('input').val() === this.term) return;

		this.term = this.getUI('input').val();
		this.triggerMethod(this.eventName('input'), this.term, this);
	},

	/**
	 *
	 * @param {Array} results
	 * @param {Array} xtras
	 * 					{String} title
	 * 					{String} iconClass
	 * 					{String} eventName
	 */
	showResults: function(results, xtras) {
		this.suggestions = results;

		var list = '';
		if (results.length > 0) {
			list = _.reduce(results, function(acc, result, index) {
				return acc + '<li data-role="selection" data-index="' + index + '"><a class="dropdown-item" href="#">' +
					_.escape(result.label) + '</a></li>';
			}, '');
		} else {
			list =
				'<li><span class="dropdown-item dropdown-item-empty"><span class="md-icon md-no-result"></span> Aucun résultat</span></li>';
		}

		if (xtras) {

			if (!_.isArray(xtras)) {
				xtras = [xtras];
			}

			_.each(xtras, function(xtra) {
				xtra = _.extend({
					title: 'Ajouter',
					iconClass: 'md-add-outline',
					eventName: 'xtra'
				}, xtra);

				list += '<li class="dropdown-divider"></li><li data-role="xtra" data-event="' + xtra.eventName +
					'"><a class="dropdown-item" href="#">' + _.escape(xtra.title) + '<span class="md-icon ' + xtra.iconClass +
					'"></span></a></li>';
			});

		}

		this.getUI('drop').children('ul').html(list);
		this.getUI('drop').addClass('show'); // Force opening
		this.getUI('drop').children('.dropdown-menu').addClass('show'); // Force opening
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
	},

	/**
	 *
	 * @param {Array} tags
	 * 					[
	 * 					{String} label
	 * 					{Number} value
	 * 					]
	 */
	setTags: function(tags) {
		this.collection.set(tags, {
			reset: true
		});
		Backbone.$('input', this.el).val('');
	},

	clearTags: function() {
		this.collection.reset();
		Backbone.$('input', this.el).val('');
	}

});
