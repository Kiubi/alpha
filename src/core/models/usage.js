var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = CollectionUtils.KiubiModel.extend({

	url: 'sites/@site/stats/usage',

	isNew: function() {
		return false;
	},

	defaults: {
		space: {
			/*
			 medias: 0,
			 datas: 0,
			 ftp: 0,
			 used: 0
			 free: 0
			 total: 0
			 */
		},
		bandwidth: { // extra_fields=bp
			/*
			 used: 0
			 free: 0
			 total: 0
			*/
		},
		api_pfo: { // extra_fields=api_pfo
			/*
			 used: 0
			 free: 0
			 total: 0
			 */
		},
		products: { // extra_fields=products
			/*
			 used: 0
			 free: 0
			 total: 0
			 */
		},
		forms: { // extra_fields=forms
			/*
			 used: 0
			 free: 0
			 total: 0
			 */
		},
		users: { // extra_fields=users
			/*
			 used: 0
			 free: 0
			 total: 0
			 */
		}
	}

});
