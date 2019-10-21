var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var Forms = require('kiubi/utils/forms.js');
var RowActionsBehavior = require('kiubi/behaviors/ui/row_actions.js');
var SelectifyBehavior = require('kiubi/behaviors/selectify.js');

var ListView = require('kiubi/core/views/ui/list.js');

var NewRowView = Marionette.View.extend({
	template: require('../templates/form.new.html'),
	className: 'post-content post-list',

	behaviors: [RowActionsBehavior],

	ui: {
		'form': 'form[data-role="new"]',
		'errors': 'div[data-role="errors"]',

		'type': 'select[name="type"]',
		'inputs': 'div[data-role="inputs"]',
		'values': 'div[data-role="values"]',
		'email': 'div[data-role="email"]'
	},

	events: {
		'change @ui.type': 'onChangeType'
	},

	onRender: function() {
		this.onChangeType();
	},

	templateContext: function() {

		var m = new this.collection.model();

		return {
			typeList: m.getTypes()
		};
	},

	onChangeType: function(event) {
		var type = this.getUI('type').val();
		if (type == 'email') {
			this.getUI('email').show();
		} else {
			this.getUI('email').hide();
		}
		if (type == 'checkbox' || type == 'select' || type == 'radio') {
			this.getUI('values').show();
		} else {
			this.getUI('values').hide();
		}
		if (type == 'fieldset') {
			this.getUI('inputs').hide();
		} else {
			this.getUI('inputs').show();
		}
	},

	onActionCancel: function() {
		this.getUI('form').hide();
		Forms.clearErrors(this.getUI('errors'), this.el);
	},

	onActionSave: function() {
		Forms.clearErrors(this.getUI('errors'), this.el);

		var m = new this.collection.model({
			form_id: this.collection.form_id
		});
		return m.save(
				Forms.extractFields(['is_enabled', 'is_required', 'name', 'help', 'type', 'use_for_exp', 'is_in_subject',
					'values'
				], this))
			.done(function() {
				this.getUI('form').hide();
				this.collection.add(m);
			}.bind(this))
			.fail(function(error) {
				Forms.displayErrors(error, this.getUI('errors'), this.el);
			}.bind(this));
	},

	onActionShow: function() {
		this.getUI('form').show();
	}

});

var RowView = Marionette.View.extend({
	template: require('../templates/form.row.html'),
	className: 'list-item',

	behaviors: [RowActionsBehavior, SelectifyBehavior],

	ui: {
		'list': 'div[data-role="list"]',
		'form': 'form[data-role="edit"]',
		'errors': 'div[data-role="errors"]',

		'type': 'select[name="type"]',
		'inputs': 'div[data-role="inputs"]',
		'values': 'div[data-role="values"]',
		'email': 'div[data-role="email"]'
	},

	events: {
		'change @ui.type': 'onChangeType'
	},

	onRender: function() {
		this.onChangeType();
	},

	templateContext: function() {

		var type = _.findWhere(this.model.getTypes(), {
			type: this.model.get('type')
		});

		return {
			typeList: this.model.getTypes(),
			typeLabel: type ? type.label : ''
		};
	},

	onChangeType: function(event) {
		var type = this.getUI('type').val();
		if (type == 'email') {
			this.getUI('email').show();
		} else {
			this.getUI('email').hide();
		}
		if (type == 'checkbox' || type == 'select' || type == 'radio') {
			this.getUI('values').show();
		} else {
			this.getUI('values').hide();
		}
		if (type == 'fieldset') {
			this.getUI('inputs').hide();
		} else {
			this.getUI('inputs').show();
		}
	},

	onActionDelete: function() {
		return this.model.destroy();
	},

	onActionEdit: function() {
		this.getUI('list').hide();
		this.getUI('form').show();

	},
	onActionCancel: function() {
		this.getUI('form').hide();
		this.getUI('list').show();
	},

	onActionSave: function() {
		Forms.clearErrors(this.getUI('errors'), this.el);

		return this.model.save(
			Forms.extractFields(['is_enabled', 'is_required', 'name', 'help', 'type', 'use_for_exp', 'is_in_subject',
				'values'
			], this), {
				patch: true,
				wait: true
			}
		).fail(function(error) {
			Forms.displayErrors(error, this.getUI('errors'), this.el);
		}.bind(this));
	}

});

module.exports = Marionette.View.extend({
	template: require('../templates/form.html'),
	className: 'container',
	service: 'forms',

	behaviors: [FormBehavior],

	fields: [
		'name',
		'is_enabled'
	],

	regions: {
		list: {
			el: "article[data-role='list']",
			replaceElement: true
		}
	},

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'collection']);
	},

	onRender: function() {
		this.showChildView('list', new ListView({
			collection: this.collection,
			rowView: RowView,
			newRowView: NewRowView,

			title: 'Liste des champs',
			scrollThreshold: 920 // TODO

		}));
	},

	onSave: function() {
		return this.model.save(
			Forms.extractFields(this.fields, this, 'form[data-role="part"]'), {
				patch: true,
				wait: true
			}
		);
	},

	onDelete: function() {
		return this.model.destroy({
			wait: true
		});
	},

	onChildviewSortChange: function(data) {
		this.collection.reOrder(data.list);
	}

});
