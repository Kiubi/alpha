var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

module.exports = Marionette.View.extend({
	template: require('../templates/group.html'),
	className: 'container',
	service: 'customers'
});
