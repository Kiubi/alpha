var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

var Categ = CollectionUtils.KiubiModel.extend({
	urlRoot: 'sites/@site/blog/categories',
	idAttribute: 'category_id',

	previewLink: null,

	defaults: {
		category_id: null,
		name: '',
		meta_title: '',
		meta_description: '',
		meta_keywords: '',
		js_head: '',
		js_body: '',
		slug: '',
		is_visible: false,
		layout_id: null,
		service_path: ''
	}

});


module.exports = CollectionUtils.KiubiCollection.extend({
	url: 'sites/@site/blog/categories',
	model: Categ,

	selectPayload: function() {
		return _.map(this.toJSON(), function(item) {
			return {
				'value': item.category_id,
				'label': item.name
			};
		});
	},

	/**
	 *
	 * @param {Number} selected
	 * @returns {Promise} Promised {Backbone.Collection}
	 */
	promisedSelect: function(selected) {

		var that = this;

		return this.fetch({
			data: {
				extra_fields: 'recursive'
			}
		}).then(function() {

			var c = new CollectionUtils.SelectCollection();
			var collector = [];

			that.each(function(model) {
				collector.push({
					'value': model.get('category_id'),
					'label': model.get('name'),
					'selected': selected && model.get('category_id') == selected
				});
			});

			c.add(collector);

			return c;
		});
	},

	/**
	 *
	 * @param {Integer[]} ids
	 * @returns {Promise}
	 */
	bulkShow: function(ids) {

		return CollectionUtils.bulkAction(this, function(model) {
			if (model.get('is_visible')) {
				// already visible
				return Backbone.$.Deferred().resolve();
			}
			return model.save({
				'is_visible': true
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
			if (!model.get('is_visible')) {
				// already hidden
				return Backbone.$.Deferred().resolve();
			}
			return model.save({
				'is_visible': false
			}, {
				patch: true
			});
		}, ids);

	}

});
