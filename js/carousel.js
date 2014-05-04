/**
* Carousel constructor
* @args carousel:String - ID of the carousel container
* speed:int - how long in ms it should take to change slide
* autoplay:bool - if true, it will slide by itself until 'stop' method called
* duration:int - how long it should wait before next slide when is autoplay
* delay:int - how long it should wait before first slide is shown
* slideHeight:int - the height in pixels of each slide
* All arguments are optional except carousel
*/
goog.provide('bardis.ui.Carousel');
goog.require('goog.dom');
goog.require('goog.dom.query');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.ui.Component.EventType');
goog.require('goog.object');
goog.require('goog.style');
goog.require('goog.fx.dom');
goog.require('goog.fx.Animation');
goog.require('goog.array');
goog.require('goog.async.Delay');
goog.require('goog.Timer');
goog.require('goog.ui.Tab');
goog.require('goog.ui.TabBar');
            
bardis.ui.Carousel = function( carousel, speed , autoplay , duration, delay, slideHeight){
    
    // Creating the carousel navigation and slide contents
    this.slideContainer     = goog.dom.getElement('tourCarousel_content');
    this.slideNavigation    = goog.dom.getElement('tourCarouselNav');
    
    // Setting the carousel styles for the containers
    goog.style.setHeight(this.slideContainer, slideHeight);
     
    // Create a new istance of the Google UI TabBar Element for the carousel
    this.topTab = new goog.ui.TabBar();
    this.topTab.decorate(this.slideNavigation);
    this.tabButtons = goog.dom.getElementsByClass('goog-tab');
    
    // Set the initial styles for the slides of the carousel
    this.carouselSlides = goog.dom.getElementsByClass('slide');
    goog.array.forEach(this.carouselSlides, function(carouselSlide){
        goog.style.showElement(carouselSlide, false);
        goog.style.setOpacity(carouselSlide, 0);
        goog.style.setFloat(carouselSlide, 'none');        
        goog.style.setStyle(carouselSlide, {top: '0px'});
        goog.style.setStyle(carouselSlide, {left: '0px'});
        goog.style.setStyle(carouselSlide, {position: 'absolute'});
    }, this)
    
    // Stop the autoplay if a tab is clicked
    goog.array.forEach(this.tabButtons, function(tabButton){
        goog.events.listen(tabButton, goog.events.EventType.CLICK, function (e) { this.stopAutoplay(); }, false, this);
    }, this);
     
    // Handle SELECT events dispatched by tabs and set the carousel istance to the the "this" variable in the listener function.
    goog.events.listen(this.topTab, goog.ui.Component.EventType.SELECT, this.getNavSlide, false, this);
    
    // Set vars from arguments passed, or default
    this.autoplay   = autoplay || false;
    this.duration   = !isNaN( duration ) ? duration : 8000;
    this.speed      = speed || 750;
    this.delay      = delay || 0;

    // Set the initial information about the slides
    this.slides                 = goog.dom.query('#' + carousel + ' div.slide');
    this.totalSlides            = this.slides.length;
    this.currentSlidePointer    = 0;

    // Make global reference
    this.id = bardis.ui.Carousel.Instances.length;
    bardis.ui.Carousel.Instances[this.id] = this;

    // Not currently animated
    this.animating  = false;
    this.timer      = null;
    
    // Get the first slide to show
    this.delayedStart = new goog.async.Delay(this.getFirstSlide, this.delay, this);
    this.delayedStart.start();
};


/**
* getFirstSlide
* finds the next slide and calls fadeSlide
*/
bardis.ui.Carousel.prototype.getFirstSlide = function(){
    
    this.topTab.setSelectedTabIndex(0);
    this.delayedStart.dispose();
}

