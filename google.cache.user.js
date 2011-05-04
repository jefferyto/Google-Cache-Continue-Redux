// Google Cache Continue Redux
// Based on Google Cache Continue by Jonathon Ramsey
// v0.4

// Copyright (C) 2005-2008 by
//   Jonathon Ramsey (jonathon.ramsey@gmail.com)
//   Jeffery To (jeffery.to @gmail.com)

// This file is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published
// by the Free Software Foundation; either version 2, or (at your
// option) any later version.

// This file is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
// General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this software; see the file COPYING. If not, write to
// the Free Software Foundation, Inc., 59 Temple Place - Suite 330,
// Boston, MA 02111-1307, USA.

// (Comment by Jonathon Ramsey:)
// Thanks to Neil Klopfenstein for a fix to deal with the text only
// version of cached pages

// ==UserScript==
// @name           Google Cache Continue Redux
// @namespace      http://www.thingsthemselves.com/greasemonkey/
// @description    Add links to Google cache results to allow continuing using the cache, keeping search terms highlighted
// @include        http://*/search?*q=cache:*
// @include        http://*/search?*q=cache%3A*
// @include        http://*/search?*q=cache%3a*
// @include        https://*/search?*q=cache:*
// @include        https://*/search?*q=cache%3A*
// @include        https://*/search?*q=cache%3a*
// ==/UserScript==

// Redux changelog:

// v0.4 (2010-02-10)
// - Google Chrome compatibility (thanks Norman Rasmussen)
// - Added option to redirect page links to the Google cache, instead of adding cache links
// - Added options for cache link text and background colour
// - Added options panel (cache link options not shown in Google Chrome since options cannot be saved)
// - Should work for all language versions of Google (noCacheTitle, textOnlyLinkText and fullLinkText options no longer necessary)
// - Refactored code

// v0.3 (2008-11-27)
// - Fixed duplicate "http://" in uncached link when search URL includes the protocol

// v0.2 (2008-08-19)
// - Externalized strings in about:config prefs

// v0.1 (2008-07-31)
// - Initial version

