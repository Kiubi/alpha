var Backbone = require('backbone');
var _ = require('underscore');

/**
 * Returns a promise that gathers models identified by id and execute
 * a function on them. The promise is resolved when all models are mapped
 *
 * @param {Backbone.Collection} collection
 * @param {Function} action
 * @param {Integer[]} ids
 * @param {String} eventName
 * @returns {Promise}
 */
function bulkAction(collection, action, ids, eventName) {

	var models = _.compact(_.map(ids, function(id) {
		return collection.get(id);
	}));

	return Backbone.$.when.apply(Backbone.$, models.map(action)).done(function(things) {
		collection.trigger(eventName ? 'bulk:' + eventName : 'bulk', {
			action: action,
			ids: ids
		});
	});
}

var Option = Backbone.Model.extend({

	idAttribute: 'value',

	defaults: {
		label: '',
		value: null,
		indent: null,
		selected: false,
		extraClassname: null,
		is_group: false
	}
});

var SelectCollection = Backbone.Collection.extend({
	model: Option
});

module.exports.bulkAction = bulkAction;
module.exports.SelectCollection = SelectCollection;
