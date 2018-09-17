var Backbone = require('backbone');
var _ = require('underscore');
var CollectionUtils = require('kiubi/utils/collections.js');
var api = require('kiubi/utils/api.client.js');

var Job = require('kiubi/modules/modules/models/job');

function checkExport(job) {

	var token = job.get('result');

	return Backbone.ajax({
		url: 'sites/@site/export/media/folder/' + token,
		method: 'GET'
	}).then(function(response) {
		return response.data;
	});
}

var File = Backbone.Model.extend({
	urlRoot: 'sites/@site/media/files',
	idAttribute: 'media_id',

	file: null,
	uploadPreview: null,
	uploadProgression: {
		prct: 0,
		status: 'pending', // pending => uploading => done|fail
		error: ''
	},

	parse: function(response) {
		if ('data' in response) {
			if (response.data === null) return {};
			if (_.isNumber(response.data)) {
				return {
					media_id: response.data
				};
			}

			return response.data;
		}
		return response;
	},

	defaults: {
		media_id: null,
		name: '',
		folder_id: 0,
		description: '',
		original_name: '',
		type: '',
		ext: '',
		mime: '',
		weight: '',
		width: '',
		height: '',
		creation_date: '',
		modification_date: '',
		thumb: []
	},

	setFile: function(File) {
		this.setProgression(0, 'pending');

		if (api.max_post_size && File.size > api.max_post_size) {
			return this.destroy();
		}

		this.set('name', File.name);
		this.set('ext', File.name.split('.').pop());
		this.set('weight', File.size);
		this.set('type', File.type.match(/^image\//) ? 'image' : 'file');
		this.file = File;

		// this.set('status', "draft");

		if (this.get('type') != 'image') {
			return;
		}

		var model = this;
		var preloader = new Image();
		var domURL = (self.URL || self.webkitURL || self);

		if (domURL.createObjectURL) {
			preloader.onload = function() {
				model.uploadPreview = this.src;
				model.trigger('change:upload');
				delete this;
			};
			preloader.src = domURL.createObjectURL(File);
			return;
		}

		// Fallback
		var reader = new FileReader();
		reader.onload = function(event) {
			preloader.onload = function() {
				model.uploadPreview = model.createThumbnail(this);
				model.trigger('change:upload');
				delete this;
			};
			preloader.src = event.target.result;
		};
		reader.readAsDataURL(File);
	},

	createThumbnail: function(img) {
		var canvas = document.createElement("canvas");

		canvas.width = 320; // retina friendly
		canvas.height = canvas.width / img.width * img.height;

		var ctx = canvas.getContext("2d", {
			alpha: false
		});

		ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
		return canvas.toDataURL("image/jpeg", 0.5);
	},

	upload: function() {
		var model = this;
		var dfd = Backbone.$.Deferred();
		var file = this.file;

		this.setProgression(0, 'pending');

		if (api.max_post_size && file.size > api.max_post_size) {
			dfd.reject("Ce fichier est trop volumineux");
			this.setProgression(100, 'fail', 'Ce fichier est trop volumineux');
			return dfd.promise();
		}

		var datas = new FormData();
		datas.append('name', model.get('name'));
		datas.append('folder_id', model.get('folder_id'));
		datas.append('file', file);

		Backbone.ajax({
			method: 'POST',
			url: model.url(),
			contentType: false,
			processData: false,
			dataType: 'json',
			xhr: function() {
				// get the native XmlHttpRequest object
				var xhr = Backbone.$.ajaxSettings.xhr();
				// set the onprogress event handler
				xhr.upload.onprogress = function(evt) {
					if (evt.lengthComputable) {
						model.setProgression(evt.loaded / evt.total * 100, 'uploading');
					} else {
						model.setProgression(50, 'uploading');
					}
				};
				// set the onload event handler
				xhr.upload.onload = function() {
					model.setProgression(100, 'uploading');
				};
				// return the customized object
				return xhr;
			},
			data: datas
		}).done(function(response) {

			if (response.data && _.isNumber(response.data)) {
				model.set('media_id', response.data);
				model.setProgression(100, 'done');
				dfd.resolve();
				return;
			}

			model.setProgression(100, 'fail');
			dfd.reject("Fail");
		}).fail(function(xhr) {
			model.setProgression(100, 'fail', 'Erreur inattendue');
			dfd.reject("Fail");
		});
		return dfd.promise();
	},

	setProgression: function(prct, status, error) {
		this.uploadProgression.prct = prct;
		this.uploadProgression.status = status;
		if (error) this.uploadProgression.error = error;
		this.trigger('change:upload');
	}

});


module.exports = Backbone.Collection.extend({

	folder_id: null,

	url: function() {
		if (this.folder_id) return 'sites/@site/media/folders/' + this.folder_id +
			'/files';
		return 'sites/@site/media/files';
	},

	model: File,
	parse: function(response) {
		this.meta = response.meta;
		return response.data;
	},

	upload: function() {
		var upload = [];

		this.each(function(file) {
			if (file.uploadProgression.status == 'pending') {
				upload.push(file.upload());
			}
		});

		return Backbone.$.when.apply(this, upload);
	},

	/**
	 *
	 * @param {Integer[]} ids
	 * @returns {Promise}
	 */
	bulkDelete: function(ids) {

		return CollectionUtils.bulkAction(this, function(model) {
			return model.destroy();
		}, ids);

	},

	/**
	 *
	 * @param {Integer[]} ids
	 * @param {Integer} folder_id
	 * @returns {Promise}
	 */
	bulkMove: function(ids, folder_id) {

		return CollectionUtils.bulkAction(this, function(model) {
			if (model.get('folder_id') == folder_id) {
				// already in this folder
				return Backbone.$.Deferred().resolve();
			}
			return model.save({
				'folder_id': folder_id
			}, {
				patch: true,
				wait: true
			});
		}, ids);

	},

	/**
	 * @param {Object} data
	 * @returns {Promise}
	 */
	exportAll: function(data) {
		return Backbone.ajax({
			url: 'sites/@site/export/media/folder',
			method: 'POST',
			data: data
		}).then(function(response) {

			var job = new Job({
				job_id: response.data.job_id
			});

			return job.watch().then(function() {
				return checkExport(job);
			});
		});
	},

	/**
	 * Suggest file
	 *
	 * @param {String} term
	 * @param {Number[]} limit
	 * @returns {Promise}
	 */
	suggest: function(term, limit) {
		return Backbone.ajax({
			url: 'sites/@site/suggest/media/files',
			data: {
				term: term,
				limit: limit || 5
			}
		}).then(function(response) {
			return _.map(response.data, function(file) {
				return {
					media_id: file.media_id,
					name: file.name
				};
			});
		});
	}

});
