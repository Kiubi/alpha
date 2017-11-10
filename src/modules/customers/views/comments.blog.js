var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

module.exports = Marionette.View.extend({
	template: require('../../blog/templates/comments.html'),
	className: 'container',
	service: 'customers'
});
