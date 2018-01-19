var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var Controller = require('kiubi/controller.js');
var ControllerChannel = Backbone.Radio.channel('controller');

var Builder = require('./models/builder');
var Layout = require('./models/layout');
var Layouts = require('./models/layouts');

var IndexView = require('./views/index');
var LayoutsView = require('./views/layouts');
var LayoutView = require('./views/layout');

var ActiveLinksBehaviors = require('kiubi/behaviors/active_links.js');
var SelectifyBehavior = require('kiubi/behaviors/selectify.js');

/* Actions */
function getHeadersAction(options) {

	options = options || {};
	var actions = [{
		title: 'Enregistrer',
		callback: 'actionSave'
	}];

	return actions;
}


var SidebarMenuView = Marionette.View.extend({
	template: require('./templates/sidebarMenu.html'),
	service: 'appearance',
	behaviors: [ActiveLinksBehaviors],

	pages: [],

	initialize: function(options) {

		var m = new Layout();

		m.getTypes().done(function(types) {
			this.types = types;
			this.render();
		}.bind(this));

	},

	templateContext: function() {
		return {
			types: this.types
		};
	}

});

var SidebarMenuLayoutView = Marionette.View.extend({
	template: require('./templates/sidebarMenuLayout.html'),
	service: 'layout',
	behaviors: [ActiveLinksBehaviors, SelectifyBehavior],

	tree: [],
	models: [],
	folder_id: null,
	category_id: null,

	ui: {
		'folderSelector': "select[data-role='select-folder']",
		'categorySelector': "select[data-role='select-category']",
		'modelSelector': "select[data-role='select-model']",
		'inputName': "input[data-role='name']"
	},

	events: {
		'change @ui.folderSelector': function(event) {
			this.folder_id = Backbone.$(event.currentTarget).val();
			this.category_id = 0; // reset category
			this.render();
		},
		'change @ui.categorySelector': function(event) {
			this.category_id = Backbone.$(event.currentTarget).val();
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
		this.category_id = 0;

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
		if (this.category_id != null && categories[this.category_id]) {
			widgets = categories[this.category_id].widgets;
		}

		return {
			folders: folders,
			folder_id: this.folder_id,
			categories: categories,
			category_id: this.category_id,
			widgets: widgets,
			models: this.models,
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

var AppearanceController = Controller.extend({

	sidebarMenuService: 'appearance',
	sidebarMenu: SidebarMenuView,

	baseBreadcrum: [{
		title: 'Mises en page',
		href: '/appearance'
	}],

	showIndex: function() {
		this.navigationController.navigate('/appearance/layouts/cms-home');
	},

	showLayouts: function(page) {

		var l = new Layout();
		var c = new Layouts();

		l.getType(page).then(function(type) {
			c.fetch({
				data: {
					page: page
				}
			}).done(function() {
				var view = new LayoutsView({
					collection: c,
					page: page
				});
				this.navigationController.showContent(view);
				this.setHeader({
					title: type.name
				});
			}.bind(this)).fail(function() {
				this.notFound();
				this.setHeader({
					title: 'Type de mise en page introuvable'
				});
			}.bind(this));
		}.bind(this), function() {
			this.notFound();
			this.setHeader({
				title: 'Type de mise en page introuvable'
			});
		});
	},

	showLayout: function(page, id) {

		function buildBreadCrum(model) {
			return [{
					title: model.get('type').name,
					href: '/appearance/layouts/' + model.get('type').page
				},
				{
					title: model.get('name')
				}
			];
		}

		var m = new Builder({
			layout_id: id,
			page: page
		});

		m.save().done(function() {
				var view = new LayoutView({
					model: m,
					layout_id: id
				});
				this.listenTo(view, 'change:name', function(model) {
					this.setBreadCrum(buildBreadCrum(model), true);
				}.bind(this));
				this.navigationController.showContent(view);
				this.setHeader(buildBreadCrum(m), getHeadersAction());
			}.bind(this))
			.fail(function() {
				this.notFound();
				this.setHeader({
					title: 'Mise en page introuvable'
				});
			}.bind(this));
	},

	showDraft: function(id, args) {

		var apply = null;
		if (args) {
			var match = args.match(/^apply=([0-9]+)/);
			if (match) apply = parseInt(match[1]);
		}

		var m = new Builder({
			draft_id: id
		});

		m.fetch().done(function() {
				var view = new LayoutView({
					model: m,
					apply: apply
				});
				this.listenTo(view, 'change:name', function(model) {
					this.setBreadCrum([{
							title: m.get('type').name,
							href: '/appearance/layouts/' + m.get('type').page
						},
						{
							title: model.get('name')
						}
					], true);
				}.bind(this));
				this.navigationController.showContent(view);
				this.setHeader([{
						title: m.get('type').name,
						href: '/appearance/layouts/' + m.get('type').page
					},
					{
						title: m.get('name')
					}
				], getHeadersAction());
			}.bind(this))
			.fail(function() {
				this.notFound();
				this.setHeader({
					title: 'Mise en page introuvable'
				});
			}.bind(this));
	}

});

module.exports = Marionette.AppRouter.extend({
	controller: new AppearanceController(),
	appRoutes: {
		'appearance': 'showIndex',
		'appearance/layouts/:page': 'showLayouts',
		'appearance/layouts/:page/:id': 'showLayout',
		'appearance/drafts/:id': 'showDraft'
	},

	onRoute: function(name, path, args) {
		// Load an other sidebar for showLayout
		switch (name) {
			default: this.controller.sidebarMenuService = 'appearance';
			this.controller.sidebarMenu = SidebarMenuView;
			break;
			case 'showLayout':
					case 'showDraft':
					this.controller.sidebarMenuService = 'layout';
				this.controller.sidebarMenu = SidebarMenuLayoutView;
				break;
		}
		this.controller.showSidebarMenu();
	}
});
