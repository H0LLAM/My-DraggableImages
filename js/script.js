(function($){
    "use strict";

    $(function(){
        const slider = $(".gallery");
        const cover = $(".cover");
        const strip_item = $('.gallery .strip-item');
        const strip_item_s = '.gallery .strip-item';
        const image = $('.gallery .strip-item .img-inner');
        const imageSelector_s = '.img-inner';
        const strip_item_link = $('.strip_item_link');
        let windowWidth;
        let windowHeight;
        let is_animating = false;
	    let dragStart;
        const referencePoint = 0; 
	    let dragEndAbsolute;			    
	    let abs_drag= 0;
        let relative_drag = 0;
        let arrayImgs = [];
        let arrayImgsLength ;
        let sliderWidth = 0;
        let traverse = parseInt(slider.attr('data-traverse'));
        let is_moving = false;
        let mostRight = false;
        let dragPosition = 0;
        let maxDrag = 0;
        let traveledDistance;

        const mathFuncs = {
            lineEq: (y2, y1, x2, x1, currentVal) => {
                // y = mx + b 
                var m = (y2 - y1) / (x2 - x1), b = y1 - m * x1;
                return m * currentVal + b;
            },
            lerp: (a, b, n) => (1 - n) * a + n * b,
            getRandomFloat: (min, max) => (Math.random() * (max - min) + min).toFixed(2)
        };

        $(".strip-item").wrap("<div class=img-wrapper></div>");
        // Setting the width of the slider by calculating all the width of the images
        $(".strip-item").each(function (index, element) {
            let ImgWidth = $(this).outerWidth();
            $(this).attr('data-width', ImgWidth);
            sliderWidth += ImgWidth;
            arrayImgs.push($(this));
        });

        function getmaxDrag(window_width) {  
            maxDrag = (sliderWidth < window_width) ? 0 : (sliderWidth - window_width);
            // console.log("sliderWidth",sliderWidth);
            // console.log("maxDrag",maxDrag);
            // console.log("window_width",window_width);
        }

        // Calc viewPort width & height
        function calcViewport() {
            windowWidth= window.innerWidth;
		    windowHeight= window.innerHeight;
            getmaxDrag(windowWidth);
        }

        function debounce(fun, ms) {
            let timer;
            return function () {
                clearTimeout(timer);
                timer = setTimeout(() => fun.apply(this, arguments), ms);
            };
        }

        calcViewport = debounce(calcViewport, 500);
        
        calcViewport();

        $(window).on("resize", calcViewport);

        // Length of array of images
        arrayImgsLength = arrayImgs.length;

        // maxDrag = sliderWidth < windowWidth ? 0 : sliderWidth - windowWidth;
        // console.log("maxDrag",maxDrag);
        

        // Events
        slider.on("mousedown", function (event) {
            function detectLeftMouse(evt) { 
                evt = evt || window.event;
                if ("buttons" in evt) {
                    return evt.buttons == 1;
                }
                var button = evt.which || evt.button;
                return button == 1;
            }

            let result = detectLeftMouse(event); 
            if (result == 1) {
                mousedown_drag(event);
            }
            else {
                return false;
            }
        });

        strip_item_link.on('mouseenter', function () {
            $(this).siblings().css({display:"block"});
            let slideOut = false;
            let slideIn = false;
            let element = $(this).find('span');
            element.transition({
                y: '-100%',
                opacity: 0,
                duration: 200,
                easing: 'easeOutQuad',
                complete: function() {
                    slideOut = true;
                    console.log("slideOut",slideOut);
                    if (slideOut == true) {
                        slideIn = true;
                        console.log("enter state");
                        element.css({
                            y: '100%',
                            opacity: 0,
                            scale: 1.3,
                        })
                    }
                    if (slideIn) {
                        element.transition({
                            y: '0%',
                            opacity: 1,
                            duration: 500,
                            easing: 'easeOutExpo',
                            complete:function() { 
                                slideIn = false;
                                slideOut = false;
                            }
                        })
                    }
                }
            })
        });
        strip_item_link.on('mouseleave', function () { 
            $(this).siblings().css({display:"none"});
            let element = $(this).find('span');
            element.stopTransition();
            element.css({
                scale: 1,
                y: '0%',
                opacity: 1,
            })
        });

        // Main Functions 
        
        // MouseDown Drag function 
        function mousedown_drag(mouseDownEvent) {

            if ( !is_moving && !(slider.hasClass('dragged')) ) {

                is_moving = true;
                // dragStart = 0;
                // dragEndAbsolute  = 0;
                // abs_drag = 0;
                mouseDownEvent.preventDefault(); 
                //  || mouseDownEvent.originalEvent.touches[0].pageX
                dragStart = mouseDownEvent.pageX;

                // var	current_project_active = $(project_selector_s+'.active'),
                //     current_active_project_index = current_project_active.index(),
                //     current_active_project_height = $(project_selector_s+'.active').innerHeight(),
                //     active_img = $(image_selector_s+".active"),	
                //     first_img = $(image_selector_s+':first-of-type'),
                //     last_img = $(image_selector_s+':last-of-type'),
                //     first_prjct = $(project_selector_s+':first-of-type'),
                //     last_prjct = $(project_selector_s+':last-of-type'),						
                //     data_traverse = parseInt(slider.attr('data-traverse')),
                //     prjcts_length = project_selector.length ;
                scaleCover();
                scaling();
                mousemove_drag ();
                mouseup_drag();
                // mouseup_drag(project_selector_s,slider,image_selector_s,prjcts_length,data_traverse,current_project_active,current_active_project_index,current_active_project_height,active_img,first_img,last_img,first_prjct,last_prjct,threshold);
            } 
        }
        
        // MouseMove Drag function 
        function mousemove_drag () {

            slider.on('mousemove touchmove', function(m){

                // m.originalEvent.touches[0].pageX issue
                dragEndAbsolute = m.pageX;
                abs_drag = dragPos();
                // console.log("abs_drag",abs_drag);
                relative_drag = dragRelativePos();
                // console.log("absolute drag",abs_drag);
                // console.log("relative_drag",relative_drag);
                // console.log("relative drag",relative_drag);
                // if (abs_drag > 5 || abs_drag < -5) {
                    slider.addClass('dragged');
                // } 
                if ($(this).css('translate') !== 0) {
                    traveledDistance = $(this).css('translate');
                    traveledDistance = parseInt(traveledDistance.substring(0, traveledDistance.indexOf("px")));
                }
                console.log("traveledDistance",traveledDistance);
                if (traveledDistance >= 0) {
                    // console.log("drag +");
                    dragPosition = mathFuncs.lineEq(0.5*windowWidth,0, windowWidth, 0, abs_drag); 
                    $(this).css({x:traverse+dragPosition+'px',y:'-50%'});
                }
                else if (traveledDistance < -1*maxDrag) {
                    console.log("drag -");
                    console.log("window_width",sliderWidth);
                    dragPosition = mathFuncs.lineEq(0.5*windowWidth,0, sliderWidth, windowWidth, abs_drag);
                    console.log("dragPosition",dragPosition);
                    $(this).css({x:traverse+dragPosition+'px',y:'-50%'});
                }
                else {
                    // console.log("drag");
                    dragPosition = abs_drag;
                    $(this).css({x:traverse+dragPosition+'px',y:'-50%'});
                }
                
            })
        }

        // MouseUp Drag function
        function mouseup_drag (){
            
            $(document).on('mouseup touchend', function(){
                traverse = parseInt(slider.css('translate')); 
                slider.attr('data-traverse',traverse);
                slider.off('mousemove touchmove');
                slider.removeClass('dragged');
                is_moving = false;
                if (!is_moving) {
                    $(document).off('mouseup touchend');				
                }
                let offset = slider.offset();
                let top = offset.top;
                let left = offset.left;
                let right = ($(window).width() - (left + slider.outerWidth()));
                // let testtt = slider[0].getBoundingClientRect().right;
                
                maxLimit(left,right);
                
                resetToNormal();
            });
            
        }

        // Sub Functions

        // Scaling & fading the cover 
        function scaleCover() {
            cover.stopTransition();
            cover.transition({
                opacity: 1,
                scale: 1,
                duration: 500,
            })
        }

        // Scaling the Images and containers of images
        function scaling() {
            strip_item.stopTransition();
            image.stopTransition();
            strip_item.transition({
                scale: 0.8,
                opacity: 0.3,
                duration: 500,
            });
            image.transition({
                scale: 1.6,
                duration: 500,
            });
        }

        // Reset the scaling of strip_item & image
        function resetToNormal() {
            strip_item.stopTransition();
            image.stopTransition();
            cover.stopTransition();
            cover.transition({
                opacity: 0,
                scale: 0.75,
                duration: 500,
            })
            strip_item.transition({
                scale: 1,
                opacity: 1,
                duration: 500,
            });
            image.transition({
                scale: 1,
                duration: 500,
            });
        }

        // Max limit of drag
        function maxLimit(left,right) {
            if (left > 0) {
                slider.stopTransition();
                traverse = 0;
                slider.attr('data-traverse',traverse);
                slider.transition({
                    x:0,
                    duration:500,
                })
            }
            else if (right > 0) {
                slider.stopTransition();
                traverse = parseInt('-'+(sliderWidth - windowWidth));
                slider.attr('data-traverse',traverse);
                slider.transition({
                    x:('-'+(sliderWidth - windowWidth)),
                    duration:500,
                })
            }
        }
        
        // Adjust To Original By Drag
        function back_to_original (slider,reference) {

            slider.transition({
                y:reference,
                duration:200,
                easing:'ease',
                complete: function() {
                    is_moving = false;
                    $(document).off('mouseup touchend');
                }
            })
        }					    

        // Calc the delta distance of gallery traversed by drag
        function dragPos() {
            return dragEndAbsolute - dragStart;
        }
        function dragRelativePos() {
            return dragEndAbsolute - referencePoint;
        }

        
    });
})(jQuery);