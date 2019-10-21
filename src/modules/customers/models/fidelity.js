var CollectionUtils = require('kiubi/utils/collections.js');
var Backbone = require('backbone');
var _ = require('underscore');

var Fidelity = CollectionUtils.KiubiModel.extend({

	url: function() {
		return 'sites/@site/account/customers/' + this.get('customer_id') + '/fidelity';
	},

	idAttribute: '',

	defaults: {
		customer_id: null,
		qt: 0,
		comment: '',
		end_date: '',
		value_date: ''
	}

});

module.exports = CollectionUtils.KiubiCollection.extend({

	customer_id: null,

	url: function() {
		return 'sites/@site/account/customers/' + this.customer_id + '/fidelity';
	},

	model: Fidelity,

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
		}).then(function(data) {
			return _.map(data, function(operation) {
				return new Fidelity(operation);
			});
		});
	}

});
