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
	    let dragEnd;			    
	    let abs_drag= 0;
        let arrayImgs = [];
        let arrayImgsLength ;
        let sliderWidth = 0;
        let traverse = parseInt(slider.attr('data-traverse'));
        let is_moving = false;
        let mostRight = false;
        let scaleToHide_flag = false;
        

        // Calc viewPort width & height
        function calcViewport() {
            windowWidth= $(window).width();
		    windowHeight= $(window).height();
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

        // math functions
        const mathFuncs = {
            // Linear Interpolation equation
            lerp: (v0, v1, t) => {
                return (1 - t) * v0 + t * v1;
            },

            // distance between 2 points
            distance: (x1, y1, x2, y2) => {
                let dx = x1 - x2;
                let dy = y1 - y2;

                return Math.sqrt(dx * dx + dy * dy);
            },

            // random number generator 
            getRandom: (min, max) => (Math.random() * (max - min) + min).toFixed(2)
        };

        strip_item.wrap("<div class=img-wrapper></div>");
        // Setting the width of the slider by calculating all the width of the images
        strip_item.each(function (index, element) {
            let ImgWidth = $(this).outerWidth();
            $(this).attr('data-width', ImgWidth);
            sliderWidth += ImgWidth;
            arrayImgs.push($(this));
        });

        // Length of array of images
        arrayImgsLength = arrayImgs.length;

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
                mousedown_drag(event,strip_item,strip_item_s,slider,imageSelector_s);
            }
            else {
                return false;
            }
        });
        strip_item_link.on("mousedown", function (event){
            event.stopPropagation();
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
                    if (slideOut == true) {
                        slideIn = true;
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
        strip_item_link.on('click', function (ev) {
            ev.preventDefault();
            is_animating = true;
            scaleToHide();
            iterateOverStripItem();
        }); 

        // Main Functions 

        // MouseDown Drag function 
        function mousedown_drag(drag_event,project_selector,project_selector_s,slider,image_selector_s) {

            if ( !is_moving && !(slider.hasClass('dragged')) ) {

                is_moving = true;
                dragStart = 0;
                dragEnd  = 0;
                abs_drag = 0;
                drag_event.preventDefault(); 
                //  || drag_event.originalEvent.touches[0].pageX
                dragStart = drag_event.pageX;

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
                scaleToDrag();
                mousemove_drag ();
                mouseup_drag();
                // mouseup_drag(project_selector_s,slider,image_selector_s,prjcts_length,data_traverse,current_project_active,current_active_project_index,current_active_project_height,active_img,first_img,last_img,first_prjct,last_prjct,threshold);
            } 
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
        function scaleToDrag() {
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

        // Animate strip-item
        function scaleToHide() {
            scaleToHide_flag = true;
            strip_item.transition({
                scale: 0.8,
                opacity: 0.4,
                duration: 800,
                easing: 'easeOutCubic',
            });
            image.transition({
                scale: 1.6,
                duration: 800,
                easing: 'easeOutCubic',
            });
            
        }
        function iterateOverStripItem() {  
            if (scaleToHide_flag) {
                scaleToHide_flag = false;
                let selectedItem ;
                strip_item.parent().each(function (index, element) {
                    selectedItem = $(this);
                    translateUpToHide($(this));
                });
            }
        }
        function translateUpToHide(item){
            item.transition({
                y:windowHeight*-1,
                delay: parseInt(mathFuncs.getRandom(200,400)),
                duration: 1000,
                easing: 'easeInOutExpo',
            });
        }
        // MouseMove Drag function 
        function mousemove_drag () {

            slider.on('mousemove touchmove', function(m){

                // m.originalEvent.touches[0].pageX issue
                dragEnd = m.pageX;
                abs_drag = dragPos();
                // if (abs_drag > 5 || abs_drag < -5) {
                    slider.addClass('dragged');
                // } 
                $(this).css({x:traverse+abs_drag+'px',y:'-50%'});
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
                // if ( ((abs_drag < threshold) && (abs_drag > -threshold)) ||
                //     (current_active_project_index == 0 && abs_drag >= threshold) ||
                //     (current_active_project_index == (prjcts_length -1)  && abs_drag <= -threshold) ) {

                //     back_to_original(slider,data_traverse);
                // } 
                // else if (abs_drag >= threshold || abs_drag <= -threshold) { 	

                //     locate_drag(abs_drag,project_selector_s,slider,image_selector_s,prjcts_length,data_traverse,current_project_active,current_active_project_index,current_active_project_height,active_img,first_img,last_img,first_prjct,last_prjct);
                // }
            });
            
        }
        // MouseUp Drag function 
        // function mouseup_drag (project_selector_s,slider,image_selector_s,prjcts_length,data_traverse,current_project_active,current_active_project_index,current_active_project_height,active_img,first_img,last_img,first_prjct,last_prjct,threshold){

        //     $(document).on('mouseup touchend', function(){
        //         slider.off('mousemove touchmove');
        //         slider.removeClass('dragged');
        //         if ( ((abs_drag < threshold) && (abs_drag > -threshold)) ||
        //             (current_active_project_index == 0 && abs_drag >= threshold) ||
        //             (current_active_project_index == (prjcts_length -1)  && abs_drag <= -threshold) ) {

        //             back_to_original(slider,data_traverse);
        //         } 
        //         else if (abs_drag >= threshold || abs_drag <= -threshold) { 	

        //             locate_drag(abs_drag,project_selector_s,slider,image_selector_s,prjcts_length,data_traverse,current_project_active,current_active_project_index,current_active_project_height,active_img,first_img,last_img,first_prjct,last_prjct);
        //         }
        //     });				
        // }

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

        // Detect location of drag
        function locate_drag (abs_drag,project_selector_s,slider,image_selector_s,prjcts_length,data_traverse,current_project_active,current_active_project_index,current_active_project_height,active_img,first_img,last_img,first_prjct,last_prjct){

            var traverse = 0,
                project_heights = 0,
                counter_i = 0;

            if (abs_drag > 0) {

                abs_drag = abs_drag - (current_active_project_height / 2);

                for (var i = current_active_project_index  ; i > 0 ; i--) {

                    counter_i = i-1;

                    var	current_projcet = $(project_selector_s+':eq('+counter_i+')'),
                        current_projcet_height = current_projcet.innerHeight(),
                        next_current_project = current_projcet.next(),
                        next_current_project_height = next_current_project.innerHeight(),
                        current_img = $(image_selector_s+':eq('+counter_i+')');

                    project_heights += current_projcet_height;
                    traverse += (current_projcet_height / 2) + (next_current_project_height / 2);

                    if (project_heights >= abs_drag) {
                        center_active(slider,traverse,data_traverse);
                        current_project_active.removeClass('active');
                        current_projcet.addClass('active');
                        active_img.removeClass('active');
                        current_img.addClass('active');
                        return false;
                    }
                    else if (abs_drag > project_heights && i == 1 ) {
                        center_active(slider,traverse,data_traverse);
                        current_project_active.removeClass('active');
                        first_prjct.addClass('active');
                        active_img.removeClass('active');
                        first_img.addClass('active');
                        return false;
                    }
                }
            }	
            else {

                abs_drag = abs_drag + (current_active_project_height / 2);

                for (var i = current_active_project_index ; i < prjcts_length-1 ; i++) {

                    counter_i = i+1;

                    var	current_projcet = $(project_selector_s+':eq('+counter_i+')'),
                        current_projcet_height = current_projcet.innerHeight(),
                        prev_current_project = current_projcet.prev(),
                        prev_current_project_height = prev_current_project.innerHeight(),
                        current_img = $(image_selector_s+':eq('+counter_i+')');								

                    project_heights -= current_projcet_height;
                    traverse += (-current_projcet_height / 2) + (-prev_current_project_height / 2);

                    if (project_heights <= abs_drag) {
                        center_active(slider,traverse,data_traverse);
                        current_project_active.removeClass('active');
                        current_projcet.addClass('active');
                        active_img.removeClass('active');
                        current_img.addClass('active');
                        return false;
                    }
                    else if (abs_drag < project_heights && i == prjcts_length-2 ) {
                        center_active(slider,traverse,data_traverse);
                        current_project_active.removeClass('active');
                        last_prjct.addClass('active');
                        active_img.removeClass('active');
                        last_img.addClass('active');
                        return false;											
                    }
                }					
            }				
        }		
							
        // Center Active project By Drag 
        function center_active (selector,traverse,data_traverse) {

            selector.transition({
                y:traverse+data_traverse,
                duration:700,
                easing:'ease',
                complete: function() {
                    data_traverse += traverse;
                    selector.attr('data-traverse', data_traverse);	
                    is_moving = false;
                    $(document).off('mouseup touchend');
                }
            })								
        }

        // Calc the delta distance of gallery traversed by drag
        function dragPos() {
            return dragEnd - dragStart;
        }

        
    });
})(jQuery);