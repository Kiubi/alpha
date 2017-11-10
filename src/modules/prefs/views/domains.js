var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var Session = Backbone.Radio.channel('app').request('ctx:session');

module.exports = Marionette.View.extend({
	template: require('../templates/domains.html'),
	className: 'container',
	service: 'prefs',

	templateContext: function() {
		return {
			domain: Session.site.get('domain')
		};
	}

});
