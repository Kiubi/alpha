var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

module.exports = Marionette.View.extend({
	template: require('../templates/options.html'),
	className: 'container',
	service: 'checkout'
});
