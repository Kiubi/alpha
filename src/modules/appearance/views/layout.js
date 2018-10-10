var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');
require('kiubi/utils/proxy.jquery-ui.js');

var ControllerChannel = Backbone.Radio.channel('controller');

var FormBehavior = require('kiubi/behaviors/simple_form.js');
var SelectifyBehavior = require('kiubi/behaviors/selectify.js');
var Forms = require('kiubi/utils/forms.js');
var Layout = require('../models/layout');

var tplZone = require('../templates/layout.zone.html');
var tplBloc = require('../templates/layout.bloc.html');
var tplWidget = require('../templates/layout.widget.html');

function buildBloc(bloc) {
	var cells = [];
	_.each(bloc.cells, function(cell) {
		var content = '';
		_.each(cell.widgets, function(widget) {
			content += buildWidget(widget);
		});
		cells.push({
			cell_id: cell.cell_id,
			content: content
		});
	});

	var sizes;
	switch (bloc.type) {
		case '1':
			sizes = [12];
			break;
		case '2':
			sizes = [6, 6];
			break;
		case '2d':
			sizes = [7, 5];
			break;
		case '2g':
			sizes = [5, 7];
			break;
		case '3':
			sizes = [4, 4, 4];
			break;
	}

	return tplBloc({
		bloc: bloc,
		cells: cells,
		sizes: sizes
	});
}

function buildWidget(widget) {

	var color = 'widget-tools'; // default
	switch (widget.main_category || null) {
		case 1: // Cms
			color = 'widget-cms';
			break;
		case 2: // Blog
			color = 'widget-blog';
			break;
		case 3: // Com
			color = 'widget-modules';
			break;
		case 19: // Search
			color = 'widget-search';
			break;
		case 25: // Account
			color = 'widget-customers';
			break;
		case 31: // Catalog
			color = 'widget-catalog';
			break;
		case 22: // Tools
			color = 'widget-tools';
			break;
	}

	return tplWidget({
		widget_id: widget.widget_id,
		name: widget.name,
		type: widget.type,
		description: widget.desc,
		color: color
	});
}

function makePosition($widget, $cell) {

	var index = $cell.children().index($widget);

	if (index == 0) {
		// At top
		return {
			position: 'before',
			sibling_id: null
		};
	} else if (index == $cell.children().length - 1) {
		// At bottom
		return {
			position: 'after',
			sibling_id: null
		};
	}

	// Compute relative position
	var sibling = $cell.children().get(index - 1);

	return {
		position: 'after',
		sibling_id: Backbone.$(sibling).data('widget')
	};
}


var ModalView = Marionette.View.extend({
	template: require('../templates/layout.modal.html'),

	behaviors: [SelectifyBehavior],

	initialize: function(options) {
		this.mergeOptions(options, ['widget']);
	},

	templateContext: function() {
		return {
			widget: this.widget
		};
	},

	getValues: function() {
		var values = Forms.extractFields(_.keys(this.widget.settings), this);
		var settings = (this.widget.settings);

		_.each(values, function(value, key) {

			if (!settings[key] || !settings[key].type) return;

			// extractFields will return empty string for null OR empty string select values
			if (settings[key].ctl == 2 && value == '' &&
				settings[key].values && settings[key].values.length >= 2 &&
				settings[key].values[0].value == null && settings[key].values[1].value == '') {

				// user choose the null value
				var select = Backbone.$('select[name="' + key + '"]', this.el).get(0);
				if (select && select.selectedIndex == 0) {
					delete values[key];
				}
			}

			// keys with _id can have string values, like : pagelibre_id
			if (settings[key].ctl == 2 && Number.isNaN(value)) {
				values[key] = Backbone.$('select[name="' + key + '"]', this.el).val();
			}

		}.bind(this));

		return values;
	}

});

