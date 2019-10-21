var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

var Link = CollectionUtils.KiubiModel.extend({
	urlRoot: 'sites/@site/blog/links',
	idAttribute: 'link_id',

	defaults: {
		link_id: null,
		name: '',
		description: '',
		url: '',
		is_enabled: false,
		position: 0
	}

});

module.exports = CollectionUtils.KiubiCollection.extend({
	url: 'sites/@site/blog/links',
	model: Link,

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

	}

});
