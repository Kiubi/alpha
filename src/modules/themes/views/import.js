var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');
var SelectifyBehavior = require('kiubi/behaviors/selectify.js');

module.exports = Marionette.View.extend({
	template: require('../templates/import.html'),
	className: 'container',
	service: 'themes',

	behaviors: [SelectifyBehavior]

});
