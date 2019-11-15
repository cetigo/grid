var core;

function refreshPanelReadyState(domId, imageUrl) {
    $('<img/>')
        .attr('src', imageUrl)
        .load(function () {
            var imgObject = $(this).get(0);

            if (core.view.panels[domId])
            {
                core.view.panels[domId].setReady('loaded', {
                    width: imgObject.naturalWidth,
                    height: imgObject.naturalHeight
                });
            }
            
            $(this).remove();
        })
        .error(function () {
            $(this).remove();
            if (core.view.panels[domId]) core.view.panels[domId].setReady('errored');
        })
}

// Controllers and Data Containers
var target = {
    // Target Info and pagination
    pageModifier: '',

    // Result data
    highScore: 0,
    autoplayInterval: false,

    // Blob Check (only in /custom)
    blobsChecked: false
};

var settings = {
    renderHtml5: true,
    showNSFW: false,
    limitImages: false,
    allowOtherSources: true,
    nightMode: false,
    showHelp: true,
    showInfo: true
};

var system = {
    untouched: true,
    usedSettings: false,
    cantSaveOptions: false,
    messageTimer: true,
    customMode: false,
    abortType: false,
    helpScore: 0,

    coreLoaded: false,

    menuActive: false,
    menuState: 1,
    menuPosition: 0,
    menuOptions: ['home', 'custom', 'reel', 'options']
};

var customMode = {
    data: {},
    counter: 0,
    backupActive: null,
    backup: {},
    rawUrl: []
};

// Other Info
var recommendationsSfw = ['\x61\x77\x77','\x50\x69\x63\x73','\x43\x61\x74\x73','\x45\x61\x72\x74\x68\x50\x6f\x72\x6e','\x66\x75\x6e\x6e\x79','\x41\x64\x76\x69\x63\x65\x41\x6e\x69\x6d\x61\x6c\x73','\x67\x69\x66\x73','\x41\x72\x74','\x4f\x6c\x64\x53\x63\x68\x6f\x6f\x6c\x43\x6f\x6f\x6c','\x57\x6f\x61\x68\x44\x75\x64\x65','\x72\x65\x61\x63\x74\x69\x6f\x6e\x67\x69\x66\x73','\x41\x62\x61\x6e\x64\x6f\x6e\x65\x64\x50\x6f\x72\x6e','\x67\x61\x6d\x69\x6e\x67','\x66\x6f\x6f\x64','\x70\x65\x72\x66\x65\x63\x74\x74\x69\x6d\x69\x6e\x67','\x6d\x69\x6e\x69\x6d\x61\x6c\x69\x73\x6d','\x46\x6f\x6f\x64\x50\x6f\x72\x6e','\x75\x6e\x65\x78\x70\x65\x63\x74\x65\x64'];
var recommendationsNsfw = ['\x6e\x73\x66\x77','\x4e\x53\x46\x57\x5f\x47\x69\x66','\x6e\x73\x66\x77\x5f\x67\x69\x66\x73','\x4f\x69\x6c\x70\x6f\x72\x6e','\x58\x73\x6f\x6d\x65','\x50\x72\x65\x74\x74\x79\x47\x69\x72\x6c\x73','\x54\x69\x74\x74\x69\x65\x73','\x53\x65\x78\x79\x47\x69\x72\x6c\x73','\x62\x6f\x6e\x65\x72\x6d\x61\x74\x65\x72\x69\x61\x6c','\x67\x65\x6e\x74\x6c\x65\x6d\x61\x6e\x62\x6f\x6e\x65\x72\x73','\x42\x6f\x6f\x62\x69\x65\x73','\x41\x73\x73','\x61\x64\x6f\x72\x61\x62\x6c\x65\x70\x6f\x72\x6e','\x41\x6e\x61\x6c','\x43\x75\x6d\x73\x6c\x75\x74\x73','\x4e\x53\x46\x57\x48\x61\x72\x64\x63\x6f\x72\x65','\x42\x6c\x6f\x77\x6a\x6f\x62\x73','\x47\x69\x72\x6c\x73\x69\x6e\x59\x6f\x67\x61\x70\x61\x6e\x74\x73','\x68\x6f\x6c\x64\x74\x68\x65\x6d\x6f\x61\x6e','\x62\x75\x72\x73\x74\x69\x6e\x67\x6f\x75\x74','\x36\x30\x66\x70\x73\x70\x6f\x72\x6e','\x4f\x5f\x46\x61\x63\x65\x73','\x53\x65\x78\x79\x42\x75\x74\x4e\x6f\x74\x50\x6f\x72\x6e'];

var favorites = {};

var versionNumber = "4.1";

var generalDb = {
    options: {
        general: {
            showHelp: {
                label: 'Show Help'
            },
            showNSFW: {
                label: 'Show NSFW Content'
            },
            showInfo: {
                label: 'Show Info'
            },
            nightMode: {
                label: 'Night Mode',
                onchange: function () {
                    refreshNightMode()
                }
            }
        },

        performance: {
            renderHtml5: {
                label: 'Render HTML5 Video'
            },
            limitImages: {
                label: 'Low Resolution'
            },
            allowOtherSources: {
                label: 'Allow all Sources'
            },
            reset: {
                label: 'Reset',
                onclick: 'clearHistory()',
                buttonMode: true
            }
        }
    }
};

