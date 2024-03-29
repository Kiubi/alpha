var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var Session = Backbone.Radio.channel('app').request('ctx:session');

var Module = Backbone.Model.extend({
	defaults: {
		name: "",
		icon: 'extension',
		color: '',
		desc: '',
		href: '/',
		doc: '',
		//subscribe: false,
		quota: null,
		require_scope: null,
		require_feature: null,
		feature: null,
		has_scope: true,
		has_feature: true,
		price: '',
		is_spotlight: false,
		is_enabled: false
	}
});

// SpotLights

var SpotlightRowView = Marionette.View.extend({
	template: require('../templates/modules/spotlight.html'),
	className: 'col-12 col-md-6 d-flex',

	events: {
		'click a[data-role="subscribe"]': function() {
			window.open(Session.autologAccountLink('/sites/options.html?code_site=' + Session.site.get('code_site')));
		}
	},

	templateContext: function() {
		return {
			code_site: Session.site.get('code_site')
		};
	}

});

var SpotlightsListView = Marionette.CollectionView.extend({
	className: 'row',
	childView: SpotlightRowView
});

// Modules

var ModuleRowView = Marionette.View.extend({
	template: require('../templates/modules/row.html'),
	className: 'list-item visible-btn'
});

var ModulesListView = Marionette.CollectionView.extend({
	className: 'post-content post-list no-hover module-list',
	childView: ModuleRowView
});

