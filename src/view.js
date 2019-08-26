/*
 View is is responsible for managing all panels, the slideshow
 and loading content or cleaning up everything.
 */

class View {
    constructor() {

        this.panels = {};

        this.state = {
            counter: -1,
            highScore: 0,
            nofocusActive: true
        };

        this.slideshow = {
            length: 0,
            position: 0,
            active: false,
            highlightingActive: false,
            autoplayInterval: false,
            videoControlMode: false
        };

        this.loading = {
            fetchDone: 0,
            fetchLength: 0,
            loadDone: 0,
            loadLength: 0
        };

        this.album = {
            active: false,
            position: 0,
            length: 0
        };


        // Debug only so far, will not be written to by anything right now.
        this.filter = {
            active: false,
            filteredPanels: 0,
            urlFilter: [],
            titleWordFilter: []
        };

        this.mode = {
            special: true,
            reel: false
        };

        this.hardware = {
            width: 0,
            panelsPerRow: 0
        }

    }

    // --- Window Variables ---

    refreshWindow() {
        this.hardware.width = window.innerWidth;

        // 410 is equal to 400px width and 5px margin on both sides of an .image
        // Adjust if those values change
        this.hardware.panelsPerRow = Math.floor(this.hardware.width / 410);
    }

    getOffsetForPanel(panelIndex) {
        const rowIndex = Math.ceil((panelIndex + 1) / this.hardware.panelsPerRow);
        // This formula comes down to
        // a) Panel Height - the 510 part
        // b) preference - the -5 offset part
        return 510 * (rowIndex - 1) - 5;
    }

    // --- Core ---

    appendPanel(options) {
        if (this.filter.active) {
            if (this.checkIfFilterApplies(options)) {
                this.filter.filteredPanels++;
                return false;
            }
        }

        this.state.counter++;

        const newPanel = new Panel(options);
        newPanel.add(this.state.counter);
        if (this.state.counter <= 25) {
            newPanel.reveal();
        }
        this.panels[this.state.counter] = newPanel;
    }

    reset() {
        this.panels = {};
        this.state.counter = -1;
        this.state.highScore = 0;
        this.state.nofocusActive = true;

        this.slideshow.length = 0;
        this.slideshow.position = 0;
        this.slideshow.active = false;
        this.slideshow.highlightingActive = false;
        this.slideshow.autoplayInterval = false;
        this.slideshow.videoControlMode = false;

        this.loading.fetchLength = 0;
        this.loading.fetchDone = 0;
        this.loading.loadLength = 0;
        this.loading.loadDone = 0;

        this.filter.filteredPanels = 0;

        this.album.active = false;
        this.album.position = 0;
        this.album.length = 0;

        this.mode.special = true;
        this.mode.reel = false;

        $('#results').html('');
        $('#wrapper').removeClass('reelmode');
        $('#reel').removeClass('active');
        loadController.hide();
        helpController.hide();

        window.scrollTo(0, 0);
    }

    resetView(options) {
        options = options || {};

        // this is effectively just core.view.reset() plus some target variables
        systemController.resetView();
        $('#results')
            .html('')
            .append(options.loaderHtml || '');
    }

    initialize(noPositionReset) {
        $('#loader').remove();
        this.mode.special = false;
        helpController.show();
        loadController.show();
        if (!noPositionReset) this.slideshow.position = this.panels[0].domId;
        this.refreshLength();
        if (this.loading.fetchLength === 0) loadController.updateProgress(100, 'fetch');

        if (this.filter.active && this.filter.filteredPanels) {
            outputMessage(this.filter.filteredPanels + ' Panels filtered');
        }

        $('.image').bind('click', function () {
            core.view.openSlideshow(this);
        });
    }

    refreshLength() {
        this.slideshow.length = (this.state.counter + 1);
    }

    /**
     * The usual course goes: resetView(), appendPanel() * n, initialize(), appendCards()
     */

    // --- Additionals ---

    checkIfFilterApplies(options) {
        let filterApplies = false;

        if (this.filter.urlFilter.indexOf(options.rawUrl) !== -1) filterApplies = true;

        // Split titles on comma, space and forward-slash
        if (options.title) {
            var wordArray = options.title.split(/\/|,| /);

            $.each(wordArray, function (i, word) {
                if (this.filter.titleWordFilter.indexOf(word.toLowerCase()) !== -1) filterApplies = true;
            }.bind(this));
        }

        return filterApplies;
    }

