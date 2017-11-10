var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

module.exports = Marionette.View.extend({
	template: require('../templates/vouchers.html'),
	className: 'container-fluid',
	service: 'modules'
});
