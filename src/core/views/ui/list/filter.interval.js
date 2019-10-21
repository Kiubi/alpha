var Marionette = require('backbone.marionette');
var _ = require('underscore');
var format = require('kiubi/utils/format');

module.exports = Marionette.View.extend({
	template: require('kiubi/core/templates/ui/list/filter.interval.html'),

	className: 'btn-group',

	ui: {
		'term': 'input',
		'feedback': '[data-role="feedback"]'
	},

	currentTerm: '',

	events: {
		'keyup @ui.term': _.debounce(function(e) {
			this.onInputChange(e);
		}, 300),
		'click @ui.feedback': function() {
			if (!this.model.get('canDelete')) return;

			this.proxy.triggerMethod('filter:change', {
				model: this.model,
				value: null,
				view: this
			});
			this.model.collection.remove(this.model);
		},
		'dp.change @ui.term': 'onInputChange'
	},

	min: '',
	max: '',

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'proxy']);
		this.min = '';
		this.max = '';

		if (this.model.get('value')) {
			this.min = format.formatDate(this.model.get('value')[0]);
			this.max = format.formatDate(this.model.get('value')[1]);
			this.model.set('value', [this.min, this.max]);
		}
	},

	templateContext: function() {

		var defaultClassname = this.model.get('canDelete') ? 'md-cancel' : 'md-search';

		return {
			extraClassname: this.model.get('extraClassname') ? this.model.get('extraClassname') : defaultClassname,
			prependText: this.model.get('prependText') ? this.model.get('prependText') : ['', '']
		};
	},

	onRender: function() {

		if (this.model.get('enableDatepicker')) { // date or datetime

			var options = {
				format: this.model.get('enableDatepicker') == 'date' ? 'DD/MM/YYYY' : 'DD/MM/YYYY HH:mm:ss',
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
					previous: 'md-icon md-previous',
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

			this.getUI('term').datetimepicker(options);
		}
	},

	/* Events */

	onInputChange: function(event) {

		if (event.currentTarget.name == 'min') {
			if (this.min == event.currentTarget.value) return;
			this.min = event.currentTarget.value;
		} else if (event.currentTarget.name == 'max') {
			if (this.max == event.currentTarget.value) return;
			this.max = event.currentTarget.value;
		}

		this.proxy.triggerMethod('filter:change', {
			model: this.model,
			value: [this.min, this.max],
			view: this
		});
	},

	/**
	 * Clean up
	 */
	onBeforeDestroy: function() {
		if (this.model.get('enableDatepicker')) this.getUI('term').data("DateTimePicker").destroy();
	}

});
