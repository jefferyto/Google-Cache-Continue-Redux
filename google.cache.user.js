// Google Cache Continue Redux
// Based on Google Cache Continue by Jonathon Ramsey
// v0.5

// Copyright (C) 2005-2011 by
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
// - Options can be saved in Chrome, if the cache page comes from webcache.googleusercontent.com
//   Also, options cannot be shared across HTTP and HTTPS cache pages
// - Cache link text change takes effect immediately, instead of after page reload
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

(function( window, document, head, undefined ) {

	/*
	 * user editable parts, start!
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

		// instruction text for text options
		textOptionInstructions: 'Leave a field blank to reset to default',

		// if the cache page host matches this, then we can save options in Chrome
		// http and https pages will have separate options though :-(
		cacheHost: 'webcache.googleusercontent.com',

		// prefix for values stored in localStorage
		localStoragePrefix: 'greasemonkey.scriptvals.http://www.thingsthemselves.com/greasemonkey//Google Cache Continue Redux.'
	},

	// modify these to change the appearance of things
	css = {
		cacheLink: {
			'position': 'static',
			'display': 'inline',
			'visibility': 'visible',
			'margin': '0.3ex',
			'padding': '0 0.6ex 0.4ex 0.3ex',
			'border': 'none',
			'font': 'normal bold x-small sans-serif',
			'text-align': 'left',
			'text-decoration': 'none',
			'text-transform': 'none',
			'letter-spacing': 'normal',
			'word-spacing': 'normal',
			'vertical-align': 'baseline',
			'cursor': 'pointer'
		},

		uncached: {
			'position': 'static',
			'display': 'block',
			'visibility': 'visible',
			'width': 'auto',
			'height': 'auto',
			'margin': '1em 0;',
			'padding': '1ex 0.5ex',
			'border': '1px solid #3366CC',
			'font-family': 'inherit',
			'font-style': 'normal',
			'font-variant': 'normal',
			'font-weight': 'normal',
			'font-stretch': 'normal',
			'font-size': 'inherit',
			'font-size-adjust': 'none',
			'line-height': 'inherit',
			'background': 'transparent',
			'color': 'black',
			'text-align': 'left',
			'text-decoration': 'none',
			'text-transform': 'none',
			'letter-spacing': 'normal',
			'word-spacing': 'normal',
			'vertical-align': 'baseline',
			'cursor': 'auto'
		},

		explanation: {
			'position': 'static',
			'display': 'block',
			'visibility': 'visible',
			'width': 'auto',
			'height': 'auto',
			'margin': '1em 0;',
			'padding': '1ex 0.5ex',
			'border': '1px solid #3366CC',
			'font-family': 'inherit',
			'font-style': 'normal',
			'font-variant': 'normal',
			'font-weight': 'normal',
			'font-stretch': 'normal',
			'font-size': 'inherit',
			'font-size-adjust': 'none',
			'line-height': 'inherit',
			'background': 'transparent',
			'color': 'black',
			'text-align': 'left',
			'text-decoration': 'none',
			'text-transform': 'none',
			'letter-spacing': 'normal',
			'word-spacing': 'normal',
			'vertical-align': 'baseline',
			'cursor': 'auto'
		},

		options: {
			panel: {
				'margin-top': '0.5em'
			},

			link: {
			},

			input: {
				checkbox: {
					'vertical-align': 'middle'
				},

				text: {
				}
			},

			label: {
				'vertical-align': 'middle'
			},

			table: {
				'margin': '0.5em 0',
				'border-collapse': 'collapse'
			},

			th: {
			},

			td: {
				'padding-right': '5px'
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

		// script options
		options = restoreOptions(),

		// element ids
		id = {
			cacheLink: 'Link', // this is actually used as a classname
			hideCacheLinks: 'HideCacheLinks',
			cacheLinkColors: 'CacheLinkColors',
			cacheLinkHoverColors: 'CacheLinkHoverColors',
			exampleCacheLink: 'ExampleCacheLink',
			message: 'Message',
			optionsLink: 'OptionsLink',
			options: 'Options',
			redirectPageLinks: 'RedirectPageLinks',
			cacheLinkText: 'CacheLinkText',
			cacheLinkBackgroundColor: 'CacheLinkBackgroundColor',
			cacheLinkTextColor: 'CacheLinkTextColor'
		},

		// link details
		links;

	// we can't continue without this information
	if ( !searchQuery || !cacheTerm ) {
		return;
	}

	// save options
	saveOptions( options );

	// make element ids unique
	uniqueifyIds( id );

	if ( isCachePage( searchQuery ) ) {
		links = scanLinks( cacheTerm );
		if ( links.changeVersion ) {
			addExplanation( links.changeVersion.parentNode.parentNode );
		}
	} else {
		// if Google hasn't cached the original page, add a link for the original URL
		addOriginalLink( decodeURIComponent( cacheTerm ).replace( /^cache:/, '' ) );
	}

	// cleanup
	window.addEventListener( 'unload', function() {
		window.removeEventListener( 'unload', arguments.callee, false );
		searchQuery = cacheTerm = options = id = links = null;
	}, false );



	/*
	 * functions!
	 */



	// returns a unique token string
	function getToken() { return ( Math.random() + '' ).replace( /\D/g, '' ); }

	// prepends 'googleCache' and appends a unique token to each id
	function uniqueifyIds( id ) {
		var token = getToken();
		$.each( id, function( prop, val ) { id[ prop ] = 'googleCache' + val + token; } );
	}



	/*
	 * save / restore options
	 */

	// returns true if the browser supports GM_getValue / GM_setValue
	function canSaveOptions() {
		var me = arguments.callee, result;

		function test() {
			var name = 'testOption', token = getToken(), value;

			try {
				GM_setValue( name, token );
				value = GM_getValue( name );
				GM_setValue( name, '' );
			} catch (e) {
				value = null;
			}

			return value === token;
		}

		if ( me.cached === undefined ) {
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
			}

			me.cached = result;
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
					cacheLink = $( '<a href="' + cacheHref + '" class="' + id.cacheLink + '" ' + getInlineStyle( css.cacheLink ) + '>' + options.cacheLinkText + '</a>' );

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

	// returns a style element for the given selector and rules
	function getStyleElement( selector, rules, id ) {
		var buf = [ '<style id="', id || '', '" type="text/css">', selector, '{' ];

		$.each( rules, function( prop, val ) { buf.push( prop, ':', val, ';' ); } );

		buf.push('}</style>');

		return $( buf.join( '' ) );
	}

	// returns a string for the given rules object
	function getInlineStyle( rules ) {
		var buf = [ 'style="' ];

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
	function updateLinkHrefs( list, isOriginalHref ) {
		var prop = isOriginalHref ? 'href' : 'cacheHref';
		$.each( list, function() { this.link.href = this[ prop ]; } );
	}

	// updated link text for cache links
	function updateCacheLinkText( list, text ) {
		$( '#' + id.exampleCacheLink )[ 0 ].innerHTML = text;
		$.each( list, function() { this.cacheLink.innerHTML = text; } );
	}

	// adds a link for the original URL to the Google search results page
	// safer to add after the list of suggestions
	function addOriginalLink( url ) {
		var ul = $( 'ul' )[ 0 ],
			msg = strings.uncached.replace( /%s/g, '<a href="' + ( url.indexOf( '://' ) === -1 ? 'http://' : '' ) + url + '">' + url + '</a>' );

		if ( ul ) {
			$.insertAfter( $( '<p ' + getInlineStyle( css.uncached ) + '>' + msg + '</p>' ), ul );
		}
	}

	// adds our explanation text and option panel to the cache page header
	function addExplanation( container ) {
		var link, input;

		// OMG this is ugly
		container.appendChild( $( [
			'<div ', getInlineStyle( css.explanation ), '>',
				'<span id="', id.message, '"></span>&nbsp;&nbsp;',
				'<a href="" id="', id.optionsLink, '" ', getInlineStyle( css.options.link ), '></a>',

				'<div id="', id.options, '" ', getInlineStyle( css.options.panel ), '>',
					'<input type="checkbox" id="', id.redirectPageLinks, '" ', getInlineStyle( css.options.input.checkbox ), ' />',
					'<label for="', id.redirectPageLinks, '" ', getInlineStyle( css.options.label ), '>',
						strings.redirectPageLinksLabel,
					'</label>',

					canSaveOptions() ? [
						'<table cellpadding="0" cellspacing="0" border="0" ', getInlineStyle( css.options.table ), '>',
							'<tr>',
								'<th colspan="2" ', getInlineStyle( css.options.th ), '>',
									strings.cacheLinkOptions,
								'</th>',
							'</tr>',
							'<tr>',
								'<td ', getInlineStyle( css.options.td ) + '>',
									'<label for="', id.cacheLinkText, '" ', getInlineStyle( css.options.label ), '>',
										strings.cacheLinkTextLabel,
									'</label>',
								'</td>',
								'<td ', getInlineStyle( css.options.td ) + '>',
									'<input type="text" id="', id.cacheLinkText, '" value="', options.cacheLinkText, '" ', getInlineStyle( css.options.input.text ) + ' />',
								'</td>',
							'</tr>',
							'<tr>',
								'<td ', getInlineStyle( css.options.td ) + '>',
									'<label for="', id.cacheLinkBackgroundColor, '" ', getInlineStyle( css.options.label ) + '>',
										strings.cacheLinkBackgroundColorLabel,
									'</label>',
								'</td>',
								'<td ', getInlineStyle( css.options.td ) + '>',
									'<input type="text" id="', id.cacheLinkBackgroundColor, '" value="', options.cacheLinkBackgroundColor, '" ', getInlineStyle( css.options.input.text ) + ' />',
								'</td>',
							'</tr>',
							'<tr>',
								'<td ', getInlineStyle( css.options.td ) + '>',
									'<label for="', id.cacheLinkTextColor, '" ', getInlineStyle( css.options.label ) + '>',
										strings.cacheLinkTextColorLabel,
									'</label>',
								'</td>',
								'<td ', getInlineStyle( css.options.td ) + '>',
									'<input type="text" id="', id.cacheLinkTextColor, '" value="', options.cacheLinkTextColor, '" ', getInlineStyle( css.options.input.text ) + ' />',
								'</td>',
							'</tr>',
						'</table>',
						strings.textOptionInstructions
					].join( '' ) : '',

				'</div>',
			'</div>'
		].join( '' ) ) );

		link = $( '#' + id.optionsLink )[ 0 ];
		link.addEventListener( 'click', optionsLinkClick, false );
		optionsLinkClick.call( link );

		input = $( '#' + id.redirectPageLinks )[ 0 ];
		input.checked = options.redirectPageLinks;
		input.addEventListener( 'click', redirectPageLinksClick, false );
		redirectPageLinksClick.call( input );

		setCacheLinkColors();

		if ( canSaveOptions() ) {
			$( '#' + id.cacheLinkText )[ 0 ].addEventListener( 'change', cacheLinkTextChange, false );
			$( '#' + id.cacheLinkBackgroundColor )[ 0 ].addEventListener( 'change', cacheLinkBackgroundColorChange, false );
			$( '#' + id.cacheLinkTextColor )[ 0 ].addEventListener( 'change', cacheLinkTextColorChange, false );
		}

		window.addEventListener( 'unload', function() {
			window.removeEventListener( 'unload', arguments.callee, false );

			$( '#' + id.optionsLink )[ 0 ].removeEventListener( 'click', optionsLinkClick, false );
			$( '#' + id.redirectPageLinks )[ 0 ].removeEventListener( 'click', redirectPageLinksClick, false );

			if ( canSaveOptions() ) {
				$( '#' + id.cacheLinkText )[ 0 ].removeEventListener( 'change', cacheLinkTextChange, false );
				$( '#' + id.cacheLinkBackgroundColor )[ 0 ].removeEventListener( 'change', cacheLinkBackgroundColorChange, false );
				$( '#' + id.cacheLinkTextColor )[ 0 ].removeEventListener( 'change', cacheLinkTextColorChange, false );
			}
		}, false);
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

		updateLinkHrefs( links, !redirect );
		setCacheLinkVisibility( !redirect );

		$( '#' + id.message )[ 0 ].innerHTML = redirect ?
			strings.redirectLinkExplanation :
			strings.cacheLinkExplanation.replace( /%s/g, '<a href="" id="' + id.exampleCacheLink + '" class="' + id.cacheLink + '" ' + getInlineStyle( css.cacheLink ) + '>' + options.cacheLinkText + '</a>' );
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

})( window, document, document.getElementsByTagName('head')[0] );

