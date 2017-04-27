/**
 * @version 0.1
 * Copyright 2013, Licensed GPL & MIT
 * @require: jQuery, TweenMax
*/

var NIBS = window.NIBS || {};
NIBS.megaSwipe = (function () {

	///////////////////////////////////////////////////////////////////////
	// Private methods & properties
	///////////////////////////////////////////////////////////////////////

	var _actions;

	function _findDir(gesture) {
		var megaSwipe = gesture.megaSwipe,
			hDiff = gesture.dragMouseStartPos.x - gesture.location.x,
			vDiff = gesture.dragMouseStartPos.y - gesture.location.y,
			hDiff = (hDiff < 0) ? hDiff * -1 : hDiff,
			vDiff = (vDiff < 0) ? vDiff * -1 : vDiff;

		if (hDiff > vDiff) {
			megaSwipe.dir = 'h';
		} else {
			megaSwipe.dir = 'v';
		}
	}

	function _getNextPrev(arr, n) {
		return {
			curr: n,
			prev: (arr[n - 1]) ? n - 1 : arr.length - 1,
			next: (arr[n + 1]) ? n + 1 : 0
		};
	}

	function _onDrag(megaSwipe, prog) {
		megaSwipe.progress = prog;
		if (megaSwipe.dir === megaSwipe.swipeDir) {
			_setPlayHead(megaSwipe, prog);
		}
	};

	function _setPlayHead (megaSwipe, progress) {		
		if (megaSwipe.timeline) {
			var thisProg = (megaSwipe.timeline.totalDuration() * (progress / 2)) + megaSwipe.slideDuration;

			if (megaSwipe.timeline.totalDuration() >= 0 && thisProg > 0) {
				megaSwipe.timeline.seek(thisProg);
			}
		}
	}

	function _setupTransition(megaSwipe) {

		var curr, prev, next, arrData, len, i;

		if (megaSwipe && megaSwipe.timeline) {
			delete megaSwipe.timeline;
		}
		megaSwipe.timeline = new TimelineMax();
		
		arrData = _getNextPrev(megaSwipe.slidesArr, megaSwipe.currSlide);
		curr = megaSwipe.slidesArr[megaSwipe.currSlide].node
		prev = megaSwipe.slidesArr[arrData.prev].node;
		next = megaSwipe.slidesArr[arrData.next].node;
		
		len = megaSwipe.slidesArr.length;
		for (i = 0; i < len; i += 1) {
			if (megaSwipe.slidesArr[i].node === curr) {
				megaSwipe.slidesArr[i].node.addClass('current');
			} else {
				megaSwipe.slidesArr[i].node.removeClass('current').hide();
			}
		}

		prev.show();
		curr.show();
		next.show();

		megaSwipe.timeline.add(TweenMax.to(prev, 0, {left: 0, immediateRender: false}), 0);
		megaSwipe.timeline.add(TweenMax.to(prev, megaSwipe.slideDuration, {left: megaSwipe.$cont.width() * -1, immediateRender: false, ease:Linear.easeNone}), 0);

		megaSwipe.timeline.add(TweenMax.to(curr, 0, {left: megaSwipe.$cont.width(), immediateRender: false}), 0);
		megaSwipe.timeline.add(TweenMax.to(curr, megaSwipe.slideDuration, {left: 0, immediateRender: false, ease:Linear.easeNone}), 0);

		megaSwipe.timeline.add(TweenMax.to(next, 0, {left: megaSwipe.$cont.width(), immediateRender: false}), 0);
		megaSwipe.timeline.add(TweenMax.to(curr, megaSwipe.slideDuration, {left: megaSwipe.$cont.width() * -1, immediateRender: false, ease:Linear.easeNone}), megaSwipe.slideDuration);
		megaSwipe.timeline.add(TweenMax.to(next, megaSwipe.slideDuration, {left: 0, immediateRender: false, ease:Linear.easeNone}), megaSwipe.slideDuration);

		megaSwipe.timeline.seek(megaSwipe.slideDuration);

		megaSwipe.timeline.pause();
	}

	function _resize(n) {}

	function _goto(n) {
		var megaSwipe = this;
		megaSwipe.currSlide = n;
		megaSwipe.timeline.seek(megaSwipe.slideDuration * (n + 1));
		_setupTransition(megaSwipe);	
	}

	function _next() {
		_slide(this, 2, 1);
	}

	function _prev() {
		_slide(this, 0, -1);
	}

	function _slideEnter(n, megaSwipe) {
		var slideDir = arguments[0],
			megaSwipe = arguments[1],
			arrData = _getNextPrev(megaSwipe.slidesArr, megaSwipe.currSlide);

		megaSwipe.tweening = false;

		if (slideDir === -1) {
			megaSwipe.currSlide = arrData.prev;
			_setupTransition(megaSwipe);
		} else if (slideDir === 1) {
			megaSwipe.currSlide = arrData.next;
			_setupTransition(megaSwipe);
		}
		megaSwipe.slideEnter(megaSwipe.currSlide, megaSwipe);
	}

	function _slide(megaSwipe, n, dir) {
		if (megaSwipe.tweening) {
			return;
		}
		megaSwipe.tweening = true;
		megaSwipe.timeline.tweenTo(megaSwipe.slideDuration * n, {onComplete:_slideEnter, onCompleteParams:[dir, megaSwipe], ease:Power1.easeOut});
	}

	function _tween(megaSwipe, off) {
		if (megaSwipe.tweening) {
			return;
		}
		megaSwipe.tweening = true;
		megaSwipe.timeline.tweenTo(megaSwipe.slideDuration * off, {onComplete:_slideEnter, onCompleteParams:[0, megaSwipe], ease:Power1.easeOut});
	}

	_actions = {
		dragDidStart: function (gesture) {
			var megaSwipe = gesture.megaSwipe;
			megaSwipe.dir = '';
			megaSwipe.dragging = true;
			gesture.dragStartPos = {x:gesture.element.offsetLeft, y:gesture.element.offsetTop};
			gesture.dragMouseStartPos = {x:gesture.location.x, y:gesture.location.y};
			megaSwipe.moveCount = 0;
			megaSwipe.$cont[0].ontouchstart = function(e){ e.preventDefault(); }; //Turn of scolling on container div off.
		},
		dragDidMove: function (gesture) { //Actions to run when teh dragging is happening.
			var diff,
				megaSwipe = gesture.megaSwipe;
			megaSwipe.moveCount++;
			if (megaSwipe.moveCount > 2 && megaSwipe.dir === '') {
				_findDir(gesture);
			} else {
				megaSwipe.didDrag(megaSwipe.progress, megaSwipe.dir, gesture);
			}

			if (megaSwipe.dir === 'h') {
				_onDrag(megaSwipe, (gesture.dragMouseStartPos.x - gesture.location.x) / megaSwipe.$cont.outerWidth());
			} else if (megaSwipe.dir === 'v') {
				_onDrag(megaSwipe, (gesture.dragMouseStartPos.y - gesture.location.y) / megaSwipe.$cont.outerHeight());
			}
		},
		dragDidStop: function (gesture) {
			var megaSwipe = gesture.megaSwipe;
			megaSwipe.dragging = false;
			if (megaSwipe.dir === megaSwipe.swipeDir) {
				if (megaSwipe.progress < megaSwipe.swipeThreshold * - 1) { //goto prev
					megaSwipe.prev();
				} else if (megaSwipe.progress > megaSwipe.swipeThreshold * - 1 && megaSwipe.progress < megaSwipe.swipeThreshold) { //Stay on current
					_slide(megaSwipe, 1, 0);
				} else { //Goto next
					megaSwipe.next();
				}
			}
			
			megaSwipe.moveCount = 0;
			megaSwipe.$cont[0].ontouchstart = function(e){ }; //Turn of scolling on container div on.
		}
	};

	///////////////////////////////////////////////////////////////////////
	// Public methods & properties
	///////////////////////////////////////////////////////////////////////
	return {
		setup: function ($cont, options) {

			var megaSwipe = {}, curr, drag;
			options = options || {};
			megaSwipe.$cont = $cont;
			megaSwipe.slidesArr = [];
			megaSwipe.tweening = false;
			megaSwipe.dragging = false;
			megaSwipe.currSlide = 0;
			megaSwipe.progress = 0;
			megaSwipe.moveCount = 0;
			megaSwipe.swipeThreshold = 0.2;
			megaSwipe.$cont[0].style.msTouchAction = 'none'; //Make the container not scroll on Win mobile. More info http://msdn.microsoft.com/en-us/library/windows/apps/hh767313.aspx

			//Options
			megaSwipe.slideEnter = options.slideEnter || function () {};
			megaSwipe.didDrag = options.didDrag || function () {};
			megaSwipe.slideDuration = options.dur || 0.5;
			megaSwipe.swipeDir = options.dir || 'h';

			//Public functions
			megaSwipe.goto = _goto;
			megaSwipe.next = _next;
			megaSwipe.prev = _prev;
			megaSwipe.update = function () {
				_setupTransition(megaSwipe);
			};
			megaSwipe.tween = function (offset) {
				if (!megaSwipe.dragging) {
					_tween(megaSwipe, offset);
				}
			};

			//Make all slides draggable 
			megaSwipe.$cont.find('.megaSlide').each(function(index) {
				curr = $(this);
				curr.hide();
				drag = new NIBS.Drag(curr[0], _actions);
				drag.megaSwipe = megaSwipe;
				megaSwipe.slidesArr.push({
					drag: drag,
					node: curr
				})
			});

			_setupTransition(megaSwipe);
			megaSwipe.$cont.show();
			return megaSwipe;
		}
	};
}());