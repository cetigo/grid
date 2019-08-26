

/*
 Parser, responsible for understanding URLs and commands.
 Holds variables regarding the page currently viewed.
 */

class Parser {
    constructor() {
        this.session = {
            command: [],
            rawCommand: '',
            JSON: '',
            loadType: '',
            url: '',
            lastUrl: '',
            parentLocation: ''
        };

        this.meta = {
            subreddit: '',
            sort: '',
            mode: '',
            page: 0,
            pageLoadPossible: false,
            pageLoadUnderway: false,
            isNSFW: false
        };

        this.additionalData = {};

        this.misc = {
            xpostMentions: [],
            selfpostURLs: {}
        };

        this.workers = {};
    }

    reset() {

        this.session.command.length = 0;
        this.session.rawCommand = '';
        this.session.JSON = '';
        this.session.loadType = '';
        this.session.url = '';
        this.session.lastUrl = '';
        this.session.parentLocation = '';

        this.meta.subreddit = '';
        this.meta.sort = '';
        this.meta.mode = '';
        this.meta.page = 0;
        this.meta.pageLoadPossible = false;
        this.meta.pageLoadUnderway = false;
        this.meta.isNSFW = false;

        this.additionalData = {};

        this.misc.xpostMentions.length = 0;
        this.misc.selfpostURLs = {};

    }

    parse(input, parentLocation) {

        this.reset();

        this.session.command = input.split(' ');
        this.session.command[0] = this.session.command[0].toLowerCase();
        this.session.rawCommand = input;
        if (parentLocation) this.session.parentLocation = parentLocation;

        if (commands[this.session.command[0]]) {
            commands[this.session.command[0]].method(this.session.command);
        }
        else {
            systemController.reset();

            this.session.loadType = this.getLoadType(this.session.rawCommand);
            this.loadAdapter(this.session.command, this.session.loadType);
        }
        
        systemController.setHash(this.session.rawCommand);
    }

    getLoadType(rawCommand) {
        let loadTypes = [];

        $.each(loadHandler, (i, obj) => {
            if (!obj.filter) return true;
            if (~rawCommand.indexOf(obj.filter)) loadTypes.push(obj.name);
        });

        return loadTypes[0] || 'reddit';
    }

    loadAdapter(inputArray, loadType) {

        const loadVariables = loadHandler[loadType].method(inputArray);
        this.session.url = loadVariables.url;
        this.session.rawCommand = loadVariables.rawinput;
        document.title = loadVariables.docTitle;

        if (loadVariables.additionalData.tumblr) this.additionalData.tumblr = loadVariables.additionalData.tumblr;

        core.input.setValue(this.session.rawCommand);

        core.view.resetView({
            loaderHtml: loadVariables.loadString
        });

        this.session.JSON = $.ajax({
            method: "get",
            url: this.session.url,
            dataType: loadVariables.dataType,

            success: () => {
                const jsonParseAnswer = this.jsonParseAdapter(this.session.JSON.responseJSON, loadVariables.additionalData, loadType);

                if (!jsonParseAnswer) return false;

                core.view.initialize();
                core.view.appendCards(loadVariables.panels);
                if (loadVariables.postRenderCards) {
                    loadHandler[loadType].getPostRenderCards(function (answerCards) {
                        core.view.appendCards(answerCards);
                    });
                }

                //if (loadVariables.favorite) favoriteHandler(loadVariables.favorite.name, core.view.panels[0].imageUrl, loadVariables.favorite.type);
                favoriteHandler(this.session.rawCommand, core.view.panels[0].imageUrl, 1)

            },

            error: (x, status, error) => {
                $('#results').html(' ').append('<div id="loader">There was an error.<br><br><pre></pre></div>');
                if (error) {
                    $('#loader pre').text(error);
                } else {
                    $('#loader pre').text('Unknown')
                }
                core.input.clear();
            }

        });

    }

