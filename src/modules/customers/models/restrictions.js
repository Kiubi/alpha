var Backbone = require('backbone');

module.exports = Backbone.Model.extend({

	type: '',
	type_id: null,

	// /cms/pages/{page_id}/restrictions.json
	// /media/folders/{folder_id}/restrictions.json
	// /checkout/vouchers/{voucher_id}/restrictions

	url: function() {
		return 'sites/@site/' + this.type + '/' + this.type_id + '/restrictions';
	},

	setType: function(type, id) {
		this.type = type;
		this.type_id = id;
	},

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
		//customer_id: null,
		//group_id: null
	}

});
