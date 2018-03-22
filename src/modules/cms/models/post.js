var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = Backbone.Model.extend({
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
	 * Return all post groups, formatted like selectPayload
	 *
	 * @returns {Promise}
	 */
	getGroups: function() {
		return Backbone.ajax({
			url: 'sites/@site/cms/posts_groups'
		}).then(function(response) {
			return _.map(response.data, function(type) {
				return {
					value: type.name,
					label: type.name
				};
			});
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
						'indent': null,
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
