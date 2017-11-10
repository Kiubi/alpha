var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

module.exports = Marionette.View.extend({
	template: require('../templates/option.html'),
	className: 'container',
	service: 'checkout'
});
