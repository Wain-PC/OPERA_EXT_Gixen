 // ==UserScript==
// @include http://ebay.com/itm/*
// @include https://ebay.com/itm/*
// @include http://*.ebay.com/itm/*
// @include https://*.ebay.com/itm/*
// @include       http://www.ebay.co.uk/itm/*
// @include       http://www.ebay.nl/itm/*
// @include       http://www.ebay.ch/itm/*
// @include       http://www.ebay.at/itm/*
// @include       http://www.ebay.de/itm/*
// @include       http://www.ebay.in/itm/*
// @include       http://www.ebay.ie/itm/*
// @include       http://www.ebay.nl/itm/*
// @include       http://www.ebay.ph/itm/*
// @include       http://www.ebay.pl/itm/*
// @include       http://www.ebay.com.hk/itm/*
// @include       http://www.benl.ebay.be/itm/*
// @include       http://cgi.ebay.*
// @include       http://www.befr.ebay.be/itm/*
// @include       http://www.ebay.it/itm/*
// @include       http://www.ebay.com.my/itm/*
// @include       http://www.ebay.com.sg/itm/*
// @include       http://www.ebay.es/itm/*
// @include       http://www.ebay.com.au/itm/*
// @include       http://www.ebay.ca/itm/*
// @include	      http://www.ebay.fr/itm/*
// ==/UserScript==

var LOGIN;

 function sendLoginMessage()
    {
	var login = window.$("#enterGixenLogin").val();
	var password = window.$("#enterGixenPassword").val();
	if(login && password) {
	var data={'message':'login','login':login,'password':password};
	opera.extension.postMessage(data);	// send message from injected script to background process
	openGixenPopup('login_loading');
	return true;
	}
	else { alert("Please enter your login and password"); return false;}
    }
	
function sendAddSnipeMessage(isEdited) {
var maxBid;
if(!isEdited) { maxBid = window.$("input[name=\"maxbid\"]").val(); }
else { maxBid = window.$("#editGixenSnipeValue").val(); }

var itemId = window.$(".iti-eu-txt.iti-eu-pd.u-flR.iti-ncntr :first-child").html();
if(!itemId) itemId = window.$('#itm_num').html();
if(itemId) {
			if(isNumber(maxBid)) {
					var data;
					if(!isEdited) {
						data={'message':'addsnipe','itemid':itemId,'maxbid':maxBid};
						}
					else {
						data={'message':'editsnipe','itemid':itemId,'maxbid':maxBid};
					}
					opera.extension.postMessage(data);
					return true;
			}
			else { alert("Please enter your bid"); return false; }
		}
		else { alert ("Apologies, can not identify item id. Please write a bug report about that."); return false; }
    }
	
	
function sendActionMessage() {
var maxBid = window.$("input[name=\"maxbid\"]").val();

if (isNumber(maxBid)) {

	var data={'message':'action'};
	opera.extension.postMessage(data);
	openGixenPopup('add_loading'); 
	return true;
}
else { alert("Please input valid snipe value!"); return false; }
}


function receiveMessage(event)
    {
    var message=event.data.message;
		if(message=='got_login') { 
			LOGIN = event.data.login;
		}
	
		else if(message=='login_success') {
			if(sendAddSnipeMessage(false)) {
				openGixenPopup('add_loading',function() {
					showGixenPopupMessage('Login success, placing your snipe now...'); 
					});
				}
			 }
		else if (message=='login_required') { openGixenPopup('login',
			function() {
				addValueToField('enterGixenLogin',LOGIN);
				}
			);
		}//Trying to log in to Gixen 
		else if (message=='login_failed') {
			openGixenPopup('login',function() {
				if(LOGIN) {
					addValueToField('enterGixenLogin',LOGIN);
					window.$("#editGixenSnipeValue").focus();
				}
				showGixenPopupMessage('Your eBay login or password is incorrect. Please log in again!');
				}
			); 
		} 
		
		else if (message=='snipe_add_success') openGixenPopup('add_success');
		else if (message=='snipe_already_exists') {
		openGixenPopup('edit',function() {
			showGixenPopupMessage(event.data.maxbid);
			var itemValue = window.$("#MaxBidId").val();
			addValueToField('editGixenSnipeValue',itemValue);
			window.$("#editGixenSnipeValue").focus();
			});
			}
		else if (message=='snipe_add_failed') {
			openGixenPopup('add_success',function() {
				showGixenPopupMessage("Adding the snipe has failed for some reason. Sorry for that =( ");
				});
			}
    }
	
