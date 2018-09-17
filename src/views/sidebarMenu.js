var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var AutocompleteInputView = require('kiubi/views/ui/input.search.js');

var Products = require('kiubi/modules/catalog/models/products');
var BlogPosts = require('kiubi/modules/blog/models/posts');
var Customers = require('kiubi/modules/customers/models/customers');
var Orders = require('kiubi/modules/checkout/models/orders');
var Files = require('kiubi/modules/media/models/files');

function getTypeIcon(type) {
	switch (type) {
		case 'cms':
			return 'md-website';
		case 'blog':
			return 'md-blog';
		case 'catalog':
		default:
			return 'md-product';
		case 'checkout':
			return 'md-order';
		case 'customers':
			return 'md-member';
		case 'media':
			return 'md-media';
	}
}

function searchConfig(type) {

	var collection, mapSuggestion, header, service, serviceURL;

	var icon = getTypeIcon(type);

	// => TODO
	// cms

	switch (type) {
		case 'catalog':
		default:
			collection = Products;
			mapSuggestion = function(product) {
				return {
					label: product.name,
					href: '/catalog/products/' + product.product_id,
					icon: icon
				}
			};
			header = 'Résultats dans le catalogue';
			service = 'Catalogue';
			serviceURL = '/catalog';
			break;

		case 'customers':
			collection = Customers;
			mapSuggestion = function(customer) {
				return {
					label: customer.firstname + ' ' + customer.lastname,
					href: '/customers/' + customer.customer_id,
					icon: icon
				}
			};
			header = 'Résultats dans les membres';
			service = 'Membres';
			serviceURL = '/customers';
			break;

		case 'blog':
			collection = BlogPosts;
			mapSuggestion = function(post) {
				return {
					label: post.title,
					href: '/blog/posts/' + post.post_id,
					icon: icon
				}
			};
			header = 'Résultats dans le blog';
			service = 'Blog';
			serviceURL = '/blog';
			break;

		case 'checkout':
			collection = Orders;
			mapSuggestion = function(order) {
				return {
					label: order.reference,
					href: '/checkout/orders/' + order.order_id,
					icon: icon
				}
			};
			header = 'Résultats dans les commandes';
			service = 'Commandes';
			serviceURL = '/checkout';
			break;

		case 'media':
			collection = Files;
			mapSuggestion = function(file) {
				return {
					label: file.name,
					href: '/media/files/' + file.media_id,
					icon: icon
				}
			};
			header = 'Résultats dans la médiathèque';
			service = 'Médiathèque';
			serviceURL = '/media';
			break;
	}

	return {
		header: header,
		collection: collection,
		mapSuggestion: mapSuggestion,
		service: service,
		serviceURL: serviceURL
	};

}

module.exports = Marionette.View.extend({

	template: require('../templates/sidebarMenu.html'),

	service: '',

	ui: {
		'site-dropdown': '[data-role="site-dropdown"]',
		'site-search': '[data-role="site-search"]',
		'input-search': '[data-role="site-search"] input'
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
	},

	addSearch: function(search) {
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

		this.showChildView('term', new AutocompleteInputView({
			searchPlaceholder: 'Recherche',
			name: 'term',
			extraDropdownClassname: 'form-group has-feedback sidebar-search mb-0',
			extraDropdownMenuClassname: 'sidebar-search-results',
			extraInputClassname: 'form-control-sidebar dropdown-toggle',
			footer: [
				/*{
									label: 'Site web',
									icon: 'md-website',
									id: 'cms',
									className: null
								},*/
				{
					label: 'Blog',
					icon: 'md-blog',
					id: 'blog',
					className: null
				},
				{
					label: 'Catalogue',
					icon: 'md-product',
					id: 'catalog',
					className: null
				},
				{
					label: 'Commandes',
					icon: 'md-order',
					id: 'checkout',
					className: null
				},
				{
					label: 'Membres',
					icon: 'md-member',
					id: 'customers',
					className: null
				},
				{
					label: 'Médiathèque',
					icon: 'md-media',
					id: 'media',
					className: null
				}
			]
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
					return memo + '<li><a class="dropdown-item" href="#" title="' + site.domain + '" data-site="' + site.code_site +
						'">' + site.domain +
						'</a></li>';
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
		if (term == '') return;

		var footer = view.getActiveFooter();
		var currentService = footer ? footer.id : this.service;
		var config = searchConfig(currentService);

		var c = new config.collection();
		c.suggest(term, 5).done(function(suggestions) {

			var results = [{
				label: config.header,
				is_header: true
			}];

			if (suggestions.length) {
				_.each(suggestions, function(suggestion) {
					results.push(config.mapSuggestion(suggestion));
				});
				results.push({
					label: 'Tous les résultats',
					href: config.serviceURL + '?term=' + term,
					icon: 'md-search'
				});
			} else {
				results.push({
					label: '<span class="md-icon md-no-result"></span> Aucun résultat',
					href: '#'
				});
			}

			if (this.searchStack.length) {
				results.push({
					label: 'Résultats récents',
					is_header: true
				});
				_.each(this.searchStack, function(search) {
					results.push({
						label: search.service + '<span class="md-icon md-next"></span>' + search.term, // TODO escape
						href: search.href,
						icon: 'md-search'
					});
				});
			}

			view.showResults(results, {
				activeFooter: currentService
			});

			this.addSearch({
				term: term,
				href: config.serviceURL + '?term=' + term,
				service: config.service
			});
		}.bind(this));

	},

	onChildviewSelectFooter: function(id, view) {
		this.onChildviewInput(view.term, view);
	}

});
