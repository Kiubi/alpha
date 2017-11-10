var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

module.exports = Marionette.View.extend({
	template: require('../templates/product.html'),
	className: 'container container-large',
	service: 'catalog'
});
