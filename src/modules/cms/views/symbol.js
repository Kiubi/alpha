// var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var SelectifyBehavior = require('kiubi/behaviors/selectify.js');
var WysiwygBehavior = require('kiubi/behaviors/tinymce.js');
var SaveBehavior = require('kiubi/behaviors/save_detection.js');

var ContentsView = require('./contents.js');

var Forms = require('kiubi/utils/forms.js');

// var Session = Backbone.Radio.channel('app').request('ctx:session');

var FilePickerView = require('kiubi/modules/media/views/file.picker.js');

var ModelSelectorView = Marionette.View.extend({
	template: require('../templates/symbol/models.html'),
	tagName: 'div',

	behaviors: [WysiwygBehavior, SelectifyBehavior, SaveBehavior],

	ui: {
		'select': "select[name='model']"
	},

	events: {
		'change @ui.select': function() {
			this.selectModel(this.getUI('select').val(), true); // with backup
		}
	},

	models: [],
	currentModel: '',
	symbol: null,
	fields: [],
	backupFields: [
		/*'title', // TODO
		'subtitle',
		'text1',
		'text2',
		'text3',
		'text4',
		'text5',
		'text6',
		'text7',
		'text8',
		'text9',
		'text10',
		'text11',
		'text12',
		'text13',
		'text14',
		'text15'*/
	],

	initialize: function(options) {
		this.mergeOptions(options, ['currentModel', 'modelsSource', 'symbol', 'formEl']);

		this.modelsSource.done(function(models) {
			this.models = models;
			this.selectModel(this.currentModel, false); // skip backup
		}.bind(this));
	},

	templateContext: function() {
		return {
			currentModel: this.currentModel,
			models: this.models,
			symbol: this.symbol.get('params') || {},
			fields: this.fields
		};
	},

	selectModel: function(selected, backup) {


		// backup values
		if (backup) {
			this.triggerMethod('wysiwyg:save');
			// TODO
			/*this.symbol.set(
				Forms.extractFormFields(this.backupFields, this.formEl)
			);*/
		}

		var fields = [];
		var current = _.find(this.models, function(model) {
			return model.id == selected;
		}.bind(this));

		if (!current) {
			// Add fake model
			this.models.push({
				id: selected,
				name: selected,
				fields: [],
				zones: [],
				error: true
			});
		}
		this.currentModel = selected;

		if (current && current.fields) {
			fields = _.filter(current.fields, function(field) {
				return field.field != 'title';
			});
		}

		// Remove unwanted regions
		_.each(this.getRegions(), function(region, index) {
			if (index.substring(0, 11) == 'filepicker-') {
				this.removeRegion(index);
			}
		}.bind(this));

		// Add new regions
		_.each(fields, function(field) {
			if (field.type != 'image' && field.type != 'file') return;

			var regName = 'filepicker-' + field.field;
			if (this.getRegion(regName)) return;
			this.addRegion(regName, 'div[data-role="' + regName + '"]');
		}.bind(this));

		// Render new fields
		this.fields = fields;
		this.render();
	},

	getModel: function() {
		return _.find(this.models, {
			id: this.currentModel
		});
	},

	onRender: function() {
		// Add file pickers
		_.each(this.fields, function(field) {
			if (field.type != 'image' && field.type != 'file') return;

			var regName = 'filepicker-' + field.field;

			var value = this.symbol.get('params') ? this.symbol.get('params')[field.field] : null;

			this.showChildView(regName, new FilePickerView({
				fieldname: field.field,
				fieldLabel: field.name,
				type: field.type,
				value: value,
				comment: field.help ? field.help : null
			}));
		}.bind(this));
	}
});

module.exports = Marionette.View.extend({
	template: require('../templates/symbol.html'),
	className: 'container container-large',
	service: 'cms',

	behaviors: [FormBehavior],

	regions: {
		models: {
			el: "div[data-role='models']",
			replaceElement: true
		},
		list: {
			el: "article[data-role='list']",
			replaceElement: true
		}
	},

	ui: {
		'form': 'form'
	},

	fields: [
		'title',
	],

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'modelsSource', 'contents']);
	},

	onRender: function() {
		this.showChildView('models', new ModelSelectorView({
			currentModel: this.model.get('model'),
			symbol: this.model,
			modelsSource: this.modelsSource,
			formEl: this.getUI('form')
		}));

		var listView = new ContentsView({
			zoneList: this.model.get('zones'),
			collection: this.contents,

			title: 'Contenu du symbole',
			selection: [{
				title: 'Afficher',
				callback: this.showContents.bind(this)
			}, {
				title: 'Masquer',
				callback: this.hideContents.bind(this)
			}, {
				title: 'Supprimer',
				callback: this.deleteContents.bind(this),
				confirm: true
			}],
			scrollThreshold: 920, // TODO
			xtra: [{
				id: 'export',
				extraClassname: 'md-export',
				type: 'button',
				collectionPromise: new CollectionUtils.SelectCollection([{
					'value': 'export-page',
					'label': 'Exporter les contenus',
					'selected': false
				}])
			}]
		});

		this.showChildView('list', listView);
	},

	start: function() {
		this.contents.fetch({
			data: {
				limit: 40
			}
		});
	},

	showContents: function(ids) {
		return this.contents.bulkShow(ids);
	},

	hideContents: function(ids) {
		return this.contents.bulkHide(ids);
	},

	deleteContents: function(ids) {
		return this.contents.bulkDelete(ids);
	},

	onSave: function() {

		var model = this.getChildView('models').getModel();
		var reload = model.id !== this.model.get('model');

		if (!model) {
			return;
		}

		var data = {
			model: model.id
		};

		var fields = this.fields;
		_.reduce(this.getChildView('models').fields, function(acc, field) {
			acc.push(field.field);
			return acc;
		}, fields);
		data.params = Forms.extractFields(fields, this, {
			autoCast: false
		});

		return this.model.save(
			data, {
				patch: true,
				wait: true
			}
		).done(function() {
			if (reload) {
				this.getChildView('list').resetZones(model.zones);
			}
		}.bind(this));
	},

	onDelete: function() {
		return this.model.destroy({
			wait: true
		});
	},

	/* Filters */

	onChildviewFilterChange: function(filter) {
		this.triggerMethod(filter.model.get('id') + ':filter:change', filter);
	},

	onExportFilterChange: function(filter) {

		if (!filter.view) return;
		var view = filter.view;

		if (filter.value == 'export-page') {

			if (view.collection.length > 2) {
				return;
			}

			view.overrideExtraClassname('md-loading');
			view.render();

			var data = {
				container_id: this.model.get('symbol_id'),
				container_type: 'symbol'
			};

			this.contents.exportAll(data).done(function(data) {
				view.overrideExtraClassname('');
				view.collection.add([{
					value: null,
					label: '---'
				}, {
					value: data.url,
					label: 'Télécharger le fichier',
					extraClassname: 'md-export'
				}]);
				view.toggleDropdown(); // open
			}.bind(this)).fail(function(error) {
				var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
				navigationController.showErrorModal(error);

				view.overrideExtraClassname('');
				while (view.collection.length > 2) {
					view.collection.pop();
				}
			}.bind(this));

		} else {
			view.toggleDropdown(); // close
			view.overrideExtraClassname('');
			while (view.collection.length > 2) {
				view.collection.pop();
			}
		}
	},

});
