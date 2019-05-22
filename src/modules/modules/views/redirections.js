var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var CodeMirrorBehavior = require('kiubi/behaviors/codemirror.js');
var Forms = require('kiubi/utils/forms.js');

module.exports = Marionette.View.extend({
	template: require('../templates/redirections.html'),
	className: 'container',
	service: 'modules',

	behaviors: [FormBehavior, CodeMirrorBehavior],

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

		return this.collection.bulkUpdate(data.redirections).done(function(result) {
			this.triggerMethod('codemirror:highligth');
		}.bind(this)).fail(function(xhr) {
			if (xhr.responseJSON && xhr.responseJSON.error && xhr.responseJSON.error.fields) {
				var lines = _.reduce(xhr.responseJSON.error.fields, function(acc, error) {
					acc.push(error.field - 1); // line 1 == 0 for codemirror
					return acc
				}, []);

				this.triggerMethod('codemirror:highligth', lines);
			} else {
				this.triggerMethod('codemirror:highligth');
			}
		}.bind(this));
	}

});
