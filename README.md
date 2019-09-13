# Google Cache Continue Redux #

Add links to Google cache results to allow continuing using the cache, keeping search terms highlighted 

## UNMAINTAINED ##

I have decided against actively supporting Google products or services. I suggest using (and supporting) the [Wayback Machine] instead of the Google cache.

[Wayback Machine]: https://web.archive.org/

## Redux changelog: ##

### v0.6.1 (2013-01-07) ###

- Fixed shortcut key for Opera (Mac)

### v0.6 (2013-01-04) ###

- Added a shortcut key to toggle between cache links and link redirection
- Fixed original (uncached) link not added to Google error page
- Fixed option syncing in Chrome
- Fixed update system

### v0.5 (2011-05-25) ###

- Works with cache pages under HTTPS / SSL
- Added an option to always use HTTPS
- Options can be saved in Chrome, if the cache page comes from webcache.googleusercontent.com
- Added a function to sync options between HTTP and HTTPS cache pages in Chrome
  Must be manually triggered since it requires an iframe page load
- Cache link text change takes effect immediately, instead of after page reload
- Added default styles to our elements so that they're more resistant to in-page styles
- Added an About panel
- Added a "Check for updates" function, inside the About panel (fails silently in Chrome due to browser restrictions)
- Auto-check for updates every 60 days
- Another refactoring

### v0.4 (2010-02-10) ###

- Google Chrome compatibility (thanks Norman Rasmussen)
- Added option to redirect page links to the Google cache, instead of adding cache links
- Added options for cache link text and background colour
- Added options panel (cache link options not shown in Google Chrome since options cannot be saved)
- Should work for all language versions of Google (noCacheTitle, textOnlyLinkText and fullLinkText options no longer necessary)
- Refactored code

### v0.3 (2008-11-27) ###

- Fixed duplicate "http://" in uncached link when search URL includes the protocol

### v0.2 (2008-08-19) ###

- Externalized strings in about:config prefs

### v0.1 (2008-07-31) ###

- Initial version

