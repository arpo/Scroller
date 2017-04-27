/*
 * Slider 1.0
 *
 * Copyright 2015, Licensed GPL & MIT
 */

var c = (console) ? console : {log: function () {}}; c.l = c.log;

var NIBS = NIBS || {};
NIBS.Slider = function (data) {

    var init = function () {

        var that = this,
            cssCode,
            cssCodeExtra,
            style;

        cssCode =	'		.slider-wrapper {\n' +
                    '			position: relative;\n' +
                    '			overflow: hidden;\n' +
                    '			box-sizing: border-box;\n' +
                    '			background-color: ' + that.backgroundColor + ';\n' +
                    '		}\n\n' +

                    '		.slider-handle {\n' +
                    '			position: absolute;\n' +
                    '			left: 0px;\n' +
                    '			top: 0px;\n' +
                    '			cursor: w-resize;\n' +
                    '			box-sizing: border-box;\n' +
                    '			background-color: ' + that.handleColor + ';\n' +
                    '		}\n\n';


        if (that.dir === 'v') {

            cssCodeExtra =	'		.slider-wrapper {\n' +
                            '			height: 100%;\n' +
                            '			width: ' + that.handleWidth + 'px;\n' +
                            '		}\n\n' +

                            '		.slider-handle {\n' +
                            '			cursor: n-resize;\n' +
                            '			height: ' + that.handleWidth + 'px;\n' +
                            '			width: 100%;\n' +
                            '		}';

        } else {

            cssCodeExtra =	'		.slider-wrapper {\n' +
                            '			width: 100%;\n' +
                            '			height: ' + that.handleWidth + 'px;\n' +
                            '		}\n\n' +

                            '		.slider-handle {\n' +
                            '			width: ' + that.handleWidth + 'px;\n' +
                            '			height: 100%;\n' +
                            '		}';            

        }

        cssCode += cssCodeExtra;
        style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = cssCode;
        document.getElementsByTagName('head')[0].appendChild(style);

        window.addEventListener('resize', function() {
            for (var id in NIBS.Slider.all) {
            	NIBS.Slider.all[id].resize();
            }
        }, true);

        init = function () {};

    };

    var that = this;
    that.id = NIBS.Slider.getUniqueId();
	that.data = data;
    that.info = {
        empty: true,
        handle: {}
    };
    that.backgroundColor = that.data.backgroundColor || '#D6D6D6';
    that.handleColor = that.data.handleColor || '#B5B5B5';
    that.onSlide = that.data.onSlide || function () {
        //trace('progress', this.info.progress);
    };
    that.dir = (that.data.dir) ? that.data.dir.toLowerCase() : 'h';
    that.handleWidth = (that.data.handleWidth) ? that.data.handleWidth : 50;
    that.selector = that.data.target;
    that.snap = that.data.snap;
    that.snapping = false;

    if (that.snap) {
        that.snapping = true;
    }
    
    that.gesture = {};

    that.get = {
        $1: document.querySelector.bind(document), // Direct reference, usage: var alArr = $2('.my-class');
        $2: document.querySelectorAll.bind(document), //Node array, usage: var el = $1('.one-time-class');
        child: function (parent, className) {
            var notes = null;
            for (var i = 0; i < parent.childNodes.length; i++) {
                if (parent.childNodes[i].className == className) {
                  notes = parent.childNodes[i];
                  return notes;
                }
            }
        }
    };
    that.info.state = 'init';
    that.target = that.get.$1(that.data.target);
    that.target.className += that.target.className ? ' slider-wrapper' : 'slider-wrapper';
    that.target.innerHTML = '<div class="slider-handle"></div>';
    that.handle = that.get.child(that.target, 'slider-handle');

    init.call(that);

    that.refresh();

    that.actions = {
        dragDidStart: function (gesture) {

            that.info.state = 'dragDidStart';
            that.gesture = gesture;
            gesture.dragStartPos = {x:gesture.element.offsetLeft, y:gesture.element.offsetTop};
            that.target.ontouchstart = function(e){ e.preventDefault(); };
            window.dispatchEvent(new CustomEvent('slider.sliding.started', {
				detail: {that: that}
			}));

        },
        dragDidMove: function (gesture) {

            var newPos;
            that.gesture = gesture;
            that.info.state = 'sliding';

            if (that.dir === 'v') {

                newPos = gesture.dragStartPos.y + gesture.translation.y;
                if(newPos < 0) newPos = 0;
                if(newPos > that.info.height) newPos = that.info.height;
                that.handle.style.top = newPos + 'px';
                that.info.handle.top = newPos;

            } else {

                newPos = gesture.dragStartPos.x + gesture.translation.x;
                if(newPos < 0) newPos = 0;
                if(newPos > that.info.width) newPos = that.info.width;
                that.handle.style.left = newPos + 'px';
                that.info.handle.left = newPos;

            }

            that.getProgress();

            window.dispatchEvent(new CustomEvent('slider.sliding', {
				detail: {that: that}
			}));
            that.onSlide.call(that);

        },
        dragDidStop: function (gesture) {

            that.gesture = gesture;
            that.target.ontouchstart = function(e) { };
            that.info.state = 'dragDidStop';
            
            if (that.snapping) {

                var mod = (that.info.progress % that.snap) * 10,
                    prog = that.info.progress / that.snap;;

                if (mod > 0.5 ) {
                    that.setProgress(Math.ceil(prog) * 0.1);
                } else {
                    that.setProgress(Math.floor(prog) * 0.1);
                }

                window.dispatchEvent(new CustomEvent('slider.sliding.ended', {
                    detail: {that: that}
                }));

            } else {
                window.dispatchEvent(new CustomEvent('slider.sliding.ended', {
                    detail: {that: that}
                }));
            }

        }
    };
    that.drag = new NIBS.Drag(that.handle, that.actions);
    that.target.style.msTouchAction = 'none';

    NIBS.Slider.all['id' + that.id] = that;

};

