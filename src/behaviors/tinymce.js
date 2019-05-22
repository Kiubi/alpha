var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');
var format = require('kiubi/utils/format.js');

var PublishModalView = require('kiubi/modules/media/views/modal.publish.js');
var SelectModalView = require('kiubi/modules/media/views/modal.picker');
var WysiwygModalView = require('kiubi/modules/media/views/modal.picker.wysiwyg');

var Files = require('kiubi/modules/media/models/files');
var Folders = require('kiubi/modules/media/models/folders');
var Page = require('kiubi/modules/cms/models/page');

var WysiwygChannel = Backbone.Radio.channel('wysiwyg');
var ControllerChannel = Backbone.Radio.channel('controller');
var Session = Backbone.Radio.channel('app').request('ctx:session');


function addSign(match, media) {
	var id = media.match(/(^|\/)([0-9]+)(\?|$|\/|\.)/);
	if (id) {
		var sign = Session.hashMedia(parseInt(id[2]));
		// Purge une eventuelle queryString
		var p = media.indexOf("?");
		if (p >= 0) {
			media = media.substring(0, p);
		}
		return 'src="https://' + Session.site.get('backoffice') + '/media/' + media + '?sign=' + sign + '"';
	}
	return match;
}

function addSignInSrc(match, media) {
	var id = media.match(/(^|\/)([0-9]+)(\?|$|\/|\.)/);

	if (id) {
		var sign = Session.hashMedia(parseInt(id[2]));
		// Purge une eventuelle queryString
		var p = media.indexOf("?");
		if (p >= 0) {
			media = media.substring(0, p);
		}

		return 'https://' + Session.site.get('backoffice') + '/media/' + media + '?sign=' + sign;
	}
}

function removeSign(match, media) {
	return 'src="' + removeSignInSrc(match, media) + '"';
}

function removeSignInSrc(match, media) {
	return '/media/' + media.replace(/(\?|\&)sign=[-a-zA-Z0-9]+/, '');
}

require('tinymce');
var tinyMCE = window.tinyMCE;

// i18n
require('kiubi/locales/fr/tinymce.js');

// Theme
require('tinymce/themes/modern/theme.js');
// Plugins
require('tinymce/plugins/lists/plugin.js');
require('tinymce/plugins/paste/plugin.js');
require('kiubi/vendor/tinymce/plugins/link/plugin.js');
require('tinymce/plugins/charmap/plugin.js');
require('tinymce/plugins/code/plugin.js');
require('tinymce/plugins/anchor/plugin.js');
require('tinymce/plugins/table/plugin.js');
require('tinymce/plugins/textcolor/plugin.js');
require('tinymce/plugins/colorpicker/plugin.js');
require('tinymce/plugins/fullscreen/plugin.js');
require('tinymce/plugins/image/plugin.js');
require('tinymce/plugins/contextmenu/plugin.js');
require('tinymce/plugins/media/plugin.js');



tinyMCE.PluginManager.add('wordpaste', function(editor, url) {

	var cleanHTML = function(input) {

		// 1. remove line breaks / Mso classes
		var stringStripper = /( class=(")?Mso[a-zA-Z]+(")?)/g;
		var output = input.replace(stringStripper, ' ');

		// 2. strip Word generated HTML comments
		var commentSripper = new RegExp('<!--(.*?)-->', 'g');
		output = output.replace(commentSripper, '');

		// 3. remove tags leave content if any
		var tagStripper = new RegExp('<(\/)*(title|meta|link|span|\\?xml:|st1:|o:|font)(.*?)>', 'gi');
		output = output.replace(tagStripper, '');

		// 4. Remove everything in between and including tags '<style(.)style(.)>'
		var badTags = ['style', 'script', 'applet', 'embed', 'noframes', 'noscript'];
		for (var i = 0; i < badTags.length; i++) {
			var tagStripper = new RegExp('<' + badTags[i] + '.*?' + badTags[i] + '(.*?)>', 'gi');
			output = output.replace(tagStripper, '');
		}

		// A different attempt
		//output = (output).replace(/font-family\:[^;]+;?|font-size\:[^;]+;?|line-height\:[^;]+;?/g, '');

		// 5. remove attributes ' width="..."'
		var badAttributes = ['start', /*'align',*/ 'class', 'width', 'height', 'data-[^=]+'];
		for (var i = 0; i < badAttributes.length; i++) {
			var attributeStripper = new RegExp(' ' + badAttributes[i] + '="(.*?)"', 'gi');
			output = output.replace(attributeStripper, '');
		}

		// 6. remove consecutives new lines
		var nlStripper = /(\n|\r|\r\n)+/g;
		output = output.replace(stringStripper, '\r\n');

		return output;
	};

	editor.on('PastePreProcess', function(e) {
		e.content = cleanHTML(e.content);
	});
});


