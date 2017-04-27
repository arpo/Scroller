SCROLLER
========

Scroller is excellent to use for swipes and as a custom scroller. Works from IE6 to Windows mobile 8. Swiping is possible on both touch devices and desktop.

To set up Scroller as a swipe use ScollerUtils.

Basic setup
-----------

The markup for a swipe can look like this:

	<div data-adapt="height" class="nibs-swipe swipe1" tabindex="0">
		<ul class="nibs-swipe-pages">
			<li data-label="Tab 1" style="background-image:url('assets/images/healtBg.jpg');">1</li>
			<li data-label="Tab 2" style="background-image:url('assets/images/energyBg.jpg');">2</li>
			<li data-label="Tab 3" style="background-image:url('assets/images/birdBg.jpg');">3</li>
			<li data-label="Tab 4" style="background-image:url('assets/images/lindberg.jpg');">4</li>
		</ul>
	</div>

Setup the swipe like this:

	function callback (e, index, slide) {
		console.log('Entered slide ' + index);
	}
	var swipe = NIBS.scrollerUtils.setupSwipeNav($('.swipe1'), callback, {menu: false, arrows:true, pagination: true});

- First parram is a jQuery object of the containing div.
- Second param is a callback function to call everytime a slide is entered.
- Third param is an object containing optional info. The values in the example above is default and can be omitted. Also callback can be omitted if not needed.

An even more basic setup could look like this.

	var swipe = NIBS.scrollerUtils.setupSwipeNav($('.swipe1'));

Scroller + ScollerUtils has this methodes and properies:  

Methodes
========

next()
------
Go to next slide.

	var swipe = NIBS.scrollerUtils.setupSwipeNav($('.swipe1'), callback, {menu: false, arrows:true, pagination: true});
	swipe.next();

prev()
------
Go to previous slide.

	var swipe = NIBS.scrollerUtils.setupSwipeNav($('.swipe1'));
	swipe.prev();

slide(slideNo, speed)
---------------------
slideNo, the slide to swipe to. Where the first slide is 0.
speed, slide speed in ms (optional)

	var swipe = NIBS.scrollerUtils.setupSwipeNav($('.swipe1'), callback, {menu: false, arrows:true, pagination: true});
	swipe.slide(2);

off()
---------
Turn off scroller temporary
swipe.off();

on()
---------
Turn on scroller after it's been turn off.
swipe.on();


speed
-----
The swipe time in ms.
Can be both get and set. Default 400.

	var scroller = new NIBS.Scroller($('.nibs-scroller'));
	scroller.speed = 1000;

endStop
-------
If next and prev function should stop at and of slide or not.
Can be both get and set. Default false.

	var scroller = new NIBS.Scroller($('.nibs-scroller'));
	scroller.speed = 1000;

autoplay
--------
Make the swipe autoplay, stop on user interactions and restart on idle.

	var swipe = NIBS.scrollerUtils.setupSwipeNav($('.swipe1'), callback, {menu: false, arrows:true, pagination: true});
	swipe.autoplay();

You can set the time like this:

	swipe.autoplay(1500);

Default is 4000 ms.

Options
=====================================

A basic setup can look like this:
var swipe = NIBS.scrollerUtils.setupSwipeNav($('.swipe1'), callback, options);

* $('.swipe1') is a jQuery object of the div containing the Swipe UL.

* callback is the function to fire when a new slide is entered.

* optino is an object where you can add options for the swipe.

It can look like this:

	var options = {
		menu: false,
		arrows:true,
		pagination: true,
		onScoll: function(scroller) { //Do things when scrolling occurs.
			var offset = scroller.getContentOffset()
			//console.log(offset.x);
		},
		onScrollStart: function (scroller) {
			console.log('Scroll Start');
		},
		onDragEnd: function (scroller) {
			console.log('Drag End');
		}
	};

Scroller has this methodes and properies.

dispose()
---------
Dispose the scroller.

	var swipe = NIBS.scrollerUtils.setupSwipeNav($('.swipe1'), callback, {menu: false, arrows:true, pagination: true});
	swipe.dispose();

setTrackbarVisible(boolean)
---------------------------
Display the scrollbar when using Scroller as a custom scroller.

	var scroller = new NIBS.Scroller($('.nibs-scroller'));
	scroller.endStop = true;

paging
------
If Scroller should snap to each page or not.
Can be both get and set. Default false.

	var scroller = new NIBS.Scroller($('.nibs-scroller'));
	scroller.paging = true;
