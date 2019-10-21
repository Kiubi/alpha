var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

var Job = require('kiubi/modules/modules/models/job');

function checkExport(job) {

	var token = job.get('result');

	return Backbone.ajax({
		url: 'sites/@site/export/cms/posts/' + token,
		method: 'GET'
	}).then(function(data, meta) {
		return data;
	});
}

var Post = CollectionUtils.KiubiModel.extend({
	urlRoot: 'sites/@site/cms/posts',
	idAttribute: 'post_id',

	previewLink: null,
	nextPost: null,
	previousPost: null,

	parse: function(response) { // FIXME
		if ('data' in response) {
			if (response.data === null) return {};
			if (_.isNumber(response.data)) {
				return {
					post_id: response.data
				};
			}

			if (response.meta && response.meta.link) {
				if (response.meta.link.preview) this.previewLink = response.meta.link.preview;
				if (response.meta.link.next_post) {
					var id = response.meta.link.next_post.match('cms/posts/([0-9]+)');
					if (id) {
						this.nextPost = parseInt(id[1]);
					}
				}
				if (response.meta.link.previous_post) {
					var id = response.meta.link.previous_post.match('cms/posts/([0-9]+)');
					if (id) {
						this.previousPost = parseInt(id[1]);
					}
				}
			}

			return response.data;
		}
		return response;
	},

	defaults: {
		post_id: null,
		page_id: '',
		page_name: '',
		is_home: false,
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


module.exports = CollectionUtils.KiubiCollection.extend({

	page_id: null,

	url: function() {
		if (this.page_id > 0) return 'sites/@site/cms/pages/' + this.page_id +
			'/posts';
		return 'sites/@site/cms/posts';
	},

	model: Post,


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
	},

	/**
	 * Suggest posts
	 *
	 * @param {String} term
	 * @param {Number[]} limit
	 * @returns {Promise}
	 */
	suggest: function(term, limit) {
		return Backbone.ajax({
			url: 'sites/@site/suggest/cms/posts',
			data: {
				term: term,
				limit: limit || 5
			}
		}).then(function(data) {
			return _.map(data, function(post) {

				var label = 'Billet sans titre';
				if (post.title) {
					label = post.title;
				} else if (post.subtitle) {
					label = post.subtitle;
				}

				return {
					post_id: post.post_id,
					label: label
				};
			});
		});
	},

	/**
	 * @param {Object} data
	 * @returns {Promise}
	 */
	exportAll: function(data) {
		return Backbone.ajax({
			url: 'sites/@site/export/cms/posts',
			method: 'POST',
			data: data
		}).then(function(data) {

			var job = new Job({
				job_id: data.job_id
			});

			return job.watch().then(function() {
				return checkExport(job);
			});
		});
	}

});
