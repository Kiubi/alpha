var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = CollectionUtils.KiubiModel.extend({

	url: 'sites/@site/prefs/contact',

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
