var Marionette = require('backbone.marionette');
var _ = require('underscore');

module.exports = Marionette.View.extend({
	template: require('kiubi/core/templates/ui/list/filter.input.html'),

	className: 'btn-group has-feedback',

	ui: {
		'term': 'input[name="term"]',
		'feedback': '[data-role="feedback"]'
	},

	currentTerm: '',

	events: {
		'keyup @ui.term': _.debounce(function(e) {
			var term = this.getUI('term').val();
			if (term == this.currentTerm) {
				return;
			}
			this.currentTerm = term;
			this.onInputChange(term);
		}, 300),
		'click @ui.feedback': function() {
			if (!this.model.get('canDelete')) return;

			this.proxy.triggerMethod('filter:change', {
				model: this.model,
				value: null,
				view: this
			});
			this.model.collection.remove(this.model);
		}
	},

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'proxy']);
		this.currentTerm = this.model.get('value') ? this.model.get('value') : '';
	},

	templateContext: function() {

		var defaultClassname = this.model.get('canDelete') ? 'md-cancel' : 'md-search';

		return {
			extraClassname: this.model.get('extraClassname') ? this.model.get('extraClassname') : defaultClassname,
			prependText: this.model.get('prependText') ? this.model.get('prependText') : ''
		};
	},

	/* Events */

	onInputChange: function(term) {
		this.proxy.triggerMethod('filter:change', {
			model: this.model,
			value: term,
			view: this
		});
	}

});
