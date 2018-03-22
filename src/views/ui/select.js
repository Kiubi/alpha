var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

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

	collectionEvents: {
		sync: function() {
			this.render();
		}
	},

	ui: {
		'select': 'select'
	},

	direction: 'down', // up OR down

	selected: null,
	name: '',
	emptyLabel: '',
	dataSource: null,
	datas: null,

	/**
	 *
	 * @param {Object} options
	 * 							{String} selected
	 * 							{String} name
	 * 							{Backbone.Collection} collection
	 * 							{Promise} dataSource
	 * 							{String} direction	Choose dropdown direction : "up" or "down"
	 */
	initialize: function(options) {
		this.mergeOptions(options, ['selected', 'name', 'collection', 'direction']);

		if (this.getOption('extraClassName')) {
			this.$el.addClass(this.getOption('extraClassName'));
		}

		if (this.getOption('dataSource')) {
			this.load(this.getOption('dataSource'));
		}

		if (this.getOption('collectionPromise')) {
			this.loadCollection(this.getOption('collectionPromise'));
		}

		if (this.collection && this.collection.selectPayload) {
			this.listenTo(this.collection, 'sync', this.render);
		}
	},

	/**
	 * Load options from a promise
	 *
	 * @param {Promise} promise
	 */
	load: function(promise) {
		this.dataSource = promise;
		this.dataSource.done(function(options) {
			this.datas = options;
			this.render();
		}.bind(this));
	},

	/**
	 * Load options from a promised collection
	 *
	 * @param {Promise} promise
	 */
	loadCollection: function(promise) {
		this.dataSource = promise;
		this.dataSource.done(function(collection) {
			this.datas = collection.toJSON();
			var selected = collection.findWhere({
				'selected': true
			});
			if (selected) {
				this.selected = selected.get('value');
			}
			this.render();
		}.bind(this));
	},

	onSelect: function(event) {
		this.selected = Backbone.$(event.currentTarget).val();
		this.triggerMethod('change', this.selected, this.getOption('name'));
	},

	getOptionsList: function() {
		if (this.dataSource && this.datas) { // promise was resolved
			return this.datas;
		}

		if (this.collection && this.collection.selectPayload) {
			return this.collection.selectPayload();
		}

		return [];
	},

	onRender: function() {
		this.getUI('select').on('change', this.onSelect.bind(this));
		// if selected is not defined, seek first element
		if (this.selected == null && !this.getOption('emptyLabel')) {
			var options = this.getOptionsList();
			if (options.length) this.selected = options[0].value;
		}
	},

	templateContext: function() {
		return {
			name: this.getOption('name'),
			direction: this.direction,
			selected: this.selected,
			emptyLabel: this.getOption('emptyLabel'),
			options: this.getOptionsList()
		};
	},

	onBeforeDestroy: function() {
		this.getUI('select').off('change');
	}
});
