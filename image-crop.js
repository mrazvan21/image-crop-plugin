/*!
* Image crop  v0.1.0
* https://github.com/mrazvan92/image-crop-plugin
*
* Copyright 2014 Razvan Moldovan - m.razvan92@gmail.com
* Released under the MIT license
*/

(function (factory) {
    if (typeof define === "function" && define.amd) {
        // AMD. Register as anonymous module.
        define(["jquery"], factory);
    } else {
        // Browser globals.
        factory(jQuery);
    }
})(function ($) {

    "use strict";

    var $window = $(window),
        abs = Math.abs,

        // Constructor
        ImageCrop = function (element, options) {
            this.$element = $(element);
            this.setDefaults(options);
            this.init();
        };


    ImageCrop.prototype = {
        construstor: ImageCrop,

        setDefaults: function (options) {
            options = $.extend({}, ImageCrop.defaults, options);
            this.defaults = options;
        },

        getOffset: function () {
            return this.$overlayCrop.offset();
        },

        init: function () {
            this.reset();
            this.build();
        },

        build: function() {
            var defaults = this.defaults;
            var self = this;

            //create element
            this.$container = this.$element.find(defaults.container),
            this.$imageCrop = this.$element.find(defaults.cropImg);

            this.$overlayCrop = $('<div style="top: 0px; left: 0px;" class="crop-overlay"></div>');

            this.containerWidth = parseFloat(this.$container.width()),
            this.containerHeight = parseFloat(this.$container.height());

            this.imageNaturalWidth = this.$imageCrop.prop('naturalWidth'),
            this.imageNaturalHeight = this.$imageCrop.prop('naturalHeight');

            this.percent = 0;
            this.minPercent = Math.max(this.imageNaturalWidth ? this.containerWidth / this.imageNaturalWidth : 1, this.imageNaturalHeight ? this.containerHeight / this.imageNaturalHeight : 1 );

            // image size
            this.imageCropWidth = Math.ceil(this.imageNaturalWidth * this.minPercent);
            this.imageCropHeight = Math.ceil(this.imageNaturalHeight * this.minPercent);
            //set image size
            this.updateImageSize();

            // border
            var topBorder = $('<div class="border top" style="top:0px; height: '+defaults.offsetTop+'px; width:'+this.containerWidth+'px;"></div>'),
                bottomBorder = $('<div class="border bottom" style="top:'+(this.containerHeight - defaults.offsetBottom)+'px; height: '+defaults.offsetBottom+'px; width:'+this.containerWidth+'px;"></div>'),
                leftBorder = $('<div class="border left" style="top:'+defaults.offsetTop+'px; height: '+(this.containerHeight-defaults.offsetBottom-defaults.offsetTop)+'px; width:'+defaults.offsetLeft+'px;"></div>'),
                rightBorder = $('<div class="border right" style="top:'+defaults.offsetTop+'px; left:'+(this.containerWidth-defaults.offsetRight)+'px; height: '+(this.containerHeight-defaults.offsetTop-defaults.offsetBottom)+'px; width:'+defaults.offsetRight+'px;"></div>');

            this.$zoomIn = $('<a class="zoom-in"></a>'),
            this.$zoomOut = $('<a class="zoom-out"></a>');

            //controlls - zoom in, zoom out
            var controlls = $('<div class="crop-controlls"><span>'+defaults.usageMessageInfo+'</span></div>');

            controlls.append(this.$zoomIn);
            controlls.append(this.$zoomOut);

            this.$container.append(this.$overlayCrop);

            this.$container.append(topBorder);
            this.$container.append(bottomBorder);
            this.$container.append(leftBorder);
            this.$container.append(rightBorder);

            this.$container.append(controlls);

            this.imagePosX = -this.imageCropWidth/2 + this.containerWidth/2;
            this.imagePosY = -this.imageCropHeight/2 + this.containerHeight/2;

            this.imagePosXatStartDrag = null;
            this.imagePosYatStartDrag  = null;

            this.$container.hover(function () {
                self.$container.toggleClass('hover');
            });

            // image default position
            this.updateImagePosition();

            this.addListener();
        },

        addListener: function () {
            this.$overlayCrop.on({
                "mousedown": $.proxy(this.mousedown, this),
                "mousemove": $.proxy(this.drag, this)
            });

            $(document).on({
                "mouseup": $.proxy(this.mouseup, this)
            });

            this.$zoomIn.on({
                "click": $.proxy(this.zoomIn, this)
            });

            this.$zoomOut.on({
                "click": $.proxy(this.zoomOut, this)
            });
        },

        mouseup: function (e) {
            this.reset();
        },

        mousedown: function (e) {
            var offset = this.getOffset();

            this.startMoveX = e.pageX - offset.left;
            this.startMoveY = e.pageY - offset.top;

            //set image pos at start move
            this.imagePosXatStartDrag = this.imagePosX;
            this.imagePosYatStartDrag = this.imagePosY;

            this.movement = true;
        },

        drag: function (e) {
            var offset = this.getOffset();
            var defaults = this.defaults;

            var relX = e.pageX - offset.left,
                relY = e.pageY - offset.top;

            if (!this.movement || this.containerWidth < relX || this.containerHeight < relY) {
                return;
            }

            var moveX = this.imagePosXatStartDrag + relX - this.startMoveX,
                moveY = this.imagePosYatStartDrag + relY - this.startMoveY;

            if (moveX - defaults.offsetLeft < 0 &&
                ((Math.abs(moveX) - defaults.offsetRight) < (this.imageCropWidth - this.containerWidth))) {
                this.imagePosX = moveX;
            }

            if (moveY - defaults.offsetTop < 0 &&
               ((Math.abs(moveY) - defaults.offsetBottom) < (this.imageCropHeight - this.containerHeight))) {
                this.imagePosY = moveY;
            }

            this.updateImagePosition();
        },

        zoomIn  : function () {
            return !! this.zoom( this.percent + 1 / ( this.defaults.zoom - 1 || 1 ) );
        },

        zoomOut  : function () {
            return !! this.zoom( this.percent - 1 / ( this.defaults.zoom - 1 || 1 ) );
        },

        zoom: function ( percent ) {

            this.percent = Math.max( this.minPercent, percent);

            var oldImageCropWidth = this.imageCropWidth;
            var oldImageCropHeight = this.imageCropHeight;

            this.imageCropWidth = Math.ceil(this.imageNaturalWidth * this.percent);
            this.imageCropHeight = Math.ceil(this.imageNaturalHeight * this.percent);

            this.updateImageSize();
        },

        reset: function () {
            this.movement = false;
            this.startMoveX = this.startMoveY = null;
        },

        updateImagePosition: function () {
            this.$imageCrop.css({
                'top': this.imagePosY,
                'left': this.imagePosX
            });
        },

        updateImageSize: function () {
            this.$imageCrop.width(this.imageCropWidth);
            this.$imageCrop.height(this.imageCropHeight);
        }
    };

    ImageCrop.defaults = {
        width:          500,
        height:         500,
        offsetLeft:       0,
        offsetRight:      0,
        offsetTop:        0,
        offsetBottom:     0,
        cropImg:          '.crop-img',
        container:        '.crop-container',
        zoom:             250,
        usageMessageInfo: 'Drag to move, scroll to zoom'
    };

    ImageCrop.setDefaults = function (options) {
        $.extend(ImageCrop.defaults, options);
    };

    // Reference the old imageCrop
    ImageCrop.other = $.fn.imageCrop;

     // Register as jQuery plugin
    $.fn.imageCrop = function (options) {

        this.each(function () {
            var $this = $(this),
                data = $this.data("imageCrop");

            $this.data("imageCrop", (data = new ImageCrop(this, options)));
        });

        return (typeof result !== "undefined" ? result : this);
    };

    $.fn.imageCrop.constructor = ImageCrop;
    $.fn.imageCrop.setDefaults = ImageCrop.setDefaults;

    // No conflict
    $.fn.imageCrop.noConflict = function () {
        $.fn.imageCrop = ImageCrop.other;
        return this;
    };
});
