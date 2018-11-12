/**
 * demo.js
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2018, Codrops
 * http://www.codrops.com
 */
{
    // Lighter to darker.
    const colors = ['#f6f6f6','#f0f0f0','#e3e3e3','#d7d7d7','#d0d0d0'];

    // The page turning animations.
    class PageTurn {
        constructor(el, pagesTotal) {
            this.DOM = {el: el};
            this.config = {
                // Duration for each page turn animation.
                duration: 1.6,
                // Delay between the pages. Need to be tuned correctly together with the duration, so that there are no gaps between the pages, otherwise the content switch would be visible.
                pagesDelay: 0.15,
                // Ease for each page turn animation. Needs to be easeInOut
                ease: Quint.easeInOut
            };
            // Both sides.
            this.DOM.pagesWrap = {
                left: this.DOM.el.querySelector('.revealer__item--left'),
                right: this.DOM.el.querySelector('.revealer__item--right')
            };
            // Create the turning pages.
            let pagesHTML = '';
            for (let i = 0; i <= pagesTotal; ++i) {
                // Setting the color of the turning page based on the colors array
                // todo: Need to find a better way to do this..
                const color = colors[i] || colors[0];
                pagesHTML += `<div class="revealer__item-inner" style="background-color:${color};"></div>`;
            }
            this.DOM.pagesWrap.left.innerHTML = this.DOM.pagesWrap.right.innerHTML = pagesHTML;
            // All the turning pages.
            this.DOM.pages = {
                left: Array.from(this.DOM.pagesWrap.left.querySelectorAll('.revealer__item-inner')),
                right: Array.from(this.DOM.pagesWrap.right.querySelectorAll('.revealer__item-inner'))
            };
        }
        // The pages will be initially translated to the right or left (100% or -100% on the x-axis) and then animated to the opposite side.
        addTween(side, direction, nmbPages) {
            const pages = this.DOM.pages[side];
            for (let i = 0, len = nmbPages-1; i <= len; ++i) {
                const page = pages[i];
                this.tl.to(page, this.config.duration, {
                    ease: this.config.ease,
                    startAt: {x: direction === 'next' ? '100%' : '-100%'},
                    x: direction === 'next' ? '-100%' : '100%'
                }, i * this.config.pagesDelay);
            }
        }
        createTweens(direction, nmbPages) {
            this.addTween('left', direction, nmbPages);
            this.addTween('right', direction, nmbPages);
        }
        turn(direction, nmbPages, middleAnimationCallback) {
            return new Promise((resolve, reject) => {
                this.tl = new TimelineMax({onComplete: resolve, paused: true});
                // Add a callback for the middle of the animation.
                if ( middleAnimationCallback ) {
                    this.tl.addCallback(middleAnimationCallback, (this.config.duration + (nmbPages-1)*this.config.pagesDelay)/2);
                }
                this.createTweens(direction, nmbPages);
                this.tl.resume();
            });
        }
    }

    // Window sizes.
    let winsize;
    const calcWinsize = () => winsize = {width: window.innerWidth, height: window.innerHeight};
    calcWinsize();
    window.addEventListener('resize', calcWinsize);
    
    // Class for a content item.
    class Item {
        constructor(el) {
            this.DOM = {el: el};
            // The inner contains both the image and reveal elements.
            this.DOM.inner = this.DOM.el.querySelector('.slide__figure-inner');
            // The image.
            this.DOM.image = this.DOM.inner.querySelector('.slide__figure-img');
            // The reveal element (element that is on top of the image and moves away to reveal the image).
            this.DOM.reveal = this.DOM.inner.querySelector('.slide__figure-reveal');
            // Title and description.
            this.DOM.title = this.DOM.el.querySelector('.slide__figure-title');
            this.DOM.description = this.DOM.el.querySelector('.slide__figure-description');

            const calcRect = () => this.rect = this.DOM.el.getBoundingClientRect();
            window.addEventListener('resize', calcRect);
            calcRect();
        }
        // Gets the side where the item is on the slideshow/viewport (left or right).
        getSide() {
            // Item´s center point.
            const center = {x: this.rect.left+this.rect.width/2, y: this.rect.top+this.rect.height/2};
            return center.x >= winsize.width/2 ? 'right' : 'left';
        }
    }

    // A slide is the two "pages" that are currently visible.
    class Slide {
        constructor(el) {
            this.DOM = {el: el};
            // Content item instances.
            this.items = [];
            // The figures
            Array.from(this.DOM.el.querySelectorAll('.slide__figure')).forEach((item) => this.items.push(new Item(item)));
        }
        // Show its content items.
        showItems(direction) {
            return new Promise((resolve, reject) => {
                const duration = 1;
                const ease = Expo.easeOut;
                this.tl = new TimelineMax({onComplete: resolve}).add('begin');
                for (const item of this.items) {
                    // Animate the main element (translation of the whole item).
                    this.tl.to(item.DOM.el, duration, { 
                        ease: ease,
                        startAt: {x: direction === 'next' ? 60 : -60, opacity: 1},
                        x: '0%',
                    }, 'begin')
                    // Animate the rotationZ for the elements that are inside the turning side.
                    if ( direction === 'next' && item.getSide() === 'left' || direction === 'prev' && item.getSide() === 'right' ) {
                        // Animate the perspective element
                        TweenMax.set(item.DOM.inner, {'transform-origin': direction === 'next' ? '100% 50%' : '0% 50%'});
                        this.tl.to(item.DOM.inner, duration, { 
                            ease: ease,
                            startAt: {
                                rotationY: direction === 'next' ? 30 : -30, 
                                //rotationZ: direction === 'next' ?  5 : -5
                            },
                            rotationY: 0.1,
                            //rotationZ: 0
                        }, 'begin');
                    }
                    // Animate the reveal element away from the image.
                    this.tl.to(item.DOM.reveal, duration, { 
                        ease: ease,
                        startAt: {x: '0%'},
                        x: direction === 'next' ? '-100%' : '100%'
                    }, 'begin')
                    // Animate the scale of the image.
                    .to(item.DOM.image, duration, {
                        ease: ease,
                        startAt: {
                            scale: 1.5, 
                            //rotationZ: direction === 'next' ?  -5 : 5
                        },
                        scale: 1
                        //rotationZ: 0
                    }, 'begin')
                    // Animate the title in.
                    .to(item.DOM.title, duration*0.8, {
                        ease: Quart.easeOut,
                        startAt: {x: direction === 'next' ? 15 : -15, opacity: 0},
                        x: '0%',
                        opacity: 1
                    }, 'begin+=0.25')
                    // Animate the description in.
                    .to(item.DOM.description, duration*0.8, {
                        ease: Quart.easeOut,
                        startAt: {x: direction === 'next' ? 20 : -20, opacity: 0},
                        x: '0%',
                        opacity: 1
                    }, 'begin+=0.3');
                }
            });
        }
        // Reset items after the page turns.
        resetItems() {
            for (const item of this.items) {
                TweenMax.set(item.DOM.el, {opacity: 0});
                TweenMax.set([item.DOM.title,item.DOM.description], {opacity: 0});
            }
        }
    }

    class Slideshow {
        constructor(el) {
            this.DOM = {el: el};
            // Current slide´s index.
            this.current = 0;
            // Slide instances.
            this.slides = [];
            Array.from(this.DOM.el.querySelectorAll('.slide')).forEach((slide) => this.slides.push(new Slide(slide)));
            this.slidesTotal = this.slides.length;
            // Set the first slide as current.
            this.slides[this.current].DOM.el.classList.add('slide--current');
            // The page turning animations.
            this.pageturn = new PageTurn(this.DOM.el.querySelector('.revealer'), this.slidesTotal);
            // The arrows to navigate the slideshow.
            this.pagination = {
                prevCtrl: this.DOM.el.querySelector('.arrow-nav__item--prev'),
                nextCtrl: this.DOM.el.querySelector('.arrow-nav__item--next')
            };
            // The table of contents element.
            this.DOM.nav = this.DOM.el.querySelector('.nav');
            this.DOM.navCtrl = this.DOM.nav.querySelector('.nav__button');
            // ..Its items.
            this.DOM.tocItems = Array.from(this.DOM.nav.querySelectorAll('.toc > .toc__item'));
            // Set the first one as current.
            this.DOM.tocItems[this.current].classList.add('toc__item--current');
            // Current chapter name (TOC Item that is selected and visible next to the "index+").
            this.DOM.chapter =  this.DOM.nav.querySelector('.nav__chapter');
            // The "book" left/right cover indicators.
            this.DOM.indicators = Array.from(this.DOM.el.querySelectorAll('.slideshow__indicator'));
            // The one on the right side is not visible in the beginning while the one on the left is fully visible.
            // We will later change this as we turn the pages.
            TweenMax.set(this.DOM.indicators[1], {scaleX:0});
            this.initEvents();
        }
        initEvents() {
            // Clicking on the next and previous arrows will turn the page to right or left.
            const arrowClickPrevFn = () => this.pagethrough('prev');
            const arrowClickNextFn = () => this.pagethrough('next');
            this.pagination.prevCtrl.addEventListener('click', arrowClickPrevFn);
            this.pagination.nextCtrl.addEventListener('click', arrowClickNextFn);
            
            // Clicking the TOC element reveals or hides the TOC.
            const navClickFn = () => this.toggleToc();
            this.DOM.navCtrl.addEventListener('click', navClickFn);

            // Clicking a link inside the TOC to go to a specific page
            this.DOM.tocItems.forEach((tocItem, pos) => {
                tocItem.addEventListener('click', (ev) => {
                    ev.preventDefault();
                    this.navigate(pos);
                });
            });
        }
        // This function is executed at the middle point of the turning pages animation.
        switchPage(newPagePos, direction = 'next') {
            const currentSlide = this.slides[this.current];
            const upcomingSlide = this.slides[newPagePos];
            // Set the upcoming slide as current.
            currentSlide.DOM.el.classList.remove('slide--current');
            currentSlide.resetItems();
            upcomingSlide.DOM.el.style.zIndex = 100;
            upcomingSlide.showItems(direction).then(() => {
                upcomingSlide.DOM.el.classList.add('slide--current');
                upcomingSlide.DOM.el.style.zIndex = '';
                this.isAnimating = false;
            });
            // Update the side indicators.
            TweenMax.to(this.DOM.indicators[0], .5, {ease: Expo.easeOut, scaleX:1-newPagePos/(this.slidesTotal-1)});
            TweenMax.to(this.DOM.indicators[1], .5, {ease: Expo.easeOut, scaleX:newPagePos/(this.slidesTotal-1)});
            // Update TOC
            this.updateToc(newPagePos);
            // Update current value.
            this.current = newPagePos;
            // Update pagination ctrls visibility.
            this.pagination.nextCtrl.style.visibility = this.current === this.slidesTotal-1 ? 'hidden' : 'visible';
            this.pagination.prevCtrl.style.visibility = this.current === 0 ? 'hidden' : 'visible';
        }
        // Go to the next or previous page.
        pagethrough(direction) {
            if ( this.isAnimating || direction === 'next' && this.current === this.slidesTotal-1 || direction === 'prev' && this.current === 0 ) {
                return false;
            }
            this.isAnimating = true;
            const newPagePos = direction === 'next' ? this.current + 1 : this.current - 1;
            this.pageturn.turn(direction, 1, () => this.switchPage(newPagePos, direction));
        }
        // Show or hide the TOC.
        toggleToc() {
            if ( this.isTocOpen ) {
                this.DOM.chapter.style.opacity = 1;
                this.DOM.nav.classList.remove('nav--open');
                TweenMax.set(this.DOM.tocItems, {opacity: 0});
            }
            else {
                this.DOM.chapter.style.opacity = 0;
                this.DOM.nav.classList.add('nav--open');
                TweenMax.staggerTo(this.DOM.tocItems, 1, {
                    ease: Expo.easeOut,
                    startAt: {opacity: 0, y: 10},
                    opacity: 1,
                    y: 0
                }, 0.02);
            }
            this.isTocOpen = !this.isTocOpen;
        }
        // Update the current TOC item.
        updateToc(newpos) {
            this.DOM.tocItems[this.current].classList.remove('toc__item--current');
            this.DOM.tocItems[newpos].classList.add('toc__item--current');
            this.DOM.chapter.innerHTML = this.DOM.tocItems[newpos].querySelector('.toc__item-title').innerHTML;
        }
        // Clicking a link inside the TOC will turn as many pages needed and jump to the specified page.
        navigate(newPagePos) {
            if ( this.isAnimating || newPagePos === this.current ) {
                return false;
            }
            this.isAnimating = true;
            // Close after clicking.
            this.toggleToc();
            const direction = newPagePos > this.current ? 'next' : 'prev';
            // Turn [this.current-newPagePos] pages.
            this.pageturn.turn(direction, Math.abs(this.current-newPagePos), () => this.switchPage(newPagePos, direction));
        }
    }

    // Initialize the slideshow.
    const slideshow = new Slideshow(document.querySelector('.slideshow'));
    
    // Preload all the images in the page.
    imagesLoaded(document.querySelectorAll('.slide__figure-img'), {background: true}, () => document.body.classList.remove('loading'));
}
