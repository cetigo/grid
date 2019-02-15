"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*
 Panel is one element on the screen, for example an image or html5 video.
 It holds all of its necessary information and can implement itself into the View.
 */

var Panel = function () {
    function Panel(options) {
        _classCallCheck(this, Panel);

        this.htmlString = "";
        this.classString = "";

        this.revealed = false;

        // General
        this.contentType = options.contentType || 1;
        this.title = options.title || "";
        this.imageUrl = options.imageUrl || "";
        this.albumArray = options.albumArray || false;

        this.downloadUrl = options.downloadUrl || "";
        this.rawUrl = options.rawUrl || "";

        this.metaData = {
            score: options.score || "",
            author: options.author || "",
            age: options.age || "",
            thumbUrl: options.thumbUrl || "",
            access: options.access || "",
            dimensions: {},
            extended: options.extended || false
        };

        this.videoUrl = {
            webm: options.webmUrl || "",
            mp4: options.mp4Url || "",
            poster: options.posterUrl || this.metaData.thumbUrl || ""
        };

        this.fetch = {
            required: options.needsFetch || false,
            type: options.fetchType || "blank",
            data: options.fetchData || ""
        };

        // Preparation of Variables
        if (this.title.length >= 130) this.title = this.title.substr(0, 128) + '[..]';
        if (this.fetch.required) this.classString += "image-fetching image-fetch-" + this.fetch.type + " ";
        //this.imageUrl = this.imageUrl.replace('https:', 'http:');

        if (this.fetch.type === "imguralbum") this.classString += "image-album ";
        if (this.metaData.score) {
            if (this.metaData.score > core.view.state.highScore) core.view.state.highScore = this.metaData.score;
        }

        // Html5 Video
        if (this.contentType === 2) {
            this.classString += "image-html5 ";

            this.htmlString = "<span class='helper'></span>";

            var videoElement = $('<video/>').attr('preload', 'none').attr('loop', '').attr('muted', '').attr('poster', this.videoUrl.poster);

            if (this.videoUrl.webm) videoElement.append("<source src='" + this.videoUrl.webm + "' type='video/webm'>");
            if (this.videoUrl.mp4) videoElement.append("<source src='" + this.videoUrl.mp4 + "' type='video/mp4'></video>");

            this.videoHtmlString = videoElement[0].outerHTML;
            this.htmlString += this.videoHtmlString;
        }
    }

    // Add the panel to the DOM of the results page


    _createClass(Panel, [{
        key: "add",
        value: function add(i) {
            this.doneLoading = false;

            var createdPanel = $('<div/>', {
                class: 'image ' + this.classString
            }).attr('data-id', i).appendTo('#results');

            if (i == 0) createdPanel.addClass('nofocus');
            this.domElement = createdPanel;
            this.domId = i;
        }

        // Actually display the panels contents, initiating the browsers network loading

    }, {
        key: "reveal",
        value: function reveal() {
            if (this.revealed) return true;

            this.revealed = true;

            this.domElement
            // Show the image
            .css('background-image', this.imageUrl ? 'url(' + this.imageUrl + ')' : 'none')
            // Inject the title and possible video
            .html(this.htmlString + '<span class="title">' + this.title + '</span>');

            if (this.videoUrl) this.videoObject = this.domElement.find('video').get(0);

            core.view.loading.loadLength++;
            Panel.updateLoadProgress();

            this.checkReady();

            if (this.fetch.required) {

                core.view.loading.fetchLength++;
                Panel.updateFetchProgress();

                core.parser.getFetchPromise(this.fetch.type, { fetchData: this.fetch.data }).done(this.resolveFetch.bind(this)).fail(function () {
                    this.resolveFetch(false, true);
                }.bind(this));
            }
        }
    }, {
        key: "renderToSlideshow",
        value: function renderToSlideshow() {
            this.slideshowDomElement = this.domElement.clone();

            $('#slideshow').append(this.slideshowDomElement);

            if (this.contentType === 2) {
                this.slideshowVideoObject = this.slideshowDomElement.find('video').get(0);
                this.slideshowVideoObject.load();
                this.slideshowVideoObject.play();
            }
        }

        // Prepare for render via add or renderToReel

    }, {
        key: "prefetch",
        value: function prefetch(id) {
            var _this = this;

            this.domId = id;

            if (this.imageUrl) preloadImage(this.imageUrl);

            if (this.fetch.required) {

                core.parser.getFetchPromise(this.fetch.type, { fetchData: this.fetch.data }).done(this.updateFetchData.bind(this)).fail(function () {
                    _this.updateFetchData(false, true);
                    if (_this.imageUrl) preloadImage(_this.imageUrl);
                });
            }
        }
    }, {
        key: "renderToReel",
        value: function renderToReel() {
            this.revealed = true;
            $('#reel #videocnt').remove();

            var backgroundUrlString = this.imageUrl ? 'url(' + this.imageUrl + ')' : 'none';

            $('#reel').css({
                "background-image": backgroundUrlString
            });

            if (this.contentType === 2) {
                $('#reel').append('<div id="videocnt"><span class="helper"></span>' + this.videoHtmlString + '</div>');
                $('#reel video').get(0).load();
                $('#reel video').get(0).play();
            }
        }
    }, {
        key: "remove",
        value: function remove() {
            this.domElement.remove();
        }
    }, {
        key: "checkReady",
        value: function checkReady() {
            if (this.fetch.required || this.doneLoading) return false;else if (this.imageUrl) refreshPanelReadyState(this.domId, this.imageUrl);else if (this.videoUrl.poster) refreshPanelReadyState(this.domId, this.videoUrl.poster);else this.doneLoading = true;
        }
    }, {
        key: "setReady",
        value: function setReady(state, imageData) {
            if (state == "fetched") {

                this.fetch.required = false;
                core.view.loading.fetchDone++;
                Panel.updateFetchProgress();
                this.checkReady();
            } else if (state == "loaded") {

                this.doneLoading = true;
                this.metaData.dimensions = {
                    width: imageData.width,
                    height: imageData.height
                };

                core.view.loading.loadDone++;
                Panel.updateLoadProgress();
            } else if (state == "errored") {

                console.log(this.domId + ' - Error on load');
                this.doneLoading = true;
                this.domElement.addClass('image-404');
                this.errorOnLoad = true;
                core.view.loading.loadDone++;
                Panel.updateLoadProgress();
            }
        }

        // Like resolveFetch but without view callbacks

    }, {
        key: "updateFetchData",
        value: function updateFetchData(data, error) {
            if (!this.fetch.required) return false;
            if (!data && error) console.log('Error on fetch');

            if (data.imageUrl) {
                if (data.imageUrl === '__originalFetchData__') this.imageUrl = this.downloadUrl = this.fetch.data;else this.imageUrl = this.downloadUrl = data.imageUrl;
            }

            if (data.videoUrl) {
                this.videoUrl = data.videoUrl;
                this.downloadUrl = data.videoUrl.webm || data.videoUrl.mp4;
                this.imageUrl = data.videoUrl.poster;

                var videoElement = $('<video/>').attr('preload', 'none').attr('loop', '').attr('muted', '').attr('poster', this.videoUrl.poster);

                if (this.videoUrl.webm) videoElement.append("<source src='" + this.videoUrl.webm + "' type='video/webm'>");
                if (this.videoUrl.mp4) videoElement.append("<source src='" + this.videoUrl.mp4 + "' type='video/mp4'></video>");

                this.videoHtmlString = videoElement[0].outerHTML;
            }

            if (data.albumArray) this.albumArray = data.albumArray;
            if (data.downloadUrl) this.downloadUrl = data.downloadUrl;

            // If this panel is currently in the reel, re-render
            if (reelController.vars.position === this.domId) {
                this.renderToReel();
            }
        }
    }, {
        key: "resolveFetch",
        value: function resolveFetch(data, error) {
            if (!this.fetch.required) return false;
            if (!data && error) console.log(this.domId + ' - Error on fetch');

            if (data.imageUrl) {
                if (data.imageUrl === '__originalFetchData__') this.imageUrl = this.downloadUrl = this.fetch.data;else this.imageUrl = this.downloadUrl = data.imageUrl;
                this.domElement.css({
                    'background-image': 'url(' + this.imageUrl + ')'
                });
            }

            if (data.videoUrl) {
                this.videoUrl = data.videoUrl;
                this.downloadUrl = data.videoUrl.webm || data.videoUrl.mp4;
                this.imageUrl = data.videoUrl.poster;

                var videoElement = $('<video/>').attr('preload', 'none').attr('loop', '').attr('muted', '').attr('poster', this.videoUrl.poster);

                if (this.videoUrl.webm) videoElement.append("<source src='" + this.videoUrl.webm + "' type='video/webm'>");
                if (this.videoUrl.mp4) videoElement.append("<source src='" + this.videoUrl.mp4 + "' type='video/mp4'></video>");

                this.domElement.html("<span class='helper'></span>" + videoElement[0].outerHTML + '<span class="title">' + this.title + '</span>');
                this.videoObject = this.domElement.find('video').get(0);
            }

            if (data.albumArray) this.albumArray = data.albumArray;
            if (data.downloadUrl) this.downloadUrl = data.downloadUrl;

            this.domElement.removeClass('image-fetching');

            // If this panel is currently in the slideshow, also remove the class there
            if (core.view.slideshow.position == this.domId) {
                $('#slideshow .image').removeClass('image-fetching');
            }

            if (this.thumbCallback) favorites[this.thumbCallbackTarget].thumb = this.imageUrl;

            this.setReady('fetched');
        }
    }, {
        key: "thumbnailCallback",
        value: function thumbnailCallback(favoriteName) {
            this.thumbCallback = true;
            this.thumbCallbackTarget = favoriteName;
        }
    }, {
        key: "getRating",
        value: function (_getRating) {
            function getRating() {
                return _getRating.apply(this, arguments);
            }

            getRating.toString = function () {
                return _getRating.toString();
            };

            return getRating;
        }(function () {
            if (this.metaData.score) return getRating(this.metaData.score, core.view.state.highScore);else return false;
        })

        /* -- Video Control -- */

    }, {
        key: "toggleVideoPlay",
        value: function toggleVideoPlay() {
            if (this.contentType !== 2 || !this.slideshowVideoObject) {
                return false;
            }

            if (this.slideshowVideoObject.paused) {
                this.slideshowVideoObject.play();
            } else {
                this.slideshowVideoObject.pause();
            }
        }
    }, {
        key: "toggleVideoSound",
        value: function toggleVideoSound() {
            if (this.contentType !== 2 || !this.slideshowVideoObject) {
                return false;
            }

            this.slideshowVideoObject.muted = !this.slideshowVideoObject.muted;
        }
    }, {
        key: "skimVideo",
        value: function skimVideo(value) {
            if (this.contentType !== 2 || !this.slideshowVideoObject) {
                return false;
            }

            this.slideshowVideoObject.currentTime += value;
        }
    }], [{
        key: "updateLoadProgress",
        value: function updateLoadProgress() {
            var percentageFinished = core.view.loading.loadDone / core.view.loading.loadLength * 100;
            loadController.updateProgress(percentageFinished, 'load');
        }
    }, {
        key: "updateFetchProgress",
        value: function updateFetchProgress() {
            var percentageFinished = core.view.loading.fetchDone / core.view.loading.fetchLength * 100;
            loadController.updateProgress(percentageFinished, 'fetch');
        }
    }]);

    return Panel;
}();
