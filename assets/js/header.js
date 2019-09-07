$(function() {
    $(window).on("scroll", function() {
        if($(window).scrollTop() > 0) {
            $(".navbar").addClass("active");
        } else {
            //remove the background property so it comes transparent again (defined in your css)
           $(".navbar").removeClass("active");
        }
    });
});