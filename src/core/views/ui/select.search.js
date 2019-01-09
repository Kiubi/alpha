var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');


/**
 * Empty a dropdown except for first child
 *
 * @param {jQuery} $dropdown
 */
function emptyList($dropdown) {
	var $first = $dropdown.children().eq(0).detach();
	return $dropdown.empty().append($first);
}

module.exports = Marionette.View.extend({
	template: require('../../templates/ui/select.search.html'),
	tagName: 'div',
	className: 'dropdown',

	ui: {
		'label': 'span[data-role="label"]',
		'li': 'li[data-role="selection"]',
		'lixtra': 'li[data-role="xtra"]',
		'clear': 'span[data-role="clear"]',
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
			this.triggerMethod(this.eventName('change'), this.suggestions[index], this);
		},

		'click @ui.lixtra': function(event) {
			var eventName = Backbone.$(event.currentTarget).data('event');

			this.triggerMethod(this.eventName(eventName), this.term, this);
		},

		'keyup @ui.input': _.debounce(function() {
			this.triggerInput();
		}, 300),

		'click @ui.clear': function(event) {

			if (this.isMandatory || this.current.value == null) return;

			event.preventDefault();

			this.setCurrent({
				label: '',
				value: null
			});

			this.triggerMethod(this.eventName('change'), this.current, this);
			return false;
		}
	},

	term: null,
	current: {
		label: '',
		value: null
	},
	suggestions: null,
	isMandatory: true,
	searchPlaceholder: 'Rechercher',

	evtSuffix: null,
	eventName: function(base) {
		return this.evtSuffix ? base + ':' + this.evtSuffix : base;
	},

	initialize: function(options) {
		this.mergeOptions(options, ['current', 'searchPlaceholder', 'evtSuffix', 'isMandatory']);
		this.term = null;
	},

	templateContext: function() {
		return {
			'id': this.cid,
			'term': this.term,
			'searchPlaceholder': this.searchPlaceholder,
			'current': this.current,
			'isMandatory': this.isMandatory
		};
	},

	triggerInput: function() {
		if (this.getUI('input').val() === this.term) return;

		this.term = this.getUI('input').val();
		this.triggerMethod(this.eventName('input'), this.term, this);
	},

	getCurrent: function() {
		return this.current;
	},

	clear: function() {
		this.term = '';
		this.setCurrent({
			label: '',
			value: null
		});
		this.suggestions = [];
		this.render();
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

		if (!this.isMandatory) {
			if (this.current.value == null) {
				this.getUI('clear').removeClass('md-cancel');
				this.getUI('toggle').removeClass('reset-toogle');
			} else {
				this.getUI('clear').addClass('md-cancel');
				this.getUI('toggle').addClass('reset-toogle');
			}
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
		if (xtra) {
			xtra = _.extend({
				title: 'Ajouter',
				iconClass: 'md-add-outline',
				eventName: 'xtra'
			}, xtra);

			list += '<li class="dropdown-divider"></li><li data-role="xtra" data-event="' + xtra.eventName +
				'"><a class="dropdown-item" href="#">' + xtra.title + '<span class="md-icon ' + xtra.iconClass +
				'"></span></a></li>';
		}
		emptyList(this.getUI('dropdown-menu')).append(list);
		this.getUI('input').focus();
	}

});
