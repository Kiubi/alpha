var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var SelectView = require('kiubi/core/views/ui/select.js');
var FileView = require('kiubi/core/views/ui/input.file.js');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');

module.exports = Marionette.View.extend({
	template: require('../templates/import.posts.html'),
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
		type: {
			el: 'div[data-role="type"]',
			replaceElement: true
		},
		file: {
			el: "div[data-role='file']",
			replaceElement: true
		}
	},

	fields: [
		'is_enabled',
		'page_id',
		'mode',
		'type'
	],

	step: 0,
	report: null,
	menus: null,
	post: null,

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'post', 'menus']);
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

		this.showChildView('page', new SelectView({
			collection: this.menus,
			name: 'page_id'
		}));
		this.menus.fetch({
			data: {
				extra_fields: 'pages'
			}
		});
		this.menus.selectPayloadFilter = function(item, page) {
			if (page == null || page.page_type != 'page') {
				item.is_group = true;
			}
			return item;
		};

		// Type

		this.showChildView('type', new SelectView({
			collectionPromise: this.post.promisedTypes(),
			name: 'type'
		}));

		// FileInput

		this.showChildView('file', new FileView());

	},

	onSave: function() {

		var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
		navigationController.showOverlay();

		var data = Forms.extractFields(this.fields, this);
		data.file = this.getChildView('file').getFile();

		return this.model.import(data).done(function(report) {
			this.step = 1;
			this.report = report;
			this.render();
		}.bind(this)).always(function() {
			navigationController.hideModal();
		});
	},

	onCancel: function(event) {

		if (this.step == 0) {
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