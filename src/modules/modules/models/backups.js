var Backbone = require('backbone');
var _ = require('underscore');
var Job = require('./job');

var Backup = Backbone.Model.extend({

	urlRoot: 'sites/@site/backups',
	idAttribute: 'id',

	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			if (_.isNumber(response.data)) {
				return {
					voucher_id: response.data
				};
			}

			return response.data;
		}
		return response;
	},

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
		}).done(function(response) {

			var job = new Job({
				job_id: response.data.job_id
			});
			job.watch().done(function() {
				D.resolve(job.get('error'));
			}).fail(function(xhr) {
				D.reject(xhr);
			});
		}).fail(function(xhr) {
			D.reject(xhr);
		});

		return D.promise();
	}
});

module.exports = Backbone.Collection.extend({

	url: 'sites/@site/backups',

	model: Backup,

	parse: function(response) {
		this.meta = response.meta;
		return response.data;
	},

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
		}).done(function(response) {

			var job = new Job({
				job_id: response.data.job_id
			});
			job.watch().done(function() {
				D.resolve(job.get('error'));
			}).fail(function(xhr) {
				D.reject(xhr);
			});
		}).fail(function(xhr) {
			D.reject(xhr);
		});

		return D.promise();
	}

});
