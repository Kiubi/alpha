var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

var Item = CollectionUtils.KiubiModel.extend({
	urlRoot: 'sites/@site/cms/collection',
	idAttribute: 'item_id',

	url: function() {
		if (this.get('item_id')) {
			return 'sites/@site/cms/collection/' + this.get('item_id');
		}
		// Other URL for POST queries
		return 'sites/@site/cms/contents/' + this.get('content_id') + '/collection';
	},

	defaults: {
		item_id: null,
		content_id: null,
		is_visible: false,
		fields: {}
	},

	getLabel: function() {
		if (this.get('fields') && this.get('fields').title) return this.get('fields').title;
		return 'Élément sans titre';
	}

});

module.exports = CollectionUtils.KiubiCollection.extend({

	content_id: null,

	url: function() {
		return 'sites/@site/cms/contents/' + this.content_id + '/collection';
	},

	model: Item,

	/**
	 *
	 * @param {Number[]} ids
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
	 * @param {Number[]} ids
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

	},

	/**
	 *
	 * @param {Number[]} ids
	 * @returns {Promise}
	 */
	bulkDelete: function(ids) {
		return CollectionUtils.bulkGroupAction(this, function(slice) {
			return Backbone.ajax({
				url: 'sites/@site/cms/collection',
				method: 'DELETE',
				data: {
					items: slice
				}
			});
		}, ids, 100).done(function(ids) {
			this.remove(ids);
		}.bind(this));
	},

	/**
	 *
	 * @param {Array} list
	 * @returns {Promise}
	 */
	reOrder: function(list) {
		return Backbone.ajax({
			url: this.url(),
			method: 'PUT',
			data: {
				order: list
			}
		});
	},

});
