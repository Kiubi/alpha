var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

var Link = Backbone.Model.extend({
	urlRoot: 'sites/@site/blog/links',
	idAttribute: 'link_id',
	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			if (_.isNumber(response.data)) {
				return {
					link_id: response.data
				};
			}
			return response.data;
		}
		return response;
	},

	defaults: {
		link_id: null,
		name: '',
		description: '',
		url: '',
		is_enabled: false,
		position: 0
	}

});

module.exports = Backbone.Collection.extend({
	url: 'sites/@site/blog/links',
	model: Link,
	parse: function(response) {
		this.meta = response.meta;
		return response.data;
	},

	reOrder: function(list) {
		return Backbone.ajax({
			url: 'sites/@site/blog/links',
			method: 'PUT',
			data: {
				order: list
			}
		});
	},

	/**
	 *
	 * @param {Integer[]} ids
	 * @returns {Promise}
	 */
	bulkShow: function(ids) {

		return CollectionUtils.bulkAction(this, function(model) {
			if (model.get('is_enabled')) {
				// already visible
				return Backbone.$.Deferred().resolve();
			}
			return model.save({
				'is_enabled': true
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
	bulkHide: function(ids) {

		return CollectionUtils.bulkAction(this, function(model) {
			if (!model.get('is_enabled')) {
				// already hidden
				return Backbone.$.Deferred().resolve();
			}
			return model.save({
				'is_enabled': false
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
