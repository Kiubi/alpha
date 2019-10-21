var CollectionUtils = require('kiubi/utils/collections.js');
var Backbone = require('backbone');
var _ = require('underscore');
var Job = require('./job');


function checkAnalyse(job) {

	var token = job.get('result');

	return Backbone.ajax({
		url: 'sites/@site/import/wordpress/' + token,
		method: 'GET'
	}).then(function(data) {

		data.token = token;

		return data;
	});
}

function checkImport(token) {

	return Backbone.ajax({
		url: 'sites/@site/import/wordpress/' + token,
		method: 'GET'
	}).then(function(data, meta) {
		return data;
	});
}

module.exports = CollectionUtils.KiubiModel.extend({

	url: 'sites/@site/import/wordpress',

	isNew: function() {
		return false;
	},

	defaults: {

	},

	/**
	 *
	 * @param {Object} params
	 * @returns {Promise}
	 */
	analyse: function(params) {
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
		}).then(function(data) {

			var job = new Job({
				job_id: data.job_id
			});

			return job.watch().then(function() {
				return checkAnalyse(job);
			});
		});
	},

	/**
	 *
	 * @param {String} token
	 */
	import: function(token) {
		return Backbone.ajax({
			url: this.url + '/' + token,
			method: 'PUT'
		}).then(function(data) {

			var job = new Job({
				job_id: data.job_id
			});

			return job.watch().then(function() {
				return checkImport(token);
			});
		});
	}

});
