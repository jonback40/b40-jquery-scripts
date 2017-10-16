;(function($, document, window) {
	
	
	'use strict';
	
	
	/*
	 *
	 * Class Definition
	 * --------------------------------------------------
	 *
	 */
	 
	
	var Reach = function(element, destination, options) {
		this.$element = $(element);
		this.options = options;
		
		this.$document = $(document);
		this.$window = $(window).
			on('scroll', $.proxy(this._update, this)).
			on('resize', $.proxy(this._updateWindow, this));
		
		this.documentHeight = 0;
		this.windowHeight = 0;
		this.scrollTop = 0;
		this.scrollBottom = 0;
		this.scrollProgress = 0;
		
		this.duration = 0;
		this.destination = destination;
		this.destinationMapper = function() {};
		
		this.$target = null;
		this.targetOffset = 0;
		this.targetMapper = function() {};
		
		this.focalPoint = 0;
		this.focalPointMapper = function() {};
		
		this._hasCalled = false;
		
		this.init();
	};
	
	Reach.NAMESPACE = 'b40.reach';
	
	Reach.DEFAULTS = {
		before:			function() {},
		after:			function() {},
		persist:		false,
		persistBefore:	false,
		persistAfter:	false,
		focalPoint:		'top', // top, bottom or function()
		//offset:			0
	};
	
	Reach.prototype = {
		
		// Init
		init: function() {
			// set destination mapper
			var type = typeof this.destination;
			
			if (type == 'object') {
				this.$target = this.destination;
				this.destinationMapper = this._mapFromElement;
			} else if (type == 'number') {
				this.destinationMapper = this._mapFromNumber;
			} else if (type == 'string' && (/^\d{0,2}%$/).test(this.destination)) {
				this.destination = parseInt(this.destination);
				this.destinationMapper = this._mapFromPercent;
			} else if (type == 'function') {
				this.targetMapper = this.destination;
				this.destinationMapper = this._mapFromFunction;
			}
			
			// set focal point mapper
			switch (this.options.focalPoint) {
				case 'top':
					this.focalPointMapper = this._mapFromTop;
					break;
				case 'bottom':
					this.focalPointMapper = this._mapFromBottom;
					break;
				default:
					this.focalPointMapper = this.options.focalPoint;
			}
			
			this.$window.trigger('resize');
		},
		
		
		// Setters
		_setScrollTop:		function() { this.scrollTop = this.$window.scrollTop() },
		_setScrollBottom:	function() { this.scrollBottom = this.scrollTop + this.windowHeight },
		_setFocalPoint:		function() { this.focalPoint = this.focalPointMapper() },
		_setProgress:		function() { this.scrollProgress = Math.round(this.scrollTop / this.duration * 100) },
		_setDuration:		function() { this.duration = this.documentHeight - this.windowHeight },
		
		
		// Getters
		_getCallbackData: function() {
			return {
				position: this.scrollTop,
				progress: this.scrollProgress,
				duration: this.duration
			};
		},
		
		
		// Mappers
		_mapFromTop:		function() { return this.scrollTop },
		_mapFromBottom:		function() { return this.scrollBottom },
		
		_mapFromElement:	function($this) { return $this.focalPoint >= $this.targetOffset },
		_mapFromNumber:		function($this) { return $this.focalPoint >= $this.destination },
		_mapFromPercent:	function($this) { return $this.scrollProgress >= $this.destination },
		_mapFromFunction:	function($this, element, data) { return this.targetMapper.call(element, data) },
		
		
		// Updaters
		_updateWindow: function() {
			this.documentHeight		= this.$document.height();
			this.windowHeight		= this.$window.height();
			
			this.targetOffset		= this.$target ? Math.round(this.$target.offset().top) : 0;
			
			this._setScrollTop();
			this._setScrollBottom();
			this._setFocalPoint();
			this._setDuration();
			this._setProgress();
			this._update();
		},
		
		
		_hasReached: function(element, data) {
			return this.destinationMapper(this, element, data);
		},
		
		
		_notify: function(element, fn, data, called, persist) {
			fn = $.proxy(fn, element, data);
			
			if (this._hasCalled === called) {
				if (this.options.persist || persist) {
					fn(); // call again
				}
			} else {
				this._hasCalled = called;
				fn(); // first call since we last crossed the destination
			}
		},
		
		
		_update: function() {
			this._setScrollTop();
			this._setScrollBottom();
			this._setProgress();
			this._setFocalPoint();
			
			
			var $this = this,
				data = this._getCallbackData();
			
			return this.$element.each(function() {
				if ($this._hasReached(this, data)) { // (has reached) below destination
					$this._notify(this, $this.options.after, data, true, $this.options.persistAfter);
				} else { // above destination
					$this._notify(this, $this.options.before, data, false, $this.options.persistBefore);
				}
			});
		}
		
		
	};
	
	
	
	
	/*
	 *
	 * Plugin Definition
	 * --------------------------------------------------
	 *
	 */
	
	
	var klass	= Reach,
		plugin	= 'reach',
		old		= $.fn[plugin];
	
	
	$.fn[plugin] = function(destination, option) {
		
		// Normalize arguments
		if (arguments.length == 1) {
			option = destination;
			destination = null;
		}
		
		if (typeof option == 'function') { // no options given, just the basic callback
			option = {after: option};
		}
		
		return this.each(function() {
			var thisDestination;
			
			if (destination == null) {
				thisDestination = !this.ownerDocument ? 0 : $(this); // in case we passed in the [window]
			} else {
				thisDestination = destination;
			}
			
			var $this		= $(this),
				data		= $this.data(klass.NAMESPACE),
				options		= $.extend({}, klass.DEFAULTS, typeof option == 'object' && option);
			
			// Add the namespaced plugin reference to the element data if it doesn't already exist
			if (!data) {
				$this.data(klass.NAMESPACE, (data = new Reach(this, thisDestination, options)));
			}
		});
		
	};
	
	$.fn[plugin].Constructor = klass;
	
	// No conflict
	$.fn[plugin].noConflict = function() {
		$.fn[plugin] = old;
		return this;
	};
	

})($, document, window);