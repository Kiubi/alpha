var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var AutocompleteInputView = require('kiubi/core/views/ui/input.search.js');

var Products = require('kiubi/modules/catalog/models/products');
var BlogPosts = require('kiubi/modules/blog/models/posts');
var Customers = require('kiubi/modules/customers/models/customers');
var Orders = require('kiubi/modules/checkout/models/orders');
var Files = require('kiubi/modules/media/models/files');
var Contents = require('kiubi/modules/cms/models/contents');
var Menus = require('kiubi/modules/cms/models/menus');

var searchCms = Marionette.Object.extend({
	initialize: function() {
		this.header = 'Résultats dans le site web';
		this.service = 'Site web';
		this.type = 'cms';
		this.serviceURL = '/cms/posts?';
	},
	suggest: function(term, limit) {
		var collectionContents = new Contents();
		var collectionMenu = new Menus();

		return Backbone.$.when(
			collectionContents.suggest(term, limit),
			collectionMenu.suggest(term, limit)
		).then(function(contents, pages) {

			var results = [];

			if (contents.length) {
				results.push({
					label: this.header,
					is_header: true
				});
				_.each(contents, function(content) {
					results.push(this.mapContent(content));
				}.bind(this));
			}

			if (pages.length) {
				results.push({
					label: 'Pages du site web',
					is_header: true
				});
				_.each(pages, function(page) {
					results.push(this.mapPage(page));
				}.bind(this));
			}

			if (contents.length || pages.length) {
				results.push({
					label: 'Tous les résultats',
					href: this.serviceURL + 'term=' + term,
					icon: 'md-search'
				});
			} else {
				results.push({
					label: 'Aucun résultat',
					href: '#',
					icon: 'md-no-result'
				});
			}

			return results;
		}.bind(this));

	},
	mapContent: function(content) {
		return {
			label: content.label,
			href: '/cms/contents/' + content.content_id,
			icon: 'md-website'
		};
	},
	mapPage: function(page) {
		var icon;
		switch (page.page_type) {
			default:
				icon = 'md-website';
				break;
			case 'lien_int':
				icon = 'md-directions';
				break;
			case 'lien_ext':
				icon = 'md-link';
				break;
		}
		return {
			label: page.name,
			href: '/cms/pages/' + page.page_id,
			icon: icon
		};
	},
	searchSummary: function(term) {
		return {
			term: term,
			href: this.serviceURL + 'term=' + term,
			service: this.service
		}
	}
});

var searchMixin = {
	suggest: function(term, limit) {
		var collection = new this.collection;

		return collection.suggest(term, limit).then(function(suggestions) {

			var results = [{
				label: this.header,
				is_header: true
			}];

			if (suggestions.length) {
				_.each(suggestions, function(suggestion) {
					results.push(this.mapSuggestion(suggestion));
				}.bind(this));
				results.push({
					label: 'Tous les résultats',
					href: this.serviceURL + 'term=' + term,
					icon: 'md-search'
				});
			} else {
				results.push({
					label: 'Aucun résultat',
					href: '#',
					icon: 'md-no-result'
				});
			}

			return results;
		}.bind(this));
	},
	searchSummary: function(term) {
		return {
			term: term,
			href: this.serviceURL + 'term=' + term,
			service: this.service
		}
	}
};

var searchCatalog = Marionette.Object.extend({
	initialize: function() {
		this.type = 'catalog';
		this.header = 'Résultats dans le catalogue';
		this.service = 'Catalogue';
		this.serviceURL = '/catalog?';
		this.collection = Products;
	},
	mapSuggestion: function(product) {
		return {
			label: product.name,
			href: '/catalog/products/' + product.product_id,
			icon: 'md-product'
		};
	},
});
_.extend(searchCatalog.prototype, searchMixin);

var searchCutomers = Marionette.Object.extend({
	initialize: function() {
		this.type = 'customers';
		this.header = 'Résultats dans les membres';
		this.service = 'Membres';
		this.serviceURL = '/customers?';

		this.collection = Customers;
	},
	mapSuggestion: function(customer) {
		return {
			label: customer.firstname + ' ' + customer.lastname,
			href: '/customers/' + customer.customer_id,
			icon: 'md-member'
		};
	},
});
_.extend(searchCutomers.prototype, searchMixin);

