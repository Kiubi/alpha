var CollectionUtils = require('kiubi/utils/collections.js');
var Backbone = require('backbone');
var _ = require('underscore');
var Job = require('./job');

var Backup = CollectionUtils.KiubiModel.extend({

	urlRoot: 'sites/@site/backups',
	idAttribute: 'id',

	defaults: {
		"id": null,
		"creation_date": ''
	},

	/**
	 * Restore current backup
	 *
	 * @returns {Promise}
	 */
	restore: function() {
		var D = new Backbone.$.Deferred();
		var collection = this;

		Backbone.ajax({
			url: this.urlRoot + '/' + this.get('id'),
			method: 'PUT'
		}).done(function(data) {

			var job = new Job({
				job_id: data.job_id
			});
			job.watch().done(function() {
				D.resolve(job.get('error'));
			}).fail(function(error, meta) {
				D.reject(error, meta);
			});
		}).fail(function(error, meta) {
			D.reject(error, meta);
		});

		return D.promise();
	}
});

module.exports = CollectionUtils.KiubiCollection.extend({

	url: 'sites/@site/backups',

	model: Backup,

	/**
	 * Create a new backup
	 *
	 * @returns {Promise}
	 */
	createBackup: function() {
		var D = new Backbone.$.Deferred();

		Backbone.ajax({
			url: this.url,
			method: 'POST'
		}).done(function(data) {

			var job = new Job({
				job_id: data.job_id
			});
			job.watch().done(function() {
				D.resolve(job.get('error'));
			}).fail(function(error, meta) {
				D.reject(error);
			});
		}).fail(function(error, meta) {
			D.reject(error, meta);
		});

		return D.promise();
	}

});
