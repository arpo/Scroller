/**
 * @version 2.12
 * Copyright 2013, Licensed GPL & MIT
*/

var NIBS = NIBS || {};
NIBS.scrollerUtils = (function () {
	return {
		setupSwipeNav: function ($target, onSwipeEnter, options) {

			options = options || {};
			if(!("pagination" in options)) {
				options.pagination = true;
			}
			if(!("arrows" in options)) {
				options.arrows = true;
			}

			var menu;
			var resizeTimer;
			var pageWidth = $target.width();
			var currentPage = 0;
			var delegate = {};
			var scroller = new NIBS.Scroller($target, delegate);
			var content = $(scroller.contentNode);
			var pages = content.children();
			var numPages = pages.length;
			var dontUpdateWhenAnimating = false;

			var useAutoplay = false;
			var autoplayIntervalTime = 4000;
			var autoplayInterval;
			var autoplayRestartTimer;
			var autoplayRestartTimerTime = 4000;
			var doAutoplay = false;
			var customOnScrollStart;
			var doDefaultOnScrollStuff = function () {
				haltAutoplay();
			};

			if(!("onScoll" in options)) {
				options.onScoll = function () {};
			}

			if(!("onScrollStart" in options)) {
				options.onScrollStart = doDefaultOnScrollStuff;
			} else {
				customOnScrollStart = options.onScrollStart;
				options.onScrollStart = function () {
					customOnScrollStart();
					doDefaultOnScrollStuff();
				};
			}

			if(!("onDragEnd" in options)) {
				options.onDragEnd = function () {};
			}

			var startAuroplay = function () {
				if (!useAutoplay) {
					return;
				}
				autoplayInterval = setInterval(function () {
					scroller.next();
				}, autoplayIntervalTime);
			};

			var stopAuroplay = function () {
				if (!useAutoplay) {
					return;
				}
				clearInterval(autoplayInterval);
			};	

			var haltAutoplay = function() {
				if (!useAutoplay) {
					return;
				}
				stopAuroplay();
				clearTimeout(autoplayRestartTimer);
				autoplayRestartTimer = setTimeout(function () {
					startAuroplay();
				}, autoplayRestartTimerTime);
			};

			var updateDot = function() {
				var $dot = $target.find('.nibs-paginationDot');
				$dot.removeClass('nibs-current-swipe-section');
				$dot.eq(currentPage).addClass('nibs-current-swipe-section');
			};
			var updateMenu = function() {
				if(menu) {
					menu.find('a').removeClass('nibs-swipe-menu-selected').eq(currentPage).addClass('nibs-swipe-menu-selected');
				}
			};
			var layoutMenu = function() {
				if(menu) {
					var buttons = container.find('a');
					var menuWidth = options.menuWidth || $target.width();
					var buttonWidth = Math.round(menuWidth / buttons.length);
					var borderWidth = 31;
					var lastButton = buttons.last();
					buttons.width(buttonWidth - borderWidth);
					lastButton.width(menuWidth - lastButton.position().left - borderWidth);
				}
			};
			var replaceNarArrows = function () {
				//Do stuff after resizing is done.
				if (resizeTimer) {
					window.clearTimeout(resizeTimer);
				}
				resizeTimer = window.setTimeout(function () {
					var btn = $('.nibs-swipenav-btn'), curr;
					btn.each(function (index) {
						curr = $(this);
						var cont = curr.closest('.nibs-swipe');
						curr.css({top: cont.outerHeight() / 2 - curr.outerHeight()});
					});
				}, 100);
			};
			var resize = function() {
				layoutMenu();
				replaceNarArrows();
				var page = currentPage;
				pageWidth = $target.width();

				content.css({width:pageWidth * numPages});
				content.children().css({width:pageWidth});

				scroller.setContentSize(pageWidth * numPages, 0);
				scroller.layout();
				scroller.setContentOffset(pageWidth * page, 0);
			};
			var gotoPage = function(index, speed) {

				if (scroller.disabled) {
					return;
				}

				if(index < 0) {
					if (scroller.endStop) {
						return;
					}
					index = numPages - 1;
				}
				else if(index > numPages - 1) {
					if (scroller.endStop) {
						return;
					}
					index = 0;
				}
				dontUpdateWhenAnimating = true;
				if (typeof(speed) === 'undefined') {
					speed = scroller.speed;
				}

				scroller.setContentOffset(index * pageWidth, 0, speed);
				if(onSwipeEnter) {
					onSwipeEnter(scroller.node, index, pages[index]);
				}
			};

			content.css({"list-style":"none", width:pageWidth * numPages, height:"100%" });
			content.children().css({position: "relative", width: pageWidth, height: "100%", 'float':"left"});

			scroller.endStop = false;
			scroller.slide = scroller.gotoPage = gotoPage;
			scroller.prev = function(){
				gotoPage(currentPage - 1);
			};
			scroller.next = function(){
				gotoPage(currentPage + 1);
			};

			scroller.autoplay = function(time){
				useAutoplay = true;
				autoplayIntervalTime = time || autoplayIntervalTime;
				startAuroplay();
			};

			scroller.paging = true;
			scroller.setContentSize(pageWidth * numPages, 0);

			delegate.scrollerDidScroll = function(scroller) {

				options.onScoll(scroller);

				if(dontUpdateWhenAnimating) {
					if(!scroller.animating) {
						dontUpdateWhenAnimating = false;
					}
				}

				var page = Math.round(scroller.getContentOffset().x / pageWidth);
				if(page != currentPage) {
					currentPage = page;
					updateDot();
					updateMenu();
					if(onSwipeEnter && !dontUpdateWhenAnimating) {
						onSwipeEnter(scroller.node, currentPage, pages[currentPage]);
					}
				}
			};

			delegate.onScrollStart = options.onScrollStart;
			delegate.onDragEnd = options.onDragEnd;

			if ($target.find('.nibs-swipe-pagination').length === 0) {
				$target.append($('<div class="ta-break"></div><a href="javascript:" class="nibs-swipenav-btn nibs-prev-btn"></a><a href="javascript:" class="nibs-swipenav-btn nibs-next-btn"></a><div class="nibs-swipe-pagination"><div class="nibs-pagination-bg"></div><div class="nibs-dotContainer"></div></div>'));
			}

			if(options.menu && numPages > 2) {
				menu = $('<div class="nibs-swipe-menu"></div>');
				var container = $('<div class="nibs-swipe-menu-buttons"></div>');
				pages.each(function(index, el){
					container.append('<a href="#" class="'+ (index === 0 ? ' nibs-swipe-menu-selected' : '' ) +'">' + $(el).data("label") + '</a>');
				});
				menu.append(container);
				menu.find("a").click(function(e) {
					e.preventDefault();
					var index = $(e.currentTarget).index();
					gotoPage(index);
				});
				$target.before(menu);
				layoutMenu();
				updateMenu();
			}

			if(options.pagination && numPages > 2) {
				var dotCode = "";
				for(var i = 0; i<numPages; i++) {
					dotCode += '<b class="nibs-paginationDot"></b>';
				}
				$target.find('.nibs-swipe-pagination .nibs-dotContainer').html(dotCode);
				$target.find('.nibs-paginationDot').click(function () {
					gotoPage($(this).index());
					haltAutoplay();
				});
				updateDot();
			}
			else {
				$target.find('.nibs-swipe-pagination').remove();
			}

			if(options.arrows && numPages > 2) {
				$target.find('.cb-prev-btn, .nibs-swipenav-btn.nibs-prev-btn').click(function (e) {
					e.preventDefault();
					haltAutoplay();
					gotoPage(currentPage - 1);
				});
				$target.find('.cb-next-btn, .nibs-swipenav-btn.nibs-next-btn').click(function (e) {
					e.preventDefault();
					haltAutoplay();
					gotoPage(currentPage + 1);
				});

				var swipenavBtn = $target.find('.nibs-swipenav-btn');

				var showOnlyOnMouseOver = false;
				if (showOnlyOnMouseOver) {
					$target.hover(function() {
						swipenavBtn.show();
					},
					function() {
						swipenavBtn.hide();
					});
				}

				swipenavBtn.css({top:$target.outerHeight() / 2 - swipenavBtn.eq(1).outerHeight()});
				replaceNarArrows();
			}
			else {
				$target.find('.cb-prev-btn, .nibs-swipenav-btn.nibs-prev-btn').remove();
				$target.find('.cb-next-btn, .nibs-swipenav-btn.nibs-next-btn').remove();
			}


			if("page" in options) {
				scroller.setContentOffset(options.page * pageWidth, 0);
			}


			var scrollerDispose = scroller.dispose;
			scroller.dispose = function() {

				if (autoplayInterval) {
					clearInterval(autoplayInterval);
				}

				if (autoplayRestartTimer) {
					clearTimeout(autoplayRestartTimer);
				}

				if ($(window).off) {
					$(window).off("resize", resize);
				} else if ($(window).unbind) {
					$(window).unbind("resize", resize);
				}
				scrollerDispose.apply(scroller);
			};

			$(window).resize(resize);

			return scroller;
		}
	};
}());
