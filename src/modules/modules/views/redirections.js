var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

module.exports = Marionette.View.extend({
	template: require('../templates/redirections.html'),
	className: 'container',
	service: 'modules'
});
