var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var moment = require('moment');
var _string = require('underscore.string');

var SelectView = require('../../../views/ui/select');

var FormBehavior = require('../../../behaviors/simple_form');
var Forms = require('../../../utils/forms');

module.exports = Marionette.View.extend({
	template: require('../templates/file.html'),
	className: 'container',
	service: 'media',

	behaviors: [FormBehavior],

	regions: {
		folder: {
			el: "select[data-role='folder']",
			replaceElement: true
		}
	},

	fields: [
		'name',
		'description',
		'folder_id'
	],

	initialize: function(options) {
		this.mergeOptions(options, ['model', 'folders']);
	},

	templateContext: function() {
		var last = this.model.get('modification_date') > 0 ?
			this.model.get('modification_date') : this.model.get('creation_date');
		return {
			last_date: moment(new Date(last)).format('DD/MM/YYYY hh:mm:ss'),
			size: this.formatBytes(this.model.get('weight'), 2)
		};
	},

	onRender: function() {
		this.showChildView('folder', new SelectView({
			collection: this.folders,
			selected: this.model.get('folder_id'),
			name: 'folder_id'
		}));
	},

	formatBytes: function(bytes, decimals) {
		if (bytes == 0) return '0 octets';
		var k = 1000,
			dm = decimals || 2,
			sizes = ['octets', 'Ko', 'Mo', 'Go'],
			i = Math.floor(Math.log(bytes) / Math.log(k));
		return _string.numberFormat(bytes / Math.pow(k, i), dm, ',', ' ') + ' ' +
			sizes[i];
	},

	onSave: function() {
		return this.model.save(
			Forms.extractFields(this.fields, this), {
				patch: true
			}
		);
	},

	onDelete: function() {
		return this.model.destroy().done(function() {
			this.trigger('delete:file');
		}.bind(this));
	}

});
