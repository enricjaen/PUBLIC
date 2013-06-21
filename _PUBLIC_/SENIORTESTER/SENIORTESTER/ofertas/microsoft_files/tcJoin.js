// The base J2W object for prefs and settings.
var j2w = {
	applyID : null,
	applyInProgress : false,		// Monitors the Apply Now >> button clicked status.
	autoSkip : {
		ok : false
	},
	blockNextEnable : false,		// Flag to block the Next >> button from being enabled.
	pageAction : null,			// {subscribe|apply}
	sso : {
		enabled : false,
		apiKey : '',
		ready: false
	},
	tcFormValidationErrors : [],	// Errors from TC form validation.
	validator : {
		initial : {},			// The orignal validation rules for the business card.
		temporary : {}		// Modified validation rules for Apply with LinkedIn.
	},
	xhrAborted : false,
	xhrRequest : ''
};

// Allows accented characters from resource bundle strings to be presented correctly with JavaScript.
String.prototype.unescapeHTML = function() {
	return $('<div>' + this + '</div>').html();
};

$(function() {
	// Populate the j2w object with data.
	$.extend(window.j2w, {
		pageAction : attributes.tcaction
	});

	$('input[type=button]').addClass('ui-state-default');

	window.popupWin = null;

	$subscribeForm = $('form[name=emailsubscribe]');

	// --- Event Bindings

		// Go to Talent Community from Subscribe

			$subscribeForm.submit(function(event) {
				doSubscribe($(event.target));

				if ( typeof $gaSubscribe != 'undefined' ) {
					TrackGoogleAnalytics(
						$gaSubscribe.link,
						$gaSubscribe.id,
						$gaSubscribe.value,
						$gaSubscribe.name,
						$gaSubscribe.group,
						$gaSubscribe.site
					);
				}

				return false;

			});

		// Go to Talent Community from Apply now >>

			$('.dialogApplyBtn').click(handleApplyNowButton);

			$('.dialogApplyBtn').bind("contextmenu", function(e) {
				return false;
			});

		// Next >> Button Event

			$('#btnNextStep').live('click',handleNextButton);

		// Escape from LinkedIn Authentication

			$('#escapeLinkedIn').live('click',function(event) {
				if ( typeof j2w.xhrRequest === 'object') {
					j2w.xhrRequest.abort();
				}

				j2w.xhrAborted = true;

				presentTCBusinessCard();

				event.preventDefault();
			});
});

$(window).load(function() {
	// --- Page Main

	// Turns off agents display if the profile requested it.
	if ( typeof attributes === 'object' ) {
		if ( attributes.showagents === 'false' ) {
			$('#agentsWrapper,span.useAgents').hide();
		}

		// Honor skip business card review flags.
		if ( ( (attributes.reviewonapply === 'false' && attributes.tcaction === 'apply') || (attributes.reviewonsubscribe === 'false' && attributes.tcaction === 'subscribe') ) && attributes.reviewtoken !== undefined ) {
			j2w.autoSkip.ok = true;
		}
	}

	if ( j2w.autoSkip.ok ) {
		handleAutoSkip();
	} else {
		presentTCBusinessCard();
	}
});

