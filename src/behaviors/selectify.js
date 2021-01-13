var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');

/**
 * Inspired by fakeSelect : v0.1 Copyright 2014 http://takien.com
 *
 * Licensed under the MIT License
 * http://en.wikipedia.org/wiki/MIT_License
 *
 * @param {jQuery} selector
 * @param {Object} customOptions
 */
function selectify(selector, customOptions) {

	var $ = Backbone.$;

	var o = $.extend({
		btnSize: '',
		btnStyle: '',
		direction: 'down'
	}, customOptions);

	return selector.each(function(index) {

		var _select = $(this);

		if (_select.data('style-loaded')) return;
		_select.data('style-loaded', true);

		var select_id = (_select.attr('id') == undefined) ? 'fake-select-' + index : _select.attr('id');
		o = $.extend({}, o, _select.data());

		_select.before('<div class="fake-select ' + (o.direction == 'down' ? 'dropdown' : 'dropup') + '" id="' +
			select_id +
			'-mask"><button type="button" class="btn btn-secondary ' + o.btnStyle + ' ' + o.btnSize +
			' dropdown-toggle" data-toggle="dropdown"><span class="fake-selected">' + getLabel($("option:selected", _select)) +
			'</span></button><ul class="dropdown-menu dropdown-control"></ul></div>');
		var select_mask = _select.prev('.fake-select');
		var select_index = _select.prop('selectedIndex');

		var dropdown_menu = select_mask.find('.dropdown-menu');
		var option_index = 0;
		_select.find('option, optgroup').each(function() {
			var li;
			var indent = Backbone.$(this).data('indent');
			var indent_class = (indent != undefined && indent != null && indent != '') ? 'page-level-' + indent : '';
			if (this.tagName == 'OPTGROUP') { // this.class == disabled
				li = '<li class="' + indent_class + '"><span class="dropdown-item disabled">' + _.escape(this.label) +
					'</span></li>';
			} else {
				li = '<li class="' + indent_class + (option_index == select_index ? ' active' : '') +
					'"><a class="dropdown-item" data-index="' +
					this.index + '" href="#">' + this.innerHTML + '</a></li>';
				option_index++;
			}
			dropdown_menu.append(li);
		});

		select_mask.attr('title', (_select.attr('title') || ''));
		select_mask.find('.dropdown-menu li a').each(function() {
			$(this).click(function(e) {
				$('.dropdown-menu li', select_mask).removeClass('active');
				$(this).parent().addClass('active');
				_select.prop('selectedIndex', $(this).data('index')).change();
				e.preventDefault();
			});
		});
		_select.hide();

		_select.on('change', function() {
			$(this).parents('form').trigger('input'); // Trigger fake event "input" for the <form>
			select_mask.find('.fake-selected').html(getLabel($("option:selected", _select)));
			var select_index = _select.prop('selectedIndex');
			$('.dropdown-menu li', select_mask).removeClass('active');
			$('.dropdown-menu li a[data-index="' + select_index + '"]', select_mask).parent().addClass('active');
		});
	});

}

function getLabel($option) {
	return ($option.data('tags') ? '<span class="md-icon md-item-type ' + $option.data('tags') + '"></span>' : '') + _.escape(
		$option.text());
}

module.exports = Marionette.Behavior.extend({

	onRender: function() {
		selectify(Backbone.$('select[data-style="selectify"]', this.view.el), {});
	}

});
