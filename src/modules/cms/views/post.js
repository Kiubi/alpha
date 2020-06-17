var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var SelectView = require('kiubi/core/views/ui/select.js');
var FilePickerView = require('kiubi/modules/media/views/file.picker.js');
var FormBehavior = require('kiubi/behaviors/simple_form.js');
var WysiwygBehavior = require('kiubi/behaviors/tinymce.js');
var SelectifyBehavior = require('kiubi/behaviors/selectify.js');
var Forms = require('kiubi/utils/forms.js');
var SaveBehavior = require('kiubi/behaviors/save_detection.js');

var TypeSelectorView = Marionette.View.extend({
	template: require('../templates/post.type.html'),
	className: 'post-article w-100',
	tagName: 'article',

	behaviors: [WysiwygBehavior, SelectifyBehavior, SaveBehavior],

	ui: {
		'select': "select[name='type']"
	},

	events: {
		'change @ui.select': function() {
			this.selectType(this.getUI('select').val(), true); // with backup
		}
	},

	types: [],
	type: '',
	fields: [],
	backupFields: [
		'title',
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
		'text15'
	],

	initialize: function(options) {
		this.mergeOptions(options, ['type', 'typesSource', 'post', 'formEl']);

		this.typesSource.done(function(types) {
			this.types = types;
			this.selectType(this.type, false); // skip backup
		}.bind(this));
	},

	templateContext: function() {
		return {
			type: this.type,
			types: this.types,
			post: this.post,
			fields: this.fields
		};
	},

	selectType: function(type, backup) {
		this.type = type;

		// backup values
		if (backup) {
			this.triggerMethod('wysiwyg:save');
			this.post.set(
				Forms.extractFormFields(this.backupFields, this.formEl)
			);
		}

		var fields = [];
		var current = _.find(this.types, function(type) {
			return type.type == this.type;
		}.bind(this));
		if (current && current.fields) {
			fields = current.fields;
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

	onRender: function() {
		// Add file pickers
		_.each(this.fields, function(field) {
			if (field.type != 'image' && field.type != 'file') return;

			var regName = 'filepicker-' + field.field;

			this.showChildView(regName, new FilePickerView({
				fieldname: field.field,
				fieldLabel: field.name,
				type: field.type,
				value: this.post.get(field.field),
				comment: field.help ? field.help : null
			}));
		}.bind(this));
	}
});

module.exports = Marionette.View.extend({
	template: require('../templates/post.html'),
	className: 'container container-large',
	service: 'cms',

	behaviors: [FormBehavior],

	fields: [
		'is_visible'
	],

	postFields: [
		'title',
		'subtitle',
		'group',
		'type',
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
		'text15'
	],

	regions: {
		page: {
			el: 'div[data-role="page"]',
			replaceElement: true
		},
		type: {
			el: "article[data-role='type']",
			replaceElement: true
		},
		group: {
			el: 'div[data-role="group"]',
			replaceElement: true
		}
	},

	ui: {
		'form': 'form'
	},

	menus: null,
	container: null,

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'content', 'container', 'menus', 'typesSource']);
	},

	templateContext: function() {
		return {
			'is_visible': this.content.get('is_visible'),
			'container': this.container.get('page_id') ? 'page' : 'symbol'
		};
	},

	onRender: function() {
		var view = new TypeSelectorView({
			type: this.model.get('type'),
			post: this.model,
			typesSource: this.typesSource,
			formEl: this.getUI('form')
		});
		this.showChildView('type', view);

		// If container is a page
		if (this.menus) {
			this.showChildView('page', new SelectView({
				collection: this.menus,
				selected: this.container.get('page_id'),
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
		}

		this.showChildView('group', new SelectView({
			collectionPromise: this.model.getGroups(),
			emptyLabel: '-- Sélectionner un groupe --',
			name: 'group_list',
			direction: 'up'
		}));
	},

	onChildviewChange: function(value, field) {
		if (field == 'group_list') {
			this.selectGroup(value);
		}
	},

	onPageChange: function(page_id) {
		this.container.clear({
			silent: true
		});
		this.container.set('page_id', page_id);
		this.container.fetch();
	},

	selectGroup: function(value) {
		if (value !== '') {
			Backbone.$('input[name="group"]').val(value);
		}
	},

	onSave: function() {

		var contentData = Forms.extractFields(this.fields, this);
		if (this.container.get('page_id')) {
			if (this.container.get('page_id') != this.getChildView('page').selected) {
				contentData.container_id = this.getChildView('page').selected;
				this.onPageChange(contentData.container_id);
			}
		}

		return Backbone.$.when(
			this.content.save(contentData, {
				patch: true,
				wait: true
			}),
			this.model.save(Forms.extractFields(this.postFields, this), {
				patch: true,
				wait: true
			})
		);
	},

	onDelete: function() {
		return this.content.destroy({
			wait: true
		});
	}

});
