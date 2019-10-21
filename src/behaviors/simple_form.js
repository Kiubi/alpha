var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var Forms = require('../utils/forms');

var LoaderTpl = require('kiubi/core/templates/ui/loader.html');

var ControllerChannel = Backbone.Radio.channel('controller');

var SelectifyBehavior = require('kiubi/behaviors/selectify.js');
var ScrollFixBehavior = require('kiubi/behaviors/scroll_fix.js');

module.exports = Marionette.Behavior.extend({

	ui: {
		save: "button[data-role='save']",
		cancel: "button[data-role='cancel']",
		delete: "button[data-role='delete']",
		errors: "div[data-role='errors']",
		form: 'form',
		radioInputs: 'input[type="radio"]'
	},

	events: {
		'click @ui.save': 'onSave',
		'click @ui.cancel': 'onCancel',
		'click @ui.delete': 'onDelete',
		'input @ui.form': 'onFieldChange',
		'change @ui.radioInputs': function() {
			this.getUI('form').trigger('input');
		} // Fix input event on radio
	},

	behaviors: [SelectifyBehavior, ScrollFixBehavior],

	initialize: function(options) {
		this.mergeOptions(options);

		this.lockSave = false;
		this.lockDelete = false;

		this.listenTo(ControllerChannel, 'meta:s:shortcut', this.onSave.bind(this));
	},

	onFieldChange: function() {
		ControllerChannel.trigger('modified:content');
	},

	/**
	 * Responde to triggerMethod('simpleForm:save') from the view to call 
	 * the form submission manualy. Adding a promise in the container will
	 * reflow to the emetter
	 * 
	 * @param {Object} container
	 * @returns {Promise}
	 */
	onSimpleFormSave: function(container) {
		if (container) {
			container.promise = this.onSave();
		} else {
			this.onSave();
		}
	},

	onSave: function(event) {

		this.view.trigger('freeze:scroll');

		if (!this.view.onSave) {
			this.view.trigger('unfreeze:scroll');
			return;
		}

		if (event) event.preventDefault();

		if (this.lockSave) return;
		this.lockSave = true;

		Forms.clearErrors(this.getUI('errors'), this.view.el);

		this.view.triggerMethod('before:save');
		// TRIGGER method on all child Views
		_.each(this.view.getRegions(), function(region) {
			if (region.currentView) {
				region.currentView.triggerMethod('before:save');
			}
		});

		var promise = this.view.onSave();

		if (!promise) {
			ControllerChannel.trigger('saved:content');
			this.lockSave = false;
			this.view.trigger('unfreeze:scroll');
			return;
		}

		var btn = this.getUI('save');
		btn.addClass('btn-load');
		var old = btn.text();
		btn.html(LoaderTpl());

		return promise.done(function() {
			ControllerChannel.trigger('saved:content');
		}).fail(function(error) {

			Backbone.$('#content').animate({
				scrollTop: 0
			}, 'slow');

			Forms.displayErrors(error, this.getUI('errors'), this.view.el);

		}.bind(this)).always(function() {
			this.lockSave = false;
			btn.removeClass('btn-load');
			btn.html('C\'est fait <span class="md-icon md-done"></span>');
			setTimeout(function() {
				if (btn) btn.text(old);
			}, 2000);
			this.view.trigger('unfreeze:scroll');
		}.bind(this));
	},

	onCancel: function(event) {

		if (!this.view.onCancel) {
			Backbone.history.history.back();
			return;
		}

		if (event) event.preventDefault();

		this.view.triggerMethod('before:cancel');
		// TRIGGER method on all child Views
		_.each(this.view.getRegions(), function(region) {
			if (region.currentView) {
				region.currentView.triggerMethod('before:cancel');
			}
		});

		var promise = this.view.onCancel();

		if (!promise) {
			return;
		}

		var btn = this.getUI('cancel');
		btn.addClass('btn-load');
		var old = btn.text();
		btn.html(LoaderTpl());

		return promise.fail(function(error) {

			Backbone.$('#content').animate({
				scrollTop: 0
			}, 'slow');

			Forms.displayErrors(error, this.getUI('errors'), this.view.el);

		}.bind(this)).always(function() {
			Backbone.history.history.back();
		}.bind(this));
	},

	onDelete: function(event) {

		if (!this.view.onDelete) {
			return;
		}

		if (event) event.preventDefault();

		var btn = this.getUI('delete');
		if (!btn.hasClass('confirm-warning')) {
			btn.addClass('confirm-warning');
			btn.data('label', btn.text());
			btn.text('Confirmer');
			return;
		}

		if (this.lockDelete) return;
		this.lockDelete = true;

		var promise = this.view.onDelete();

		if (!promise) {
			this.lockDelete = false;
			btn.removeClass('confirm-warning');
			btn.text(btn.data('label'));
			return;
		}

		btn.removeClass('confirm-warning');
		btn.addClass('btn-load');
		btn.html(LoaderTpl());

		promise.always(function() {
			this.lockDelete = false;
			btn.removeClass('btn-load');
			btn.text(btn.data('label'));
		}.bind(this));
	},

	/**
	 * PROXY child view events for Meta+S keycombo and change detection
	 */

	onChildviewFieldChange: function() {
		this.view.triggerMethod('field:change');
	},

	onChildviewSave: function() {
		this.view.triggerMethod('save');
	}

});
