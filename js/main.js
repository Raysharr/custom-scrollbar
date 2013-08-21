(function ($) {
    
    // Initialize customScrollbar plugin
    $('.scroll-pane-wrapper').customScrollbar({
        scrollPaneClass: '.scroll-pane',
        scrollPaneContentClass: '.scroll-pane-content',
        scrollRailClass: '.scroll-rail',
        scrollDraggerClass: '.scroll-dragger',
        scrollStep: 20, // pane scroll step
        scrollType: 'click',
        debug: true
    });

})(jQuery);