var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

module.exports = function() {

	var Cfg = Backbone.Radio.channel('app').request('ctx:config');

	// Tracker GA
	if (Cfg && Cfg.get('ga_tracker')) {
		var script = document.createElement('script');
		script.async = 1;
		script.src = 'https://www.googletagmanager.com/gtag/js?id=' + Cfg.get('ga_tracker');
		var insert = document.getElementsByTagName('script')[0];
		insert.parentNode.insertBefore(script, insert);

		window.dataLayer = window.dataLayer || [];

		function gtag() {
			dataLayer.push(arguments);
		}
		gtag('js', new Date());

		gtag('config', Cfg.get('ga_tracker'));

		var App = Backbone.Radio.channel('app').request('ctx:app');
		App.on('navigate', function(path) {
			gtag('config', Cfg.get('ga_tracker'), {
				'page_path': path
			});
		});

		Backbone.Radio.channel('tracker').on('event', function(event) {
			gtag('event', event.name || 'click', {
				'event_category': event.category || '',
				'event_label': event.label || ''
			});
		});

	}
};
