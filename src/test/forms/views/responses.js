var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

module.exports = Marionette.View.extend({
	template: require('../templates/responses.html'),
	className: 'container-fluid',
	service: 'forms'
});
