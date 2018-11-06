var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var Session = Backbone.Radio.channel('app').request('ctx:session');

var Module = Backbone.Model.extend({
	defaults: {
		name: "",
		icon: '',
		desc: '',
		href: '/',
		quota: null,
		scope: null,
		feature: null,
		has_scope: true,
		has_feature: true
	}
});

module.exports = Marionette.View.extend({
	template: require('../templates/index.html'),
	className: 'container container-locked',
	service: 'modules',

	initialize: function() {
		this.spotlights = new Backbone.Collection();
		this.spotlights.model = Module;
		this.spotlights.add([{
			name: 'Dismoi?',
			icon: 'md-module-dismoi',
			desc: 'Créer et gérer des formulaires (contact, recrutement, sondage,...) entièrement paramétrables.',
			href: '/forms/inbox',
			quota: '2/50', // TODO,
			scope: 'site:modules'
		}, {
			name: 'Bons de réduction',
			icon: 'md-module-discount',
			desc: 'Créer et gérer des bons de réductions pour les animations commerciales.',
			href: '/modules/vouchers',
			scope: 'site:marketing',
			feature: 'checkout'
		}, {
			name: 'Points de fidélité',
			icon: 'md-module-fedelity',
			desc: 'Attribuer des points de fidélité	aux meilleurs clients pour leur faire bénéficier de remises sur les produits.',
			href: '/modules/fidelity',
			scope: 'site:modules',
			feature: 'fidelity'
		}, {
			name: 'Import dans le Catalogue',
			icon: 'md-module-importproducts',
			desc: 'Importer des produits pour remplir et mettre à jour rapidement le catalogue.',
			href: '/modules/import/products',
			scope: 'site:catalog',
			feature: 'catalog'
		}, {
			name: 'Abonnés à la newsletter',
			icon: 'md-module-newsletter',
			desc: 'Exporter tout ou partie des abonnés à la newsletter pour les utiliser avec une plateforme d\'emailing.',
			href: '/modules/subscribers',
			scope: 'site:marketing'
		}, {
			name: 'Gestion des sauvegardes',
			icon: 'md-module-backup',
			desc: 'Restaurer ou créer des points de sauvegarde pour sécurier toutes les données du site.',
			href: '/modules/backups',
			scope: 'site:backup'
		}]);

		this.list = new Backbone.Collection();
		this.list.model = Module;
		this.list.add([{
			name: 'Redirections 301',
			icon: 'md-module-301',
			desc: 'Définisser les redirections d\'URL permanentes à utiliser sur le site.',
			href: '/modules/redirections',
			scope: 'site:seo'
		}, {
			name: 'Injection de code',
			icon: 'md-module-code',
			desc: 'Injecter des scripts et du code avant <code>&lt;/head&gt;</code> et <code>&lt;/body&gt;</code> sur l\'ensemble du site.',
			href: '/modules/injectcode',
			scope: 'site:seo'
		}, {
			name: 'Import dans le Site Web',
			icon: 'md-module-importweb',
			desc: 'Importer des billets dans les pages du site web.',
			href: '/modules/import/posts',
			scope: 'site:cms'
		}, {
			name: 'Import depuis Wordpress',
			icon: 'md-module-importwp',
			desc: 'Importer du contenu depuis Wordpress dans le site web.',
			href: '/modules/import/wordpress',
			scope: 'site:blog'
		}, {
			name: 'Google Analytics',
			icon: 'md-module-ganalytics',
			desc: 'Paramétrer le tracking de Google Analytics sur l\'ensemble du site.',
			href: '/modules/analytics',
			scope: 'site:modules'
		}, {
			name: 'Google Merchant Center',
			icon: 'md-module-gmerchant',
			desc: 'Exporter les données produits vers Google Shopping ainsi que vers d\'autres services de Google.',
			href: '/modules/merchantcenter',
			scope: 'site:marketing',
			feature: 'checkout'
		}, {
			name: 'Lengow',
			icon: 'md-module-lengow',
			desc: 'Créer un flux de données pour publier les produits sur les principaux comparateurs de prix, affiliation et marketplaces.',
			href: '/modules/lengow',
			scope: 'site:marketing',
			feature: 'checkout'
		}, {
			name: 'iAdvize',
			icon: 'md-module-iadvize',
			desc: 'Échanger en direct avec les visiteurs lorsqu\'ils visitent le site.',
			href: '/modules/iadvize',
			scope: 'site:marketing'
		}, {
			name: 'Avis Vérifiés',
			icon: 'md-module-avisverifies',
			desc: 'Récolter les avis clients sur les commandes et les produits.',
			href: '/modules/avisverifies',
			scope: 'site:marketing',
			feature: 'checkout'
		}]);
	},

	templateContext: function() {

		this.spotlights.each(function(module) {
			module.set('has_scope', module.get('scope') ? Session.hasScope(module.get('scope')) : true);
			module.set('has_feature', module.get('feature') ? Session.hasFeature(module.get('feature')) : true);
		});
		this.list.each(function(module) {
			module.set('has_scope', module.get('scope') ? Session.hasScope(module.get('scope')) : true);
			module.set('has_feature', module.get('feature') ? Session.hasFeature(module.get('feature')) : true);
		});

		return {
			domain: Session.site.get('domain'),
			spotlights: this.spotlights.toJSON(),
			list: this.list.toJSON()
		};
	}

});
