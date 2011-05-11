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

// v0.5 (?)
// - Works with cache pages under HTTPS / SSL
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
		textOptionInstructions: 'Leave a field blank to reset to default'
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

		// a unique id for elements we add to the page
	var ID = ( Math.random() + '' ).replace( /\D/g, '' ),

		// (encoded) search query (contains cache term)
		searchQuery = findSearchQuery(),

		// (encoded) cache term ("cache%3Ahttp%3A%2F%2Fwww.example.com")
		cacheTerm = findCacheTerm( searchQuery ),

		// script options
		options = restoreOptions(),

		// link details
		links;

	// we can't continue without this information
	if ( !searchQuery || !cacheTerm ) {
		return;
	}

	// save options
	saveOptions( options );

	if ( isCachePage( searchQuery ) ) {
		links = scanLinks( cacheTerm );
		if ( links.changeVersion ) {
			addExplanation( links.changeVersion.parentNode.parentNode );
		}
	} else {
		// if Google hasn't cached the original page, add a link for the original URL
		addOriginalLink( decodeURIComponent( cacheTerm ).replace( /^cache:/, '' ) );
	}



	/*
	 * functions!
	 */

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
		var style = $( '#googleCacheHideCacheLinks' + ID )[ 0 ];

		if ( !style ) {
			style = getStyleElement( 'a.googleCache' + ID, { 'display': 'none !important' }, 'googleCacheHideCacheLinks' + ID );
			head.appendChild( style );
		}

		style.disabled = style.sheet.disabled = isVisible;
	}

	// set colours for cache links
	function setCacheLinkColors() {
		var prevNormal = $( '#googleCacheCacheLinkColors' + ID )[ 0 ],
			prevHover = $( '#googleCacheCacheLinkHoverColors' + ID )[ 0 ],
			curNormal = getStyleElement( 'a.googleCache' + ID, {
				'background': options.cacheLinkBackgroundColor + ' !important',
				'color': options.cacheLinkTextColor + ' !important'
			}, 'googleCacheCacheLinkColors' + ID ),
			curHover = getStyleElement( 'a.googleCache' + ID + ':hover', {
				'background': options.cacheLinkTextColor + ' !important',
				'color': options.cacheLinkBackgroundColor + ' !important'
			}, 'googleCacheCacheLinkHoverColors' + ID );

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
		$( '#googleCacheExampleCacheLink' + ID )[ 0 ].innerHTML = text;
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
				'<span id="googleCacheMessage', ID, '"></span>&nbsp;&nbsp;',
				'<a href="" id="googleCacheOptionsLink', ID, '" ', getInlineStyle( css.options.link ), '></a>',

				'<div id="googleCacheOptions', ID, '" ', getInlineStyle( css.options.panel ), '>',
					'<input type="checkbox" id="googleCacheRedirectPageLinks', ID, '" ', getInlineStyle( css.options.input.checkbox ), ' />',
					'<label for="googleCacheRedirectPageLinks', ID, '" ', getInlineStyle( css.options.label ), '>',
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
									'<label for="googleCacheCacheLinkText', ID, '" ', getInlineStyle( css.options.label ), '>',
										strings.cacheLinkTextLabel,
									'</label>',
								'</td>',
								'<td ', getInlineStyle( css.options.td ) + '>',
									'<input type="text" id="googleCacheCacheLinkText', ID, '" value="', options.cacheLinkText, '" ', getInlineStyle( css.options.input.text ) + ' />',
								'</td>',
							'</tr>',
							'<tr>',
								'<td ', getInlineStyle( css.options.td ) + '>',
									'<label for="googleCacheCacheLinkBackgroundColor', ID, '" ', getInlineStyle( css.options.label ) + '>',
										strings.cacheLinkBackgroundColorLabel,
									'</label>',
								'</td>',
								'<td ', getInlineStyle( css.options.td ) + '>',
									'<input type="text" id="googleCacheCacheLinkBackgroundColor', ID, '" value="', options.cacheLinkBackgroundColor, '" ', getInlineStyle( css.options.input.text ) + ' />',
								'</td>',
							'</tr>',
							'<tr>',
								'<td ', getInlineStyle( css.options.td ) + '>',
									'<label for="googleCacheCacheLinkTextColor', ID, '" ', getInlineStyle( css.options.label ) + '>',
										strings.cacheLinkTextColorLabel,
									'</label>',
								'</td>',
								'<td ', getInlineStyle( css.options.td ) + '>',
									'<input type="text" id="googleCacheCacheLinkTextColor', ID, '" value="', options.cacheLinkTextColor, '" ', getInlineStyle( css.options.input.text ) + ' />',
								'</td>',
							'</tr>',
						'</table>',
						strings.textOptionInstructions
					].join( '' ) : '',

				'</div>',
			'</div>'
		].join( '' ) ) );

		link = $( '#googleCacheOptionsLink' + ID )[ 0 ];
		link.addEventListener( 'click', optionsLinkClick, false );
		optionsLinkClick.call( link );

		input = $( '#googleCacheRedirectPageLinks' + ID )[ 0 ];
		input.checked = options.redirectPageLinks;
		input.addEventListener( 'click', redirectPageLinksClick, false );
		redirectPageLinksClick.call( input );

		setCacheLinkColors();

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



	/*
	 * event handlers
	 */

	// show / hide options panel
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

		$( '#googleCacheMessage' + ID )[ 0 ].innerHTML = redirect ?
			strings.redirectLinkExplanation :
			strings.cacheLinkExplanation.replace( /%s/g, '<a href="" id="googleCacheExampleCacheLink' + ID + '" class="googleCache' + ID + '">' + options.cacheLinkText + '</a>' );
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