// Command Lists
var commands = {
    "/delfav": {
        method: function (args) {
            if (args[1]) {
                if (favorites[args[1]]) {
                    delete favorites[args[1]];
                    saveToLocalstorage();
                    commands[""].method();
                    core.input.clear();
                } else {
                    outputMessage("Favorite entry not found")
                }
            } else {
                $.each(favorites, function (i, obj) {
                    delete favorites[i];
                });
                saveToLocalstorage();
                commands[""].method();
                core.input.clear();
                outputMessage("All favorites deleted");
            }
        },
        description: "Delete a specific favorite"
    },
    "/array": {
        method: function (args) {
            core.input.setValue(getSerializedPanels());
            core.input.focus();
        },
        description: "Get a JSON array of the current page"
    },
    "/dl": {
        method: function (args) {
            if (core.view.mode.special) {
                outputMessage('No Images present');
            } else {
                outputMessage('Downloading all Images..');
                downloadAll();
            }
        },
        description: "Download all images on the page"
    },
    "custom": {
        method: function (args) {
            customController.render();
        },
        description: "Enter Custom Mode"
    },
    "reel": {
        method: function (args) {
            document.title = "Reel Mode - Grid";
            if (args[1]) {
                reelController.initialize({
                    // An array of all comma-seperated sources after the first "reel" argument, with each of the sources trimmed
                    sources: args.slice(1).join(' ').split(',').map(s => s.trim())
                });
            } else {
                reelController.initialize({
                    auto: true
                });
            }
        },
        description: "Enter Reel Mode"
    },
    "#": {
        method: function (args) {
            if (settings.showNSFW) {
                executeCommand(recommendationsNsfw[getRandomInt(0, recommendationsNsfw.length - 1)]);
            } else {
                executeCommand(recommendationsSfw[getRandomInt(0, recommendationsSfw.length - 1)]);
            }
        },
        description: "Enter a random Subreddit"
    },
    "/set": {
        method: function (args) {
            if (args[1]) {
                if (settings[args[1]] !== undefined) {
                    if (args[2]) {
                        settings[args[1]] = (args[2] == 'on' || args[2] == 'true') ? true : false;
                    }
                    outputMessage(`${args[1]} - ${settings[args[1]]}`);
                } else {
                    outputMessage(`Setting ${args[1]} does not exist.`);
                }
            } else {
                outputMessage("Expected an argument");
            }
            core.input.setValue("");
            core.input.focus();
        },
        description: "Show and change settings on the fly"
    },
    "": {
        method: function (args) {
            systemController.reset();
            systemController.resetView();
            document.title = "Grid";

            var panelsToDraw = 5;
            var panelsDrawn = 0;
            var sortedFavorites = Object.keys(favorites).sort(function (a, b) {
                return favorites[b].amount - favorites[a].amount
            });

            $.each(sortedFavorites, function (i, obj) {
                if (panelsDrawn == 6) return false;

                $('<div/>', {
                    class: 'panel-suggestion panel-favorite',
                    onclick: "fetchJson('" + obj + "')"
                })
                    .html('<div class="panel-label">' + obj + '</div><div class="panel-background" style="background-image: url(' + favorites[obj].thumb + ')"></div>')
                    .appendTo('#results');
                panelsToDraw--;
                panelsDrawn++;
            });

            for (var i = panelsToDraw; i >= 0; i--) {
                $('<div/>', {
                    class: 'panel-suggestion panel-favorite panel-disabled'
                }).html('').appendTo('#results');
            }

            $('<div/>', {
                class: 'panel-suggestion panel-favorite',
                onclick: "fetchJson('reel')"
            }).html('reel').appendTo('#results');
            $('<div/>', {
                class: 'panel-suggestion panel-favorite',
                onclick: "fetchJson('custom')"
            }).html(Object.keys(customMode.data).length + ' custom').appendTo('#results');
            $('<div/>', {
                class: 'panel-suggestion panel-favorite',
                onclick: "fetchJson('help')"
            }).html('help').appendTo('#results');
            $('<div/>', {
                class: 'panel-suggestion panel-favorite',
                onclick: "fetchJson('options')"
            }).html('options').appendTo('#results');

            $('.panel-suggestion:odd').each(function () {
                $(this).after("<br>");
            })

        },
        description: "Go to the Dashboard"
    },
    "help": {
        method: function (args) {
            systemController.reset();
            systemController.resetView();
            document.title = "Help - Grid";
            if (args[1] == "1") {

                var handlerListString = "";

                $.each(loadHandler, function (i, obj) {
                    handlerListString += '<b>' + obj.name + '</b><br>';
                    if (obj.filter) handlerListString += 'filter: <pre>' + obj.filter + '</pre><br>';
                    else handlerListString += 'filter: none (default)<br>';
                    handlerListString += obj.description + '<br><br>';
                });

                $('#results').html(' ').append('<div class="panel panel-help"><h1>Advanced Help</h1><br><h2>Additional Features</h2>The following parse modules are currently installed:<br><br>' + handlerListString + 'Type <pre>reel</pre> to enter Reel Mode, a continuous, random image slideshow. It has no overview, unlike the usual views, and goes on indefinitely by fetching new random images during progression. You can specify sources by separating them with commas like this:<br><pre>reel cats 1, voat/gifs, 4chan/w/</pre><br>The sources behave like they do everywhere else, and also support filters if they are reddit sources. By default, the top 50 subreddits will be used, either from the NSFW or SFW category, depending on your settings. Like in any slideshow, you can press <pre>&darr;</pre> to save images to Custom Mode.<br><br>Type <pre>custom</pre> to enter Custom Mode. There, enter URLs to add images to the page. Pressing <pre>&darr;</pre> when in Slideshow view here will remove the image from Custom Mode. You can type <pre>/save</pre> to export a string that can be imported to reload the setup. Use <pre>/dl</pre> to download all images and videos on the page.<br><br><h2>Options</h2><b>Show Help</b><br>Shows a slim bar at the bottom which explains contextual keyboard commands.<br><br><b>Show NSFW content</b><br>While turned off, content that is self-declared NSFW will be blocked. Also affects Reel Mode and the random subreddit accessed with #.<br><br><b>Show Info</b><br>Displays Post Points, Age and submitting User when viewing images in the Slideshow.<br><br><b>Render HTML5 Video</b><br>While turned off, .webm and .mp4 videos won\'t be rendered. Can reduce hardware load.<br><br><b>Low Resolution</b><br>Activate to load smaller versions of imgur images. Can reduce bandwith usage.<br><br><b>Allow all Sources</b><br>While turned off, only imgur and gfycat links will be rendered. Renders many features broken if disabled.<br><br><b>Reset</b><br>Delete Favorites, History, Custom Mode and all data in your Localstorage.<br><br><br><h2>Technical Details</h2>Grid pulls data via AJAX calls from your client, there is no server-side code. It is only limited by your hardware and connection speed.<br><br>Grid might partially or completely break on older browsers. It is being developed on the latest WebKit browsers (Chrome, Safari), and probably works best on them. There is very barebones mobile support (Swipe gestures mimic arrow keys on a desktop), but mobile is not a priority.<br><br><a href="https://github.com/cetigo/grid" target="_blank">View Grid on Github</a></div>');
            } else {
                $('#results').html(' ').append('<div class="panel panel-help"><h1>Help</h1><h2>Controls</h2><pre>CTRL</pre> or <pre>ALT</pre><span>Enter / Exit Slideshow</span><br><pre>&larr;</pre> <pre>&rarr;</pre><span>Navigate images</span><br><pre>&uarr;</pre> <pre>&darr;</pre><span>Switch between input and images</span><br><pre>Space</pre><span>On last image - Load next page</span><br><br><pre>&uarr;</pre> <span>In the text field - Access menu</span><br><pre>&uarr;</pre> <span>During Slideshow - Access Album</span><br><pre>&darr;</pre><span>During Slideshow - Save to custom</span><br><pre>C</pre><span>During Slideshow - Toggle Autoplay</span><br><br><h2>Commands</h2><pre>#</pre><span>Random subreddit</span><br><pre>/dl</pre><span>Download all Images on the Page</span><br><pre>custom</pre><span>Overview of saved images</span><br><pre>reel</pre><span>Endless random image slideshow</span><br><pre>options</pre><span>Change settings or clear your history</span><br><pre> </pre> (empty)<span>Dashboard / Favorites</span><br><br><br>Append a number to the subreddit to filter:<br><pre>cats 1</pre> - Top of all Time<br><pre>cats 2</pre> - Top of the Year<br><pre>cats 3</pre> - Top of the Month<br><pre>cats 4</pre> - Top of the Week<br><br>String subreddits together:<br><pre>animals + aww + pics</pre><br><br>Version ' + versionNumber + '<div class="panel-help-link" onclick="fetchJson(\'help 1\')">Advanced Features</div><br></div>');
            }
        },
        description: "Read about controls and functionalities"
    },
    "options": {
        method: function (args) {
            systemController.reset();
            systemController.resetView();

            $('#results').html('');

            var optionsPanel = $('<div/>', {
                class: 'panel panel-options'
            })
                .html('<h1>Options</h1><br><br><div id="options-general"><h2>General</h2></div><div id="options-performance"><h2>Performance</h2></div>')
                .appendTo('#results');

            var optionsGeneralElem = $('#options-general'),
                optionsPerformElem = $('#options-performance');

            $.each(generalDb.options.general, function (i, obj) {

                var onclickString = (obj.onclick) ? 'onclick="' + obj.onclick + '"' : '';

                var newBox = $('<div/>', {
                    class: 'options-box',
                    id: 'optionbox-wrap-' + i
                })
                    .html('<input type="checkbox" class="uiswitch" id="optionbox-' + i + '" ' + onclickString + '><h6>' + obj.label + '</h6>')
                    .appendTo(optionsGeneralElem);

                var newSwitch = newBox.children('input');

                if (obj.buttonMode) {
                    newSwitch.prop('checked', false);
                } else {
                    if (settings[i]) newSwitch.prop('checked', true);
                    newSwitch.change(function () {
                        settings[i] = $(this).prop('checked');
                        if (obj.onchange) obj.onchange();
                    });
                }

            });

            $.each(generalDb.options.performance, function (i, obj) {

                var onclickString = (obj.onclick) ? 'onclick="' + obj.onclick + '"' : '';

                var newBox = $('<div/>', {
                    class: 'options-box',
                    id: 'optionbox-wrap-' + i
                })
                    .html('<input type="checkbox" class="uiswitch" id="optionbox-' + i + '" ' + onclickString + '><h6>' + obj.label + '</h6>')
                    .appendTo(optionsPerformElem);

                var newSwitch = newBox.children('input');

                if (obj.buttonMode) {
                    newSwitch.prop('checked', false);
                } else {
                    if (settings[i]) newSwitch.prop('checked', true);
                    newSwitch.change(function () {
                        settings[i] = $(this).prop('checked');
                    });
                }

            });

            if (system.cantSaveOptions) $('.panel-options').append("<br><br>We're sorry, but we can't permanently save your settings. Usually this is caused by surfing in Private Mode.<br><br>");

            if (typeof offlineMode != 'undefined') $('.panel-options').append("<br><br>It appears that we are disconnected from the Internet. Remaining functionality: Your local images in Custom Mode.<br><br>");

            document.title = "Options - Grid";

            system.usedSettings = true;
        },
        description: "Change settings"
    }
};

var customCommands = {
    "/array": {
        method: function (args) {
            core.input.setValue(getSerializedPanels());
            core.input.focus();
        },
        description: "Get a JSON array of the current page"
    },
    "custom": {
        method: function (args) {
            customController.leave();
        },
        description: "Leave Custom Mode"
    },
    "/explode": {
        method: function (args) {
            customController.explodeAlbums();
        },
        description: "Load all albums as single images"
    },
    "/shuffle": {
        method: function (args) {
            customController.buildData();
            customMode.rawUrl = shuffleArray(customMode.rawUrl);
            customController.reloadData();

            jsonRender(customMode.data);
            core.input.clear();
            outputMessage('Page shuffled.');
        },
        description: "Shuffle the page"
    },
    "/save": {
        method: function (args) {
            if (Object.keys(customMode.data).length) {
                customController.buildData();
                var customSave = '--' + btoa(JSON.stringify(customMode.rawUrl));
                core.input.setValue(customSave);
                core.input.focus();
                outputMessage("Copy the save and enter it later to reload this setup.");
            } else {
                core.input.clear();
            }
        },
        description: "Output a save string"
    },
    "/url": {
        method: function (args) {
            var downloadUrlArray = [];

            $.each(core.view.panels, function (i, obj) {
                downloadUrlArray.push(obj.downloadUrl);
            });

            core.input.setValue(JSON.stringify(downloadUrlArray));
            core.input.focus();

            outputMessage("Copy the URL Array and use it elsewhere.");
        },
        description: "Get a simplified JSON array"
    },
    "/dl": {
        method: function (args) {
            customController.downloadAll();
        },
        description: "Download all images on the page"
    },
    "/backup": {
        method: function (args) {
            if (args[1]) {
                customController.backup(args[1]);
                saveToLocalstorage();
            } else {
                outputMessage("Specify a slot to back up");
            }
        },
        description: "Back up the page to a given slot, see /loadup"
    },
    "/loadup": {
        method: function (args) {
            if (args[1]) {
                customController.loadup(args[1]);
            } else {
                if ($.isEmptyObject(customMode.backup)) {
                    outputMessage('No backups found');
                } else {
                    customController.renderOverview();
                }
            }
        },
        description: "Load a given slot or enter a backup slot overview"
    },
    "/clear": {
        method: function (args) {
            for (var member in customMode.data) delete customMode.data[member];
            customMode.counter = 0;
            customMode.backupActive = null;
            systemController.resetView();
            outputMessage("Page cleared");
        },
        description: "Clear the page"
    }
};

/* ----- Reel Mode ----- */

