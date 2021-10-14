var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var Tips = require('../models/tips.js');

module.exports = Marionette.View.extend({
	template: require('../templates/login.tips.html'),

	tagName: 'div',
	className: 'brand-message',

	tipsList: null,

	initialize: function() {
		this.tipsList = new Tips();
		this.tipsList.fetch();
	},

	templateContext: function() {
		var tip = this.tipsList.pickRandom();

		return {
			tip: tip,
			link: tip.help
		};
	}

});
