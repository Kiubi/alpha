var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

module.exports = Marionette.View.extend({

	template: require('../templates/sidebarMenu.html'),

	service: '',

	// model: Session.site

	ui: {
		'site-search': '[data-role="site-search"]',
		'input-search': '[data-role="site-search"] input'
	},

	events: {
		'click @ui.site-search a': 'onChooseSite',
		'hide.bs.dropdown': function(event) {
			this.emptyList();
			this.getUI('input-search').val('');
		}
	},

	regions: {
		'detail': {
			el: 'div[data-role="content"]',
			replaceElement: true
		}
	},

	templateContext: function() {
		return {
			fqdn: this.model.get('domain').replace(/^https?:\/\//, '')
		};
	},

	initialize: function(options) {
		this.mergeOptions(options, ['model']);
		this.listenTo(this.model, 'change', this.onSessionChange);
	},

	onSessionChange: function(model) {
		if (model.hasChanged('domain') || model.hasChanged('name')) {
			var view = this.detachChildView('detail');
			this.render();
			if (view) this.showChildView('detail', view);
		}
	},

	onRender: function() {
		this.getUI('input-search').on('keyup', _.debounce(this.onChange.bind(this), 300));
	},

	onChange: function(event) {
		this.model.searchSite(Backbone.$(event.currentTarget).val()).done(function(result) {
			var list = '';
			if (result.length > 0) {
				list = _.reduce(result, function(memo, site) {
					return memo + '<li><a href="#" data-site="' + site.code_site + '">' + site.domain + '</a></li>';
				}, '<li role="separator" class="divider"></li>');
			} else {
				list = '<li role="separator" class="divider"></li><li><a href="#">-- Aucun résultat --</a></li>';
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

	emptyList: function() {
		var $first = this.getUI('site-search').children().eq(0).detach();
		return this.getUI('site-search').empty().append($first);
	}

});
