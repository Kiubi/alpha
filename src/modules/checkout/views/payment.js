var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Session = Backbone.Radio.channel('app').request('ctx:session');
var WysiwygBehavior = require('kiubi/behaviors/tinymce.js');
var SelectifyBehavior = require('kiubi/behaviors/selectify.js');

var Forms = require('kiubi/utils/forms.js');

var FileView = require('kiubi/core/views/ui/input.file.js');

var systempayView = Marionette.View.extend({
	template: require('../templates/payment/systempay.html'),

	behaviors: [WysiwygBehavior, SelectifyBehavior],

	fields: [
		'intitule_long',
		'hash',
		'mode',
		'tpe',
		'key',
		'banque',
		'message'
	],

	templateContext: function() {
		return {
			'domain': Session.site.get('domain'),
			'config': this.model.get('config')
		};
	},

	extractFields: function() {
		return Forms.extractFields(this.fields, this);
	}

});
var chequeView = Marionette.View.extend({
	template: require('../templates/payment/cheque.html'),

	behaviors: [WysiwygBehavior],

	fields: [
		'intitule_long',
		'ordre',
		'message'
	],

	templateContext: function() {
		return {
			'config': this.model.get('config')
		};
	},

	extractFields: function() {
		return Forms.extractFields(this.fields, this);
	}

});
var atosView = Marionette.View.extend({
	template: require('../templates/payment/atos.html'),

	behaviors: [WysiwygBehavior, SelectifyBehavior],

	regions: {
		file: {
			el: "div[data-role='file']",
			replaceElement: true
		}
	},

	fields: [
		'intitule_long',
		'auto_return',
		'version',
		'banque',
		//'certif',
		'message'
	],

	templateContext: function() {
		return {
			'config': this.model.get('config')
		};
	},

	onRender: function() {
		this.showChildView('file', new FileView({
			name: 'certif'
		}));
	},

	/**
	 * 
	 * @returns {Promise}
	 */
	extractPromisedFields: function() {

		var promise = Backbone.$.Deferred();
		var data = Forms.extractFields(this.fields, this);
		var file = this.getChildView('file').getFile();

		if (file) {
			this.getChildView('file').getFileContent().done(function(content) {
				data.certif = file.name;
				data.certif_payload = btoa(content);
				promise.resolve(data);
			}).fail(function() {
				promise.reject(); // TODO
			});
		} else {
			promise.resolve(data);
		}

		return promise;
	}

});
var payboxView = Marionette.View.extend({
	template: require('../templates/payment/paybox.html'),

	behaviors: [WysiwygBehavior, SelectifyBehavior],

	ui: {
		'hmac': '[date-role="hmac"]',
		'mode': 'select[name="mode"]'
	},

	events: {
		'change @ui.mode': function(event) {
			if (this.getUI('mode').val() == 'hmac') {
				this.getUI('hmac').show();
			} else {
				this.getUI('hmac').hide();
			}
		}
	},

	fields: [
		'intitule_long',
		'banque',
		'mode',
		'hmac',
		'site',
		'rang',
		'id',
		'message'
	],

	templateContext: function() {
		return {
			domain: Session.site.get('domain'),
			'config': this.model.get('config')
		};
	},

	extractFields: function() {
		return Forms.extractFields(this.fields, this);
	}

});
var paypalView = Marionette.View.extend({
	template: require('../templates/payment/paypal.html'),

	behaviors: [WysiwygBehavior],

	fields: [
		'intitule_long',
		'email',
		'message'
	],

	templateContext: function() {
		return {
			domain: Session.site.get('domain'),
			'config': this.model.get('config')
		};
	},

	extractFields: function() {
		return Forms.extractFields(this.fields, this);
	}

});
var cmcicView = Marionette.View.extend({
	template: require('../templates/payment/cm_cic.html'),

	behaviors: [WysiwygBehavior, SelectifyBehavior],

	fields: [
		'intitule_long',
		'banque',
		'key',
		'mode',
		'societe',
		'tpe',
		'message'
	],

	templateContext: function() {
		return {
			domain: Session.site.get('domain'),
			'config': this.model.get('config')
		};
	},

	extractFields: function() {
		return Forms.extractFields(this.fields, this);
	}

});
var virementView = Marionette.View.extend({
	template: require('../templates/payment/virement.html'),

	behaviors: [WysiwygBehavior],

	fields: [
		'intitule_long',
		'BIC',
		'IBAN',
		'domicile',
		'rib_banque',
		'rib_cle',
		'rib_compte',
		'rib_guichet',
		'message'
	],

	templateContext: function() {
		return {
			'config': this.model.get('config')
		};
	},

	extractFields: function() {
		return Forms.extractFields(this.fields, this);
	}

});

