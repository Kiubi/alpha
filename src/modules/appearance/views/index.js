var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

module.exports = Marionette.View.extend({
	template: require('../templates/index.html'),
	className: 'container container-large',
	service: 'appearance'
});