// Plugins Mediathèque
tinyMCE.PluginManager.add('kiubi', function(editor, url) {
	// Add a button that opens a window
	editor.addButton('kiubi_media', {
		tooltip: "Médiathèque",
		icon: 'image',
		onclick: function() {
			WysiwygChannel.trigger('open:media', editor);
		}
	});
	editor.on('BeforeSetContent', function(e) {
		e.content = e.content.replace(/src="\/media\/([^"]+)"/gi, addSign);
	});
	editor.on('GetContent', function(e) {
		var reg = new RegExp('src="https://' + Session.site.get('backoffice') + '/media/([^"]+)"', 'gi');
		e.content = e.content.replace(reg, removeSign);
	});

	editor.addShortcut('Meta+S', '', function() {
		ControllerChannel.trigger('meta:s:shortcut');
		return false;
	});

	function Dialog(editor) {

		var parseIntAndGetMax = function(val1, val2) {
			return Math.max(parseInt(val1, 10), parseInt(val2, 10));
		};

		var Utils = {
			getImageSize: function(url, callback) {
				var img = document.createElement('img');

				function done(width, height) {
					if (img.parentNode) {
						img.parentNode.removeChild(img);
					}
					callback({
						width: width,
						height: height
					});
				}
				img.onload = function() {
					var width = parseIntAndGetMax(img.width, img.clientWidth);
					var height = parseIntAndGetMax(img.height, img.clientHeight);
					done(width, height);
				};
				img.onerror = function() {
					done(0, 0);
				};
				var style = img.style;
				style.visibility = 'hidden';
				style.position = 'fixed';
				style.bottom = style.left = '0px';
				style.width = style.height = 'auto';
				document.body.appendChild(img);
				img.src = url;
			},
			removePixelSuffix: function(value) {
				if (value) {
					value = value.replace(/px$/, '');
				}
				return value;
			},
			addPixelSuffix: function(value) {
				if (value.length > 0 && /^[0-9]+$/.test(value)) {
					value += 'px';
				}
				return value;
			},
			mergeMargins: function(css) {
				if (css.margin) {
					var splitMargin = css.margin.split(' ');
					switch (splitMargin.length) {
						case 1:
							css['margin-top'] = css['margin-top'] || splitMargin[0];
							css['margin-right'] = css['margin-right'] || splitMargin[0];
							css['margin-bottom'] = css['margin-bottom'] || splitMargin[0];
							css['margin-left'] = css['margin-left'] || splitMargin[0];
							break;
						case 2:
							css['margin-top'] = css['margin-top'] || splitMargin[0];
							css['margin-right'] = css['margin-right'] || splitMargin[1];
							css['margin-bottom'] = css['margin-bottom'] || splitMargin[0];
							css['margin-left'] = css['margin-left'] || splitMargin[1];
							break;
						case 3:
							css['margin-top'] = css['margin-top'] || splitMargin[0];
							css['margin-right'] = css['margin-right'] || splitMargin[1];
							css['margin-bottom'] = css['margin-bottom'] || splitMargin[2];
							css['margin-left'] = css['margin-left'] || splitMargin[1];
							break;
						case 4:
							css['margin-top'] = css['margin-top'] || splitMargin[0];
							css['margin-right'] = css['margin-right'] || splitMargin[1];
							css['margin-bottom'] = css['margin-bottom'] || splitMargin[2];
							css['margin-left'] = css['margin-left'] || splitMargin[3];
					}
					delete css.margin;
				}
				return css;
			},
			waitLoadImage: function(editor, data, imgElm) {
				function selectImage() {
					imgElm.onload = imgElm.onerror = null;
					if (editor.selection) {
						editor.selection.select(imgElm);
						editor.nodeChanged();
					}
				}
				imgElm.onload = function() {
					/*if (!data.width && !data.height) {
						editor.dom.setAttribs(imgElm, {
							width: imgElm.clientWidth,
							height: imgElm.clientHeight
						});
					}*/
					selectImage();
				};
				imgElm.onerror = selectImage;
			}
		};

		var defaultData = function() {
			return {
				src: '',
				alt: '',
				title: '',
				width: '',
				height: '',
				class: '',
				style: '',
				hspace: '',
				vspace: '',
				//border: '',
				//borderStyle: ''
			};
		};
		var doSyncSize = function(widthCtrl, heightCtrl) {
			widthCtrl.state.set('oldVal', widthCtrl.value());
			heightCtrl.state.set('oldVal', heightCtrl.value());
		};
		var doSizeControls = function(win, f) {
			var widthCtrl = win.find('#width')[0];
			var heightCtrl = win.find('#height')[0];
			var constrained = win.find('#constrain')[0];
			if (widthCtrl && heightCtrl && constrained) {
				f(widthCtrl, heightCtrl, constrained.checked());
			}
		};
		var doUpdateSize = function(widthCtrl, heightCtrl, isContrained) {
			var oldWidth = widthCtrl.state.get('oldVal');
			var oldHeight = heightCtrl.state.get('oldVal');
			var newWidth = widthCtrl.value();
			var newHeight = heightCtrl.value();
			if (isContrained && oldWidth && oldHeight && newWidth && newHeight) {
				if (newWidth !== oldWidth) {
					newHeight = Math.round(newWidth / oldWidth * newHeight);
					if (!isNaN(newHeight)) {
						heightCtrl.value(newHeight);
					}
				} else {
					newWidth = Math.round(newHeight / oldHeight * newWidth);
					if (!isNaN(newWidth)) {
						widthCtrl.value(newWidth);
					}
				}
			}
			doSyncSize(widthCtrl, heightCtrl);
		};
		var SizeManager = {
			createUi: function() {
				var recalcSize = function(evt) {
					SizeManager.updateSize(evt.control.rootControl);
				};
				return {
					type: 'container',
					label: 'Dimensions',
					layout: 'flex',
					align: 'center',
					spacing: 5,
					items: [{
							name: 'width',
							type: 'textbox',
							maxLength: 5,
							size: 5,
							onchange: recalcSize,
							ariaLabel: 'Width'
						},
						{
							type: 'label',
							text: 'x'
						},
						{
							name: 'height',
							type: 'textbox',
							maxLength: 5,
							size: 5,
							onchange: recalcSize,
							ariaLabel: 'Height'
						},
						{
							name: 'constrain',
							type: 'checkbox',
							checked: true,
							text: 'Constrain proportions'
						}
					]
				};
			},
			syncSize: function(win) {
				doSizeControls(win, doSyncSize);
			},
			updateSize: function(win) {
				doSizeControls(win, doUpdateSize);
			}
		};

		var getAttrib = function(image, name$$1) {
			if (image.hasAttribute(name$$1)) {
				return image.getAttribute(name$$1);
			} else {
				return '';
			}
		};
		var getHspace = function(image) {
			if (image.style.marginLeft && image.style.marginRight && image.style.marginLeft === image.style.marginRight) {
				return Utils.removePixelSuffix(image.style.marginLeft);
			} else {
				return '';
			}
		};
		var setHspace = function(image, value) {
			var pxValue = Utils.addPixelSuffix(value);
			image.style.marginLeft = pxValue;
			image.style.marginRight = pxValue;
		};
		var setVspace = function(image, value) {
			var pxValue = Utils.addPixelSuffix(value);
			image.style.marginTop = pxValue;
			image.style.marginBottom = pxValue;
		};

		var getVspace = function(image) {
			if (image.style.marginTop && image.style.marginBottom && image.style.marginTop === image.style.marginBottom) {
				return Utils.removePixelSuffix(image.style.marginTop);
			} else {
				return '';
			}
		};

		var create = function(normalizeCss, data) {
			var image = document.createElement('img');
			write(normalizeCss, merge(data, {
				caption: false
			}), image);
			return image;
		};

		var read = function(normalizeCss, image) {

			var reg = new RegExp('^https://' + Session.site.get('backoffice') + '/media/([^"]+)', 'i');
			var src = getAttrib(image, 'src').replace(reg, removeSignInSrc);

			return {
				src: src,
				alt: getAttrib(image, 'alt'),
				title: getAttrib(image, 'title'),
				width: getSize(image, 'width'),
				height: getSize(image, 'height'),
				class: getAttrib(image, 'class'),
				style: normalizeCss(getAttrib(image, 'style')),
				hspace: getHspace(image),
				vspace: getVspace(image)
			};
		};

		var setSize = function(name$$1, normalizeCss) {
			return function(image, name$$1, value) {
				if (image.style[name$$1]) {
					image.style[name$$1] = Utils.addPixelSuffix(value);
					normalizeStyle(image, normalizeCss);
				} else {
					setAttrib(image, name$$1, value);
				}
			};
		};
		var getSize = function(image, name$$1) {
			if (image.style[name$$1]) {
				return Utils.removePixelSuffix(image.style[name$$1]);
			} else {
				return getAttrib(image, name$$1);
			}
		};
		var getSelectedImage = function(editor) {
			var imgElm = editor.selection.getNode();
			var figureElm = editor.dom.getParent(imgElm, 'figure.image');
			if (figureElm) {
				return editor.dom.select('img', figureElm)[0];
			}
			if (imgElm && (imgElm.nodeName !== 'IMG' || imgElm.getAttribute('data-mce-object') || imgElm.getAttribute(
					'data-mce-placeholder'))) {
				return null;
			}
			return imgElm;
		};

		var normalizeStyle = function(image, normalizeCss) {
			var attrValue = image.getAttribute('style');
			var value = normalizeCss(attrValue !== null ? attrValue : '');
			if (value.length > 0) {
				image.setAttribute('style', value);
				image.setAttribute('data-mce-style', value);
			} else {
				image.removeAttribute('style');
			}
		};
		var normalized = function(set, normalizeCss) {
			return function(image, name$$1, value) {
				set(image, value);
				normalizeStyle(image, normalizeCss);
			};
		};

		var normalizeCss = function(editor, cssText) {
			var css = editor.dom.styles.parse(cssText);
			var mergedCss = Utils.mergeMargins(css);
			var compressed = editor.dom.styles.parse(editor.dom.styles.serialize(mergedCss));
			return editor.dom.styles.serialize(compressed);
		};

		var readImageDataFromSelection = function(editor) {
			var image = getSelectedImage(editor);
			return image ? read(function(css) {
				return normalizeCss(editor, css);
			}, image) : defaultData();
		};

		function curry(fn) {
			var initialArgs = [];
			for (var _i = 1; _i < arguments.length; _i++) {
				initialArgs[_i - 1] = arguments[_i];
			}
			return function() {
				var restArgs = [];
				for (var _i = 0; _i < arguments.length; _i++) {
					restArgs[_i] = arguments[_i];
				}
				var all = initialArgs.concat(restArgs);
				return fn.apply(null, all);
			};
		}

		var deleteImage = function(editor, image) {
			if (image) {
				var elm = editor.dom.is(image.parentNode, 'figure.image') ? image.parentNode : image;
				editor.dom.remove(elm);
				editor.focus();
				editor.nodeChanged();
				if (editor.dom.isEmpty(editor.getBody())) {
					editor.setContent('');
					editor.selection.setCursorLocation();
				}
			}
		};

		var insertImageAtCaret = function(editor, data) {
			var elm = create(function(css) {
				return normalizeCss(editor, css);
			}, data);
			editor.dom.setAttrib(elm, 'data-mce-id', '__mcenew');
			editor.focus();
			editor.selection.setContent(elm.outerHTML);
			var insertedElm = editor.dom.select('*[data-mce-id="__mcenew"]')[0];
			editor.dom.setAttrib(insertedElm, 'data-mce-id', null);
			editor.selection.select(insertedElm);
		};

		var insertOrUpdateImage = function(editor, data) {
			var image = getSelectedImage(editor);
			if (image) {
				if (data.src) {
					writeImageDataToSelection(editor, data);
				} else {
					deleteImage(editor, image);
				}
			} else if (data.src) {
				insertImageAtCaret(editor, data);
			}
		};

		var updateProp = function(image, oldData, newData, name$$1, set) {
			if (newData[name$$1] !== oldData[name$$1]) {
				set(image, name$$1, newData[name$$1]);
			}
		};

		var write = function(normalizeCss, newData, image) {
			var oldData = read(normalizeCss, image);

			if (newData.src) {
				newData.src = newData.src.replace(/^\/media\/(.+)/i, addSignInSrc);
			}

			updateProp(image, oldData, newData, 'src', setAttrib);
			updateProp(image, oldData, newData, 'alt', setAttrib);
			updateProp(image, oldData, newData, 'title', setAttrib);
			updateProp(image, oldData, newData, 'width', setSize('width', normalizeCss));
			updateProp(image, oldData, newData, 'height', setSize('height', normalizeCss));
			updateProp(image, oldData, newData, 'class', setAttrib);
			updateProp(image, oldData, newData, 'style', normalized(function(image, value) {
				return setAttrib(image, 'style', value);
			}, normalizeCss));
			updateProp(image, oldData, newData, 'hspace', normalized(setHspace, normalizeCss));
			updateProp(image, oldData, newData, 'vspace', normalized(setVspace, normalizeCss));
			//updateProp(image, oldData, newData, 'border', normalized(setBorder, normalizeCss));
			//updateProp(image, oldData, newData, 'borderStyle', normalized(setBorderStyle, normalizeCss));
		};
		var writeImageDataToSelection = function(editor, data) {
			var image = getSelectedImage(editor);
			write(function(css) {
				return normalizeCss(editor, css);
			}, data, image);
			editor.dom.setAttrib(image, 'src', image.getAttribute('src'));

			editor.selection.select(image);
			Utils.waitLoadImage(editor, data, image);

		};
		var updateVSpaceHSpaceBorder = function(editor) {
			return function(evt) {
				var dom = editor.dom;
				var rootControl = evt.control.rootControl;
				var data = rootControl.toJSON();
				var css = dom.parseStyle(data.style);
				rootControl.find('#vspace').value('');
				rootControl.find('#hspace').value('');
				css = Utils.mergeMargins(css);
				if (css['margin-top'] && css['margin-bottom'] || css['margin-right'] && css['margin-left']) {
					if (css['margin-top'] === css['margin-bottom']) {
						rootControl.find('#vspace').value(Utils.removePixelSuffix(css['margin-top']));
					} else {
						rootControl.find('#vspace').value('');
					}
					if (css['margin-right'] === css['margin-left']) {
						rootControl.find('#hspace').value(Utils.removePixelSuffix(css['margin-right']));
					} else {
						rootControl.find('#hspace').value('');
					}
				}
				/*if (css['border-width']) {
					rootControl.find('#border').value(Utils.removePixelSuffix(css['border-width']));
				} else {
					rootControl.find('#border').value('');
				}
				if (css['border-style']) {
					rootControl.find('#borderStyle').value(css['border-style']);
				} else {
					rootControl.find('#borderStyle').value('');
				}*/
				rootControl.find('#style').value(dom.serializeStyle(dom.parseStyle(dom.serializeStyle(css))));
			};
		};

		var merge = function() {
			var objects = new Array(arguments.length);
			for (var i = 0; i < objects.length; i++)
				objects[i] = arguments[i];
			if (objects.length === 0)
				throw new Error('Can\'t merge zero objects');
			var ret = {};
			for (var j = 0; j < objects.length; j++) {
				var curObject = objects[j];
				for (var key in curObject)
					if (hasOwnProperty.call(curObject, key)) {
						ret[key] = curObject[key];
					}
			}
			return ret;
		};

		var setAttrib = function(image, name$$1, value) {
			image.setAttribute(name$$1, value);
		};

		var submitForm = function(editor, evt) {
			var win = evt.control.getRoot();
			SizeManager.updateSize(win);
			editor.undoManager.transact(function() {
				var data = merge(readImageDataFromSelection(editor), win.toJSON());
				insertOrUpdateImage(editor, data);
			});
			editor.editorUpload.uploadImagesAuto();
		};
		var getStyleValue = function(normalizeCss, data) {
			var image = document.createElement('img');
			setAttrib(image, 'style', data.style);
			if (getHspace(image) || data.hspace !== '') {
				setHspace(image, data.hspace);
			}
			if (getVspace(image) || data.vspace !== '') {
				setVspace(image, data.vspace);
			}


			return normalizeCss(image.getAttribute('style'));
		};
		var updateStyle = function(editor, win) {
			win.find('#style').each(function(ctrl) {
				var value = getStyleValue(function(css) {
					return normalizeCss(editor, css);
				}, merge(defaultData(), win.toJSON()));
				ctrl.value(value);
			});
		};
		var onSrcChange = function(evt, editor) {
			var srcURL;
			var meta = evt.meta || {};
			var control = evt.control;
			var rootControl = control.rootControl;

			_.each(meta, function(value, key) {
				rootControl.find('#' + key).value(value);
			});
			/*if (!meta.width && !meta.height) { // FIX ME
				srcURL = editor.convertURL(control.value(), 'src');
				//prependURL = Settings.getPrependUrl(editor);
				//absoluteURLPattern = new RegExp('^(?:[a-z]+:)?//', 'i');
				//if (prependURL && !absoluteURLPattern.test(srcURL) && srcURL.substring(0, prependURL.length) !== prependURL) {
				//	srcURL = prependURL + srcURL;
				//}
				control.value(srcURL);
				Utils.getImageSize(editor.documentBaseURI.toAbsolute(control.value()), function(data) {
					if (data.width && data.height) {
						rootControl.find('#width').value(data.width);
						rootControl.find('#height').value(data.height);
						SizeManager.syncSize(rootControl);
					}
				});
			}*/
		};
		var getGeneralItems = function(editor) {
			return [{
				name: 'src',
				type: 'filepicker',
				filetype: 'image',
				label: 'Source',
				autofocus: true,
				onchange: function(evt) {
					onSrcChange(evt, editor);
				},
				onbeforecall: function(evt) {
					evt.meta = evt.control.rootControl.toJSON();
				}
			}, {
				name: 'alt',
				type: 'textbox',
				label: 'Texte alternatif'
			}, {
				label: 'Style',
				name: 'style',
				type: 'textbox',
				onchange: updateVSpaceHSpaceBorder(editor)
			}, {
				type: 'form',
				layout: 'grid',
				packV: 'start',
				columns: 2,
				padding: 0,
				defaults: {
					type: 'textbox',
					maxWidth: 50,
					onchange: function(evt) {
						updateStyle(editor, evt.control.rootControl);
					}
				},
				items: [{
						label: 'Vertical space',
						name: 'vspace'
					},
					{
						label: 'Horizontal space',
						name: 'hspace'
					}
				]
			}, SizeManager.createUi(), {
				name: 'title',
				type: 'textbox',
				label: 'Titre'
			}, {
				name: 'class',
				type: 'textbox',
				label: 'Class'
			}];
		};

		return {
			open: function() {
				var win = editor.windowManager.open({
					title: 'Insert/edit image',
					data: readImageDataFromSelection(editor),
					body: getGeneralItems(editor),
					onSubmit: curry(submitForm, editor)
				});
				SizeManager.syncSize(win);
			}
		};
	}

	editor.addMenuItem('kimage', {
		icon: 'image',
		text: 'Image',
		onclick: Dialog(editor).open,
		context: 'insert',
		prependToContext: true
	});

});


