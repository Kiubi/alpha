var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = Marionette.View.extend({
	template: require('kiubi/core/templates/ui/list/filter.btn.html'),

	className: 'btn-group',

	ui: {
		'dropdown': '[data-toggle="dropdown"]'
	},

	events: {
		'click button': 'onButtonChange',
		'click li a': 'onSelectChange'
	},

	oClassname: '',

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'proxy']);

		if (!this.model.get('collectionPromise')) {
			this.setCollection(new CollectionUtils.SelectCollection());
			return;
		}

		// Test if collectionPromise is a promise or a collection
		// No .then() => Collection. Meh ! Close enough...
		if (this.model.get('collectionPromise').then) {
			this.model.get('collectionPromise').done(function(collection) {
				this.setCollection(collection);
				this.render();
			}.bind(this));
		} else {
			this.setCollection(this.model.get('collectionPromise'));
		}

	},

	setCollection: function(collection) {
		this.collection = collection;
		this.listenTo(this.collection, 'update', this.render);
		this.listenTo(this.collection, 'reset', this.render);
	},

	activeItem: function(value) {
		this.collection.each(function(model) {
			model.set('selected', (model.get('value') == value));
		});
		this.collection.trigger('update');
	},

	overrideExtraClassname: function(classnames) {
		this.oClassname = classnames;
	},

	templateContext: function() {
		return {
			extraClassname: this.oClassname ? this.oClassname : this.model.get('extraClassname'),
			collection: this.collection.toJSON()
		};
	},

	/* DropDown */

	toggleDropdown: function() {
		this.getUI('dropdown').dropdown('toggle');
	},

	/* Events */

	onRender: function() {
		this.getUI('dropdown').dropdown();
	},

	onButtonChange: function(event) {
		this.proxy.triggerMethod('filter:change', {
			model: this.model,
			value: null,
			view: this
		});

		event.stopPropagation(); // needed
		event.preventDefault(); // needed
		return false;
	},

	onSelectChange: function(event) {
		var $link = Backbone.$(event.currentTarget, this.el);

		// Disable select if already selected
		if ($link.parent().hasClass('active')) {
			return;
		}

		this.proxy.triggerMethod('filter:change', {
			model: this.model,
			value: $link.data('value'),
			view: this
		});
	}

});
