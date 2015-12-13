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
        max = Math.max,
        ceil = Math.ceil,
        round = Math.round,
        floor = Math.floor,

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
            this.$container = this.$element.find(defaults.container);
            this.$imageCrop = this.$element.find(defaults.cropImg);

            this.$overlayCrop = $('<div style="top: 0px; left: 0px;" class="crop-overlay"></div>');

            this.containerWidth = parseFloat(this.$container.width());
            this.containerHeight = parseFloat(this.$container.height());

            this.imageNaturalWidth = this.$imageCrop.prop('naturalWidth');
            this.imageNaturalHeight = this.$imageCrop.prop('naturalHeight');

            this.percent = this.minPercent = max(this.imageNaturalWidth ? this.containerWidth / this.imageNaturalWidth : 1, this.imageNaturalHeight ? this.containerHeight / this.imageNaturalHeight : 1 );

            // image size
            this.imageCropWidth = ceil(this.imageNaturalWidth * this.minPercent);
            this.imageCropHeight = ceil(this.imageNaturalHeight * this.minPercent);


            // border
            var topBorder = $('<div class="border top" style="top:0px; height: '+defaults.offsetTop+'px; width:'+this.containerWidth+'px;"></div>'),
                bottomBorder = $('<div class="border bottom" style="top:'+(this.containerHeight - defaults.offsetBottom)+'px; height: '+defaults.offsetBottom+'px; width:'+this.containerWidth+'px;"></div>'),
                leftBorder = $('<div class="border left" style="top:'+defaults.offsetTop+'px; height: '+(this.containerHeight-defaults.offsetBottom-defaults.offsetTop)+'px; width:'+defaults.offsetLeft+'px;"></div>'),
                rightBorder = $('<div class="border right" style="top:'+defaults.offsetTop+'px; left:'+(this.containerWidth-defaults.offsetRight)+'px; height: '+(this.containerHeight-defaults.offsetTop-defaults.offsetBottom)+'px; width:'+defaults.offsetRight+'px;"></div>')
                ;

            this.$zoomIn = $('<a class="zoom-in"></a>');
            this.$zoomOut = $('<a class="zoom-out"></a>');

            var formatId = defaults.formatId;

            this.$outputWidth = $('<input class="crop-width" name="width['+formatId+']">');
            this.$outputHeigh = $('<input class="crop-height" name="height['+formatId+']">');
            this.$outputX = $('<input class="crop-x" name="x['+formatId+']">');
            this.$outputY = $('<input class="crop-y" name="y['+formatId+']">');

            var output = $('<div class="output"></div>');
            output.append(this.$outputWidth);
            output.append(this.$outputHeigh);
            output.append(this.$outputX);
            output.append(this.$outputY);

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
            this.$container.append(output);

            this.imagePosX = -this.imageCropWidth/2 + this.containerWidth/2;
            this.imagePosY = -this.imageCropHeight/2 + this.containerHeight/2;

            this.imagePosXatStartDrag = null;
            this.imagePosYatStartDrag  = null;

            this.$container.hover(function () {
                self.$container.toggleClass('hover');
            });

            //set image size
            this.updateImageSize();
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

        hasImageHeightMargin: function (y, imageCropHeight) {
            var defaults = this.defaults;

            if (y - defaults.offsetTop >= 0 || imageCropHeight + y <= this.containerHeight - defaults.offsetBottom) {
                return false;
            }

            return true;
        },

        hasImageWidthMargin: function (x, imageCropWidth) {
            var defaults = this.defaults;

            if (x - defaults.offsetLeft >= 0 || imageCropWidth + x <= this.containerWidth - defaults.offsetRight) {
                return false;
            }

            return true;
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
            if (!this.movement) {
                return ;
            }
            var offset = this.getOffset(),
                relX = e.pageX - offset.left,
                relY = e.pageY - offset.top
                ;

            if (this.containerWidth < relX || this.containerHeight < relY) {
                return ;
            }

            var moveX = this.imagePosXatStartDrag + relX - this.startMoveX,
                moveY = this.imagePosYatStartDrag + relY - this.startMoveY
                ;

            if (this.hasImageHeightMargin(moveY, this.imageCropHeight)) {
                this.imagePosY = moveY;
            }

            if (this.hasImageWidthMargin(moveX, this.imageCropWidth)) {
                this.imagePosX = moveX;
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
            var defaults = this.defaults,
                imageCropWidth = ceil(this.imageNaturalWidth * percent),
                imageCropHeight = ceil(this.imageNaturalHeight * percent)
                ;

            if (this.hasImageHeightMargin(this.imagePosY, imageCropHeight) && this.hasImageWidthMargin(this.imagePosX, imageCropWidth)){
                this.imageCropWidth = imageCropWidth;
                this.imageCropHeight = imageCropHeight;
                this.percent = percent;

                this.updateImageSize();
            }
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

            this.updateOutput();
        },

        updateImageSize: function () {
            this.$imageCrop.width(this.imageCropWidth);
            this.$imageCrop.height(this.imageCropHeight);

            this.updateOutput();
        },

        updateOutput: function() {
            this.$outputWidth.val((round( (this.containerWidth-this.defaults.offsetRight-this.defaults.offsetLeft) / this.percent )).toString());
            this.$outputHeigh.val((round( (this.containerHeight-this.defaults.offsetTop-this.defaults.offsetBottom) / this.percent )).toString());
            this.$outputX.val((-floor((this.imagePosX-this.defaults.offsetLeft)/this.percent)).toString());
            this.$outputY.val((-floor((this.imagePosY-this.defaults.offsetBottom)/this.percent)).toString());
        }
    };

    ImageCrop.defaults = {
        formatId:         0,
        width:            500,
        height:           500,
        offsetLeft:       0,
        offsetRight:      0,
        offsetTop:        0,
        offsetBottom:     0,
        cropImg:          '.crop-img',
        container:        '.crop-container',
        zoom:             250,
        usageMessageInfo: 'Drag to move, use +/- buttons to zoom'
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
