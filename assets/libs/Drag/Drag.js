 /**
 * Drag 1.0
 * 
 * @version 1
 * Copyright 2013, Licensed GPL & MIT
 *  
*/
var NIBS = NIBS || {};
(function(ns){
	var MOUSE_DOWN = "mousedown";
	var MOUSE_MOVE = "mousemove";
	var MOUSE_UP = "mouseup";
	var mousedownStartTime;
	var mousedownStartPosition;
	var mouseUpEndTime;
	var onHandleClickFn;
	var oldMSPointerStyle = (function () {
		if (window.navigator.pointerEnabled) {
			return false;
		} else if (window.navigator.msPointerEnabled) {
			return true;
		}
	})();

	if(window.navigator.msPointerEnabled) {
		if (oldMSPointerStyle) {
			MOUSE_DOWN = "MSPointerDown";
			MOUSE_MOVE = "MSPointerMove";
			MOUSE_UP = "MSPointerUp";	
		} else {
			MOUSE_DOWN = "pointerdown";
			MOUSE_MOVE = "pointermove";
			MOUSE_UP = "pointerup";	
		}
	}
	var eventAddListener = function(element, type, handler) {
		if(element.addEventListener) {
			element.addEventListener(type, handler, false);
		}
		else if(element.attachEvent) {
			element.attachEvent("on" + type, handler);
		}
	};
	var eventRemoveListener = function(element, type, handler) {
		if(element.removeEventListener) {
			element.removeEventListener(type, handler);
		}
		else if(element.detachEvent) {
			element.detachEvent("on" + type, handler);
		}
	};
	var eventPreventDefault = function(event) {
		if(event.preventDefault) {
			event.preventDefault();
		}
		else {
			event.returnValue = false;
		}
	};
	var eventStopPropagation = function(event) {
		if(event.stopPropagation) {
			event.stopPropagation();
		}
		else {
			event.cancelBubble = true;
		}
	};
	var documentListeners = [];
	var documentHandler = function(event) {
		var listeners = documentListeners.slice();
		for(var i = 0; i<listeners.length; i++) {
			if(listeners[i].listener(event)) {
				return;
			}
		}
	};
	var setupDocumentHandler = function() {
		eventAddListener(document, MOUSE_MOVE, documentHandler);
		eventAddListener(document, MOUSE_UP, documentHandler);
	};
	var disposeDocumentHandler = function() {
		eventRemoveListener(document, MOUSE_MOVE, documentHandler);
		eventRemoveListener(document, MOUSE_UP, documentHandler);
	};
	var addDocumentListener = function(gesture) {
		removeDocumentListener(gesture);
		documentListeners.push(gesture);
		if(documentListeners.length == 1) {
			setupDocumentHandler();
		}
	};
	var removeDocumentListener = function(gesture) {
		for(var i = 0; i<documentListeners.length; i++) {
			if(documentListeners[i] == gesture) {
				documentListeners.splice(i, 1);
				if(documentListeners.length === 0) {
					disposeDocumentHandler();
				}
				return;
			}
		}
	};

	function Drag(element, delegate) {
		this.element = element;
		if("mozUserSelect" in this.element.style) {
			this.element.style.mozUserSelect = "none";
		}
		else if("webkitUserSelect" in this.element.style) {
			this.element.style.webkitUserSelect = "none";
		}
		else if("msUserSelect" in this.element.style) {
			this.element.style.msUserSelect = "none";
		}
		else if("userSelect" in this.element.style) {
			this.element.style.userSelect = "none";
		}
		this.delegate = delegate;
		this.location = {x:0, y:0};
		this.translation = {x:0, y:0};
		this.offset = {x:0, y:0};
		this.canceled = false;
		this.stopped = false;
		var scope = this;
		this.listener = function(event) {
			scope.stopped = false;
			scope.event = event || window.event;
			scope.target = event.srcElement || event.target;
			scope.handler(event.type);
			scope.event = scope.target = null;
			return scope.stopped;
		};
		if("ontouchstart" in window) {
			this.addEvent(this.element, "touchstart");
			this.addEvent(this.element, "touchmove");
			this.addEvent(this.element, "touchend");
			this.addEvent(this.element, "touchcancel");
		}
		else {
			this.element.ondragstart = function() {return false;};
			this.addEvent(this.element, MOUSE_DOWN);
		}
		this.addEvent(this.element, "click");
	}
	Drag.prototype.dispose = function() {
		if("ontouchstart" in window) {
			this.removeEvent(this.element, "touchstart");
			this.removeEvent(this.element, "touchmove");
			this.removeEvent(this.element, "touchend");
			this.removeEvent(this.element, "touchcancel");
		}
		else {
			this.element.ondragstart = null;
			this.removeEvent(this.element, MOUSE_DOWN);
			removeDocumentListener(this);
		}
		this.removeEvent(this.element, "click");
		this.element = null;
		this.delegate = null;
	};
	Drag.prototype.addEvent = function(element, type) {
		eventAddListener(element, type, this.listener);
	};
	Drag.prototype.removeEvent = function(element, type) {
		eventRemoveListener(element, type, this.listener);
	};
	Drag.prototype.preventDefault = function() {
		if(this.event) {
			eventPreventDefault(this.event);
		}
	};
	Drag.prototype.stopPropagation = function() {
		if(this.event) {
			this.stopped = true;
			eventStopPropagation(this.event);
		}
	};
	Drag.prototype.locationInElement = function(element) {
		if(!this.event) {
			return {x:0, y:0};
		}
		var x = this.location.x, y = this.location.y;
		while(element) {
			x -= element.offsetLeft;
			y -= element.offsetTop;
			element = element.offsetParent;
		}
		return {x:x, y:y};
	};
	Drag.prototype.updateLocation = function() {
		if("touches" in this.event && this.event.touches.length > 0) {
			this.location.x = this.event.touches[0].pageX;
			this.location.y = this.event.touches[0].pageY;
		}
		else if("pageX" in this.event) {
			this.location.x = this.event.pageX;
			this.location.y = this.event.pageY;
		}
		else if("clientX" in this.event) {
			var d = document.documentElement, b = document.body;
			this.location.x = this.event.clientX + (d && d.scrollLeft || b && b.scrollLeft || 0) - (d && d.clientLeft || b && b.clientLeft || 0);
			this.location.y = this.event.clientY + (d && d.scrollTop || b && b.scrollTop || 0) - (d && d.clientTop || b && b.clientTop || 0);
		}
	};
	Drag.prototype.updateTranslation = function(reset) {
		if(reset) {
			this.offset.x = this.location.x;
			this.offset.y = this.location.y;
		}
		this.translation.x = this.location.x - this.offset.x;
		this.translation.y = this.location.y - this.offset.y;
	};
	Drag.prototype.cancel = function() {
		this.canceled = true;
	};
	Drag.prototype.notify = function(name) {
		if(this.delegate && this.delegate[name]) {
			this.delegate[name](this);
		}
	};
	Drag.prototype.doOnHandleClick = function(callback) {
		onHandleClickFn = callback;
	};
	Drag.prototype.handler = function(type) {
		switch(type) {
			case "click":
				this.notify("click");
				break;
			case "touchstart":
				this.canceled = false;
				this.mousedownStartTime = (new Date()).getTime();
				this.updateLocation();
				this.updateTranslation(true);
				this.mousedownStartPosition = {x: this.location.x, y: this.location.y};
				this.notify("dragDidStart");
				break;
			case MOUSE_DOWN :
				this.canceled = false;
				this.mousedownStartTime = (new Date()).getTime();
				this.updateLocation();
				this.updateTranslation(true);
				this.mousedownStartPosition = {x: this.location.x, y: this.location.y};
				this.notify("dragDidStart");
				addDocumentListener(this);
				break;
			case MOUSE_MOVE :
			case "touchmove" :
				if(!this.canceled) {
					this.updateLocation();
					this.updateTranslation(false);
					this.notify("dragDidMove");
				}
				break;
			case MOUSE_UP :
				removeDocumentListener(this);
				if(!this.canceled) {
					this.mouseUpEndTime = (new Date()).getTime();
					
					var posTest = function (gesture) {
						var lim = 5,
							xtest = (gesture.location.x - gesture.mousedownStartPosition.x < lim) && (gesture.location.x - gesture.mousedownStartPosition.x > lim * -1),
							ytest = (gesture.location.y - gesture.mousedownStartPosition.y < lim) && (gesture.location.y - gesture.mousedownStartPosition.y > lim * -1);
						return ytest && xtest;
					};

					if (onHandleClickFn) {
						if ((new Date()).getTime() - this.mousedownStartTime < 160 && posTest(this)) {
							onHandleClickFn(this);
						}
					}
					this.notify("dragDidStop");
				}
				break;
			case "touchend":
			case "touchcancel":
				if(!this.canceled) {
					this.notify("dragDidStop");
				}
				break;
		}
	};
	this.NIBS.Drag = Drag;
	
	
})(this.NIBS || {});
