var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

module.exports = Marionette.View.extend({
	template: _.template(
		'<% if(emptyLabel) { %><option value=""><%- emptyLabel %></option><% } %>' +
		'<% _(options).each(function(item){ %><% if (item.is_group) { %><optgroup  class="disabled" label="<%= indent2Space(item.indent) %><%- item.label %>"></optgroup><% } else { %>' +
		'<option value="<%- item.value %>" <%= (item.value == selected) ? \'selected="selected"\' : "" %>><%= indent2Space(item.indent) %><%- item.label %></option><% } %>' +
		'<% }) %>'
	),
	tagName: 'select',
	className: 'form-control',
	extraClassName: '',

	attributes: function() {
		return {
			'name': this.getOption('name')
		};
	},

	collectionEvents: {
		sync: function() {
			this.render();
		}
	},

	selected: null,
	name: '',
	emptyLabel: '',
	dataSource: null,
	datas: null,

	initialize: function(options) {
		this.mergeOptions(options, ['selected', 'name', 'collection', 'dataSource']);

		if (this.getOption('extraClassName')) {
			this.$el.addClass(this.getOption('extraClassName'));
		}

		if (this.dataSource) {
			this.dataSource.done(function(options) {
				this.datas = options;
				this.render();
			}.bind(this));
		}

		this.$el.on('change', this.onSelect.bind(this));
	},

	onSelect: function(event) {
		this.selected = Backbone.$(event.currentTarget).val();
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

	templateContext: function() {
		return {
			selected: this.selected,
			emptyLabel: this.getOption('emptyLabel'),
			options: this.getOptionsList(),
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

	onBeforeDestroy: function() {
		this.$el.off('change');
	}
});
