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
		subscribe: false,
		quota: null,
		scope: null,
		feature: null,
		has_scope: true,
		has_feature: true,
		price: '',
		is_spotlight: false
	}
});

// SpotLights

var SpotlightRowView = Marionette.View.extend({
	template: require('../templates/modules.spotlight.html'),
	className: 'col-6 d-flex',

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
	template: require('../templates/modules.row.html'),
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

	initialize: function() {
		this.list = new Backbone.Collection();
		this.list.model = Module;
		this.list.add([
			// Spotlights	
			{
				name: 'Dismoi?',
				icon: 'assignment',
				color: '#337ab7',
				desc: 'Créer et gérer des formulaires (contact, recrutement, sondage,...) entièrement paramétrables.',
				href: '/forms/inbox',
				doc: 'https://aide.kiubi.com/recherche/catalogue/tags:Dismoi%3F/',
				quota: '2/50', // TODO,
				scope: 'site:modules',
				is_spotlight: true,
			}, {
				name: 'Bons de réduction',
				icon: 'loyalty',
				color: '#5CB299',
				desc: 'Créer et gérer des bons de réductions pour les animations commerciales.',
				href: '/modules/vouchers',
				doc: 'https://aide.kiubi.com/documentation/marketing-et-referencement/creer-un-bon-de-reduction.html',
				scope: 'site:marketing',
				feature: 'checkout',
				is_spotlight: true
			}, {
				name: 'Points de fidélité',
				icon: 'card_membership',
				color: '#c4b1c4',
				desc: 'Attribuer des points de fidélité	aux clients pour leur faire bénéficier de remises sur les produits.',
				href: '/modules/fidelity',
				doc: 'https://aide.kiubi.com/documentation/marketing-et-referencement/carte-de-fidelite.html',
				scope: 'site:modules',
				feature: 'fidelity',
				is_spotlight: true
			}, {
				name: 'Google Merchant Center',
				icon: 'shopping_cart',
				color: '#a24100',
				desc: 'Exporter les données produits vers Google Shopping ainsi que vers d\'autres services de Google.',
				href: '/modules/merchantcenter',
				scope: 'site:marketing',
				feature: 'checkout',
				is_spotlight: true
			}, {
				name: 'Import dans le Catalogue',
				icon: 'publish',
				color: '#fda951',
				desc: 'Importer des produits pour remplir et mettre à jour rapidement le catalogue.',
				href: '/modules/import/products',
				scope: 'site:catalog',
				feature: 'catalog',
				is_spotlight: true
			}, {
				name: 'Extranet',
				icon: 'lock',
				color: '#8a6d3b',
				desc: 'Restreindre l\'accès aux pages du site. Créer des groupes de clients et y appliquer des remises.',
				href: '/customers/groups',
				doc: 'https://aide.kiubi.com/recherche/catalogue/?r=extranet',
				subscribe: true,
				scope: 'site:modules',
				feature: 'extranet',
				price: '5,00€HT/mois',
				is_spotlight: true
			}, {
				name: 'Médiathèque avancée',
				icon: 'perm_media',
				color: '#86df6a',
				desc: 'Redimensionner les images téléchargées dans la médiathèque. Importer des fichiers depuis une adresse web ou Dropbox.',
				href: '/modules/import/files',
				doc: 'https://aide.kiubi.com/documentation/mediatheque-avancee.html',
				subscribe: true,
				scope: 'site:modules',
				feature: 'advanced_media',
				price: '9,00€HT/mois',
				is_spotlight: true
			}, {
				name: 'Points de retrait multiples',
				icon: 'add_location',
				color: '#54bef7',
				desc: 'Créer plusieurs points de retrait des commandes en magasin pour le module de Click & Collect.',
				href: '/checkout/carriers',
				subscribe: true,
				scope: 'site:checkout',
				feature: 'multi_pickup',
				price: '19,00€/mois',
				is_spotlight: true
			},

			// Modules
			{
				name: 'Google Analytics',
				icon: 'bar_chart',
				desc: 'Paramétrer le tracking de Google Analytics sur l\'ensemble du site.',
				href: '/modules/analytics',
				scope: 'site:modules'
			}, {
				name: 'Google reCaptcha',
				icon: 'how_to_reg',
				desc: 'Paramétrer le captcha de Google sur l\'ensemble du site.',
				href: '/modules/captcha',
				scope: 'site:pref'
			}, {
				name: 'Redirections 301',
				icon: 'directions',
				desc: 'Définisser les redirections d\'URL permanentes à utiliser sur le site.',
				href: '/modules/redirections',
				scope: 'site:seo'
			}, {
				name: 'Injection de code',
				icon: 'code',
				desc: 'Injecter des scripts et du code avant <code>&lt;/head&gt;</code> et <code>&lt;/body&gt;</code> sur l\'ensemble du site.',
				href: '/modules/injectcode',
				scope: 'site:seo'
			}, {
				name: 'Abonnés à la newsletter',
				icon: 'email',
				desc: 'Exporter tout ou partie des abonnés à la newsletter pour les utiliser avec une plateforme d\'emailing.',
				href: '/modules/subscribers',
				scope: 'site:marketing'
			}, {
				name: 'Import dans le Site Web',
				icon: 'description',
				desc: 'Importer des billets dans les pages du site web.',
				href: '/modules/import/posts',
				scope: 'site:cms'
			}, {
				name: 'Import depuis Wordpress',
				icon: 'public',
				desc: 'Importer du contenu depuis Wordpress dans le site web.',
				href: '/modules/import/wordpress',
				scope: 'site:blog'
			}, {
				name: 'Import Coliship',
				icon: 'publish',
				desc: 'Importer des données d\'expédition de Coliship.',
				href: '/modules/import/coliship',
				scope: 'site:checkout',
				feature: 'checkout'
			}, {
				name: 'Gestion des sauvegardes',
				icon: 'backup',
				desc: 'Restaurer ou créer des points de sauvegarde pour sécurier toutes les données du site.',
				href: '/modules/backups',
				scope: 'site:backup'
			}, {
				name: 'Lengow',
				icon: 'call_split',
				desc: 'Créer un flux de données pour publier les produits sur les principales plateformes marketing.',
				href: '/modules/lengow',
				scope: 'site:marketing',
				feature: 'checkout'
			}, {
				name: 'iAdvize',
				icon: 'chat',
				desc: 'Échanger en direct avec les visiteurs lorsqu\'ils visitent le site.',
				href: '/modules/iadvize',
				scope: 'site:marketing'
			}, {
				name: 'Avis Vérifiés',
				icon: 'star',
				desc: 'Récolter les avis clients sur les commandes et les produits.',
				href: '/modules/avisverifies',
				scope: 'site:marketing'
			}
		]);
	},

	onRender: function() {

		this.list.each(function(module) {
			module.set('has_scope', module.get('scope') ? Session.hasScope(module.get('scope')) : true);
			module.set('has_feature', module.get('feature') ? Session.hasFeature(module.get('feature')) : true);
		});

		// Spotlights
		var spotlightsCollection = new Backbone.Collection(
			this.list.filter(function(model) {
				if (model.get('is_spotlight') == false) return false;
				return ((model.get('has_scope') && model.get('has_feature')) || model.get('subscribe'));
			})
		);
		this.showChildView('spotlights', new SpotlightsListView({
			collection: spotlightsCollection
		}));

		// Modules
		var modulesCollection = new Backbone.Collection(
			this.list.filter(function(model) {
				if (!model.get('is_spotlight') == false) return false;
				return (model.get('has_scope') && model.get('has_feature'));
			})
		);
		this.showChildView('modules', new ModulesListView({
			collection: modulesCollection
		}));
	},

	templateContext: function() {
		return {
			domain: Session.site.get('domain')
		};
	}

});
