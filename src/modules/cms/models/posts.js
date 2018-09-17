var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

var Post = Backbone.Model.extend({
	urlRoot: 'sites/@site/cms/posts',
	idAttribute: 'post_id',

	previewLink: null,

	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			if (_.isNumber(response.data)) {
				return {
					post_id: response.data
				};
			}

			if (response.meta && response.meta.link && response.meta.link.preview) {
				this.previewLink = response.meta.link.preview;
			}

			return response.data;
		}
		return response;
	},

	defaults: {
		post_id: null,
		page_id: '',
		type: '',
		type_name: '',
		type_pos: 1,
		title: '',
		subtitle: '',
		group: '',
		is_visible: '',
		position: '',
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
		}).then(function(response) {
			var c = new CollectionUtils.SelectCollection();
			c.add(_.map(response.data, function(group) {
				return {
					'value': group.name,
					'label': group.name,
					//'selected': selected && selected == type.type
				}
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
		}).then(function(response) {
			return _.map(response.data, function(type) {
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
		}).then(function(response) {

			var c = new CollectionUtils.SelectCollection();
			var collector = [];

			if (response.data) {
				_.each(response.data, function(type) {
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
	},

	/**
	 * Duplicate current post
	 *
	 * @return {Promise}
	 */
	duplicate: function() {

		var that = this;

		return this.fetch({
			data: {
				extra_fields: 'texts'
			}
		}).then(function() {
			var copy = that.clone();
			copy.set('post_id', null);
			copy.set('position', null);

			return copy.save().then(function() {
				return copy;
			});
		});
	}

});


module.exports = Backbone.Collection.extend({

	page_id: null,

	url: function() {
		if (this.page_id > 0) return 'sites/@site/cms/pages/' + this.page_id +
			'/posts';
		return 'sites/@site/cms/posts';
	},

	model: Post,
	parse: function(response) {
		this.meta = response.meta;
		return response.data;
	},

	reOrder: function(page_id, list) {
		return Backbone.ajax({
			url: 'sites/@site/cms/pages/' + page_id + '/posts',
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
