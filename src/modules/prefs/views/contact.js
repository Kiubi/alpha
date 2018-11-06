var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var SelectView = require('kiubi/core/views/ui/select.js');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');


module.exports = Marionette.View.extend({
	template: require('../templates/contact.html'),
	className: 'container',
	service: 'prefs',

	behaviors: [FormBehavior],

	regions: {
		countries: {
			el: "div[data-role='countries']",
			replaceElement: true
		}
	},

	fields: [
		'firstname',
		'lastname',
		'civility',
		'email',
		'address',
		'zipcode',
		'city',
		'country_id',
		'phone',
		'mobile',
		'fax',
		'company_name',
		'company_forme',
		'company_cnil',
		'company_capital',
		'company_siret',
		'company_rcs',
		'company_naf',
		'company_tva'
	],

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
	},

	onSave: function() {
		return this.model.save(
			Forms.extractFields(this.fields, this), {
				patch: true
			}
		);
	}

});
