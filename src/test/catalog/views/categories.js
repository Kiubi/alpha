var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

module.exports = Marionette.View.extend({
	template: require('../templates/categories.html'),
	className: 'container-fluid',
	service: 'catalog'
});
