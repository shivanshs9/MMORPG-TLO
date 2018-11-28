/*:
 * @plugindesc v0.03 Allows the usage of an animated imagestrip for the loading screen, instead of a static image.
 * <Iavra Loading>
 * @author Iavra
 *
 * @param Image
 * @desc Path to the image file to be used, relative to the project root.
 * @default img/system/Loading.png
 *
 * @param Background
 * @desc Optional background image to be displayed behind the loading image.
 * @default
 *
 * @param Frames
 * @desc Number of frames to be used. If this number is greater than 1, the image is split vertically.
 * @default 1
 *
 * @param Interval
 * @desc Delay (in frames), before switching to the next image frame. Set to 0 to disable interval behaviour.
 * @default 60
 *
 * @param X
 * @desc The loading image's x coordinate. Negative values start on the right. Set to a non-integer to center.
 * @default center
 *
 * @param Y
 * @desc The loading image's y coordinate. Negative values start at the bottom. Set to a non-integer to center.
 * @default center
 *
 * @help
 * Use the plugin parameter "Image" to specify the image file to be used. It may be treated as a horizontal imagestrip
 * by setting the "Frames" parameter to the number of frames.
 *
 * The optional "Background" parameter can be used to display another, static image behind the (possibly animated)
 * loading image. It will automatically be scaled to fit the screen.
 *
 * The "Interval" parameter can be used to set the number of frames to wait, before switching to the next image frame.
 *
 * Use the "X" and "Y" parameter to specify the image's position, anchored on its upper left corner. Negative values
 * will start the right/bottom side of the screen, instead of the left/top side. A value of 0 or -0 can be used to snap
 * the image to the corresponding side. Giving a non-integer value will center the image.
 */

(function($, undefined) {
    "use strict";

    var _params = $plugins.filter(function(p) { return p.description.contains('<Iavra Loading>'); })[0].parameters;
    var _param_image = _params['Image'];
    var _param_background = _params['Background'];
    var _param_frames = Math.max(1, _params['Frames']|0);
    var _param_interval = Math.max(0, _params['Interval']|0);

    /**
     * Basic helper function to extend objects. Mainly used for inheritance and other prototype-related operations.
     */
    $._extend || ($._extend = function(b, e) { for(var k in e) { b[k] = e[k]; } return b; });

    /**
     * Some variables used to cache stuff and calculate the current image state.
     */
    var _x = _params['X'], _y = _params['Y'], _cx = _x != (_x|0), _cy = _y != (_y|0), _w, _h, _t = 0, _r = false;

    /**
     * Loads the background image, if any.
     */
    var loadBackground = function(src) {
        if(!src) { return; }
        Graphics._loadingBack = new Image();
        Graphics._loadingBack.src = src;
    };

    /**
     * Loads the loading image, if any, splits it into frames and caches some values to be used during rendering.
     */
    var loadImage = function(src) {
        if(!src) { return; }
        var img = new Image();
        img.src = src;
        img.onload = function(img) { _w = img.width / _param_frames, _h = img.height, _r = true; }.bind(null, img);
        img.onerror = function() { throw new Error("Error loading '" + src + "'."); };
        Graphics._loadingImage = img;
    };

    /**
     * Draws the background image, if any.
     */
    var drawBackground = function(context, img) {
        if(img) { context.drawImage(img, 0, 0, Graphics.width, Graphics.height); }
    };

    /**
     * Calculates the image offset and current frame and draws it onto the screen.
     */
    var drawImage = function(context, img) {
        if(img && _r) {
            var dx = _cx ? (Graphics.width - _w) / 2 : (1/_x < 0 ? Graphics.width - _w -_x : _x);
            var dy = _cy ? (Graphics.height - _h) / 2 : (1/_y < 0 ? Graphics.height - _h - _y : _y);
            var f = _param_interval ? (_t++ / _param_interval % _param_frames)|0 : 0;
            context.drawImage(img, _w * f, 0, _w, _h, dx, dy, _w, _h);
        }
    };

    //=============================================================================
    // Graphics
    //=============================================================================

    var alias_graphics_startLoading = Graphics.startLoading;

    $._extend(Graphics, {

        /**
         * When starting to load, also reset the timer, which is used to determine the currently shown image frame.
         */
        startLoading: function() {
            alias_graphics_startLoading.call(this);
            _t = 0;
        },

        /**
         * Ignore the default parameter passed to this function and load both of our images.
         */
        setLoadingImage: function() {
            loadBackground(_param_background);
            loadImage(_param_image);
        },

        /**
         * Delegate to our drawing functions to update the loading screen.
         */
        _paintUpperCanvas: function() {
            this._clearUpperCanvas();
            if(this._loadingCount >= 20) {
                var context = this._upperCanvas.getContext('2d');
                context.save();
                context.globalAlpha = ((this._loadingCount - 20) / 30).clamp(0, 1);
                drawBackground(context, this._loadingBack);
                drawImage(context, this._loadingImage);
                context.restore();
            }
        }

    });

})(this.IAVRA || (this.IAVRA = {}));