var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

module.exports = Marionette.View.extend({
	template: require('../templates/linked.html'),
	className: 'container',
	service: 'catalog'
});
