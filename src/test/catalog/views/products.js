var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

module.exports = Marionette.View.extend({
	template: require('../templates/products.html'),
	className: 'container-fluid',
	service: 'catalog'
});
