var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var ControllerChannel = Backbone.Radio.channel('controller');

var ActiveLinksBehaviors = require('kiubi/behaviors/active_links.js');
var SelectifyBehavior = require('kiubi/behaviors/selectify.js');

module.exports = Marionette.View.extend({
	template: require('../templates/sidebarMenuLayout.html'),
	service: 'layout',
	behaviors: [ActiveLinksBehaviors, SelectifyBehavior],

	tree: [],
	models: [],
	folder_id: null,

	ui: {
		'folderSelector': "select[data-role='select-folder']",
		'modelSelector': "select[data-role='select-model']",
		'inputName': "input[data-role='name']"
	},

	events: {
		'change @ui.folderSelector': function(event) {
			this.folder_id = Backbone.$(event.currentTarget).val();
			this.render();
		},
		'change @ui.modelSelector': function(event) {
			ControllerChannel.trigger('change:model', Backbone.$(event.currentTarget).val());
		},
		'change @ui.inputName': function(event) {
			ControllerChannel.trigger('change:name', Backbone.$(event.currentTarget).val());
		}
	},

	initialize: function(options) {

		this.tree = [];
		this.models = [];
		this.builder = null;
		this.folder_id = 0;

		this.listenTo(ControllerChannel, 'refresh:widgets', function(widgets, models, builder) {
			this.tree = widgets;
			this.models = models;
			this.builder = builder;
			this.render();
		});

	},

	templateContext: function() {

		var folders = this.tree;
		var categories = [];
		var widgets = [];

		if (this.folder_id != null && folders[this.folder_id]) {
			categories = folders[this.folder_id].categories;
		}
		_.each(categories, function(category) {
			widgets = widgets.concat(category.widgets);
		});

		return {
			folders: folders,
			folder_id: this.folder_id,
			categories: categories,
			widgets: widgets,
			models: this.models,
			canEditName: (this.builder && this.builder.get('type').page !== 'symbol'),
			name: this.builder ? this.builder.get('name') : '',
			current_model: this.builder ? this.builder.get('model').id : ''
		};
	},

	onRender: function() {
		if (this.tree.length > 0) {
			ControllerChannel.trigger('rendered:widgets');
		}
	}
});
