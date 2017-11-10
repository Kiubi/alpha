var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

module.exports = Marionette.View.extend({
	template: require('../templates/carrier.local.html'),
	className: 'container',
	service: 'checkout'
});