    filterCurrentPanel() {
        if (this.album.active || !this.slideshow.active && !this.slideshow.highlightingActive) return;

        let gatheredUrl;
        if (this.mode.reel) gatheredUrl = reelController.vars.reel[reelController.vars.position].rawUrl;
        else {
            if (this.activePanel) gatheredUrl = this.activePanel.rawUrl;
        }

        if (!gatheredUrl) return;

        this.filter.active = true;
        var foundUrlIndex = this.filter.urlFilter.indexOf(gatheredUrl);

        if (foundUrlIndex !== -1) {
            this.filter.urlFilter.splice(foundUrlIndex, 1);
            outputMessage("<b>Unlisted</b> URL", "quickmsg");
        } else {
            this.filter.urlFilter.push(gatheredUrl);
            outputMessage("<b>Blacklisted</b> URL", "quickmsg");
        }

        saveToLocalstorage();
    }

    appendCards(cardData) {
        if (!cardData) return false;

        for (var i = 0, len = cardData.length; i < len; i++) {
            $('<div/>', {
                class: 'panel-suggestion',
                onclick: cardData[i].onclick
            })
                .html(cardData[i].html)
                .appendTo('#results');
        }
    }

    // --- Slideshow ---

    openSlideshow(position) {
        if (this.slideshow.active || this.mode.special) return;
        if (system.menuActive) uiController.hideMenu(true);

        this.slideshow.active = true;
        this.slideshow.position = Number($(position).attr('data-id'));

        $('#slideshow').addClass('active');
        this.activePanel.renderToSlideshow();
        this.toggleVideoControlMode(true);

        this.showMetadata();
        this.updateControls();

        $('#results, #wrapper').addClass('hidden');
        helpController.refresh();
    }

    switchSlideshow(backwards, noCancel) {
        if (system.menuActive) {
            uiController.switchMenuPosition(backwards);
            return;
        }

        if (this.slideshow.videoControlMode) {
            this.skimVideo(backwards ? -1 : 1);
            return;
        }

        if (!noCancel) autoplaySlideShow(true);

        if (this.mode.reel) {
            reelController.step(backwards);
            return;
        }

        // If neither the slideshow nor the highlighting is active, nothing happens
        if (!this.slideshow.active && !this.slideshow.highlightingActive) return;


        if (this.album.active) {
            if (backwards) {
                this.album.position--;
                if (this.album.position == -1) {
                    this.album.position = (this.album.length - 1);
                }
            } else {
                this.album.position++;
                if (this.album.position >= this.album.length) {
                    this.album.position = 0;
                }
            }

            $('#album .focus').removeClass('focus');
            $(window).scrollTop(Math.round(($('#album .aimg').eq(this.album.position).offset().top)));
            $('#album .aimg').eq(this.album.position).addClass('focus');

            return;
        }

        if (backwards) {
            this.slideshow.position--;
            if (this.slideshow.position == -1) {
                this.slideshow.position = (this.slideshow.length - 1);
            }
        } else {
            this.slideshow.position++;
            if (this.slideshow.position >= this.slideshow.length) {
                // Wrap around only if not during slideshow load
                if (!core.parser.meta.pageLoadUnderway)
                    this.slideshow.position = 0;
                else
                    this.slideshow.position = this.slideshow.length - 1;
            }
        }

        if (this.slideshow.position == (this.slideshow.length - 1) && core.parser.meta.pageLoadPossible) {
            this.activePanel.domElement.addClass('focus-nextpage');
        }

        if (this.slideshow.position >= (this.slideshow.length - 5))
            extendPage(false);

        this.revealProximity();

        if (!this.slideshow.active) {
            // This is the blue highlighting mode
            if (this.slideshow.highlightingActive) this.focusHighlight();
        } else {
            $('#message.quickmsg').remove();
            $('#slideshow .image').remove();

            this.activePanel.renderToSlideshow();
            this.toggleVideoControlMode(true);

            this.showMetadata();
            this.updateControls();
        }
    }

    revealProximity() {
        for (var i = 5; i >= -5; i--) {
            let targetPanel = this.panels[this.slideshow.position + i];
            if (targetPanel) targetPanel.reveal();
        }
    }

    quitSlideshow() {
        if (this.album.active) {
            return;
        }
        autoplaySlideShow(true);
        this.toggleVideoControlMode(true);
        this.slideshow.active = false;
        this.slideshow.highlightingActive = true;
        helpController.refresh();
        $('#slideshow .image').remove();
        $('#results, #wrapper').removeClass('hidden');
        $('#slideshow').removeClass('active');
        core.input.blur();

        $('.focus').removeClass('focus');
        $('.nofocus').removeClass('nofocus');
        $('#meta').html('').removeClass();

        this.activePanel.domElement.addClass('focus');
        window.scrollTo(0, this.getOffsetForPanel(this.slideshow.position));
    }