function initialize() {
	opera.postError('INITIALIZE STARTED');
	opera.extension.postMessage({'message':'ready'});
	addPageElements();
}

function addPageElements() {
	opera.postError('ADDPAGEELEMENTS STARTED');

	var url = window.location.host;
	var $bidButton, gixenButtonHTML;
	if((url=="www.ebay.com") || (url=="cgi.ebay.com")) {
		$bidButton = window.$("span a#bidBtn_btn");
		gixenButtonHTML = "<span class=\"s bl vib vibs1\"><a id=\"bidBtn_gixen\" class=\"bt\">									Place Gixen Snipe</a></span>";
		$bidButton.after("</br></br>"+gixenButtonHTML);	
		window.$("#bidBtn_gixen").on('click',function(e) {
			sendActionMessage(); //all the magic starts here!	
			});
	}
	else {
		opera.postError('NOT EBAY HOST STARTED');
		loadJQuery(function() {
			$bidButton = window.$(".bn-b");
			gixenButtonHTML = "<span class=\"bn-b\"><input id=\"bidBtn_gixen\" value=\"Place Gixen Snipe\" type=\"submit\"></span>";
		$bidButton.parent().after("</br></br>"+gixenButtonHTML);	

		window.$("#bidBtn_gixen").on('click',function(e) {
			e.preventDefault();
			sendActionMessage(); //listener is added here as the request is asyncronous	
			});		
			
		});	
}
}

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}





function loadJQuery(callback) {
	var fileObj = opera.extension.getFile("/jquery-1.9.1.min.js");
        
        if (fileObj) {
            var fr = new FileReader();
			fr.onload = function(e) {
				var contents = document.createTextNode(e.target.result);
				var body = document.getElementsByTagName('body')[0];
					if(body) { 
						var _script = document.createElement('script');
						_script.appendChild(contents);
						body.appendChild(_script);
						opera.postError("JQuery is loaded");
						if(callback) callback();
					}
					else opera.postError("Cannot identify <body> tag!");
				};
				
			fr.readAsText(fileObj);
		}
		else alert("Couldn't load JQuery");

}

function openGixenPopup(popup_mode,callback) {

closeGixenPopup(); //Closing previously opened popups, if any exist

var path = '/popups/gixen_'+popup_mode+'_popup.html';
	
		var fileObj = opera.extension.getFile(path);
        
        if (fileObj) {
            // Read out the File object as a Data URI:
            var fr = new FileReader();
			fr.onload = function(e) {
				var PopupContents = e.target.result;
				window.$("body").append(PopupContents);
				setGixenPopupPosition();
				addWindowEventListeners();
				if(callback) callback();
				};
			fr.readAsText(fileObj);
		}
		else alert("Couldn't load popup login window");
}

function closeGixenPopup() {
window.$("#gixenPopupWindow, #gixenWindowBackground").remove();
}

function setGixenPopupPosition() {
	var width = window.$(window).width();
	var height = window.$(window).height();
	
	window.$("#gixenPopupWindow").css({'top':(height/2)-175,'left':(width/2)-245});
}

function showGixenPopupMessage(message) {
window.$("#messageField").html(message);
}

function addWindowEventListeners() {

window.$("#popupFormLogin").on('submit',function(e) {
	e.preventDefault();
	window.$("#loginToGixen").trigger('click');
});

window.$("#popupFormEdit").on('submit',function(e) {
	e.preventDefault();
	window.$("#editGixenSnipe").trigger('click');
});


window.$("#loginToGixen").on('click',function(e) {
	sendLoginMessage();
	});

window.$("#editGixenSnipe").on('click',function(e) {
	if(sendAddSnipeMessage(true)) {
		openGixenPopup('add_loading',function() { showGixenPopupMessage('Placing your new snipe now, this may take a few moments...'); });
	}

});

window.$("#closeGixenPopupWindow, #CancelCloseGixenPopupWindow").on('click',function(e) {
	closeGixenPopup();
});

window.$(window).resize(function() {
	setGixenPopupPosition();
});
}

function addValueToField(fieldId,value) {
window.$('#'+fieldId).val(value);
}

window.addEventListener('DOMContentLoaded',initialize,false);
opera.extension.onmessage = receiveMessage;
