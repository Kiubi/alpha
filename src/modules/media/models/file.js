var Backbone = require('backbone');
var _ = require('underscore');
var api = require('kiubi/utils/api.client.js');

module.exports = Backbone.Model.extend({
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
