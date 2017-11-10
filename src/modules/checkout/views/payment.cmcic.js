var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var Session = Backbone.Radio.channel('app').request('ctx:session');

module.exports = Marionette.View.extend({
	template: require('../templates/payment.cmcic.html'),
	className: 'container',
	service: 'checkout',

	templateContext: function() {
		return {
			domain: Session.site.get('domain')
		};
	}

});
