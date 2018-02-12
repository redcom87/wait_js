(function(){// Monitor AJAX calls and keep a count of how many requests have been sent and how many response have been received.
	window.AJAX_REQUESTS_COUNT = 0;
	window.AJAX_RESPONSES_COUNT = 0;
	// This is just a proxy, it overrides the XMLHttpRequest.send method to monitor it.
	var oldFn = window.XMLHttpRequest.prototype.send;
    window.XMLHttpRequest.prototype.send = function() {
    	window.AJAX_REQUESTS_COUNT++;
        var that = this
        var intervalId = window.setInterval(function(){
                if(that.readyState == 4){
                	window.AJAX_RESPONSES_COUNT++;
                	clearInterval(intervalId);
                }
        }, 10);
        return oldFn.apply(this, arguments);
    };
})();

window.callWhenReadyToGo = function(selector, callback, timeout){
	this.startedAt = new Date().getTime();
	this.selector = selector;
	this.callback = callback;
	this.timeout = timeout;
	this.wasResponds = false;


	var that = this;

	this.isInDOM = function(){ // Because I've chosed to use "querySelector" the "selector" parameter has to be a valid CSS selector, some selector used with jQuery may not work.
		return document.querySelector(that.selector);
	}
	this.check = function(){
		if(that.isInDOM()){ // The element is in the DOM, check AJAX call for cases when the change involves changing the elemnt's content.
			that.elementPresent();
			return true;
		}
		return false;
	}
	this.elementPresent = function(){
		// This function is called when the element is present in the come
		if(window.AJAX_REQUESTS_COUNT === window.AJAX_RESPONSES_COUNT || (that.isInDOM() && new Date().getTime() - that.startedAt > (1000 * 15))){
			// All the AJAX requests tha were sent have been responded to or the element is present and it has been more then 15 seconds since "callWhenReadyToGo" was called
			that.wasResponds = true;
			clearTimeout(that.timeoutId);
			that.callback();
		}else{
			// Create a recursion with a 10 milliseconds delay between calls.
			that.ajaxTimeout = setTimeout(elementPresent, 10);
		}
	}
	if(!this.check()){ // The element is not present in the DOM, start monitoring DOM changes
		that.observer = new MutationObserver(function(){
			if(that.check()){ // the DOM has changed, check if the elment was added to the DOM and if so, stop listening for DOM changes.
				that.observer.disconnect();
			}
		});
		that.observer.observe(document.documentElement, {subtree: true, attributes: true, childList: true}); // Start monitoring DOM changes (on the document element). Be it attributes changes (for cases such as class names added/removed) or adding/removing elements.
	}

	if(this.timeout){
		// If the timeout attribute was set, set a timeout to call the callback and clean up.
		this.timeoutId = setTimeout(function(){
			if(!that.wasResponds){
				clearTimeout(that.ajaxTimeout);
				that.observer && that.observer.disconnect();
				that.callback();
			}
		}, this.timeout);
	}
}