var $ = require('jquery');

module.exports = function(url, loader) {
	var result = loader.apply(window);
	if (!!result) {
		var dfd = $.Deferred();
		dfd.resolve(result);
		return dfd;
	}
	return $.ajax({
		url: url,
		dataType: "script",
	}).then(function() {
		return loader.apply(window);
	});
};
