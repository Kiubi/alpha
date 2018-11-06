var Backbone = require('backbone');

var Activity = Backbone.Model.extend({

	idAttribute: 'activity_id',

	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			return response.data;
		}
		return response;
	},

	defaults: {
		"activity_id": "integer",
		"text": "string",
		"type": "string",
		"ip": "string",
		"user_name": "string",
		"user_profil": "string",
		"customer_id": "integer",
		"avatar_thumb_url": '',
		"creation_date": "string"
	}

});

module.exports = Backbone.Collection.extend({

	url: 'sites/@site/logs',

	model: Activity,

	parse: function(response) {
		this.meta = response.meta;
		return response.data;
	}

});
