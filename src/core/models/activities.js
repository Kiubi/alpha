var CollectionUtils = require('kiubi/utils/collections.js');

var Activity = CollectionUtils.KiubiModel.extend({

	idAttribute: 'activity_id',

	defaults: {
		"activity_id": "integer",
		"text": "string",
		"urn": "",
		"type": "string",
		"ip": "string",
		"user_name": "string",
		"user_profil": "string",
		"customer_id": "integer",
		"avatar_url": '',
		"avatar_thumb_url": '',
		"creation_date": "string"
	},

	mapUrnToUrl: function() {

		if (this.get('urn') === '') return null;

		var split = this.get('urn').split('/');
		if (split.length < 2) return null;

		// whiltelist :
		switch (split[1]) {
			default:
				return null;
			case 'blog':
			case 'cms':
			case 'customers':
			case 'forms':
			case 'themes':
				return this.get('urn');
			case 'backups':
				return '/modules/backups';
			case 'catalog':
				if (split[2] == 'tier_prices') {
					return '/modules/tier_prices' + (split.length == 4 ? '/' + split[3] : '');
				}
				return this.get('urn');
			case 'checkout':
				if (split[2] == 'vouchers') {
					return '/modules/vouchers' + (split.length == 4 ? '/' + split[3] : '');
				}
				return this.get('urn');
			case 'domains':
				return '/prefs/domains';
			case 'l10n':
				return '/prefs/l10n';
			case 'prefs':
				if (split[2] == 'ads' || split[2] == 'fidelity' || split[2] == 'merchantcenter') {
					return '/modules/' + split[2];
				} else if (split[2] == 'blog' || split[2] == 'catalog' || split[2] == 'checkout' || split[2] == 'customers') {
					return '/' + split[2] + '/settings';
				} else if (split[2] == 'newsletter') {
					return '/modules/subscribers/settings';
				} else if (split[2] == 'theme') {
					return '/prefs';
				}
				return this.get('urn');
			case 'seo':
				if (split[2] == 'meta') {
					return '/prefs/meta';
				}
				return '/modules/redirections';
			case 'subscribers':
				return '/modules/subscribers';
		}

	}

});

module.exports = CollectionUtils.KiubiCollection.extend({

	url: 'sites/@site/logs',

	model: Activity

});
