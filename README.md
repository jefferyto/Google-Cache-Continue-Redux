# Google Cache Continue Redux #

Add links to Google cache results to allow continuing using the cache, keeping search terms highlighted 

See [userscripts.org](http://userscripts.org/scripts/show/30878) for more details

## Redux changelog: ##

### v0.5 (?) ###

- Works with cache pages under HTTPS / SSL
- Options can be saved in Chrome, if the cache page comes from webcache.googleusercontent.com
  Also, options cannot be shared across HTTP and HTTPS cache pages
- Cache link text change takes effect immediately, instead of after page reload
- Added an About panel
- Added a "Check for updates" function, inside the About panel
- Auto-check for updates every 4 weeks
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