/**
 * Generate HTML for file insertion
 *
 * @param {Backbone.Model} file
 * @param {Object} settings
 * @returns {string}
 */
function settingToHTML(file, settings) {
	var html = '';

	if (file.get('type') == 'image' &&
		settings.integration_type &&
		settings.integration_type == 'inline') {

		var handler = '';

		switch (settings.image_variant) {
			case 'g_vignette':
				handler = '/g_vignette';
				break;
			case 'vignette':
				handler = '/vignette';
				break;
			case 'g_miniature':
				handler = '/g_miniature';
				break;
			case 'miniature':
				handler = '/miniature';
				break;
		}

		var align = '';

		switch (settings.image_align) {
			case 'left':
			case 'right':
			case 'middle':
				align = settings.image_align;
				break;
		}

		html = '<img src="/media' + handler + '/' + file.get('media_id') + '" ' +
			((align != '') ? ' align="' + align + '" ' : '') +
			((settings.image_height != '' && !isNaN(parseFloat(settings.image_height))) ?
				' height="' + parseFloat(settings.image_height) + 'px" ' : '') +
			((settings.image_width != '' && !isNaN(parseFloat(settings.image_width))) ?
				' width="' + parseFloat(settings.image_width) + 'px" ' : '') +
			((settings.class != '') ? ' class="' + _.escape(settings.class) + '" ' : '') +
			' style="' +
			((settings.margin_top != '' && !isNaN(parseFloat(settings.margin_top))) ?
				' margin-top:' + parseFloat(settings.margin_top) + 'px;' : '') +
			((settings.margin_right != '' && !isNaN(parseFloat(settings.margin_right))) ?
				' margin-right:' + parseFloat(settings.margin_right) + 'px;' : '') +
			((settings.margin_left != '' && !isNaN(parseFloat(settings.margin_left))) ?
				' margin-left:' + parseFloat(settings.margin_left) + 'px;' : '') +
			((settings.margin_bottom != '' && !isNaN(parseFloat(settings.margin_bottom))) ?
				' margin-bottom:' + parseFloat(settings.margin_bottom) + 'px;' : '') +
			'"' +
			((settings.alt != '') ? ' alt="' + _.escape(settings.alt) + '" ' : '') + ' ' +
			((settings.title != '') ? ' title="' + _.escape(settings.title) + '" ' : '') +
			' ' +
			' />';
	} else {
		html = '<a';
		html += ' href="/media/' + file.get('media_id') + '" target="_blank"';
		if (settings.class) html += ' class="' + _.escape(settings.class) + '"';
		if (settings.title) html += ' title="' + _.escape(settings.title) + '"';
		html += '>Télécharger le fichier</a>';
	}

	var info_sup = [];
	if (settings.xtra_author) {
		// info_sup.push(' '); // TODO author
	}
	if (settings.xtra_file) {
		info_sup.push(file.get('original_name'));
	}
	if (settings.xtra_name) {
		info_sup.push(file.get('name'));
	}
	if (settings.xtra_modification) {
		info_sup.push(format.formatDateTime(this.model.get('modification_date')));
	}
	if (settings.xtra_weight) {
		info_sup.push(format.formatBytes(file.get('weight'), 2));
	}
	if (settings.xtra_size && file.get('type') == 'image') {
		info_sup.push('' + file.get('width') + ' x ' + file.get('height'));
	}
	if (info_sup.length > 0) html += ' (' + info_sup.join(' ') + ')';

	return html;
}


