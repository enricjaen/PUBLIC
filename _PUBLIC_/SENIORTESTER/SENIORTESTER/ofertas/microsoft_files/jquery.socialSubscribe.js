/*
FILE NAME:	jquery.socialSubscribe.js
DESCRIPTION:	Provides logic and event handlers for the social subscribe button.

AUTHOR:	Matthew Kuehn
CREATED:	5/8/2012 12:39:16 PM
COPYRIGHT:	2012 Jobs2Web, Inc. All Rights Reserved.

NOTE:		All information contained herein is, and remains the property of Jobs2Web, Inc.
		and its suppliers, if any. The intellectual and technical concepts contained
		herein are proprietary to Jobs2Web, Inc. and its suppliers and may be covered
		by U.S. and Foreign Patents, patents in process, and are protected by trade secret
		or copyright law. Dissemination of this information or reproduction of this material
		is strictly forbidden unless prior written permission is obtained from Jobs2Web, Inc.
*/

// Provide defaults for the j2w.ssb object.
window.j2w.ssb = $.extend({
	$activeButton : null,
	li : {
		subscribeStarted : false
	},
	presentation : ['drop','pop'],
	profileData : []
}, window.j2w.ssb);

$(function() {
	// *********************************************************************
	// ** Init
	// *********************************************************************

		var oSSSelected = j2w.ssb.profileData[0];

		// *** Init Social Networking

			// Prep LinkedIn if it has been loaded.
			if ( typeof IN !== 'undefined' ) {
				IN.Event.on(IN,'systemReady',ssbLinkedInOnLoad);
			}

			// Facebook init is done in getEndscript.cfm

		// Allow configuration of the social subscribe button presentation methods.
		if ( typeof ssbConfiguration === 'object' && ssbConfiguration.presentation ) {
			j2w.ssb.presentation = ssbConfiguration.presentation;
		}

	// *********************************************************************
	// *** Event Bindings
	// *********************************************************************

		$('.ssbShowHide').bind('click',function(event) {
			// Store which button was clicked.
			j2w.ssb.$activeButton = $(event.currentTarget).closest('.socialSubscribeButton');

			var $thisSSBForm = j2w.ssb.$activeButton.find('form.frmSocialSubscribe');

			// Hide any other open social subscribe buttons.
			$.each($('ul.btnSocialSubscribe'), function(idx,obj) {
				if ( $(this).data('ssbID') !== j2w.ssb.$activeButton.find('ul.btnSocialSubscribe').data('ssbID') ) {
					$(this).closest('form.frmSocialSubscribe').hide();
				}
			});

			// Reset any existing UI state (errors, etc.)
				$('.btnSocialSubscribe ul.sub').find('li').show().end().find('li.loading').hide();
				clearSSBErrorState();
				$('.emailGetter').hide();

			// Position the social subscribe button.
			ssbPrepareTo(j2w.ssb.presentation[j2w.ssb.$activeButton.find('ul.btnSocialSubscribe').data('ssbID')]);

			// Show or hide the button the user clicked.
			$thisSSBForm.css('display') === 'block' ? $thisSSBForm.hide() : $thisSSBForm.show();

			// Hide the social apply menu, if it is available.
			typeof closeSocialApplyOptions === 'function' ? closeSocialApplyOptions() : null;

			scrollForSSBDropDown();

			event.preventDefault();
			event.stopImmediatePropagation();
		});

		$('.btnSocialSubscribe .networkContainer').bind('mouseup',function(event) {
			var	$getter = $(this).closest('ul').find('.emailGetter'),
				$email = $getter.find('input[type=text]');

			// Keep track of the selected social network option, and populate the UI with the moretext value for it.
				oSSSelected = j2w.ssb.profileData[$(this).data('idx')];

				$('.btnSocialSubscribe .socialMoreText').html(oSSSelected.moretext).show();

				if ( !oSSSelected.moretext.length ) {
					$('.btnSocialSubscribe .socialMoreText').hide();
				}

			// Set the social subscribe type in use.
			$('form.frmSocialSubscribe').data('ssMethod',oSSSelected.shorttype);

			// Move the e-mail address getter into position.
			$getter.appendTo($(this).closest('li'));

			// If there's already a valid e-mail address in the field, we skip showing it and submit the form.
			if ( validateEmail($email.val()) ) {
				$getter.find('.start').trigger('mouseup');
			} else {
				$getter.show();
				focusSocialSubscribeInput();
			}

			scrollForSSBDropDown();
		});

		$('.btnSocialSubscribe a.startSubscribe').click(function(event) {
			event.preventDefault();
		});
		$('.btnSocialSubscribe a.startSubscribe').keyup(function(event) {
			if ( event.keyCode === 13 ) {
				$(this).closest('.networkContainer').trigger('mouseup');
			}
		});

		$('form.frmSocialSubscribe').click(function(event) {
			event.stopPropagation();
		});

		$('.btnSocialSubscribe .emailGetter input.start').bind('mouseup', function(event) {
			$(this).closest('form').trigger('submit');

			event.stopImmediatePropagation();
		});

		$('.btnSocialSubscribe .emailGetter input.start').keyup(function(event) {
			if ( event.which == 13 ) {
				$(this).closest('form').trigger('submit');
			} else if ( $(this).val().length === 0 ) {
				clearSSBErrorState();
			}
		});

		$('form.frmSocialSubscribe').bind('submit', function(event) {
			var $form = $(this);
			var $email = $form.find('input[type=text]');

			// These functions (getCheckCookie, validateEmail) are in tcJoin.js
			if ( getCheckCookie() ) {
				if ( validateEmail($email.val()) ) {
					// Hide any previous error state.
					clearSSBErrorState();

					switch ( $form.data('ssMethod') ) {
						case 'li':
							// We need to indicate that the user started this subscribe so that the authentication can respond appropriately.
							j2w.ssb.li.subscribeStarted = true;

							socialSubscribeCheckLI();
							break;

						case 'fb':
							socialSubscribeCheckFB();
							break;

						default:
							ssbSubscribeHandler({});
							break;
					}
				} else if ( $email.val().length ) {
					setSSBErrorState(jsStr.tcemailnotvalid);
					focusSocialSubscribeInput();
					scrollForSSBDropDown();
				} else {
					setSSBErrorState(jsStr.tcemailaddressrequired);
					focusSocialSubscribeInput();
					scrollForSSBDropDown();
				}
			} else {
				alert(jsStr.tccookiesmustbeenabled.unescapeHTML());
			}

			// Prevent firing of other bound events and the submission of the form itself.
			event.stopImmediatePropagation();
			event.preventDefault();
		});

		$('.btnSocialSubscribe a.helpA').bind('mouseup keyup',function(e) {
			if ( e.keyCode === 13 || e.keyCode === undefined ) {
				var $helpText = $(this).find('img').data('ht');

				if ( e.keyCode === 13 ) {
					$(this).blur();
				}

				if ( $helpText.length ) {
					alert($helpText);
				}
			}
		});

		// Set a value on each social subscribe button so that we can distinguish which is which.
		$(document).bind('ssb.setSSBIDs',function(e) {
			$.each($('ul.btnSocialSubscribe'), function(idx,obj) {
				$(this).data('ssbID',idx);

				// If the presentation method for this button is "pop", adjust the icon accordingly.
				if ( j2w.ssb.presentation[idx] === 'pop' ) {
					$(this).closest('.socialSubscribeButton').find('img.expose').addClass('rotated180');
				}
			});
		});

		// Closes the social subscribe menu when the user left-clicks outside of it. (This allows the user to right-click to paste their e-mail address, etc.)
		$(document).click(function(e) {
			if ( e.which === 1 ) {
				closeSocialSubscribeOptions();
			}
		});
});

