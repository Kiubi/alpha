var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var AutocompleteView = require('kiubi/views/ui/select.search.js');
var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');

module.exports = Marionette.View.extend({
	template: require('../templates/import.products.html'),
	className: 'container',
	service: 'modules',

	behaviors: [FormBehavior],

	regions: {
		'categories': {
			el: "div[data-role='categories']",
			replaceElement: true
		}
	},

	events: {
		"change input[type=file]": "dropFile"
	},

	fields: [
		'is_enabled'
	],

	step: 0,
	tempfileUpload: null,
	report: null,

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'categories']);
	},

	templateContext: function() {
		return {
			report: this.report,
			step: this.step
		};
	},

	onRender: function() {

		if (this.step == 0) {
			this.showChildView('categories', new AutocompleteView({
				searchPlaceholder: 'Rechercher une catégorie',
				current: {
					label: '-- Choisissez une catégorie --',
					value: null
				}
			}));
		}

	},

	// Categories

	onChildviewInput: function(term, view) {
		this.categories.fetch({
			data: {
				limit: 5,
				term: term
			}
		}).done(function() {
			var results = _.map(this.categories.toJSON(), function(categ) {
				return {
					label: categ.name,
					value: categ.category_id
				};
			});

			view.showResults(results);
		}.bind(this));
	},

	dropFile: function(event) {
		if (Backbone.$(event.target).is('input[type=file]')) {
			// stop la propagation de l'event
			event.stopPropagation();
		}

		event.preventDefault();

		var dataTransfer = event.originalEvent.dataTransfer;
		var files = (dataTransfer ? dataTransfer.files : event.originalEvent.target.files);

		_.each(files, function(File) {
			this.tempfileUpload = File;
		}.bind(this));
	},

	onSave: function() {
		var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');

		if (this.step == 0) {

			var data = Forms.extractFields(this.fields, this);

			data.category_id = this.getChildView('categories').getCurrent().value;
			data.file = this.tempfileUpload;
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

		if (this.step == 0) {
			// navigation /modules
			var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
			navigationController.navigate('/modules');
		} else {
			this.step = 0;
			this.report = null;
			this.tempfileUpload = null;
			this.render();
		}

	}

});
