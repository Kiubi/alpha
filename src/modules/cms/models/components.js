var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

var Component = CollectionUtils.KiubiModel.extend({

	url: function() {
		return 'sites/@site/cms/contents/' + this.get('content_id') + '/component';
	},

	idAttribute: 'content_id',

	defaults: {
		content_id: null,
		fields: []
	},

	getLabel: function() {
		if (!this.get('fields') || !this.get('fields').title) return 'Composant sans titre';
		return this.get('fields').title;
	},

	/**
	 * Return all types
	 *
	 * @returns {Promise}
	 */
	getTypes: function(options) {

		options = options || {};

		return Backbone.ajax({
			url: 'sites/@site/cms/components.json',
			data: options
		}).then(function(data, meta) {
			return _.map(data, function(type) {
				return {
					type: type.type,
					name: type.name,
					fields: type.fields || [],
					collection: type.collection || [],
					has_collection: type.has_collection || false
				};
			});
		});
	}

});


module.exports = CollectionUtils.KiubiCollection.extend({

	url: function() {
		return 'sites/@site/cms/contents';
	},

	model: Component

});
