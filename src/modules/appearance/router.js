var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var Router = require('kiubi/utils/router.js');
var Controller = require('kiubi/controller.js');

var Builder = require('./models/builder');
var Layout = require('./models/layout');
var Layouts = require('./models/layouts');

// var IndexView = require('./views/index');
var LayoutsView = require('./views/layouts');
var LayoutView = require('./views/layout');
var SidebarMenuLayoutView = require('./views/layout.sidebar');

var ActiveLinksBehaviors = require('kiubi/behaviors/active_links.js');

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

module.exports = Router.extend({
	controller: new AppearanceController(),
	appRoutes: {
		'appearance': 'showIndex',
		'appearance/layouts/:page': 'showLayouts',
		'appearance/layouts/:page/:id': 'showLayout',
		'appearance/drafts/:id': 'showDraft'
	},

	onRoute: function(name) {

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
