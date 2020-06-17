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

var KiubiModel = Backbone.Model.extend({

	previewLink: null,
	meta: null,

	/**
	 * 
	 * @param {Object} payload Payload or data from a Collection Payload
	 * @returns {*}
	 */
	parse: function(payload) {

		this.meta = {};

		// Request playload
		if ('data' in payload) {
			if (payload.data === null) return {};
			if (_.isNumber(payload.data)) {
				var d = {};
				d[this.idAttribute] = payload.data; // FIXME this.idAttribute == ''
				return d;
			}

			if (payload.meta) {

				this.meta = payload.meta;

				this.parseMeta(this.meta);

				if (payload.meta.link && payload.meta.link.preview) {
					this.previewLink = payload.meta.link.preview;
				}
			}

			return payload.data;
		}

		// Data from a KiubiCollection::parse()
		return payload;
	},

	/**
	 * Custom meta payload parser
	 *
	 * @param {Object} meta
	 */
	parseMeta: function(meta) {
		// do nothing
	},

	/**
	 * Duplicate current Model
	 *
	 * @param {Object} attributes
	 * @return {Promise} Will return new Model
	 */
	duplicate: function(attributes) {
		var that = this;
		var data = attributes || {};
		if (!data[this.idAttribute]) data[this.idAttribute] = this.get(this.idAttribute);

		return Backbone.ajax({
			url: _.isFunction(this.urlRoot) ? this.urlRoot() : this.urlRoot,
			method: 'POST',
			data: data
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

var KiubiCollection = Backbone.Collection.extend({

	meta: null,

	/**
	 * 
	 * @param {Object} payload
	 * @returns {Array}
	 */
	parse: function(payload) {
		this.meta = payload.meta;
		return payload.data;
	},

	/**
	 *
	 * @returns {Promise | Boolean}
	 */
	fetchNext: function() {
		if (!this.meta || !this.meta.link || !this.meta.link.next_page) {
			return false;
		}
		return this.fetch({
			url: this.meta.link.next_page,
			remove: false
		});
	},

	/**
	 *
	 * @param {Number[]} ids
	 * @param {String} eventName
	 * @returns {Promise}
	 */
	bulkDelete: function(ids, eventName) {

		return bulkAction(this, function(model) {
			return model.destroy();
		}, ids, eventName);

	},

	/**
	 *
	 * @returns {Number}
	 */
	getQuota: function() {
		if (this.meta && this.meta.quota && this.meta.quota.limit) return this.meta.quota.limit;
		return 0;
	},

	/**
	 *
	 * @returns {Number}
	 */
	getEstimatedUsage: function() {
		if (this.meta && this.meta.quota && this.meta.quota.usage) return this.meta.quota.usage;
		return 0;
	}

});

module.exports.bulkAction = bulkAction;
module.exports.bulkGroupAction = bulkGroupAction;
module.exports.SelectCollection = SelectCollection;
module.exports.KiubiModel = KiubiModel;
module.exports.KiubiCollection = KiubiCollection;