    showMetadata() {

        // Gather information for metadata labels
        const slideshowObject = this.activePanel;
        const metaUrlArray = slideshowObject.downloadUrl.split('/');
        const metaFileType = metaUrlArray[metaUrlArray.length - 1].split('.')[1];
        const metaPanelType = (slideshowObject.contentType === 2) ? "video" : "image";
        const metaDimensions = (slideshowObject.metaData.dimensions.width) ? slideshowObject.metaData.dimensions.width + "x" + slideshowObject.metaData.dimensions.height : "loading";

        // Wrapper to attach blocks to
        var metaWrapElem = $('<div/>');

        // Block 1 - Core
        $('<div/>', {class: 'metablock', id: 'meta-base'})
            .html(
                metaFileType + " " + metaPanelType + "<br>" +
                metaDimensions + "<br>" +
                (this.slideshow.position + 1) + " / " + this.slideshow.length
            )
            .appendTo(metaWrapElem);

        // Block 2 - Video info [optional]
        if (slideshowObject.contentType === 2) {

            let videoHostname = '';

            try {
                videoHostname = new URL(slideshowObject.downloadUrl).hostname;
            } catch(err) {
                // Blob URL
            }

            const metaVideoElem = $('<div/>', {class: 'metablock ', id: 'meta-video'})
                .html(
                    "Video loading<br>" +
                    videoHostname
                )
                .appendTo(metaWrapElem);

            const metaVideoObject = $('#slideshow video').get(0);

            const videoUpdateHandler = function() {

                const hasAudio = !!this.mozHasAudio || !!this.webkitAudioDecodedByteCount || this.audioTracks && !!this.audioTracks.length;
                slideshowObject.videoUrl.hasAudio = hasAudio;
                const audioString = (hasAudio) ? "sound" : "mute";

                let videoHostname = "pending";

                if (this.currentSrc)
                {
                    videoHostname = new URL(this.currentSrc).hostname;
                }

                metaVideoElem
                    .html(
                        `${Math.round(this.currentTime)}s/${Math.round(this.duration)}s<br>
                        ${audioString}<br>
                        ${videoHostname}`
                    );
            };

            metaVideoObject.oncanplay = videoUpdateHandler;
            metaVideoObject.ontimeupdate = videoUpdateHandler;
        }

        // Block 3 - Fetch info [optional]
        if (slideshowObject.fetch.type !== 'blank') {

            const metaFetchStatus = (slideshowObject.fetch.required) ? 'loading' : 'fetched';

            $('<div/>', {class: 'metablock', id: 'meta-fetch'})
                .html(
                    slideshowObject.fetch.type + "<br>" +
                    metaFetchStatus + "<br>" +
                    truncateString(slideshowObject.fetch.data, 15)
                )
                .appendTo(metaWrapElem);

        }

        // Block 4 - Title, Score/Author, Age [optional]
        if (slideshowObject.title) {
            const scoreOrAuthor = slideshowObject.metaData.score || slideshowObject.metaData.author || "";

            $('<div/>', {class: 'metablock', id: 'meta-advanced'})
                .html(
                    truncateString(slideshowObject.title, 60) + "<br>" +
                    scoreOrAuthor + "<br>" +
                    slideshowObject.metaData.age
                )
                .appendTo(metaWrapElem);
        }

        // Block 5 - Extended [optional]
        if (slideshowObject.metaData.extended) {
            let extendedMetaHtml = [];

            for (var extendedIndex in slideshowObject.metaData.extended) {
                extendedMetaHtml.push(extendedIndex + ': ' + slideshowObject.metaData.extended[extendedIndex]);
            }

            extendedMetaHtml = extendedMetaHtml.join('<br>');

            $('<div/>', {class: 'metablock', id: 'meta-extended'})
                .html(extendedMetaHtml)
                .appendTo(metaWrapElem);

        }

        var classString = (settings.showHelp) ? "active helpactive" : "active";

        $('#meta')
            .addClass(classString)
            .html('');

        metaWrapElem.appendTo('#meta');
    }

