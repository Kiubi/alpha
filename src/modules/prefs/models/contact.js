var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

	url: 'sites/@site/prefs/contact',

	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			return response.data;
		}
		return response;
	},

	isNew: function() {
		return false;
	},

	defaults: {
		firstname: '',
		lastname: '',
		civility: '',
		email: '',
		address: '',
		zipcode: '',
		city: '',
		country_id: '',
		phone: '',
		mobile: '',
		fax: '',
		company_name: '',
		company_forme: '',
		company_cnil: '',
		company_capital: '',
		company_siret: '',
		company_rcs: '',
		company_naf: '',
		company_tva: ''
	}

});