    jsonParseAdapter(inputJSON, additionalData, parseType) {
        const parsedJSON = jsonParseHandler[parseType](inputJSON, additionalData);
        let throwError = false;
        let errorHtml;

        if (!parsedJSON.length) {
            throwError = true;
            errorHtml = '<div id="loader">There was an error.<br><br><pre>Empty Response</pre></div>';
        }
        /*
        else if (!settings.showNSFW && this.meta.isNSFW) {
            throwError = true;
            errorHtml = '<div id="loader">NSFW Content is blocked via <pre>options</pre></div>';
        }
        */

        if (throwError) {
            core.view.mode.special = true;
            helpController.hide();
            $('#results').html(errorHtml).append();
            core.input.focus();
            loadController.hide();
            return false;
        }

        for (let i = 0, len = parsedJSON.length; i < len; i++) {
            detectUrl(parsedJSON[i].url, parsedJSON[i].metadata);
        }

        if (core.view.loading.fetchLength == 0) loadController.updateProgress(100, 'fetch');
        return true;
    }

    /**
     * "Raw" - stripped down versions of the functions above
     * These don't interfere with any other variables and are
     * completely encapsulated.
     */
    rawParse(input) {
        const commandArray = input.split(' ');
        commandArray[0] = commandArray[0].toLowerCase();
        return this.rawLoadAdapter(commandArray, this.getLoadType(input));
    }

    rawLoadAdapter(inputArray, loadType) {
        const loadVariables = loadHandler[loadType].method(inputArray);
        const returnPromise = $.Deferred();

        $.ajax({
            method: "get",
            url: loadVariables.url,
            dataType: loadVariables.dataType
        })
            .done(data => {
                returnPromise.resolve(this.rawJsonParseAdapter(data, loadVariables.additionalData, loadType));
            })
            .fail(() => {
                returnPromise.reject();
            });

        return returnPromise;
    }

    rawJsonParseAdapter(inputJSON, additionalData, parseType) {
        const parsedJSON = jsonParseHandler[parseType](inputJSON, additionalData);
        if (!parsedJSON.length) return false;

        let returnArray = [];
        for (let i = 0, len = parsedJSON.length; i < len; i++) {
            const parsedUrl = detectUrl(parsedJSON[i].url, parsedJSON[i].metadata, false, true);
            if (parsedUrl !== 'error') returnArray.push(parsedUrl);
        }

        return returnArray;
    }

    getFetchPromise(fetchType, inputData) {

        const fetchPromise = $.Deferred();
        const fetchHandler = fetchHandlers[fetchType];

        if (!fetchHandler) return false;

        var fetchVariables = fetchHandler.getInitialVariables(inputData);

        $.ajax({
            url: fetchVariables.url,
            dataType: fetchVariables.dataType,
            async: true,
            beforeSend: function (request) {
                if (fetchVariables.setRequestHeader) request.setRequestHeader("Authorization", fetchVariables.requestHeader);
            },
            success: function (data) {
                fetchPromise.resolve(fetchHandler.getResolveFetchObject(data));
            },
            error: function (err) {
                fetchPromise.reject();
            }
        });

        return fetchPromise;

    }

    /**
     * Creates and activates a parser-worker Webworker to fetch and parse data from a given input.
     * The worker has his own runtime and the only paths of communication are its postMessage method
     * and the onmessage event. data is expected to be formatted like this:
     *
     * {
     *      input: {String} The user-inputted string, untouched,
     *      [misc]: {Object} core.parser.misc,
     *      [session]: {Object} core.parser.session,
     *      [meta]: {Object} core.parser.meta
     * }
     *
     * misc, session and meta are all optional and could be used to transfer a certain state of core.parser (unused)
     * The object that is passed to the returned Promises resolve function is formatted like this:
     *
     * {
     *      data: {Array} An array of objects that are formatted to be passed to the constructor of Panel,
     *      misc: {Object} core.parser.misc,
     *      session: {Object} core.parser.session,
     *      meta: {Object} core.parser.meta
     * }
     *
     * If it makes sense in context, the returned misc, session and meta objects should be assigned to their respective
     * places in core.parser.
     */
    // TODO: Resolve the TODOs in parser-worker
    workerInvoker(data) {
        return new Promise((resolve) => {
            /**
             * parseWorker is intended to make and parse AJAX calls in the background,
             * without interfering with the UI. Better performance because of multithreading.
             * @type {Worker}
             */
            const parseWorker = new Worker('src/parser-worker.js');
            parseWorker.onmessage = (e) => {
                this.updateWorkerStatus(e.data, data.input);
                if (e.data.finished) {
                    resolve(e.data);
                } else {

                }
            };
            parseWorker.postMessage(data);
        });
    }