const reelController = {

    vars: {
        pool: [],
        reel: {},
        sources: [],
        sourcesTray: [],

        position: 0,
        counter: 0
    },

    reset: function () {
        this.vars.pool.length = 0;
        this.vars.reel = {};
        this.vars.sources.length = 0;
        this.vars.sourcesTray.length = 0;
        this.vars.position = 0;
        this.vars.counter = 0;
    },

    resetView: function (loadingText1, loadingText2) {
        $('#reel #loader, #reel #videocnt').remove();
        $('#reel')
            .css({
                "background-image": "none"
            })
            .append(`<div id="loader">Loading Reel<br>${loadingText1}<br>${loadingText2}</div>`)
            .addClass('active');

        $('#wrapper').addClass('reelmode');
        core.input.setValue('reel');
        core.view.mode.reel = true;
    },

    initialize: function (options) {
        systemController.resetView();
        helpController.hide();
        this.reset();

        var loadStringSources = '';
        var loadStringMode = '';

        if (options.sources) {
            this.vars.sources = options.sources;
            loadStringSources = this.vars.sources.length + ' custom sources';
        } else {
            if (settings.showNSFW) {
                this.vars.sources = recommendationsNsfw.slice(0);
                loadStringSources = 'nsfw';
            } else {
                this.vars.sources = recommendationsSfw.slice(0);
                loadStringSources = 'sfw';
            }
        }

        this.resetView(loadStringSources, loadStringMode);

        var callbackCounter = 1;
        this.refillPool(function () {
            if (callbackCounter++ < Math.min(reelController.vars.sources.length, 3)) return false;

            // Pool is filled, ready to launch
            $('#reel').find('#loader').remove();
            this.extendReel(10);
            this.render();

        }.bind(this));
    },

    refillPool: function (callback) {
        if (this.vars.pool.length >= 25) return false;

        // Pick 3 random sources and refill the pool
        var chosenSources = this.getSources(3);
        $.each(chosenSources, (i, source) => {
            core.parser.workerInvoker({ input: source })
                .then(answer => {
                    if (answer) this.fillPoolWith(answer.data);
                    if (callback) callback();
                });
        });
    },

    fillPoolWith: function (panels) {
        this.vars.pool = this.vars.pool.concat(panels);
    },

    getPoolItems: function (amount) {
        var returnArray = [];
        for (var i = 0; i < amount; i++) {
            var randomPoolIndex = getRandomInt(0, this.vars.pool.length - 1);
            returnArray.push(this.vars.pool[randomPoolIndex]);
            this.vars.pool.splice(randomPoolIndex, 1);
        }
        this.refillPool();
        return returnArray;
    },

    extendReel: function (amount) {
        const newItems = this.getPoolItems(amount);
        for (let i = newItems.length - 1; i >= 0; i--) {

            if (core.view.filter.active) {
                if (core.view.checkIfFilterApplies(newItems[i])) continue;
            }

            this.vars.reel[this.vars.counter] = new Panel(newItems[i]);
            this.vars.reel[this.vars.counter].prefetch(this.vars.counter);
            this.vars.counter++;
        }
    },

    getSources: function (amount) {
        const shuffledSources = shuffleArray(this.vars.sources);
        const answerArray = [];
        for (let i = 0; i < amount; i++) {
            if (shuffledSources[i]) answerArray.push(shuffledSources[i]);
        }
        return answerArray;
    },

    render: function () {
        var currentImage = this.vars.reel[this.vars.position];
        currentImage.renderToReel();

        $('#message.quickmsg').remove();
        core.input.blur();
        core.view.slideshow.highlightingActive = true;

        // Check Distance
        if (this.vars.counter - this.vars.position < 6) {
            this.extendReel(10);
        }
    },

    step: function (backwards) {
        if (backwards) {
            this.vars.position--;
            if (this.vars.position < 0) this.vars.position = 0;
        } else {
            this.vars.position++;
            if (this.vars.position > this.vars.counter) this.vars.position = this.vars.counter;
        }

        this.render();
    }
};

/* ----- Basic functionality ----- */
function onPageExtensionStart()
{
    core.parser.meta.pageLoadUnderway = true;
    $('.focus-nextpage').removeClass('focus-nextpage').addClass('focus-nextload');
}

function onPageExtensionEnd(success)
{
    core.parser.meta.pageLoadUnderway = false;
    if (success) {
        $('.panel, .panel-suggestion').remove();
        $('.focus-nextload').removeClass('focus-nextload');
    }
    else
    {
        outputMessage("There was an error loading the page");
        $('.focus-nextload').removeClass('focus-nextload').addClass('focus-nextpage');
    }
}

function extendPage(invokeCallback) {
    if (!core.parser.meta.pageLoadPossible || core.parser.meta.pageLoadUnderway) return false;

    ++core.parser.meta.page;

    if (core.parser.session.loadType === 'tumblr') {
        var tempUrl = core.parser.session.url + '&offset=' + (20 * core.parser.meta.page);
        onPageExtensionStart();

        core.parser.session.JSON = $.ajax({
            method: "get",
            async: true,
            url: tempUrl,
            dataType: "jsonp",

            success: function () {
                onPageExtensionEnd(true);

                loadController.show();
                loadController.updateProgress(100, 'fetch');

                for (var i = 0; i <= (core.parser.session.JSON.responseJSON.response.posts.length - 1); i++) {
                    var newImage = core.parser.session.JSON.responseJSON.response.posts[i].photos[0].original_size.url;
                    var newTitle = core.parser.session.JSON.responseJSON.response.posts[i].slug;

                    newTitle = newTitle.split('-').join(' ');

                    detectUrl(newImage, {
                        title: newTitle
                    });
                }

                core.view.initialize(true);
                if (invokeCallback) core.view.switchSlideshow();
                
                core.view.revealProximity();

                // extendPage Card
                $('<div/>', {
                    class: 'panel-suggestion',
                    onclick: "extendPage()"
                }).html('Continue<br>Page ' + (core.parser.meta.page + 2) + '<br>' + core.parser.additionalData.tumblr.replace('.tumblr.com', '') + '<span style="color: ' + getRandomColor() + ';" class="prefixspan">.tumblr</span>').appendTo('#results');
            },

            error: function (x, status, error) {
                onPageExtension(false);
            }

        });
        return;
    }
    else if (core.parser.session.loadType === 'deviantart')
    {
        var tempUrl = core.parser.session.url + '&offset=' + (60 * core.parser.meta.page);
        onPageExtensionStart();

        core.parser.session.JSON = $.ajax({
            method: "get",
            async: true,
            url: tempUrl,
            dataType: "xml",

            success: function () {
                onPageExtensionEnd(true);

                loadController.show();
                core.parser.jsonParseAdapter(core.parser.session.JSON.responseXML, {}, "deviantart");

                core.view.initialize(true);
                if (invokeCallback) core.view.switchSlideshow();
                core.view.revealProximity();

                // extendPage Card
                $('<div/>', {
                    class: 'panel-suggestion',
                    onclick: "extendPage()"
                }).html('Continue<br>Page ' + (core.parser.meta.page + 2) + '<br><span style="color: ' + getRandomColor() + ';" class="prefixspan">deviantart.</span>' + core.parser.additionalData.deviantart).appendTo('#results');
            },

            error: function (x, status, error) {
                onPageExtension(false);
            }

        });
        return;
    }

    target.pageModifier = "&count=" + core.parser.meta.page * 25;

    var tempUrl = core.parser.session.url + target.pageModifier + "&after=" + core.parser.session.lastUrl;
    onPageExtensionStart();

    // Start the AJAX Request
    core.parser.session.JSON = $.ajax({
        method: "get",
        async: true,
        url: tempUrl,
        dataType: "json",

        success: function () {
            onPageExtensionEnd(true);

            core.parser.session.lastUrl = core.parser.session.JSON.responseJSON.data.after;

            detectDataChildren(core.parser.session.JSON.responseJSON.data.children);

            // Go to the next image if a callback is invoked
            if (invokeCallback) {
                core.view.switchSlideshow();
            }
            
            core.view.revealProximity();

            // extendPage Card
            $('<div/>', {
                class: 'panel-suggestion',
                onclick: "extendPage()"
            }).html('Continue<br>Page ' + (core.parser.meta.page + 2) + '<br><span style="color: ' + getRandomColor() + ';" class="prefixspan">/r/</span>' + core.parser.meta.subreddit).appendTo('#results');

            // Refresh Current Subreddit Info Card
            if (core.parser.meta.mode != 'top - ever') {
                $('<div/>', {
                    class: 'panel-suggestion',
                    onclick: "fetchJson('" + core.parser.meta.subreddit + " 1')"
                }).html('Switch to <br><span style="color: ' + getRandomColor() + ';" class="prefixspan">/r/</span>' + core.parser.meta.subreddit + '<br>top - ever').appendTo('#results');
            } else {
                $('<div/>', {
                    class: 'panel-suggestion',
                    onclick: "fetchJson('" + core.parser.meta.subreddit + " 4')"
                }).html('Switch to <br><span style="color: ' + getRandomColor() + ';" class="prefixspan">/r/</span>' + core.parser.meta.subreddit + '<br>top - month').appendTo('#results');
            }

            // Suggest Mentioned Subreddits - "Mentioned here"
            for (var i = core.parser.misc.xpostMentions.length - 1; i >= 0; i--) {
                $('<div/>', {
                    class: 'panel-suggestion',
                    onclick: "fetchJson('" + core.parser.misc.xpostMentions[i] + "')"
                }).html('Mentioned here<br><span style="color: ' + getRandomColor() + ';" class="prefixspan">/r/</span>' + core.parser.misc.xpostMentions[i]).appendTo('#results');
            }

            // Suggest Popular Subreddits - "Recommended"
            if (settings.showNSFW && core.parser.meta.isNSFW) {
                for (var i = getRandomInt(1, 2); i >= 0; i--) {
                    var randomRecommendation = recommendationsNsfw[Math.floor(Math.random() * recommendationsNsfw.length)];

                    $('<div/>', {
                        class: 'panel-suggestion',
                        onclick: "fetchJson('" + randomRecommendation + "')"
                    }).html('Recommended<br><span style="color: ' + getRandomColor() + ';" class="prefixspan">/r/</span>' + randomRecommendation).appendTo('#results');
                }
            } else {
                for (var i = getRandomInt(1, 2); i >= 0; i--) {
                    var randomRecommendation = recommendationsSfw[Math.floor(Math.random() * recommendationsSfw.length)];

                    $('<div/>', {
                        class: 'panel-suggestion',
                        onclick: "fetchJson('" + randomRecommendation + "')"
                    }).html('Recommended<br><span style="color: ' + getRandomColor() + ';" class="prefixspan">/r/</span>' + randomRecommendation).appendTo('#results');
                }
            }
        },

        error: function (x, status, error) {
            onPageExtensionEnd(false);
        }

    });
}

