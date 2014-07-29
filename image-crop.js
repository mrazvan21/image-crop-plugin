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

            //create element
            var container = this.$element.find(defaults.container),
                imageCrop = this.$element.find(defaults.cropImg),
                overlayCrop = this.$element.find(defaults.overlayCrop);

            var containerWidth = parseFloat(container.width()),
                containerHeight = parseFloat(container.height()),
                imageCropWidth = parseFloat(imageCrop.width()),
                imageCropHeight = parseFloat(imageCrop.height());

            // border
            var topBorder = $('<div class="border top" style="top:0px; height: '+defaults.offsetTop+'px; width:'+containerWidth+'px;"></div>'),
                bottomBorder = $('<div class="border bottom" style="top:'+(containerHeight - defaults.offsetBottom)+'px; height: '+defaults.offsetBottom+'px; width:'+containerWidth+'px;"></div>'),
                leftBorder = $('<div class="border left" style="top:'+defaults.offsetTop+'px; height: '+(containerHeight-defaults.offsetBottom-defaults.offsetTop)+'px; width:'+defaults.offsetLeft+'px;"></div>'),
                rightBorder = $('<div class="border right" style="top:'+defaults.offsetTop+'px; left:'+(containerWidth-defaults.offsetRight)+'px; height: '+(containerHeight-defaults.offsetTop-defaults.offsetBottom)+'px; width:'+defaults.offsetRight+'px;"></div>');

            container.append(topBorder);
            container.append(bottomBorder);
            container.append(leftBorder);
            container.append(rightBorder);

            this.imagePosX = -imageCropWidth/2 + containerWidth/2;
            this.imagePosY = -imageCropHeight/2 + containerHeight/2;

            this.$container = container;
            this.$imageCrop = imageCrop;
            this.$overlayCrop = overlayCrop;

            this.containerWidth = containerWidth;
            this.containerHeight = containerHeight;
            this.imageCropWidth = imageCropWidth;
            this.imageCropHeight = imageCropHeight;

            // image default position
            this.updateImagePosition();

            this.addListener();
        },

        addListener: function () {
            this.$overlayCrop.on({
                "mouseup": $.proxy(this.mouseup, this),
                "mousedown": $.proxy(this.mousedown, this),
                "mousemove": $.proxy(this.mousemove, this)
            });
        },

        mouseup: function (e) {
            this.reset();
        },

        mousedown: function (e) {
            var offset = this.getOffset();

            this.startMoveX = e.pageX - offset.left;
            this.startMoveY = e.pageY - offset.top;

            this.movement = true;
        },

        mousemove: function (e) {
            var offset = this.getOffset();
            var defaults = this.defaults;

            var relX = e.pageX - offset.left,
                relY = e.pageY - offset.top;

            if (!this.movement || this.containerWidth < relX || this.containerHeight < relY) {
                return;
            }

            var moveX = relX - this.startMoveX,
                moveY = relY - this.startMoveY;

            var mousePercentX = moveX / this.containerWidth * 30,
                mousePercentY = moveY / this.containerHeight * 30;

            moveX = this.imagePosX + mousePercentX;
            moveY = this.imagePosY + mousePercentY;

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
    };

    ImageCrop.defaults = {
        offsetLeft:   0,
        offsetRight:  0,
        offsetTop:    0,
        offsetBottom: 0,
        cropImg:      '.crop-img',
        overlayCrop:  '.crop-overlay',
        container:    '.crop-container'
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