// *********************************************************************
// ** Social Subscribe Button Generic
// *********************************************************************

	// clearSSBErrorState()
	// Clear the error state from the getter.
	function clearSSBErrorState() {
		$('.ssbGetterMsg')
			.html('')
			.hide()
			.siblings('input[name=email]')
			.removeClass('errorField');
	}

	// closeSocialSubscribeOptions()
	// Closes the SSB and cleans up.
	function closeSocialSubscribeOptions() {
		$('.btnSocialSubscribe .emailGetter,form.frmSocialSubscribe').hide();

		clearSSBErrorState();

		// Show the subscribe options and hide the "please wait" messaging.
		$('.btnSocialSubscribe ul.sub').find('li').show().end().find('li.loading').hide();
	}

	// focusSocialSubscribeInput()
	// Places focus on the SSB e-mail address input.
	function focusSocialSubscribeInput() {
		j2w.ssb.$activeButton.find('.emailGetter input[type=text]').focus().select();
	}

	// scrollForSSBDropDown()
	// If there are multiple SSBs, and the one that was clicked on is the last one on the page, scroll down to ensure all of it is visible.
	function scrollForSSBDropDown() {
		if ( $('ul.btnSocialSubscribe').length > 1 && ( j2w.ssb.$activeButton.find('ul.btnSocialSubscribe').data('ssbID') === $('ul.btnSocialSubscribe').last().data('ssbID') ) ) {
			$('html, body').scrollTop($(document).height());
		}
	}

	// ssbPrepareTo()
	// Positions a social subscribe button based on its presentation method. (pop|drop)
	function ssbPrepareTo(intent) {
		switch ( intent ) {
			case 'pop':
				j2w.ssb.$activeButton.find('div.socialSubscribe').css({position:'absolute',bottom:j2w.ssb.$activeButton.height() + 'px',left:'',top:''});
				break;

			default:
				j2w.ssb.$activeButton.find('div.socialSubscribe').css({bottom:'',top:'',left:''});
				break;
		}
	}

	// setSSBErrorState()
	// Renders a message near the SSB e-mail input field.
	function setSSBErrorState(message) {
		$('.ssbGetterMsg')
			.html(message.unescapeHTML())
			.show()
			.siblings('input[name=email]')
			.addClass('errorField');
	}

	// ssbSubscribeHandler()
	// Updates the UI and goes to subscribe.
	function ssbSubscribeHandler(options) {
		var	redirURL = '/talentcommunity/subscribe/',
			$container = j2w.ssb.$activeButton.find('.btnSocialSubscribe ul.sub'),
			beforeHeight = $container.height(),
			beforeWidth = $container.width();

		// Provide default values, but override them with those values passed in.
		options = $.extend({
			socialSrc : ''
		}, options);

		// Show the please wait indicator and hide the other options before proceeding.
		$container.find('li').toggle();
		$container.find('li.loading').css({width:beforeWidth+'px',padding:(beforeHeight-$('.loading div').height())/2+'px 0'});

		if ( options.socialSrc ) {
			redirURL += '?reviewToken=socialSubscribe&tcSetupType=social&socialSrc=' + options.socialSrc + '&email=' + j2w.ssb.$activeButton.find('.emailGetter input[type=text]').val();
		} else {
			redirURL += '?email=' + j2w.ssb.$activeButton.find('.emailGetter input[type=text]').val();
		}

		document.location.href = redirURL;
	}

