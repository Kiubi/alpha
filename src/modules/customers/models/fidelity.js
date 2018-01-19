var Backbone = require('backbone');
var _ = require('underscore');

var Fidelity = Backbone.Model.extend({

	url: function() {
		return 'sites/@site/account/customers/' + this.get('customer_id') + '/fidelity';
	},

	idAttribute: '',
	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			return response.data;
		}
		return response;
	},

	defaults: {
		customer_id: null,
		qt: 0,
		comment: '',
		end_date: '',
		value_date: ''
	}

});

module.exports = Backbone.Collection.extend({

	customer_id: null,

	url: function() {
		return 'sites/@site/account/customers/' + this.customer_id + '/fidelity';
	},

	model: Fidelity,

	parse: function(response) {
		this.meta = response.meta;
		return response.data;
	},

	selectPayload: function() {
		return _.map(this.toJSON(), function(item) {
			return {
				'value': item.group_id,
				'label': item.name
			};
		});
	},

	/**
	 *
	 * @param {Number} qt
	 * @param {String} comment
	 */
	createOperation: function(qt, comment) {
		return Backbone.ajax({
			url: this.url(),
			method: 'POST',
			data: {
				qt: qt,
				comment: comment
			}
		}).then(function(response) {
			return _.map(response.data, function(operation) {
				return new Fidelity(operation);
			});
		});
	}

});
