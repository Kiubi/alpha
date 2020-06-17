var Marionette = require('backbone.marionette');

var WysiwygBehavior = require('kiubi/behaviors/tinymce.js');
var SelectView = require('kiubi/core/views/ui/select.js');

module.exports = Marionette.View.extend({
	template: require('../../../templates/carrier/magasin/infos.html'),

	behaviors: [WysiwygBehavior],

	regions: {
		countries: {
			el: "div[data-role='countries']",
			replaceElement: true
		}
	},

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'countries']);
	},

	onRender: function() {
		this.showChildView('countries', new SelectView({
			collection: this.countries,
			selected: this.model.get('country_id'),
			name: 'country_id'
		}));
		this.countries.fetch();
	}

});
