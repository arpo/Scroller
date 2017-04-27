/**
 * @version 0.1
 * Copyright 2013, Licensed GPL & MIT
 * @require: jQuery, TweenLite
*/

var NIBS = window.NIBS || {};
NIBS.dragCurtain = (function () {

	///////////////////////////////////////////////////////////////////////
	// Private methods & properties
	///////////////////////////////////////////////////////////////////////

	var _cont,
		_follow,
		_callback,
		_handle,
		_curtain,
		_topLim,
		_bottomLim,
		_drag,
		_isTweening = false,
		_currentY,
		_actions;

	_actions = {
		dragDidStart: function (gesture) {
			//Store the elemets position when the drag starts.
			gesture.dragStartPos = {x:gesture.element.offsetLeft, y:gesture.element.offsetTop};
			setEvent(_cont, 'touchstart', function(e){ e.preventDefault()}); //Turn of scolling on container div off.
		},
		dragDidMove: function (gesture) { //Actions to run when teh dragging is happening.
			var y = gesture.dragStartPos.y + gesture.translation.y;
			_resizeTo(y);
		},
		dragDidStop: function (gesture) {
			setEvent(_cont, 'touchstart', function(e){}); //Turn of scolling on container div on.
			_currentY = gesture.dragStartPos.y + gesture.translation.y;
			if (_currentY <= _cont.outerHeight() / 2) {
				_tweenTo(_topLim + 1, _currentY, true);
			}
			if (_currentY > _cont.outerHeight() / 2) {
				_tweenTo(_bottomLim - 1, _currentY, false);
			}
		}
	};
	

	function setEvent(target, eventType, callback) {
		if (target.on) {
			target.on(eventType, callback);
		} else if (target.bind) {
			target.bind(eventType, callback);
		}
	}

	function _resizeTo (y) {
		if (y > _topLim && y < _bottomLim) {
			_handle.css('top', y);
			h = y + _handle.outerHeight() * 0.5;
			if (h < 0) {
				h = 0;
			}
			if (h >= 0) {
				if (!_follow) {
					_curtain.css('height', Math.round(h));
				} else {
					_curtain.css('top', Math.round(y + _handle.outerHeight() * 1.5 - _curtain.outerHeight()));
				}
			}
		}
	}

	function _tweenTo(to ,from, roundDown, dur) {
		if (_isTweening) {
			return;
		}
		roundDown = roundDown || false;
		dur = dur || 200;
		if (roundDown) {
			to = Math.floor(to);
		} else {
			to = Math.ceil(to);
		}
		var fromObj = {i:from}, toObj = {i:to};
		_isTweening = true;
		$(fromObj).animate(toObj,{
			duration: dur, 
			step: _resizeTo,
			complete: function () {
				_isTweening = false;
				_callback(_isOpen());
			}
		});
	}

	function _positionStuff() {
		_curtain.css('position', 'absolute');
		_curtain.css('width', _cont.outerWidth());
		_curtain.css('height', _cont.outerHeight());
		_curtain.css('overflow', 'hidden');

		var newLeft = (_cont.outerWidth() - _handle.outerWidth()) * 0.5,
			newTop = _cont.outerHeight() - _handle.outerHeight() * 1.5;
		//_handle.css('left', newLeft);
		_handle.css('top', newTop);
		_handle.css('position', 'absolute');
		_handle.css('cursor', 'ns-resize');
		_handle.css('-webkit-touch-callout', 'none');
		_handle.css('-webkit-user-select', 'none');
		_handle.css('-khtml-user-select', 'none');
		_handle.css('-moz-user-select', 'none');
		_handle.css('-ms-user-select', 'none');
		_handle.css('user-select', 'none');
	}

	function _open() {
		_tweenTo(_topLim + 1, _bottomLim, true, 400);
	}

	function _close() {
		_tweenTo(_bottomLim, _topLim + 1, true, 400);
	}

	function _isOpen() {
		var handleY = parseInt(_handle.css('top'));
		if (handleY <= _cont.outerHeight() / 2) {
			var rv = true;
		}
		if (handleY > _cont.outerHeight() / 2) {
			var rv = false;
		}
		return rv;
	}

	///////////////////////////////////////////////////////////////////////
	// Public methods & properties
	///////////////////////////////////////////////////////////////////////
	return {
		setup: function (cont, follow, callback) {
			_cont = cont;
			_callback = callback || function () {};
			_follow = follow || false; //If follow is true the contant in the curtain scrolls up, if false it is cropped. 
			_cont.css('ms-touch-action', 'pan-x'); //Make the container not scroll on Win mobile. More info http://msdn.microsoft.com/en-us/library/windows/apps/hh767313.aspx
			
			_handle = _cont.find('.nibs-curtain-handle');
			_curtain = _cont.find('.nibs-curtain');
			_cont.css('height', _cont.outerHeight() + _handle.outerHeight());
			_positionStuff();
			
			_topLim = 0;
			_bottomLim = _cont.outerHeight() - _handle.outerHeight() * 1.5;

			_drag = new NIBS.Drag(_handle[0], _actions);
			_drag.doOnHandleClick(function () {
				if (_isOpen()) {
					_close()
				} else {
					_open()
				}
			});
			return _drag;
		},
		open: _open,
		close: _close
	};
}());