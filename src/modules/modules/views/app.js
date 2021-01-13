var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

module.exports = Marionette.View.extend({
	template: require('../templates/app.html'),
	className: 'h-100',
	service: 'modules',

	url: null,

	initialize: function(options) {
		this.mergeOptions(options, ['model']);

		this.url = null;

		this.model.launch().done(function(url) {
			console.log(url);
			this.url = url;
			this.render();
		}.bind(this));

	},

	templateContext: function() {
		return {
			url: this.url
		};
	},

	onBeforeAttach: function() {
		var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
		navigationController.startAppContext();
	},

	onBeforeDetach: function() {
		var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
		navigationController.stopAppContext();
	}

});