    updateWorkerStatus(data, id) {
        this.workers[`pww-${id}`] = this.workers[`pww-${id}`] || { id: Math.random().toString(36).substring(2, 10) };
        this.workers[`pww-${id}`].status = data.status;
        if (data.code) this.workers[`pww-${id}`].code = data.code;
        if (data.type) this.workers[`pww-${id}`].type = data.type;
        this.workers[`pww-${id}`].finished = data.finished;

        this.printWorkerMessage(`pww-${id}`);

    }
    printWorkerMessage(workerName) {
        const worker = this.workers[workerName];
        const messageHtml = `<b>${workerName}</b> <span>status</span> ${worker.status} <span>type</span> ${worker.type} ${worker.finished ? 'finished' : ''} ${worker.code !== 200 ? 'failed' : ''}`;

        const associatedMessage = $(`#debugmsgcnt #debugmsg-${worker.id}`);
        if (associatedMessage.length) {
            associatedMessage
                .html(messageHtml);
            if (worker.finished || worker.code !== 200) {
                setTimeout(() => {
                    associatedMessage.remove();
                }, 2000);
            }
        } else {
            const newMessage = $('<div/>', {
                class: 'debugmsg',
                id: 'debugmsg-' + worker.id
            })
                .html(messageHtml)
                .appendTo('#debugmsgcnt')
        }
    }
}


/* ----- Rendering and Data Translation ----- */

