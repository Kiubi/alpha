var CollectionUtils = require('kiubi/utils/collections.js');
var Backbone = require('backbone');
var _ = require('underscore');

var App = CollectionUtils.KiubiModel.extend({

	urlRoot: 'sites/@site/apps',
	idAttribute: 'app_id',

	defaults: {
		"app_id": null,
		"name": '',
		"description": ''
	},

	launch: function() {

		return Backbone.ajax({
			url: this.urlRoot + '/' + this.get('app_id'),
			method: 'POST'
		}).then(function(data) {
			return data.url;
		});

	}

});

module.exports = CollectionUtils.KiubiCollection.extend({

	url: 'sites/@site/apps',

	model: App

});
