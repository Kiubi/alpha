var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var Forms = require('kiubi/utils/forms.js');


module.exports = Marionette.Behavior.extend({

	isSelected: false,
	lock: false,

	ui: {
		'selection': "input[name='selection']"
	},

	events: {
		"click [data-role='action']": 'action',
		'hidden.bs.dropdown .btn-group': 'onHiddenDropDown',
		"change @ui.selection": 'onSelect'
	},

	/**
	 * Bind action clicks on view events. 
	 * A data-role='action' date-action='something' will call the method 
	 * onActionSomething of the view. The method can return a Promise.
	 * 
	 * @param {Event} event
	 */
	action: function(event) {

		var btn = Backbone.$(event.currentTarget);

		var action = btn.data('action');
		if (!action) {
			return;
		}

		var callback = 'onAction' +
			action.charAt(0).toUpperCase() +
			action.slice(1);

		var confirm = btn.data('confirm');
		if (confirm) {
			if (!btn.parent().hasClass("confirm-" + confirm)) {
				event.preventDefault();
				btn.data('title', btn.text());
				btn.parent().addClass("confirm-" + confirm);
				btn.text('Êtes-vous sûr ?');
				return false;
			}
		}

		if (this.lock) {
			return;
		}
		this.lock = true;

		if (this[callback]) {
			this[callback]();
		}

		if (!this.view[callback]) {
			this.lock = false;
			return;
		}

		var promise = this.view[callback]();
		if (!promise) {
			this.lock = false;
			return;
		}

		var that = this;
		var old = btn.text();

		btn.addClass('disabled');
		btn.text('Chargement...');

		promise.always(function() {
			btn.removeClass('disabled');
			btn.text(old);
			that.lock = false;
		});
	},

	onActionShow: function() {
		this.view.isEditing = true;
		this.view.getUI('form').show();
		// Clear Fields : clear type text and inputs without type
		Backbone.$('input[type="text"]', this.el).val('');
		Backbone.$('input:not([type])', this.el).val('');
	},

	onActionEdit: function() {
		this.view.isEditing = true;
		if (this.view.getUI('list')) this.view.getUI('list').hide();
		this.view.getUI('form').show();
	},

	onActionCancel: function() {
		this.view.isEditing = false;
		this.view.getUI('form').hide();
		Forms.clearErrors(this.view.getUI('errors'), this.el);
		if (this.view.getUI('list')) this.view.getUI('list').show();
	},

	onActionSave: function() {
		this.view.triggerMethod('before:save');
		Forms.clearErrors(this.view.getUI('errors'), this.el);
	},

	/**
	 * Restore confirmation buttons on dropdown menu hidding
	 * 
	 * @param {Event} event
	 */
	onHiddenDropDown: function(event) {
		Backbone.$('.dropdown-menu a', event.currentTarget)
			.each(function(index, el) {
				el = Backbone.$(el);
				if (el.data('confirm') &&
					el.parent().hasClass('confirm-' + el.data('confirm'))) {

					el.text(el.data('title'));
					el.parent().removeClass('confirm-' + el.data('confirm'));

				}
			});
	},

	initialize: function(options) {
		if (this.view.getOption('model')) {
			this.view.listenTo(this.view.getOption('model'), 'sync', this.view.render);
		}
		this.view.isEditing = false;
	},

	onRender: function() {
		this.view.isEditing = false;
		this.getUI('selection').prop('checked', this.isSelected);
	},

	onSelect: function(event) {
		this.isSelected = event.currentTarget.checked;
	}

});
