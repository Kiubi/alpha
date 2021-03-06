var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

var SelectifyBehavior = require('kiubi/behaviors/selectify.js');

module.exports = Marionette.View.extend({
	template: _.template(
		'<select data-style="selectify" name="<%- name %>" data-direction="<%- direction %>"><% if(emptyLabel) { %><option value=""><%- emptyLabel %></option><% } %>' +
		'<% _(options).each(function(item){ %><% if (item.is_group) { %><optgroup data-indent="<%= item.indent %>" label="<%- item.label %>"></optgroup><% } else { %>' +
		'<option data-indent="<%= item.indent %>" value="<%- item.value %>" <%= (item.selected || item.value == selected) ? \'selected="selected"\' : "" %>><%- item.label %></option><% } %>' +
		'<% }) %></select>'
	),
	tagName: 'div',
	className: '',
	extraClassName: '',
	behaviors: [SelectifyBehavior],

	/*collectionEvents: {
		sync: function() {
			this.render();
			// this.triggerMethod('load', this.selected);
		}
	},*/

	ui: {
		'select': 'select'
	},

	direction: 'down', // up OR down

	selected: null,
	name: '',
	emptyLabel: '',

	/**
	 *
	 * @param {Object} options
	 * 							{String} selected
	 * 							{String} name
	 * 							{Backbone.Collection} collection with selectPayload
	 * 							{Promise} collectionPromise
	 * 							{String} direction	Choose dropdown direction : "up" or "down"
	 */
	initialize: function(options) {
		this.mergeOptions(options, ['selected', 'name', 'direction']);

		if (this.getOption('extraClassName')) {
			this.$el.addClass(this.getOption('extraClassName'));
		}

		this.collection = new CollectionUtils.SelectCollection();

		if (this.getOption('collectionPromise')) {
			this.loadCollection(this.getOption('collectionPromise'));
		} else if (this.getOption('collection') && this.getOption('collection').selectPayload) {
			if (this.getOption('collection').length > 0) {
				this.loadPayload(); // already loaded
			} else {
				this.listenTo(this.getOption('collection'), 'sync', this.loadPayload);
			}
		}
	},

	loadPayload: function() {
		this.collection.set(this.getOption('collection').selectPayload(), {
			reset: true
		});
		this.trigger('load', this.selected);
		this.render();
	},

	/**
	 * Load options from a promised collection
	 *
	 * @param {Promise} promise
	 */
	loadCollection: function(promise) {
		promise.done(function(collection) {
			this.collection.set(collection.toJSON(), {
				reset: true
			});
			var selected = this.collection.findWhere({
				'selected': true
			});
			if (selected) {
				this.selected = selected.get('value');
			}
			this.trigger('load', this.selected);
			this.render();
		}.bind(this));
	},

	onSelect: function(event) {
		this.selected = Backbone.$(event.currentTarget).val();
		this.triggerMethod('change', this.selected, this.getOption('name'));
	},

	onRender: function() {
		this.getUI('select').on('change', this.onSelect.bind(this));
		// if selected is not defined, seek first element
		if (this.selected == null && !this.getOption('emptyLabel')) {
			if (this.collection.length) this.selected = this.collection.at(0).get('value');
		}
	},

	templateContext: function() {
		return {
			name: this.getOption('name'),
			direction: this.direction,
			selected: this.selected,
			emptyLabel: this.getOption('emptyLabel'),
			options: this.collection.toJSON()
		};
	},

	onBeforeDestroy: function() {
		this.getUI('select').off('change');
	}

});