module.exports = Marionette.View.extend({
	template: require('../templates/index.html'),
	className: 'container container-locked',
	service: 'modules',

	regions: {
		'spotlights': {
			el: 'div[data-role="spotlights"]',
			replaceElement: true
		},
		'modules': {
			el: 'div[data-role="modules"]',
			replaceElement: true
		}
	},

	initialize: function(options) {

		this.mergeOptions(options, ['apps']);

		this.list = new Backbone.Collection();
		this.list.model = Module;
		this.list.add([
			// Spotlights
			{
				name: 'Dismoi?',
				icon: 'move_to_inbox',
				color: '#337ab7',
				desc: 'Créer et gérer des formulaires (contact, recrutement, sondage,...) entièrement paramétrables.',
				href: '/forms/inbox',
				doc: 'https://aide.kiubi.com/formulaires-dismoi.html',
				quota: '2/50', // TODO,
				require_scope: 'site:modules',
				is_spotlight: true,
			}, {
				name: 'Bons de réduction',
				icon: 'loyalty',
				color: '#5CB299',
				desc: 'Créer et gérer des bons de réductions pour les animations commerciales.',
				href: '/modules/vouchers',
				doc: 'https://aide.kiubi.com/modules.html#bons-de-reduction',
				require_scope: 'site:marketing',
				require_feature: 'checkout',
				feature: 'checkout',
				is_spotlight: true
			}, {
				name: 'Points de fidélité',
				icon: 'card_membership',
				color: '#c4b1c4',
				desc: 'Attribuer des points de fidélité	aux clients pour leur faire bénéficier de remises sur les produits.',
				href: '/modules/fidelity',
				doc: 'https://aide.kiubi.com/membres.html#points-de-fidelite',
				require_scope: 'site:modules',
				require_feature: 'fidelity',
				feature: 'fidelity',
				is_spotlight: true
			}, {
				name: 'Google Merchant Center',
				icon: 'shopping_cart',
				color: '#a24100',
				desc: 'Exporter les données produits vers Google Shopping ainsi que vers d\'autres services de Google.',
				href: '/modules/merchantcenter',
				require_scope: 'site:marketing',
				require_feature: 'checkout',
				feature: 'checkout',
				is_spotlight: true
			}, {
				name: 'Import dans le Catalogue',
				icon: 'publish',
				color: '#fda951',
				desc: 'Importer des produits pour remplir et mettre à jour rapidement le catalogue.',
				href: '/modules/import/products',
				require_scope: 'site:catalog',
				require_feature: 'catalog',
				feature: 'catalog',
				is_spotlight: true
			}, {
				name: 'Extranet',
				icon: 'lock',
				color: '#8a6d3b',
				desc: 'Restreindre l\'accès aux pages du site. Créer des groupes de clients et y appliquer des remises.',
				href: '/customers/groups',
				doc: 'https://aide.kiubi.com/membres.html#extranet',
				//subscribe: true,
				require_scope: 'site:modules',
				require_feature: 'extranet',
				feature: 'extranet',
				price: '5,00€HT/mois',
				is_spotlight: true
			}, {
				name: 'Médiathèque avancée',
				icon: 'perm_media',
				color: '#86df6a',
				desc: 'Redimensionner les images téléchargées dans la médiathèque. Importer des fichiers depuis une adresse web ou Dropbox.',
				href: '/modules/import/files',
				doc: 'https://aide.kiubi.com/modules.html#mediatheque-avancee',
				//subscribe: true,
				require_scope: 'site:modules',
				feature: 'advanced_media',
				price: '9,00€HT/mois',
				is_spotlight: true
			}, {
				name: 'Points de retrait multiples',
				icon: 'add_location',
				color: '#54bef7',
				desc: 'Créer plusieurs points de retrait des commandes en magasin pour le module de Click & Collect.',
				href: '/checkout/carriers',
				//subscribe: true,
				require_scope: 'site:checkout',
				feature: 'multi_pickup',
				require_feature: 'checkout',
				price: '19,00€/mois',
				is_spotlight: true
			}, {
				name: 'Tarifs dégressifs',
				icon: 'trending_down',
				color: '#a15db1',
				desc: 'Créer des grilles de tarifs dégressifs en fonction de la quantité de produits achetée.',
				href: '/modules/tier_prices',
				//subscribe: true,
				require_scope: 'site:catalog',
				require_feature: 'checkout',
				feature: 'tier_prices',
				price: '9,00€/mois',
				is_spotlight: true
			},

			// Modules
			{
				name: 'Google Analytics',
				icon: 'analytics',
				desc: 'Paramétrer le tracking de Google Analytics sur l\'ensemble du site.',
				href: '/modules/analytics',
				require_scope: 'site:modules'
			}, {
				name: 'Google reCaptcha',
				icon: 'how_to_reg',
				desc: 'Paramétrer le captcha de Google sur l\'ensemble du site.',
				href: '/modules/captcha',
				require_scope: 'site:pref'
			}, {
				name: 'Redirections 301',
				icon: 'directions',
				desc: 'Définisser les redirections d\'URL permanentes à utiliser sur le site.',
				href: '/modules/redirections',
				require_scope: 'site:seo'
			}, {
				name: 'Injection de code',
				icon: 'code',
				desc: 'Injecter des scripts et du code avant <code>&lt;/head&gt;</code> et <code>&lt;/body&gt;</code> sur l\'ensemble du site.',
				href: '/modules/injectcode',
				require_scope: 'site:seo'
			}, {
				name: 'Abonnés à la newsletter',
				icon: 'email',
				desc: 'Exporter tout ou partie des abonnés à la newsletter pour les utiliser avec une plateforme d\'emailing.',
				href: '/modules/subscribers',
				require_scope: 'site:marketing'
			}, {
				name: 'Authorized Digital Sellers (ADS)',
				icon: 'picture_in_picture',
				desc: 'Configurer vos fichiers <code>ads.txt</code> et <code>app-ads.txt</code>.',
				href: '/modules/ads',
				require_scope: 'site:marketing'
			}, {
				name: 'Import dans le Site Web',
				icon: 'description',
				desc: 'Importer des contenus dans les pages du site web.',
				href: '/modules/import/contents',
				require_scope: 'site:cms'
			}, {
				name: 'Import depuis Wordpress',
				icon: 'public',
				desc: 'Importer du contenu depuis Wordpress dans le site web.',
				href: '/modules/import/wordpress',
				require_scope: 'site:blog'
			}, {
				name: 'Import Coliship',
				icon: 'publish',
				desc: 'Importer des données d\'expédition de Coliship.',
				href: '/modules/import/coliship',
				require_scope: 'site:checkout',
				require_feature: 'checkout',
				feature: 'checkout'
			}, {
				name: 'Import Mondial Relay',
				icon: 'publish',
				desc: 'Importer des données d\'expédition de Mondial Relay Connect.',
				href: '/modules/import/mondialrelay',
				require_scope: 'site:checkout',
				require_feature: 'checkout',
				feature: 'checkout'
			}, {
				name: 'Gestion des sauvegardes',
				icon: 'backup',
				desc: 'Restaurer ou créer des points de sauvegarde pour sécurier toutes les données du site.',
				href: '/modules/backups',
				require_scope: 'site:backup'
			}, {
				name: 'Lengow',
				icon: 'call_split',
				desc: 'Créer un flux de données pour publier les produits sur les principales plateformes marketing.',
				href: '/modules/lengow',
				require_scope: 'site:marketing',
				require_feature: 'checkout',
				feature: 'checkout'
			}, {
				name: 'iAdvize',
				icon: 'chat',
				desc: 'Échanger en direct avec les visiteurs lorsqu\'ils visitent le site.',
				href: '/modules/iadvize',
				require_scope: 'site:marketing',
				require_feature: 'checkout',
				feature: 'checkout'
			}, {
				name: 'Avis Vérifiés',
				icon: 'star',
				desc: 'Récolter les avis clients sur les commandes et les produits.',
				href: '/modules/avisverifies',
				require_scope: 'site:marketing',
				require_feature: 'checkout',
				feature: 'checkout'
			}
		]);

		if (this.apps) {

			this.apps.fetch().done(function() {

				this.apps.each(function(app) {

					this.list.add(
						// App
						{
							name: app.get('name'),
							icon: app.get('icon') || 'settings_applications',
							color: app.get('color') || '#337ab7',
							desc: app.get('description'),
							href: '/modules/apps/' + app.get('app_id'),
							//doc: 'https://aide.kiubi.com/formulaires-dismoi.html',
							//quota: '',
							//scope: 'site:modules',
							//require_scope: 'site:checkout',
							//feature: 'multi_pickup',
							//require_feature: 'checkout',
							is_spotlight: true
						});

				}.bind(this));

				this.render();

			}.bind(this));
		}
	},

	templateContext: function() {
		return {
			domain: Session.site.get('domain')
		};
	},

	onRender: function() {

		this.list.each(function(module) {
			module.set('has_scope', module.get('require_scope') ? Session.hasScope(module.get('require_scope')) : true);
			module.set('has_feature', module.get('require_feature') ? Session.hasFeature(module.get('require_feature')) : true);
			module.set('is_enabled', module.get('feature') ? Session.hasFeature(module.get('feature')) : true);
		});

		// Spotlights
		var spotlightsCollection = new Backbone.Collection(
			this.list.filter(function(model) {
				if (!model.get('is_spotlight')) return false;
				return (model.get('has_scope') && model.get('has_feature'));
			})
		);
		this.showChildView('spotlights', new SpotlightsListView({
			collection: spotlightsCollection
		}));

		// Modules
		var modulesCollection = new Backbone.Collection(
			this.list.filter(function(model) {
				if (model.get('is_spotlight')) return false;
				return (model.get('has_scope') && model.get('has_feature'));
			})
		);
		this.showChildView('modules', new ModulesListView({
			collection: modulesCollection
		}));
	},



});