NIBS.Slider.all = {};

NIBS.Slider.getUniqueId = function  () {
    var d = new Date().getTime();
    d += (parseInt(Math.random() * 100)).toString();
    return d;
};

NIBS.Slider.prototype = {};

NIBS.Slider.prototype.resize = function () {

	var that = this,
        newPos,
        wrapperInfo,
        handleInfo;

    wrapperInfo  = that.target.getBoundingClientRect();
    handleInfo  = that.handle.getBoundingClientRect();

    if (that.dir === 'v') {
        newPos = (wrapperInfo.height - that.info.handle.height) * that.info.progress;
        that.handle.style.top = newPos + 'px';
        that.info.handle.top = newPos;
    } else {
        newPos = (wrapperInfo.width - that.info.handle.width) * that.info.progress;
        that.handle.style.left = newPos + 'px';
        that.info.handle.left = newPos;
    }

    that.refresh();

};

NIBS.Slider.prototype.refresh = function () {

	var that = this,
        wrapperInfo,
        handleInfo;

    delete that.info.empty;

    wrapperInfo  = that.target.getBoundingClientRect();
    handleInfo  = that.handle.getBoundingClientRect();

    that.info.wrapperWidth = wrapperInfo.width;
    that.info.wrapperHeight = wrapperInfo.height;

    that.info.left = (that.info.left) ? that.info.left : 0;
    that.info.right = wrapperInfo.right;
    that.info.handle.width = handleInfo.width;
    that.info.handle.height = handleInfo.height;
    that.info.width = that.info.wrapperWidth - that.info.handle.width;
    that.info.height = that.info.wrapperHeight - that.info.handle.height;

    if (!that.info.handle.left) that.info.handle.left = 0;
    if (!that.info.progress) that.info.progress = 0;

};

NIBS.Slider.prototype.getProgress = function () {

	var that = this;

    if (that.info.empty) {
        that.refresh();
    }

    if (that.dir === 'v') {
        that.info.progress = that.info.handle.top / that.info.height;
    } else {
        that.info.progress = that.info.handle.left / that.info.width;
    }

    return that.info.progress;

};

NIBS.Slider.prototype.setProgress = function (newProgress) {

	var that = this;

    if (that.info.empty) {
        that.refresh();
    }
    that.info.progress = newProgress;

    if (that.dir === 'v') {
        that.info.handle.top = that.info.progress * that.info.height;
        that.handle.style.top = that.info.handle.top + 'px';
    } else {
        that.info.handle.left = that.info.progress * that.info.width;
        that.handle.style.left = that.info.handle.left + 'px';
    }

};

NIBS.Slider.prototype.destroy = function () {

	var that = this;
    delete NIBS.Slider.all[that.id];
    that.drag.dispose();

};
