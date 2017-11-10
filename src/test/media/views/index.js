var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

module.exports = Marionette.View.extend({
	template: require('../templates/files.html'),
	className: 'container-fluid',
	service: 'media'
});
