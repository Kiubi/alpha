var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

var Components = require('./components.js');
var Posts = require('./posts.js');
var Job = require('kiubi/modules/modules/models/job');

function checkExport(job) {

	var token = job.get('result');

	return Backbone.ajax({
		url: 'sites/@site/export/cms/contents/' + token,
		method: 'GET'
	}).then(function(data, meta) {
		return data;
	});
}

var Content = CollectionUtils.KiubiModel.extend({
	url: function() {

		if (this.get('content_id')) {
			return 'sites/@site/cms/contents/' + this.get('content_id');
		}

		return 'sites/@site/cms/contents/' + this.get('content');
	},
	idAttribute: 'content_id',

	symbol_id: null,
	page_id: null,

	defaults: {
		content_id: null,
		content_title: '',
		is_visible: false,
		zone: null,
		content: 'post',
		post: null,
		symbol: null,
		component: null
	},

	nextContent: null,
	previousContent: null,

	/**
	 *
	 * @param meta
	 * @returns {{next: boolean, previous: boolean}|null}
	 */
	parseMeta: function(meta) {
		if (!meta || !meta.link) {
			return;
		}

		this.nextContent = null;
		if (meta.link.next_content) {
			var id = meta.link.next_content.match('cms/contents/([0-9]+)');
			if (id) {
				this.nextContent = parseInt(id[1]);
			}
		}

		this.previousContent = null;
		if (meta.link.previous_content) {
			var id = meta.link.previous_content.match('cms/contents/([0-9]+)');
			if (id) {
				this.previousContent = parseInt(id[1]);
			}
		}
	},

	getTitle: function() {

		if (this.get('content_title')) {
			return this.get('content_title');
		}

		switch (this.get('content')) {
			case 'post':
				return 'Billet sans titre';
			case 'component':
				return 'Composant sans titre';
			case 'symbol':
				return 'Symbole sans titre';
			default:
				return 'Sans titre';
		}
	},

	getTypeName: function() {
		switch (this.get('content')) {
			case 'post':
				return this.get('post').type_name;
			case 'component':
				return this.get('component').type_name;
			case 'symbol':
				return this.get('symbol').model_name;
			default:
				return '-';
		}
	},

	getContentModel: function() {

		var base = {
			content_id: this.get('content_id')
		};

		switch (this.get('content')) {
			case 'post':
				var model = new(new Posts()).model(base);
				model.set({
					type: this.get('post').type,
					type_name: this.get('post').type_name,
					title: this.get('post').title || '',
					subtitle: this.get('post').subtitle || '',
					group: this.get('post').group || '',
					text1: this.get('post').text1 || '',
					text2: this.get('post').text2 || '',
					text3: this.get('post').text3 || '',
					text4: this.get('post').text4 || '',
					text5: this.get('post').text5 || '',
					text6: this.get('post').text6 || '',
					text7: this.get('post').text7 || '',
					text8: this.get('post').text8 || '',
					text9: this.get('post').text9 || '',
					text10: this.get('post').text10 || '',
					text11: this.get('post').text11 || '',
					text12: this.get('post').text12 || '',
					text13: this.get('post').text13 || '',
					text14: this.get('post').text14 || '',
					text15: this.get('post').text15 || ''
				});
				return model;
			case 'component':
				var model = new(new Components()).model(base);
				model.set({
					//title:this.get('component').title,
					type: this.get('component').type,
					type_name: this.get('component').type_name,
					fields: this.get('component').fields || {}
				});
				return model;
			default:
				return null;
		}
	},

	/**
	 * Duplicate current content
	 *
	 * @return {Promise}
	 */
	duplicate: function(attributes) {

		attributes = attributes || {};

		var that = this;
		return Backbone.ajax({
			url: 'sites/@site/cms/contents/' + this.get('content_id'),
			method: 'POST',
			data: attributes
		}).then(function(data, meta) {
			var copy = that.clone();
			copy.set(copy.parse({
				data: data,
				meta: meta
			}));
			return copy;
		});
	}

});

module.exports = CollectionUtils.KiubiCollection.extend({

	symbol_id: null,
	page_id: null,

	url: function() {

		if (this.symbol_id) {
			return 'sites/@site/cms/symbols/' + this.symbol_id + '/contents';
		}

		return 'sites/@site/cms/pages/' + this.page_id + '/contents';
	},

	model: Content,

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
				url: 'sites/@site/cms/contents',
				method: 'DELETE',
				data: {
					contents: slice
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
	suggest: function(term, limit) { // TODO
		return Backbone.ajax({
			url: 'sites/@site/suggest/cms/posts',
			data: {
				term: term,
				limit: limit || 5
			}
		}).then(function(data) {
			return _.map(data, function(content) {

				var label = 'Billet sans titre';
				if (content.title) {
					label = content.title;
				} else if (content.subtitle) {
					label = content.subtitle;
				}

				return {
					content_id: content.content_id,
					label: label
				};
			});
		});
	},

	/**
	 *
	 * @param zone
	 * @param list
	 */
	reOrder: function(zone, list) {

		var url = this.symbol_id ? 'sites/@site/cms/symbols/' + this.symbol_id + '/contents' : 'sites/@site/cms/pages/' + this.page_id + '/contents';

		return Backbone.ajax({
			url: url,
			method: 'PUT',
			data: {
				zone: zone,
				order: list
			}
		});
	},

	/**
	 * @param {Object} data
	 * @returns {Promise}
	 */
	exportAll: function(data) {

		return Backbone.ajax({
			url: 'sites/@site/export/cms/contents',
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
