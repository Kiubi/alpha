var Backbone = require('backbone');
var Marionette = require('backbone.marionette');

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

		_select.wrap('<div class="fake-select-wrap"/>');
		_select.before('<div class="fake-select-mask ' + (o.direction == 'down' ? 'dropdown' : 'dropup') + '" id="' +
			select_id +
			'-mask"><button type="button" class="form-control form-control-select ' + o.btnStyle + ' ' + o.btnSize +
			' dropdown-toggle" data-toggle="dropdown"><span class="fake-selected">' + getLabel($("option:selected", _select)) +
			'</span><span class="caret"></span></button><ul class="dropdown-menu dropdown-control"></ul></div>');
		var select_mask = _select.prev('.fake-select-mask');
		var select_index = _select.prop('selectedIndex');

		var dropdown_menu = select_mask.find('.dropdown-menu');
		var option_index = 0;
		_select.find('option, optgroup').each(function() {
			var li;
			var indent = Backbone.$(this).data('indent');
			if (this.tagName == 'OPTGROUP') { // this.class == disabled
				li = '<li ' + (indent != undefined ? 'class="page-level-' + indent + '"' : '') + '><span class="disabled">' +
					this.label + '</span></li>';
			} else {
				li = '<li class="' + (indent != undefined ? 'page-level-' + indent + ' ' : '') + (option_index == select_index ?
						'active' : '') + '"><a data-index="' + this.index +
					'" href="#">' + $(this).text() + '</a></li>';
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
	return ($option.data('tags') ? '<span class="tags tags-color-' + $option.data('tags') + '"></span>' : '') + $option.text();
}

module.exports = Marionette.Behavior.extend({

	onRender: function() {
		selectify(Backbone.$('select[data-style="selectify"]', this.view.el));
	}

});
