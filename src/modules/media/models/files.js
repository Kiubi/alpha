var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

module.exports = Backbone.Collection.extend({

	folder_id: null,

	url: function() {
		if (this.folder_id) return 'sites/@site/media/folders/' + this.folder_id +
			'/files';
		return 'sites/@site/media/files';
	},

	model: require('./file'),
	parse: function(response) {
		this.meta = response.meta;
		return response.data;
	},

	upload: function() {
		var upload = [];

		this.each(function(file) {
			if (file.uploadProgression.status == 'pending') {
				upload.push(file.upload());
			}
		});

		return Backbone.$.when.apply(this, upload);
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

	},

	/**
	 *
	 * @param {Integer[]} ids
	 * @param {Integer} folder_id
	 * @returns {Promise}
	 */
	bulkMove: function(ids, folder_id) {

		return CollectionUtils.bulkAction(this, function(model) {
			if (model.get('folder_id') == folder_id) {
				// already in this folder
				return Backbone.$.Deferred().resolve();
			}
			return model.save({
				'folder_id': folder_id
			}, {
				patch: true,
				wait: true
			});
		}, ids);

	}

});
