var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

module.exports = Marionette.View.extend({
	template: require('kiubi/templates/ui/modal.html'),
	tagName: 'div',
	className: 'overlay fade',

	ui: {
		'modal': '.modal',
		'closeBtn': 'button[data-role="close"]',
		'actionBtn': 'button[data-role="action"]'
	},

	events: {
		'click @ui.closeBtn': 'close',
		'click @ui.actionBtn': 'onAction',
		'click': function(event) {
			// only clics on background
			if (event.target != this.el && event.target.parentNode != this.el) return;
			this.close(true);
		}
	},

	regions: {
		'content': 'div.modal-body'
	},

	title: 'Mon titre',
	modalClass: '',
	action: null,
	keyCombos: [],

	templateContext: function() {
		return {
			'title': this.getOption('title'),
			'modalClass': this.getOption('modalClass'),
			'modalDialogClass': this.getOption('modalDialogClass'),
			'action': this.getOption('action')
		};
	},

	initialize: function(options) {
		this.mergeOptions(options);

		this.keyListener = Backbone.Radio.channel('app').request(
			'ctx:keyListener');
	},

	onRender: function() {
		this.keyCombos.push(
			this.keyListener.register_combo({
				"keys": "esc",
				"is_exclusive": true,
				"on_keydown": this.close,
				"this": this
			}));

		this.getUI('modal').css("display", "block");

		setTimeout(function() {
			this.$el.addClass('in');
		}.bind(this), 10); // Must wait DOM attachement
		setTimeout(function() {
			this.getUI('modal').addClass('in');
		}.bind(this), 150);
	},

	onDestroy: function() {
		this.keyListener.unregister_many(this.keyCombos);
	},

	/**
	 * Ferme la modal
	 * 
	 * @param {boolean} is_animated
	 */
	close: function(is_animated) {
		if (!is_animated) {
			this.destroy();
			return;
		}

		this.$el.removeClass('in');
		this.getUI('modal').removeClass('in');
		setTimeout(function() {
			this.destroy();
		}.bind(this), 300);
	},

	onAction: function() {
		var view = this.getChildView('content');
		if (!view) return;

		view.triggerMethod('action:modal', view);
	},

	onChildviewCloseModal: function(is_animated) {
		this.close(is_animated);
	}

});