(function( document, head, undefined ) {

	/*
	 * start user editable parts
	 */

	// default options
	var defaultOptions = {
		// whether page links should be redirected
		// can be changed in the options panel
		redirectPageLinks: false,

		// the rest of these can be changed in the options panel if the browser supports GM_setValue()

		// link text for cache links
		cacheLinkText: 'cache',

		// background colour for cache links
		cacheLinkBackgroundColor: 'yellow',

		// text colour for cache links
		cacheLinkTextColor: 'red'
	},

	// other strings
	// these can only be changed by editing this script
	strings = {
		// explanation text for uncached link, for when Google does not have a cached version of the page
		// %s will be replaced by a link to the original (uncached) page
		uncached: '<b>Uncached:</b> %s',

		// explanation text for cache links
		// %s will be replaced by a sample cache link
		cacheLinkExplanation: 'Use %s links to continue using the Google cache.',

		// explanation text for redirected page links
		redirectLinkExplanation: 'All HTTP/HTTPS links will be redirected to the Google cache.',

		// "show options" link text
		showOptions: 'show options',

		// "hide options" link text
		hideOptions: 'hide options',

		// redirect page links option label
		redirectPageLinksLabel: 'Redirect links to the Google cache',

		// cache link options heading
		cacheLinkOptions: 'Cache link',

		// cache link text option label
		cacheLinkTextLabel: 'Link text:',

		// cache link background colour option label
		cacheLinkBackgroundColorLabel: 'Background colour:',

		// cache link text colour option label
		cacheLinkTextColorLabel: 'Text colour:',

		// takes effect after page reload
		reload: 'Takes effect after page reload',

		// instruction text for text options
		textOptionInstructions: 'Leave a field blank to reset to default'
	},

	// modify these to change the appearance of the cache links
	css = '\
		a.googleCache {\
			position: static !important;\
			display: inline !important;\
			visibility: visible !important;\
			margin: 0.3ex !important;\
			padding: 0 0.6ex 0.4ex 0.3ex !important;\
			border: none !important;\
			font: normal bold x-small sans-serif !important;\
			text-align: left !important;\
			text-decoration: none !important;\
			text-transform: none !important;\
			letter-spacing: normal !important;\
			word-spacing: normal !important;\
			vertical-align: baseline !important;\
			cursor: pointer !important;\
		}\
		#googleCacheExplanation {\
			position: static !important;\
			display: block !important;\
			visibility: visible !important;\
			width: auto !important;\
			height: auto !important;\
			margin: 1em 0 !important;;\
			padding: 1ex 0.5ex !important;;\
			border: 1px solid #3366CC;\
			font-family: inherit !important;\
			font-style: normal !important;\
			font-variant: normal !important;\
			font-weight: normal !important;\
			font-stretch: normal !important;\
			font-size: inherit !important;\
			font-size-adjust: none !important;\
			line-height: inherit !important;\
			background: transparent !important;\
			color: black !important;\
			text-align: left !important;\
			text-decoration: none !important;\
			text-transform: none !important;\
			letter-spacing: normal !important;\
			word-spacing: normal !important;\
			vertical-align: baseline !important;\
			cursor: auto !important;\
		}\
		#googleCacheExplanation div {\
			margin-top: 0.5em !important;\
		}\
		#googleCacheExplanation input, #googleCacheExplanation label {\
			vertical-align: middle !important;\
		}\
		#googleCacheExplanation table {\
			margin: 0.5em 0 !important;\
			border-collapse: collapse !important;\
		}\
		#googleCacheExplanation td {\
			padding-right: 5px !important;\
		}\
	';

	/*
	 * end user editable parts
	 */



	/*
	 * poor-man's jQuery
	 */

	var $ = function( string, context ) {
		var div, el;

		if ( string.indexOf( '<' ) == -1 ) {
			return ( context || document ).getElementsByTagName( string );
		}

		div = document.createElement( 'div' );
		div.innerHTML = $.trim( string );
		el = div.firstChild;
		div.removeChild( el );
		return el;
	};

	$.trim = function( string ) { return ( '' + string ).replace( /^\s\s*/, '' ).replace( /\s\s*$/, '' ); };

	$.each = function( object, fn ) {
		var length, i;

		if ( object instanceof Array ) {
			length = object.length;
			for ( i = 0; i < length; i++ ) {
				if ( fn.call( object[ i ], i, object[ i ] ) === false ) {
					break;
				}
			}

		} else if ( typeof object === 'object' && object ) {
			for ( i in object ) {
				if ( fn.call( object[ i ], i, object[ i ] ) === false ) {
					break;
				}
			}
		}
	};

	$.makeArray = function( object ) { return Array.prototype.slice.call( object, 0 ); };

	$.extend = function( target ) {
		var args = $.makeArray( arguments );

		target = target || {};
		args.shift();

		$.each( args, function( i, source ) {
			var prop;

			source = source || {};

			for ( prop in source ) {
				target[ prop ] = source[ prop ];
			}
		} );

		return target;
	};



	/*
	 * more variables!
	 */

	var q,                  // (encoded) search query parameter (contains cache term)
		cacheTerm,          // (encoded) cache term ("cache%3Ahttp%3A%2F%2Fwww.example.com")
		url,                // URL of original page
		opts = {},          // final script options
		sopts = {},         // saved script options
		canSaveOpts = true, // whether GM_setValue() can be used
		verPos,             // index of text-only / full version link
		msg,                // message element
		optsPanel,          // options panel
		hideCacheLinks,     // style element to hide cache links
		cacheLinkColors,    // style element for cache links
		links,              // nodelist of cached page links
		link,               // link element
		tmplHref,           // cache link template href string
		href,               // href string
		el,                 // temp element
		a,                  // temp array / element
		s,                  // temp string
		i,                  // loop counter / temp variable
		l;                  // list length



	/*
	 * find things that we need from the page query string
	 */

	// query URL parameter
	$.each( document.location.search.replace( /^\?/, '' ).split( '&' ), function( i, pair ) {
		if ( pair.indexOf( 'q=' ) === 0 ) {
			q = pair.substring( 2 );
			return false;
		}
	} );

	// cache term and URL
	$.each( ( q || '' ).split( '+' ), function( i, encoded ) {
		var decoded = decodeURIComponent( encoded );
		if ( decoded.indexOf( 'cache:' ) === 0 ) {
			cacheTerm = encoded; // we want the encoded version
			url = decoded.substring( 6 );
			return false;
		}
	} );

	// can't continue without this information
	if (!q || !cacheTerm) {
		return;
	}



	// test if we can save options
	if (typeof GM_getValue == 'undefined' || typeof GM_setValue == 'undefined') {
		canSaveOpts = false;
	} else {
		try {
			i = (new Date()).getTime() + '-' + Math.random();
			GM_setValue('testOption', i);
			s = GM_getValue('testOption');
			GM_setValue('testOption', '');
		} catch (e) {
			canSaveOpts = false;
		}
		if (s != i) {
			canSaveOpts = false;
		}
	}

	// load saved options
	if (canSaveOpts) {
		for (i in defaultOptions) {
			sopts[i] = GM_getValue(i);
		}
	}

	// combine default and saved to get final options
	for (i in defaultOptions) {
		opts[i] = defaultOptions[i];
		s = sopts[i];
		if (s) {
			opts[i] = s;
		}
	}

	// save final options
	saveOptions();

	// replace %s here using the current cacheLinkText
	strings.cacheLinkExplanation = strings.cacheLinkExplanation.replace(/%s/g, '<a href="" class="googleCache">' + opts.cacheLinkText + '</a>');



	// add our css to the cache page
	head.appendChild($('<style type="text/css">' + css + '</style>'));



	// if Google hasn't cached the original page, add a link for the original URL
	// safer to add after the list of suggestions
	s = document.title;
	i = s.lastIndexOf(' - ');
	if (i > -1 && s.substring(0, i) == decodeURIComponent(q.replace(/\+/g, ' ')) && s.substring(i + 3).indexOf('Google') > -1) {
		el = $('ul')[0];
		if (el) {
			s = strings.uncached.replace(/%s/g, '<a href="' + ((url.indexOf('://') == -1) ? 'http://' : '') + url + '">' + url + '</a>');
			el.parentNode.insertBefore($('<p id="googleCacheExplanation">' + s + '</p>'), el.nextSibling);
		}
		return;
	}



	// get a snapshot from the live DOM
	links = document.evaluate('//a[@href]',
	                     document,
	                     null,
	                     XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
	                     null);

	// find last link in the cache page header (the "Text-only version" or "Full version" link)
	for (i = 0; (link = links.snapshotItem(i)); i++) {
		if (link.pathname == '/search' && link.search.indexOf('cache:') > -1 && /&strip=(?:0|1)$/.test(link.search)) {
			verPos = i;
			break;
		}
	}
	if (!link) {
		return;
	}

	// add css specific to the cache page
	hideCacheLinks = $('<style type="text/css">a.googleCache { display: none !important; }</style>');
	head.appendChild(hideCacheLinks);
	setCacheLinkColors();

	// add our explanation text / option panel to the cache page header
	el = $('\
		<div id="googleCacheExplanation">\
			<span></span>&nbsp;&nbsp;<a href="#"></a>\
			<div>\
				<input type="checkbox" id="googleCacheRedirectPageLinks" /><label for="googleCacheRedirectPageLinks">' + strings.redirectPageLinksLabel + '</label>\
			</div>\
		</div>\
	');
	msg = $('span', el)[0];
	optsPanel = $('div', el)[0];
	a = $('a', el)[0];
	a.addEventListener('click', toggleOptionsPanel, false);
	i = $('input', el)[0];
	i.checked = opts.redirectPageLinks;
	i.addEventListener('click', toggleCacheLinks, false);
	link.parentNode.parentNode.appendChild(el);
	toggleOptionsPanel.call(a);
	toggleCacheLinks.call(i);

	if (canSaveOpts) {
		el = $('\
			<table cellpadding="0" cellspacing="0" border="0">\
				<tr>\
					<th colspan="3">' + strings.cacheLinkOptions + '</th>\
				</tr>\
				<tr>\
					<td><label for="googleCacheCacheLinkText">' + strings.cacheLinkTextLabel + '</label></td>\
					<td><input type="text" id="googleCacheCacheLinkText" value="' + opts.cacheLinkText + '" /></td>\
					<td>' + strings.reload + '</td>\
				</tr>\
				<tr>\
					<td><label for="googleCacheCacheLinkBackgroundColor">' + strings.cacheLinkBackgroundColorLabel + '</label></td>\
					<td><input type="text" id="googleCacheCacheLinkBackgroundColor" value="' + opts.cacheLinkBackgroundColor + '" /></td>\
					<td></td>\
				</tr>\
				<tr>\
					<td><label for="googleCacheCacheLinkTextColor">' + strings.cacheLinkTextColorLabel + '</label></td>\
					<td><input type="text" id="googleCacheCacheLinkTextColor" value="' + opts.cacheLinkTextColor + '" /></td>\
					<td></td>\
				</tr>\
			</table>\
		');
		i = $('input', el);
		i[0].addEventListener('change', function () {
			this.value = $.trim(this.value);
			if (!this.value) {
				this.value = defaultOptions.cacheLinkText;
			}
			opts.cacheLinkText = this.value;
			saveOptions();
		}, false);
		i[1].addEventListener('change', function () {
			this.value = $.trim(this.value);
			if (!this.value) {
				this.value = defaultOptions.cacheLinkBackgroundColor;
			}
			opts.cacheLinkBackgroundColor = this.value;
			setCacheLinkColors();
			saveOptions();
		}, false);
		i[2].addEventListener('change', function () {
			this.value = $.trim(this.value);
			if (!this.value) {
				this.value = defaultOptions.cacheLinkTextColor;
			}
			opts.cacheLinkTextColor = this.value;
			setCacheLinkColors();
			saveOptions();
		}, false);
		optsPanel.appendChild(el);
		optsPanel.appendChild(document.createTextNode(strings.textOptionInstructions));
	}



	// build cache link template href
	tmplHref = document.location.href;
	s = document.location.hash;
	if (s) {
		tmplHref = tmplHref.replace(s, '');
	}

	// add cache links for each link
	for (i = verPos + 1; (link = links.snapshotItem(i)); i++) {
		if (!/^https?:$/.test(link.protocol)) {
			continue;
		}

		href = link.href;
		s = link.hash;
		if (s) {
			href = href.replace(s, '');
		}
		href = tmplHref.replace(cacheTerm, encodeURIComponent('cache:' + href)) + s;

		link.parentNode.insertBefore($('<a href="' + href + '" class="googleCache">' + opts.cacheLinkText + '</a>'), link.nextSibling);
	}



	// add event handler to change clicked link's href to cache version
	document.addEventListener('click', function (e) {
		var link = e.target, cacheLink;
		if (link.nodeType == 3) {
			link = link.parentNode;
		}
		cacheLink = link.nextSibling;
		if (!opts.redirectPageLinks || link.nodeName.toUpperCase() != 'A' || !cacheLink || cacheLink.nodeName.toUpperCase() != 'A' || cacheLink.className != 'googleCache') {
			return;
		}
		link.href = cacheLink.href;
	}, false);



	function setCacheLinkColors() {
		if (cacheLinkColors) {
			head.removeChild(cacheLinkColors);
		}
		cacheLinkColors = $('\
			<style type="text/css">\
				a.googleCache {\
					background: ' + opts.cacheLinkBackgroundColor + ' !important;\
					color: ' + opts.cacheLinkTextColor + ' !important;\
				}\
				a.googleCache:hover {\
					background: ' + opts.cacheLinkTextColor + ' !important;\
					color: ' + opts.cacheLinkBackgroundColor + ' !important;\
				}\
			</style>\
		');
		head.appendChild(cacheLinkColors);
	}

	function saveOptions() {
		if (canSaveOpts) {
			for (i in opts) {
				GM_setValue(i, opts[i]);
			}
		}
	}


	// event handlers

	function toggleOptionsPanel(e) {
		if (e) {
			e.preventDefault();
		}
		if (optsPanel.style.display == 'none') {
			this.innerHTML = strings.hideOptions;
			optsPanel.style.display = 'block';
		} else {
			this.innerHTML = strings.showOptions;
			optsPanel.style.display = 'none';
		}
	}

	function toggleCacheLinks() {
		var redirect = this.checked;
		opts.redirectPageLinks = redirect;
		hideCacheLinks.disabled = hideCacheLinks.sheet.disabled = !redirect;
		msg.innerHTML = (redirect) ? strings.redirectLinkExplanation : strings.cacheLinkExplanation;
		saveOptions();
	}

})( document, document.getElementsByTagName('head')[0] );

