//food-plugin.js

(function ( $ ) {
    $.fn.greenify = function() {
        this.css( "color", "green" );
        return this;
    };
 
    $.fn.reddy = function() {
        this.css( "color", "red" );
        return this;
    };
/*
    $.fn.greenify = function( options ) {
        // This is the easiest way to have default options.
        var settings = $.extend({
            // These are the defaults.
            color: "#556b2f",
            backgroundColor: "white"
        }, options );

        // Greenify the collection based on the settings variable.
        return this.css({
            color: settings.color,
            backgroundColor: settings.backgroundColor
        });
    };
*/

/*
$.fn.myNewPlugin = function() {
    return this.each(function() {
        // Do something to each element here.
    });
};
*/

/*
Example usage:

$( "div" ).greenify({
    color: "orange"
});

*/
 
	$.fn.animateRotate = function(angle, duration, easing, complete) {
	  return this.each(function() {
		var $elem = $(this);

		$({deg: 0}).animate({deg: angle}, {
		  duration: duration,
		  easing: easing,
		  step: function(now) {
			$elem.css({
			   transform: 'rotate(' + now + 'deg)'
			 });
		  },
		  complete: complete || $.noop
		});
	  });
	};
	$.fn.validate = function(msgDiv) {
		var $elem = $(this);
		var reg = new RegExp($elem.attr("rule"));
		var val = $elem.val();
		if (! reg.test(val)) {
			var msg = $elem.attr("msg");
			//$(msgDiv).html("<h4>" + msg + " : " + reg + " : " + val + "</h4>");
			$(msgDiv).html("<h4>" + msg + "</h4>");
			$(msgDiv).reddy();
			$(msgDiv).show();
			$elem.css('border', '3px solid red');
			$elem.focus();
			return false;
		} else {
			$elem.css('border', '');
			return true;
		}
	};
}( jQuery ));

