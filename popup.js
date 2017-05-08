$(document).ready(function() {
	$('#walmartFillData').on('click', function() {
	    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
	        chrome.tabs.sendMessage(tabs[0].id, {past: "wal"}, function(response) {
	            console.log(response);
	        });
	    });		
	});
	$('#amazonFillData').on('click', function() {
	    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
	        chrome.tabs.sendMessage(tabs[0].id, {past: "amaz"}, function(response) {
	            console.log(response);
	        });
	    });		
	});	

	$('#emptyaddr').on('click', function() {
	    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
	        chrome.tabs.sendMessage(tabs[0].id, {empty: "addr"}, function(response) {
	            console.log(response);
	        });
	    });		
	});	

	$('#emptycart').on('click', function() {
	    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
	        chrome.tabs.sendMessage(tabs[0].id, {empty: "cart"}, function(response) {
	            console.log(response);
	        });
	    });		
	});		

	$("#logout").on('click', function() {
		chrome.storage.sync.clear(function() {
			window.location.href = 'login.html';
			chrome.browserAction.setPopup({popup: "login.html"});
		});		
	});
});