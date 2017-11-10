var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

module.exports = Marionette.View.extend({
	template: require('../templates/carriers.shop.html'),
	className: 'container',
	service: 'checkout'
});