// cleanURL
//
function cleanURL(_urlstring) {
	var urlstring = _urlstring;

	urlstring = urlstring.replace(/#loaded/i,'');			// Remove loaded anchor
	urlstring = urlstring.replace(/tcsource=subscribe/i,'');	// Remove tcsource var
	urlstring = urlstring.replace(/^[?&]/i,'');			// Remove leading ?&
	urlstring = urlstring.replace(/^&$/i,'');				// Remove trailing ampersand

	return urlstring;
}

// defaultPleaseWait()
// Returns the please wait message to the default and hides the activity indicator.
function defaultPleaseWait() {
	$('#dialogSavingIndicator').hide();
	setPleaseWaitMessage();
}

// doStriping()
// Stripes the agents table.
function doStriping() {
	$('#myAgents tbody tr:odd').css('backgroundColor', '#EEE');
}

// doSubscribe()
// Does subscribe.
function doSubscribe(myForm) {
	// Cookies must be enabled to use the Talent Community. 10 is 1
	if ( getCheckCookie() ) {
		if ( trySubscribe(myForm) ) {
			var	$emailField = myForm.find('[name=email]'),
				$cat = myForm.find('[name=cat]'),
				$jobid = myForm.find('[name=jobid]'),
				$q = myForm.find('[name=q]'),
				$usertype = myForm.find('[name=usertype]'),
				mode = window.location.protocol + '//';

			// Switch to https, if we're not there already, and send along enough information to open the Talent Community.
			if ( needToSwitchToSSL() ) {
				mode = 'https://';
			}

			var docPath =	mode +
					window.location.host +
					'/talentcommunity/subscribe/' +
					'?email=' + $emailField.val();

			if ( $cat.length > 0 ) {
				docPath = docPath + '&cat=' + $cat.val();
			}

			if ( $jobid.length > 0 ) {
				docPath = docPath + '&jobid=' + $jobid.val();
			}

			if ( $q.length > 0 ) {
				docPath = docPath + '&q=' + $q.val();
			}

			if ( $usertype.length > 0 && ( $.inArray($usertype.val(),['2','3','4','5']) != -1 ) ) {
				docPath = docPath + '&usertype=' + $usertype.val();
			}

			// Invoke Social Subscribe, if configured.
			if ( myForm.data('ssMethod') ) {
				docPath = docPath + '&tcSetupType=social&reviewToken=socialSubscribe&socialSrc=' + myForm.data('ssMethod');
			}

			document.location.href = docPath;
		}
	} else {
		alert(jsStr.tccookiesmustbeenabled.unescapeHTML());
	}
}

// doValidateSubscriptionForm()
// Validates the contents of the subscribe form field and returns true if OK, or raises an alert if the e-mail address is missing or not valid.
function doValidateSubscriptionForm(formData) {
	var reg = new RegExp(emailregex);
	var $theEmailField = $(formData).find('[name=email]');

	if ( reg.test($theEmailField.val()) ) {
		return true;
	} else if ( $theEmailField.val().length ) {
		alert(jsStr.tcemailnotvalid.unescapeHTML());
	} else {
		alert(jsStr.tcemailaddressrequired.unescapeHTML());
	}

	return false;
}

// finishAutoSkipReview()
// If the form is valid, submit it, otherwise, clean up and show the business card.
function finishAutoSkipReview() {
	if ( !$('#tcsignup').validate().form() ) {
		presentTCBusinessCard();
	}

	$('#btnNextStep').trigger('click');
}

// getCheckCookie()
// See if cookies are enabled in the browser.
function getCheckCookie() {
	return $.cookies.test();
}

// goToApply()
// Sends the user to apply to a job.
function goToApply(_redirect,options) {
	if ( $jobID !== null ) {
		var redirect = (typeof _redirect == 'boolean' && _redirect === true) ? true : false;
		var redirURL = '';

		var appendURL = '/talentcommunity/apply/' + $jobID + '/';

		appendURL += '?#tracked';

		// Switch to https, if we're not there already.
		redirURL = needToSwitchToSSL() ? 'https://' + window.location.host + appendURL : appendURL;

		// If options were passed in, apply them to the redirect URL.
		if ( typeof options === 'object' ) {
			redirURL = applyDestinationHelper(redirURL,options);
		}

		// If redirect is true, go to the apply url, but remove the forwarding page from the browser history.
		// The user should not be able to go back to the forwarding page.
		redirect ? window.location.replace(redirURL) : window.location.assign(redirURL);
	}
}

// handleAutoSkip()
// Determine how to auto-skip the business card.
function handleAutoSkip() {
	// By default, the auto-skip method is the same as the reviewtoken. Specific conditions may alter that.
	var autoSkipMethod = attributes.reviewtoken;

	// The socialApply reviewtoken can force a particular auto-skip type.
	if ( ( attributes.reviewtoken === 'socialApply' || attributes.reviewtoken === 'socialSubscribe' ) && typeof attributes.socialsrc === 'string' ) {
		switch ( attributes.socialsrc ) {
			case 'li':
				autoSkipMethod = 'linkedin';
				break;

			case 'fb':
				autoSkipMethod = 'facebook';
				break;

			default:
				break;
		}
	}

	switch ( autoSkipMethod ) {
		case 'AwL':
		case 'linkedin':
			setPleaseWaitMessage(jsStr.tcliwaiting);
			setPleaseWaitNotes(jsStr.tcliescape + ' <a id="escapeLinkedIn" href="">' + jsStr.tcliescapeaction + '</a>.');

			if ( typeof IN === 'object' ) {
				// Anonymous function as callback function
				IN.User.authorize((function(){}));
			}

			break;

		case 'facebook':
			setPleaseWaitMessage(jsStr.tcliwaiting.replace(/LinkedIn/g,'Facebook'));
			setPleaseWaitNotes(jsStr.tcliescape.replace(/LinkedIn/g,'Facebook') + ' <a id="escapeLinkedIn" href="">' + jsStr.tcliescapeaction + '</a>.');

			if ( typeof FB === 'object' ) {
				FB.getLoginStatus(function(response) {
					if ( response.status === 'connected' ) {
						loadFBForAutoSkip();
					}
				});
			}

			break;

		default:
			finishAutoSkipReview();

			break;
	}
}

// applyDestinationHelper()
// Applies options to the apply redirect URL.
function applyDestinationHelper(redirURL,options) {
	var aParams = [];
	var queryString = '';

	if ( typeof options.method === 'string' ) {
		switch ( options.method ) {
			case 'linkedin':
				if ( typeof options.email === 'string' ) {
					aParams.push('email=' + options.email);
					aParams.push('reviewtoken=AwL');
					aParams.push('socialSrc=li');
				}

				break;
			default:
				break;
		}
	}

	if ( aParams.length ) {
		// Create a partial query string by combining array elements into a string.
		queryString = aParams.join('&');

		// Set ? or & as the first character of the query string, depending on if ? already exists or not.
		if ( redirURL.indexOf('?') === -1 ) {
			queryString = '?' + queryString;
		} else {
			queryString = '&' + queryString;
		}

		// Put the query string in the right place, if a URL fragment is present.
		if ( redirURL.indexOf('#') !== -1 ) {
			aTmp = redirURL.split('#');
			redirURL = aTmp[0] + queryString + '#' + aTmp[1];
		} else {
			redirURL = redirURL + queryString;
		}

		// Final clean-up.
		if ( redirURL.indexOf('?&') !== -1 ) {
			redirURL = redirURL.replace('?&','?');
		}
	}

	// Return the options-modified redirect URL.
	return redirURL;
}

// goToJob()
// Determines how to get to the ATS, and sends the user there.
function goToJob() {
	var exitURL = $relocateApplyURL;

	// Modifies the apply URL when an apply ID is available.
	if ( typeof j2w.applyID === 'number' ) {
		exitURL += j2w.applyID + '/';

		// Pass the social source along, if defined.
		if ( attributes.socialsrc ) {
			switch ( attributes.socialsrc ) {
				case 'li':
					exitURL += '?type=linkedin';
					break;

				case 'fb':
					exitURL += '?type=facebook';
					break;

				default:
					break;
			}
		}
	}

	if ( typeof $myApplyURL == 'string' && $myApplyURL.length ) {
		// Determine the final redirection URL and make sure we don't count the apply twice
		var targetURL = exitURL;

		// Redirects to the ATS for the job, in a new window, if the site setup is so configured.
		if ( window.$popApply ) {
			var winSizeFactor = 0.9;

			// Calculate window width and X position
			var bodyWidth = $('body').width();
			var myWinWidth = bodyWidth * winSizeFactor;
			var myXPosition = (bodyWidth - myWinWidth)/2;

			// Calculate window height and Y position
			var bodyHeight = $('body').height();
			var myWinHeight = bodyHeight * winSizeFactor;
			var myYPosition = (bodyHeight - myWinHeight)/2;

			// Try to open the new window
			var myWindowOpenString = windowOpener(targetURL,'jobwindow','width='+ myWinWidth + ',height=' + myWinHeight + ',screenX=' + myXPosition + ',screenY=' + myYPosition + ',left=' + myXPosition + ',top=' + myYPosition + ',location=yes,status=yes,menubar=yes,resizable=yes,toolbar=yes,scrollbars=yes') ;

			// If the ATS window opens, redirect from our Talent Community apply page to the job page, otherwise, show a pop-up blocker message.
			if ( myWindowOpenString ) {
				defaultPleaseWait();

				// Return to the job page the user applied on, if available, or the home page, if not.
				attributes.tcReturnURL.length ? document.location.href = attributes.tcReturnURL : document.location.href = '/';
			} else {
				// Make sure to add the pop-up blocker message div only once
				if ( $('#popupblocker').length === 0 ) {
					$('body').append('<div id="popupblocker"></div>');

					$('#popupblocker')
						.dialog({
							autoOpen:true,
							height: 160,
							width: 500,
							modal: true,
							closeOnEscape: false,
							title: jsStr.tcpopupblockerdetected,
							draggable: true,
							resizable: false
						})
						.html('<p>Your browser blocked opening the job application in a new window.</p><p>Please allow pop-up windows for this site and <a id="tryagain" href="javascript://">try again</a>.</p>');
				} else {
					$('#popupblocker').dialog('open');
				}

				$('#tryagain').live('click',function(){
					$('#popupblocker').dialog('close');
					nextEnable();
				});
			}
		} else {
			// Open the job in the normal window
			document.location.href = exitURL;
		}
	}
}

// goToSubscribe()
// Sends the user to subscribe to the Talent Community.
function goToSubscribe(_redirect) {

	var redirect = (typeof _redirect == 'boolean' && _redirect === true) ? true : false;
	var redirURL = '';

	// Switch to https, if we're not there already.
	if ( needToSwitchToSSL() ) {
		redirURL = 'https://' + window.location.host + 'talentcommunity/subscribe/';
	} else {
		redirURL = '/talentcommunity/subscribe/';
	}

	// Include the category ID, if one exists.
	if ( typeof attributes.cat != 'undefined' && attributes.cat.length ) {
		redirURL += attributes.cat + '/';
	}

	// Include cleaned-up URL data.
	var urldata = window.location.href.slice(window.location.href.indexOf('?') + 1);
	urldata = cleanURL(urldata);

	redirURL += urldata.length > 0 ? '?' + urldata : '';
	redirURL += '#tracked';

	// If redirect is true, go to the apply url, but remove the forwarding page from the browser history.
	// The user should not be able to go back to the forwarding page.
	redirect ? window.location.replace(redirURL) : window.location.assign(redirURL);

}

// handleApplyNowButton()
// Event handler for the the Apply now >> button.
function handleApplyNowButton(event) {
	// We might be calling this function based on a non-event, in which case "event" is really an options object, and not a real event.
	var options = typeof event.handler === 'undefined' && typeof event.custom === 'boolean' && event.custom === true ? event : undefined;

	// If the user has cookies enabled, do a regular apply. If not, the default href of the button is used.
	if ( getCheckCookie() ) {
		if ( attributes.jobid ) {
			// Check to see if there is a popup apply window. If there is ... what is its status?
			var popupState = popupStatusCheck(window.popupWin);

			// The popup is gone now... so the apply should not be in progress anymore.
			if ( popupState === 0 ) {
				window.j2w.applyInProgress = false;
			}

			if ( !window.j2w.applyInProgress ) {
				// Indicate that an apply is in process and that subsequent apply now clicks should be ignored.
				window.j2w.applyInProgress = true;

				if ( popupState != 1 ) {
					// Now that it's OK to proceed, let's go ahead and track the apply in Google Analytics.
					if ( typeof $gaApply != 'undefined' ) {
						TrackGoogleAnalytics(
							$gaApply.link,
							$gaApply.id,
							$gaApply.value,
							$gaApply.name,
							$gaApply.group,
							$gaApply.site
						);
					}
				}

				// Is this site configured to use the Talent Community?
				if ( $subscribeAtApply ) {
					// Trap multiple clicks on apply now
					if ( popupState == 1 ) {
						window.popupWin.focus();
					}

					var applyDataJobID = attributes.jobid;

					// Go the the Talent Community only if the user's credentials are not valid, or if the user is new.
					j2w.xhrRequest = $.ajax({
						type:	'GET',
						url:	'/find.job?job=users.doUserCheckQuick',
						dataType: 'json',
						error: function(xhr, textStatus, errorThrown) {
							// NOTE: The keys in this object are ALL UPPERCASE.
							// var oResult = eval('(' + xhr.statusText + ')');

							recoverFromAjaxError(xhr);
						},
						success: function(oResult) {
							// The path varies depending on whether the user is a valid, logged in user or not.
							if ( !oResult.ISVALIDUSER ) {
								// For people who aren't logged in, present the SSO login or direct them to the Talent Community.
								( j2w.sso && j2w.sso.enabled && j2w.sso.ready ) ? j2w.sso.showStack('viewRMPLogin') : goToApply(false,options);
							} else {
								var applyType = '';

								if ( typeof options === 'object' ) {
									applyType = (typeof options.method == 'string' && options.method === 'linkedin') ? 'linkedin' : 'default';
								}

								// Since the user is already logged in, track the apply and go directly to the job.
								// Only proceed if there is not another window open.
								if ( popupState != 1 ) {
									// Begin SSO, or proceed normally if SSO is not available.
									( j2w.sso && j2w.sso.enabled && j2w.sso.ready ) ? ssoIDCheck() : countApplyGoToJob(applyType,applyDataJobID);
								}
							}
						}
					});

					// Prevents the <a> href from being executed.
					eventPreventer(event);
				} else {
					// This is not a subscribe at apply... so let's just go to the job in the ATS.

					// stop the _blank link click execution and let's do our own window opening. This way we can track to see if the window is still open.
					eventPreventer(event);

					if ( popupState != 1 ) { // if the window is not already open... go to the job
						goToJob();
					}
					else {
						window.popupWin.focus(); // otherwise... raise focus on the window that is already open.
					}
				}
			} else {
				eventPreventer(event);

				// Focus the apply window if there is one to be focused.
				if ( popupState == 1 ) {
					window.popupWin.focus();
				}
			}
		}
	}
}

// countApplyGoToJob
// Records a user's apply and goes to the job.
function countApplyGoToJob(applyType,applyDataJobID) {
	j2w.xhrRequest = $.ajax({
		type:	'GET',
		url:	'/find.job?job=users.updateUserJobApply',
		data:	'applyType='	+ applyType +
			'&jobID='	+ applyDataJobID,
		dataType: 'json',
		error: function(xhr, textStatus, errorThrown) {
			recoverFromAjaxError(xhr);
		},
		success: function(data) {
			setApplyID(data.APPLYID);

			goToJob();
		}
	});
}

// eventPreventer()
// Prevents the default event, if the event passed in is a real event.
function eventPreventer(event) {
	if ( typeof event.target === 'object' && event.target ) {
		event.preventDefault();
	}
}

// handleNextButton()
// Event handler for the the Next >> button.
function handleNextButton() {
	scrubProfileForm();

	if ( document.tcsignup ) {
		if ( $('#tcsignup').validate().form() ) {
			setPleaseWaitMessage(jsStr.tcsavingprofile);
			$('#dialogSavingIndicator').show();

			nextDisable();

			var email = $('#tcContent #email').val();

			j2w.xhrRequest = $.ajax({
				type:	'GET',
				url:	'/find.job?job=users.doValidateUserCredentials',
				data:	'email=' + email,
				dataType: 'json',
				cache: false,
				error: function(xhr, textStatus, errorThrown) {
					recoverFromAjaxError(xhr);
				},
				success: function(oResult) {
					var checkUserInTC = {
						'isNew'		: oResult.ISNEWUSER,
						'passwordValid'	: oResult.HASVALIDCREDENTIALS
					};

					// If this user already exists, but their cookie credentials are not valid, prompt them to login.
					if ( !checkUserInTC.isNew && !checkUserInTC.passwordValid ) {
						defaultPleaseWait();
						nextEnable();
						presentTCBusinessCard();

						if ( j2w.sso && j2w.sso.ready ) {
							j2w.sso.setEmailPwd(email,$('#tcContent #password').val());

							j2w.sso.showStack('viewRMPExistingLogin');
						} else {
							alert(jsStr.tcalreadyauserofthissite.unescapeHTML());
						}
					} else {
						if ( j2w.sso && j2w.sso.ready ) {
							j2w.sso.setEmailPwd(email,$('#tcContent #password').val());
						}

						saveInfo();
					}
				}
			});
		} else {
			alert(j2w.tcFormValidationErrors.join('\n').unescapeHTML());
		}
	} else {
		goToJob();
	}
}

// needToSwitchToSSL()
// Returns {true|false} indicating if a switch to HTTPS protocol is necessary.
function needToSwitchToSSL() {
	var pageUsingHTTPS = 'https:' == document.location.protocol ? 1 : -1;

	return pageUsingHTTPS == -1 && attributes.usessl == 1;
}

// nextDisable()
// Disables the next button.
function nextDisable() {
	$('#btnNextStep').attr('disabled', 'disabled');
}

// nextEnable()
// Enables the next button.
function nextEnable() {
	// Make sure the button is displayed first.
	$('#btnNextStep').show();
	// If enabling of the Next button has not been blocked, enabled the Next button.
	if ( window.j2w.blockNextEnable === false ) {
		$('#btnNextStep').removeAttr('disabled');
	}
}

// popupStatusCheck()
//
function popupStatusCheck(_popup) {
	/*
	 * Returns 1 of 3 possible values
	 * -1: there is no popup window so we should be ok to proceed with tracking the apply
	 * 1: the popup is created and open.  This will likely be used to halt further execution of the apply process.  It should be already in progress so there is no need for further action
	 * 0: the popup was created at one time, but has since been closed.  This will likely be used to set the applyinprogress back to false and we should allow the apply to proceed.
	*/

	// is the window variable an object yet?
	if ( typeof _popup == 'object' ) {
		// the window will be an object, but if the window has never been opened, it will be null.
		if ( _popup !== null ) {
			// if the window has been opened at one time, check to see if it is still open.
			return _popup.closed === false ? 1 : 0;
		} else {
			return -1;
		}
	}
}

// presentTCBusinessCard()
// Recovers from a failed auto-skip by resetting the UI and presenting the business card for the user to fix any validation errors.
function presentTCBusinessCard() {
	// Restore form validation, if it was temporarily overridden.
	restoreValidation();

	$('#dialogSavingIndicator').hide();
	$('#talentCommunityLoading').hide();
	$('#talentCommunityWrapper').show();

	$('#tcsignup input[type=text]').first().focus();

	return true;
}

// recoverFromAjaxError
// Ensures the business card is in a ready state after an error, optionally alerting the user.
function recoverFromAjaxError(xhr,customMessage) {
	// Alert the user, unless they aborted a request manually.
	if ( xhr.statusText !== 'abort' ) {
		if ( typeof customMessage === 'string' && customMessage.length ) {
			alert(customMessage.unescapeHTML());
		} else {
			alert(jsStr.tcsorrygenericerror.unescapeHTML());
		}
	}

	nextEnable();
	defaultPleaseWait();
	presentTCBusinessCard();
}

// redirectToSignup()
//
function redirectToSignup() {
	if ( window.location.hash.search(/#loaded/ig) == -1 && (attributes.tcsource == 'apply' || attributes.tcsource == 'subscribe') && attributes.istcon == 1) {
		// *** Honor tcsource requests

		// Change the URL to prevent the Talent Community redirect from happening if the user uses the Back button in their browser.
		window.location.replace(location.href + '#loaded');

		switch ( attributes.tcsource ) {
			case 'apply':
				goToApply(true);
				break;

			case 'subscribe':
				goToSubscribe(true);
				break;
			default:
				break;
		}
	}
}

// restoreValidation()
// Removes the temporary validation rules and replaces them with the original rules
function restoreValidation() {
	if ( !$.isEmptyObject(j2w.validator.initial) ) {
		$('#tcsignup').validate().settings.rules = j2w.validator.initial;
	}
}

// setAgentsFocus()
// Focus the first visible field in the Talent Community Add/Edit Agent form.
function setAgentsFocus() {
	$('#tcAgentForm input:visible').first().focus();
	nextEnable();
}

// setApplyID
//
function setApplyID(userApplyID) {
	j2w.applyID = parseInt(userApplyID);
}

// setPleaseWaitMessage()
// Sets the text of the please wait message.
function setPleaseWaitMessage(message) {
	if ( typeof message == 'string' && message.length ) {
		$('#pleaseWaitStatus,#talentCommunityLoadingStatusText').html(message);
	} else {
		$('#pleaseWaitStatus,#talentCommunityLoadingStatusText').html(jsStr.tcpleasewait);
	}
}

// setPleaseWaitNotes()
// Sets the text of the please wait notes.
function setPleaseWaitNotes(message) {
	if ( typeof message == 'string' && message.length ) {
		$('#talentCommunityLoadingStatusAddlNotes').html(message);
	} else {
		$('#talentCommunityLoadingStatusAddlNotes').html('');
	}
}

// ssoIDCheck()
// Checks to see if the specified user already has an SSO ID.
function ssoIDCheck() {
	j2w.xhrRequest = $.ajax({
		type:	'POST',
		url:	'/ajax/atsAccountCheck/',
		data:	'email=' + j2w.sso.email,
		dataType: 'json',
		error: function(xhr, textStatus, errorThrown) {
			recoverFromAjaxError(xhr);
		},
		success: function(data) {
			if ( !data.userHasATSUserID ) {
				// If we have all the information we need, we can create a new ATS account.
				if ( j2w.sso && j2w.sso.email && j2w.sso.pwd ) {
					ssoATSCreate(j2w.sso.email,j2w.sso.pwd,j2w.sso.atsCreationResponseCheck);
				} else {
					j2w.sso.showStack('viewRMPAuth');
				}
			} else {
				countApplyGoToJob('apply',j2w.sso.jobID);
			}
		}
	});
}

// ssoATSCreate()
// Creates an ATS account for the specified user.
function ssoATSCreate(email,pwd,callback) {
	j2w.xhrRequest = $.ajax({
		type:	'POST',
		url:	'/ajax/atsAccountCreation/',
		data:	'email=' + j2w.sso.email +
			'&password=' + j2w.sso.caramelize(j2w.sso.pwd),
		dataType: 'json',
		error: function(xhr, textStatus, errorThrown) {
			goToJob();
		},
		success: function(data) {
			callback(data);
		}
	});
}

// trySubscribe()
// Checks to see if everything is OK for subscribing via the Talent Community.
function trySubscribe(myForm) {
	var $emailField = myForm.find('[name=email]');

	// Trim the e-mail form field to prevent e-mail validation from failing because of leading or trailing spaces.
	$emailField.val($.trim($emailField.val()));

	// Make sure the form data passes validation
	return doValidateSubscriptionForm(myForm);
}

// validateEmail()
// Validates an e-mail address.
function validateEmail(src) {
	var regex = new RegExp(emailregex);
	return regex.test(src);
}

// windowOpener
// Reuses an open window or opens the URL in a new window.
function windowOpener(url, name, args) {
	var success = true;

	if ( typeof popupWin != 'object' ) {
		window.popupWin = window.open(url, name, args);
	} else {
		if ( window.popupWin && !window.popupWin.closed ) {
			window.popupWin.location.href = url;
		} else {
			window.popupWin = window.open(url, name, args);
		}
	}

	// If the pop-up window was successful (not blocked) then focus it. Otherwise, set an error status.
	if ( window.popupWin ) {
		window.popupWin.focus();
	} else {
		success = false;
	}

	return success;
}

// TCJoin loaded?
var tcJoinLoaded = true;