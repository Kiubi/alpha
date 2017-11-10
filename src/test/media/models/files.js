var Backbone = require('backbone');
var _ = require('underscore');

module.exports = Backbone.Collection.extend({

	folder_id: null,

	url: function() {
		return 'sites/@site/media/folders/' + this.folder_id + '/files';
	},

	model: require('./file'),
	parse: function(response) {
		this.meta = response.meta;
		return response.data;
	},

	/**
	 * 
	 * 
	 * @param {Function} action
	 * @param {Array} models
	 * @returns {Promise}
	 */
	bulkAction: function(action, models) {
		return models.map(action).reduce(function(prev, curr) {
			return prev.then(curr);
		}, Backbone.$.Deferred().resolve());
	},

	/**
	 *
	 * @param {Array} ids
	 * @returns {Promise}
	 */
	bulkDelete: function(ids) {
		var that = this;
		ids = _.compact(_.map(ids, function(id) {
			return that.get(id)
		}));

		return this.bulkAction(function(model) {
			return model.destroy.bind(model);
		}, ids);
	}
});
