var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var CodeMirror = require('codemirror');
var _ = require('underscore');

module.exports = Marionette.Behavior.extend({

	options: {
		selector: 'textarea[data-role="codemirror"]'
	},

	editorList: null,
	errorLines: null,

	initialize: function(options) {
		this.mergeOptions(options);
		this.editorList = [];
		this.errorLines = [];
	},

	onDomRefresh: function() {

		// DOM nodes were thrown away, no other choice that destroying previous editors
		this.clearAll();

		Backbone.$(this.options.selector, this.view.$el).each(function(index, target) {
			this.editorList.push(CodeMirror.fromTextArea(target, {
				lineNumbers: true
			}));
		}.bind(this));
	},

	clearAll: function() {
		_.each(this.editorList, function(editor) {
			editor.toTextArea();
		});
		this.editorList = [];
	},

	onBeforeDestroy: function() {
		this.clearAll();
	},

	onBeforeSave: function() {
		_.each(this.editorList, function(editor) {
			editor.save();
		});
	},

	onCodemirrorHighligth: function(lines) {

		lines = lines || [];

		_.each(this.errorLines, function(line) {
			this.editorList[0].removeLineClass(line, "text");
		}.bind(this));

		this.errorLines = lines;

		_.each(lines, function(line) {
			this.editorList[0].addLineClass(line, "text", 'line-error');
		}.bind(this));

	}

});
