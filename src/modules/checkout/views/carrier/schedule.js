var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

var _ = require('underscore');
var moment = require('moment');

var SelectifyBehavior = require('kiubi/behaviors/selectify.js');

var ScheduleRowView = Marionette.View.extend({

	className: 'row',
	template: require('../../templates/carrier/schedule.row.html'),

	behaviors: [SelectifyBehavior],

	templateContext: function() {

		var name = moment().day(this.model.get('day_of_week')).format('dddd');
		name = name.charAt(0).toUpperCase() + name.slice(1); // ucfirst

		var frames = this.model.get('time_frames') && _.isArray(this.model.get('time_frames')) ? this.model.get(
			'time_frames').join(',') : '';

		return {
			name: name,
			frames: frames
		};
	}

});
var SpotlightsCollectionView = Marionette.CollectionView.extend({
	className: '',
	childView: ScheduleRowView
});

module.exports = Marionette.View.extend({
	template: require('../../templates/carrier/schedule.html'),

	regions: {
		'days': {
			el: 'div[data-role="days"]',
			replaceElement: true
		}
	},

	ui: {
		'require_scheduling': 'select[name="require_scheduling"]'
	},

	events: {
		'change @ui.require_scheduling': function() {
			this.model.set('require_scheduling', this.getUI('require_scheduling').val());
			this.updateDays();
			this.getChildView('days').render();
		}
	},

	initialize: function(options) {
		this.mergeOptions(options, ['model']);

		this.days = new Backbone.Collection();
		this.days.model = Backbone.Model.extend({
			idAttribute: 'day_of_week',
			defaults: {
				day_of_week: 0,
				is_open: false,
				require_scheduling: 'datetime',
				time_frames: []
			}
		});
	},

	templateContext: function() {
		return {
			'closed_days': this.model.get('closed_days') && _.isArray(this.model.get('closed_days')) ? this.model.get(
				'closed_days').join(',') : '',
		};
	},

	onRender: function() {
		this.updateDays();
		this.showChildView('days', new SpotlightsCollectionView({
			collection: this.days
		}));
	},

	updateDays: function() {
		this.days.reset();

		if (this.model.get('require_scheduling') == 'no') {
			return;
		}

		for (var i = 0; i < 7; i++) {
			this.days.add({
				day_of_week: i,
				require_scheduling: this.model.get('require_scheduling')
			});
		}

		if (!this.model.get('open_days') || !_.isArray(this.model.get('open_days'))) {
			return;
		}

		_.each(this.model.get('open_days'), function(day) {

			var d = this.days.get(day.day_of_week);
			d.set('is_open', day.is_open);
			d.set('time_frames', day.time_frames);

		}.bind(this));

	}

});
