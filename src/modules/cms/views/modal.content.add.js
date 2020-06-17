var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var Posts = require('kiubi/modules/cms/models/posts');
var Components = require('kiubi/modules/cms/models/components');
var Symbols = require('kiubi/modules/cms/models/symbols');


module.exports = Marionette.View.extend({
	template: require('../templates/modal.content.add.html'),

	menu_id: null,

	ui: {
		'select-post': '[data-role="post"] a',
		'select-component': '[data-role="component"] a',
		'select-symbol': '[data-role="symbol"] a'
	},

	events: {
		'click @ui.select-post': function(event) {

			this.trigger('select:post', {
				type: Backbone.$(event.currentTarget).data('id')
			});
		},
		'click @ui.select-component': function(event) {
			this.trigger('select:component', {
				type: Backbone.$(event.currentTarget).data('id')
			});
		},
		'click @ui.select-symbol': function(event) {
			this.trigger('select:symbol', {
				symbol_id: Backbone.$(event.currentTarget).data('id')
			});
		}
	},

	post_types: null,
	component_types: null,
	symbol_models: null,

	initialize: function(options) {
		this.mergeOptions(options, ['enableComponent']);

		var Post = new(new Posts()).model();
		var Component = new(new Components()).model();

		this.post_types = null;
		this.component_types = null;
		this.symbols = new Symbols();
		this.loading = true;

		Backbone.$.when(
				Post.getTypes(),
				this.enableComponent ? Component.getTypes() : null,
				this.enableComponent && this.getOption('container_type') == 'page' ? this.symbols.fetch() : null
			)
			.done(function(post_types, component_types) {
				this.post_types = post_types;
				this.component_types = component_types;
				this.loading = false;
				this.render();
			}.bind(this))
			.fail(function(error) {
				var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
				navigationController.showErrorModal('Echec du chargement des types de contenus');
			}.bind(this));
	},

	templateContext: function() {
		return {
			loading: this.loading,
			container_type: this.getOption('container_type') ? this.getOption('container_type') : 'page',
			post_types: this.post_types,
			component_types: this.component_types,
			symbols: this.enableComponent ? this.symbols.toJSON() : null,
			enableComponent: this.enableComponent
		};
	},

	getTabs: function() {
		if (this.enableComponent && this.getOption('container_type') == 'page') {
			return [{
					id: 'content-tab',
					title: 'Contenus',
					icon: 'md-content'
				},
				{
					id: 'symbole-tab',
					title: 'Symboles',
					icon: 'md-symbole'
				}
			];
		}
		return null;
	}

});
