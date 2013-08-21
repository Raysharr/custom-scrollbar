// Object.create shim
(function ($) {
    if (typeof Object.create !== 'function') {
        Object.create = function (obj) {
            function F(){}
            F.prototype = obj;
            return new F();
        };
    }
})(jQuery);

(function ($, d, w) {

    var CustomScrollbar = {
        init: function (options, el) {
            var base = this;

            base.$el = $(el); // jQuery object
            base.el = el; // Pure js object

            base.options = $.extend({}, $.fn.customScrollbar.options, options);

            // Create scrollbar
            base.createCustomScrollElement();
            base.prependCustomScrollElementToPane();

            // Prepare instance variables
            base.cache();

            // Register events
            base.bindEvents();

            // Subscribe custom events
            base.subscribtions();

            if (base.isMobile()) {
                base.setElWidth(base.$scrollRail, 3, base);
            }

            // Debug mode check
            if (base.options.debug === true) console.log('init function loaded assets');
        },

        bindEvents: function () {
            var base = this;

            // Debug mode check
            if (base.options.debug === true) console.log('customScrollbar bindEvents method fired');

            // Register click event. Click occurs on rail.
            base.$scrollRail.on('click', function (e) {
                base.clickOnRailHandler(e, base);
            });

            // Register event only if device is not mobile
            if (!base.isMobile()) {
                // Register scroll event
                base.$el.on('mousewheel DOMMouseScroll', function (e) {
                    base.scrollHandler(e, base);

                    // Fix for all page scrolling not only scrolled container
                    e.preventDefault();
                });

                // Register mousedown event
                base.$scrollDragger.on('mousedown', function (e) {
                    base.mousedownHandler(e, base);
                });

                // Register mouseup event
                $(d).on('mouseup', function (e) {
                    base.removeEvent($(d), 'mousemove');
                });                
            }

            $(w).on('resize', function () {
                base.resizeHandler(base);
            });
        },

        subscribtions: function () {
            var base = this;

            $.subscribe('paneHeightIncreased/customScrollbar', function () {
                base.updatePaneAndDraggerPos(base);
            });
        },

        cache: function () {
            var base = this;

            // Debug mode check
            if (base.options.debug === true) console.log('customScrollbar cache method fired');

            // INSTANCE VARIABLES
            // Pane variables
            base.$scrollPane = base.$el.find(base.options.scrollPaneClass);
            base.scrollPaneH = base.$scrollPane.height();

            // Pane content variables
            base.contentPaneOffsetTop = 0;
            base.$scrollPaneContent = base.$el.find(base.options.scrollPaneContentClass);
            base.scrollPaneContentH = base.$scrollPaneContent.height();

            // Dragger variables
            base.draggerOffsetTop = 0;

            base.$scrollRail = base.$scrollPane.find(base.options.scrollRailClass);
            base.$scrollDragger = base.$scrollPane.find(base.options.scrollDraggerClass);
            base.draggerOffsetFromBody = base.$scrollDragger.offset().top - $('body').offset().top + parseInt($('body').css('margin-top'));
            base.scrollDraggerH = base.$scrollDragger.height();
            base.scrollRailOffsetPos = base.$scrollRail.offset();

            base.draggerShiftFactor = (base.scrollPaneContentH - base.scrollPaneH) / base.scrollPaneH;
            base.draggerShift = base.options.scrollStep / base.draggerShiftFactor;
            base.draggerStepCount = base.scrollPaneH / base.draggerShift;
            base.draggerStepDiff = base.draggerShift - (base.scrollDraggerH / base.draggerStepCount);

            base.mouseMoveOffsetDiff = 0;
        },

        // Handlers methods
        scrollHandler: function (e, base) {
            var delta = base.getScrollDelta(e);

            base.updatePositionOnScroll(base, delta);
        },

        clickOnRailHandler: function (e, base) {
            var clickRelTopPos = e.pageY - base.scrollRailOffsetPos.top,
                scrollType = base.options.scrollType;

                base.updatePositionOnClick(scrollType, clickRelTopPos, e, base);
        },

        mousedownHandler: function (e, base) {
            var $this = $(e.currentTarget),
                startDraggerOffset = e.offsetY,
                draggerToContentPaneFactor = 0;

            $(d).on('mousemove', function (e) {
                base.mousemoveHandler(e, base, startDraggerOffset, $this);
            });

            e.preventDefault();
        },

        mousemoveHandler: function (e, base, startDraggerOffset, dragger) {
            base.draggerOffsetTop = e.pageY - base.draggerOffsetFromBody - startDraggerOffset;
            base.draggerOffsetTop = base.getValueFromRange(0, base.scrollPaneH - base.scrollDraggerH, base.draggerOffsetTop);

            base.contentPaneOffsetTop = base.getRelativePaneContentShift(base.draggerOffsetTop);

            base.setElementTopPosition(dragger, base.draggerOffsetTop);
            base.setElementTopPosition(base.$scrollPaneContent, base.contentPaneOffsetTop);
        },

        resizeHandler: function (base) {
            base.updatePaneAndDraggerPos(base);
        },

        updatePaneAndDraggerPos: function (base) {
            // Update instance variables
            base.scrollPaneContentH = base.$scrollPaneContent.height();
            base.draggerShiftFactor = (base.scrollPaneContentH - base.scrollPaneH) / base.scrollPaneH;
            base.draggerShift = base.options.scrollStep / base.draggerShiftFactor;
            base.draggerStepCount = base.scrollPaneH / base.draggerShift;
            base.draggerStepDiff = base.draggerShift - (base.scrollDraggerH / base.draggerStepCount);

            // Get relative pane content position (offset top)
            base.contentPaneOffsetTop = base.getRelativePaneContentShift(base.draggerOffsetTop);

            // Set pane content and dragger positions
            base.setElementTopPosition(base.$scrollDragger, base.draggerOffsetTop);
            base.setElementTopPosition(base.$scrollPaneContent, base.contentPaneOffsetTop);
        },

        // Logic methods
        createCustomScrollElement: function () {
            var base = this;

            base.scrollRail = $('<div />', { 'class': base.getClassName(base.options.scrollRailClass) }),
            base.scrollDragger = $('<div />', { 'class': base.getClassName(base.options.scrollDraggerClass) });

            base.scrollRail.prepend(base.scrollDragger);
        },

        prependCustomScrollElementToPane: function () {
            var base = this;

            base.$el.find(base.options.scrollPaneClass).prepend(base.scrollRail);
        },

        updatePositionOnScroll: function (base, delta) {
            // Increment or decrement scroll pane content top
            // property depend on mouse wheel delta value
            base.contentPaneOffsetTop = (delta > 0) ? base.contentPaneOffsetTop += base.options.scrollStep : base.contentPaneOffsetTop -= base.options.scrollStep;

            // Increment or decrement scroll dragger top
            // property depend on mouse wheel delta value
            base.draggerOffsetTop = (delta > 0) ? base.draggerOffsetTop -= base.draggerStepDiff : base.draggerOffsetTop += base.draggerStepDiff;

            // Get scroll pane content top property from range
            // from 0 to height diffrence from scroll pane content
            // and scroll pane
            base.contentPaneOffsetTop = base.getValueFromRange(base.scrollPaneH - base.scrollPaneContentH, 0, base.contentPaneOffsetTop);

            // Get scroll dragger top property from range
            // from 0 to height diff from scroll pane content
            // and scroll pane
            base.draggerOffsetTop = base.getValueFromRange(0, base.scrollPaneH - base.scrollDraggerH, base.draggerOffsetTop);

            // Set pane content and dragger positions
            base.setElementTopPosition(base.$scrollPaneContent, base.contentPaneOffsetTop);
            base.setElementTopPosition(base.$scrollDragger, base.draggerOffsetTop);
        },

        updatePositionOnClick: function (scrollType, clickRelTopPos, e, base) {
            if (scrollType === 'click') {
                if ( e.target.className !== base.$scrollDragger.attr('class') ) {
                    // Get scroll dragger top property from range
                    // from 0 to height diff from scroll pane
                    // and clicked position on rail
                    base.draggerOffsetTop = base.getValueFromRange(0, base.scrollPaneH - base.scrollDraggerH, clickRelTopPos);

                    base.contentPaneOffsetTop = base.getRelativePaneContentShift(base.draggerOffsetTop);

                    // Set pane content and dragger positions
                    base.setElementTopPosition(base.$scrollDragger, base.draggerOffsetTop);
                    base.setElementTopPosition(base.$scrollPaneContent, base.contentPaneOffsetTop);
                }
            } else if (scrollType === 'step') {
                if ( e.target.className !== base.$scrollDragger.attr('class') ) {
                    if (clickRelTopPos > base.draggerOffsetTop) {
                        base.draggerOffsetTop += base.scrollDraggerH;
                    } else if (clickRelTopPos < base.draggerOffsetTop) {
                        base.draggerOffsetTop -= base.scrollDraggerH;
                    }

                    // Get scroll dragger top property from range
                    // from 0 to height diff from scroll pane
                    // and clicked position on rail
                    base.draggerOffsetTop = base.getValueFromRange(0, base.scrollPaneH - base.scrollDraggerH, base.draggerOffsetTop);

                    base.contentPaneOffsetTop = base.getRelativePaneContentShift(base.draggerOffsetTop);

                    // Set pane content and dragger positions
                    base.setElementTopPosition(base.$scrollDragger, base.draggerOffsetTop);
                    base.setElementTopPosition(base.$scrollPaneContent, base.contentPaneOffsetTop);
                }
            }
        },

        // Helper methods
        setElementTopPosition: function (el, offset) {
            el.css({ 'top' : offset });
        },

        getValueFromRange: function (startVal, endVal, curVal) {
            return Math.max(startVal, Math.min(endVal, curVal));
        },

        isMobile: function () {
            // Very simple check if browser is mobile
            return !!navigator.userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile/i);
        },

        setElWidth: function (el, multiplier, base) {
            el.css({ width : el.width() * multiplier });
        },

        getRelativePaneContentShift: function (draggerOffsetTop) {
            var base = this;

            // Calculate dragger shift factor from dragger
            // offset top to diff from scroll pane and
            // scroll dragger height
            draggerToContentPaneFactor = base.draggerOffsetTop / (base.scrollPaneH - base.scrollDraggerH);

            // Get scroll pane top property from range
            // from scroll pane height and zero value
            base.contentPaneOffsetTop = base.getValueFromRange(base.scrollPaneH - base.scrollPaneContentH, 0, draggerToContentPaneFactor * (base.scrollPaneH - base.scrollPaneContentH));

            return base.contentPaneOffsetTop;
        },

        removeEvent: function (el, event) {
            el.off(event);
        },

        getClassName: function (classString) {
            return classString.split('.').join('');
        },

        getScrollDelta: function (e) {
            // Return correct value for gte IE7,
            // Firefox, Chrome, Opera, Safari (tested only for this browsers)
            return Math.max( -1, Math.min(1, e.originalEvent.wheelDelta || -(e.originalEvent.detail) ));
        }
    };

    $.fn.customScrollbar = function (options) {
        this.each(function () {
            var customScrollbar = Object.create(CustomScrollbar);
            customScrollbar.init(options, this);
        });
    };

    $.fn.customScrollbar.options = {
        scrollPaneClass: '.scroll-pane',
        scrollPaneContentClass: '.scroll-pane-content',
        scrollRailClass: '.scroll-rail',
        scrollDraggerClass: '.scroll-dragger',
        // pane scroll step
        scrollStep: 20,
        // SCROLL TYPE OPTIONS:
        // - step:  scroll move one dragger height value in the desired direction,
        // - click: scroll move to click position
        scrollType: 'click',
        // Only for debuging if function is triggered
        debug: true
    };

})(jQuery, document, window);