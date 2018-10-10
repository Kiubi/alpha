var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

module.exports = Marionette.View.extend({
	template: require('../../templates/ui/input.search.html'),
	tagName: 'div',

	current: null,
	name: '',

	ui: {
		'drop': '.dropdown',
		'sel': '.dropdown li[data-role="selection"]',
		'lixtra': '.dropdown li[data-role="xtra"]',
		'input': 'input',
		'footer': '.dropdown a[data-role="footer"]'
	},

	events: {
		'keyup @ui.drop input': _.debounce(function(event) {
			this.triggerInput(event.key == "Enter");
		}, 300),

		'mousedown @ui.input': function(event) {
			this.triggerInput(false);
		},

		'click @ui.sel': function(event) {
			var index = parseInt(Backbone.$(event.currentTarget).data('index'));

			if (isNaN(index) || index > this.suggestions.length) return;
			this.current = this.suggestions[index].value;
			Backbone.$('input', this.el).val(this.current);
		},

		'click @ui.lixtra': function(event) {
			var eventName = Backbone.$(event.currentTarget).data('event');

			this.triggerMethod(this.eventName(eventName), this.term, this);
		},

		'click @ui.footer': function(event) {
			var $a = Backbone.$(event.currentTarget);
			var footerid = $a.data('footerid');

			event.stopPropagation();

			$a.siblings().removeClass('active');
			$a.addClass('active');

			_.each(this.footer, function(icon) {
				icon.isActive = (icon.id == footerid);
			});

			this.triggerMethod(this.eventName('select:footer'), footerid, this);
		}
	},

	/*
	 * Suggestions
	 * {
	 * 	is_header: boolean
	 * 	label: string
	 * 	icon: string
	 * 	href: string
	 * 	disable_escaping: boolean
	 * }
	 * 
	 */
	suggestions: null,

	term: null,

	searchPlaceholder: 'Rechercher',
	noResultsLabel: '-- Aucun résultat --',

	evtSuffix: '',
	eventName: function(base) {
		return this.evtSuffix ? base + ':' + this.evtSuffix : base;
	},

	initialize: function(options) {

		this.mergeOptions(options, ['evtSuffix', 'current', 'name', 'footer']);
		this.term = null;
	},

	templateContext: function() {

		return {
			'name': this.name,
			'current': this.current,
			'searchPlaceholder': this.searchPlaceholder,
			'extraDropdownClassname': this.getOption('extraDropdownClassname'),
			'extraDropdownMenuClassname': this.getOption('extraDropdownMenuClassname'),
			'extraInputClassname': this.getOption('extraInputClassname')
		};

	},

	triggerInput: function(force) {
		if (this.getUI('input').val() === this.term && !force) return;

		this.term = this.getUI('input').val();
		this.triggerMethod(this.eventName('input'), this.term, this);
	},

	showResults: function(results, options) {
		this.suggestions = results;
		options = options || {};

		var list = '';
		if (results.length > 0) {
			list = _.reduce(results, function(acc, result, index) {

				if (result.is_header) {
					return acc + '<li class="dropdown-header">' + _.escape(result.label) + '</li>';
				}

				var icon = result.icon ? '<span class="md-icon ' + result.icon + '"></span>' : '';
				var label = result.disable_escaping ? result.label : _.escape(result.label);

				if (result.href) {
					return acc + '<li><a class="dropdown-item" href="' + result.href + '">' +
						icon + label + '</a></li>';
				} else {
					return acc + '<li data-role="selection" data-index="' + index + '"><a class="dropdown-item" href="#">' +
						icon + label + '</a></li>';
				}

			}, '');
		} else if (this.emptyLabel) {
			list = '<li><a class="dropdown-item" href="#">' + this.noResultsLabel + '</a></li>';
		}

		if (options.xtra) {
			options.xtra = _.extend({
				title: 'Ajouter',
				iconClass: 'md-add-outline',
				eventName: 'xtra'
			}, options.xtra);

			list += '<li class="dropdown-divider"></li><li data-role="xtra" data-event="' + options.xtra.eventName +
				'"><a class="dropdown-item" href="#">' + options.xtra.title + '<span class="md-icon ' + options.xtra.iconClass +
				'"></span></a></li>';
		}

		list = '<li><ul class="dropdown-control list-unstyled m-0">' + list + '</ul></li>';

		if (this.footer && this.footer.length > 0) {

			if (options.activeFooter) {
				_.each(this.footer, function(icon) {
					icon.isActive = (icon.id == options.activeFooter);
				});
			}

			var footer = _.reduce(this.footer, function(acc, icon) {

				return acc + '<a class="dropdown-item ' + (icon.isActive ? 'active' : '') +
					'" href="#" data-role="footer" data-footerid="' + icon.id + '" title="' + icon.label +
					'"><span class="md-icon ' + icon.icon + '"></span></a>';

			}, '<li class="dropdown-divider"></li><li class="dropdown-footer d-flex">');

			footer += '</li>';
			list += footer;
		}

		this.getUI('drop').children('ul').html(list);
		this.getUI('drop').addClass('show'); // Force opening
		this.getUI('drop').children('.dropdown-menu').addClass('show'); // Force opening

	},

	getActiveFooter: function() {
		return _.findWhere(this.footer, {
			isActive: true
		});
	}

});
