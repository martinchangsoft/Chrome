$(document).ready(function() {
    var message = window.location.href.match(/message=(.*)/)[1];
    $("h1").text(decodeURIComponent(message));
});

$(document).on('click', '#here', function() {
    window.location.href = "login.html";
});