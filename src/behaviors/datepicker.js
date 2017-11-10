var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var DatePicker = require('bootstrap-datetimepicker-npm');
DatePicker(Backbone.$); // register DatePicker as a jquery module

module.exports = Marionette.Behavior.extend({

	ui: {
		inputs: "input[data-role='datetimepicker']"
	},

	onRender: function() {
		this.getUI('inputs').datetimepicker({
			format: "YYYY-MM-DD HH:mm:ss",
			showTodayButton: true,
			widgetPositioning: {
				horizontal: 'auto',
				vertical: 'bottom',
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
				today: 'Ajourd\'hui',
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
		});
	},

	/**
	 * Clean up
	 */
	onBeforeDestroy: function() {
		this.getUI('inputs').data("DateTimePicker").destroy();
	}

});