// LoadHandlers take the input and prepare several variables for loading
const loadHandler = {

    reddit: {

        filter: false,
        name: "reddit",
        description: "Shows all images on the front page of the specified subreddit. Supports loading subsequent pages, and filters that can be appended to the Subreddit, separated by a space. Usage example: 'earthporn 4'",

        method: function(inputArray) {
            core.parser.meta.subreddit = inputArray[0];
            var sortFilter = inputArray[1] || 0;

            switch (Number(sortFilter)) {
                case 1:
                    core.parser.meta.sort = "/top.json?sort=top&t=all";
                    core.parser.meta.mode = "top - ever";
                    break;
                case 2:
                    core.parser.meta.sort = "/top.json?sort=top&t=year";
                    core.parser.meta.mode = "top - year";
                    break;
                case 3:
                    core.parser.meta.sort = "/top.json?sort=top&t=month";
                    core.parser.meta.mode = "top - month";
                    break;
                case 4:
                    core.parser.meta.sort = "/top.json?sort=top&t=week";
                    core.parser.meta.mode = "top - week";
                    break;
                default:
                    core.parser.meta.sort = "/hot.json?bagool=1";
                    core.parser.meta.mode = "hot";
                    break;
            }

            core.parser.meta.subreddit = core.parser.meta.subreddit.replace("/r/", "");
            var rawInput = core.parser.session.rawCommand.replace("/r/", "");

            var docTitle = core.parser.meta.subreddit + " - Grid";
            var redditUrl = "https://www.reddit.com/r/" + core.parser.meta.subreddit + core.parser.meta.sort;

            // Check if it's a multireddit
            if (~core.parser.meta.subreddit.indexOf("/m/")) {
                core.parser.meta.subreddit = core.parser.meta.subreddit.replace("/user/", "").replace("/u/", "");
                redditUrl = "https://www.reddit.com/user/" + core.parser.meta.subreddit + core.parser.meta.sort;
                docTitle = core.parser.meta.subreddit + " - Grid";
            }

            var endPanels = [{
                onclick: 'extendPage()',
                html: 'Continue<br>Page ' + (core.parser.meta.page + 2) + '<br><span style="color: ' + getRandomColor() + ';" class="prefixspan">/r/</span>' + core.parser.meta.subreddit
            }];

            if (core.parser.meta.mode != 'top - ever') {
                endPanels.push({
                    onclick: "fetchJson('" + core.parser.meta.subreddit + " 1')",
                    html: 'Switch to <br><span style="color: ' + getRandomColor() + ';" class="prefixspan">/r/</span>' + core.parser.meta.subreddit + '<br>top - ever'
                });
            } else {
                endPanels.push({
                    onclick: "fetchJson('" + core.parser.meta.subreddit + " 4')",
                    html: 'Switch to <br><span style="color: ' + getRandomColor() + ';" class="prefixspan">/r/</span>' + core.parser.meta.subreddit + '<br>top - week'
                });
            }

            return {
                url: redditUrl,
                rawinput: rawInput,
                docTitle: docTitle,
                loadString: '<div id="loader">Loading <span style="color: ' + getRandomColor() + '" class="prefixspan">/r/</span>' + core.parser.meta.subreddit + '<br><br>' + core.parser.meta.mode + '</div>',
                additionalData: {},
                favorite: {
                    name: core.parser.meta.subreddit,
                    type: 1
                },
                panels: endPanels,
                postRenderCards: true,
                dataType: "json"
            }
        },

        getPostRenderCards: function(callback) {
            var additionalCards = [];

            // Suggest Mentioned Subreddits - "Mentioned here"
            for (var i = core.parser.misc.xpostMentions.length - 1; i >= 0; i--) {

                additionalCards.push({
                    onclick: "fetchJson('" + core.parser.misc.xpostMentions[i] + "')",
                    html: 'Mentioned here<br><span style="color: ' + getRandomColor() + ';" class="prefixspan">/r/</span>' + core.parser.misc.xpostMentions[i]
                });

            }

            // Suggest Popular Subreddits - "Recommended"
            if (settings.showNSFW && core.parser.meta.isNSFW) {
                var recommendationArray = recommendationsNsfw;
            } else {
                var recommendationArray = recommendationsSfw;
            }

            for (var i = getRandomInt(1, 2); i >= 0; i--) {
                var randomRecommendation = recommendationArray[Math.floor(Math.random() * recommendationArray.length)];

                additionalCards.push({
                    onclick: "fetchJson('" + randomRecommendation + "')",
                    html: 'Recommended<br><span style="color: ' + getRandomColor() + ';" class="prefixspan">/r/</span>' + randomRecommendation
                });
            }

            // Suggest Related Subreddits - "Also try"
            var relatedRedditJSON = $.getJSON("https://www.reddit.com/subreddits/search.json", {
                q: core.parser.meta.subreddit,
                limit: 4
            }, function() {
                var relatedRedditNames = [];
                for (var i = relatedRedditJSON.responseJSON.data.children.length - 1; i >= 0; i--) {
                    if (relatedRedditJSON.responseJSON.data.children[i].data.display_name.toLowerCase() != core.parser.meta.subreddit.toLowerCase()) {
                        relatedRedditNames.push(relatedRedditJSON.responseJSON.data.children[i].data.display_name);
                    }
                }
                for (var i = relatedRedditNames.length - 1; i >= 0; i--) {
                    additionalCards.push({
                        onclick: "fetchJson('" + relatedRedditNames[i] + "')",
                        html: 'Also try<br><span style="color: ' + getRandomColor() + ';" class="prefixspan">/r/</span>' + relatedRedditNames[i]
                    });

                }

                callback(additionalCards);
            });
        }

    },

    voat: {
        filter: "voat/",
        name: "voat",
        description: "Shows the images on the frontpage of a given voat subverse. Usage example: 'voat/books'",
        method: function(inputArray) {

            var voatSubverse = inputArray[0].split('/')[1];

            return {
                url: "https://cors.io?https://voat.co/api/subversefrontpage?subverse=" + voatSubverse,
                rawinput: "voat/" + voatSubverse,
                docTitle: "/v/" + voatSubverse + " - Grid",
                loadString: '<div id="loader">Loading <span style="color: ' + getRandomColor() + '" class="prefixspan">/v/</span>' + voatSubverse + '</div>',
                dataType: 'json',
                additionalData: {}
            }

        }
    },

    fullchanCatalog: {

        filter: "8chan/",
        name: "fullchanCatalog",
        description: "Shows all threads with their main image and title. Allows accessing the viewed thread by pressing N in the slideshow. Usage example: '8chan/b/'",

        method: function(inputArray) {

            var chanBoard = inputArray[0].split('/')[1];

            return {
                url: "https://cors-anywhere.herokuapp.com/https://8ch.net/" + chanBoard + "/catalog.json",
                rawinput: "8chan/" + chanBoard + "/",
                docTitle: "/" + chanBoard + "/ Catalog - Grid",
                loadString: '<div id="loader">Loading <span style="color: ' + getRandomColor() + '" class="prefixspan">/' + chanBoard + '/</span> Catalog</div>',
                additionalData: {
                    chanBoard: chanBoard
                },
                dataType: "json"
            }

        }

    },

    fullchan: {

        filter: "8ch.net",
        name: "fullchan",
        description: "Shows all images posted in a thread. Usage example: Simply enter the full URL of a thread.",

        method: function(inputArray) {

            var chan = {
                rawUrl: inputArray[0]
            }

            if (~chan.rawUrl.indexOf("http")) {
                // Raw URL
                chan.urlObject = new URL(chan.rawUrl);
                chan.thread = chan.urlObject.pathname.slice(0, -5);
                chan.board = chan.urlObject.pathname.split("/")[1];
            } else {
                // Stylized URL
                chan.pathArray = chan.rawUrl.split("/");
                chan.thread = chan.rawUrl.replace('8ch.net', '');
                chan.board = chan.pathArray[1];
            }

            return {
                url: "https://cors-anywhere.herokuapp.com/https://8ch.net/" + chan.thread + ".json",
                rawinput: "8ch.net" + chan.thread,
                docTitle: "/" + chan.board + "/ Thread - Grid",
                loadString: '<div id="loader">Loading <span style="color: ' + getRandomColor() + '" class="prefixspan">/' + chan.board + '/</span> Thread</div>',
                additionalData: {
                    chanBoard: chan.board
                },
                dataType: "json"
            }
        }

    },

    halfchanCatalog: {

        filter: "4chan/",
        name: "halfchanCatalog",
        description: "Shows all threads with their main image and title. Allows accessing the viewed thread by pressing N in the slideshow. Usage example: '4chan/b/'",

        method: function(inputArray) {

            var chanBoard = inputArray[0].split('/')[1];

            return {
                url: "https://cors-anywhere.herokuapp.com/https://a.4cdn.org/" + chanBoard + "/catalog.json",
                rawinput: "4chan/" + chanBoard + "/",
                docTitle: "4/" + chanBoard + "/ Catalog - Grid",
                loadString: '<div id="loader">Loading <span style="color: ' + getRandomColor() + '" class="prefixspan">4/' + chanBoard + '/</span> Catalog</div>',
                additionalData: {
                    chanBoard: chanBoard
                },
                dataType: "json"
            }

        }

    },

    halfchan: {

        filter: "4chan.org",
        name: "halfchan",
        description: "Shows all images posted in a thread. Usage example: Simply enter the full URL of a thread.",

        method: function(inputArray) {

            var chan = {
                rawUrl: inputArray[0]
            }

            if (~chan.rawUrl.indexOf("http")) {
                // Raw URL
                chan.pathArray = new URL(chan.rawUrl).pathname.split("/");
                chan.board = chan.pathArray[1];
                chan.thread = chan.pathArray[3];
            } else {
                // Stylized URL
                chan.pathArray = chan.rawUrl.split("/");
                chan.board = chan.pathArray[1];
                chan.thread = chan.pathArray[2];
            }

            return {
                url: "https://cors-anywhere.herokuapp.com/https://a.4cdn.org/" + chan.board + "/thread/" + chan.thread + ".json",
                rawinput: "4chan.org/" + chan.board + "/" + chan.thread + "/",
                docTitle: "4/" + chan.board + "/ Thread - Grid",
                loadString: '<div id="loader">Loading <span style="color: ' + getRandomColor() + '" class="prefixspan">4/' + chan.board + '/</span> Thread</div>',
                additionalData: {
                    chanBoard: chan.board
                },
                dataType: "json"
            }
        }

    },

    tumblr: {
        filter: ".tumblr",
        name: "tumblr",
        description: "Shows all 'photo posts' on the first page of the specified blog. Supports loading subsequent pages. Usage example: Simply enter the full URLs, but it can be reduced to 'user.tumblr'",

        method: function(inputArray) {
            var tumblrUrl = inputArray[0];

            if (~tumblrUrl.indexOf(".com")) {
                // Extract the Tumblr username from the URL
                var tumblrBlog = new URL(tumblrUrl).hostname.split(".")[0];
            } else {
                // Or just clean up the input manually
                var tumblrBlog = tumblrUrl.replace(".tumblr", "");
            }

            if (~tumblrBlog.indexOf(".")) {
                var instTumblrSplit = tumblrBlog.split(".");
                tumblrBlog = instTumblrSplit[instTumblrSplit.length - 1];
            };

            return {
                url: 'https://api.tumblr.com/v2/blog/' + tumblrBlog + '.tumblr.com/posts/photo?api_key=Y0lYJX4ung4TrdRzSDBGNzfUZInCBwigE4IXSq0VakTGddp9vs',
                rawinput: tumblrBlog + '.tumblr',
                docTitle: tumblrBlog + '.tumblr - Grid',
                loadString: '<div id="loader">Loading ' + tumblrBlog + '<span style="color: ' + getRandomColor() + '" class="prefixspan">.tumblr</span></div>',
                additionalData: {
                    tumblr: tumblrBlog
                },
                favorite: {
                    name: tumblrBlog + '.tumblr',
                    type: 2
                },
                panels: [{
                    onclick: 'extendPage()',
                    html: 'Continue<br>Page ' + (core.parser.meta.page + 2) + '<br>' + tumblrBlog + '<span style="color: ' + getRandomColor() + ';" class="prefixspan">.tumblr</span>'
                }],
                dataType: "jsonp"
            }
        }
    }

};

