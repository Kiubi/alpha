var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var Controller = require('kiubi/controller.js');
var ControllerChannel = Backbone.Radio.channel('controller');

var Builder = require('./models/builder');
var Layout = require('./models/layout');
var Layouts = require('./models/layouts');

// var IndexView = require('./views/index');
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

		var fail = this.failHandler('Type de mise en page introuvable');

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
			}.bind(this)).fail(fail);
		}.bind(this), fail);
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
			.fail(this.failHandler('Mise en page introuvable'));
	},

	showDraft: function(id, args) {

		var qs = this.parseQueryString(args, {
			apply: null
		});

		var m = new Builder({
			draft_id: id
		});

		m.fetch().done(function() {
				var view = new LayoutView({
					model: m,
					apply: qs.apply
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
			.fail(this.failHandler('Mise en page introuvable'));
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

		var Session = Backbone.Radio.channel('app').request('ctx:session');
		if (!Session.hasScope('site:layout')) {
			this.controller.navigationController.navigate('/');
			return;
		}

		// Load an other sidebar for showLayout
		switch (name) {
			default:
				this.controller.sidebarMenuService = 'appearance';
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
