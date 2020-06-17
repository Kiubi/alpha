var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');

var Session = Backbone.Radio.channel('app').request('ctx:session');

module.exports = Marionette.View.extend({
	template: require('../templates/conversion.html'),
	className: 'container',
	service: 'themes',

	behaviors: [FormBehavior],

	loading: false,
	step: null,

	initialize: function(options) {
		this.mergeOptions(options, ['model']);

		this.loading = true;
		this.step = 0;

		this.listenTo(this.model, 'fetch', this.onFetch);
		this.model.fetch({
			data: {
				type: 'component'
			}
		}).done(function() {
			this.onFetch();
		}.bind(this)).fail(function(error) {
			var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
			navigationController.showErrorModal(error);
		}.bind(this));
	},

	templateContext: function() {
		return {
			is_loading: this.loading,
			step: this.step
		};
	},

	onFetch: function() {
		this.loading = false;
		this.render();
	},

	onSave: function() {
		var data = Forms.extractFields(['zone'], this);
		this.model.convert(data.zone).done(function() {
			this.step++;
			// Refresh features
			Session.site.fetch({
				data: {
					extra_fields: 'scopes,features'
				}
			});
			this.render();

		}.bind(this));
	}

});
