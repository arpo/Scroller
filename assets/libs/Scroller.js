/**
 * @version 1.3
 * Copyright 2013, Licensed GPL & MIT
*/

var NIBS = NIBS || {};
(function(ns){
	var MOUSE_DOWN = "mousedown";
	var MOUSE_MOVE = "mousemove";
	var MOUSE_UP = "mouseup";

	var oldMSPointerStyle = (function (style) {
		if (typeof style.MSPointerDown !== 'undefined') {
			return true;
		}
		return false;
	})(document.createElement('div').style);

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

	// IF THE BROWSER IS INTERNET EXPLORER 10
	if (navigator.appVersion.indexOf("MSIE 10") !== -1) {
		MOUSE_DOWN = "MSPointerDown";
		MOUSE_MOVE = "MSPointerMove";
		MOUSE_UP = "MSPointerUp";
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
	Drag.prototype.handler = function(type) {
		switch(type) {
			case "click":
				this.notify("click");
				break;
			case "touchstart":
				this.canceled = false;
				this.updateLocation();
				this.updateTranslation(true);
				this.notify("dragDidStart");
				break;
			case MOUSE_DOWN :
				this.canceled = false;
				this.updateLocation();
				this.updateTranslation(true);
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
	function Wheel(element, delegate) {
		this.element = element;
		this.delegate = delegate;
		var scope = this;
		this.listener = function(event) {
			scope.event = event || window.event;
			scope.delta = scope.event.wheelDelta || -scope.event.detail;
			if(scope.delegate && scope.delegate.wheelDidMove) {
				//Firefix fix
				if (event.type === 'DOMMouseScroll') {
					scope.delta = 120 * (scope.delta / 3);
				}
				scope.delegate.wheelDidMove(scope);
			}
			scope.event = null;
		};
		eventAddListener(this.element, "mousewheel", this.listener);
		eventAddListener(this.element, "DOMMouseScroll", this.listener);
	}
	Wheel.prototype.preventDefault = function() {
		if(this.event) {
			eventPreventDefault(this.event);
		}
	};
	Wheel.prototype.stopPropagation = function() {
		if(this.event) {
			this.stopped = true;
			eventStopPropagation(this.event);
		}
	};
	Wheel.prototype.dispose = function() {
		eventRemoveListener(this.element, "mousewheel", this.listener);
		eventRemoveListener(this.element, "DOMMouseScroll", this.listener);
		this.listener = null;
		this.element = null;
		this.delegate = null;
	};
	function Keystroke(element, delegate) {
		this.element = element;
		this.delegate = delegate;
		var scope = this;
		this.listener = function(event) {
			scope.event = event || window.event;
			scope.key = scope.event.keyCode;
			if(scope.event.type == "keydown") {
				if(scope.delegate && scope.delegate.keystrokeDidStart) {
					scope.delegate.keystrokeDidStart(scope);
				}
			}
			if(scope.event.type == "keyup") {
				if(scope.delegate && scope.delegate.keystrokeDidStop) {
					scope.delegate.keystrokeDidStop(scope);
				}
			}
			scope.event = null;
		};
		eventAddListener(this.element, "keydown", this.listener);
		eventAddListener(this.element, "keyup", this.listener);
	}
	Keystroke.prototype.preventDefault = function() {
		if(this.event) {
			eventPreventDefault(this.event);
		}
	};
	Keystroke.prototype.stopPropagation = function() {
		if(this.event) {
			this.stopped = true;
			eventStopPropagation(this.event);
		}
	};
	Keystroke.prototype.dispose = function() {
		eventRemoveListener(this.element, "keydown", this.listener);
		eventRemoveListener(this.element, "keyup", this.listener);
		this.listener = null;
		this.element = null;
		this.delegate = null;
	};

	function firstChild(element) {
		var child = element.firstChild;
		while(child !== null && child.nodeType == 3) {
			child = child.nextSibling;
		}
		return child;
	}
	function clip(min, max, value, wrap) {
		if(wrap) {
			if(value < min) {
				return max;
			}
			if(value > max) {
				return min;
			}
			return value;
		}
		return Math.min(max, Math.max(min, value));
	}
	function getTime() {
		return new Date().getTime();
	}
	function easeInOut(k) {if((k *= 2) < 1) {return 0.5 * k * k * k;} return 0.5 * ((k -= 2) * k * k + 2);}
	function easeOut(k) {return --k * k * k + 1;}
	function detectTransform(value) {
		var transforms = {
			'webkitTransform':'-webkit-transform',
			'OTransform':'-o-transform',
			'msTransform':'-ms-transform',
			'MozTransform':'-moz-transform',
			'transform':'transform'
		};
		var test = document.createElement('p');
		document.body.insertBefore(test, null);
		for(var name in transforms) {
			if(test.style[name] !== undefined ){
				test.style[name] = value;
				var style = window.getComputedStyle(test).getPropertyValue(transforms[name]);
				if(style !== undefined && style.length > 0 && style !== "none") {
					document.body.removeChild(test);
					return name;
				}
			}
		}
		document.body.removeChild(test);
		return null;
	}
	var REST_EPSILON = 0.01;
	var activeScroller;
	var requestFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame || window.oRequestAnimationFrame || function(callback) {window.setTimeout(function(){callback();}, 1000 / 60);};
	var translate;
	var translateName = detectTransform("translate3d(1px,1px,1px)");
	if(translateName) {
		translate = function(node, x, y) {
			if (!node) {
				return;
			}

			node.style[translateName] = "translate3d("+x+"px,"+y+"px,0)";
		};
	}
	else {
		translate = function(node, x, y) {
			node.style.left = x + "px";
			node.style.top = y + "px";
		};
	}
	function Scroller(node, delegate) {
		if(node) {
			if(node.get) {
				node = node.get(0);
			}
			this.node = node;
			this.contentNode = firstChild(node);
		}
		else {
			this.node = document.createElement("div");
		}

		if(this.node.tabIndex < 0) {
			this.node.tabIndex = 0;
			this.node.style.outline = "0";
		}
		this.node.style.position = "relative";
		this.node.style.overflow = "hidden";
		this.node.style.cursor = "default";

		if(!this.contentNode) {
			this.contentNode = document.createElement("div");
			this.node.appendChild(this.contentNode);
		}
		this.contentNode.style.position = "relative";

		this.delegate = delegate;

		this.elasticity = 8;
		this.friction = 0.94;//Velocity damp after drag.
		this.paging = false;//Snap.

		this.validating = false;
		this.dragging = false;
		this.disable = false;
		this.dragTime = 0;
		this.decelerating = false;
		this.animating = false;
		this.animatingTime = 0;
		this.animatingDuration = 1000;

		this.directed = false;
		this.lastDelta = 0;
		this.autoContentSize = true;

		this.vertical = new ScrollAxis();
		this.horizontal = new ScrollAxis();

		this.drag = new Drag(this.contentNode, this);
		this.wheel = new Wheel(this.node, this);
		this.keystroke = new Keystroke(this.node, this);

		translate(this.contentNode, 0, 0);
		this.layout();
	}

	Scroller.prototype.on = function() {
		this.disable = false;
		this.validate();
	};

	Scroller.prototype.off = function() {
		this.disable = true;
	};

	Scroller.prototype.dispose = function() {
		this.drag.dispose();
		this.wheel.dispose();
		if(this.trackbar) {
			this.trackbar.dispose();
		}
		this.node = null;
		this.contentNode = null;
	};
	Scroller.prototype.setTrackbarVisible = function(value) {
		if(value && !this.trackbar) {
			this.trackbar = new Trackbar(this);
			this.node.appendChild(this.trackbar.node);
		}
		else if(!value && this.trackbar) {
			this.node.removeChild(this.trackbar.node);
			this.trackbar.dispose();
		}
	};
	Scroller.prototype.getContentOffset = function() {
		return {x:this.horizontal.contentOffset, y:this.vertical.contentOffset};
	};
	Scroller.prototype.refresh = function(extraMargin) {
		this.layout();
		this.setContentSize(this.contentNode.offsetWidth, this.contentNode.offsetHeight + extraMargin);
		//this.setContentOffset(0, 0);
	};
	Scroller.prototype.resize = function(w, h, extraMargin) {
		extraMargin = extraMargin || 0;
		var content = this.contentNode;
		content.parentNode.style.width = w + 'px';
		content.parentNode.style.height = h + 'px';
		this.refresh(extraMargin);
	};
	Scroller.prototype.setContentOffset = function(x, y, duration) {
		this.dragging = false;
		this.decelerating = false;
		this.animating = !isNaN(duration);
		if(this.animating) {
			this.updateBounds();
			this.horizontal.beginAnimate(x);
			this.vertical.beginAnimate(y);
			this.animating = true;
			this.animatingTime = getTime();
			this.animatingDuration = duration;
		}
		else {
			this.horizontal.contentOffset = x;
			this.vertical.contentOffset = y;
		}
		this.invalidate();
	};
	Scroller.prototype.getContentSize = function() {
		return {width:this.horizontal.contentLength, height:this.vertical.contentLength};
	};
	Scroller.prototype.setContentSize = function(width, height) {
		this.horizontal.contentLength = width;
		this.vertical.contentLength = height;
		this.autoContentSize = false;
	};
	Scroller.prototype.setAutoContentSize = function() {
		this.autoContentSize = true;
	};
	Scroller.prototype.nudgeHorizontal = function(amount) {
		if(this.paging) {
			var pagedOffset = this.horizontal.getPagedOffset(amount, true);
			if(!this.animating || this.horizontal.animateFrom + this.horizontal.animateDelta != pagedOffset) {
				this.setContentOffset(pagedOffset, this.vertical.contentOffset, this.speed);
			}
		}
		else {
			this.dragging = false;
			this.decelerating = false;
			this.animating = false;
			this.horizontal.contentOffset += amount;
			this.invalidate();
		}
	};
	Scroller.prototype.nudgeVertical = function(amount) {

		if(this.paging) {
			var pagedOffset = this.vertical.getPagedOffset(amount, true);
			if(!this.animating || this.vertical.animateFrom + this.vertical.animateDelta != pagedOffset) {
				this.setContentOffset(this.horizontal.contentOffset, pagedOffset, this.speed);
			}
		}
		else {
			this.dragging = false;
			this.decelerating = false;
			this.animating = false;
			this.vertical.contentOffset += amount;
			this.invalidate();
		}
	};
	Scroller.prototype.keystrokeDidStart = function(keystroke) {

		if(keystroke.key == 40 && this.vertical.getScrollable()) {
			keystroke.preventDefault();
			this.nudgeVertical(20);
		}
		else if(keystroke.key == 38 && this.vertical.getScrollable()) {
			keystroke.preventDefault();
			this.nudgeVertical(-20);
		}
		else if(keystroke.key == 37 && this.horizontal.getScrollable()) {
			keystroke.preventDefault();
			this.nudgeHorizontal(-20);
		}
		else if(keystroke.key == 39 && this.horizontal.getScrollable()) {
			keystroke.preventDefault();
			this.nudgeHorizontal(20);
		}

	};
	Scroller.prototype.trackbarDidMove = function(trackbar) {
		this.setContentOffset(0, trackbar.position * (this.vertical.contentLength - this.vertical.parentLength));
	};
	Scroller.prototype.wheelDidMove = function(gesture) {
		this.updateBounds();
		if(!this.vertical.getScrollable()) {
			return;
		}

		gesture.preventDefault();
		gesture.stopPropagation();

		if(this.paging) {

			//Mac mouse wheel fix
			// var wTime = new Date().getTime();
			// trace('wDelta', (wTime - window.lastWTime));
			// window.lastWTime = wTime;
			//http://stackoverflow.com/questions/26326958/stopping-mousewheel-event-from-happening-twice-in-osx
			//http://stackoverflow.com/questions/5527601/normalizing-mousewheel-speed-across-browsers
			//console.log(gesture.delta);

			if (Math.abs(gesture.delta) < 119) return;

			var pagedOffset = this.vertical.getPagedOffset(clip(-1, 1, -gesture.delta));
			if(!this.animating || this.vertical.animateFrom + this.vertical.animateDelta != pagedOffset) {
				this.setContentOffset(this.horizontal.contentOffset, pagedOffset, this.speed);
			}
		}
		else {
			this.dragging = false;
			this.decelerating = false;
			this.animating = false;
			this.vertical.contentOffset -= gesture.delta * 0.2;
			this.invalidate();
		}
	};
	Scroller.prototype.dragDidStart = function(gesture) {

		if(this.delegate && this.delegate.onScrollStart) {
			this.delegate.onScrollStart(this);
		}

		this.node.focus();
		this.updateBounds();

		gesture.offset.x += this.horizontal.contentOffset;
		gesture.offset.y += this.vertical.contentOffset;
		gesture.updateTranslation();

		this.horizontal.dragOffset = -gesture.translation.x;
		this.horizontal.velocity = 0;

		this.vertical.dragOffset = -gesture.translation.y;
		this.vertical.velocity = 0;

		this.dragTime = getTime();

		this.dragging = true;
		this.decelerating = false;
		this.animating = false;
		this.directed = false;

		activeScroller = null;
	};
	Scroller.prototype.dragDidMove = function(gesture) {
		var velocityX = - gesture.translation.x - this.horizontal.dragOffset;
		var velocityY = - gesture.translation.y - this.vertical.dragOffset;

		if(!activeScroller) {
			var horizontalMove = Math.abs(velocityX) > Math.abs(velocityY);
			if((horizontalMove && this.horizontal.getScrollable()) || (!horizontalMove && this.vertical.getScrollable())) {
				activeScroller = this;
				this.directed = true;
				this.invalidate();
			}
		}
		else if(activeScroller != this) {
			gesture.cancel();
			return;
		}

		if(this.directed) {
			gesture.preventDefault();
		}

		this.horizontal.velocity = velocityX;
		this.horizontal.dragOffset = -gesture.translation.x;

		this.vertical.velocity = velocityY;
		this.vertical.dragOffset = -gesture.translation.y;

		this.dragTime = getTime();
	};
	Scroller.prototype.dragDidStop = function(gesture) {

		if(this.delegate && this.delegate.onDragEnd) {
			this.delegate.onDragEnd(this);
		}

		var time = getTime();
		if(time - this.dragTime > 100) {
			this.horizontal.velocity = 0;
			this.vertical.velocity = 0;
		}
		this.dragging = false;
		if(this.paging) {
			this.setContentOffset(this.horizontal.getPagedOffset(this.horizontal.velocity), this.vertical.getPagedOffset(this.vertical.velocity), this.speed);
		}
		else {
			this.decelerating = true;
		}
	};
	Scroller.prototype.click = function(gesture) {
		if(this.directed) {
			gesture.preventDefault();
			gesture.stopPropagation();
		}
	};
	Scroller.prototype.layout = function() {
		this.invalidate();
		this.needsLayout = true;
	};
	Scroller.prototype.invalidate = function() {
		if(!this.validating) {
			this.validating = true;
			var scope = this;
			requestFrame(function(){scope.validate();});
		}
	};
	Scroller.prototype.validate = function() {

		if (this.disable) return;

		if(this.needsLayout) {
			this.updateBounds();
			this.needsLayout = false;
		}
		this.resolve();
		if(this.delegate && this.delegate.scrollerDidScroll) {
			this.delegate.scrollerDidScroll(this);
		}
		if(!this.dragging && !this.decelerating && !this.animating) {
			this.validating = false;
		}
		else {
			this.validating = true;
			var scope = this;
			requestFrame(function(){scope.validate();});
		}

	};
	Scroller.prototype.resolve = function() {
		if(this.dragging) {
			this.horizontal.drag();
			this.vertical.drag();
		}
		else if(this.animating) {
			var t = (getTime() - this.animatingTime) / this.animatingDuration;
			if(t > 1) {
				t = 1;
				this.animating = false;
			}
			else {
				t = easeOut(t);
			}
			this.horizontal.animate(t);
			this.vertical.animate(t);
		}
		else if(this.decelerating) {
			this.decelerating = this.horizontal.decelerate(this.friction, this.elasticity) + this.vertical.decelerate(this.friction, this.elasticity) > 0;
		}
		else {
			this.horizontal.constrain();
			this.vertical.constrain();
		}

		translate(this.contentNode, -this.horizontal.contentOffset, -this.vertical.contentOffset);

		if(this.trackbar) {
			this.trackbar.setPosition(this.vertical.contentOffset / (this.vertical.contentLength - this.vertical.parentLength));
		}
	};
	Scroller.prototype.updateBounds = function() {
		if (!this.node) {
			return;
		}
		this.horizontal.parentLength = this.node.offsetWidth;
		this.vertical.parentLength = this.node.offsetHeight;
		if(this.autoContentSize) {
			this.horizontal.contentLength = this.contentNode.offsetWidth;
			this.vertical.contentLength = this.contentNode.offsetHeight;
		}

		if("msTouchAction" in this.node.style) {
			if(this.vertical.contentLength > this.vertical.parentLength && this.horizontal.contentLength > this.horizontal.parentLength) {
				this.node.style.msTouchAction = "none";
			}
			else if(this.horizontal.contentLength > this.horizontal.parentLength) {
				this.node.style.msTouchAction = "pan-y";
			}
			else if(this.vertical.contentLength > this.vertical.parentLength) {
				this.node.style.msTouchAction = "pan-x";
			}
			else {
				this.node.style.msTouchAction = "auto";
			}
		}

		if(this.trackbar) {
			if(this.vertical.contentLength > this.vertical.parentLength) {
				this.trackbar.node.style.visibility = "";
				this.trackbar.setLength(this.vertical.parentLength, this.vertical.parentLength / this.vertical.contentLength);
				this.trackbar.align(this.horizontal.parentLength);
			}
			else {
				this.trackbar.node.style.visibility = "hidden";
			}
		}
	};
	Scroller.prototype.speed = 400;

	function ScrollAxis() {
		this.velocity = 0;
		this.parentLength = 0;
		this.contentLength = 0;
		this.contentOffset = 0;
		this.dragOffset = 0;
		this.animateFrom = 0;
		this.animateDelta = 0;
	}
	ScrollAxis.prototype.getScrollable = function() {
		return this.contentLength - this.parentLength > 0;
	};
	ScrollAxis.prototype.getPagedOffset = function(direction, wrap) {
		var min = 0;
		var max = Math.max(0, this.contentLength - this.parentLength);
		if(direction < 0) {
			return clip(min, max, Math.floor((this.contentOffset + direction) / this.parentLength) * this.parentLength, wrap);
		}
		if(direction > 0) {
			return clip(min, max, Math.ceil((this.contentOffset + direction) / this.parentLength) * this.parentLength, wrap);
		}
		return clip(min, max, Math.round(this.contentOffset / this.parentLength) * this.parentLength, wrap);
	};
	ScrollAxis.prototype.drag = function() {
		var min = 0;
		var max = Math.max(0, this.contentLength - this.parentLength);
		this.contentOffset = this.dragOffset;

		if(this.contentOffset < min) {
			if(max === min) {
				this.contentOffset = min;
			}
			else {
				this.contentOffset += (min - this.contentOffset) / 1.5;
			}
		}
		else if(this.contentOffset > max) {
			if(max === min) {
				this.contentOffset = max;
			}
			else {
				this.contentOffset += (max - this.contentOffset) / 1.5;
			}
		}
	};
	ScrollAxis.prototype.beginAnimate = function(value) {
		if (isNaN(this.contentOffset)) return;
		this.animateFrom = this.contentOffset;
		this.animateDelta = value - this.contentOffset;
	};
	ScrollAxis.prototype.animate = function(t) {
		this.contentOffset = this.animateFrom + this.animateDelta * t;
	};
	ScrollAxis.prototype.decelerate = function(friction, elasticity) {

		var min = 0;
		var max = Math.max(0, this.contentLength - this.parentLength);
		this.velocity *= friction;
		this.contentOffset += this.velocity;

		if(this.contentOffset < min) {

			if(max === min) {
				this.velocity = 0;
				this.contentOffset = min;
			}
			else if(this.velocity < 0) {
				this.velocity += (min - this.contentOffset) / elasticity;
				console.log('Min');
			}
			else {
				this.velocity = (min - this.contentOffset) / elasticity;
			}
		}
		else if(this.contentOffset > max) {
			if(min === max) {
				this.velocity = 0;
				this.contentOffset = min;
			}
			else if(this.velocity > 0) {
				console.log('Max');
				this.velocity += (max - this.contentOffset) / elasticity;
			}
			else {
				this.velocity = (max - this.contentOffset) / elasticity;
			}
		}

		return Math.abs(this.velocity) < REST_EPSILON ? 0 : 1;
	};
	ScrollAxis.prototype.constrain = function() {
		var max = Math.max(0, this.contentLength - this.parentLength);
		this.contentOffset = clip(0, max, this.contentOffset);
	};


	function Trackbar(delegate) {
		this.delegate = delegate;
		this.node = document.createElement("div");
		this.node.className = "nibs-trackbar nibs-trackbar-y";
		this.node.style.position = "absolute";
		this.node.style.top = "0px";

		this.nodeLength = 0;
		this.thumbLength = 50;
		this.length = 0;

		this.thumb = document.createElement("div");
		this.thumb.className = "nibs-trackbar-thumb nibs-trackbar-thumb-y";
		this.thumb.style.position = "relative";
		this.node.appendChild(this.thumb);

		this.position = 0;
		this.axis = "y";
		this.drag = new Drag(this.node, this);
	}
	Trackbar.prototype.setLength = function(value, ratio) {
		this.nodeLength = value;
		this.thumbLength = Math.max(Math.round(value * ratio), 20);

		this.node.style.height = this.nodeLength + "px";
		this.thumb.style.height = this.thumbLength + "px";

		this.length = this.nodeLength - this.thumb.offsetHeight;
	};
	Trackbar.prototype.align = function(value) {
		this.node.style.left = (value - this.node.offsetWidth) + "px";
	};
	Trackbar.prototype.setPosition = function(value) {
		this.position = clip(0, 1, value);
		this.update();
	};
	Trackbar.prototype.dragDidStart = function(gesture) {
		if(gesture.target == this.thumb) {
			gesture.stopPropagation();
			this.notify("trackbarDidStart");
			gesture.offset[this.axis] -= this.position * this.length;
			gesture.updateTranslation();
		}
		else {
			gesture.cancel();
		}
	};
	Trackbar.prototype.dragDidMove = function(gesture) {
		gesture.stopPropagation();
		this.position = clip(0, 1, gesture.translation[this.axis] / this.length);
		this.notify("trackbarDidMove");
	};
	Trackbar.prototype.dragDidStop = function(gesture) {
		this.notify("trackbarDidStop");
	};
	Trackbar.prototype.layout = function() {
		this.update();
	};
	Trackbar.prototype.update = function() {
		var value = Math.round(this.position * this.length);
		if(this.axis == "y") {
			translate(this.thumb, 0, value);
		}
		else {
			translate(this.thumb, value, 0);
		}
	};
	Trackbar.prototype.notify = function(selector) {
		if(this.delegate && this.delegate[selector]) {
			this.delegate[selector](this);
		}
	};
	Trackbar.prototype.dispose = function() {
		this.drag.dispose();
	};

	this.NIBS.Scroller = Scroller;

})(this.NIBS || {});
