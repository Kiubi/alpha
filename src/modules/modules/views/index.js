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
			icon: 'thumbs-id-dismoi',
			desc: 'Créer et gérer vos formulaires (contact, recrutement, sondage,...) entièrement paramétrables.',
			href: '/forms/inbox',
			quota: '2/50', // TODO,
			scope: 'site:modules'
		}, {
			name: 'Bons de réduction',
			icon: 'thumbs-id-discount',
			desc: 'Créer et gérer vos bons de réductions pour vos animations commerciales.',
			href: '/modules/vouchers',
			scope: 'site:marketing',
			feature: 'checkout'
		}, {
			name: 'Points de fidélité',
			icon: 'thumbs-id-fedelity',
			desc: 'Attribuer des points de fidélité à vos meilleurs clients pour leur faire bénéficier de remises sur vos produits.',
			href: '/modules/fidelity',
			scope: 'site:modules',
			feature: 'fidelity'
		}, {
			name: 'Import dans le Catalogue',
			icon: 'thumbs-id-importproducts',
			desc: 'Importer des produits dans le Catalogue.',
			href: '/modules/import/products',
			scope: 'site:catalog',
			feature: 'catalog'
		}, {
			name: 'Abonnés à la newsletter',
			icon: 'thumbs-id-newsletter',
			desc: 'Exporter tout ou partie de vos abonnés à votre newsletter pour les utiliser avec votre plateforme d\'emailing favorite.',
			href: '/modules/subscribers',
			scope: 'site:marketing'
		}, {
			name: 'Gestion des sauvegardes',
			icon: 'thumbs-id-backup',
			desc: 'Restaurez des points de sauvegarde ou créez-en à votre convenance pour sécurier les données de votre site.',
			href: '/modules/backups',
			scope: 'site:backup'
		}]);

		this.list = new Backbone.Collection();
		this.list.model = Module;
		this.list.add([{
			name: 'Redirections 301',
			desc: 'Définissez les redirections d\'URL permanentes à utiliser sur votre site.',
			href: '/modules/redirections',
			scope: 'site:seo'
		}, {
			name: 'Injection de code',
			desc: 'Injectez des scripts et du code avant <code>&lt;/head&gt;</code> et <code>&lt;/body&gt;</code> sur l\'ensemble de votre site.',
			href: '/modules/injectcode',
			scope: 'site:seo'
		}, {
			name: 'Import dans le Site Web',
			desc: 'Importez des billets dans les pages de votre site web.',
			href: '/modules/import/posts',
			scope: 'site:cms'
		}, {
			name: 'Import depuis Wordpress',
			desc: 'Importez du contenu depuis Wordpress dans votre site.',
			href: '/modules/import/wordpress',
			scope: 'site:blog'
		}, {
			name: 'Google Analytics',
			desc: 'Paramétrez le tracking de Google Analytics sur votre site.',
			href: '/modules/analytics',
			scope: 'site:modules'
		}, {
			name: 'Google Merchant Center',
			desc: 'Utilisez Google Merchant Center pour importer vos données produits sur Google et les proposer dans Google Shopping ainsi que dans d\'autres services Google.',
			href: '/modules/merchantcenter',
			scope: 'site:marketing',
			feature: 'checkout'
		}, {
			name: 'Lengow',
			desc: 'Utilisez Lengow pour créer un flux de données afin de publier vos produits sur les principaux comparateurs de prix, affiliation et marketplaces.',
			href: '/modules/lengow',
			scope: 'site:marketing',
			feature: 'checkout'
		}, {
			name: 'iAdvize',
			desc: 'Configurer iAdvize pour échanger en direct avec vos visiteurs lorsqu\'ils visitent votre site.',
			href: '/modules/iadvize',
			scope: 'site:marketing'
		}, {
			name: 'Avis Vérifiés',
			desc: 'Récoltez les avis de vos clients sur vos commandes et vos produits avec la plateforme Avis Vérifiés.',
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
