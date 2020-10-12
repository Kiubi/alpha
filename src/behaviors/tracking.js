var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _string = require('underscore.string');

module.exports = Marionette.Behavior.extend({

	options: {
		defaultCategoty: 'Event'
	},

	events: {
		'click [data-tracking]': function(event) {

			Backbone.Radio.channel('tracker').trigger('event', {
				"name": 'click',
				"category": event.currentTarget.getAttribute('data-tracking-categ') ? 'Event - ' + event.currentTarget.getAttribute('data-tracking-categ') : 'Event - ' + this.options.defaultCategoty,
				"label": event.currentTarget.getAttribute('data-tracking') ? event.currentTarget.getAttribute('data-tracking') : _string.stripTags(event.currentTarget.innerHTML),
				"value": null
			});

		}
	}

});
