import prebid from 'prebid.js';
//import 'prebid.js/modules/lkqdBidAdapter'; // imported modules will register themselves automatically with prebid
import 'prebid.js/modules/33acrossBidAdapter';
import 'prebid.js/modules/consentManagement';
prebid.processQueue();  // required to process existing pbjs.queue blocks and setup any further pbjs.queue execution
prebid.requestBids({
})
let intervalTimer: any;
let adsManager: any;

declare var __ROOT_URL__: string;

declare var google: any;

export class PrebidNegotiator {
  adunit: any;
    constructor(
      private videoObj: any,
      private width: number,
      private height: number,
      private gdprConsentData: string,
      private gdprVendorConsents: string,
      private randomKey: string,
      private fnImpression: Function,
      private fnLoaded: Function,
      private fnCancel: Function,
      private fnClick: Function) {
        this.launchPrebid();
    }


    launchPrebid() {
        const that = this;
        this.adunit = [{
          code: this.videoObj.id,
          mediaTypes: {
            video: {
              playerSize: [this.width, this.height],
              context: 'instream',	
              mimes: ["video/mp4"],
              maxduration: 30,
              api: [1, 2],
              protocols: [2, 3]
            }
          },
          bids: [{
            bidder: '33across',
            params: {
                siteId: 'bQRTd2kMCr65i2aKkGJozW',     
                productId: 'instream'     
            }
          }],
          consentManagement: {
            cmpApi: 'static',
            allowAuctionWithoutConsent: true,
            consentData: {
              getConsentData: {
                'gdprApplies': true,
                'hasGlobalScope': false,
                'consentData': this.gdprConsentData
              },
              getVendorConsents: {
                'metadata': this.gdprVendorConsents,
              }
            }
          }},
          ];

          prebid.que.push(function() {
            prebid.addAdUnits(that.adunit);
            prebid.setConfig({
              usePrebidCache: true,
              debug: true,
              cache: {
                url: "https://prebid.adnxs.com/pbc/v1/cache"
              }
            });
            prebid.requestBids({
              bidsBackHandler: function(bids: any) {
                that.sendAdserverRequest.bind(that)(bids);
              }
            });
          });
    }
    sendAdserverRequest(bids: any){
      const that = this;
      if (prebid.adserverRequestSent) return;
      if (bids && bids[that.videoObj.id] && bids[that.videoObj.id].bids && bids[that.videoObj.id].bids[0] && bids[that.videoObj.id].bids[0].vastUrl) {
        prebid.adserverRequestSent = true;
        prebid.que.push(function() {
          that.invokeVideoPlayer(bids[that.videoObj.id].bids[0].vastUrl);				
        });
      } else {
        that.invokeVideoPlayer('https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/single_ad_samples&ciu_szs=300x250&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ct%3Dlinearvpaid2js&correlator=');
        that.fnCancel();
      }
    }

    invokeVideoPlayer(url:string) {
      const that = this;
      that.fnLoaded();
      var videoElement = document.getElementById('vidoomy-video-ad-y-tal') ;
      var adContainer = document.getElementById('vidoomy-div-ad-y-tal');


      const imaSdkLoader = document.createElement("script");
      imaSdkLoader.id = "ima-sdk";
        imaSdkLoader.src = "//imasdk.googleapis.com/js/sdkloader/ima3_debug.js";
      imaSdkLoader.onload = function() {

        var adDisplayContainer = new google.ima.AdDisplayContainer(adContainer, videoElement);
        var adsLoader = new google.ima.AdsLoader(adDisplayContainer);

        adsLoader
        .getSettings()
        .setVpaidMode(google.ima.ImaSdkSettings.VpaidMode.INSECURE);
        function onAdsManagerLoaded(adsManagerLoadedEvent: any) {
          // Instantiate the AdsManager from the adsLoader response and pass it the video element
          adsManager = adsManagerLoadedEvent.getAdsManager(videoElement);
          adsManager.setVolume(0);

          //videoElement.load();
          adDisplayContainer.initialize();

          var width = 640;
          var height = 360;
          try {
            adsManager.init(width, height, google.ima.ViewMode.NORMAL);
            adsManager.start();
          } catch (adError) {
            // Play the video without ads, if an error occurs
            if (videoElement && videoElement instanceof HTMLVideoElement)
              videoElement.play();
          }

        }

        function onAdError(adErrorEvent: any) {
          // Handle the error logging.
          console.log(adErrorEvent.getError());
          if(adsManager) {
            adsManager.destroy();
          }
        }
        adsLoader.addEventListener(
          google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
          onAdsManagerLoaded,
          false);
        adsLoader.addEventListener(
            google.ima.AdErrorEvent.Type.AD_ERROR,
            onAdError,
            false);
    
        if (videoElement) {

          // Let the AdsLoader know when the video has ended
          videoElement.addEventListener('ended', function() {
            adsLoader.contentComplete();
          });

          var adsRequest = new google.ima.AdsRequest();
          adsRequest.adTagUrl = url;

          // Specify the linear and nonlinear slot sizes. This helps the SDK to
          // select the correct creative if multiple are returned.
          adsRequest.linearAdSlotWidth = videoElement.clientWidth;
          adsRequest.linearAdSlotHeight = videoElement.clientHeight;
          adsRequest.nonLinearAdSlotWidth = videoElement.clientWidth;
          adsRequest.nonLinearAdSlotHeight = videoElement.clientHeight / 3;

          adsRequest.setAdWillAutoPlay(true);
          adsRequest.setAdWillPlayMuted(true);
          // Pass the request to the adsLoader to request ads
          adsLoader.requestAds(adsRequest);
        }

      }.bind(this);
      document.head.appendChild(imaSdkLoader);

    }
    
}