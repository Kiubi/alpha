var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

var Job = require('kiubi/modules/modules/models/job');

function checkExport(job) {

	var token = job.get('result');

	return Backbone.ajax({
		url: 'sites/@site/export/account/customers/' + token,
		method: 'GET'
	}).then(function(response) {
		return response.data;
	});
}

var Customer = Backbone.Model.extend({
	urlRoot: 'sites/@site/account/customers',
	idAttribute: 'customer_id',

	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			if (_.isNumber(response.data)) {
				return {
					customer_id: response.data
				};
			}
			return response.data;
		}
		return response;
	},

	defaults: {
		customer_id: null,
		is_enabled: false,
		number: '',
		firstname: '',
		lastname: "",
		gender: "",
		email: "",
		password: "",
		group_id: 0,
		website: "",
		nickname: "",
		avatar_url: '',
		avatar_thumb_url: '',
		/*creation_date": "string",
		 creation_date_f": "string",
		 creation_date_timestamp": "integer",*/
		is_in_mailinglist: false,
		order_count: 0,
		order_revenues: 0,
		order_revenues_label: ''
	}

});

module.exports = Backbone.Collection.extend({

	url: 'sites/@site/account/customers',

	model: Customer,

	parse: function(response) {
		this.meta = response.meta;
		return response.data;
	},

	/**
	 *
	 * @param {Integer[]} ids
	 * @returns {Promise}
	 */
	bulkEnable: function(ids) {

		return CollectionUtils.bulkAction(this, function(model) {
			if (model.get('is_enabled')) {
				// already visible
				return Backbone.$.Deferred().resolve();
			}
			return model.save({
				'is_enabled': true
			}, {
				patch: true
			});
		}, ids);

	},

	/**
	 *
	 * @param {Integer[]} ids
	 * @returns {Promise}
	 */
	bulkDisable: function(ids) {

		return CollectionUtils.bulkAction(this, function(model) {
			if (!model.get('is_enabled')) {
				// already hidden
				return Backbone.$.Deferred().resolve();
			}
			return model.save({
				'is_enabled': false
			}, {
				patch: true
			});
		}, ids);

	},

	/**
	 *
	 * @param {Integer[]} ids
	 * @returns {Promise}
	 */
	bulkDelete: function(ids) {

		return CollectionUtils.bulkAction(this, function(model) {
			return model.destroy();
		}, ids);

	},

	/**
	 * Suggest costumers
	 *
	 * @param {String} term
	 * @param {Number[]} limit
	 * @param {Number[]} exclude
	 * @returns {Promise}
	 */
	suggest: function(term, limit, exclude) {
		return Backbone.ajax({
			url: 'sites/@site/suggest/account/customers',
			data: {
				term: term,
				exclude: exclude,
				limit: limit || 5
			}
		}).then(function(response) {
			return _.map(response.data, function(customer) {
				return {
					customer_id: customer.customer_id,
					lastname: customer.lastname,
					firstname: customer.firstname
				};
			});
		});
	},

	/**
	 * @param {Object} data
	 * @returns {Promise}
	 */
	exportAll: function(data) {
		return Backbone.ajax({
			url: 'sites/@site/export/account/customers',
			method: 'POST',
			data: data
		}).then(function(response) {

			var job = new Job({
				job_id: response.data.job_id
			});

			return job.watch().then(function() {
				return checkExport(job);
			});
		});
	}

});
