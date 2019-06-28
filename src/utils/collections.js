var Backbone = require('backbone');
var _ = require('underscore');

/**
 * Returns a promise that gathers models identified by id and execute
 * a function on them. The promise is resolved when all models are mapped
 *
 * @param {Backbone.Collection} collection
 * @param {Function} action
 * @param {Number[]} ids
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

/**
 * Returns a promise that gathers models identified by id and execute
 * a function on group of them. The promise is resolved when all models are mapped
 *
 * @param {Backbone.Collection} collection
 * @param {Function} action
 * @param {Number[]} ids
 * @param {Number} size
 * @param {String} eventName
 * @returns {Promise}
 */
function bulkGroupAction(collection, action, ids, size, eventName) {

	ids = _.compact(ids);
	if (size < 1) size = 1;

	var calls = [];
	for (var i = 0; i < ids.length; i += size) {
		var slice = ids.slice(i, i + size);
		calls.push(action(slice));
	}

	return Backbone.$.when.apply(Backbone.$, calls).then(function() {
		collection.trigger(eventName ? 'bulk:' + eventName : 'bulk', {
			action: action,
			ids: ids
		});
		// return clean id list
		return ids;
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
module.exports.bulkGroupAction = bulkGroupAction;
module.exports.SelectCollection = SelectCollection;
