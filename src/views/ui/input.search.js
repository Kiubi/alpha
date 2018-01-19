var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

module.exports = Marionette.View.extend({
	template: require('../../templates/ui/input.search.html'),
	tagName: 'div',

	current: null,
	name: '',

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
			this.current = this.suggestions[index].value;
			Backbone.$('input', this.el).val(this.current);
		},

		'click @ui.lixtra': function(event) {
			var eventName = Backbone.$(event.currentTarget).data('event');

			this.triggerMethod(this.eventName(eventName), this.term, this);
		}
	},

	suggestions: null,

	searchPlaceholder: 'Rechercher',
	noResultsLabel: '-- Aucun résultat --',

	evtSuffix: '',
	eventName: function(base) {
		return this.evtSuffix ? base + ':' + this.evtSuffix : base;
	},

	initialize: function(options) {

		this.mergeOptions(options, ['evtSuffix', 'current', 'name']);

	},

	templateContext: function() {

		return {
			'name': this.name,
			'current': this.current,
			'searchPlaceholder': this.searchPlaceholder
		};

	},

	showResults: function(results, xtra) {
		this.suggestions = results;

		var list = '';
		if (results.length > 0) {
			list = _.reduce(results, function(acc, result, index) {
				return acc + '<li data-role="selection" data-index="' + index + '"><a href="#">' + result.label + '</a></li>';
			}, '');
		} else if (this.emptyLabel) {
			list = '<li><a href="#">' + this.noResultsLabel + '</a></li>';
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
	}

});
