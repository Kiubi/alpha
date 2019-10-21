var CollectionUtils = require('kiubi/utils/collections.js');
var Backbone = require('backbone');
var _ = require('underscore');
var Job = require('kiubi/modules/modules/models/job');

function checkImport(job) {

	var result = job.get('result').split(';');
	var token = result[1];

	return Backbone.ajax({
		url: 'sites/@site/import/l10n/theme/' + token,
		method: 'GET'
	}).then(function(data, meta) {
		return data;
	});
}

var Entry = CollectionUtils.KiubiModel.extend({

	url: 'sites/@site/l10n/theme', // endpoint like sites/@site/l10n/theme/{msgid} doesn't exists

	idAttribute: 'msgid',

	defaults: {
		msgid: null,
		msgstr: ''
	}

});

module.exports = CollectionUtils.KiubiCollection.extend({

	url: 'sites/@site/l10n/theme',

	model: Entry,

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
		}).then(function(data) {

			var job = new Job({
				job_id: data.job_id
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
		}).then(function(data, meta) {

			if (meta && meta.success) {
				return data;
			}

			// TODO reject !

		});
	}

});
