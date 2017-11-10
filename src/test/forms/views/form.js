var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

module.exports = Marionette.View.extend({
	template: require('../templates/form.html'),
	className: 'container',
	service: 'forms'
});
