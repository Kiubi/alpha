var CollectionUtils = require('kiubi/utils/collections.js');

var Activity = CollectionUtils.KiubiModel.extend({

	idAttribute: 'activity_id',

	defaults: {
		"activity_id": "integer",
		"text": "string",
		"type": "string",
		"ip": "string",
		"user_name": "string",
		"user_profil": "string",
		"customer_id": "integer",
		"avatar_url": '',
		"avatar_thumb_url": '',
		"creation_date": "string"
	}

});

module.exports = CollectionUtils.KiubiCollection.extend({

	url: 'sites/@site/logs',

	model: Activity

});
