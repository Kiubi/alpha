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
	return moment(string_date, 'YYYY-MM-DD').format('DD/MM/YYYY');
}

/**
 * Format a datetime from kiubi API
 *
 * @param {String} string_date
 * @returns {String}
 */
function formatDateTime(string_date) {
	return moment(string_date, 'YYYY-MM-DD hh:mm:ss').format('DD/MM/YYYY hh:mm:ss');
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
	var k = 1000,
		dm = decimals || 2,
		sizes = ['octets', 'Ko', 'Mo', 'Go'],
		i = Math.floor(Math.log(bytes) / Math.log(k));
	return _string.numberFormat(bytes / Math.pow(k, i), dm, ',', ' ') + ' ' +
		sizes[i];
}

module.exports.formatDate = formatDate;
module.exports.formatDateTime = formatDateTime;
module.exports.formatBytes = formatBytes;
