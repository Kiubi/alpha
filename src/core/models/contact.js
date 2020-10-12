var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = CollectionUtils.KiubiModel.extend({

	url: 'account/contact',


	isNew: function() {
		return false;
	},

	defaults: {
		"firstname": '',
		"lastname": '',
		"civility": '',
		"function": '',
		"phone": '',
		"email": '',
		"company_name": '',
		"company_address": '',
		"company_zipcode": '',
		"company_city": '',
		"company_country_id": null,
		"company_country": '',
		"company_forme": '',
		"company_siret": '',
		"company_capital": '',
		"company_rcs": '',
		"company_naf": '',
		"company_tva": ''
	}

});
