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

(function( window, document, head, undefined ) {
	// XXX move this below
	var ID = ( Math.random() + '' ).replace( /\D/g, '' );

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
		a.googleCache' + ID + ' {\
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
		#googleCacheExplanation' + ID + ' {\
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
		#googleCacheExplanation' + ID + ' div {\
			margin-top: 0.5em !important;\
		}\
		#googleCacheExplanation' + ID + ' input, #googleCacheExplanation' + ID + ' label {\
			vertical-align: middle !important;\
		}\
		#googleCacheExplanation' + ID + ' table {\
			margin: 0.5em 0 !important;\
			border-collapse: collapse !important;\
		}\
		#googleCacheExplanation' + ID + ' td {\
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

		if ( string.indexOf( '<' ) > -1 ) {
			div = document.createElement( 'div' );
			div.innerHTML = $.trim( string );
			el = div.firstChild;
			div.removeChild( el );
			return el;
		}

		if ( string.indexOf( '#' ) === 0 ) {
			el = document.getElementById( string.substring(1) );
			if ( el && context && !( context.compareDocumentPosition( el ) & 16 ) ) {
				el = undefined;
			}
			return el ? [ el ] : [];
		}

		return ( context || document ).getElementsByTagName( string );
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

	$.insertAfter = function( newChild, refChild ) { refChild.parentNode.insertBefore( newChild, refChild.nextSibling ); };



	/*
	 * globals!
	 */

		// (encoded) search query (contains cache term)
	var searchQuery = findSearchQuery(),

		// (encoded) cache term ("cache%3Ahttp%3A%2F%2Fwww.example.com")
		cacheTerm = findCacheTerm( searchQuery ),

		// script options
		options = restoreOptions(),

		// link details
		links;


	/*
	 * main
	 */

	// we can't continue without this information
	if ( !searchQuery || !cacheTerm ) {
		return;
	}

	// save options
	saveOptions( options );

	// replace %s here using the current cacheLinkText
	strings.cacheLinkExplanation = strings.cacheLinkExplanation.replace(/%s/g, '<a href="" class="googleCache' + ID + '">' + options.cacheLinkText + '</a>');

	// add our css to the cache page
	head.appendChild($('<style type="text/css">' + css + '</style>'));

	// if Google hasn't cached the original page, add a link for the original URL
	if (!isCachePage(searchQuery)) {
		addOriginalLink( decodeURIComponent( cacheTerm ).replace( /^cache:/, '' ) );
		return;
	}

	links = scanLinks( cacheTerm );

	if ( !links.changeVersion ) {
		// we didn't find the text-only / full version link
		return;
	}

	// add css specific to the cache page
	head.appendChild( $( '\
		<style id="googleCacheHideCacheLinks' + ID + '" type="text/css">\
			a.googleCache' + ID + ' {\
				display: none !important;\
			}\
		</style>\
	' ) );
	setCacheLinkColors();

	addHeader( links.changeVersion.parentNode.parentNode );



	/*
	 * save / restore options
	 */

	// returns true if the browser supports GM_getValue / GM_setValue
	function canSaveOptions() {
		var me = arguments.callee, name = 'testOption' + ID, value;

		if ( me.cached === undefined ) {
			if ( typeof GM_getValue !== 'undefined' && typeof GM_setValue !== 'undefined' ) {
				try {
					GM_setValue( name, ID );
					value = GM_getValue( name );
					GM_setValue( name, '' );
				} catch (e) {
					value = null;
				}
			}

			me.cached = value === ID;
		}

		return me.cached;
	}

	// returns an options object based on any saved options and the default options
	function restoreOptions() {
		var options = $.extend( {}, defaultOptions );

		if ( canSaveOptions() ) {
			$.each( defaultOptions, function( name ) {
				var saved = GM_getValue( name );
				if ( saved !== undefined ) {
					options[ name ] = saved;
				}
			} );
		}

		return options;
	}

	// saves the given options object
	function saveOptions( options ) {
		if ( canSaveOptions() ) {
			$.each( defaultOptions, function ( name ) { GM_setValue( name, options[ name ] ); } );
		}
	}



	/*
	 * find information from the current page
	 */

	// returns the search query from the page URL
	function findSearchQuery() {
		var query = '';

		$.each( document.location.search.replace( /^\?/, '' ).split( '&' ), function( i, pair ) {
			if ( pair.indexOf( 'q=' ) === 0 ) {
				query = pair.substring( 2 );
				return false;
			}
		} );

		return query;
	}

	// returns the (encoded) cache term ("cache:...") from the given query parameter
	function findCacheTerm( query ) {
		var cacheTerm = '';

		$.each( ( query || '' ).split( '+' ), function( i, encoded ) {
			if ( decodeURIComponent( encoded ).indexOf( 'cache:' ) === 0 ) {
				cacheTerm = encoded;
				return false;
			}
		} );

		return cacheTerm;
	}

	// returns true if the current page is a google cache page
	function isCachePage( query ) {
		var str = document.title,
			prefix = decodeURIComponent( query.replace( /\+/g, ' ' ) ) + ' - ',
			result = true;

		if ( str.indexOf( prefix ) === 0 ) {
			str = str.replace( prefix, '' );
			result = str.indexOf( 'Google' ) === -1 || str.indexOf( ' - ' ) > -1;
		}

		return result;
	}

	// finds text-only / full version link, gathers link details, inserts cache links
	function scanLinks( cacheTerm ) {
		// get a snapshot from the live DOM
		var links = document.evaluate( '//a[@href]',
		                               document,
		                               null,
		                               XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
		                               null ),
			list = [],
			tmplHref = document.location.href.replace(document.location.hash, ''),
			changeVersion, link, href, hash, cacheHref, cacheLink, i;

		for ( i = 0; ( link = links.snapshotItem( i ) ); i++ ) {
			if ( !changeVersion ) {
				// find last link in the cache page header (the "Text-only version" or "Full version" link)
				if ( link.pathname === '/search' && /cache:.*&strip=[01]$/.test( link.search ) ) {
					changeVersion = link;
				}

			} else {
				// gather link details, insert cache link
				if ( /^https?:$/.test( link.protocol ) ) {
					href = link.href;
					hash = link.hash;
					cacheHref = tmplHref.replace( cacheTerm, encodeURIComponent( 'cache:' + href.replace( hash, '' ) ) ) + hash;
					cacheLink = $( '<a href="' + cacheHref + '" class="googleCache' + ID + '">' + options.cacheLinkText + '</a>' );

					list.push( {
						link: link,
						cacheLink: cacheLink,
						href: href,
						cacheHref: cacheHref
					} );

					$.insertAfter( cacheLink, link );
				}
			}
		}

		list.changeVersion = changeVersion;
		return list;
	}



	/*
	 * manipulate styles
	 */

	// make cache links visible or hidden
	function setCacheLinkVisibility( isVisible ) {
		var style = $( '#googleCacheHideCacheLinks' + ID )[ 0 ];
		style.disabled = style.sheet.disabled = isVisible;
	}

	// set colours for cache links
	function setCacheLinkColors() {
		var prevStyle = $( '#googleCacheCacheLinkColors' + ID )[ 0 ],
			curStyle = $( '\
				<style id="googleCacheCacheLinkColors' + ID + '" type="text/css">\
					a.googleCache' + ID + ' {\
						background: ' + options.cacheLinkBackgroundColor + ' !important;\
						color: ' + options.cacheLinkTextColor + ' !important;\
					}\
					a.googleCache' + ID + ':hover {\
						background: ' + options.cacheLinkTextColor + ' !important;\
						color: ' + options.cacheLinkBackgroundColor + ' !important;\
					}\
				</style>\
			' );

		if ( prevStyle ) {
			head.replaceChild( curStyle, prevStyle );
		} else {
			head.appendChild( curStyle );
		}
	}



	/*
	 * manipulate html
	 */

	// updates hrefs for links
	function updateLinkHrefs( list, isOriginalHref ) {
		var prop = isOriginalHref ? 'href' : 'cacheHref';
		$.each( list, function() { this.link.href = this[ prop ]; } );
	}

	// adds a link for the original URL to the Google search results page
	// safer to add after the list of suggestions
	function addOriginalLink( url ) {
		var ul = $( 'ul' )[ 0 ],
			msg = strings.uncached.replace( /%s/g, '<a href="' + ( url.indexOf( '://' ) === -1 ? 'http://' : '' ) + url + '">' + url + '</a>' );

		if ( ul ) {
			$.insertAfter( $( '<p id="googleCacheExplanation' + ID + '">' + msg + '</p>' ), ul );
		}
	}

	// adds our explanation text and option panel to the cache page header
	function addHeader( container ) {
		var link, input;

		container.appendChild( $( '\
			<div id="googleCacheExplanation' + ID + '">\
				<span id="googleCacheMessage' + ID + '"></span>&nbsp;\
				<a href="" id="googleCacheOptionsLink' + ID + '"></a>\
				\
				<div id="googleCacheOptions' + ID + '">\
					<input type="checkbox" id="googleCacheRedirectPageLinks' + ID + '" />\
					<label for="googleCacheRedirectPageLinks' + ID + '">' + strings.redirectPageLinksLabel + '</label>\
					' +
					(canSaveOptions() ? ('\
					<table cellpadding="0" cellspacing="0" border="0">\
						<tr>\
							<th colspan="3">' + strings.cacheLinkOptions + '</th>\
						</tr>\
						<tr>\
							<td><label for="googleCacheCacheLinkText' + ID + '">' + strings.cacheLinkTextLabel + '</label></td>\
							<td><input type="text" id="googleCacheCacheLinkText' + ID + '" value="' + options.cacheLinkText + '" /></td>\
							<td>' + strings.reload + '</td>\
						</tr>\
						<tr>\
							<td><label for="googleCacheCacheLinkBackgroundColor' + ID + '">' + strings.cacheLinkBackgroundColorLabel + '</label></td>\
							<td><input type="text" id="googleCacheCacheLinkBackgroundColor' + ID + '" value="' + options.cacheLinkBackgroundColor + '" /></td>\
							<td></td>\
						</tr>\
						<tr>\
							<td><label for="googleCacheCacheLinkTextColor' + ID + '">' + strings.cacheLinkTextColorLabel + '</label></td>\
							<td><input type="text" id="googleCacheCacheLinkTextColor' + ID + '" value="' + options.cacheLinkTextColor + '" /></td>\
							<td></td>\
						</tr>\
					</table>\
					' +
					strings.textOptionInstructions) : '') + '\
				</div>\
			</div>\
		' ) );

		link = $( '#googleCacheOptionsLink' + ID )[ 0 ];
		link.addEventListener( 'click', optionsLinkClick, false );
		optionsLinkClick.call( link );

		input = $( '#googleCacheRedirectPageLinks' + ID )[ 0 ];
		input.checked = options.redirectPageLinks;
		input.addEventListener( 'click', redirectPageLinksClick, false );
		redirectPageLinksClick.call( input );

		if ( canSaveOptions() ) {
			$( '#googleCacheCacheLinkText' + ID )[ 0 ].addEventListener( 'change', cacheLinkTextChange, false );
			$( '#googleCacheCacheLinkBackgroundColor' + ID )[ 0 ].addEventListener( 'change', cacheLinkBackgroundColorChange, false );
			$( '#googleCacheCacheLinkTextColor' + ID )[ 0 ].addEventListener( 'change', cacheLinkTextColorChange, false );
		}

		window.addEventListener( 'unload', function() {
			window.removeEventListener( 'unload', arguments.callee, false );

			$( '#googleCacheOptionsLink' + ID )[ 0 ].removeEventListener( 'click', optionsLinkClick, false );
			$( '#googleCacheRedirectPageLinks' + ID )[ 0 ].removeEventListener( 'click', redirectPageLinksClick, false );

			if ( canSaveOptions() ) {
				$( '#googleCacheCacheLinkText' + ID )[ 0 ].removeEventListener( 'change', cacheLinkTextChange, false );
				$( '#googleCacheCacheLinkBackgroundColor' + ID )[ 0 ].removeEventListener( 'change', cacheLinkBackgroundColorChange, false );
				$( '#googleCacheCacheLinkTextColor' + ID )[ 0 ].removeEventListener( 'change', cacheLinkTextColorChange, false );
			}
		}, false);
	}



	// event handlers

	function optionsLinkClick( e ) {
		var panel = $( '#googleCacheOptions' + ID )[ 0 ];

		if ( e ) {
			e.preventDefault();
		}

		if ( panel.style.display === 'none' ) {
			this.innerHTML = strings.hideOptions;
			panel.style.display = 'block';
		} else {
			this.innerHTML = strings.showOptions;
			panel.style.display = 'none';
		}
	}

	function redirectPageLinksClick() {
		var redirect = this.checked;

		options.redirectPageLinks = redirect;
		saveOptions( options );

		updateLinkHrefs( links, !redirect );
		setCacheLinkVisibility( !redirect );

		$( '#googleCacheMessage' + ID )[ 0 ].innerHTML = redirect ? strings.redirectLinkExplanation : strings.cacheLinkExplanation;
	}

	function cacheLinkTextChange() {
		this.value = $.trim( this.value );
		if ( !this.value ) {
			this.value = defaultOptions.cacheLinkText;
		}

		options.cacheLinkText = this.value;
		saveOptions( options );
	}

	function cacheLinkBackgroundColorChange() {
		this.value = $.trim( this.value );
		if ( !this.value ) {
			this.value = defaultOptions.cacheLinkBackgroundColor;
		}

		options.cacheLinkBackgroundColor = this.value;
		saveOptions( options );

		setCacheLinkColors();
	}

	function cacheLinkTextColorChange() {
		this.value = $.trim( this.value );
		if ( !this.value ) {
			this.value = defaultOptions.cacheLinkTextColor;
		}

		options.cacheLinkTextColor = this.value;
		saveOptions( options );

		setCacheLinkColors();
	}

})( window, document, document.getElementsByTagName('head')[0] );

