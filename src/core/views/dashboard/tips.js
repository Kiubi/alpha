var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var Tips = require('../../models/tips.js');

module.exports = Marionette.View.extend({
	template: require('../../templates/dashboard/tips.html'),

	tagName: 'article',
	className: 'post-article container tips',

	tipsList: null,

	initialize: function() {
		this.tipsList = new Tips();
		this.tipsList.fetch();
	},

	templateContext: function() {
		var tip = this.tipsList.pickRandom();
		var link = null;

		if (tip.link) {
			link = tip.link
		} else if (tip.help) {
			link = tip.help
		};

		return {
			tip: tip,
			is_external: (link && link.match(/^http/) !== null),
			link: link
		};
	}

});
