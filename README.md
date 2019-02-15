Grid
======

A simple and clean image crawler. Enter a subreddit and surf. Can be used with just a keyboard.

======

**Usage**

Enter a Subreddit, Multireddit or Tumblr URL, press enter and browse through the gathered images. Append a number to a subreddit for filters:

- 1 - Top of all Time
- 2 - New
- 3 - Top of the Year
- 4 - Top of the Month

Press *Down Arrow* when looking at an Image to save it to `/custom` mode.

Use `help` for more info and `options` to change your settings.

======

**Features and Options**

- Supports subreddits, subreddit sort filters (`cats 1`), multireddits, manual chaining of subreddits (`cats + wallpapers`), tumblr URLs and FC URLs.
- Renders images, .webm, .mp4, Gfys, Imgur Gifvs and Deviantart URLs. Allows access to Imgur albums.
- Supports next page loading in all modes.
- Allows to store any Image or Video to `/custom` mode by pressing *Down Arrow* when viewing it.
- `/custom` Mode can be accessed with that command, browsed through, shuffled, output as a JSON Array, output and later reloaded using a Base64 save or entirely downloaded. Commands explained on access.
- Local images and videos can be dragged and dropped into `/custom` mode and viewed there.
- Allows to randomly browse through subreddit-sourced images with `/reel`. NSFW/SFW depends on your `options`.
- Automatically recommends related subreddits.
- Optional Nightmode with dark visuals.
- Optionally fetches lower resolution images from Imgur for faster load times.
- Optionally ignores HTML5 video for better performance.
- Saves preferred subreddits and displays them as favorites when entering ` ` (nothing).
- Attempts to save favorites, settings and Custom Mode content to HTML5 Localstorage.
