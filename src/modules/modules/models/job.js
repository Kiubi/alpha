var Backbone = require('backbone');
var _ = require('underscore');

module.exports = Backbone.Model.extend({

	urlRoot: 'sites/@site/jobs',
	idAttribute: 'job_id',

	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			if (_.isNumber(response.data)) {
				return {
					job_id: response.data
				};
			}

			return response.data;
		}
		return response;
	},

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
		}.bind(this)).fail(function(xhr) {
			this.deferred.reject(xhr);
		}.bind(this));
	}

});
