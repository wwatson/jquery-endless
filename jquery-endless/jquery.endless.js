/**
 * Endless plugin for jQuery
 *
 * v0.1.0
 *
 * Author: Will Watson (https://github.com/wwatson)
 * Copyright (c) 2012 Ackmann & Dickenson http://ackmanndickenson.com
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */

/**
 * Usage:
 *
 * // using default options
 * $(window).endless();
 *
 * // using some custom options
 * $(window).endless({
 *   loading: "<div class=\"loading\"><div>",
 *   ajaxOptions: {
 *     url: 'your-path.html',
 *     dataType: 'html',
 *     success: function() {
 *       alert("success");
 *     }
 *   }
 * });
 *
 * Configuration options:
 *
 * pageSize       integer   The number of results per page. This is passed as the limit parameter. 
 *                          It is used to calculate the offset. Defaults to 20
 * bottomPixels   integer   The number of pixels from the bottom of the scroll that triggers the event
 * loading        string    The HTML to be displayed during loading. Defaults to 'Loading...'
 * reset          function  Resets the fire sequence counter if the function returns true, this function
 *                          could also perform hook actions since it is applied at the start of the event
 * frequency      integer   Set the frequency of the scroll event checking, the larger the frequency number,
 *                          the less memory it consumes - but also the less sensitive the event trigger becomes
 * triggerDelay   integer   Set the delay between triggering events. This is the minimum amount of time between events.
 * resultClass    string    jQuery selector syntax for one result. Defaults to '.result'. This is used to automatically detect if 
 *                          if the end of the results has been reached 
 * triggerOnly    boolean   Defaults to false. If set to true, it is up to the implementation to bind 'endless:scroll'
 *                          to an event handler. This plugin will trigger the event at the appropriate time, passing the 
 *                          fireCount.
 * stopTriggering function  Returns a boolean. This is used to tell the plugin to stop triggering events. The function
 *                          takes the same arguments as jQuery.ajax()'s success callback.
 * ajaxOptions    object    jQuery.ajax() options. If a ajaxOptions.url is not provided, the plugin will look for a data-url attribute
 *                          on the scrollTarget element.
 *
 * Usage tips:
 *   Default Usage:
 *     By default, the plugin will trigger and handle events on the provided jQuery object. The element referenced as
 *     scrollTarget should have css properties max-height and overflow set to create a scroll bar. When scrolled 
 *     to options.bottomPixels from the bottom of the scrollTarget, the plugin will trigger an event that by default is handled by:
 *        - Appending the loading content to scrollTarget
 *        - Firing an AJAX request to options.ajaxOptions.url or $scrollTarget.data('url') with options.ajaxOptions 
 *          while passing the offset and limit 
 *        - Calling options.ajaxOptions.success
 *        - Hiding the loading content from scrollTarget
 *        - Checking the expected result count against the number of options.resultClass elements found in the response
 *          to determine if event triggering should stop.
 *
 *   Custom Option Usage:
 *     For maximum flexibility, use triggerOnly and implement an event handler for 'endless:scroll'. Any setting passed to the .endless()
 *     function will overwrite the default value. Overwrite the settings to create different behavior. See setting documentation for more
 *     details.
 *
 *   triggerOnly Usage:
 *     When using the plugin with the triggerOnly flag set to true, it will only manage event triggering. Further functionality
 *     is left up to the implementor. This should be used if you need more flexibilty than the plugin otherwise provides.
 */

(function($, window, document){

  $.fn.endless = function(options) {
    var defaults = {
      triggerOnly:    false,
      bottomPixels:   50,
      pageSize:       20,
      triggerDelay:   150,
      frequency:      250,
      loading:        'Loading...',
      resultClass:    '.result',
      stopTriggering: function(data, textStatus, jqXHR) { return $(data).find(options.resultClass).length !== options.pageSize },
      reset:          function() {},
      ajaxOptions:    {
        url: "",
        data: { },
        success: function(data, textStatus, jqXHR) { $scrollTarget.append(data); return; }
      },
    };

    options.ajaxOptions = $.extend(defaults.ajaxOptions, options.ajaxOptions)
    var options       = $.extend(defaults, options),
        fireCount     = 0,
        triggered     = false,
        scrollChanged = false,
        scrollTarget  = this,
        $scrollTarget = $(this),
        delayTrigger  = false,
        lastTriggered = 0, 
        $loader,
        triggerIt;

    $scrollTarget.scroll(function() { 
        scrollChanged = true; 
    });

    if (!options.triggerOnly) {
      $loader = $('<div class="endless_loading">' + options.loading + '</div>');
      $scrollTarget.append($loader.hide());

      $scrollTarget.bind('endless:scroll', function(ev, pageNumber) {
        $loader.show();
        lastTriggered = new Date().getTime();
        triggered = true;
        offset = options.pageSize * (pageNumber || 0);
        url = options.ajaxOptions.url || $scrollTarget.data('url')
        $.get(url, {offset: offset, limit: options.pageSize}, function(data, textStatus, jqXHR) {
          options.ajaxOptions.success.apply($(this), [data, textStatus, jqXHR]);
          $loader.fadeOut();
          if (!options.stopTriggering.apply(scrollTarget, [data, textStatus, jqXHR]))
            triggered = false;
        });
      });
    }

    setInterval(function() {
      if(scrollChanged && !triggered) {
        delayTrigger = (lastTriggered + options.triggerDelay) > new Date().getTime()
        if(!delayTrigger) {
          scrollChanged = false

          if (scrollTarget == document || scrollTarget == window) {
            triggerIt = $(document).height() - $(window).height() <= $(window).scrollTop() + options.bottomPixels;
          } else {
            // scrollHeight only works in IE >= 8.0. Could alternatively wrapInner and use that element's height
            triggerIt = ($scrollTarget[0].scrollHeight - $scrollTarget.height()) <= ($scrollTarget.scrollTop() + options.bottomPixels);
          }
          
          if (triggerIt) {
            $scrollTarget.trigger('endless:scroll', ++fireCount);
          }
        }
      }
    }, options.frequency) 
  };

})(jQuery, window, document);
