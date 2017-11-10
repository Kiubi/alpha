var Backbone = require('backbone');
var _ = require('underscore');

/**
 * Returns a promise that gathers models identified by id and execute
 * a function on them. The promise is resolved when all models are mapped
 *
 * @param {Backbone.Collection} collection
 * @param {Function} action
 * @param {Integer[]} ids
 * @returns {Promise}
 */
function bulkAction(collection, action, ids) {

	var models = _.compact(_.map(ids, function(id) {
		return collection.get(id);
	}));

	return models.map(action).reduce(function(prev, curr) {
		return prev.then(curr);
	}, Backbone.$.Deferred().resolve());
}

module.exports.bulkAction = bulkAction;