function onCustomModeFileAdd(src_blob, type)
{
    if (type.substr(0, 5) == "image") {
        core.view.appendPanel({
            imageUrl: src_blob
        });
    } 
    else if (type.substr(0, 5) == "video") {
        core.view.appendPanel({
            contentType: 2,
            webmUrl: src_blob
        });
    }
    else
    {
        return;
    }

    core.view.initialize();

    // Blobs will not be saved nor outputted when calling /save. There would be no reasonable way to do this since they expire on refresh.
    customMode.data[customMode.counter] = {
        url: type.substr(0, 5) + src_blob,
        title: "",
        id: customMode.counter
    };
    customMode.counter++;
    saveToLocalstorage();
    core.input.clear();
}

function customModeParse(input) {

    var commands = input.split(' ');
    commands[0] = commands[0].toLowerCase();

    if (customCommands[commands[0]]) {
        customCommands[commands[0]].method(commands);
        return;
    }

    $('.panel.panel-help').remove();

    // Load a save
    if (commands[0].substr(0, 2) == '--') {
        try {
            var loadString = core.input.getValue().substr(2);
            customMode.rawUrl = JSON.parse(atob(loadString));
        } catch (err) {
            core.input.clear();
            outputMessage("Invalid Save");
            return;
        }

        customController.reloadData();
        jsonRender(customMode.data);

        core.input.clear();

        outputMessage('Setup loaded.');
        return;
    }

    if (~commands[0].indexOf('http')) {
        var urlParseReturn = detectUrl(core.input.getValue(), {});

        if (urlParseReturn != "error") {
            if (urlParseReturn == "videoforbidden") {
                outputMessage("HTML5 Video is disabled via <pre>options</pre>.");
            }

            core.view.initialize();

            customMode.data[customMode.counter] = {
                url: core.input.getValue(),
                title: "",
                id: customMode.counter
            };
            customMode.counter++;

            saveToLocalstorage();
            customController.refreshBackup();
            core.input.clear();
            return;
        }
    }

    // Neither a command, a save or an URL was entered. Leave Custom Mode and pass input to fetchJson.
    var passthroughString = commands[0] + (typeof commands[1] !== "undefined" ? ' ' + commands[1] : "");
    customController.leave(passthroughString);
}

// Command execution, the main form of control over this application
function executeCommand(rawCommand) {
    rawCommand = rawCommand.trim();

    // Home is just hardcoded to shorten to "" (nothing)
    if (rawCommand === 'home') 
        rawCommand = '';

    // Leave any album or slideshow
    if (core.view.album.active) core.view.accessAlbum();
    if (core.view.slideshow.active) core.view.quitSlideshow();

    // Delegate to either custom mode or the parser
    if (system.customMode) 
    {
        customModeParse(rawCommand);
    }
    else 
    {
        core.parser.parse(rawCommand);
    }
}

// Called when the DOM form submits
function onMainInputSubmit()
{
    executeCommand(core.input.getValue().trim().replace("%20", " "));
}

/* ----- UI Controllers ----- */

var loadController = {

    loadVars: {
        active: false,
        resetTimeout: null,
        disabling: false
    },

    reset: function () {
        $('#loader-fetch span').css('width', '0%');
        $('#loader-load span').css('width', '0%');
        clearTimeout(this.loadVars.resetTimeout);
        this.loadVars.disabling = false;
    },

    hide: function () {
        $('#wrapper-loadcontainer').removeClass('active');
        this.loadVars.active = false;
    },

    show: function () {
        if (this.loadVars.active) return true;

        this.reset();
        $('#wrapper-loadcontainer').addClass('active');
        this.loadVars.active = true;
    },

    updateProgress: function (progress, type) {
        if (!this.loadVars.active && progress !== 100) {
            this.show();
        }

        if (this.disabling && progress !== 100) {
            clearTimeout(this.loadVars.resetTimeout);
            this.disabling = false;
        }

        $('#loader-' + type + ' span').css('width', progress + '%');

        if (progress == 100 && type == 'load') {
            this.disabling = true;
            this.loadVars.resetTimeout = setTimeout(function () {
                loadController.hide();
            }, 1000);
        }
    }
};

var helpController = {
    refresh: function () {
        if (!settings.showHelp) return;
        if (system.menuActive) {
            var htmlString = '<span><pre id="helpmodal-down">&darr;</pre> Close Menu</span><span><pre id="helpmodal-left">&larr;</pre> <pre id="helpmodal-right">&rarr;</pre> Navigate Menu</span><span><pre>enter</pre> Confirm Menu</span>';
        } else if (core.view.slideshow.active) {
            if (system.customMode) {
                var htmlString = '<span><pre id="helpmodal-down">&darr;</pre> Remove from Custom</span><span><pre id="helpmodal-left">&larr;</pre> <pre id="helpmodal-right">&rarr;</pre> Navigate Images</span><span><pre>ctrl</pre> <pre>alt</pre> Exit Slideshow</span>';
            } else {
                var htmlString = '<span><pre id="helpmodal-down">&darr;</pre> Save to Custom</span><span><pre id="helpmodal-left">&larr;</pre> <pre id="helpmodal-right">&rarr;</pre> Navigate Images</span><span><pre>ctrl</pre> <pre>alt</pre> Exit Slideshow</span>';
            }
        } else if (!core.view.slideshow.highlightingActive) {
            var htmlString = '<span><pre id="helpmodal-down">&darr;</pre> Highlight images</span><span><pre id="helpmodal-up">&uarr;</pre> Open Menu</span>';
        } else {
            var htmlString = '<span id="helpmodal-1"><pre id="helpmodal-down">&uarr;</pre> Highlight Input</span><span id="helpmodal-2"><pre id="helpmodal-left">&larr;</pre> <pre id="helpmodal-right">&rarr;</pre> Navigate images</span><span id="helpmodal-3"><pre>ctrl</pre> <pre>alt</pre> Enter Slideshow</span>';
        }

        $('#helpmodal').html(htmlString);
        system.helpScore++;
        if (system.helpScore > 15) this.destroy();
    },

    hide: function () {
        $('#helpmodal').html('');
    },

    show: function () {
        this.refresh();
    },

    destroy: function () {
        $('#helpmodal').html('<span>Help disabled.</span>');
        setTimeout(function () {
            $('#helpmodal').html('');
        }, 2000);
        settings.showHelp = false;
        system.usedSettings = true;
        system.helpScore = 0;
    }
}

/* ----- Rendering Basics ----- */

function jsonRender(urlArray) {

    core.view.resetView();

    if (urlArray) {
        var doReload = false;

        if (typeof urlArray[0] == "string") {
            for (var i = 0; i <= (pureArray.length - 1); i++) {
                detectUrl(urlArray[i], {}, function (detectUrlReturn) {
                    if (detectUrlReturn == "deadblob") {
                        doReload = true;
                    }
                });
            }
        } else {
            // Object Array
            $.each(urlArray, function (index, object) {
                detectUrl(object.url, {
                    title: object.title
                }, function (detectUrlReturn) {
                    if (detectUrlReturn == "deadblob") {
                        doReload = true;
                    }
                });
            });
        }

        setTimeout(function () {
            if (doReload) {
                customController.removeBlob();
            }
        }, 700);
    }

    core.view.initialize();
    return true;
}

function detectDataChildren(dataChildren) {
    for (var i = 0; i <= (dataChildren.length - 1); i++) {

        detectUrl(
            dataChildren[i].data.url, {
                title: dataChildren[i].data.title,
                score: dataChildren[i].data.score,
                author: dataChildren[i].data.author,
                age: timeSince(dataChildren[i].data.created_utc)
            }
        );
    }

    core.view.initialize(true);
}

