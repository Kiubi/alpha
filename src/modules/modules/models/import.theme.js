var Backbone = require('backbone');
var _ = require('underscore');
var Job = require('./job');

function checkImport(job) {

	var token = job.get('result');

	return Backbone.ajax({
		url: 'sites/@site/import/theme/' + token,
		method: 'GET'
	}).then(function(response) {
		return response.data;
	});
}

module.exports = Backbone.Model.extend({

	url: 'sites/@site/import/theme',

	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			return response.data;
		}
		return response;
	},

	isNew: function() {
		return false;
	},

	defaults: {
		'file': null,
		'with_content': false,
		'copyrights_acquired': false
	},

	/**
	 *
	 * @param {Object} params
	 * @returns {Promise}
	 */
	import: function(params) {

		var data = new FormData();
		_.each(params, function(v, k) {
			data.append(k, v);
		});

		return Backbone.ajax({
			url: this.url,
			method: 'POST',
			data: data,
			processData: false,
			contentType: false
		}).then(function(response) {

			var job = new Job({
				job_id: response.data.job_id
			});

			return job.watch().then(function() {
				return checkImport(job);
			});
		});
	}

});
