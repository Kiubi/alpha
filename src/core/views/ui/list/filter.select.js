var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var SelectifyBehavior = require('kiubi/behaviors/selectify.js');

module.exports = Marionette.View.extend({
	template: require('kiubi/core/templates/ui/list/filter.select.html'),

	className: 'btn-group',

	behaviors: [SelectifyBehavior],

	events: {
		'change select': 'onSelectChange'
	},

	collection: null,

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
		return {
			collection: this.collection ? this.collection.toJSON() : null,
			indent2Space: function(indent) {
				if (indent == 0) return '';
				var str = '';
				for (var i = 0; i < indent; i++) {
					str += '&nbsp;&nbsp;';
				}
				return str;
			}
		};
	},

	onSelectChange: function(event) {
		var $select = Backbone.$(event.currentTarget, this.el);

		this.proxy.triggerMethod('filter:change', {
			index: this.model.collection.indexOf(this.model),
			model: this.model,
			value: $select.val(),
			view: this
		});
	}

});
