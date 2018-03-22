var Backbone = require('backbone');
var _ = require('underscore');
var Job = require('./job');

function checkImport(job) {

	var result = job.get('result').split(';');
	var token = result[1];

	return Backbone.ajax({
		url: 'sites/@site/import/cms/posts/' + token,
		method: 'GET'
	}).then(function(response) {
		return response.data;
	});
}

module.exports = Backbone.Model.extend({

	url: 'sites/@site/import/cms/posts',

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
		'is_enabled': false,
		'page_id': null,
		'mode': '',
		'type': '',
		'file': null
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
