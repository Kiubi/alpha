var Marionette = require('backbone.marionette');

module.exports = Marionette.Object.extend({

	memory: {},

	clear: function() {
		this.memory = {};
	},

	set: function(key, value) {
		this.memory[key] = value;
	},

	get: function(key) {
		if (typeof(this.memory[key]) != 'undefined') {
			return this.memory[key];
		}
		return null;
	}

});