module.exports = Marionette.View.extend({
	template: require('../templates/layout.html'),
	className: 'container-fluid',
	service: 'layout',

	behaviors: [FormBehavior],

	ui: {
		'addBloc': 'ul[data-role="addBloc"] a',
		'removeBloc': 'a[data-role="removeBloc"]',
		'removeWidget': 'a[data-role="removeWidget"]',
		'configureWidget': 'a[data-role="configureWidget"]'
	},

	events: {
		'click @ui.addBloc': 'addBloc',
		'click @ui.removeBloc': 'removeBloc',
		'click @ui.removeWidget': 'removeWidget',
		'click @ui.configureWidget': 'openWidgetConfiguration'
	},

	willTriggerChangeName: false,

	initialize: function(options) {

		this.mergeOptions(options, ['apply', 'layout_id']);

		this.widgets = [];

		Backbone.$.when(
			this.model.getWidgets(this.model.get('type').page),
			this.model.getModels()
		).done(function(tree, models) {
			var widgets = [];

			_.each(tree, function(folder) {
				_.each(folder.categories, function(categorie) {
					widgets = widgets.concat(categorie.widgets);
				});
			});

			this.widgets = widgets;
			ControllerChannel.trigger('refresh:widgets', tree, models, this.model);
		}.bind(this));

		var view = this;

		this.listenTo(ControllerChannel, 'rendered:widgets', function() {
			// Widgets on sidebar
			Backbone.$("#widgets_pool .widget").draggable({
				connectToSortable: '#builder div.ui-sortable',
				//cursor: 'pointer',
				handle: ".btn-drag",
				cursorAt: {
					top: 25,
					left: 58
				},
				appendTo: "body",
				zIndex: 9999,
				helper: function(event, ui) {

					var $target = Backbone.$(event.currentTarget);
					var type = $target.data('type');
					var widget = view.widgets.find(function(widget) {
						return widget.type == type;
					});

					return Backbone.$(buildWidget({
						widget_id: 0,
						type: widget.type,
						name: widget.name,
						desc: widget.desc || '',
						main_category: widget.main_category
					}));
				},
				revert: 'invalid'
			});
		});

		this.listenTo(ControllerChannel, 'change:model', this.onChangeModel);
		this.listenTo(ControllerChannel, 'change:name', this.onChangeName);

	},

	templateContext: function() {

		var model = this.model.get('model');
		var tree = this.model.get('tree');

		var html = model.structure.replace('<table>', '<table class="template-layout">');

		_.each(model.zones, function(zone) {

			var blocsBuffer = [];

			if (tree[zone.id]) {
				_.each(tree[zone.id], function(bloc) {
					blocsBuffer.push(buildBloc(bloc));
				});
			}

			var zoneHtml = tplZone({
				col_count: parseInt(zone.colmax), // supports '2g' and '2d'
				name: zone.intitule,
				zone_id: zone.id,
				blocs: blocsBuffer.join('')
			});

			html = html.replace('{' + zone.id + '}', zoneHtml);
		});

		// Remove inconsistency between model and structure
		html = html.replace(/{[_a-zA-Z0-9]+}/, '');

		return {
			structure: html
		};
	},


	onRender: function() {
		this.bindBloc(Backbone.$('#builder div.ui-sortable', this.el));
	},

	openWidgetConfiguration: function(event) {

		var widget_id = Backbone.$(event.currentTarget.parentNode).data('widget');

		this.model.getWidget(widget_id).done(function(widget) {

			var contentView = new ModalView({
				widget: widget
			});
			this.listenTo(contentView, 'action:modal', this.onWidgetUpdate);

			var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
			navigationController.showInModal(contentView, {
				title: 'Paramètres du widget',
				modalClass: 'modal-right modal-widget',
				action: {
					title: 'Valider'
				}
			});


		}.bind(this)).fail(function(xhr) {
			var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
			navigationController.showErrorModal(xhr);
		});
	},

	addBloc: function(event) {

		var $target = Backbone.$(event.currentTarget);

		// API Call
		this.model.addBloc($target.data('zone'), $target.data('col')).done(function(bloc) {
			this.onBlocCreate(bloc, $target.data('zone'));
		}.bind(this)).fail(function(xhr) {
			var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
			navigationController.showErrorModal(xhr);
		}.bind(this));
	},

	removeBloc: function(event) {

		var $target = Backbone.$(event.currentTarget);
		var $zone = $target.parents('[data-role="zone"]');

		// API Call
		this.model.removeBloc($target.parent().data('bloc')).done(function() {
			this.onBlocDestroy($target.parent().data('bloc'));

			// Recreate bloc on empty zone
			if ($zone && $zone.children().length == 0) {
				var zone = this.model.describeZone($zone.data('zone'));
				var nb_col = zone ? zone.defaut : '1';
				this.model.addBloc($zone.data('zone'), nb_col).done(function(bloc) {
					this.onBlocCreate(bloc, $zone.data('zone'));
				}.bind(this)).fail(function(xhr) {
					var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
					navigationController.showErrorModal(xhr);
				}.bind(this));
			}

		}.bind(this)).fail(function() {
			var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
			navigationController.showErrorModal(xhr);
		}.bind(this));
	},

	//----- EVENTS ----- //

	/**
	 *
	 * @param {Object} bloc
	 * @param {String} zone
	 */
	onBlocCreate: function(bloc, zone) {
		// Add Nodes
		Backbone.$('div[data-role="zone"][data-zone="' + zone + '"]', this.el).append(buildBloc(bloc));
		this.bindBloc(Backbone.$('div[data-role="bloc"][data-bloc="' + bloc.bloc_id + '"] div.ui-sortable', this.el));
	},

	/**
	 *
	 * @param {String} bloc
	 */
	onBlocDestroy: function(bloc) {
		// Remove Nodes
		Backbone.$('div[data-role="bloc"][data-bloc="' + bloc + '"]', this.el).remove();
	},

	removeWidget: function(event) {
		var $target = Backbone.$(event.currentTarget);

		var id = $target.parent().data('widget');

		// API Call
		this.model.removeWidget(id).done(function() {

			// Remove Nodes
			var $widget = Backbone.$('div[data-role="widget"]', this.el).filter(function() {
				return Backbone.$(this).data('widget') == id;
			});

			$widget.remove();

		}.bind(this)).fail(function() {
			var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
			navigationController.showErrorModal(xhr);
		}.bind(this));
	},

	onWidgetUpdate: function(view) {

		this.model.setWidgetSettings(
			view.widget.widget_id,
			view.widget.settings,
			view.getValues()
		).done(function() {
			view.triggerMethod('close:modal', true); // close with animation
		}).fail(function() {
			// TODO
		});
	},

	onChangeModel: function(model) {
		this.model.save({
			model: model
		}, {
			patch: true
		}).done(function() {
			this.model.fetch().done(function() {
				// Need to scroll top to fix scroll offset
				Backbone.$('#content').animate({
					scrollTop: 0
				}, 'slow');
				this.render();
			}.bind(this));
		}.bind(this)).fail(function(xhr) {
			var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
			navigationController.showErrorModal(xhr);
		});
	},

	onChangeName: function(name) {
		if (name != this.model.get('name')) {
			this.willTriggerChangeName = true;
		}
		// Name will be updated on onSave
		this.model.set('name', name, {
			silent: true
		});
	},

	//----- ACTIONS ----- //

	/**
	 *
	 * @param {Object} widget
	 * @param {Number} cell_id
	 * @param {jQuery} $widget
	 * @param {Object} position
	 */
	addWidget: function(widget, cell_id, $widget, position) {
		this.model.addWidget(widget.type, cell_id, position).done(function(widget) {
			// Update all data-widget with widget ID
			$widget.data('widget', widget.widget_id);
			Backbone.$("[data-widget]", $widget).data('widget', widget.widget_id);
		}).fail(function() {
			// TODO
			console.log('FAIL');
		});
	},

	/**
	 *
	 * @param {Number} widget_id
	 * @param {Number} cell_id
	 * @param {Object} position
	 */
	moveWidget: function(widget_id, cell_id, position) {
		this.model.moveWidget(widget_id, cell_id, position).done(function() {
			console.log('OK');
		}).fail(function() {
			// TODO
			console.log('FAIL');
		});
	},

	/**
	 *
	 * @param {jQuery} $bloc
	 */
	bindBloc: function($bloc) {

		// Hack : sortable does only support a scroll offset if it comes from the direct parent.
		// Need to cheat the position of the first drag from EACH sortable. After first drag, all
		// positions are ok FOR THE SORTABLE.
		var scrollfix;

		var view = this;

		$bloc.sortable({
			connectWith: '#builder div.ui-sortable',
			placeholder: 'add-zone',
			handle: ".btn-drag",
			//zIndex: 9999,
			tolerance: 'pointer',
			start: function(event, ui) {
				if (Backbone.$(this).data('sortableFirst') != true) {
					scrollfix = Backbone.$('#content').scrollTop();
				} else {
					scrollfix = 0;
				}
				Backbone.$(this).data('sortableFirst', true);
			},
			sort: function(event, ui) {
				if (scrollfix > 0) {
					ui.helper.css({
						'top': ui.position.top - scrollfix + 'px'
					});
				}
			},

			update: function(event, ui) {

				var $cell = Backbone.$(this);

				if ($cell.has(ui.item).length == 0) {
					// ignore update event from the origin bloc
					return;
				}

				// Widget form the sidebar
				if (ui.item.data('widget') == 0) {

					var type = ui.item.data('type');
					var widget = view.widgets.find(function(widget) {
						return widget.type == type;
					});

					// Drop of a sidebar widget !
					var $widget = Backbone.$(buildWidget({
						widget_id: 0, // Widget doesn't have an id yet
						name: widget.name,
						type: widget.type,
						desc: widget.desc || '',
						main_category: widget.main_category
					}));
					ui.item.replaceWith($widget);

					view.addWidget(widget, parseInt($cell.data('cell')), $widget, makePosition($widget, $cell));
					return;
				}

				// Widget moved
				view.moveWidget(ui.item.data('widget'), $cell.data('cell'), makePosition(ui.item, $cell));

			},

			change: function(event, ui) {
				scrollfix = 0;
			}
		});
	},

	onSave: function() {

		var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');

		return this.model.save({
			name: this.model.get('name')
		}, {
			patch: true,
			wait: true
		}).then(function() {

			var m;
			if (this.layout_id) {
				// Update Layout
				m = new Layout({
					layout_id: this.layout_id,
					page: this.model.get('type').page,
					draft_id: this.model.get('draft_id'),
					name: this.model.get('name')
				});
			} else {
				// New Layout
				m = new Layout({
					page: this.model.get('type').page,
					draft_id: this.model.get('draft_id'),
					apply_to: this.apply,
					name: this.model.get('name')
				});
			}
			return m.save().done(function() {
				if (!this.layout_id) {
					this.layout_id = m.get('layout_id');
				}
				if (this.willTriggerChangeName) this.trigger('change:name', this.model);
				this.willTriggerChangeName = false;
			}.bind(this)).fail(function(xhr) {
				navigationController.showErrorModal(xhr);
			});
		}.bind(this), function(xhr) {
			navigationController.showErrorModal(xhr);
		});
	}

});
