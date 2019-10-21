var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = CollectionUtils.KiubiModel.extend({

	url: 'sites/@site/prefs/avisverifies',

	isNew: function() {
		return false;
	},

	defaults: {
		"id": "",
		"secret": "",
		"plateform": "",
		"offset": 0,
		"is_sending_products": false,
		"is_enabled": false
	},

	getPlatforms: function() {
		return {
			'FR': 'www.avis-verifies.com',
			'ES': 'www.opiniones-verificadas.com',
			'DE': 'www.echte-bewertungen.com',
			'IT': 'www.recensioni-verificate.com',
			'NL': 'www.echte-beoordelingen.com',
			'UK': 'www.verified-reviews.co.uk',
			'US': 'www.verified-reviews.com',
			'BR': 'www.opinioes-verificadas.com.br',
			'PT': 'www.opinioes-verificadas.com',
			'CO': 'www.opiniones-verificadas.com.co',
			'PL': 'www.prawdziwe-opinie.com',
			'PE': 'www.opiniones-verificadas.pe',
			'CL': 'www.cl.opiniones-verificadas.com',
			'AU': 'www.au.verified-reviews.com',
			'NZ': 'www.verified-reviews.co.nz',
			'MX': 'www.opiniones-verificadas.com.mx'
		};
	}

});
