var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

var Job = require('kiubi/modules/modules/models/job');

function checkExport(job) {

	var token = job.get('result');

	return Backbone.ajax({
		url: 'sites/@site/export/forms/responses/' + token,
		method: 'GET'
	}).then(function(data, meta) {
		return data;
	});
}

var Response = CollectionUtils.KiubiModel.extend({

	urlRoot: function() {
		return 'sites/@site/forms/responses';
	},

	idAttribute: 'response_id',

	defaults: {
		"response_id": null,
		"form_id": 0,
		"form_name": '', // with extra_fields=forms
		"subject": '', // with extra_fields=forms
		"is_read": false,
		"email_status": null,
		"fields": [
			/*{
				"field_id": "integer",
				"name": "string",
				"value": "string"
			}*/
		],
		"ip": "",
		"reverse_host": "",
		"creation_date": ""
	},

	getSummary: function() {

		var l = 115;

		return _.reduce(this.get('fields'), function(memo, field) {
			if (memo.length >= l) return memo;

			var value = '';
			if (field.type == 'text') value = field.value;
			else if (field.type == 'file') value = field.value.name;

			memo += field.name + ' ' + value + ' ';
			if (memo.length >= l) return memo.substring(0, l - 3) + '...';
			return memo;
		}, '');
	},

	getEmailStatus: function() {
		switch (this.get('email_status')) {
			default:
				return null;
			case 'SENT':
				return {
					label: 'L\'email de notification a été envoyé',
						warning: false
				};
			case 'DISABLED':
				return {
					label: 'Pas d\'envoi d\'email de notification',
						warning: true
				};
			case 'DISABLED_CAPTCHA':
				return {
					label: 'Non : le captcha est désactivé',
						warning: true
				};
			case 'CANCELED_TPL':
				return {
					label: 'Non : le template de l\'email est introuvable',
						warning: true
				};
			case 'CANCELED_SPAM':
				return {
					label: 'Non : le contenu est probablement un spam',
						warning: true
				};
		}
	}

});

module.exports = CollectionUtils.KiubiCollection.extend({

	url: function() {
		return 'sites/@site/forms/responses';
	},

	model: Response,

	/**
	 *
	 * @param {Number[]} ids
	 * @returns {Promise}
	 */
	bulkRead: function(ids) {

		return CollectionUtils.bulkAction(this, function(model) {
			if (model.get('is_read')) {
				// already visible
				return Backbone.$.Deferred().resolve();
			}
			return model.save({
				'is_read': true
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
	bulkUnred: function(ids) {

		return CollectionUtils.bulkAction(this, function(model) {
			if (!model.get('is_read')) {
				// already hidden
				return Backbone.$.Deferred().resolve();
			}
			return model.save({
				'is_read': false
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
	bulkDelete: function(ids) {
		return CollectionUtils.bulkGroupAction(this, function(slice) {
			return Backbone.ajax({
				url: 'sites/@site/forms/responses',
				method: 'DELETE',
				data: {
					responses: slice
				}
			});
		}, ids, 100).done(function(ids) {
			this.remove(ids);
		}.bind(this));
	},

	/**
	 * @param {Object} data
	 * @returns {Promise}
	 */
	exportAll: function(data) {
		return Backbone.ajax({
			url: 'sites/@site/export/forms/responses',
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