// JSONParsers take the received JSON and translate the data
const jsonParseHandler = {

    voat: function(inputJSON, additionalData) {
        var parsedReturn = [];

        $.each(inputJSON, function(i, obj) {

            if (!obj.MessageContent) return true;

            parsedReturn.push({
                url: obj.MessageContent,
                metadata: {
                    title: obj.Linkdescription,
                    author: obj.name,
                    thumbUrl: 'https://cdn.voat.co/thumbs/' + obj.thumbnail,
                    age: timeSinceDate(new Date(obj.Date))
                }
            });

        });

        return parsedReturn;
    },

    fullchanCatalog: function(inputJSON, additionalData) {
        var parsedReturn = [];

        $.each(inputJSON, function(i, obj) {

            // We only read the first five pages here
            if (i === 5) return false;

            $.each(obj.threads, function(j, thread) {

                if (thread.tim && thread.tim.length <= 16) {
                    // Legacy image
                    var urlPrefix = "https://8ch.net/" + additionalData.chanBoard + "/src/";
                    var thumbPrefix = "https://media2.8ch.net/" + additionalData.chanBoard + "/thumb/";
                } else {
                    // New CDN image
                    var urlPrefix = "https://media.8ch.net/file_store/";
                    var thumbPrefix = "https://media.8ch.net/file_store/thumb/";
                }

                parsedReturn.push({
                    url: urlPrefix + thread.tim + thread.ext,
                    metadata: {
                        title: thread.sub || "(no subject)",
                        author: thread.name,
                        access: "8ch.net/" + additionalData.chanBoard + "/res/" + thread.no,
                        thumbUrl: thumbPrefix + thread.tim + ".jpg", // pngs are still parsed, this way we don't have to catch webm/mp4
                        age: timeSince(thread.time),
                        extended: {
                            replies: thread.replies,
                            images: Math.round(thread.omitted_images * 1.05), // To roughly make up for the non-omitted part
                            link: "/" + additionalData.chanBoard + "/" + thread.no
                        }
                    }
                });

            });

        });

        return parsedReturn;

    },

    fullchan: function(inputJSON, additionalData) {
        var parsedReturn = [];

        for (var i = 0; i <= (inputJSON.posts.length - 1); i++) {
            if (inputJSON.posts[i].tim) {

                if (inputJSON.posts[i].tim.length <= 16) {
                    // Legacy image
                    var urlPrefix = "https://8ch.net/" + additionalData.chanBoard + "/src/";
                    var thumbPrefix = "https://media2.8ch.net/" + additionalData.chanBoard + "/thumb/";
                } else {
                    // New CDN image
                    var urlPrefix = "https://media.8ch.net/file_store/";
                    var thumbPrefix = "https://media.8ch.net/file_store/thumb/";
                }

                parsedReturn.push({
                    url: urlPrefix + inputJSON.posts[i].tim + inputJSON.posts[i].ext,
                    metadata: {
                        title: inputJSON.posts[i].filename,
                        author: inputJSON.posts[i].name,
                        thumbUrl: thumbPrefix + inputJSON.posts[i].tim + ".jpg",
                        age: timeSince(inputJSON.posts[i].time)
                    }
                });

                if (inputJSON.posts[i].extra_files) {

                    for (var j = 0, len = inputJSON.posts[i].extra_files.length; j < len; j++) {

                        parsedReturn.push({
                            url: urlPrefix + inputJSON.posts[i].extra_files[j].tim + inputJSON.posts[i].extra_files[j].ext,
                            metadata: {
                                title: inputJSON.posts[i].extra_files[j].filename,
                                author: inputJSON.posts[i].name,
                                thumbUrl: thumbPrefix + inputJSON.posts[i].extra_files[j].tim + ".jpg",
                                age: timeSince(inputJSON.posts[i].time)
                            }
                        });

                    }

                };
            }
        };

        return parsedReturn;
    },

    halfchanCatalog: function(inputJSON, additionalData) {
        var parsedReturn = [];

        $.each(inputJSON, function(i, obj) {

            // We only read the first five pages here
            if (i === 5) return false;

            $.each(obj.threads, function(j, thread) {

                parsedReturn.push({
                    url: "https://i.4cdn.org/" + additionalData.chanBoard + "/" + thread.tim + thread.ext,
                    metadata: {
                        title: thread.sub || "(no subject)",
                        author: thread.name,
                        access: "4chan.org/" + additionalData.chanBoard + "/" + thread.no,
                        thumbUrl: "https://i.4cdn.org/" + additionalData.chanBoard + "/" + thread.tim + "s.jpg",
                        age: timeSince(thread.time),
                        extended: {
                            replies: thread.replies,
                            images: Math.round(thread.omitted_images * 1.05), // To roughly make up for the non-omitted part
                            link: "/" + additionalData.chanBoard + "/" + thread.no
                        }
                    }
                });

            });

        });

        return parsedReturn;

    },

    halfchan: function(inputJSON, additionalData) {
        var parsedReturn = [];

        for (var i = 0; i <= (inputJSON.posts.length - 1); i++) {
            if (inputJSON.posts[i].tim) {

                parsedReturn.push({
                    url: "https://i.4cdn.org/" + additionalData.chanBoard + "/" + inputJSON.posts[i].tim + inputJSON.posts[i].ext,
                    metadata: {
                        title: inputJSON.posts[i].filename,
                        author: inputJSON.posts[i].name,
                        thumbUrl: "https://i.4cdn.org/" + additionalData.chanBoard + "/" + inputJSON.posts[i].tim + "s.jpg",
                        age: timeSince(inputJSON.posts[i].time)
                    }
                });

                if (inputJSON.posts[i].extra_files) {

                    for (var j = 0, len = inputJSON.posts[i].extra_files.length; j < len; j++) {

                        parsedReturn.push({
                            url: "https://i.4cdn.org/" + additionalData.chanBoard + "/" + inputJSON.posts[i].extra_files[j].tim + inputJSON.posts[i].extra_files[j].ext,
                            metadata: {
                                title: inputJSON.posts[i].extra_files[j].filename,
                                author: inputJSON.posts[i].name,
                                thumbUrl: "https://i.4cdn.org/" + additionalData.chanBoard + "/" + inputJSON.posts[i].extra_files[j].tim + "s.jpg",
                                age: timeSince(inputJSON.posts[i].time)
                            }
                        });

                    }

                };
            }
        };

        return parsedReturn;
    },

    tumblr: function(inputJSON, additionalData) {
        var parsedReturn = [];

        core.parser.meta.pageLoadPossible = true;

        for (var i = 0; i <= (inputJSON.response.posts.length - 1); i++) {
            var imageArray = inputJSON.response.posts[i].photos;
            var newTitle = inputJSON.response.posts[i].slug.split('-').join(' ');

            for (var j = 0; j <= imageArray.length - 1; j++) {
                var newImage = imageArray[j].original_size.url;

                parsedReturn.push({
                    url: newImage,
                    metadata: {
                        title: newTitle
                    }
                });
            };
        };

        return parsedReturn;
    },

    reddit: function(inputJSON, additionalData) {
        core.parser.session.lastUrl = inputJSON.data.after;
        var parsedReturn = [];

        for (var i = 0; i <= (inputJSON.data.children.length - 1); i++) {

            var postTitle = inputJSON.data.children[i].data.title;

            if (inputJSON.data.children[i].data.over_18 && !core.parser.meta.isNSFW) core.parser.meta.isNSFW = true;

            // X-Post Scan
            if (~postTitle.indexOf('r/')) {
                var xpostName = postTitle.substr((postTitle.indexOf('r/') + 2), 999);
                xpostName = xpostName.split(' ')[0].split(')')[0].split(']')[0].replace(/\W/g, '');

                if (xpostName != core.parser.meta.subreddit) {
                    core.parser.misc.xpostMentions.push(xpostName);
                };
            }

            // Unused Feature
            /*
            if (inputJSON.data.children[i].data.selftext) {
                var selfTextUrlArray = extractLinksFromText(inputJSON.data.children[i].data.selftext);
                if (selfTextUrlArray.length) {
                    core.parser.misc.selfpostURLs[inputJSON.data.children[i].data.id] = selfTextUrlArray;
                }
            }
            */

            parsedReturn.push({
                url: inputJSON.data.children[i].data.url,
                metadata: {
                    title: postTitle,
                    thumbUrl: inputJSON.data.children[i].data.thumbnail,
                    score: inputJSON.data.children[i].data.score,
                    author: inputJSON.data.children[i].data.author,
                    age: timeSinceDate(inputJSON.data.children[i].data.created_utc + '000')
                }
            });
        };

        core.parser.meta.pageLoadPossible = true;
        return parsedReturn;
    }

};