var searchBlog = Marionette.Object.extend({
	initialize: function() {
		this.type = 'blog';
		this.header = 'Résultats dans le blog';
		this.service = 'Blog';
		this.serviceURL = '/blog?';
		this.collection = BlogPosts;
	},
	mapSuggestion: function(post) {
		return {
			label: post.title,
			href: '/blog/posts/' + post.post_id,
			icon: 'md-blog'
		};
	},
});
_.extend(searchBlog.prototype, searchMixin);

var searchCheckout = Marionette.Object.extend({
	initialize: function() {
		this.type = 'checkout';
		this.header = 'Résultats dans les commandes';
		this.service = 'Commandes';
		this.serviceURL = '/checkout/orders?status=all&';
		this.collection = Orders;
	},
	mapSuggestion: function(order) {
		return {
			label: order.reference, // TODO show order.status
			href: '/checkout/orders/' + order.order_id,
			icon: 'md-order'
		};
	},
});
_.extend(searchCheckout.prototype, searchMixin);

var searchMedia = Marionette.Object.extend({
	initialize: function() {
		this.type = 'media';
		this.header = 'Résultats dans la médiathèque';
		this.service = 'Médiathèque';
		this.serviceURL = '/media?';
		this.collection = Products;
	},
	mapSuggestion: function(file) {
		return {
			label: file.name,
			href: '/media/files/' + file.media_id,
			icon: 'md-media'
		};
	},
});
_.extend(searchMedia.prototype, searchMixin);

var SearchEngines = Marionette.Object.extend({

	initialize: function() {
		this.engines = new Map();
		this.default = null;
	},

	addEngine: function(engine, is_default) {
		this.engines.set(engine.type, engine);
		if (is_default || !this.default) {
			this.default = engine;
		}
	},

	getEngine: function(type) {
		if (this.engines.has(type)) {
			return this.engines.get(type);
		}

		return this.default;
	}

});