module.exports = Marionette.Behavior.extend({

	options: {
		selector: 'textarea[data-role="wysiwyg"]'
	},

	editorList: [],

	initialize: function(options) {
		this.mergeOptions(options);

		this.listenTo(WysiwygChannel, 'open:media', this.openMedia);
	},

	onDomRefresh: function() {

		// DOM nodes were thrown away, no other choice that destroying previous editors
		this.clearAllWysiwyg();

		var that = this;
		Backbone.$(this.options.selector, this.view.$el).each(function(index, target) {
			that.createWysiwyg(target).then(function(editors) {
				if (editors.length > 0) that.editorList.push(editors[0]);
			});
		});
	},

	/**
	 * Create a Wysisyg on targeted DOM Element. Check data attributs for customization
	 * 	 - data-wysiwyg-toolbar : [|mini]
	 *
	 * @param {Element} target
	 * @returns {Promise}
	 */
	createWysiwyg: function(target) {
		var plugins;
		var toolbar;

		var $target = Backbone.$(target);
		var adjusted_height = $target.height(); // Will remove toolbar height to match base textarea height
		switch ($target.data('wysiwyg-toolbar')) {
			case 'micro':
				plugins = [ /*'image'*/ , 'contextmenu', 'kiubi', 'lists', 'paste', 'link', 'charmap', 'code', 'wordpaste'];
				toolbar =
					'bold italic underline strikethrough | numlist bullist | pastetext | link unlink | kiubi_media | removeformat undo redo | code';
				adjusted_height -= 68;
				break;

			default:
				plugins = [ /*'image'*/ , 'contextmenu', 'kiubi', 'media', 'lists', 'paste', 'textcolor',
					'colorpicker', 'link', 'anchor', 'table', 'charmap', 'code', 'wordpaste'
				];
				toolbar = [
					'formatselect fontsizeselect | bold italic underline strikethrough superscript | alignleft aligncenter alignright alignjustify | forecolor backcolor | numlist bullist | outdent indent | pastetext | link unlink | kiubi_media media table | removeformat undo redo | code'
				];
				adjusted_height -= 102;
				break;
		}

		var that = this;

		return tinyMCE.init({
			target: target,
			height: adjusted_height,
			skin_url: '/vendor/tinymce/skins/lightgray',
			language: 'fr_FR',
			language_url: false,
			convert_urls: false,
			menu: {},
			custom_undo_redo_levels: 20,
			forced_root_block: false, // Beware, potential breaking
			block_formats: 'Paragraphe=p;Titre 1=h1;Titre 2=h2;Titre 3=h3;Titre 4=h4;Titre 5=h5;Titre 6=h6;Preformatted=pre;DIV=div',
			plugins: plugins,
			toolbar: toolbar,
			image_advtab: true,
			contextmenu: "link kimage", //"link image",
			fontsize_formats: '8px 10px 12px 14px 18px 24px 36px',
			branding: false,
			link_list: {
				types: this.link_types.bind(this),
				pages: this.link_pages.bind(this)
			},
			extended_valid_elements: 'style[type],script[language|type|src],span[*]',
			valid_children: "+body[style], +div[style], +span[*]",
			init_instance_callback: function(editor) {
				editor.on('Change', function(e) {
					that.view.triggerMethod('field:change');
				});
			}
		});
	},

	link_types: function(callback) {
		var p = new Page();
		p.getInternalLinkTypes().done(function(types) {
			callback(types.map(function(model) {
				return {
					value: model.get('value'),
					title: model.get('label')
				};
			}));
		});
	},

	link_pages: function(type, callback) {
		var p = new Page();
		p.getInternalLinkTargets(type).done(function(targets) {
			callback(_.map(targets, function(target) {
				var indent = '';
				if (target.depth && target.depth > 0) {
					for (var i = 0; i < target.depth; i++) {
						indent = '  ' + indent;
					}
				}
				return {
					value: target.url,
					text: indent + _.escape(target.name),
					disabled: (target.url == null)
				};
			}));
		});
	},

	clearAllWysiwyg: function() {
		_.each(this.editorList, function(editor) {
			tinymce.remove(editor);
		});
		this.editorList = [];
	},

	onBeforeDestroy: function() {
		this.clearAllWysiwyg();
	},

	onWysiwygSave: function() {
		_.each(this.editorList, function(editor) {
			editor.save();
		});
	},

	onBeforeSave: function() {
		this.onWysiwygSave();
	},

	/**
	 *
	 * @param {tinymce} editor
	 */
	openMedia: function(editor) {
		var match = _.find(this.editorList, function(match) {
			return match == editor;
		});
		if (match !== editor) return; // don't react to a editor from another behavior

		var collection = new Files();
		collection.folder_id = 2; // TODO Fix
		var model = new(new Files()).model();

		var contentView = new SelectModalView({
			collection: collection,
			model: model,
			type: 'file',
			folders: new Folders()
		});

		this.listenTo(contentView, 'close:modal', function() {
			this.setupMedia(editor, contentView.model);
		});

		this.listenTo(contentView, 'action:modal', function(view) {
			this.switchToPublish(editor, view.currentFolder);
		});

		var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
		navigationController.showInModal(contentView, {
			title: 'Médiathèque',
			modalClass: 'mediatheque modal-right',
			action: {
				title: 'Publier'
			}
		});
	},

	/**
	 *
	 * @param {tinymce} editor
	 * @param {Backbone.Model} file
	 */
	setupMedia: function(editor, file) {

		var contentView = new WysiwygModalView({
			model: file
		});

		this.listenTo(contentView, 'insert:file', function(settings) {
			editor.insertContent(settingToHTML(file, settings));
		});

		var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');
		navigationController.showInModal(contentView, {
			title: file.get('name'),
			modalClass: 'mediatheque modal-right',
			modalDialogClass: 'modal-lg',
			action: {
				title: 'Insérer'
			}
		});

	},

	/**
	 *
	 * @param {tinymce} editor
	 * @param {Number} currentFolder
	 */
	switchToPublish: function(editor, currentFolder) {
		var collection = new Files();
		collection.folder_id = currentFolder;
		var contentView = new PublishModalView({
			isMultiFiles: false,
			collection: collection
		});

		this.listenTo(contentView, 'uploaded:files', function(collection) {
			this.onUploadedFiles(editor, collection);
		});

		var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');

		navigationController.showInModal(contentView, {
			title: 'Médiathèque',
			modalClass: 'mediatheque modal-right',
			action: {
				title: 'Publier un fichier'
			}
		});

	},

	/**
	 *
	 * @param {tinymce} editor
	 * @param {Backbone.Collection} collection
	 */
	onUploadedFiles: function(editor, collection) {
		var uploadedList = collection.find(function(model) {
			return model.uploadProgression.status == 'done';
		});

		var navigationController = Backbone.Radio.channel('app').request('ctx:navigationController');

		if (!uploadedList) {
			navigationController.hideModal();
			return;
		}

		uploadedList.fetch()
			.done(function() {
				this.setupMedia(editor, uploadedList);
			}.bind(this))
			.fail(function() {
				navigationController.hideModal();
			});
	}

});
