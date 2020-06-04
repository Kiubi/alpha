var Backbone = require('backbone');
var _ = require('underscore');
var serialize = require('form-serialize');

/**
 * Extract fields values from a View form.
 *
 * @param {Array} fields
 * @param {Marionette.View} view
 * @param {Object} options
 * @returns {Object}
 * @see  extractFieldsFromEl
 */
function extractFields(fields, view, options) {
	options = _.defaults(options || {}, {
		selector: 'form'
	});
	return extractFormFields(fields, Backbone.$(options.selector, view.el), options);
}

/**
 * Extract fields values from a View form.
 * Fields beginning with is_ are casted to boolean
 *
 * @param {Array} fields
 * @param {jQuery} $forms
 * @param {Object} options
 * @returns {Object}
 */
function extractFormFields(fields, $forms, options) {
	options = _.defaults(options || {}, {
		autoCast: true
	});
	var all = _.reduce($forms, function(acc, form) {
		return _.extend(acc, serialize(form, {
			hash: true,
			empty: true
		}));
	}, {});

	var whitelist = _.pick(all, fields); // whitelist
	return _.mapObject(whitelist, function(e, i) {
		if (options.autoCast) {
			if (i.substring(0, 3) === 'is_' && (e == '1' || e == '0')) {
				e = (e == '1');
			} else if (i.substring(i.length - 3) === '_id' && e !== '') {
				e = parseInt(e);
			}
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
 * @param {Object} error
 * @param {jQuery} $errorEl
 * @param {Node} el
 */
function displayErrors(error, $errorEl, el) {

	if (!error || !error.message) {
		$errorEl.text('Erreur inattendue');
		$errorEl.show();
		return;
	}

	$errorEl.text(error.message);
	$errorEl.show();

	if (error && error.fields) {
		_(error.fields).each(function(f) {
			Backbone.$("input[name='" + f.field + "'], textarea[name='" + f.field + "'], select[name='" + f.field + "']", el)
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

/**
 * Generate a temporary slug : eight underscores followed by eight digits
 * 
 * @returns {string}
 */
function tmpSlug() {
	var min = 10000000;
	var max = 99999999;
	return '________' + (Math.floor(Math.random() * (max - min + 1)) + min);
}

/**
 * Recognize a temporary slug
 * 
 * @param slug
 * @returns {boolean}
 */
function isTmpSlug(slug) {
	// in case of rare collision, temporary slug may become ^_{8}[0-9]{8}-[0-9]{1,3}$
	// so we only test the beginning of the slug
	return (slug.match(/^_{8}[0-9]{8}/) !== null);
}

module.exports.extractFields = extractFields;
module.exports.extractFormFields = extractFormFields;
module.exports.displayErrors = displayErrors;
module.exports.clearErrors = clearErrors;
module.exports.tmpSlug = tmpSlug;
module.exports.isTmpSlug = isTmpSlug;
