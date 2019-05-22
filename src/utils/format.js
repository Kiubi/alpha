var Backbone = require('backbone');
var _ = require('underscore');
var _string = require('underscore.string');
var moment = require('moment');

/**
 * Format a date from kiubi API
 *
 * @param {String} string_date
 * @returns {String}
 */
function formatDate(string_date) {
	if (string_date == '') return string_date;
	return moment(string_date, 'YYYY-MM-DD').format('DD/MM/YYYY');
}

/**
 * Format a datetime from kiubi API
 *
 * @param {String} string_date
 * @returns {String}
 */
function formatDateTime(string_date) {
	if (string_date == '') return string_date;
	return moment(string_date, 'YYYY-MM-DD HH:mm:ss').format('DD/MM/YYYY HH:mm:ss');
}

/**
 * Format a datetime from kiubi API
 *
 * @param {String} string_date
 * @returns {String}
 */
function formatLongDate(string_date) {
	if (string_date == '') return string_date;
	return moment(string_date, 'YYYY-MM-DD').format('DD MMM YYYY');
}

/**
 * Format a datetime from kiubi API
 *
 * @param {String} string_date
 * @returns {String}
 */
function formatLongDateTime(string_date) {
	if (string_date == '') return string_date;
	return moment(string_date, 'YYYY-MM-DD HH:mm:ss').format('DD MMM YYYY [à] HH[h]mm');
}

/**
 * Byte size for humans
 *
 * @param {int} bytes
 * @param {int} decimals
 * @returns {String}
 */
function formatBytes(bytes, decimals) {
	if (bytes == 0) return '0 octets';
	var k = 1024,
		dm = decimals || 2,
		sizes = ['octets', 'Ko', 'Mo', 'Go'],
		i = Math.floor(Math.log(bytes) / Math.log(k));
	return _string.numberFormat(bytes / Math.pow(k, i), dm, ',', ' ') + ' ' + sizes[i];
}

/**
 * Format float
 *
 * @param {float} amount
 * @param {int} decimals
 * @param {String} thousands
 * @returns {String}
 */
function formatFloat(amount, decimals, thousands) {
	if (_.isString(amount)) amount = unformatFloat(amount); // in fine, formatFloat(formatFloat('')) can happen
	if (amount === null) return '';
	decimals = typeof decimals == 'undefined' ? 2 : decimals;
	thousands = thousands || '';
	return _string.numberFormat(amount, decimals, ',', thousands);
}

/**
 * Parse formatted float
 *
 * @param {String} amount
 * @returns {Number}
 */
function unformatFloat(amount) {
	if (amount === null || amount === '') return null;

	amount = amount.replace(',', '.');
	amount = amount.replace(' ', '');

	var val = parseFloat(amount);
	if (isNaN(val)) {
		return null;
	}

	return val;
}

/**
 * Retourne l'entité HTML d'une devise
 *
 * @param {String} code
 * @returns {String}
 */
function currencyEntity(code) {

	switch (code) {
		case 'EUR':
			return '&euro;';
		case 'GBP':
			return '&pound;';
		case 'CAD':
		case 'USD':
			return '$';
		default:
			return code;
	}

}

function plural(nb, singular, plural) {
	return (nb > 1 ? plural : singular).replace('%d', nb);
}


module.exports.formatDate = formatDate;
module.exports.formatDateTime = formatDateTime;
module.exports.formatLongDate = formatLongDate;
module.exports.formatLongDateTime = formatLongDateTime;
module.exports.formatBytes = formatBytes;
module.exports.formatFloat = formatFloat;
module.exports.unformatFloat = unformatFloat;
module.exports.currencyEntity = currencyEntity;
module.exports.plural = plural;
