var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

var DatePicker = require('bootstrap-datetimepicker-npm');
DatePicker(Backbone.$); // register DatePicker as a jquery module

module.exports = Marionette.Behavior.extend({

	ui: {
		inputsDate: "input[data-role='datepicker']",
		inputsDateTime: "input[data-role='datetimepicker']"
	},

	events: {
		'dp.change @ui.inputsDate': 'onChange',
		'dp.change @ui.inputsDateTime': 'onChange'
	},

	loaded: false,

	onRender: function() {

		var options = {
			//	format: "YYYY-MM-DD HH:mm:ss",
			showTodayButton: true,
			widgetPositioning: {
				horizontal: 'auto',
				vertical: 'bottom'
			},
			icons: {
				time: 'md-icon md-time',
				date: 'md-icon md-date',
				up: 'md-icon md-up',
				down: 'md-icon md-down',
				previous: 'md-icon md-preview',
				next: 'md-icon md-next',
				today: 'md-icon md-fixed',
				clear: 'md-icon md-delete',
				close: 'md-icon md-close'
			},
			tooltips: {
				today: 'Aujourd\'hui',
				clear: 'Recommencer',
				close: 'Fermer',
				selectMonth: 'Choisir un mois',
				prevMonth: 'Mois précédent',
				nextMonth: 'Mois suivant',
				selectYear: 'Choisir une année',
				prevYear: 'Année précédente',
				nextYear: 'Année suivante',
				selectDecade: 'Choisir une décennie',
				prevDecade: 'Décennie précédente',
				nextDecade: 'Décennie suivante',
				prevCentury: 'Siècle précédent',
				nextCentury: 'Siècle suivant',
				incrementHour: 'Heure suivante',
				pickHour: 'Choisir une heure',
				decrementHour: 'Heure précédente',
				incrementMinute: 'Minute suivante',
				pickMinute: 'Choisir une minute',
				decrementMinute: 'Minute précédente',
				incrementSecond: 'Seconde précédente',
				pickSecond: 'Choisir une seconde',
				decrementSecond: 'Seconde suivante',
				togglePeriod: 'Changer de période',
				selectTime: 'Choisir l\'heure'
			}
		};

		this.getUI('inputsDate').datetimepicker(_.extend({
			format: 'DD/MM/YYYY'
		}, options));
		this.getUI('inputsDateTime').datetimepicker(_.extend({
			format: 'DD/MM/YYYY HH:mm:ss'
		}, options));
		this.loaded = true;
	},

	onChange: function(event) {
		if (!this.loaded) return;
		this.view.triggerMethod('field:change');
	},

	/**
	 * Clean up
	 */
	onBeforeDestroy: function() {
		if (this.getUI('inputsDate').length) this.getUI('inputsDate').data("DateTimePicker").destroy();
		if (this.getUI('inputsDateTime').length) this.getUI('inputsDateTime').data("DateTimePicker").destroy();
	}

});
