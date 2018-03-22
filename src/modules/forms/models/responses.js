var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

var Response = Backbone.Model.extend({

	urlRoot: function() {
		return 'sites/@site/forms/responses';
	},

	idAttribute: 'response_id',

	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			if (_.isNumber(response.data)) {
				return {
					response_id: response.data
				};
			}

			return response.data;
		}
		return response;
	},

	defaults: {
		"response_id": null,
		"form_id": 0,
		"form_name": '', // with extra_fields=forms
		"subject": '', // with extra_fields=forms
		"is_read": false,
		"fields": [
			/*{
				"field_id": "integer",
				"name": "string",
				"value": "string"
			}*/
		],
		"ip": "",
		"reverse_host": "",
		"creation_date": ""
	},

	getSummary: function() {

		var l = 140;

		return _.reduce(this.get('fields'), function(memo, field) {
			if (memo.length >= l) return memo;
			memo += field.name + ' ' + field.value + ' ';
			if (memo.length >= l) return memo.substring(0, l - 3) + '...';
			return memo;
		}, '');
	}

});

module.exports = Backbone.Collection.extend({

	url: function() {
		return 'sites/@site/forms/responses';
	},

	model: Response,

	parse: function(response) {
		this.meta = response.meta;
		return response.data;
	},

	/**
	 *
	 * @param {Integer[]} ids
	 * @returns {Promise}
	 */
	bulkRead: function(ids) {

		return CollectionUtils.bulkAction(this, function(model) {
			if (model.get('is_read')) {
				// already visible
				return Backbone.$.Deferred().resolve();
			}
			return model.save({
				'is_read': true
			}, {
				patch: true
			});
		}, ids);

	},

	/**
	 *
	 * @param {Integer[]} ids
	 * @returns {Promise}
	 */
	bulkUnred: function(ids) {

		return CollectionUtils.bulkAction(this, function(model) {
			if (!model.get('is_read')) {
				// already hidden
				return Backbone.$.Deferred().resolve();
			}
			return model.save({
				'is_read': false
			}, {
				patch: true
			});
		}, ids);

	},

	/**
	 *
	 * @param {Integer[]} ids
	 * @returns {Promise}
	 */
	bulkDelete: function(ids) {

		return CollectionUtils.bulkAction(this, function(model) {
			return model.destroy();
		}, ids);

	}

});
