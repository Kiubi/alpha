var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

var Form = Backbone.Model.extend({

	urlRoot: 'sites/@site/forms',
	idAttribute: 'form_id',

	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			if (_.isNumber(response.data)) {
				return {
					form_id: response.data
				};
			}

			return response.data;
		}
		return response;
	},

	defaults: {
		"form_id": null,
		"name": "",
		"is_enabled": false,
		"use_captcha": false,
		"recipient": "",
		"subject": "",
		"copy_to_sender": false,
		"message": "",
		"replies_count": 0,
		"replies_unread_count": 0,
		"creation_date": "",
		"modification_date": "",
		"form_key": "",
		"processing_purposes": "",
		is_consent_required: false

	}
});

module.exports = Backbone.Collection.extend({

	url: 'sites/@site/forms',

	model: Form,

	parse: function(response) {
		this.meta = response.meta;
		return response.data;
	},

	/**
	 *
	 * @param {Number} selected
	 * @returns {Promise} Promised {Backbone.Collection}
	 */
	promisedSelect: function(selected) {

		var that = this;

		return this.fetch().then(function() {

			var c = new CollectionUtils.SelectCollection();
			var collector = [];

			that.each(function(model) {
				collector.push({
					'value': model.get('form_id'),
					'label': model.get('name'),
					'selected': selected && model.get('form_id') == selected
				});
			});

			c.add(collector);

			return c;
		});
	}

});
