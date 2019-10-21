var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

module.exports = Marionette.View.extend({
	template: require('kiubi/core/templates/ui/list/filter.dropdown.html'),

	className: 'btn-group',

	ui: {
		'li': 'li a',
		'label': '[data-role="label"]',
		'feedback': '[data-role="feedback"]'
	},

	events: {
		'click li a': 'onSelect',
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
		this.collection = null;

		if (!this.model.get('collectionPromise')) return;

		// Test if collectionPromise is a promise or a collection
		// No .then() => Collection. Meh ! Close enough...
		if (this.model.get('collectionPromise').then) {
			this.model.get('collectionPromise').done(function(collection) {
				this.collection = collection;
				this.render();
			}.bind(this));
		} else {
			this.collection = this.model.get('collectionPromise');
		}
	},

	templateContext: function() {
		var selected = this.collection ? this.collection.find({
			selected: true
		}) : null;
		return {
			title: selected ? selected.get('label') : this.model.get('title'),
			extraClassname: this.model.get('extraClassname') ? this.model.get('extraClassname') : '',
			collection: this.collection ? this.collection.toJSON() : null
		};
	},

	/* Events */

	onSelect: function(event) {

		var index = Backbone.$(event.currentTarget, this.el).data('index');

		if (index >= this.collection.length) return;

		if (!this.model.get('disableLabelUpdate')) {
			this.getUI('label').text(this.collection.at(index).get('label'));
		}

		this.proxy.triggerMethod('filter:change', {
			index: index,
			model: this.model,
			value: this.collection.at(index).get('value'),
			view: this
		});
	}

});
