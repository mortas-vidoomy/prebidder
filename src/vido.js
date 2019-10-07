/**
 * @constructor
 */
var VpaidVideoPlayer = function() {
    /**
     * The slot is the div element on the main page that the ad is supposed to
     * occupy.
     * @type {Object}
     * @private
     */
    this.slot_ = null;
  
    /**
     * The video slot is the video element used by the ad to render video content.
     * @type {Object}
     * @private
     */
    this.videoSlot_ = null;
  
    /**
     * An object containing all registered events.  These events are all
     * callbacks for use by the vpaid ad.
     * @type {Object}
     * @private
     */
    this.eventsCallbacks_ = {};
  
    /**
     * A list of getable and setable attributes.
     * @type {Object}
     * @private
     */
    this.attributes_ = {
      'companions' : '',
      'desiredBitrate' : 256,
     // 'duration' : 30,
      'expanded' : false,
      'height' : 0,
      'icons' : '',
      'linear' : true,
      'remainingTime' : 10,
      'skippableState' : false,
      'viewMode' : 'normal',
      'width' : 0,
      'volume' : 1.0
    };
  
    /**
     * A set of events to be reported.
     * @type {Object}
     * @private
     */
    this.quartileEvents_ = [
      {event: 'AdVideoStart', value: 0},
      {event: 'AdVideoFirstQuartile', value: 25},
      {event: 'AdVideoMidpoint', value: 50},
      {event: 'AdVideoThirdQuartile', value: 75},
      {event: 'AdVideoComplete', value: 100}
    ];
  
    /**
     * @type {number} An index into what quartile was last reported.
     * @private
     */
    this.lastQuartileIndex_ = 0;
  
    /**
     * An array of urls and mimetype pairs.
     *
     * @type {!object}
     * @private
     */
    this.parameters_ = {};
  };
  
  
  /**
   * VPAID defined init ad, initializes all attributes in the ad.  The ad will
   * not start until startAd is called.
   *
   * @param {number} width The ad width.
   * @param {number} height The ad heigth.
   * @param {string} viewMode The ad view mode.
   * @param {number} desiredBitrate The desired bitrate.
   * @param {Object} creativeData Data associated with the creative.
   * @param {Object} environmentVars Variables associated with the creative like
   *     the slot and video slot.
   */
  VpaidVideoPlayer.prototype.initAd = function(
      width,
      height,
      viewMode,
      desiredBitrate,
      creativeData,
      environmentVars) {
    // slot and videoSlot are passed as part of the environmentVars
    this.attributes_['width'] = width;
    this.attributes_['height'] = height;
    this.attributes_['viewMode'] = viewMode;
    this.attributes_['desiredBitrate'] = desiredBitrate;
    this.slot_ = environmentVars.slot;
    this.videoSlot_ = environmentVars.videoSlot;
  
    // Parse the incoming parameters.
    if (creativeData['AdParameters']) {
      this.parameters_ = JSON.parse(creativeData['AdParameters']);
    }
    var that = this;
    var scriptCriteo = document.createElement('script');
    scriptCriteo.src = __ROOT_URL__ + "main-criteo-vast.js";
    scriptCriteo.onload = function () {
    that.log('initAd ' + width + 'x' + height +
        ' ' + viewMode + ' ' + desiredBitrate);
    that.updateVideoSlot_.bind(that)()
    that.videoSlot_.addEventListener(
        'timeupdate',
        that.timeUpdateHandler_.bind(that),
        false);
    that.videoSlot_.addEventListener(
        'ended',
        that.stopAd.bind(that),
        false);
    }
    document.body.appendChild(scriptCriteo);
        
  };
  
  function consentGdprData(cb) {
      var consentData = '';
      var gdprtrue = '';
      var vurlencoded = encodeURI(window.location.href);
  
      if (!window.__cmp) {
         // find the CMP frame
         var f = window;
         var cmpFrame;
         while (!cmpFrame) {
             try {
                 if (f.frames["__cmpLocator"]) cmpFrame = f;
             } catch (e) {
             }
             if (f === window.top) break;
             f = f.parent;
         }
  
         var cmpCallbacks = {};
  
         /* Set up a __cmp function to do the postMessage and
             stash the callback.
             This function behaves (from the caller's perspective)
             identically to the same frame __cmp call */
         window.__cmp = function (cmd, arg, callback) {
             if (!cmpFrame) {
                 callback({msg: "CMP not found"}, false);
                 return;
             }
             var callId = Math.random() + "";
             var msg = {
                 __cmpCall: {
                     command: cmd,
                     parameter: arg,
                     callId: callId
                 }
             };
             cmpCallbacks[callId] = callback;
             cmpFrame.postMessage(msg, '*');
         }
  
         /* when we get the return message, call the stashed callback */
         window.addEventListener("message", function (event) {
             var msgIsString = typeof event.data === "string";
             var json = event.data;
             if (msgIsString) {
                 try {
                     json = JSON.parse(event.data);
                 } catch (e) {}
             }
  
             if (json.__cmpReturn) {
                 var i = json.__cmpReturn;
                 cmpCallbacks[i.callId](i.returnValue, i.success);
                 delete cmpCallbacks[i.callId];
             }
         }, false);
      }
         
      /* example call of the above __cmp wrapper function */
      window.__cmp('getConsentData', null, function (result, success) {
         if (success) {
             // consentData contains the base64-encoded consent string
             consentData = result.consentData;
  
             // gdprApplies specifies whether the user is in EU jurisdiction
             var gdprApplies = result.gdprApplies;
             
             if(gdprApplies){
                gdprtrue = 1; 
             }
             
             window.__cmp('getVendorConsents', null, function (result, success) {
                 if (success) {
                     cb(consentData, result.metadata);
                 } else {
                     cb(consentData, undefined);
                 }
                 
             });
             //console.log(consentData, gdprApplies)
             //cb(consentData);
             
             // pass these 2 values to all ad / pixel calls
         } else {
             cb(undefined, undefined);
         }
      });
      
  }
  
  
  
  /**
   * Called when the overlay is clicked.
   * @private
   */
  VpaidVideoPlayer.prototype.overlayOnClick_ = function() {
      console.log('click');
    this.callEvent_('AdClickThru');
  };
  
  
  /**
   * Called by the video element.  Calls events as the video reaches times.
   * @private
   */
  VpaidVideoPlayer.prototype.timeUpdateHandler_ = function() {
    if (this.lastQuartileIndex_ >= this.quartileEvents_.length) {
      return;
    }
    var percentPlayed =
        this.videoSlot_.currentTime * 100.0 / this.videoSlot_.duration;
    if (percentPlayed >= this.quartileEvents_[this.lastQuartileIndex_].value) {
      var lastQuartileEvent = this.quartileEvents_[this.lastQuartileIndex_].event;
      this.eventsCallbacks_[lastQuartileEvent]();
      this.lastQuartileIndex_ += 1;
    }
  };
  
  
  /**
   * @private
   */
  VpaidVideoPlayer.prototype.updateVideoSlot_ = function() {
      var that = this;
    if (this.videoSlot_ == null) {
      this.videoSlot_ = document.createElement('video');
      //this.log('Warning: No video element passed to ad, creating element.');
      this.slot_.appendChild(this.videoSlot_);
    }
    
    var randomKey = Math.floor(new Date().getTime() + Math.floor(Math.random() * 100000000));
    
    consentGdprData(function (gdprConsentData, vendorConsents) {
        new vidoomy.PrebidNegotiator(
              that.videoSlot_,
              that.attributes_['width'],
              that.attributes_['height'],
              gdprConsentData,
              vendorConsents,
              randomKey,
              function () {that.callEvent_('AdImpression');},
              function () {that.callEvent_('AdLoaded');},
              function () {that.callEvent_('AdCancel');},
              function () {that.overlayOnClick_.bind(that)();}
      );
        
    });
      
    
    this.updateVideoPlayerSize_();
    
    this.videoSlot_.play();
  };
  
  
  /**
   * Helper function to update the size of the video player.
   * @private
   */
  VpaidVideoPlayer.prototype.updateVideoPlayerSize_ = function() {
    this.videoSlot_.setAttribute('width', this.attributes_['width']);
    this.videoSlot_.setAttribute('height', this.attributes_['height']);
  };
  
  
  /**
   * Returns the versions of vpaid ad supported.
   * @param {string} version
   * @return {string}
   */
  VpaidVideoPlayer.prototype.handshakeVersion = function(version) {
    return ('2.0');
  };
  
  
  /**
   * Called by the wrapper to start the ad.
   */
  VpaidVideoPlayer.prototype.startAd = function() {
      //console.log('2');
   // this.log('Starting ad');
    this.videoSlot_.play();
    var img = document.createElement('img');
    img.src = this.parameters_.overlay || '';
    this.slot_.appendChild(img);
    img.addEventListener('click', this.overlayOnClick_.bind(this), false);
    //add a test mute button
    var muteButton = document.createElement('input');
    muteButton.setAttribute('type', 'button');
    muteButton.setAttribute('value', 'mute/unMute');
  
    muteButton.addEventListener('click',
        this.muteButtonOnClick_.bind(this),
        false);
    this.slot_.appendChild(muteButton);
    this.callEvent_('AdStarted');
  };
  
  
  /**
   * Called by the wrapper to stop the ad.
   */
  VpaidVideoPlayer.prototype.stopAd = function() {
    //this.log('Stopping ad');
    // Calling AdStopped immediately terminates the ad. Setting a timeout allows
    // events to go through.
    var callback = this.callEvent_.bind(this);
    setTimeout(callback, 75, ['AdStopped']);
  };
  
  
  /**
   * @param {number} value The volume in percentage.
   */
  VpaidVideoPlayer.prototype.setAdVolume = function(value) {
    this.attributes_['volume'] = value;
    //this.log('setAdVolume ' + value);
    this.callEvent_('AdVolumeChange');
  };
  
  
  /**
   * @return {number} The volume of the ad.
   */
  VpaidVideoPlayer.prototype.getAdVolume = function() {
    //this.log('getAdVolume');
    return this.attributes_['volume'];
  };
  
  
  /**
   * @param {number} width The new width.
   * @param {number} height A new height.
   * @param {string} viewMode A new view mode.
   */
  VpaidVideoPlayer.prototype.resizeAd = function(width, height, viewMode) {
    //this.log('resizeAd ' + width + 'x' + height + ' ' + viewMode);
    this.attributes_['width'] = width;
    this.attributes_['height'] = height;
    this.attributes_['viewMode'] = viewMode;
    this.updateVideoPlayerSize_();
    this.callEvent_('AdSizeChange');
  };
  
  
  /**
   * Pauses the ad.
   */
  VpaidVideoPlayer.prototype.pauseAd = function() {
    //this.log('pauseAd');
    this.videoSlot_.pause();
    this.callEvent_('AdPaused');
  };
  
  
  /**
   * Resumes the ad.
   */
  VpaidVideoPlayer.prototype.resumeAd = function() {
    //this.log('resumeAd');
    this.videoSlot_.play();
    this.callEvent_('AdResumed');
  };
  
  
  /**
   * Expands the ad.
   */
  VpaidVideoPlayer.prototype.expandAd = function() {
    //this.log('expandAd');
    this.attributes_['expanded'] = true;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    }
    this.callEvent_('AdExpanded');
  };
  
  
  /**
   * Returns true if the ad is expanded.
   * @return {boolean}
   */
  VpaidVideoPlayer.prototype.getAdExpanded = function() {
    //this.log('getAdExpanded');
    return this.attributes_['expanded'];
  };
  
  
  /**
   * Returns the skippable state of the ad.
   * @return {boolean}
   */
  VpaidVideoPlayer.prototype.getAdSkippableState = function() {
    //this.log('getAdSkippableState');
    return this.attributes_['skippableState'];
  };
  
  
  /**
   * Collapses the ad.
   */
  VpaidVideoPlayer.prototype.collapseAd = function() {
    //this.log('collapseAd');
    this.attributes_['expanded'] = false;
  };
  
  
  /**
   * Skips the ad.
   */
  VpaidVideoPlayer.prototype.skipAd = function() {
    //this.log('skipAd');
    var skippableState = this.attributes_['skippableState'];
    if (skippableState) {
      this.callEvent_('AdSkipped');
    }
  };
  
  
  /**
   * Registers a callback for an event.
   * @param {Function} aCallback The callback function.
   * @param {string} eventName The callback type.
   * @param {Object} aContext The context for the callback.
   */
  VpaidVideoPlayer.prototype.subscribe = function(
      aCallback,
      eventName,
      aContext) {
    //this.log('Subscribe ' + aCallback);
    var callBack = aCallback.bind(aContext);
    this.eventsCallbacks_[eventName] = callBack;
  };
  
  
  /**
   * Removes a callback based on the eventName.
   *
   * @param {string} eventName The callback type.
   */
  VpaidVideoPlayer.prototype.unsubscribe = function(eventName) {
    //this.log('unsubscribe ' + eventName);
    this.eventsCallbacks_[eventName] = null;
  };
  
  
  /**
   * @return {number} The ad width.
   */
  VpaidVideoPlayer.prototype.getAdWidth = function() {
    return this.attributes_['width'];
  };
  
  
  /**
   * @return {number} The ad height.
   */
  VpaidVideoPlayer.prototype.getAdHeight = function() {
    return this.attributes_['height'];
  };
  
  
  /**
   * @return {number} The time remaining in the ad.
   */
  VpaidVideoPlayer.prototype.getAdRemainingTime = function() {
    return this.attributes_['remainingTime'];
  };
  
  
  /**
   * @return {number} The duration of the ad.
   */
  VpaidVideoPlayer.prototype.getAdDuration = function() {
    return this.attributes_['duration'];
  };
  
  
  /**
   * @return {string} List of companions in vast xml.
   */
  VpaidVideoPlayer.prototype.getAdCompanions = function() {
    return this.attributes_['companions'];
  };
  
  
  /**
   * @return {string} A list of icons.
   */
  VpaidVideoPlayer.prototype.getAdIcons = function() {
    return this.attributes_['icons'];
  };
  
  
  /**
   * @return {boolean} True if the ad is a linear, false for non linear.
   */
  VpaidVideoPlayer.prototype.getAdLinear = function() {
    return this.attributes_['linear'];
  };
  
  
  /**
   * Logs events and messages.
   *
   * @param {string} message
   */
  VpaidVideoPlayer.prototype.log = function(message) {
   // console.log(message);
  };
  
  
  /**
   * Calls an event if there is a callback.
   * @param {string} eventType
   * @private
   */
  VpaidVideoPlayer.prototype.callEvent_ = function(eventType) {
      //console.log('?????');
      //console.log(eventType);
  //this.log(eventType);
    if (eventType in this.eventsCallbacks_) {
      this.eventsCallbacks_[eventType]();
    }
  };
  
  
  /**
   * Callback for when the mute button is clicked.
   * @private
   */
  VpaidVideoPlayer.prototype.muteButtonOnClick_ = function() {
    if (this.attributes_['volume'] == 0) {
      this.attributes_['volume'] = 1.0;
    } else {
      this.attributes_['volume'] = 0.0;
    }
    this.callEvent_('AdVolumeChange');
  };
  
  
  /**
   * Main function called by wrapper to get the vpaid ad.
   * @return {Object} The vpaid compliant ad.
   */
  var getVPAIDAd = function() {
    return new VpaidVideoPlayer();
  };
  