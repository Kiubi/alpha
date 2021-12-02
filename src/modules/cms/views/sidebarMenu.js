var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
//var _ = require('underscore');

var Menus = require('../models/menus');
var Symbols = require('../models/symbols');

var MenuTree = require('kiubi/core/views/ui/menuTree.js');
var MenuTreeView = require('kiubi/core/views/ui/menuTreeView.js');

var SidebarMenuTreeView = Marionette.View.extend({
	template: require('../templates/sidebarMenu/menus.html'),
	service: 'cms',

	events: {
		'show.bs.collapse': function(event) {
			Backbone.$('[href="#' + event.target.id + '"]', this.el).parent().
			removeClass('menu-expand-more').addClass('menu-expand-less');
			this.menuTree.openNode(parseInt(event.target.id.substring(8)));
		},
		'hide.bs.collapse': function(event) {
			Backbone.$('[href="#' + event.target.id + '"]', this.el).parent().
			removeClass('menu-expand-less').addClass('menu-expand-more');
			this.menuTree.closeNode(parseInt(event.target.id.substring(8)));
		},
		'click a': function(event) {
			var $link = Backbone.$(event.currentTarget);
			if ($link.attr('href') == '#') return; // Not a treemenu link
			Backbone.$('a', this.el).parent().removeClass('active');
			$link.parent().addClass('active');
		}
	},

	page_id: -1,

	initialize: function(options) {
		this.page_id = -1;
		this.collection = new Menus();

		this.fetchAndRender();

		var that = this;

		this.menuTree = new MenuTree({
			nodeInfo: function(model) {

				var extraClassname = '';

				if (!model.get('is_visible')) {
					extraClassname += ' pagetype-visibility-off';
				}

				switch (model.get('page_type')) {
					case 'lien_int':
						extraClassname += ' pagetype-internal-link';
						break;
					case 'lien_ext':
						extraClassname += ' pagetype-external-link';
						break;
					case 'separateur':
						extraClassname += ' pagetype-separator';
						break;
					case 'page':
						extraClassname += ' pagetype-page';
						break;
				}
				if (model.get('has_restrictions')) extraClassname += ' pagetype-extranet';

				return {
					url: model.get('is_home') ? '/cms' : '/cms/pages/' + model.get('page_id'),
					name: model.get('name'),
					is_active: model.get('page_id') == that.page_id,
					extraClassname: extraClassname
				};
			}
		});
	},

	changePage: function(page_id) {
		if (this.page_id == page_id) return;

		this.page_id = page_id;
		this.render();
	},

	fetchAndRender: function() {
		this.collection.fetch({
			data: {
				extra_fields: 'pages'
			}
		}).done(function() {
			this.render();
		}.bind(this));
	},

	templateContext: function() {
		return {
			renderMenu: function(menu_id) {
				if (this.page_id == -1) return '';
				return this.menuTree.render(this.collection.getMenuTree(menu_id)).html;
			}.bind(this)
		};
	}

});

var SidebarMenuSymbolsView = Marionette.View.extend({

	template: require('../templates/sidebarMenu/symbols.html'),

	symbol_id: null,

	regions: {
		tree: {
			el: "div[data-role='tree']",
			replaceElement: true
		}
	},

	initialize: function(options) {

		this.symbol_id = null;

		this.collection = new Symbols();
		this.fetchAndRender();

	},

	templateContext: function() {

		return {
			'limit': this.collection.getQuota(),
			'usage': this.collection.length
		};

	},

	fetchAndRender: function() {
		this.collection.fetch().done(function() {
			this.render(); // FIXME : let node open
		}.bind(this));
	},

	changeSymbol: function(symbol_id) {
		if (this.symbol_id == symbol_id) return;

		this.symbol_id = symbol_id;
		this.render(); // FIXME : let node open
	},

	onRender: function() {
		if (this.collection.length === 0) return;

		var view = new MenuTreeView({
			nodeInfo: this.nodeInfo.bind(this),
			expandByDefault: true
		});
		this.showChildView('tree', view);
		view.setTree(this.collection.getMenuTree())
	},

	nodeInfo: function(model) {
		return {
			url: model.get('type') === 'symbol' ? '/cms/symbols/' + model.get('id') : '#',
			name: model.get('name'),
			is_active: model.get('id') == this.symbol_id
		};
	}

});

module.exports = Marionette.View.extend({
	template: require('../templates/sidebarMenu.html'),
	service: 'cms',

	ui: {
		'btn-page-add': 'a[data-role="page-add"]'
	},

	events: {
		'click @ui.btn-page-add': 'addPage'
	},

	regions: {
		menus: {
			el: "div[data-role='menus']",
			replaceElement: true
		},
		symbols: {
			el: "div[data-role='symbols']",
			replaceElement: true
		}
	},

	onRender: function() {
		this.showChildView('menus', new SidebarMenuTreeView());

		var Session = Backbone.Radio.channel('app').request('ctx:session');
		if (Session.hasFeature('component')) {
			this.showChildView('symbols', new SidebarMenuSymbolsView());
		}

	},

	onRefreshMenus: function() {
		var view = this.getChildView('menus');
		if (view) view.fetchAndRender();
	},

	onChangePage: function(page_id) {
		var view = this.getChildView('menus');
		if (view) view.changePage(page_id);

		var view = this.getChildView('symbols');
		if (view) view.changeSymbol(null);
	},

	onRefreshSymbols: function() {
		var view = this.getChildView('symbols');
		if (view) view.fetchAndRender();
	},

	onChangeSymbol: function(symbol_id) {
		var view = this.getChildView('menus');
		if (view) view.changePage(null);

		var view = this.getChildView('symbols');
		if (view) view.changeSymbol(symbol_id);
	},

	addPage: function(event) {

		var $link = Backbone.$(event.currentTarget);

		this.trigger('add:page', $link.data('id'));
	}

});