function detectUrl(inputUrl, inputOptions, callback, returnRaw) {

    try {
        var parseUrl = new URL(inputUrl);
    } catch (err) {
        // Might still be a blob.
    }

    var parseUrlHostSplit = parseUrl.host.split('.');
    parseUrl.pureHost = parseUrlHostSplit[parseUrlHostSplit.length - 2];

    var parseImage = {
        rawUrl: inputUrl,
        title: inputOptions.title || "",
        author: inputOptions.author || "",
        score: inputOptions.score || "",
        age: inputOptions.age || "",
        thumbUrl: inputOptions.thumbUrl || "",
        access: inputOptions.access || "",
        extended: inputOptions.extended || false
    };

    // Slimg Handling
    if (parseUrl.host === 'sli.mg' || parseUrl.host === 'i.sli.mg') {
        var pathArray = parseUrl.pathname.split("/").filter(function (n) {
                return n !== ""
            }),
            fragment = pathArray[pathArray.length - 1],
            fragmentArray = fragment.split(".");

        // Case i.sli.mg.com/ABCDE.gifv

        if (fragmentArray[fragmentArray.length - 1] === "gifv") {
            var imgurCode = fragmentArray[0];

            parseImage.contentType = 2;
            parseImage.posterUrl = "https://i.sli.mg/" + imgurCode + "l.jpg";
            parseImage.webmUrl = parseImage.downloadUrl = "https://i.sli.mg/" + imgurCode + ".webm";
            parseImage.mp4Url = "https://i.sli.mg/" + imgurCode + ".mp4";
        }

        // Case i.sli.mg/ABCDE.xyz

        else if (pathArray.length === 1 && fragmentArray.length === 2) {

            if (fragmentArray[1] === "webm" || fragmentArray[1] === "mp4") {

                var slimgCode = fragmentArray[0];

                parseImage.contentType = 2;
                parseImage.posterUrl = "https://i.sli.mg/" + slimgCode + "l.jpg";
                parseImage.webmUrl = parseImage.downloadUrl = "https://i.sli.mg/" + imgurCode + ".webm";
                parseImage.mp4Url = "https://i.sli.mg/" + slimgCode + ".mp4";

            } else {

                if (settings.limitImages) {
                    fragmentArray[0] += "l";
                    fragment = fragmentArray.join('.');
                }

                parseImage.imageUrl = parseImage.downloadUrl = "https://i.sli.mg/" + fragment;
            }


        }

        // Case sli.mg/r/sub/ABCDE
        // Case sli.mg/ABCDE

        else if (pathArray[0] === "r" || pathArray.length === 1) {

            // Use .jpg as a universal ending (browsers display any image anyway)
            if (settings.limitImages) fragment += "l.jpg";
            else fragment += ".jpg";

            parseImage.imageUrl = parseImage.downloadUrl = "https://i.sli.mg/" + fragment;

        }

        else return "error";
    }

    // Imgur Handling
    else if (parseUrl.host === 'i.imgur.com' || parseUrl.host === 'imgur.com' || parseUrl.host === 'm.imgur.com') {

        var pathArray = parseUrl.pathname.split("/").filter(function (n) {
                return n !== ""
            }),
            fragment = pathArray[pathArray.length - 1],
            fragmentArray = fragment.split(".");

        // Case i.imgur.com/ABCDE.gifv

        if (fragmentArray[fragmentArray.length - 1] === "gifv") {
            var imgurCode = fragmentArray[0];

            parseImage.contentType = 2;
            parseImage.posterUrl = "https://i.imgur.com/" + imgurCode + "l.jpg";
            parseImage.fetchType = "imgurgifv";
            parseImage.fetchData = imgurCode;
            parseImage.needsFetch = true;
        }

        // Case imgur.com/ABCDE&ABCDE&ABCDE

        else if (~fragment.indexOf("&amp;")) {

            var imgurCodesArray = fragment.split('&amp;');

            parseImage.fetchType = "imguralbum";
            parseImage.fetchData = imgurCodesArray[0];
            parseImage.imageUrl = parseImage.downloadUrl = "https://i.imgur.com/" + imgurCodesArray[0] + ".jpg";
            parseImage.albumArray = imgurCodesArray.reverse();

        }

        // Case imgur.com/ABDDE,ABDDE,ABCDE

        else if (~fragment.indexOf(",")) {

            var imgurCodesArray = fragment.split(',');

            parseImage.fetchType = "imguralbum";
            parseImage.fetchData = imgurCodesArray[0];
            parseImage.imageUrl = parseImage.downloadUrl = "https://i.imgur.com/" + imgurCodesArray[0] + ".jpg";
            parseImage.albumArray = imgurCodesArray.reverse();
        }

        // Case imgur.com/a/ABCDE

        else if (pathArray[0] === "a") {

            parseImage.needsFetch = true;
            parseImage.fetchType = "imguralbum";
            parseImage.fetchData = fragment;

        }

        // Case i.imgur.com/ABCDE.xyz

        else if (pathArray.length === 1 && fragmentArray.length === 2) {

            if (fragmentArray[1] === "webm" || fragmentArray[1] === "mp4") {

                var imgurCode = fragmentArray[0];

                parseImage.contentType = 2;
                parseImage.posterUrl = "https://i.imgur.com/" + imgurCode + "l.jpg";
                parseImage.webmUrl = parseImage.downloadUrl = "https://i.imgur.com/" + imgurCode + ".webm";
                parseImage.mp4Url = "https://i.imgur.com/" + imgurCode + ".mp4";

            } else {

                if (settings.limitImages) {
                    fragmentArray[0] += "l";
                    fragment = fragmentArray.join('.');
                }

                parseImage.imageUrl = parseImage.downloadUrl = "https://i.imgur.com/" + fragment;
            }


        }

        // Case imgur.com/r/sub/ABCDE
        // Case imgur.com/ABCDE

        else if (pathArray[0] === "r" || pathArray.length === 1) {

            // Use .jpg as a universal ending (browsers display any image anyway)
            if (settings.limitImages) fragment += "l.jpg";
            else fragment += ".jpg";

            parseImage.imageUrl = parseImage.downloadUrl = "https://i.imgur.com/" + fragment;

        }

        else return "error";

    }

    //Gfycat Handling
    else if (parseUrl.pureHost == "gfycat" && settings.renderHtml5 == true) {
        var rawUrlSplit = inputUrl.split('/');
        var gfycatCode = rawUrlSplit[rawUrlSplit.length - 1].replace('.mp4', '').replace('.webm', '');

        parseImage.contentType = 2;
        parseImage.needsFetch = true;
        parseImage.fetchType = "gfycat";
        parseImage.fetchData = gfycatCode;
    }

    // Deviantart Handling
    else if (~parseUrl.host.indexOf("deviantart")) {
        parseImage.needsFetch = true;
        parseImage.fetchType = "deviantart";
        parseImage.fetchData = inputUrl;
    }

    // Local Blob Handling
    else if (inputUrl.substr(5, 10) == "blob:null/" || inputUrl.substr(5, 11) == "blob:http:/") {
        if (inputUrl.substr(0, 5) == "image") {
            parseImage.imageUrl = inputUrl.substr(5);

            checkImage(inputUrl.substr(5), function (blobResult) {
                if (!blobResult) {
                    callback("deadblob")
                }
            });

        } else if (inputUrl.substr(0, 5) == "video") {

            parseImage.contentType = 2;
            parseImage.webmUrl = inputUrl.substr(5);
        }
    }

    // Check for Hotlink
    else if (parseUrl.pathname.split('.').length - 1) {
        var urlExtensionSplit = parseUrl.pathname.split('.');
        var urlExtension = urlExtensionSplit[urlExtensionSplit.length - 1].toLowerCase();

        if (urlExtension == 'jpg' || urlExtension == 'jpeg' || urlExtension == 'png' || urlExtension == 'gif') {
            parseImage.imageUrl = inputUrl;
        } else if (urlExtension == 'webm' || urlExtension == 'mp4') {
            if (settings.renderHtml5) {
                parseImage.contentType = 2;
                parseImage.webmUrl = inputUrl;
            } else {
                return "videoforbidden";
            }
        } else {
            return "error";
        }

        parseImage.downloadUrl = inputUrl;
    }

    // Nothing worked
    else return "error";

    if (returnRaw) {
        return parseImage;
    } else {
        core.view.appendPanel(parseImage);
    }
}

/* ----- General Behaviour ----- */

// Called in slideshows, when the down arrow is pressed
function onSlideshowSaveAction() {
    if (!core.view.slideshow.active && !core.view.mode.reel || core.view.album.active) return;

    if (system.customMode)
    {
        customController.removeCurrentPanel();
        return;
    }

    let gatheredTitle = '';
    let gatheredUrl = '';

    if (core.view.mode.reel) {
        gatheredUrl = reelController.vars.reel[reelController.vars.position].rawUrl;
    } else {
        gatheredUrl = core.view.activePanel.rawUrl;
        gatheredTitle = core.view.activePanel.title;
    }

    customController.storeImage(gatheredUrl, gatheredTitle);

    saveToLocalstorage();
}

function downloadUrl(url, overrideTitle) {
    if (!overrideTitle) {
        overrideTitle = true
    }
    $('<a href="' + url + '" download="' + overrideTitle + '">')[0].click();
}

function downloadAll() {
    for (var i = core.view.panels.length - 1; i >= 0; i--) {
        downloadUrl(core.view.panels[i]);
    }
}

/* ----- Simple Utility ----- */

