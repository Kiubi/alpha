var Backbone = require('backbone');
var _ = require('underscore');
var Job = require('kiubi/modules/modules/models/job');

function checkImport(job) {

	var result = job.get('result').split(';');
	var token = result[1];

	return Backbone.ajax({
		url: 'sites/@site/import/l10n/theme/' + token,
		method: 'GET'
	}).then(function(response) {
		return response.data;
	});
}

var Entry = Backbone.Model.extend({

	url: 'sites/@site/l10n/theme', // endpoint like sites/@site/l10n/theme/{msgid} doesn't exists

	idAttribute: 'msgid',

	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			if (_.isNumber(response.data)) {
				return {
					msgid: response.data
				};
			}

			return response.data;
		}
		return response;
	},

	defaults: {
		msgid: null,
		msgstr: ''
	}

});

module.exports = Backbone.Collection.extend({

	url: 'sites/@site/l10n/theme',

	model: Entry,

	parse: function(response) {
		this.meta = response.meta;
		return response.data;
	},

	/**
	 * Clear all traductions
	 *
	 * @return {Promise}
	 */
	clearAll: function() {
		return Backbone.ajax({
			url: this.url,
			method: 'DELETE',
			data: {}
		});
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
			url: 'sites/@site/import/l10n/theme',
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
	},

	/**
	 *
	 * @returns {Promise}
	 */
	exportAll: function() {
		return Backbone.ajax({
			url: 'sites/@site/export/l10n/theme',
			method: 'POST',
			data: {}
		}).then(function(result) {

			if (result.meta && result.meta.success) {
				return result.data;
			}

			// TODO reject !

		});
	}

});
