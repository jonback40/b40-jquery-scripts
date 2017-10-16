;(function($, document, window) {
	
	
	'use strict';
	
	
	/*
	 *
	 * Class Definition
	 * --------------------------------------------------
	 *
	 */
	
	
	var Parallax = function(element, options) {
		this.$element = $(element);
		this.options = options;
		
		this.$document = $(document);
		this.$window = $(window).
			scroll(this._update.bind(this)).
			resize(this._updateWindow.bind(this));
		
		this.documentHeight = 0;
		this.windowHeight = 0;
		this.scrollTop = 0;
		this.scrollBottom = 0;
		
		this.elementOffset = 0;
		this.elementHeight = 0;
		
		this.infiniteX = true;
		this.infiniteY = true;
		this.direction = 1;
		this.aboveFold = false;
		
		this.focalPoint = 0;
		this.focalPointMapper = function() {};
		
		this.init();
	}
	
	Parallax.NAMESPACE = 'b40.parallax';
	
	Parallax.DEFAULTS = {
		moveX:			'center', // string values don't get parsed
		moveY:			.5, // a value of 1 makes no change, negative values go in the opposite direction
		offset:			0,
		//minX:			null,
		//minY:			null,
		maxX:			null,
		maxY:			null,
		reverse:		false,
		//easing:			null,
		focalPoint:		'auto', // auto, top or bottom
		keepInBounds:	true,
		includeMargin:	true
	}
	
	Parallax.prototype = {
		
		// for legacy support, this was copied from later versions of jQuery
		isNumeric: function(obj) {
			return !jQuery.isArray(obj) && obj - parseFloat(obj) >= 0;
		},
		
		
		// Init
		init: function() {
			this.infiniteX = this.options.maxX != null ? false : true;
			this.infiniteY = this.options.maxY != null ? false : true;
			this.direction = this.options.reverse ? -1 : 1;
			
			// set focal point mapper
			switch (this.options.focalPoint) {
				case 'top':
					this.focalPointMapper = this._mapFromTop;
					break;
				case 'bottom':
					this.focalPointMapper = this._mapFromBottom;
					break;
				case 'auto':
				default:
					this.focalPointMapper = this._mapFromAuto;
			}
			
			this.$window.trigger('resize');
		},
		
		
		// Setters
		_setAboveFold:		function() { this.aboveFold = this.elementOffset < this.windowHeight },
		_setScrollTop:		function() { this.scrollTop = this.$window.scrollTop() },
		_setScrollBottom:	function() { this.scrollBottom = this.scrollTop + this.windowHeight },
		_setFocalPoint:		function() { this.focalPoint = this.focalPointMapper() },
		
		
		// Getters
		_getHeight:			function($element) { return this.options.includeMargin === true ? $element.outerHeight(true) : $element.height() },
		
		
		// Mappers
		_mapFromTop:		function() { return this.scrollTop },
		_mapFromBottom:		function() { return this.scrollBottom },
		_mapFromAuto:		function() { return this.aboveFold ? this.scrollTop : this.scrollBottom },
		
		
		// Updaters
		_updateWindow: function() {
			this.documentHeight		= this.$document.height();
			this.windowHeight		= this.$window.height();
			
			this.elementOffset		= Math.round(this.$element.offset().top);
			this.elementHeight		= this._getHeight(this.$element);
			
			this._setAboveFold();
			this._setScrollTop();
			this._setScrollBottom();
			this._setFocalPoint();
			this._update();
		},
		
		
		_inBounds: function() {
			return (this.elementOffset < this.scrollBottom + this.options.offset) &&
			      ((this.elementOffset + this.elementHeight) > this.scrollTop + this.options.offset);
		},
		
		
		_mapMove: function(speed, change, max, infinite) {
			var move = Math.round(change * speed);
			
			return (infinite ? move : Math.max(max, move)) * this.direction;
		},
		
		
		_move: function(element) {
			if (!this.options.keepInBounds || this._inBounds()) {
				var change = this.focalPoint - this.elementOffset,
					x = this.options.moveX,
					y = this.options.moveY,
					moveX = this.isNumeric(x) ? this._mapMove(x, change, this.options.maxX, this.infiniteX) + 'px' : x,
					moveY = this.isNumeric(y) ? this._mapMove(y, change, this.options.maxY, this.infiniteY) + 'px' : y;
				
				$(element).css('backgroundPosition', moveX + ' ' + moveY);
			}
		},
		
		
		_update: function() {
			this._setScrollTop();
			this._setScrollBottom();
			this._setFocalPoint();
			
			var $this = this;
			return this.$element.each(function() {
				$this._move(this);
			});
		}
		
		
	}
	
	
	
	
	/*
	 *
	 * Plugin Definition
	 * --------------------------------------------------
	 *
	 */
	
	
	var klass	= Parallax,
		plugin	= 'parallax',
		old		= $.fn[plugin];
	
	
	$.fn[plugin] = function(option) {
		return this.each(function() {
			
			var $this		= $(this),
				data		= $this.data(klass.NAMESPACE),
				options		= $.extend({}, klass.DEFAULTS, typeof option == 'object' && option);
			
			// Add the namespaced plugin reference to the element data if it doesn't already exist
			if (!data) {
				$this.data(klass.NAMESPACE, (data = new Parallax(this, options)));
			}
			
		});
	}
	
	$.fn[plugin].Constructor = klass;
	
	// No conflict
	$.fn[plugin].noConflict = function() {
		$.fn[plugin] = old;
		return this;
	}
	

})($, document, window);