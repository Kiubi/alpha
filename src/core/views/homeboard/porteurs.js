var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var Symbols = require('kiubi/modules/cms/models/symbols');
var Page = require('kiubi/modules/cms/models/page');
var Contents = require('kiubi/modules/cms/models/contents');
var Collection = require('kiubi/modules/cms/models/collection');
var Product = require('kiubi/modules/catalog/models/product');
var Forms = require('kiubi/utils/forms.js');

module.exports = Marionette.View.extend({
	template: require('../../templates/homeboard/porteurs.html'),

	tagName: 'article',
	className: 'post-article post-article-dark porteurs',

	events: {
		'click button[data-role="page"]': function(event) {

			var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
			navigationController.showOverlay();

			var page = new Page({
				name: 'Ma première page',
				slug: 'ma-premiere-page',
				is_visible: true,
				page_type: 'page',
				menu_id: 1
			});

			var component;

			// Page creation
			page.save().then(function() {

				// Jumbotron in banniere
				var content = new(new Contents()).model({
					is_visible: true,
					container_id: page.get('page_id'),
					container_type: 'page',
					content: 'post',
					type: 'jumbotron',
					zone: 'banniere',
					title: 'Ajouter du contenu',
					text1: 'Ajouter du contenu &agrave; une page, revient &agrave; cr&eacute;er un ou plusieurs <a href="https://aide.kiubi.com/site-web.html#ajouter-un-billet">billets</a>, <br /><a href="https://aide.kiubi.com/site-web.html#ajouter-un-composant">composants</a> ou <a href="https://aide.kiubi.com/site-web.html#ajouter-un-symbole">symboles</a> dans cette page. Chaque &eacute;l&eacute;ment vient <br />se placer dans une <a href="https://aide.kiubi.com/mises-en-page.html#zones-de-contenu">zone de contenu</a> de la page.',
					text7: '450px',
					text10: '1080',
					text11: '1',
					text13: 'bg-transparent',
					text14: '1',
					text15: '1'
				});

				return content.save()
			}).then(function() {

				// Post in contenu
				var content = new(new Contents()).model({
					is_visible: true,
					container_id: page.get('page_id'),
					container_type: 'page',
					content: 'post',
					type: 'image',
					zone: 'contenu',
					title: 'Ceci est un billet',
					text2: 'Un billet permet d\'ajouter du contenu r&eacute;dactionnel &agrave; une page. Chaque billet peut &ecirc;tre consid&eacute;r&eacute; comme un paragraphe, un bloc de contenu structur&eacute; pouvant contenir du texte, des images, des vid&eacute;os, des liens, etc.<br /><br />Pour r&eacute;diger un billet, cliquez sur le bouton "Ajouter un contenu". Choisissez le type de billet que vous souhaitez utiliser. <br /><br />Le billet est alors cr&eacute;&eacute;.<br /><br />Un nouveau billet est toujours masqu&eacute;, il est consid&eacute;r&eacute; "en construction". Pour l&rsquo;afficher, il vous suffit de r&eacute;gler le param&egrave;tre "Affichage" &agrave; "Visible" dans le d&eacute;tail du billet.',
					text10: '1079'
				});

				return content.save()
			}).then(function() {

				// Component apercu in contenu
				component = new(new Contents()).model({
					is_visible: true,
					container_id: page.get('page_id'),
					container_type: 'page',
					content: 'component',
					type: 'apercu',
					zone: 'contenu',
					fields: {
						title: 'Ceci est un composant',
						textcolor: '1',
						content: '<p>Un composant, tout comme un billet, permet d\'ajouter du contenu structur&eacute; dans une page. Le composant pourra cependant &eacute;galement contenir son propre listing de contenu, appel&eacute; "collection". <br /><br />Les composants sont adapt&eacute;s &agrave; l\'int&eacute;gration d\'&eacute;l&eacute;ments plus &eacute;labor&eacute;s techniquement que ceux d\'un billet, ou de listing avec peu de contenu r&eacute;dactionnel mais plus de param&egrave;tres de configuration, comme : des carrousels, des galeries photos, des accord&eacute;ons, des embed, des boutons d\'action, etc.<br /><br />Pour ajouter un composant, cliquez sur le bouton "Ajouter un contenu". Choisissez le type de composant que vous souhaitez utiliser. Le composant est alors cr&eacute;&eacute;.<br /><br />Un nouveau composant est toujours masqu&eacute;, il est consid&eacute;r&eacute; "en construction". Pour l&rsquo;afficher, il vous suffit de r&eacute;gler le param&egrave;tre "Affichage" &agrave; "Visible" dans le d&eacute;tail du composant.<br /><br />Le principal avantage d\'un composant est qu\'il peut contenir son propre listing d\'&eacute;l&eacute;ments. La pr&eacute;sence, ou non, d\'une "collection" d&eacute;pend cependant du type de composant. Pour ajouter un &eacute;l&eacute;ment &agrave; la collection d\'un composant, cliquez sur "Ajouter un &eacute;l&eacute;ment" dans le d&eacute;tail d\'un composant.</p>\n' +
							'Par exemple, pour ce composant : chaque &eacute;l&eacute;ment de la collection ci-dessous affiche un petit encart dans le site. Chaque &eacute;l&eacute;ment &agrave; son propre contenu (texte, image, lien, etc.).'
					},
				});

				return component.save()
			}).then(function() {

				// Element 1 in apercu componement
				var item = new(new Collection()).model({
					content_id: component.get('content_id'),
					is_visible: true,
					fields: {
						title: 'Element 1',
						image: '1077',
						button: 'Texte du bouton',
						link: '#',
						content: 'Contenu de l\'&eacute;l&eacute;ment 1'
					}
				});

				return item.save()
			}).then(function() {

				// Element 2 in apercu componement
				var item = new(new Collection()).model({
					content_id: component.get('content_id'),
					is_visible: true,
					fields: {
						title: 'Element 2',
						image: '1076',
						button: 'Texte du bouton',
						link: '#',
						content: 'Contenu de l\'&eacute;l&eacute;ment 2'
					}
				});

				return item.save()
			}).then(function() {

				// Element 3 in apercu componement
				var item = new(new Collection()).model({
					content_id: component.get('content_id'),
					is_visible: true,
					fields: {
						title: 'Element 3',
						image: '1078',
						button: 'Texte du bouton',
						link: '#',
						content: 'Contenu de l\'&eacute;l&eacute;ment 3'
					}
				});

				return item.save()

			}).then(function() {

				// Try to find the symbol
				var s = new Symbols();
				return s.fetch().then(function() {

					var symbol = s.find(function(model) {
						return model.get('params') && model.get('params').title === 'Ceci est un symbole';
					});

					if (symbol) {
						// Symbol found ! Return symbol id
						return symbol.get('symbol_id');
					}

					symbol = new(new Symbols()).model({
						title: 'Ceci est un symbole'
					});

					// Symbol not found, has to create the symbol
					return symbol.save()
						.then(function() {
							// Post in symbol
							var content = new(new Contents()).model({
								is_visible: true,
								container_id: symbol.get('symbol_id'),
								container_type: 'symbol',
								content: 'post',
								type: 'simple',
								zone: 'contenu',
								title: 'Ceci est un symbole',
								text2: '<a href="https://aide.kiubi.com/site-web.html#ajouter-un-symbole" target="_blank" rel="noopener">Un symbole</a> a de nombreuses caract&eacute;ristiques communes avec une page libre : il int&egrave;gre son propre contenu (billets et composants), sa mise en page, ses widgets, etc.<br /><br />Cependant, il n\'est pas accessible depuis un menu de navigation ; la fonction du symbole est de centraliser une "section" de contenu, de mise en page et de widgets afin de pouvoir l\'ajouter au contenu d\'<a href="https://aide.kiubi.com/site-web.html#types-de-pages">une page libre</a>.<br /><br />Un symbole est commun &agrave; toutes les pages dans lequel il est ajout&eacute; : une modification ou une suppression du symbole sera r&eacute;percut&eacute;e partout o&ugrave; il est utilis&eacute; dans le site.',
							});

							return content.save();

						}).then(function() {
							// Return symbol id
							return symbol.get('symbol_id')
						});
				});
			}).then(function(symbol_id) {

				// Add symbol in contenu
				var content = new(new Contents()).model({
					is_visible: true,
					container_id: page.get('page_id'),
					container_type: 'page',
					content: 'symbol',
					symbol_id: symbol_id,
					zone: 'contenu'
				});

				return content.save()

			}).then(function() {
				navigationController.hideModal(); // hide overlay
				navigationController.navigate('/cms/pages/' + page.get('page_id'));
			}.bind(this), function(xhr) {
				navigationController.showErrorModal(xhr);
			}.bind(this));

		},
		'click button[data-role="product"]': function(event) {

			var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
			navigationController.showOverlay();

			var m = new Product({
				name: 'Intitulé par défaut',
				slug: Forms.tmpSlug(),
				is_visible: false,
				stock: null,
				categories: []
			});

			m.save().done(function() {
				navigationController.hideModal(); // hide overlay
				navigationController.navigate('/catalog/products/' + m.get('product_id'));
			}.bind(this)).fail(function(xhr) {
				navigationController.showErrorModal(xhr);
			}.bind(this));

		}
	},

	initialize: function(options) {
		this.mergeOptions(options, ['session']);
	},

	templateContext: function() {

		var activeTab = 'doc';

		var has_cms = false;
		var has_catalog = false;
		var has_domains = false;

		if (this.session.hasScope('site:domains')) {
			has_domains = true;
			activeTab = 'domains';
		}

		if (this.session.hasScope('site:catalog') && this.session.hasFeature('catalog')) {
			has_catalog = true;
			activeTab = 'catalog';
		}

		if (this.session.hasScope('site:cms')) {
			has_cms = true;
			activeTab = 'cms';
		}

		return {
			has_cms: has_cms,
			has_catalog: has_catalog,
			has_domains: has_domains,
			activeTab: activeTab
		};
	}

});
