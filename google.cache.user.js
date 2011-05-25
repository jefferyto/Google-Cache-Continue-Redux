// Google Cache Continue Redux
// Based on Google Cache Continue by Jonathon Ramsey
// v0.5

// Copyright (C) 2005-2011 by
//   Jonathon Ramsey (jonathon.ramsey@gmail.com)
//   Jeffery To (jeffery.to@gmail.com)

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
// @version        0.5
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

// v0.5 (?)
// - Works with cache pages under HTTPS / SSL
// - Added an option to always use HTTPS
// - Options can be saved in Chrome, if the cache page comes from webcache.googleusercontent.com
// - Added a function to sync options between HTTP and HTTPS cache pages in Chrome
//   Must be manually triggered since it requires an iframe page load
// - Cache link text change takes effect immediately, instead of after page reload
// - Added default styles to our elements so that they're more resistant to in-page styles
// - Added an About panel
// - Added a "Check for updates" function, inside the About panel (fails silently in Chrome due to browser restrictions)
// - Auto-check for updates every 60 days
// - Another refactoring

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

(function( window, document, head, body, undefined ) {

	/*
	 * user editable parts, start!
	 */

	// default options
	var defaultOptions = {
		// whether page links should be redirected
		// can be changed in the options panel
		redirectPageLinks: false,

		// whether we should always use HTTPS for cache pages
		useHttps: false,

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

		// "Show options" link text
		showOptions: 'Show options',

		// "Hide options" link text
		hideOptions: 'Hide options',

		// redirect page links option label
		redirectPageLinksLabel: 'Redirect links to the Google cache',

		// use https option label
		useHttpsLabel: 'Always use HTTPS',

		// cache link options heading
		cacheLinkOptions: 'Cache link',

		// cache link text option label
		cacheLinkTextLabel: 'Link text:',

		// cache link background colour option label
		cacheLinkBackgroundColorLabel: 'Background colour:',

		// cache link text colour option label
		cacheLinkTextColorLabel: 'Text colour:',

		// instruction text for text options
		textOptionInstructions: 'Leave a field blank to reset to default',

		// synchronize http / https options link text
		// %s will be replaced by the appropriate protocol (HTTP/HTTPS)
		syncLinkText: 'Copy options to %s Google cache',

		// synchronizing text
		syncing: 'Copying&hellip;',

		// sync done text
		syncDone: 'done!',

		// if the cache page host matches this, then we can save options in Chrome
		// http and https pages will have separate options though :-(
		cacheHost: 'webcache.googleusercontent.com',

		// prefix for values stored in localStorage
		localStoragePrefix: 'greasemonkey.scriptvals.http://www.thingsthemselves.com/greasemonkey//Google Cache Continue Redux.',

		// "About" link text
		about: 'About',

		// about title text
		aboutTitle: 'Google Cache Continue Redux',

		// about text
		aboutText: 'Based on Google Cache Continue by Jonathon Ramsey<br>Copyright 2005-2011 by Jonathon Ramsey and Jeffery To',

		// about version text
		// %s will be replaced by the version number
		version: 'Version %s',

		// about homepage link text
		homepage: 'Homepage',

		// about homepage url
		homepageUrl: 'http://userscripts.org/scripts/show/30878',

		// "Close" link text
		close: 'Close',

		// check for update link text
		check: 'Check for updates',

		// checking text
		checking: 'Checking for updates&hellip;',

		// install newer version link text
		update: 'Install latest version',

		// meta url
		metaUrl: 'http://userscripts.org/scripts/source/30878.meta.js'
	},

	// modify these to change the appearance of things
	css = {
		cacheLink: {
			'font-size': 'x-small',
			'font-weight': 'bold',
			'margin': '0.3ex',
			'padding': '0 0.6ex 0.4ex 0.3ex',
			'text-decoration': 'none'
		},

		uncached: {
			'border': '1px solid #3366cc',
			'padding': '1ex 0.5ex'
		},

		explanation: {
			'border': '1px solid #999',
			'margin': '1em 0',
			'padding': '1ex 0.5ex'
		},

		panel: {
			'margin-top': '0.5em'
		},

		defaults: {
			// used to reset styles
			reset: {
				'background': 'none',
				'border': '0',
				'clear': 'none',
				'clip': 'auto',
				'color': '#000',
				'content': 'normal',
				'cursor': 'auto',
				'float': 'none',
				'font': '13px arial,sans-serif',
				'font-stretch': 'normal',
				'font-size-adjust': 'none',
				'height': 'auto',
				'letter-spacing': 'normal',
				'list-style': 'none',
				'margin': '0',
				'overflow': 'visible',
				'padding': '0',
				'position': 'static',
				'text-align': 'left',
				'text-decoration': 'none',
				'text-indent': '0',
				'text-transform': 'none',
				'vertical-align': 'baseline',
				'visibility': 'visible',
				'white-space': 'normal',
				'width': 'auto',
				'word-spacing': 'normal',
				'z-index': 'auto'
			},

			// styles for each element type

			a: {
				'cursor': 'pointer',
				'color': '#00c',
				'display': 'inline',
				'text-decoration': 'underline'
			},

			b: {
				'display': 'inline',
				'font-weight': 'bold'
			},

			div: {
				'display': 'block',
			},

			input_checkbox: {
				'display': 'inline',
				'margin': '3px',
				'vertical-align': 'middle'
			},

			input_text: {
				'background': '#fff',
				'border': '1px solid threedface',
				'cursor': 'text',
				'display': 'inline',
				'padding': '1px 0',
				'text-align': 'start'
			},

			label: {
				'cursor': 'default',
				'display': 'inline',
				'vertical-align': 'middle'
			},

			table: {
				'display': 'table',
				'margin': '0.5em 0',
				'border-collapse': 'collapse'
			},

			td: {
				'display': 'table-cell',
				'padding-right': '5px'
			},

			th: {
				'display': 'table-cell',
				'font-weight': 'bold'
			},

			p: {
				'display': 'block',
				'margin': '1em 0'
			}
		}
	};

	/*
	 * user editable parts, end!
	 */



	/*
	 * poor-man's jQuery!
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
	 * main!
	 */

		// (encoded) search query (contains cache term)
	var searchQuery = findSearchQuery(),

		// (encoded) cache term ("cache%3Ahttp%3A%2F%2Fwww.example.com")
		cacheTerm = findCacheTerm( searchQuery ),

		// element ids
		id = generateIds( 'cacheLink hideCacheLinks cacheLinkColors cacheLinkHoverColors exampleCacheLink message optionsLink options redirectPageLinks useHttps cacheLinkText cacheLinkBackgroundColor cacheLinkTextColor syncLink syncing syncDone syncIframe aboutLink about closeLink checkLink checking updateLink'.split( ' ' ) ),

		// script version
		version = '0.5',

		// true if we're in currently checking
		checking = false,

		// true of we're using localStorage to save options
		usingLocalStorage = false,

		// true if we are syncing options
		syncing = false,

		// true if we're under http (false for https)
		isHttp = window.location.protocol === 'http:',

		// script options
		options,

		// link details
		links;

	// we can't continue without this information
	if ( !searchQuery || !cacheTerm ) {
		return;
	}

	// these aren't actual options but things we need to remember
	$.extend( defaultOptions, {
		lastUpdateCheck: '0', // GM_setValue can only store 32-bit integers, so we need to save this as a string
		updateAvailable: false
	} );

	// restore, then save, options
	// restoreOptions() will set usingLocalStorage as a side effect
	// should find a better way...
	options = restoreOptions();
	saveOptions( options );

	if ( isCachePage( searchQuery ) ) {
		if ( options.useHttps && isHttp ) {
			window.setTimeout( function() { window.location.replace( window.location.href.replace( /^http:/i, 'https:' ) ); }, 0 );

		} else {
			links = scanLinks( cacheTerm );

			if ( links.changeVersion ) {
				addExplanation( options, links.changeVersion.parentNode.parentNode );

				if ( options.canCheckForUpdate && shouldCheckForUpdate( options ) ) {
					checkForUpdate( options );
				}
			}
		}

	} else {
		// if Google hasn't cached the original page, add a link for the original URL
		addOriginalLink( decodeURIComponent( cacheTerm ).replace( /^cache:/, '' ) );
	}

	if ( usingLocalStorage ) {
		window.addEventListener( 'message', receivedMessage, false );
	}

	// cleanup
	window.addEventListener( 'unload', function() {
		window.removeEventListener( 'unload', arguments.callee, false );
		window.removeEventListener( 'message', receivedMessage, false );
		searchQuery = cacheTerm = options = id = links = null;
	}, false );



	/*
	 * functions!
	 */



	/*
	 * save / restore options
	 */

	// returns true if the browser supports GM_getValue / GM_setValue
	function canSaveOptions() {
		var me = arguments.callee, test, result;

		if ( me.cached === undefined ) {
			test = function() {
				var name = 'testOption', token = getToken(), value;

				try {
					GM_setValue( name, token );
					value = GM_getValue( name );
					GM_setValue( name, '' );
				} catch ( e ) {
					value = null;
				}

				return value === token;
			};

			result = test();

			// use localStorage to save options if host matches cacheHost
			// based on by http://userscripts.org/topics/41177#posts-197125
			if ( !result && window.location.host === strings.cacheHost && window.localStorage &&
					typeof window.localStorage.getItem === 'function' && typeof window.localStorage.setItem === 'function' ) {

				GM_getValue = function( name, defaultValue ) {
					var value = window.localStorage.getItem( strings.localStoragePrefix + name ), type;

					if ( value ) {
						type = value.charAt( 0 );
						value = value.substring( 1 );

						switch ( type ) {
						case 'b':
							value = value === 'true';
							break;
						case 'n':
							value = Number( value );
							break;
						}
					} else {
						value = defaultValue;
					}

					return value;
				};

				GM_setValue = function( name, value ) {
					window.localStorage.setItem( strings.localStoragePrefix + name, ( typeof value ).charAt( 0 ) + value );
				};

				result = test();
				usingLocalStorage = result;
			}

			me.cached = result;
		}

		return me.cached;
	}

	// returns an options object based on any saved options and the default options
	function restoreOptions() {
		var options = $.extend( {}, defaultOptions ), canSave = canSaveOptions();

		if ( canSave ) {
			$.each( defaultOptions, function( name ) {
				var saved = GM_getValue( name );
				if ( saved !== undefined ) {
					options[ name ] = saved;
				}
			} );
		}

		// don't check for updates if we can't remember when we last checked
		options.canCheckForUpdate = typeof GM_xmlhttpRequest === 'function' && canSave;

		return options;
	}

	// saves the given options object
	function saveOptions( options ) {
		if ( canSaveOptions() ) {
			$.each( defaultOptions, function( name ) { GM_setValue( name, options[ name ] ); } );
		}
	}



	/*
	 * find information from the current page
	 */

	// returns the search query from the page URL
	function findSearchQuery() {
		var query = '';

		$.each( window.location.search.replace( /^\?/, '' ).split( '&' ), function( i, pair ) {
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
			tmplHref = window.location.href.replace(window.location.hash, ''),
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
					cacheLink = $( '<a href="' + cacheHref + '" class="' + id.cacheLink + '" ' + getInlineStyle( 'a', css.cacheLink ) + '>' + options.cacheLinkText + '</a>' );

					list.push( {
						link: link,
						cacheLink: cacheLink,
						href: href,
						cacheHref: cacheHref,
						secureCacheHref: cacheHref.replace( /^http:/i, 'https:' )
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

	// returns a style element for the given selector and rules
	function getStyleElement( selector, rules, id ) {
		var buf = [ '<style id="', id || '', '" type="text/css">', selector, '{' ];

		$.each( rules, function( prop, val ) { buf.push( prop, ':', val, ';' ); } );

		buf.push('}</style>');

		return $( buf.join( '' ) );
	}

	// returns a string for the given tag and rules object
	function getInlineStyle( tag, rules ) {
		var buf = [ 'style="' ];

		if ( tag !== false ) {
			rules = $.extend( {}, css.defaults.reset, css.defaults[ tag ], rules || {} );
		}
		$.each( rules, function( prop, val ) { buf.push( prop, ':', val, ';' ); } );

		buf.push('"');

		return buf.join( '' );
	}

	// make cache links visible or hidden
	function setCacheLinkVisibility( isVisible ) {
		var style = $( '#' + id.hideCacheLinks )[ 0 ];

		if ( !style ) {
			style = getStyleElement( 'a.' + id.cacheLink, { 'display': 'none !important' }, id.hideCacheLinks );
			head.appendChild( style );
		}

		style.disabled = style.sheet.disabled = isVisible;
	}

	// set colours for cache links
	function setCacheLinkColors() {
		var prevNormal = $( '#' + id.cacheLinkColors )[ 0 ],
			prevHover = $( '#' + id.cacheLinkHoverColors )[ 0 ],
			curNormal = getStyleElement( 'a.' + id.cacheLink, {
				'background': options.cacheLinkBackgroundColor + ' !important',
				'color': options.cacheLinkTextColor + ' !important'
			}, id.cacheLinkColors ),
			curHover = getStyleElement( 'a.' + id.cacheLink + ':hover', {
				'background': options.cacheLinkTextColor + ' !important',
				'color': options.cacheLinkBackgroundColor + ' !important'
			}, id.cacheLinkHoverColors );

		if ( prevNormal ) {
			head.replaceChild( curNormal, prevNormal );
		} else {
			head.appendChild( curNormal );
		}
		if ( prevHover ) {
			head.replaceChild( curHover, prevHover );
		} else {
			head.appendChild( curHover );
		}
	}



	/*
	 * manipulate html
	 */

	// updates hrefs for links
	function updateLinkHrefs( list, options ) {
		var cacheLinkProp = options.useHttps ? 'secureCacheHref' : 'cacheHref',
			linkProp = options.redirectPageLinks ? cacheLinkProp : 'href';

		$.each( list, function() {
			this.link.href = this[ linkProp ];
			this.cacheLink.href = this[ cacheLinkProp ];
		} );
	}

	// updated link text for cache links
	function updateCacheLinkText( list, text ) {
		$( '#' + id.exampleCacheLink )[ 0 ].innerHTML = text;
		$.each( list, function() { this.cacheLink.innerHTML = text; } );
	}

	// adds a link for the original URL to the Google search results page
	// safer to add after the list of suggestions
	// should be safe to not add a lot of default styles here
	function addOriginalLink( url ) {
		var ul = $( 'ul' )[ 0 ],
			msg = strings.uncached.replace( /%s/g, '<a href="' + ( url.indexOf( '://' ) === -1 ? 'http://' : '' ) + url + '">' + url + '</a>' );

		if ( ul ) {
			$.insertAfter( $( '<p ' + getInlineStyle( false, css.uncached ) + '>' + msg + '</p>' ), ul );
		}
	}

	// adds our explanation text and option panel to the cache page header
	function addExplanation( options, container ) {
		var space = '&nbsp;&nbsp;&nbsp;', link, input;

		// OMG this is ugly
		container.appendChild( $( [
			'<div ', getInlineStyle( 'div', css.explanation ), '>',
				'<span id="', id.message, '"></span>',
				space,
				'<a href="" id="', id.optionsLink, '" ', getInlineStyle( 'a' ), '></a>',
				space,
				'<a href="" id="', id.aboutLink, '" ', getInlineStyle( 'a' ), '>',
					strings.about,
				'</a>',
				space,
				'<span id="', id.checking, '">',
					strings.checking,
				'</span>',
				'<a href="', strings.homepageUrl, '" id="', id.updateLink, '" ', getInlineStyle( 'a' ), ' target="_blank">',
					strings.update,
				'</a>',

				'<div id="', id.about, '" ', getInlineStyle( 'div', css.panel ), '>',
					'<p ', getInlineStyle( 'p' ), '>',
						'<b ', getInlineStyle( 'b' ), '>',
							strings.aboutTitle,
						'</b>',
						'<br>',
						strings.version.replace(/%s/g, version ),
						'<br>',
						'<a href="', strings.homepageUrl, '" target="_blank" ', getInlineStyle( 'a' ), '>',
							strings.homepage,
						'</a>',
						space,
						'<a href="" id="', id.checkLink, '" ', getInlineStyle( 'a' ), '>',
							strings.check,
						'</a>',
					'</p>',
					'<p ', getInlineStyle( 'p' ), '>',
						strings.aboutText,
					'</p>',
					'<a href="" id="', id.closeLink, '" ', getInlineStyle( 'a' ), '>', strings.close, '</a>',
				'</div>',

				'<div id="', id.options, '" ', getInlineStyle( 'div', css.panel ), '>',
					'<input type="checkbox" id="', id.redirectPageLinks, '" ', getInlineStyle( 'input_checkbox' ), ' />',
					'<label for="', id.redirectPageLinks, '" ', getInlineStyle( 'label' ), '>',
						strings.redirectPageLinksLabel,
					'</label>',
					'<br>',
					'<input type="checkbox" id="', id.useHttps, '" ', getInlineStyle( 'input_checkbox' ), ' />',
					'<label for="', id.useHttps, '" ', getInlineStyle( 'label' ), '>',
						strings.useHttpsLabel,
					'</label>',

					canSaveOptions() ? [
						'<table cellpadding="0" cellspacing="0" border="0" ', getInlineStyle( 'table' ), '>',
							'<tr>',
								'<th colspan="2" ', getInlineStyle( 'th' ), '>',
									strings.cacheLinkOptions,
								'</th>',
							'</tr>',
							'<tr>',
								'<td ', getInlineStyle( 'td' ) + '>',
									'<label for="', id.cacheLinkText, '" ', getInlineStyle( 'label' ), '>',
										strings.cacheLinkTextLabel,
									'</label>',
								'</td>',
								'<td ', getInlineStyle( 'td' ) + '>',
									'<input type="text" id="', id.cacheLinkText, '" value="', options.cacheLinkText.replace( /"/g, '&quot;' ), '" ', getInlineStyle( 'input_text' ) + ' />',
								'</td>',
							'</tr>',
							'<tr>',
								'<td ', getInlineStyle( 'td' ) + '>',
									'<label for="', id.cacheLinkBackgroundColor, '" ', getInlineStyle( 'label' ) + '>',
										strings.cacheLinkBackgroundColorLabel,
									'</label>',
								'</td>',
								'<td ', getInlineStyle( 'td' ) + '>',
									'<input type="text" id="', id.cacheLinkBackgroundColor, '" value="', options.cacheLinkBackgroundColor.replace( /"/g, '&quot;' ), '" ', getInlineStyle( 'input_text' ) + ' />',
								'</td>',
							'</tr>',
							'<tr>',
								'<td ', getInlineStyle( 'td' ) + '>',
									'<label for="', id.cacheLinkTextColor, '" ', getInlineStyle( 'label' ) + '>',
										strings.cacheLinkTextColorLabel,
									'</label>',
								'</td>',
								'<td ', getInlineStyle( 'td' ) + '>',
									'<input type="text" id="', id.cacheLinkTextColor, '" value="', options.cacheLinkTextColor.replace( /"/g, '&quot;' ), '" ', getInlineStyle( 'input_text' ) + ' />',
								'</td>',
							'</tr>',
						'</table>',
						strings.textOptionInstructions,
						usingLocalStorage ? [
							'<br>',
							'<a href="" id="', id.syncLink, '" ', getInlineStyle( 'a' ), '>',
								strings.syncLinkText.replace( /%s/g, isHttp ? 'HTTPS' : 'HTTP' ),
							'</a>',
							'<span id="', id.syncing, '" style="display:none;">',
								strings.syncing,
							'</span>',
							'<span id="', id.syncDone, '" style="display:none;">&nbsp;',
								strings.syncDone,
							'</span>'
						].join( '' ) : '',
					].join( '' ) : '',

				'</div>',
			'</div>'
		].join( '' ) ) );

		// options link
		link = $( '#' + id.optionsLink )[ 0 ];
		link.addEventListener( 'click', optionsLinkClick, false );
		optionsLinkClick.call( link );

		// redirect page links checkbox
		input = $( '#' + id.redirectPageLinks )[ 0 ];
		input.checked = options.redirectPageLinks;
		input.addEventListener( 'click', redirectPageLinksClick, false );
		redirectPageLinksClick.call( input );

		// use https checkbox
		input = $( '#' + id.useHttps )[ 0 ];
		input.checked = options.useHttps;
		input.addEventListener( 'click', useHttpsClick, false );
		useHttpsClick.call( input );

		setCacheLinkColors();

		// other options
		if ( canSaveOptions() ) {
			$( '#' + id.cacheLinkText )[ 0 ].addEventListener( 'change', cacheLinkTextChange, false );
			$( '#' + id.cacheLinkBackgroundColor )[ 0 ].addEventListener( 'change', cacheLinkBackgroundColorChange, false );
			$( '#' + id.cacheLinkTextColor )[ 0 ].addEventListener( 'change', cacheLinkTextColorChange, false );

			if ( usingLocalStorage ) {
				$( '#' + id.syncLink )[ 0 ].addEventListener( 'click', syncLinkClick, false );
			}
		}

		// about and close links
		link = $( '#' + id.aboutLink )[ 0 ];
		link.addEventListener( 'click', aboutLinkClick, false );
		link = $( '#' + id.closeLink )[ 0 ];
		link.addEventListener( 'click', aboutLinkClick, false );
		aboutLinkClick.call( link );

		// check link
		$( '#' + id.checkLink )[ 0 ].addEventListener( 'click', checkLinkClick, false );

		reflectUpdateStatus( options );

		window.addEventListener( 'unload', function() {
			window.removeEventListener( 'unload', arguments.callee, false );

			$( '#' + id.optionsLink )[ 0 ].removeEventListener( 'click', optionsLinkClick, false );
			$( '#' + id.redirectPageLinks )[ 0 ].removeEventListener( 'click', redirectPageLinksClick, false );
			$( '#' + id.useHttps )[ 0 ].removeEventListener( 'click', useHttpsClick, false );

			if ( canSaveOptions() ) {
				$( '#' + id.cacheLinkText )[ 0 ].removeEventListener( 'change', cacheLinkTextChange, false );
				$( '#' + id.cacheLinkBackgroundColor )[ 0 ].removeEventListener( 'change', cacheLinkBackgroundColorChange, false );
				$( '#' + id.cacheLinkTextColor )[ 0 ].removeEventListener( 'change', cacheLinkTextColorChange, false );

				if ( usingLocalStorage ) {
					$( '#' + id.syncLink )[ 0 ].removeEventListener( 'click', syncLinkClick, false );
				}
			}

			$( '#' + id.aboutLink )[ 0 ].removeEventListener( 'click', aboutLinkClick, false );
			$( '#' + id.closeLink )[ 0 ].removeEventListener( 'click', aboutLinkClick, false );
			$( '#' + id.checkLink )[ 0 ].removeEventListener( 'click', checkLinkClick, false );
		}, false);
	}



	/*
	 * check for update
	 */

	// check every 60 days
	function shouldCheckForUpdate( options ) { return now() - parseInt( options.lastUpdateCheck, 10 ) >= 60 * 24 * 60 * 60 * 1000; }

	function checkForUpdate( options ) {
		options.lastUpdateCheck = now() + '';
		saveOptions( options );

		checking = true;
		showChecking();

		function after() {
			checking = false;
			reflectUpdateStatus( options );
		}

		try {
			GM_xmlhttpRequest( {
				method: 'GET',
				url: strings.metaUrl + '?_=' + now(),

				onload: function( data ) {
					var a = /\/\/[ \t]*@version[ \t]+([^\s]+)/.exec( data.responseText || '' );

					if ( data.status === 200 ) {
						options.updateAvailable = !!( a && a[ 1 ] > version );
						saveOptions( options );
					}

					after();
				},

				onerror: after
			} );

		} catch ( e ) {
			after();
		}
	}

	function showChecking() {
		$( '#' + id.checking )[ 0 ].style.display = 'inline';
		$( '#' + id.updateLink )[ 0 ].style.display = 'none';
		$( '#' + id.checkLink )[ 0 ].style.display = 'none';
	}

	function reflectUpdateStatus( options ) {
		$( '#' + id.checking )[ 0 ].style.display = 'none';
		$( '#' + id.updateLink )[ 0 ].style.display = options.updateAvailable ? 'inline' : 'none';
		$( '#' + id.checkLink )[ 0 ].style.display = options.canCheckForUpdate ? 'inline' : 'none';
	}



	/*
	 * synchronize options (between http and https)
	 */

	// we need to use execScript() here because Chrome won't let an extension on the parent window access the window object of an iframe
	// (or an extension on the iframe access the parent window object)

	function syncOptions() {
		var iframe;

		if ( !syncing ) {
			iframe = $( '<iframe id="' + id.syncIframe + '" width="1" height="1" style="position:absolute;top:-99999px;visibility:hidden;"></iframe>' );
			iframe.addEventListener( 'load', syncIframeLoad, false );
			iframe.src = getTargetOrigin() + '/search?q=cache%3A';
			body.appendChild( iframe );
			syncing = true;

			// if the iframe takes too long to load, force cleanup
			syncCleanup.timeout = window.setTimeout( syncCleanup, 10000 );

			$( '#' + id.syncLink )[ 0 ].style.display = 'none';
			$( '#' + id.syncing )[ 0 ].style.display = 'inline';
			$( '#' + id.syncDone )[ 0 ].style.display = 'none';
		}
	}

	function syncIframeLoad() {
		// setTimeout in case our (greasemonkey) script runs after onload
		window.setTimeout( receivedMessage, 1000 );
	}

	function syncCleanup( success ) {
		var iframe, after;

		if ( syncing ) {
			iframe = document.getElementById( id.syncIframe );
			iframe.removeEventListener( 'load', syncIframeLoad, false );
			body.removeChild( iframe );
			syncing = false;

			after = function() {
				$( '#' + id.syncLink )[ 0 ].style.display = 'inline';
				$( '#' + id.syncing )[ 0 ].style.display = 'none';
				$( '#' + id.syncDone )[ 0 ].style.display = 'none';
			};

			if ( success ) {
				$( '#' + id.syncDone )[ 0 ].style.display = 'inline';
				window.setTimeout( after, 2000 );
			} else {
				after();
			}
		}

		window.clearTimeout( syncCleanup.timeout );
	}

	function receivedMessage( e ) {
		var me = arguments.callee,
			parent = me.parent,
			iframe = me.iframe,
			data;

		if ( !e ) { // init sync
			if ( !parent && !iframe ) {
				parent = me.parent = getToken();

				postToIframe( {
					type: 'init',
					parent: parent
				} );
			}

		} else if ( e.origin === getTargetOrigin() ) {
			data = window.JSON.parse( e.data ) || {};

			switch ( data.type ) {
			case 'init': // received init from parent, acknowledge
				if ( !parent && !iframe ) {
					parent = me.parent = data.parent;
					iframe = me.iframe = getToken();

					postToParent( {
						type: 'init-ack',
						parent: parent,
						iframe: iframe
					} );
				}
				break;

			case 'init-ack': // init complete, send options
				if ( data.parent === parent && !iframe ) {
					iframe = me.iframe = data.iframe;

					postToIframe( {
						type: 'sync',
						parent: parent,
						iframe: iframe,
						options: $.extend( {}, options )
					} );
				}
				break;

			case 'sync': // received options from parent
				if ( data.parent === parent && data.iframe === iframe ) {
					$.extend( options, data.options );
					saveOptions( options );

					postToParent( {
						type: 'sync-ack',
						parent: parent,
						iframe: iframe
					} );

					me.parent = me.iframe = true;
				}
				break;

			case 'sync-ack': // sync complete
				if ( data.parent === parent && data.iframe === iframe ) {
					syncCleanup( true );
					me.parent = me.iframe = null;
				}
				break;
			}
		}
	}

	function postToIframe( data ) {
		execScript( [
			'document.getElementById(\'', id.syncIframe, '\')',
				'.contentWindow',
					'.postMessage(\'', window.JSON.stringify( data ).replace( /\\/g, '\\\\' ).replace( /'/g, '\\\'' ), '\', \'', getTargetOrigin(), '\');'
		].join( '' ) );
	}

	function postToParent( data ) {
		execScript( [
			'if ( parent !== self ) {',
				'parent.postMessage(\'', window.JSON.stringify( data ).replace( /\\/g, '\\\\' ).replace( /'/g, '\\\'' ), '\', \'', getTargetOrigin(), '\');',
			'}'
		].join( '' ) );
	}

	function getTargetOrigin() {
		var me = arguments.callee;

		if ( !me.cached ) {
			me.cached = ( isHttp ? 'https:' : 'http:' ) + '//' + window.location.host;
		}

		return me.cached;
	}



	/*
	 * event handlers
	 */

	// show / hide options panel
	function optionsLinkClick( e ) {
		var panel = $( '#' + id.options )[ 0 ];

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

		updateLinkHrefs( links, options );
		setCacheLinkVisibility( !redirect );

		$( '#' + id.message )[ 0 ].innerHTML = redirect ?
			strings.redirectLinkExplanation :
			strings.cacheLinkExplanation.replace( /%s/g, '<a href="" id="' + id.exampleCacheLink + '" class="' + id.cacheLink + '" ' + getInlineStyle( 'a', css.cacheLink ) + '>' + options.cacheLinkText + '</a>' );
	}

	function useHttpsClick() {
		options.useHttps = this.checked;
		saveOptions( options );

		updateLinkHrefs( links, options );
	}

	function cacheLinkTextChange() {
		this.value = $.trim( this.value );
		if ( !this.value ) {
			this.value = defaultOptions.cacheLinkText;
		}

		options.cacheLinkText = this.value;
		saveOptions( options );

		updateCacheLinkText( links, options.cacheLinkText );
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

	function syncLinkClick( e ) {
		e.preventDefault();

		syncOptions();
	}

	// show / hide about panel
	function aboutLinkClick( e ) {
		var panel = $( '#' + id.about )[ 0 ];

		if ( e ) {
			e.preventDefault();
		}

		panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
	}

	// initiate check for update
	function checkLinkClick( e ) {
		e.preventDefault();

		if ( options.canCheckForUpdate && !checking ) {
			checkForUpdate( options );
		}
	}



	/*
	 * misc
	 */

	// returns the current epoch time
	function now() { return ( new Date() ).getTime(); }

	// returns a unique token string
	function getToken() { return ( Math.random() + '' ).replace( /\D/g, '' ); }

	// prepends 'googleCache' and appends a unique token to each id
	function generateIds( list ) {
		var token = getToken(), ids = {};
		$.each( list, function( i, name ) { ids[ name ] = 'googleCache' + name.charAt( 0 ).toUpperCase() + name.substring( 1 ) + token; } );
		return ids;
	}

	// runs the given script by appending a script element to the page
	function execScript( code ) {
		var script = $( '<script></script>' );
		script.appendChild( document.createTextNode( code ) );
		body.appendChild( script );
		window.setTimeout( function() { body.removeChild( script ); }, 500 ); // not sure we need to wait, but doesn't hurt?
	}

})( window, document, document.getElementsByTagName('head')[0], document.body );

