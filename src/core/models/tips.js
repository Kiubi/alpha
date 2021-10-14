var Backbone = require('backbone');

module.exports = Backbone.Collection.extend({

	defaults: {
		msg: '',
		link: null,
		help: null
	},

	fetch: function() {

		this.add([{
				msg: 'Pour améliorer la sécurité de votre site Internet, activez son accès HTTPS.',
				link: '/prefs/https',
				help: 'https://aide.kiubi.com/preferences.html#acces-https'
			}, {
				msg: 'Dismoi? permet de créer et de gérer tous types de formulaires de contact.',
				link: '/forms',
				help: 'https://aide.kiubi.com/formulaires-dismoi.html'
			}, {
				msg: 'Votre catalogue de produits peut être mis à jour par import de fichier Excel.',
				link: '/modules/import/products',
				help: 'https://aide.kiubi.com/catalogue.html#import-de-produits'
			}, {
				msg: 'Les billets et les composants du site web peuvent être personnalisés selon vos besoins.',
				help: 'https://aide.kiubi.com/design-generalites.html#types-de-billets'
			}, {
				msg: 'Vous disposez de plus de 40 widgets, tous personnalisables et paramétrables.',
				help: 'https://aide.kiubi.com/design-generalites.html#widgets'
			}, {
				msg: 'Les commentaires du blog peuvent être modérés avant leur publication.',
				link: '/blog/settings',
				help: 'https://aide.kiubi.com/blog.html#parametres-du-blog'
			}, {
				msg: 'Vous pouvez choisir la structure de données des billets, des composants et des produits.',
				help: 'https://aide.kiubi.com/design-generalites.html#types-de-billets'
			}, {
				msg: 'Vous pouvez modifier les types de billets et de composants et en créer autant que nécessaire.',
				help: 'https://aide.kiubi.com/design-generalites.html#types-de-billets'
			}, {
				msg: 'Les prix des produits du catalogue peuvent être affichés HT ou TTC.',
				link: '/catalog/taxes',
				help: 'https://aide.kiubi.com/catalogue.html#gerer-les-taxes'
			}, {
				msg: 'Les produits peuvent être évalués et notés par les internautes.',
				link: '/catalog/comments',
				help: 'https://aide.kiubi.com/catalogue.html#gerer-les-evaluations'
			}, {
				msg: 'Le raccourcis ctrl + s (ou cmd + s) permet d\'enregistrer les modifications.',
				link: '/prefs/shortcut'
			}, {
				msg: 'Organiser des ventes privées peut booster l\'activité de votre boutique en ligne.',
				link: '/catalog/settings',
				help: 'https://aide.kiubi.com/catalogue.html#parametres-du-catalogue'
			}, {
				msg: 'L\'extranet permet de donner des accès privilégiés à certaines parties du site.',
				link: '/customers/groups',
				help: 'https://aide.kiubi.com/membres.html#extranet'
			}, {
				msg: 'L\'import depuis Wordpress facilite la migration de votre site sur Kiubi.',
				link: '/modules/import/wordpress'
			}, {
				msg: 'Vous pouvez créer et commercialiser différents types de produits.',
				help: 'https://aide.kiubi.com/design-generalites.html#types-des-produits'
			}, {
				msg: 'Tous les interntautes qui s\'inscrivent sur le site disposent d\'une fiche client.',
				link: '/customers',
				help: 'https://aide.kiubi.com/membres.html#ajouter-un-membre'
			}, {
				msg: 'Dynamiser votre activité commerciale en proposant des bons de réductions.',
				link: '/modules/vouchers',
				help: 'https://aide.kiubi.com/modules.html#bons-de-reduction'
			}, {
				msg: 'Vos clients cumulent des points de fidélité à chacun de leurs achats.',
				help: 'https://aide.kiubi.com/membres.html#points-de-fidelite'
			}, {
				msg: 'Pensez à faire un point de sauvegarde avant toute modification importante.',
				link: '/modules/backups',
				help: 'https://aide.kiubi.com/modules.html#gestion-des-sauvegardes'
			}, {
				msg: 'Travailler plus de 7h consécutives augmente de 62% les risques d\'erreurs.'
			}, {
				msg: 'Le code source des templates de votre site est entièrement modifiable.',
				help: 'https://aide.kiubi.com/design-generalites.html'
			}, {
				msg: 'Les APIs sont disponibles pour connecter votre site à de nouveaux services.',
				link: '/modules',
				help: 'https://aide.kiubi.com/api-front-generalites.html'
			}, {
				msg: 'N\'oubliez pas d\'activer et de configurer Google Analytics.',
				link: '/modules/analytics',
				help: 'https://aide.kiubi.com/modules.html#google-analytics'
			}, {
				msg: 'Plusieurs services d\'export du catalogue vers les marketplaces sont disponibles.'
			}, {
				msg: 'Vérifiez que les coordonnées de votre site sont toujours à jour.',
				link: '/prefs/contact',
				help: 'https://aide.kiubi.com/preferences.html#coordonnees-du-site'
			}, {
				msg: 'Vous pouvez associer plusieurs noms de domaine à votre site.',
				link: '/prefs/domains',
				help: 'https://aide.kiubi.com/preferences.html#noms-de-domaine'
			}, {
				msg: 'Vos collaborateurs peuvent avoir un compte utilisateur avec des droits spécifiques.',
				help: 'https://aide.kiubi.com/generalites.html#gestion-des-utilisateurs'
			}, {
				msg: 'Le RGPD s\'applique à votre site dès lors qu\'il collecte des données personnelles.',
				link: '/prefs/gdpr',
				help: 'https://aide.kiubi.com/preferences.html#donnees-personnelles'
			}, {
				msg: 'L\'utilisation d\'un thème graphique personnalisé permet de... tout personnaliser !',
				help: 'https://aide.kiubi.com/design-generalites.html'
			}, {
				msg: 'Le guide du webdesigner documente tout sur les wigets et les thèmes graphiques.',
				help: 'https://aide.kiubi.com/design-generalites.html/'
			}, {
				msg: 'Après certaines mises à jour, une release note détaillée est mis à votre disposition.',
				help: 'https://aide.kiubi.com/changelog.html'
			}, {
				msg: 'Le support en ligne est toujours disponible pour vous aider dans votre projet.',
				help: 'https://aide.kiubi.com/generalites.html#ouvrir-un-ticket-de-support'
			}, {
				msg: 'S\'il est encore en travaux, vous pouvez restreindre l\'accès à l\'ensemble du site.',
				link: '/prefs',
				help: 'https://aide.kiubi.com/preferences.html#preferences-generales'
			}, {
				msg: 'Votre logo apparait sur plusieurs documents (bloc-marque, bons de commande, etc.).',
				link: '/prefs',
				help: 'https://aide.kiubi.com/preferences.html#preferences-generales'
			}, {
				msg: 'Pour publier des fichiers volumineux dans la médiathèque, utilisez l\'accès FTP.',
				help: 'https://aide.kiubi.com/preferences.html#fichiers-de-la-mediatheque'
			}, {
				msg: 'Le taux de disponibilité moyen de Kiubi sur les 3 dernières années est de 99,98%.'
			}, {
				msg: 'Vous pouvez changer de formule d\'abonnement à tout moment, sans engagement.',
				help: 'https://aide.kiubi.com/generalites.html#gestion-des-abonnements'
			}, {
				msg: 'Sur un seul compte Kiubi, vous pouvez ouvrir plusieurs sites différents.',
				help: 'https://aide.kiubi.com/generalites.html#ouvrir-un-site-internet'
			}, {
				msg: 'Des remises sur les produits peuvent être configurée par groupes de clients.',
				help: 'https://aide.kiubi.com/membres.html#remises-automatiques'
			}, {
				msg: 'Proposer du Click and Collect et de la livraison de proximité à vos clients.',
				help: 'https://aide.kiubi.com/transporteurs.html#ajout-d-un-retrait-en-magasin'
			}, {
				msg: 'Kiubi est pensée pour les développeurs front-end. Parce qu\'on les aime !',
				help: 'https://aide.kiubi.com/design-generalites.html/'
			}, {
				msg: 'Vous pouvez adapter n\'importe quel thème graphique à votre site.',
				help: 'https://aide.kiubi.com/design-generalites.html/'
			}, {
				msg: 'Dismoi? intègre une boite de réception pour suivre les réponses aux formulaires.',
				link: '/forms/inbox/',
				help: 'https://aide.kiubi.com/formulaires-dismoi.html#boite-de-reception'
			}, {
				msg: 'La console d\'administration est également disponible en téléchargement.',
				help: 'https://github.com/Kiubi/'
			}, {
				msg: 'S\'il vous manque une fonctionnalité, contactez-nous !',
				link: '/modules/kps',
				help: 'https://www.kiubi.com/professional-services.html'
			}, {
				msg: 'Changez de divise, traduisez le site, vendez dans n\'importe quel pays.',
				link: '/prefs/l10n',
				help: 'https://aide.kiubi.com/preferences.html#traductions'
			}, {
				msg: 'Différents modes de paiements sont disponibles : chèque, CB, PayPal, etc.',
				link: '/checkout/payments',
				help: 'https://aide.kiubi.com/paiements.html'
			}, {
				msg: 'Ajouter des options, payantes ou gratuites, aux commandes.',
				link: '/checkout/options',
				help: 'https://aide.kiubi.com/commandes.html#options-des-commandes'
			}, {
				msg: 'Les bons de réduction peuvent être réservés à certains clients ou produits.',
				link: '/modules/vouchers',
				help: 'https://aide.kiubi.com/modules.html#bons-de-reduction'
			}, {
				msg: 'Les commandes sont exportables sous plusieurs formats de fichiers.',
				help: 'https://aide.kiubi.com/commandes.html#exporter-les-commandes'
			}, {
				msg: 'Les transporteurs peuvent être définis par pays et tranches de poids.',
				help: 'https://aide.kiubi.com/transporteurs.html#ajout-d-un-transporteur'
			}, {
				msg: 'Les transporteurs peuvent être définis par codes postaux et tranches de poids.',
				help: 'https://aide.kiubi.com/transporteurs.html#ajout-d-un-transporteur-local'
			}, {
				msg: 'Vous pouvez définir des horaires de livraison ou de retrait en magasin.',
				help: 'https://aide.kiubi.com/transporteurs.html#livraisons-et-retraits-plannifies'
			}, {
				msg: 'Un montant minimum peut être requis pour passer une commande.',
				link: '/checkout/settings',
				help: 'https://aide.kiubi.com/commandes.html#parametres-des-commandes'
			}, {
				msg: 'Un franco de port est disponible pour chaque transporteurs.',
				help: 'https://aide.kiubi.com/transporteurs.html#gerer-les-transporteurs'
			}, {
				msg: 'Ne vous fiez pas à la première apparence, un site est toujours personnalisable.',
				help: 'https://aide.kiubi.com/design-generalites.html'
			}, {
				msg: 'Vous souhaitez développer votre activité ? Contactez un Expert Kiubi.',
				help: 'https://www.kiubi.com/agences-partenaires.html'
			}, {
				msg: 'Les bons de commande sont personnalisables si vous utiliser leur version HTML.',
				help: 'https://aide.kiubi.com/design-commandes.html#-span-class-sub-bon-de-commande'
			}, {
				msg: 'Les widgets se placent par glissé-déposé dans les mises en page.',
				help: 'https://aide.kiubi.com/mises-en-page.html'
			}, {
				msg: 'De nombreuses balises permettent de personnaliser le code source des sites.',
				help: 'https://aide.kiubi.com/design-generalites.html#balises'
			}, {
				msg: 'Les images publiées dans la médiathèque sont disponibles en différentes tailles.',
				link: '/prefs/medias',
				help: 'https://aide.kiubi.com/preferences.html#fichiers-de-la-mediatheque'
			}, {
				msg: 'L\'API Front-Office permet d\'accéder aux données publiques du site',
				help: 'https://aide.kiubi.com/api-front-generalites.html'
			}, {
				msg: 'L\'API Developers ouvre un accès direct et sécurisé à toutes les données du site.',
				help: 'https://aide.kiubi.com/api-dev-generalites.html'
			}, {
				msg: 'Ne vous limitez donc pas aux configurations initiales des widgets. Soyez créatif !',
				help: 'https://aide.kiubi.com/design-generalites.html#widgets'
			}, {
				msg: 'Chaque page peut avoir sa propre mise en page. Et chaque mise en page son template.',
				help: 'https://aide.kiubi.com/mises-en-page.html'
			}, {
				msg: 'Chaque widget peut avoir son propre template. Ou 10... si vous en avez besoin.',
				help: 'https://aide.kiubi.com/mises-en-page.html'
			}, {
				msg: 'Quand vous ouvrez un nouveau site, vous pouvez dupliquer un site existant.',
				help: 'https://aide.kiubi.com/generalites.html#ouvrir-un-site-internet'
			}, {
				msg: 'Les balises métas sont personnalisables pour tout le site ou pour chaque pages.',
				link: '/prefs/meta',
				help: 'https://aide.kiubi.com/preferences.html#meta-par-defaut'
			}, {
				msg: 'Si une page change d\'url, faites une redirection 301 vers sa nouvelle url.',
				link: '/modules/redirections',
				help: 'https://aide.kiubi.com/modules.html#redirections-301'
			}, {
				msg: 'Le sitemap du site est mis à jour automatiquement, ne vous en préoccupez pas.',
				link: '/prefs',
				help: 'https://aide.kiubi.com/preferences.html#preferences-generales'
			}, {
				msg: 'L\'utilisation quotidienne de Kiubi rend heureux. C\'est prouvé !',
				help: 'https://www.youtube.com/watch?v=ZbZSe6N_BXs'
			}, {
				msg: 'Les réponses aux formulaires Dismoi? peuvent être exportées au format .csv.',
				help: 'https://aide.kiubi.com/formulaires-dismoi.html#exporter-les-reponses'
			}, {
				msg: 'Dismoi? peut gérer des pièces jointes, stockées dans la médiathèque.',
				help: 'https://aide.kiubi.com/formulaires-dismoi.html#ajouter-un-formulaire'
			}, {
				msg: 'Quand une commande change d\'état, un email peut être envoyé à l\'acheteur.',
				link: '/checkout/emails',
				help: 'https://aide.kiubi.com/commandes.html#emails-de-confirmation'
			}, {
				msg: 'Un historique des opérations est conservé pour chaque commande.',
				help: 'https://aide.kiubi.com/commandes.html#editer-une-commande'
			}, {
				msg: 'Le widget "fragment de code" ajoute du code directement dans une mise en page.',
				help: 'https://aide.kiubi.com/design-generalites.html#widgets'
			}, {
				msg: 'La balise {SOCIETE.email} affiche l\'email du site. D\'autres balises sont disponibles.',
				help: 'https://aide.kiubi.com/design-generalites.html#balises-globales'
			}, {
				msg: 'Certains widgets ont plus de 30 paramètres de configuration différents.',
				help: 'https://aide.kiubi.com/design-catalogue.html#liste-des-produits'
			}, {
				msg: 'Les commandes peuvent être exportées vers Coliship, le logiciel d\'étiquetage de la Poste',
				help: 'https://aide.kiubi.com/transporteurs.html#ajout-d-un-transporteur'
			}, {
				msg: 'Les commandes peuvent être exportées vers le Station DPD, logiciel d\'étiquetage de DPD',
				help: 'https://aide.kiubi.com/transporteurs.html#ajout-d-un-transporteur'
			}, {
				msg: 'Un "bac à sable" est disponible pour l\'API Front-Office.',
				help: 'https://aide.kiubi.com/api-front-generalites.html#le-sandbox'
			}, {
				msg: 'Un "bac à sable" est disponible pour l\'API Developers.',
				help: 'https://aide.kiubi.com/api-dev-generalites.html#le-sandbox'
			}, {
				msg: 'Pour utiliser l\'API Front-Office, vous devez d\'abord l\'activer dans les préférences.',
				link: '/prefs',
				help: 'https://aide.kiubi.com/preferences.html#preferences-generales'
			}, {
				msg: 'Pour utiliser l\'API Developers, une clé API d\'un administrateur est nécessaire.',
				help: 'https://aide.kiubi.com/api-dev-generalites.html#client-php'
			}, {
				msg: 'L\'up-selling et le cross-selling sont des outils efficaces pour booster les ventes',
				help: 'https://aide.kiubi.com/design-catalogue.html#produits-les-plus'
			}, {
				msg: 'Un produit vedette sera mis en avant et affiché en tête de listing.',
				help: 'https://aide.kiubi.com/design-catalogue.html#produits-vedettes'
			}, {
				msg: 'Un produit peut être un objet physique ou un fichier à télécharger.',
				help: 'https://aide.kiubi.com/catalogue.html#produit-virtuel'
			}, {
				msg: 'Chaque produit peut être décliné en 300 variantes et références différentes.',
				help: 'https://aide.kiubi.com/catalogue.html#variantes-produit'
			}, {
				msg: 'Toutes les pages disposent d\'options avancées pour optimiser le SEO.',
				help: 'https://aide.kiubi.com/site-web.html#parametres-avances'
			}, {
				msg: 'Si vous êtes exonérez de TVA, n\'oubliez pas de le configurer dans le catalogue.',
				link: '/catalog/taxes',
				help: 'https://aide.kiubi.com/catalogue.html#gerer-les-taxes'
			}, {
				msg: 'Pour d\'évidentes raisons de sécurité, tous les mots de passe sont chiffrés.',
				help: 'https://aide.kiubi.com/membres.html#recuperation-du-mot-de-passe'
			}, {
				msg: 'Les bons de réduction permettent également d\'offrir une remise sur les frais de port.',
				link: '/modules/vouchers',
				help: 'https://aide.kiubi.com/modules.html#bons-de-reduction'
			}, {
				msg: 'Des sauvegardes de vos données sont faites quotidiennement et automatiquement.',
				link: '/modules/backups',
				help: 'https://aide.kiubi.com/modules.html#gestion-des-sauvegardes'
			}, {
				msg: 'Les abonnés à votre newsletter sont à exporter vers votre plateforme d\'emailing.',
				link: '/modules/subscribers',
				help: 'https://aide.kiubi.com/membres.html#exporter-les-membres'
			}, {
				msg: 'Pour faciliter l\'ajout de contenu, dupliquez vos billets, vos pages, vos produits.',
				help: 'https://aide.kiubi.com/site-web.html#ajouter-du-contenu'
			}, {
				msg: 'Le contenu de votre site peut être exporté à tout moment. Et importé également.',
				help: 'https://aide.kiubi.com/site-web.html#export-de-contenus'
			}, {
				msg: 'La médiathèque peut stocker tous types de fichiers.',
				link: '/media/folders/2/files',
				help: 'https://aide.kiubi.com/design-generalites.html#mediatheque'
			}, {
				msg: 'L\'accès à un dossier de la médiathèque peut être restreint via l\'extranet.',
				help: 'https://aide.kiubi.com/membres.html#extranet'
			}, {
				msg: 'Votre abonnement peut être renouvelé pour 1, 3, 6 ou 12 mois.',
				help: 'https://aide.kiubi.com/generalites.html#gestion-des-abonnements'
			}, {
				msg: 'Un menu ou une liste de produits, tout ce qui s\'affiche est piloté par un widget.',
				help: 'https://aide.kiubi.com/design-generalites.html#widgets'
			}, {
				msg: 'Il y a 3 à 4 mises à jour majeures de Kiubi par an. Et 100 fois plus de mineures.',
				help: 'https://www.kiubi.com/blog/'
			}, {
				msg: 'Les composants vous permettent de créer des carrousels, des galeries photos, des accordéons, tout ce que vous voulez !',
				help: 'https://aide.kiubi.com/site-web.html#ajouter-un-composant'
			}, {
				msg: 'Utilisez les symboles pour centraliser une "section" de contenu, de mise en page et de widgets',
				help: 'https://aide.kiubi.com/site-web.html#ajouter-un-symbole'
			}, {
				msg: 'Vous pouvez créer des grilles de tarifs dégressifs en fonction de la quantité de produits achetés.',
				help: 'https://aide.kiubi.com/modules.html#tarifs-degressifs'
			}

		]);
	},

	pickRandom: function() {
		return this.at(
			Math.round(Math.random() * (this.length - 1))
		).toJSON();
	}

});
