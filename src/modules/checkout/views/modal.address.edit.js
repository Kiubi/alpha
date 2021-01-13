var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var SelectifyBehavior = require('kiubi/behaviors/selectify.js');
var Countries = require('kiubi/core/models/countries');
var SelectView = require('kiubi/core/views/ui/select.js');
var Forms = require('kiubi/utils/forms.js');
var _ = require('underscore');

module.exports = Marionette.View.extend({
	template: require('../templates/modal.address.edit.html'),

	behaviors: [SelectifyBehavior],

	ui: {
		errors: "div[data-role='errors']"
	},

	regions: {
		countries: {
			el: "div[data-role='countries']",
			replaceElement: true
		}
	},

	model: null,
	type: null,
	countries: null,
	lockSave: false,

	fields: [
		'civility',
		'lastname',
		'firstname',
		'phone',
		'company',
		'address',
		'zipcode',
		'city',
		'country_id'
	],

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'type']);

		this.countries = new Countries();
		this.countries.fetch();
		this.lockSave = false;
	},

	templateContext: function() {
		return {
			type: this.type,
			address: (this.type === 'shipping') ? this.model.get('shipping_address') : this.model.get('billing_address'),
		};
	},

	onRender: function() {
		var view = new SelectView({
			collection: this.countries,
			selected: (this.type === 'shipping') ? this.model.get('shipping_address').country_id : this.model.get('billing_address').country_id,
			name: 'country_id',
			direction: 'up'
		});

		this.showChildView('countries', view);
	},

	onSave: function() {

		var data = Forms.extractFields(this.fields, this);
		var savedFields = {};
		// TODO Only if updated !
		if ((this.type === 'shipping')) {
			this.model.set('shipping_address', data);
			savedFields.shipping_address = data;
		} else {
			this.model.set('billing_address', data);
			savedFields.billing_address = data;
		}

		return this.model.save(savedFields, {
			patch: true,
			wait: true
		});
	},

	onActionModal: function() {

		if (this.lockSave) return;
		this.lockSave = true;

		Forms.clearErrors(this.getUI('errors'), this.el);

		var promise = this.onSave();
		if (!promise) {
			this.lockSave = false;
			return;
		}

		return promise.done(function() {
			this.triggerMethod('close:modal', true); // close with animation
		}.bind(this)).fail(function(error) {
			Forms.displayErrors(error, this.getUI('errors'), this.el);
		}.bind(this)).always(function() {
			this.lockSave = false;
		}.bind(this));
	}

});
