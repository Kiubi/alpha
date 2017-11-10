var Backbone = require('backbone');
var _ = require('underscore');

module.exports = Backbone.Collection.extend({

	url: 'sites/@site/account/groups',

	model: require('./group'),
	parse: function(response) {
		this.meta = response.meta;
		return response.data;
	},

	selectPayload: function() {
		return _.map(this.toJSON(), function(item) {
			return {
				'value': item.group_id,
				'label': item.name
			}
		});
	}

});
