var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

module.exports = Marionette.View.extend({
	template: require('kiubi/core/templates/ui/list/filter.search.html'),

	tagName: 'div',
	className: 'btn-group dropdown',

	ui: {
		'label': 'span[data-role="label"]',
		'li': 'li[data-role="selection"]',
		'feedback': 'span[data-role="feedback"]',
		'input': 'input[data-role="input"]',
		'dropdown-menu': '.dropdown-menu',
		'toggle': '.dropdown-toggle'
	},

	/**
	 * change : {label, value}
	 * input : term, view
	 */
	events: {

		'shown.bs.dropdown': function(event) {
			this.getUI('input').focus();
			this.triggerInput();
		},

		'click @ui.li': function(event) {
			var index = parseInt(Backbone.$(event.currentTarget).data('index'));

			if (isNaN(index) || index > this.suggestions.length) return;

			this.setCurrent(this.suggestions[index]);

			this.proxy.triggerMethod('filter:change', {
				model: this.model,
				value: this.current.value,
				view: this
			});
		},

		'keyup @ui.input': _.debounce(function() {
			this.triggerInput();
		}, 300),

		'click @ui.feedback': function(event) {

			if (this.model.get('canDelete')) {
				this.proxy.triggerMethod('filter:change', {
					model: this.model,
					value: null,
					view: this
				});
				this.model.collection.remove(this.model);
				return;
			}

			if (this.current.value == null) return;

			event.preventDefault();

			this.setCurrent({
				label: this.model.get('title'),
				value: null
			});

			this.proxy.triggerMethod('filter:change', {
				model: this.model,
				value: null,
				view: this
			});

			return false;
		}
	},

	term: null,
	current: {
		label: '',
		value: null
	},
	suggestions: null,
	searchPlaceholder: 'Rechercher',

	initialize: function(options) {
		this.term = null;
		this.mergeOptions(options, ['model', 'proxy']);
		this.current = {
			label: this.model.get('title'),
			value: null
		};
	},

	templateContext: function() {
		return {
			'term': this.term,
			'searchPlaceholder': this.searchPlaceholder,
			'current': this.current
		};
	},

	triggerInput: function() {
		if (this.getUI('input').val() === this.term) return;
		this.term = this.getUI('input').val();

		this.proxy.triggerMethod('filter:input', {
			model: this.model,
			value: this.term,
			view: this
		});
	},

	/**
	 *
	 * @param {Object} current :
	 * 					{Number} value
	 * 					{String} label
	 */
	setCurrent: function(current) {
		this.current = current;
		this.getUI('label').text(current.label || '');

		if (this.current.value == null) {
			this.getUI('feedback').removeClass('md-cancel');
			this.getUI('toggle').removeClass('reset-toogle');
		} else {
			this.getUI('feedback').addClass('md-cancel');
			this.getUI('toggle').addClass('reset-toogle');
		}

	},

	/**
	 *
	 * @param {Array} results
	 * @param {Object} xtra
	 * 					{String} title
	 * 					{String} iconClass
	 * 					{String} eventName
	 */
	showResults: function(results, xtra) {
		this.suggestions = results;

		var list = '';
		if (results.length > 0) {
			list = _.reduce(results, function(memo, result, index) {
				return memo + '<li data-role="selection" data-index="' + index + '"><a class="dropdown-item" href="#">' +
					result.label + '</a></li>';
			}, '<li class="dropdown-divider"></li>');
		} else {
			list =
				'<li class="dropdown-divider"></li><li><span class="dropdown-item dropdown-item-empty"><span class="md-icon md-no-result"></span> Aucun résultat</span></li>';
		}

		this.emptyList(this.getUI('dropdown-menu')).append(list);
		this.getUI('input').focus();
	},

	emptyList: function($dropdown) {
		var $first = $dropdown.children().eq(0).detach();
		return $dropdown.empty().append($first);
	}

});
