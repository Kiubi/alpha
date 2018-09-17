var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');

module.exports = Marionette.View.extend({
	template: require('../templates/custom.html'),
	className: 'container',
	service: 'themes',

	behaviors: [FormBehavior],

	fields: [
		'name',
		'code',
		'reuse_layouts'
	],

	initialize: function(options) {
		this.mergeOptions(options, ['collection']);
	},

	templateContext: function() {
		return {
			themes: _.filter(this.collection.toJSON(), function(theme) {
				return theme.code != 'theme';
			}) // without custom theme !
		};
	},

	onSave: function() {
		return this.collection.createTheme(Forms.extractFields(this.fields, this));
	}

});
