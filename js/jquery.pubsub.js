(function($) {
    var o = $( {} );

    $.each({
        on: 'subscribe',
        trigger: 'publish',
        off: 'unsubscribe'
    }, function( key, api ) {
        $[api] = function() {
            o[key].apply( o, arguments );
        };
    });
})(jQuery);