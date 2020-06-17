var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

var Post = CollectionUtils.KiubiModel.extend({

	url: function() {
		return 'sites/@site/cms/contents/' + this.get('content_id') + '/post';
	},

	idAttribute: 'content_id',


	defaults: {
		content_id: null,
		type: '',
		type_name: '',
		title: '',
		subtitle: '',
		group: '',
		text1: '',
		text2: '',
		text3: '',
		text4: '',
		text5: '',
		text6: '',
		text7: '',
		text8: '',
		text9: '',
		text10: '',
		text11: '',
		text12: '',
		text13: '',
		text14: '',
		text15: ''
	},

	getLabel: function() {
		if (this.get('title')) return this.get('title');
		if (this.get('subtitle')) return this.get('subtitle');
		return 'Billet sans titre';
	},

	/**
	 * Return all post groups
	 *
	 * @returns {Promise} will return a SelectCollection
	 */
	getGroups: function() {
		return Backbone.ajax({
			url: 'sites/@site/cms/posts_groups'
		}).then(function(data) {
			var c = new CollectionUtils.SelectCollection();
			c.add(_.map(data, function(group) {
				return {
					'value': group.name,
					'label': group.name
				};
			}));

			return c;
		});
	},

	/**
	 * Return all post types
	 *
	 * @returns {Promise}
	 */
	getTypes: function() {
		return Backbone.ajax({
			url: 'sites/@site/cms/posts_types',
			data: {
				extra_fields: 'structure'
			}
		}).then(function(data) {
			return _.map(data, function(type) {
				return {
					type: type.type,
					name: type.name,
					position: type.position,
					fields: type.fields || []
				};
			});
		});
	},

	/**
	 *
	 * @param {Number} selected
	 * @returns {Promise} Promised {Backbone.Collection}
	 */
	promisedTypes: function(selected) {

		return Backbone.ajax({
			url: 'sites/@site/cms/posts_types'
		}).then(function(data) {

			var c = new CollectionUtils.SelectCollection();
			var collector = [];

			if (data) {
				_.each(data, function(type) {
					collector.push({
						'value': type.type,
						'label': type.name,
						'selected': selected && type.type == selected
					});
				});
			}

			c.add(collector);

			return c;
		});
	}

});


module.exports = CollectionUtils.KiubiCollection.extend({

	page_id: null,

	url: function() {
		if (this.page_id > 0) return 'sites/@site/cms/pages/' + this.page_id + '/posts';
		return 'sites/@site/cms/posts';
	},

	model: Post,

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
				url: 'sites/@site/cms/posts',
				method: 'DELETE',
				data: {
					posts: slice
				}
			});
		}, ids, 100).done(function(ids) {
			this.remove(ids);
		}.bind(this));
	}

});