module.exports = Marionette.View.extend({

	template: require('../templates/sidebarMenuTop.html'),

	service: '',

	ui: {
		'site-dropdown': '[data-role="site-dropdown"]',
		'site-search': '[data-role="site-search"]',
		'input-search': '[data-role="site-search"] input',
		'login': '[data-role="login"]'
	},

	events: {
		'click @ui.site-search a': 'onChooseSite',
		'hide.bs.dropdown @ui.site-dropdown': function(event) {
			this.emptyList();
			this.getUI('input-search').val('');
			this.trigger('close:sitesearch');
		},
		'shown.bs.dropdown @ui.site-dropdown': function(event) {
			this.getUI('input-search').focus();
			this.trigger('open:sitesearch');
		},
		'click @ui.login': function() {
			var Session = Backbone.Radio.channel('app').request('ctx:session');
			window.open(Session.autologLink());
		}

	},

	regions: {
		'detail': {
			el: 'div[data-role="content"]',
			replaceElement: true
		},
		'term': {
			el: 'div[data-role="term"]',
			replaceElement: true
		}
	},

	searchStack: null,

	initialize: function(options) {
		this.mergeOptions(options, ['model']);
		this.listenTo(this.model, 'change', this.onSessionChange);
		this.searchStack = [];

		var Session = Backbone.Radio.channel('app').request('ctx:session');
		this.searchEngines = new SearchEngines();
		this.searchEngines.addEngine(new searchCms(), true);
		if (Session.hasFeature('catalog') && Session.hasScope('site:catalog')) this.searchEngines.addEngine(new searchCatalog(), true); // will replace default cms
		if (Session.hasScope('site:account')) this.searchEngines.addEngine(new searchCutomers());
		this.searchEngines.addEngine(new searchBlog());
		if (Session.hasFeature('checkout') && Session.hasScope('site:checkout')) this.searchEngines.addEngine(new searchCheckout());
		this.searchEngines.addEngine(new searchMedia());
	},

	addSearch: function(search) {

		if (_.findWhere(this.searchStack, {
				term: search.term,
				service: search.service
			})) {
			return;
		}

		if (this.searchStack.length >= 3) {
			this.searchStack.shift();
		}
		this.searchStack.push(search);
	},

	templateContext: function() {
		return {
			fqdn: this.model.get('domain').replace(/^https?:\/\//, '')
		};
	},

	onRender: function() {

		this.getUI('input-search').on('keyup', _.debounce(this.onChange.bind(this), 300));

		var Session = Backbone.Radio.channel('app').request('ctx:session');
		var footer = [{
			label: 'Site web',
			icon: 'md-website',
			id: 'cms',
			className: null
		}, {
			label: 'Blog',
			icon: 'md-blog',
			id: 'blog',
			className: null
		}];

		if (Session.hasFeature('catalog') && Session.hasScope('site:catalog')) {
			footer.push({
				label: 'Catalogue',
				icon: 'md-product',
				id: 'catalog',
				className: null
			});
		}

		if (Session.hasFeature('checkout') && Session.hasScope('site:checkout')) {
			footer.push({
				label: 'Commandes',
				icon: 'md-order',
				id: 'checkout',
				className: null
			});
		}
		if (Session.hasScope('site:account')) {
			footer.push({
				label: 'Membres',
				icon: 'md-member',
				id: 'customers',
				className: null
			});
		}

		footer.push({
			label: 'Médiathèque',
			icon: 'md-media',
			id: 'media',
			className: null
		});

		this.showChildView('term', new AutocompleteInputView({
			searchPlaceholder: 'Recherche',
			name: 'term',
			extraDropdownClassname: 'form-group has-feedback sidebar-search mb-0',
			extraDropdownMenuClassname: 'sidebar-search-results',
			extraInputClassname: 'form-control-sidebar dropdown-toggle',
			footer: footer
		}));
	},

	onSessionChange: function(model) {
		if (model.hasChanged('domain') || model.hasChanged('name')) {
			var view = this.detachChildView('detail');
			this.render();
			if (view) this.showChildView('detail', view);
		}
	},

	/* Site search */

	onChange: function(event) {
		this.model.searchSite(Backbone.$(event.currentTarget).val()).done(function(result) {
			var list = '';
			if (result.length > 0) {
				list = _.reduce(result, function(memo, site) {
					var default_domain = site.domain.lastIndexOf(site.code_site, 0) != 0 ? '<small>' + site.code_site +
						'</small>' : '';
					return memo + '<li><a class="dropdown-item" href="#" title="' + site.domain + '" data-site="' +
						site.code_site + '">' + site.domain + default_domain + '</a></li>';
				}, '<li class="dropdown-divider"></li>');
			} else {
				list =
					'<li class="dropdown-divider"></li><li><span class="dropdown-item dropdown-item-empty"><span class="md-icon md-no-result"></span> Aucun résultat</span></li>';
			}
			this.emptyList().append(list);
			this.getUI('input-search').focus();
		}.bind(this));
	},

	onChooseSite: function(event) {
		var site = Backbone.$(event.currentTarget).data('site');
		if (!site) return;
		var Session = Backbone.Radio.channel('app').request('ctx:session');
		Session.changeSite(site).done(function() {
			var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
			navigationController.showOverlay(300);
			navigationController.navigate('/');
		});
	},

	closeDropdown: function() {
		if (this.getUI('site-search').parent().hasClass('show')) {
			this.getUI('site-search').parent().dropdown('toggle');
		}
	},

	emptyList: function() {
		var $first = this.getUI('site-search').children().eq(0).detach();
		return this.getUI('site-search').empty().append($first);
	},

	/* Global search */

	onChildviewInput: function(term, view) {
		if (term === '') return;

		var footer = view.getActiveFooter();
		var searchEngine = this.searchEngines.getEngine(footer ? footer.id : this.service);
		if (!searchEngine) return;
		searchEngine.suggest(term, 5).then(function(results) {

			if (this.searchStack.length) {
				results.push({
					label: 'Résultats récents',
					is_header: true
				});
				_.each(this.searchStack, function(search) {
					results.push({
						label: search.service + '<span class="md-icon md-next"></span>' + _.escape(search.term),
						href: search.href,
						icon: 'md-search',
						disable_escaping: true
					});
				});
			}

			view.showResults(results, {
				activeFooter: searchEngine.type
			});

			this.addSearch(searchEngine.searchSummary(term));
		}.bind(this));
	},

	onChildviewSelectFooter: function(id, view) {
		this.onChildviewInput(view.term, view);
	}

});
