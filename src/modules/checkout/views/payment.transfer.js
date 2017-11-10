var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

module.exports = Marionette.View.extend({
	template: require('../templates/payment.transfer.html'),
	className: 'container',
	service: 'checkout'
});
