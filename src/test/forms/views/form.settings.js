var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

module.exports = Marionette.View.extend({
	template: require('../templates/form.settings.html'),
	className: 'container',
	service: 'forms'
});
