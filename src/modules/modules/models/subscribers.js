var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

var Job = require('kiubi/modules/modules/models/job');

function checkExport(job) {

	var token = job.get('result');

	return Backbone.ajax({
		url: 'sites/@site/export/subscribers/' + token,
		method: 'GET'
	}).then(function(data, meta) {
		return data;
	});
}

var Subscriber = CollectionUtils.KiubiModel.extend({

	urlRoot: 'sites/@site/subscribers',
	idAttribute: 'subscriber_id',

	defaults: {
		"subscriber_id": null,
		"email": '',
		"is_registered": false,
		"subscription_date": ''
	}
});

module.exports = CollectionUtils.KiubiCollection.extend({

	url: 'sites/@site/subscribers',

	model: Subscriber,

	/**
	 *
	 * @param {Number[]} ids
	 * @returns {Promise}
	 */
	bulkSubscribe: function(ids) {

		return CollectionUtils.bulkAction(this, function(model) {
			if (model.get('is_registered')) {
				// already visible
				return Backbone.$.Deferred().resolve();
			}
			return model.save({
				'is_registered': true
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
	bulkUnsubscribe: function(ids) {

		return CollectionUtils.bulkAction(this, function(model) {
			if (!model.get('is_registered')) {
				// already hidden
				return Backbone.$.Deferred().resolve();
			}
			return model.save({
				'is_registered': false
			}, {
				patch: true
			});
		}, ids);

	},

	/**
	 * @param {Object} data
	 * @returns {Promise}
	 */
	exportAll: function(data) {
		return Backbone.ajax({
			url: 'sites/@site/export/subscribers',
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
