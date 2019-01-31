var Backbone = require('backbone');
var _ = require('underscore');
var serialize = require('form-serialize');

/**
 * Extract fields values from a View form.
 *
 * @param {Array} fields
 * @param {Marionette.View} view
 * @param {String} selector
 * @returns {Object}
 * @see  extractFieldsFromEl
 */
function extractFields(fields, view, selector) {
	if (!selector) selector = 'form';
	return extractFormFields(fields, Backbone.$(selector, view.el));
}

/**
 * Extract fields values from a View form.
 * Fields beginning with is_ are casted to boolean
 *
 * @param {Array} fields
 * @param {jQuery} $forms
 * @returns {Object}
 */
function extractFormFields(fields, $forms) {

	var all = _.reduce($forms, function(acc, form) {
		return _.extend(acc, serialize(form, {
			hash: true,
			empty: true
		}));
	}, {});

	var whitelist = _.pick(all, fields); // whitelist
	return _.mapObject(whitelist, function(e, i) {
		if (i.substring(0, 3) === 'is_' && (e == '1' || e == '0')) {
			e = (e == '1');
		} else if (i.substring(i.length - 3) === '_id' && e !== '') {
			e = parseInt(e);
		}

		// Filter out checkbox
		if (_.isArray(e)) e = _.filter(e, function(val) {
			if (_.isString(val))
				return val.length > 0;
			return true;
		});
		return e;
	});
}

/**
 * Hepler to display and format errors in a standard form
 * 
 * @param {XMLHttpRequest} xhr
 * @param {jQuery} $errorEl
 * @param {Node} el
 */
function displayErrors(xhr, $errorEl, el) {

	if (!xhr.responseJSON || !xhr.responseJSON.error || !xhr.responseJSON.error.message) {
		$errorEl.text('Erreur inattendue');
		$errorEl.show();
		return;
	}

	$errorEl.text(xhr.responseJSON.error.message);
	$errorEl.show();

	if (xhr.responseJSON.error && xhr.responseJSON.error.fields) {
		_(xhr.responseJSON.error.fields).each(function(f) {
			Backbone.$("input[name='" + f.field + "'], textarea[name='" + f.field +
					"'], select[name='" + f.field + "']", el)
				.parents(".form-group").addClass('has-error');
		});
	}

}

/**
 * Helper to clear previous errors in a standard form 
 * 
 * @param {jQuery} $errorEl
 * @param {Node} el
 */
function clearErrors($errorEl, el) {

	$errorEl.hide();
	Backbone.$("input, textarea, select", el).parents(".form-group").removeClass('has-error');

}


module.exports.extractFields = extractFields;
module.exports.extractFormFields = extractFormFields;
module.exports.displayErrors = displayErrors;
module.exports.clearErrors = clearErrors;
