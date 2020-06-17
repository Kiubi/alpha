var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

var Form = CollectionUtils.KiubiModel.extend({

	urlRoot: 'sites/@site/forms',
	idAttribute: 'form_id',

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

	},

	/**
	 * Duplicate current form
	 *
	 * @return {Promise}
	 */
	duplicate: function(attributes) {
		var that = this;
		var data = attributes || {};
		return Backbone.ajax({
			url: 'sites/@site/forms/' + this.get('form_id'),
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

module.exports = CollectionUtils.KiubiCollection.extend({

	url: 'sites/@site/forms',

	model: Form,

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