// *********************************************************************
// ** Facebook-specific Functions
// *********************************************************************

	function socialSubscribeCheckFB() {
		FB.getLoginStatus(function(response) {
			if ( response.status === 'connected' ) {
				socialSubscribeFinishFB();
			} else {
				socialSubscribeLoginFB();
			}
		});
	}

	function socialSubscribeFinishFB() {
		ssbSubscribeHandler({socialSrc : 'fb'});
	}

	function socialSubscribeLoginFB() {
		FB.login(function(response) {
			if ( response.status === 'connected' ) {
				socialSubscribeFinishFB();
			}
		}, {scope: 'email'});
	}

// *********************************************************************
// ** LinkedIn-specific Functions
// *********************************************************************

	function ssbLinkedInOnLoad() {
		// On a LinkedIn auth event, which happens when a user logs in (but also when an already logged-in user visits the page), check to see if the auth came as a result of a user subscribe action or not.
		IN.Event.on(IN,'auth',function() {
			socialSubscribeLoginLI();
		});
	}

	function socialSubscribeCheckLI() {
		// If the user is correctly logged in, finish the subscribe. Otherwise, the user needs to authenticate first.
		if ( typeof IN === 'object' && typeof IN.User === 'object' && IN.User.isAuthorized() ) {
			socialSubscribeFinishLI();
		} else {
			IN.User.authorize();
		}
	}

	function socialSubscribeFinishLI() {
		ssbSubscribeHandler({socialSrc : 'li'});
	}

	function socialSubscribeLoginLI() {
		// If this auth event was fired because a user just logged in, then check to see if it is OK to finish the subscribe.
		if ( j2w.ssb.li.subscribeStarted ) {
			socialSubscribeCheckLI();
		}
	}
