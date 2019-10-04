import prebid from 'prebid.js';
//import 'prebid.js/modules/lkqdBidAdapter'; // imported modules will register themselves automatically with prebid
import 'prebid.js/modules/criteoBidAdapter';
import 'prebid.js/modules/dfpAdServerVideo';
prebid.processQueue();  // required to process existing pbjs.queue blocks and setup any further pbjs.queue execution
prebid.requestBids({
})
let intervalTimer: any;
let adsManager: any;


export class PrebidNegotiator {
  adunit: any;
    constructor(private videoObj: any, private width: number, private height: number) {
        this.launchPrebid();
    }


    launchPrebid() {
        const that = this;
        this.adunit = [{
          code: 'video1',
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
            bidder: 'criteo',
            params: {
              zoneId: '1444944',
              video: {
                skip: 0,
                playbackmethod: 1,
                placement: 1,
              }
            }
          }]}
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
                that.sendAdserverRequest(bids);
              }
            });
          });
    }
    sendAdserverRequest(bids: any){
      const that = this;
      if (prebid.adserverRequestSent) return;
      if (bids && bids['video1'] && bids['video1'].bids && bids['video1'].bids[0] && bids['video1'].bids[0].vastUrl) {
       /* const xml = new XMLHttpRequest();
        xml.open('GET', 'https://vadserver.com/node/obtain?xmlUrl=' + encodeURIComponent(bids['video1'].bids[0].vastUrl), false);
        xml.send();*/
        prebid.adserverRequestSent = true;
        prebid.que.push(function() {
          that.invokeVideoPlayer(bids['video1'].bids[0].vastUrl);				
        });
      } else {
        const xml = new XMLHttpRequest();
        prebid.que.push(function() {
          that.invokeVideoPlayer("https://ads.eu.criteo.com/delivery/r/0.1/vast.php?did=5d95ddc7100283f98330f0e715be7b00&u=%7CIbTI2OtAf3s3jFmTrdVonLSScAIOHy7Nlc%2BdCH9RtgQ%3D%7C&c1=Dcz_gsP0hEtcAD4RA4hUNQ6lz0KWLrnEGOnQ6243XIp2ROSijxgLedDFii6s6O02AlMWZl0khqGZ1rnftcK6WH9sprGChZDWQ6qiD17DClWr4ZRc-TjjzO1G-mgqlMa3rxKfqYfA-6Hnp-Ipwrcy3Ytyip0mu9kjYU4A-vy6h7vYNpVaHbp3wnaw-YNxjGqv9HSwLDFtoMSiFvy76plCZdYirhEZFR1xtQnyCopODHSk4rNKDtrmSHjdrSTlMXIaxCGzVC1yU-KoFTbCTYHCC-FoPBag37FiJE4TlHGiDDPXcFN83mYokHj8ve0Jl81C5fWAWjfYVaoZo3zyYfN75ZwfV73VvhghKmn3eDILjf36oIEckQfjkVLkOr8m_HNVNBnrME4m8_M69-x_EKwvl6ooQost0eLdrs1q1ouFpXEJ02LcjGgAd7VZ4P0bIQVW");
        });
        //xml.open('GET', 'https://vadserver.com/node/obtain?xmlUrl=' + encodeURIComponent("https://ads.eu.criteo.com/delivery/r/0.1/vast.php?did=5d94b86026507c9f1fdee0d40e501400&u=%7Cq9F2klJBjzgLBicfg5ioj1B1y8HglvsCIe5Qua8me1E%3D%7C&c1=jWCgqsKSUoXGWHqz_aWNEyGUtd3ffQVP2eqi0j-AdlG3VzEQ-uMqrA41bN_5HcFTvbox4Cem3nnspzvjfXsmz1rvFfty9Q5rVh4m9k03k1-HzhlUxXAw7CaOPMpz-zMJhmXNMcCjbXB3cR_oO3VaMaSdZaP353qB2r0fAv06O8NI3drudnRoKins2x6GhsAe-xXol8HrKoD4t0RD6J4zdCaZnZkppvErjKtqM4o9ccaNPz-BGWxPHcwytSJWl_N15NjTSSvYwX7L2C6Fahs6Pso7V2sg1qH_TFN7ab3mVNUK1s09SACJ5dsnOjZEAAyosTvXG33Vr3obe-3kSjV1AW6pW4GhALa9f8Dit0GRFEnMXLcuulX_sOYE_x_BoA707YOankLiOj68Bad2-FT01zUjahq4heOXM412VBA0keRkbJytTod7c17IW4moZ26uXgP7znZ2PoI"), false);
        //xml.send();
        return;
      }
    }

    invokeVideoPlayer(url:string) {
      const that = this;
     /* const videoJSLink = document.createElement('link');
      videoJSLink.rel = "stylesheet";
      videoJSLink.href = "https://cdnjs.cloudflare.com/ajax/libs/video.js/6.4.0/video-js.css";
      document.body.appendChild(videoJSLink);

      const videoJSVastVPAIDLink = document.createElement('link');
      videoJSVastVPAIDLink.rel = "stylesheet";
      videoJSVastVPAIDLink.href = "https://cdnjs.cloudflare.com/ajax/libs/videojs-vast-vpaid/2.0.2/videojs.vast.vpaid.min.css";
      document.body.appendChild(videoJSVastVPAIDLink);
*/

      const videoJsScript = document.createElement('script');
      videoJsScript.src = 'https://vidoomy.com/tests/vastplayer/main.js';
      videoJsScript.type = 'text/javascript';
      videoJsScript.onload = function () {
        new (window as any).vidoomy.VidoomyPlayer({
          width: that.width,
          height: that.height,
          volume: 0,
          principalTags: {
            'lkqd-criteo': url,
           },
          xtraTags: [],
          appearAt: 'left',
          objVideo: that.videoObj
        }, '', '123123123', 5000);
          //if ((window as any).videojs) {
            /*const hasSource = that.videoObj.querySelector('source');
            if (!hasSource) {
              const sampleSource = document.createElement('source');
              sampleSource.type = 'video/mp4';
              sampleSource.src = 'http://vjs.zencdn.net/v/oceans.mp4';
              that.videoObj.appendChild(sampleSource);
            }

            that.videoObj.style.width = that.width + 'px';
            that.videoObj.style.height = that.height + 'px';
*/
           /* var vid1 = (window as any).videojs(that.videoObj);

            /* Access the player instance by calling `videojs()` and passing
                in the player's ID. Add a `ready` listener to make sure the
                player is ready before interacting with it. */
      
               /* (window as any).videojs(that.videoObj).ready(function() {
      
                /* PASS SETTINGS TO VAST PLUGIN
      
                    Pass in a JSON object to the player's `vastClient` (defined
                    by the VAST/VPAID plugin we're using). The requires an
                    `adTagUrl`, which will be the URL returned by Prebid. You
                    can view all the options available for the `vastClient`
                    here:
      
                    https://github.com/MailOnline/videojs-vast-vpaid#options */
      
               /* var player = this;
                var vastAd = player.vastClient({
                    adTagUrl: url,
                    playAdAlways: true,
                    verbosity: 4,
                    autoplay: true
                });
      
                player.muted(true);
                player.play();*/
      
            //});
        //}

       // document.body.appendChild(videoJsVASTVPAIDScript);
      }

      document.body.appendChild(videoJsScript);
      

    }
}