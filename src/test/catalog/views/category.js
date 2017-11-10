var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

module.exports = Marionette.View.extend({
	template: require('../templates/category.html'),
	className: 'container',
	service: 'catalog'
});
