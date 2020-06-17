var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var ControllerChannel = Backbone.Radio.channel('controller');

module.exports = Marionette.Behavior.extend({

	ui: {
		form: 'form',
		radioInputs: 'input[type="radio"]'
	},

	events: {
		'input @ui.form': 'onFieldChange',
	},

	onFieldChange: function() {
		ControllerChannel.trigger('modified:content');
	}

});