function getRandomColor() {
    return "hsla(" + getRandomInt(80, 300) + ", 60%, 50%, 1)";
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(o) {
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}

function truncateString(str, n) {
    return (str.length > n) ? str.substr(0, n - 1) + '...' : str;
}

function timeSince(input) {
    var date = new Date(input * 1000);
    var seconds = Math.floor((new Date() - date) / 1000);
    var interval = Math.floor(seconds / 31536000);

    if (interval > 1) {
        return interval + " years";
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
        return interval + " months";
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {
        return interval + " days";
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
        return interval + " hours";
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
        return interval + " minutes";
    }
    return Math.floor(seconds) + " seconds";
}

function timeSinceDate(date) {
    var seconds = Math.floor((new Date() - date) / 1000);
    var interval = Math.floor(seconds / 31536000);

    if (interval > 1) {
        return interval + " years";
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
        return interval + " months";
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {
        return interval + " days";
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
        return interval + " hours";
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
        return interval + " minutes";
    }
    return Math.floor(seconds) + " seconds";
}

function preloadImages(images) {
    for (var i = images.length - 1; i >= 0; i--) {
        preloadImage(images[i])
    }
}

function preloadImage(url) {
    $('<img/>')
        .attr('src', url)
        .load(function () {
            $(this).remove();
        });
}

function getRating(current, maximum) {

    var decimalRate = current / maximum;

    if (decimalRate < 0.1) {
        return 'F'
    } else if (decimalRate < 0.2) {
        return 'E'
    } else if (decimalRate < 0.3) {
        return 'D'
    } else if (decimalRate < 0.4) {
        return 'C'
    } else if (decimalRate < 0.6) {
        return 'B'
    } else if (decimalRate < 0.85) {
        return 'A'
    } else if (decimalRate <= 1) {
        return 'S'
    } else {
        return false
    }
}

/* ----- Custom Mode ----- */

var customController = {

    /* -- Core -- */

    render: function () {
        systemController.reset();
        system.customMode = true;
        saveToLocalstorage();

        var customModeLength = Object.keys(customMode.data).length;

        if (customModeLength > 0) {
            jsonRender(customMode.data);
            var returnVal = true;
        } else {
            systemController.resetView();
            $('#results').html('<div class="panel panel-help"><h1>Custom Mode</h1><br><pre>custom</pre><span>Enter Custom Mode</span><br><pre>/save</pre><span>Get a save for the current page</span><br><pre>/shuffle</pre><span>Shuffle the page</span><br><pre>/backup</pre><span>Save the page to a given slot</span><br><pre>/loadup</pre><span>Restore the page from a given slot</span><br><pre>/dl</pre><span><b>Download</b> all images</span><br><br>Here you can see all of your saved images. Save images by pressing <pre>&darr;</pre> when in Slideshow view anywhere else. You can also add more images to Custom Mode by entering URLs while here. Remove images from Custom Mode by pressing <pre>&darr;</pre> when in Slideshow view here.<br><br>This mode is being saved to your local storage if possible. You can also type <pre>/save</pre> to obtain a save string that can be imported later.<br><br></div>');
            var returnVal = false;
        }

        core.input.clear();
        core.input.changePlaceholder('Enter a URL');
        document.title = "Custom Mode - Grid";

        return returnVal;
    },

    leave: function (passthroughString) {
        var passthroughCommand = '';
        if (passthroughString) passthroughCommand = passthroughString;
        system.customMode = false;

        core.input.clear();
        core.input.changePlaceholder('Enter a Command');

        executeCommand(passthroughCommand);
    },

    backup: function (i) {
        if (!i) {
            i = (Object.keys(customMode.backup).length + 1);
        }

        customMode.backup[i] = {
            content: JSON.stringify(customMode.data),
            thumbs: getThumbnails(customMode.data)
        };
        customMode.backupActive = i;

        core.input.setValue('');
        executeCommand('/loadup');
    },

    refreshBackup: function () {
        if (!customMode.backupActive) return false;
        customMode.backup[customMode.backupActive].content = JSON.stringify(customMode.data);
    },

    loadup: function (i) {
        var loadupObject = JSON.parse(customMode.backup[i].content);

        for (var member in customMode.data) delete customMode.data[member];
        customMode.counter = 0;
        customMode.backupActive = i;

        $.each(loadupObject, function (index, object) {
            customMode.data[customMode.counter] = {
                url: object.url,
                title: object.title,
                id: customMode.counter
            };
            customMode.counter++;
        });

        jsonRender(customMode.data);
        outputMessage('Loaded from slot ' + i + '.');
    },

    renderOverview: function () {
        systemController.resetView();

        $.each(customMode.backup, function (i, obj) {

            var elementCount = Object.keys(JSON.parse(obj.content)).length,
                thumbElem = "";

            for (var j = obj.thumbs.length - 1; j >= 0; j--) {
                thumbElem += "<div class='panel-thumb' style='background-image: url(" + obj.thumbs[j] + ")'></div>";
            }

            $('<div/>', {
                class: 'panel-suggestion',
                onclick: "fetchJson('/loadup " + String(i) + "')"
            })
                .html(
                    '<div class="panel-label">Backup ' + String(i) + '<br><span style="color: ' + getRandomColor() + ';" class="prefixspan">' + elementCount + '</span> Elements</div>' + '<div class="panel-thumb-wrap">' + thumbElem + '</div>'
                )
                .appendTo('#results');
        });
    },

    /* -- Data -- */

    removeBlob: function () {
        var remArr = [];

        outputMessage('Local Images expired');

        $.each(customMode.data, function (i, obj) {
            if (obj.url.substr(5, 10) == "blob:null/" || obj.url.substr(5, 11) == "blob:http:/") {
                remArr.push(i);
            }
        });

        for (var i = remArr.length - 1; i >= 0; i--) {
            delete customMode.data[remArr[i]];
        }

        this.render();

    },

    buildData: function () {
        customMode.rawUrl.length = 0;
        $.each(customMode.data, function (index, obj) {
            customMode.rawUrl.push(obj.url);
        });
    },

    reloadData: function () {
        for (var member in customMode.data) delete customMode.data[member];
        customMode.counter = 0;

        for (var i = customMode.rawUrl.length - 1; i >= 0; i--) {
            customMode.data[customMode.counter] = {
                url: customMode.rawUrl[i],
                title: "",
                id: customMode.counter
            };
            customMode.counter++;
        }
        ;

        saveToLocalstorage();
    },

    getNthKey: function(index)
    {
        return Object.keys(customMode.data)[index];
    },

    removePanel: function(index) {
        const key = this.getNthKey(index);
        if (key !== undefined)
        {
            delete customMode.data[key];
            core.view.quitSlideshow();
            outputMessage("<b>Removed</b> from custom", "red quickmsg");

            var renderAnswer = this.render();
            if (renderAnswer) 
                core.view.focusHighlight(index);

            this.refreshBackup();
        }
        else
        {
            console.log("Attempted to remove custom panel out of bounds (" + index + ")");
        }
    },

    removeCurrentPanel: function()
    {
        this.removePanel(core.view.slideshow.position);
    },

    storeImage: function (url, title) {
        var foundUrlIndex = this.findInData(url);

        if (foundUrlIndex) {
            // Remove from custom
            delete customMode.data[foundUrlIndex];

            outputMessage("<b>Removed</b> from custom", "red quickmsg");
        } else {
            // Save to custom
            customMode.data[customMode.counter] = {
                url: url,
                title: title,
                id: customMode.counter
            };
            customMode.counter++;

            outputMessage("<b>Saved</b> to custom", "blue quickmsg");
        }

        this.refreshBackup();
    },

    findInData: function (url) {
        var foundUrl = _.findKey(customMode.data, function (e) {
            return e.url == url;
        });

        return foundUrl || false;
    },

    /* -- Misc -- */

    explodeAlbums: function () {
        $.each(core.view.panels, function (i, obj) {
            if (obj.albumArray) {
                var titleCount = 1;

                for (var j = obj.albumArray.length - 1; j >= 0; j--) {

                    customMode.data[customMode.counter] = {
                        url: "https://imgur.com/" + obj.albumArray[j] + ".jpg",
                        title: titleCount + ' - ' + obj.title,
                        id: customMode.counter
                    };

                    customMode.counter++;
                    titleCount++;
                }

                delete customMode.data[i];
            }
        });

        jsonRender(customMode.data);
        core.input.clear();
    },

    downloadAll: function () {
        var downloadCounter = 0;

        $.each(core.view.panels, function (i, obj) {
            if (obj.downloadUrl) {
                downloadCounter++;
                downloadUrl(obj.downloadUrl);
            }

            if (obj.albumArray) {
                var albumIterator = 1;
                for (var j = obj.albumArray.length - 2; j >= 0; j--) {
                    downloadCounter++;
                    var overrideTitle = albumIterator + ' - ' + obj.fetchData;
                    albumIterator++;
                    downloadUrl("https://i.imgur.com/" + obj.albumArray[j] + ".jpg", overrideTitle);
                }
            }
        });

        if (downloadCounter) {
            outputMessage("Downloading " + downloadCounter + " images..", "blue");
        } else {
            outputMessage("No downloadable images");
        }
    }
};

function getThumbnails(data) {
    var thumbCount = 0,
        thumbReturnArray = [];

    $.each(data, function (i, obj) {
        if (!obj.url.split) return true;

        var urlSplit = obj.url.split('.'),
            fileEnding = urlSplit[urlSplit.length - 1].toLowerCase(),
            blobIdentifier = obj.url.split(':')[0];

        if (fileEnding === "jpg" ||
            fileEnding === "jpeg" ||
            fileEnding === "png" ||
            fileEnding === "gif") {

            thumbReturnArray.push(obj.url);
            thumbCount++;

        } else if (blobIdentifier === "imageblob") {

            thumbReturnArray.push(obj.url.substr(5));
            thumbCount++;

        }

        if (thumbCount >= 4) return false;
    });

    return thumbReturnArray;
}

function checkImage(blob, callback) {
    if (target.blobsChecked) {
        callback(true);
        return;
    }

    var bagool = new Image();
    bagool.onload = function () {
        callback(true);
    };
    bagool.onerror = function () {
        callback(false);
    };
    bagool.src = blob;
    target.blobsChecked = true;
}

/* ----- Other ----- */

function refreshNightMode() {
    if (settings.nightMode) $('body').addClass('nightmode');
    else $('body').removeClass('nightmode');
}

function outputMessage(string, additionalClass = '') {
    $('#message').remove();
    $('#messagecnt').append(`<div id="message" class="${additionalClass}">${string}</div>`);
}

function evaluateSettings() {
    refreshNightMode();
    if (!settings.showHelp) $('#helpmodal').html('');
}

function abortNetwork() {
    if (system.abortType) {
        if (system.abortType == 1) {
            window.stop();
        } else if (system.abortType == 2) {
            document.execCommand('Stop');
        }
    } else {
        try {
            window.stop();
            system.abortType = 1;
        } catch (e) {
            document.execCommand('Stop');
            system.abortType = 2;
        }
    }
}

function extractLinksFromText(text) {
    var regEx = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.match(regEx);
}

var systemController = {

    vars: {
        currentHash: null
    },

    setHash: function (str) {
        this.vars.currentHash = str;
        window.location.hash = '#!/' + str;
    },

    readHash: function (str) {
        if (window.location.hash) {
            return window.location.hash.substr(3).replace(/%20/g,' ');
        } else {
            return false;
        }
    },

    onHashChange: function () {
        var newHash = this.readHash();
        if (newHash !== this.vars.currentHash) {
            executeCommand(newHash);
        } else {
            return false;
        }
    },

    initHash: function () {
        var foundHash = this.readHash();

        if (foundHash) {
            if (foundHash === 'jri') {
                settings.showNSFW = true;
                executeCommand('reel');
            } else {
                executeCommand(foundHash);
            }
        }
    },

    reset: function () {
        if (system.untouched) {
            system.untouched = false;
        }
        if (system.coreLoaded) abortNetwork();
        autoplaySlideShow(true);
        saveToLocalstorage();

        core.view.reset();
    },

    resetView: function () {

        core.view.reset();

        // Meta
        target.blobsChecked = false;

        // Lengths
        target.highScore = 0;
        target.finishedLoading = 0;
    }
};

var uiController = {

    /* -- Menu -- */

    showMenu: function () {

        system.menuActive = true;
        system.menuState = 1;

        this.fillMenu(1);
        $('#wrapper').addClass('showmenu');

        core.input.blur();
        if (core.input.getValue() != core.parser.session.rawCommand) {
            core.input.setValue(core.parser.session.rawCommand);
        }

        helpController.refresh();
    },

    switchMenuState: function () {
        if (core.parser.session.loadType !== 'reddit' && !system.customMode) return;
        system.menuState++;
        if (system.menuState > 2) system.menuState = 1;
        this.fillMenu(system.menuState);
    },

    fillMenu: function (type) {
        if (type == 1) {
            system.menuOptions = ['home', 'custom', 'reel', 'options'];
        } else if (type == 2) {
            if (system.customMode) {
                system.menuOptions = ['/loadup', '/array', '/dl', '/save'];
            } else {
                system.menuOptions = ['4', '3', '2', '1'];
            }
        } else {
            return false;
        }

        system.menuState = type;
        system.menuPosition = 0;
        var itemHtmlString = "";
        for (var i = 0; i < system.menuOptions.length; i++) {
            itemHtmlString += "<div class='wrapper-menu-item'>" + system.menuOptions[i] + "</div>";
        }

        $('#wrapper-menu').html(itemHtmlString);
        $('#wrapper-menu .wrapper-menu-item').eq(0).addClass('active');
    },

    hideMenu: function (silent) {
        system.menuActive = false;
        $('#wrapper').removeClass('showmenu');
        if (!silent) core.input.focus();

        helpController.refresh();
    },

    switchMenuPosition: function (reverse) {
        if (reverse) {
            system.menuPosition--;
        } else {
            system.menuPosition++;
        }

        if (system.menuPosition < 0) system.menuPosition = 3;
        if (system.menuPosition > 3) system.menuPosition = 0;

        $('#wrapper-menu .wrapper-menu-item').removeClass('active');
        $('#wrapper-menu .wrapper-menu-item').eq(system.menuPosition).addClass('active');
    },

    performMenuAction: function () {
        var currentOption = system.menuOptions[system.menuPosition];
        var numberCheck = Number(currentOption);

        if (!isNaN(numberCheck)) {
            // Its a number, filter the current page
            executeCommand(core.parser.meta.subreddit + ' ' + currentOption);
        } else {
            executeCommand(currentOption);
        }

        this.hideMenu();
        core.input.focus();
    }
}

var contentController = {

    // -- Global --

    toggleZoom: function () {
        if (core.view.slideshow.active) $('#slideshow .image').toggleClass('zoom');
    },

    toggleOriginalZoom: function () {
        if (core.view.slideshow.active) $('#slideshow .image').toggleClass('original');
    },

    accessLink: function () {
        if (core.view.slideshow.active) {
            var accessLink = core.view.activePanel.metaData.access;
            if (!accessLink) return false;
            core.view.quitSlideshow();
            core.parser.parse(accessLink, core.parser.session.rawCommand);
        }
    }

};

function inputCheck(elem) {
    // Currently unused and would be called onkeyup= on the #subreddit-input element, passing this as elem
    var inputText = elem.value;

    if (commands[inputText]) {
        // Here we could possibly show some message explaining what the command would do if entered
        console.log(commands[inputText].description);
    }
}

function onVerticalInput(is_down_input) {

    // DOWN ARROW
    if (is_down_input) {

        // Always deactivate the menu if its active
        if (system.menuActive) {
            uiController.hideMenu();
            return;
        }

        if (core.view.slideshow.videoControlMode) {
            core.view.toggleVideoSound();
            return;
        }

        // Reel Mode
        if (core.view.mode.reel) {
            if (core.view.slideshow.highlightingActive) {
                onSlideshowSaveAction();
            } else {
                core.view.slideshow.highlightingActive = true;
                core.input.blur();
            }
            return;
        }

        // Save to Custom
        if (core.view.slideshow.active) {
            onSlideshowSaveAction();
            return;
        }

        // Arrows do nothing in special mode
        if (core.view.mode.special) {
            return;
        }

        // Activate Highlighting
        if (!core.view.slideshow.highlightingActive) {
            core.view.activateHighlight();
            return;
        }

    }

    // UP ARROW
    else {

        if (!core.view.slideshow.highlightingActive) {
            if (!system.menuActive) {
                uiController.showMenu();
            } else {
                uiController.switchMenuState();
            }

            return;
        }

        // Reel Mode
        if (core.view.mode.reel) {
            core.view.slideshow.highlightingActive = false;
            core.input.focus();
            return;
        }

        // Arrows do nothing in special mode
        if (core.view.mode.special) {
            return;
        }

        // Disable Highlighting
        if (core.view.slideshow.highlightingActive) {
            core.view.disableHighlight();
            return;
        }
    }

}

function autoplaySlideShow(forceStop) {
    // End Autoplay
    if (forceStop) {
        if (target.autoplayInterval) {
            clearInterval(target.autoplayInterval);
            target.autoplayInterval = false;
            $('#play, #reelplay').removeClass();
        }
        return;
    }

    // Only works in Slideshows and Reel Mode
    if (!core.view.slideshow.active && !core.view.mode.reel) {
        return;
    }

    if (!target.autoplayInterval) {
        target.autoplayInterval = setInterval(function () {
            core.view.switchSlideshow(false, true);
        }, 2500);
        $('#play, #reelplay').addClass('active');
    } else {
        clearInterval(target.autoplayInterval);
        target.autoplayInterval = false;
        $('#play, #reelplay').removeClass();
    }
}

/* ----- History and LocalStorage ----- */

// Returns a JSON of currently visible panels, [{url, title}, ...]
function getSerializedPanels() {

    var arrayFetchReturn = [];

    $.each(core.view.panels, function (i, obj) {
        arrayFetchReturn.push({
            url: obj.downloadUrl,
            title: obj.title
        });
    });

    return JSON.stringify(arrayFetchReturn);
}

function clearHistory() {
    favorites = {};
    for (var member in customMode.data) delete customMode.data[member];
    customMode.counter = 0;

    var resetLabel = $('#optionbox-wrap-reset').find('h6'),
        resetInput = $('#optionbox-wrap-reset').find('input');

    resetLabel.text('...');

    try {
        localStorage.removeItem('rc.favorites');
        localStorage.removeItem('rc.settings');
        localStorage.removeItem('rc.custom');
        localStorage.removeItem('rc.filter');
    } catch (err) {
        system.cantSaveOptions = true;
    }

    setTimeout(function () {
        resetInput.prop('checked', false).prop('disabled', true);
        resetLabel.text('Data Cleared');
    }, 400);
}

function saveToLocalstorage() {
    if (system.cantSaveOptions) {
        return;
    }

    // Try to save Settings
    if (system.usedSettings) {
        try {
            localStorage.setItem('rc.settings', JSON.stringify(settings));
        } catch (err) {
            system.cantSaveOptions = true;
        }
        system.usedSettings = false;
    }

    // Try to save the favorites
    try {
        localStorage.setItem('rc.favorites', JSON.stringify(favorites));
        customController.buildData();
        localStorage.setItem('rc.custom', LZString.compress(btoa(JSON.stringify(customMode.rawUrl))));
        localStorage.setItem('rc.backup', LZString.compress(btoa(JSON.stringify(customMode.backup))));
        localStorage.setItem('rc.filter', btoa(JSON.stringify(core.view.filter)));
    } catch (err) {
        system.cantSaveOptions = true;
    }
}

function createOrUpdateFavoriteEntry(name, thumbnail, type) {
    var favoriteType = type || 1;

    if (favorites[name]) {
        // Favorite already exists
        favorites[name].amount++;
    } else {
        // Create a new favorite
        if (!thumbnail) {
            core.view.panels[0].thumbnailCallback(name)
        }

        favorites[name] = {
            amount: 1,
            thumb: thumbnail,
            type: favoriteType
        }
    }

    // This is more or less unnecessary, we just display 6 favorites anyways
    if (Object.keys(favorites).length > 6) {
        var purgeCount = 0;

        $.each(favorites, function (i, obj) {
            if (purgeCount > 3) return false;
            if (obj.amount < 3) {
                delete favorites[i];
                purgeCount++;
            }
        });
    }
}


$(function () {

    core = {

        view: new View(),
        parser: new Parser(),
        input: new Input(),

        state: {}

    };

    core.input.clear();
    core.input.changePlaceholder('Enter a Command');

    // Intro Text
    setTimeout(function () {
        if (system.untouched) {
            $('<div/>', {
                id: 'loader'
            }).html('Try <pre>aww</pre> or <pre>pics</pre> to get started.<br><br>Type <pre>help</pre> for more information.<br><br>Type <pre>options</pre> to change your settings.').hide().appendTo('#results').fadeIn();
        }
        system.coreLoaded = true;
    }, 2500);

    // Key Listener
    $(document).keydown(function (e) {
        /*
         if (core.view.slideshow.active) {
         if (e.which == 37) { $('#arrow-indicator-left').addClass('active'); }
         if (e.which == 39) { $('#arrow-indicator-right').addClass('active'); }
         if (e.which == 40) { $('#arrow-indicator-down').addClass('active'); }
         if (e.which == 38) { $('#arrow-indicator-up').addClass('active'); }
         };
         */

        switch (e.which) {
            case 13:
                // Enter
                if (system.menuActive) {
                    uiController.performMenuAction();
                    e.preventDefault();
                }
                break;
            case 37:
                // Left Arrow
                core.view.switchSlideshow(true);
                break;
            case 67:
                // C
                autoplaySlideShow();
                break;
            case 86:
                // V
                contentController.toggleZoom();
                break;
            case 66:
                // B
                core.view.toggleVideoSound();
                break;
            case 78:
                // N
                contentController.accessLink();
                break;
            case 77:
                // M
                core.view.filterCurrentPanel();
                break;
            case 32:
                // Space
                if (core.view.slideshow.position == (core.view.slideshow.length - 1) && (core.view.slideshow.active || core.view.slideshow.highlightingActive) && !core.view.album.active) {
                    extendPage(true);
                    e.preventDefault();
                    break;
                }
            case 39:
                // Right Arrow and Space
                core.view.switchSlideshow();
                if (core.view.slideshow.highlightingActive) e.preventDefault();
                break;
            case 38:
                // Up Arrow
                e.preventDefault();
                if (core.view.slideshow.active) {
                    core.view.inspectSlideshow();
                } else {
                    onVerticalInput(false);
                }
                break;
            case 40:
                // Down Arrow
                onVerticalInput(true);
                e.preventDefault();
                break;
            case 27: // Command
            case 17: // Ctrl (And Alt Gr)
            case 225:
            case 226: // <>|
                e.preventDefault();
                if (core.view.slideshow.active) {
                    core.view.quitSlideshow();
                } else if (!core.view.mode.special && !core.view.mode.reel && core.view.slideshow.highlightingActive) {
                    core.view.openSlideshow(core.view.activePanel.domElement);
                }
                break;
            default:
                break;
        }

    });

    $(document).keyup(function (e) {
        /*
         if (core.view.slideshow.active) {
         if (e.which == 37) { $('#arrow-indicator-left').removeClass('active'); }
         if (e.which == 39) { $('#arrow-indicator-right').removeClass('active'); }
         if (e.which == 40) { $('#arrow-indicator-down').removeClass('active'); }
         if (e.which == 38) { $('#arrow-indicator-up').removeClass('active'); }
         };
         */
    });

    preloadImages(['./images/x.png', './images/xl.png', './images/p.png', './images/pl.png']);

    // When the user returns to the tab, the input field is immediately selected
    window.onfocus = function () {
        if (!core.view.slideshow.active) {
            core.input.focus();
        }
    };

    window.onhashchange = function () {
        systemController.onHashChange();
    };

    window.onresize = function () {
        core.view.refreshWindow();
    };

    core.view.refreshWindow();

    // Check Localstorage Settings
    try {
        var localSettings = localStorage.getItem('rc.settings');
        var localFavorites = localStorage.getItem('rc.favorites');
        var localCustom = localStorage.getItem('rc.custom');
        var localBackup = localStorage.getItem('rc.backup');
        var localFilter = localStorage.getItem('rc.filter');
    } catch (err) {
        system.cantSaveOptions = true;
    }

    if (localSettings) {
        settings = JSON.parse(localSettings);
        evaluateSettings();
    }

    if (localFilter) {
        core.view.filter = JSON.parse(atob(localFilter));
    }

    if (localCustom) {
        customMode.rawUrl = JSON.parse(atob(LZString.decompress(localCustom))).reverse();
        customController.reloadData();
    }

    if (localBackup) customMode.backup = JSON.parse(atob(LZString.decompress(localBackup)));

    systemController.initHash();

    if (localFavorites) {
        var loaded_favorites = JSON.parse(localFavorites);

        if (typeof loaded_favorites === "array") {
            outputMessage("Favorites are in an obsolete format");
        } else {
            favorites = loaded_favorites;
        }

        if (system.untouched) {
            executeCommand("");
        }
    }

    // Drag and Drop Initialization
    if (window.File && window.FileList && window.FileReader) {
        var xhr = new XMLHttpRequest();
        if (xhr.upload) {
            $(document).on("dragover", eventCancellor);
            $(document).on("dragenter", eventCancellor);
            $(document).on("drop", onFileDrop);
        }
    }

    // Swipe Gestures Initialization
    document.addEventListener('touchstart', swipeGestureHandler.onTouchStart, false);
    document.addEventListener('touchmove', swipeGestureHandler.onTouchMove, false);
    document.addEventListener('touchend', swipeGestureHandler.onTouchEnd, false);
    document.addEventListener('touchcancel', swipeGestureHandler.onTouchCancel, false);
});

/* ----- Mobile Swipe Gestures ----- */


const swipeGestureHandler = {
    vars: {
        xDown: null,
        yDown: null,
        properSwipe: false
    },

    reset: function () {
        swipeGestureHandler.vars.xDown = null;
        swipeGestureHandler.vars.yDown = null;
    },

    endSwipe: function() {
        swipeGestureHandler.vars.properSwipe = false;
    },

    onTouchStart: function (evt) {
        swipeGestureHandler.vars.xDown = evt.touches[0].clientX;
        swipeGestureHandler.vars.yDown = evt.touches[0].clientY;
    },

    onTouchMove: function (evt) {
        if (!swipeGestureHandler.vars.xDown || !swipeGestureHandler.vars.yDown) return;

        var xUp = evt.touches[0].clientX;
        var yUp = evt.touches[0].clientY;

        var xDiff = swipeGestureHandler.vars.xDown - xUp;
        var yDiff = swipeGestureHandler.vars.yDown - yUp;

        var properSwipe = true;
        if (Math.abs(xDiff) > Math.abs(yDiff) && Math.abs(xDiff) > 10) {/*most significant*/
            if (xDiff > 0) {
                // Left swipe
                core.view.switchSlideshow(true);
            } else {
                // Right swipe
                if (core.view.slideshow.position == (core.view.slideshow.length - 1) && (core.view.slideshow.active || core.view.slideshow.highlightingActive) && !core.view.album.active && !system.customMode) {
                    extendPage(true);
                }
                else {
                    core.view.switchSlideshow();
                }
            }
        } else if (Math.abs(yDiff) > 50) {
            if (core.view.slideshow.active)
            {
                if (yDiff > 0) {
                    // Up swipe
                    core.view.inspectSlideshow();
                } else {
                    // Down swipe
                    onVerticalInput(true);
                }
            }
            else if (core.view.mode.reel && yDiff < 0) {
                // Down swipe in reel
                onVerticalInput(true);
            }
            else {
                properSwipe = false;
            }
        }
        else {
            properSwipe = false;
        }

        if (properSwipe)
        {
            swipeGestureHandler.vars.properSwipe = true;
            swipeGestureHandler.reset();
        }
    },

    onTouchEnd: function (evt) {
        if (swipeGestureHandler.vars.properSwipe)
            evt.preventDefault();
        swipeGestureHandler.reset();
        swipeGestureHandler.endSwipe();
    },

    onTouchCancel: function (evt) {
        swipeGestureHandler.reset();
        swipeGestureHandler.endSwipe();
    }
};

/* ----- Drag and Drop ----- */

function eventCancellor(e) {
    if (e.preventDefault) e.preventDefault();
    return false;
}

function onFileDrop(e) {
    e = e || window.event;
    if (e.preventDefault) {
        e.preventDefault();
    }

    if (!system.customMode)
    {
        outputMessage("You can only insert images in Custom Mode");
        return false;
    }

    const files = e.originalEvent.dataTransfer.files;

    for (var i = 0; i < files.length; ++i)
    {
        const src = createObjectURL(files[i]);
        onCustomModeFileAdd(src, files[i].type);
    }
    
    return false;
}

function createObjectURL(object) {
    return (window.URL) ? window.URL.createObjectURL(object) : window.webkitURL.createObjectURL(object);
}

function revokeObjectURL(url) {
    return (window.URL) ? window.URL.revokeObjectURL(url) : window.webkitURL.revokeObjectURL(url);
}