var paylineView = Marionette.View.extend({
	template: require('../templates/payment/payline.html'),

	behaviors: [WysiwygBehavior, SelectifyBehavior],

	fields: [
		'intitule_long',
		'merchant_id',
		'access_key',
		'contract_number',
		'mode',
		'message'
	],

	templateContext: function() {
		return {
			'domain': Session.site.get('domain'),
			'config': this.model.get('config')
		};
	},

	extractFields: function() {
		return Forms.extractFields(this.fields, this);
	}

});

var payplugView = Marionette.View.extend({
	template: require('../templates/payment/payplug.html'),

	behaviors: [WysiwygBehavior, SelectifyBehavior],

	fields: [
		'intitule_long',
		'secret',
		'message'
	],

	templateContext: function() {
		return {
			'domain': Session.site.get('domain'),
			'config': this.model.get('config')
		};
	},

	extractFields: function() {
		return Forms.extractFields(this.fields, this);
	}

});

var manuelView = Marionette.View.extend({
	template: require('../templates/payment/manuel.html'),

	behaviors: [WysiwygBehavior],

	fields: [
		'intitule_long',
		'instructions',
		'ordre',
		'message'
	],

	templateContext: function() {
		return {
			'config': this.model.get('config')
		};
	},

	extractFields: function() {
		return Forms.extractFields(this.fields, this);
	}

});

module.exports = Marionette.View.extend({
	template: require('../templates/payment.html'),
	className: 'container',
	service: 'checkout',

	behaviors: [FormBehavior],

	regions: {
		'form': {
			el: 'div[data-role="form"]',
			replaceElement: true
		}
	},

	fields: [
		'is_enabled'
	],

	subView: null,

	initialize: function(options) {
		this.mergeOptions(options, ['model']);

		var viewClass;
		switch (this.model.get('type')) {
			case 'virement':
				viewClass = virementView;
				break;
			case 'cm_cic':
				viewClass = cmcicView;
				break;
			case 'paypal':
				viewClass = paypalView;
				break;
			case 'paybox':
				viewClass = payboxView;
				break;
			case 'atos':
				viewClass = atosView;
				break;
			case 'cheque':
				viewClass = chequeView;
				break;
			case 'systempay':
				viewClass = systempayView;
				break;
			case 'payline':
				viewClass = paylineView;
				break;
			case 'payplug':
				viewClass = payplugView;
				break;
			case 'manuel':
				viewClass = manuelView;
				break;
		}

		this.subView = new viewClass({
			model: this.model
		});
		this.listenTo(this.model, 'sync', function() {
			this.subView.render();
		});
	},

	onRender: function() {
		if (!this.getChildView('form')) {
			this.showChildView('form', this.subView);
		}
	},

	onSave: function() {

		var data = Forms.extractFields(this.fields, this);
		data.config = {};

		var promise = Backbone.$.Deferred();
		if (this.getChildView('form').extractPromisedFields) {
			this.getChildView('form').extractPromisedFields().done(function(extra) {
				_.extend(data.config, extra);
				promise.resolve(data);
			}).fail(function() {
				promise.reject();
			});
		} else {
			_.extend(data.config, this.getChildView('form').extractFields());
			promise.resolve(data);
		}

		return promise.then(function(data) {
			return this.model.save(data, {
				patch: true,
				wait: true
			});
		}.bind(this));
	}

});