// FetchHandlers prepare and translate variables for fetching URLs, per panel
const fetchHandlers = {

    deviantart: {

        name: "deviantart",

        getInitialVariables: function(inputOptions) {

            return {
                url: "https://backend.deviantart.com/oembed?format=jsonp&url=" + inputOptions.fetchData + "&callback=?",
                dataType: "jsonp"
            }

        },

        getResolveFetchObject: function(jsonResponse) {

            if (jsonResponse.url) {
                return {
                    imageUrl: jsonResponse.url
                }
            } else {
                return {
                    imageUrl: "__originalFetchData__"
                }
            }

        }

    },

    imguralbum: {

        name: "imguralbum",

        getInitialVariables: function(inputOptions) {

            return {
                url: "https://api.imgur.com/3/album/" + inputOptions.fetchData,
                dataType: "json",
                setRequestHeader: true,
                requestHeader: "Client-ID b103f734097df10"
            }

        },

        getResolveFetchObject: function(jsonResponse) {

            var albumArray = [];

            for (var i = jsonResponse.data.images.length - 1; i >= 0; i--) {
                albumArray.push(jsonResponse.data.images[i].id);
            };

            return {
                imageUrl: "https://i.imgur.com/" + jsonResponse.data.images[0].id + ".jpg",
                albumArray: albumArray
            }

        }

    },

    imgurgifv: {

        name: "imgurgifv",
        getInitialVariables: function(inputOptions) {

            return {
                url: "https://api.imgur.com/3/image/" + inputOptions.fetchData,
                dataType: "json",
                setRequestHeader: true,
                requestHeader: "Client-ID b103f734097df10"
            }

        },

        getResolveFetchObject: function(jsonResponse) {

            var returnObject = {};
            var preferredVideoType = jsonResponse.data.mp4 || jsonResponse.data.webm || undefined;

            if (preferredVideoType) {
                returnObject.videoUrl = {
                    webm: jsonResponse.data.webm,
                    mp4: jsonResponse.data.mp4,
                    poster: 'https://i.imgur.com/' + jsonResponse.data.id + 'l.jpg'
                };
            } else {
                returnObject.imageUrl = jsonResponse.data.link;
            }

            return returnObject;

        }

    },

    gfycat: {

        name: "gfycat",
        getInitialVariables: function(inputOptions) {

            return {
                url: "https://api.gfycat.com/v1/gfycats/" + inputOptions.fetchData,
                dataType: "json"
            }

        },

        getResolveFetchObject: function(jsonResponse) {
            return {
                videoUrl: {
                    webm: jsonResponse.gfyItem.webmUrl,
                    mp4: jsonResponse.gfyItem.mp4Url,
                    poster: "https://thumbs.gfycat.com/" + jsonResponse.gfyItem.gfyName + "-poster.jpg"
                }
            }

        }

    },

}