/**
* calcNextSlide
* @args direction:String - where to move to
* finds the next slideIndex
*/
bardis.ui.Carousel.prototype.calcNextSlide = function(direction){
    
    // Find the next slide that will be displayed
    if( direction == 'forward' )
    {
        this.slidePointer = this.currentSlidePointer + 1;
        if(this.slidePointer == this.totalSlides)
        {
            this.slidePointer = 0;
        }
    }
    else if( direction == 'previous' )
    {
        this.slidePointer = this.currentSlidePointer - 1;
        if(this.slidePointer < 0)
        {
            this.slidePointer = this.totalSlides - 1;
        }
    }
    else
    {
        this.slidePointer = direction;          
    }
}

/**
* getNextSlide
* @args slideIndex:String - where to move to
* finds the next slideIndex and calls fadeSlide
*/
bardis.ui.Carousel.prototype.getNextSlide = function(slideIndex){

    // If we are already animating then exit
    if( this.animating ) return;
    
    // Get currently active slide
    var currentSlide    = this.slides[this.currentSlidePointer];
    
    // Get next slide to show
    this.slidePointer   = slideIndex;
    nextSlide           = this.slides[this.slidePointer];
    
    // Fade to next slide
    this.fadeSlide( currentSlide , nextSlide );

};

/**
* fadeSlide
* fades to the next slide as appropriate
* @args currentSlide:Object - current Slide
* nextSlide:Object - target Slide
*/
bardis.ui.Carousel.prototype.fadeSlide = function( currentSlide , nextSlide ){
    
    // Create animation objects    
    if(currentSlide.id == nextSlide.id)
    {
        this.animShow = new goog.fx.dom.FadeInAndShow(nextSlide, this.speed);
        // Bind listeners
        goog.events.listen( this.animShow , goog.fx.Animation.EventType.END , this.slideChangeDone , false , this );

        // Start animation
        this.animShow.play(false);
    }
    else
    {
        this.animHide = new goog.fx.dom.FadeOutAndHide(currentSlide, this.speed);
        this.animShow = new goog.fx.dom.FadeInAndShow(nextSlide, this.speed);
        // Bind listeners
        goog.events.listen( this.animShow , goog.fx.Animation.EventType.END , this.slideChangeDone , false , this );

        // Start animation
        this.animHide.play(false);
        this.animShow.play(false);
        
        // Toggle the active state class in the slides
        goog.dom.classes.toggle(currentSlide, 'activeSlide');
        goog.dom.classes.toggle(nextSlide, 'activeSlide');
    }
    
    this.animating = true;

};

/**
* slideChangeDone
* @args e:Event - Animation Event
*/
bardis.ui.Carousel.prototype.slideChangeDone = function( e ){
    
    // Fade animation for slide change has ended
    this.animating = false;
    this.currentSlidePointer = this.slidePointer;
    if(this.autoplay)
    {
        this.calcNextSlide('forward');
        nextSlide = this.slidePointer;
        this.timer = setTimeout('Carousel_Instances[' + this.id + '].topTab.setSelectedTabIndex(nextSlide)', this.duration);
    }
};

/***
* getNavSlide
* stops the slideshow if automated
*/
bardis.ui.Carousel.prototype.getNavSlide = function(e){
    
    var tabSelected = e.target;
    var nextSlideId = tabSelected.getId();
    
    // Setting the next slide index by keeping only the number of teh element id
    this.getNextSlide(parseInt(nextSlideId.substr(5)));
};

/***
* startAutoplay
* starts automated slideshow
*/
bardis.ui.Carousel.prototype.startAutoplay = function(){
    
    this.autoplay = true;
    clearTimeout( this.timer );
    this.calcNextSlide('forward');
    nextSlide = this.slidePointer;
    this.topTab.setSelectedTabIndex(nextSlide);
};

/***
* stopAutoplay
* stops the slideshow if automated
*/
bardis.ui.Carousel.prototype.stopAutoplay = function(){
    
    this.autoplay = false;
    clearTimeout( this.timer );
};

/***
* make Instances array and export symbols
*/
bardis.ui.Carousel.Instances = new Array();

// export symbols
goog.exportSymbol('Carousel_Instances', bardis.ui.Carousel.Instances );
goog.exportSymbol('Carousel', bardis.ui.Carousel);