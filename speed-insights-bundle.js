// Vercel Speed Insights - Standalone Bundle
// Based on @vercel/speed-insights v2.0.0

(function() {
  'use strict';

  // src/queue.ts
  var initQueue = function() {
    if (window.si) return;
    window.si = function a() {
      var params = Array.prototype.slice.call(arguments);
      window.siq = window.siq || [];
      window.siq.push(params);
    };
  };

  // package.json
  var name = "@vercel/speed-insights";
  var version = "2.0.0";

  // src/utils.ts
  function isBrowser() {
    return typeof window !== "undefined";
  }

  function detectEnvironment() {
    try {
      var env = typeof process !== 'undefined' && process.env && process.env.NODE_ENV;
      if (env === "development" || env === "test") {
        return "development";
      }
    } catch(e) {}
    return "production";
  }

  function isDevelopment() {
    return detectEnvironment() === "development";
  }

  function getScriptSrc(props) {
    if (props.scriptSrc) {
      return makeAbsolute(props.scriptSrc);
    }
    if (isDevelopment()) {
      return "https://va.vercel-scripts.com/v1/speed-insights/script.debug.js";
    }
    if (props.dsn) {
      return "https://va.vercel-scripts.com/v1/speed-insights/script.js";
    }
    if (props.basePath) {
      return makeAbsolute(props.basePath + "/speed-insights/script.js");
    }
    return "/_vercel/speed-insights/script.js";
  }

  function loadProps(explicitProps, confString) {
    var props = explicitProps;
    if (confString) {
      try {
        var conf = JSON.parse(confString);
        props = Object.assign({}, conf && conf.speedInsights, explicitProps);
      } catch(e) {}
    }
    var dataset = {
      sdkn: name + (props.framework ? "/" + props.framework : ""),
      sdkv: version
    };
    if (props.sampleRate) {
      dataset.sampleRate = props.sampleRate.toString();
    }
    if (props.route) {
      dataset.route = props.route;
    }
    if (isDevelopment() && props.debug === false) {
      dataset.debug = "false";
    }
    if (props.dsn) {
      dataset.dsn = props.dsn;
    }
    if (props.endpoint) {
      dataset.endpoint = makeAbsolute(props.endpoint);
    } else if (props.basePath) {
      dataset.endpoint = makeAbsolute(props.basePath + "/speed-insights/vitals");
    }
    return {
      src: getScriptSrc(props),
      beforeSend: props.beforeSend,
      dataset: dataset
    };
  }

  function makeAbsolute(url) {
    return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/") ? url : "/" + url;
  }

  // src/generic.ts
  function injectSpeedInsights(props, confString) {
    props = props || {};
    if (!isBrowser() || props.route === null) return null;
    initQueue();
    var config = loadProps(props, confString);
    var beforeSend = config.beforeSend;
    var src = config.src;
    var dataset = config.dataset;
    
    if (document.head.querySelector('script[src*="' + src + '"]')) return null;
    
    if (beforeSend) {
      window.si && window.si("beforeSend", beforeSend);
    }
    
    var script = document.createElement("script");
    script.src = src;
    script.defer = true;
    
    for (var key in dataset) {
      if (dataset.hasOwnProperty(key)) {
        script.dataset[key] = dataset[key];
      }
    }
    
    script.onerror = function() {
      console.log(
        "[Vercel Speed Insights] Failed to load script from " + src + 
        ". Please check if any content blockers are enabled and try again."
      );
    };
    
    document.head.appendChild(script);
    
    return {
      setRoute: function(route) {
        script.dataset.route = route || undefined;
      }
    };
  }

  // Initialize Speed Insights when script loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      injectSpeedInsights();
    });
  } else {
    injectSpeedInsights();
  }

})();
