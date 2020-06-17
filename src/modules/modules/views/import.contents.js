var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var CollectionUtils = require('kiubi/utils/collections.js');

var SelectView = require('kiubi/core/views/ui/select.js');
var FileView = require('kiubi/core/views/ui/input.file.js');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');

module.exports = Marionette.View.extend({
	template: require('../templates/import.contents.html'),
	className: 'container',
	service: 'modules',

	behaviors: [FormBehavior],

	events: {
		"change input[type=file]": "dropFile"
	},

	regions: {
		page: {
			el: 'div[data-role="page"]',
			replaceElement: true
		},
		file: {
			el: "div[data-role='file']",
			replaceElement: true
		}
	},

	fields: [
		'is_visible',
		'container_id',
		'mode'
	],

	step: 0,
	report: null,
	menus: null,

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'menus', 'symbols']);
	},

	templateContext: function() {
		return {
			report: this.report,
			step: this.step
		};
	},

	onRender: function() {

		if (this.step > 0) return;

		// Page
		this.menus.selectPayloadFilter = function(item, page) {
			if (page === null || page.page_type != 'page') {
				item.is_group = true;
			}
			item.value = 'p-' + item.value;
			return item;
		};
		var promise = Backbone.$.when(this.menus.fetch({
			data: {
				extra_fields: 'pages'
			}
		}), this.symbols.fetch()).then(function() {
			// Adding Pages
			var payload = new CollectionUtils.SelectCollection(this.menus.selectPayload());

			// Adding symbols
			payload.add({
				label: 'Symboles',
				value: 's',
				is_group: true
			});
			this.symbols.reduce(function(acc, symbol) {
				acc.add({
					label: symbol.get('params').title,
					value: 's-' + symbol.get('symbol_id'),
					indent: 1
				});
				return acc;
			}, payload);

			return payload;
		}.bind(this));

		this.showChildView('page', new SelectView({
			collectionPromise: promise,
			name: 'container_id'
		}));

		this.showChildView('file', new FileView());

	},

	onSave: function() {

		var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');

		if (this.step === 0) {

			var data = Forms.extractFields(this.fields, this, {
				autoCast: false
			});
			data.container_type = (data.container_id.substr(0, 1) === 'p') ? 'page' : 'symbol';
			data.container_id = data.container_id.substr(2);
			data.file = this.getChildView('file').getFile();
			navigationController.showOverlay();

			return this.model.analyse(data).done(function(report) {
				this.step = 1;
				this.report = report;
				this.render();
			}.bind(this)).always(function() {
				navigationController.hideModal();
			});
		} else {
			navigationController.showOverlay();

			return this.model.import(this.report.token).done(function(report) {
				this.step = 2;
				this.report = report;
				this.render();
			}.bind(this)).always(function() {
				navigationController.hideModal();
			});
		}
	},

	onCancel: function(event) {

		if (this.step === 0) {
			// navigation /modules
			var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
			navigationController.navigate('/modules');
		} else {
			this.step = 0;
			this.report = null;
			this.render();
		}

	}

});
