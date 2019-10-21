var CollectionUtils = require('kiubi/utils/collections.js');
var Backbone = require('backbone');
var _ = require('underscore');

module.exports = CollectionUtils.KiubiModel.extend({

	urlRoot: 'sites/@site/jobs',
	idAttribute: 'job_id',

	defaults: {
		"job_id": null,
		"status": 'todo',
		"result": '',
		"progression": '',
		"step": '',
		"error": ''
	},

	timer: null,
	deferred: null,

	/**
	 * Watch repeatedly the current job status until job is done or halt.
	 * Done promise return current job : job.get('status') can be "done" or "halt"
	 * Fail promise return faulty xhr
	 *
	 * @returns {Promise}
	 */
	watch: function() {

		this.deferred = new Backbone.$.Deferred();

		this.fetchUntilDone();

		return this.deferred.promise();
	},

	unwatch: function() {
		clearTimeout(this.timer);
		this.deferred.reject();
	},

	fetchUntilDone: function() {

		this.fetch().done(function() {
			switch (this.get('status')) {
				default: // "todo" or "working"
					this.timer = setTimeout(this.fetchUntilDone.bind(this), 1500);
					break;
				case 'done':
				case 'halt':
					this.deferred.resolve(this);
					break;
			}
		}.bind(this)).fail(function(error, meta) {
			this.deferred.reject(error, meta);
		}.bind(this));
	}

});