    updateControls() {

        let visibleBlocks = [];

        // controlblock-nav [always]
        if (!settings.showHelp) visibleBlocks.push('#controlblock-nav');

        // controlblock-save [always]
        if (!settings.showHelp) {
            visibleBlocks.push("#controlblock-save");

            /*
             *  This is inefficient, there shouldn't be such a rapid update necessary, jQuery selectors
             *  are expensive. We should update this on page load instead of every step.
             */

            if (system.customMode) $('#controlblock-save-label').text('Remove');
            else $('#controlblock-save-label').text('Save');
        }

        // controlblock-album
        if (this.activePanel.fetch.type === 'imguralbum') {
            visibleBlocks.push('#controlblock-album');
        }

        // controlblock-video
        if (this.activePanel.contentType === 2) {
            visibleBlocks.push('#controlblock-video');
        }

        // controlblock-access
        if (this.activePanel.metaData.access) {
            visibleBlocks.push('#controlblock-access');
        }

        // controlblock-nextpage
        if (this.slideshow.position == (this.slideshow.length - 1) && core.parser.meta.pageLoadPossible) {
            visibleBlocks.push('#controlblock-nextpage');
        }

        // controlblock-video-*
        // This overrides everything else
        if (this.slideshow.videoControlMode) {
            visibleBlocks = ['#controlblock-video-skim', '#controlblock-video-exit'];
            if (this.activePanel.videoUrl.hasAudio) visibleBlocks.push('#controlblock-video-sound');
        }

        $('.controlblock').removeClass('visible');
        $(visibleBlocks.join(', ')).addClass('visible');
    }

    toggleVideoSound() {
        if (this.slideshow.active) this.activePanel.toggleVideoSound();
    }

    toggleVideoPlay() {
        if (this.slideshow.active) this.activePanel.toggleVideoPlay();
    }

    skimVideo(time) {
        if (this.slideshow.active) this.activePanel.skimVideo(time);
    }

    inspectSlideshow() {
        // Up arrow during slideshow was pressed
        if (this.activePanel.fetch.type === 'imguralbum') {
            this.accessAlbum();
        } else if (this.activePanel.contentType === 2) {
            this.toggleVideoControlMode();
        }
    }

    toggleVideoControlMode(forceOff) {
        this.slideshow.videoControlMode = !!forceOff ? false : !this.slideshow.videoControlMode;
        if (this.slideshow.videoControlMode) {
            $('#slideshow .image').addClass('slideshow-inspect');
        } else {
            $('#slideshow .image').removeClass('slideshow-inspect');
        }
        this.updateControls();
    }

    // --- Album ---

    accessAlbum() {
        if (this.album.active) {
            this.album.active = false;
            $('#album').removeClass('active');
            $('#slideshow').removeClass('slideshow-blur');
            return;
        }

        var instancePanel = this.activePanel;
        var instAlbumId = instancePanel.fetch.data;

        if (instancePanel.fetch.type == "imguralbum") {
            if (instancePanel.albumArray) {
                this.album.length = instancePanel.albumArray.length;
                this.album.active = true;
                $('#slideshow').addClass('slideshow-blur');
                $('#album').html('').addClass('active');
                this.album.position = 0;

                for (var i = instancePanel.albumArray.length - 1; i >= 0; i--) {
                    $('#album').append("<div class='aimg' style='background-image:url(https://i.imgur.com/" + instancePanel.albumArray[i] + ".jpg)'></div>");
                }
                $('#album .aimg').eq(0).addClass('focus focus-firstalbum');
                $('#album .aimg').eq(this.album.length - 1).addClass('focus-lastalbum');
            } else {
                outputMessage("Album missing or not ready");
            }
        }
    }

    // --- Highlight ---

    activateHighlight(skipFocus) {

        if (this.state.nofocusActive) {
            this.state.nofocusActive = false;
            $('.nofocus').removeClass('nofocus');
        }

        this.slideshow.highlightingActive = true;
        helpController.refresh();

        if (core.input.getValue() != core.parser.session.rawCommand) {
            core.input.setValue(core.parser.session.rawCommand);
        }

        if (!skipFocus) this.focusHighlight();
    }

    disableHighlight() {
        this.slideshow.highlightingActive = false;
        helpController.refresh();
        core.input.focus();
        $('.focus').removeClass('focus');
    }

    resetHighlight() {
        if (system.menuActive) uiController.hideMenu();

        if (this.mode.reel) {
            this.slideshow.highlightingActive = false;
            core.input.focus();
        } else if (this.slideshow.highlightingActive) {
            this.disableHighlight();
        }
    }

    focusHighlight(overwriteIndex) {

        if (typeof overwriteIndex !== 'undefined') {
            if (overwriteIndex > (this.slideshow.length - 1)) overwriteIndex = (this.slideshow.length - 1);
            this.slideshow.position = overwriteIndex;
            this.activateHighlight(true);
        }

        core.input.blur();
        $('.focus').removeClass('focus');
        window.scrollTo(0, this.getOffsetForPanel(this.slideshow.position));
        this.activePanel.domElement.addClass("focus").removeClass('nofocus');
    }

    get activePanel() {
        return this.panels[this.slideshow.position];
    }

}