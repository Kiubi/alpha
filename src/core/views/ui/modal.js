var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

module.exports = Marionette.View.extend({
	template: require('kiubi/core/templates/ui/modal.html'),
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
		'mousedown': function(event) {
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

	templateContext: function() {
		return {
			'title': this.getOption('title'),
			'modalClass': this.getOption('modalClass'),
			'modalDialogClass': this.getOption('modalDialogClass'),
			'modalBodyClass': this.getOption('modalBodyClass'),
			'action': this.getOption('action'),
			'tabs': this.getOption('tabs')
		};
	},

	initialize: function(options) {
		this.mergeOptions(options);

		this.keyListener = Backbone.Radio.channel('app').request('ctx:keyListener');
	},

	onAttach: function() {
		this.keyListener.register_combo({
			"keys": "esc",
			"is_exclusive": true,
			"on_keydown": this.close,
			"this": this
		});
	},

	onRender: function() {
		this.getUI('modal').css("display", "block");

		setTimeout(function() {
			this.$el.addClass('show');
		}.bind(this), 10); // Must wait DOM attachement
		setTimeout(function() {
			this.getUI('modal').addClass('show');
		}.bind(this), 150);
	},

	onDestroy: function() {
		this.keyListener.unregister_combo("esc");
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

		this.$el.removeClass('show');
		this.getUI('modal').removeClass('show');
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
