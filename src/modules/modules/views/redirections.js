var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');

module.exports = Marionette.View.extend({
	template: require('../templates/redirections.html'),
	className: 'container',
	service: 'modules',

	behaviors: [FormBehavior],

	fields: [
		'redirections'
	],

	templateContext: function() {

		var redirections = this.collection.reduce(function(memo, model) {
			return memo + model.get("uri") + "\t" + model.get("target") + "\n";
		}, '');

		return {
			'redirections': redirections
		};
	},

	onSave: function() {
		var data = Forms.extractFields(this.fields, this);

		return this.collection.bulkUpdate(data.redirections);
	}

});
