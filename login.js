$(document).on('click', '#go', function() {
	chrome.runtime.sendMessage({task: "login", login: $("#login").val(), password: $("#password").val()}, function(response) {
		if (!response.status) {
			window.location.href = "message.html?message="+response.message;
		} else {
			window.location.href = "popup.html";
		}
	});
});