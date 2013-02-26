/*
TODO:
1. Add button to toolbar with gixen login status and number of snipes pending
*/

var injected_script_link; // we use this to identify the page we're processing
var storage = widget.preferences;
var USERNAME=storage.login;

//assign above function to event handler
opera.extension.onmessage = receiveMessage;

function receiveMessage(event) { //function receives all the incoming messages and starts corresponding functions
injected_script_link=event.source;	// save link to injected script that sent this message
if(event.data.message=='ready') { //Injected script is ready to roll
	if(USERNAME) {
		setNewPreferencesLogin(USERNAME); // Send it user login saved in Settings
	}
}

else if(event.data.message=='action') { //check if we've already been logged in to Gixen

		sendGetHomePageRequest(function(data) { //Send request to get default homePage
			if(analyzeServerLoginResponse(data))  { //Page analyzer shows that we're logged in
				injected_script_link.postMessage({'message':'login_success'});
			}
			else injected_script_link.postMessage({'message':'login_required'}); //We're NOT logged in
		});
}
else if(event.data.message=='login') { //need to launch login process
	sendLoginRequest(event.data.login,event.data.password); //sending login request to server
	setNewPreferencesLogin(event.data.login); //if the username is different than saved one, replace it 
	}
else if(event.data.message=='addsnipe') { addSnipe(event.data.itemid,event.data.maxbid,false); }
else if(event.data.message=='editsnipe') { addSnipe(event.data.itemid,event.data.maxbid,true); }
else opera.postError("Gixen extension received unknown message!");
}

function sendLoginRequest(login,password)
    {
	USERNAME = login;
	var params = "username="+ encodeURIComponent(login) +"&password="+ encodeURIComponent(password) +"&signin=signin&Submit=Log+in+Now";
	//making request' params string
	makeAjaxRequest('POST',"http://www.gixen.com/home_1.php",params,function(data) { //sending login AJAX request
			if(analyzeServerLoginResponse(data)) sendGetHomePageRequest(function() { //if pageAnalyzer shows login success
							injected_script_link.postMessage({'message':'login_success'}); //then make the injected script to know that
				});
			else injected_script_link.postMessage({'message':'login_failed'}); //pageAnalyzer shows that login wasn't successful
	});

    }
	
	
function sendGetHomePageRequest(callback) //getting default home page HTML from Gixen server, that launch a callback to process it
    {
	var params = "gixenlinkcontinue=1&username="+encodeURIComponent(USERNAME);
	var url = "http://www.gixen.com/home_2.php?username="+USERNAME;
	makeAjaxRequest('POST',url,params,function(data) {
		callback(data);
	});
    }
	
function addSnipe(itemId,maxBid,isModified) { //Adding snipe. If the item already exists, isModified argument must be true
	var params = "newitemid="+ encodeURIComponent(itemId) +"&newmaxbid="+ encodeURIComponent(maxBid)+"&username="+encodeURIComponent(USERNAME)+"&newsnipegroup=0";
	if (isModified) params+="&ismodified=1";
	var url = "http://www.gixen.com/home_2.php?username="+ encodeURIComponent(USERNAME);
	makeAjaxRequest('POST',url,params,function(data) {
		var snipingResponse = analyzeServerSnipingResponse(data,itemId); //Using SnipingResponse analyzer to acquire request status
		if(snipingResponse) injected_script_link.postMessage({'message':snipingResponse}); //send whatever message Analyzer produced back to injected script
	});
}


function makeAjaxRequest(type,url,params,successCallback) { //making standart XMLHTTPRequest with callback to process returned data
	xmlHttp = new window.XMLHttpRequest();
	if(xmlHttp) {
		if(type=='GET') {
	xmlHttp.open(type, url, true);
	}
	else if (type=='POST') {
	xmlHttp.open(type, url, true);
	if(params.length>0) {
		xmlHttp.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
		}
	}
	
	else { 
	return -1;
	}
	
	xmlHttp.onreadystatechange = function() {
		if (xmlHttp.readyState == 4)
			{
			successCallback(xmlHttp.responseText);
			}
		}
	xmlHttp.send(params);
	}
}


function analyzeServerLoginResponse(responseText) { //Login request response analyzer
	
	//This function finds certain phrases on the page and makes assumptions about login procedure success
	//It returns true if login is successful, else false
	if(responseText.search("If not redirected to your account in 5 seconds, click")!=-1) {
	return true;
	}
	
	else if(responseText.search("Scheduled bids:")!=-1) {
	return true;
	}
	
	
	else if((responseText.search("Password is not a match.")!=-1) || (responseText.search("Wrong password")!=-1)) {
	return false;
	}
	else if(responseText.search("Cookies are disabled in your browser")!=-1) {
	return false;
	}
	
	else if(responseText.search("Session expired. Please sign in again.")!=-1) { 
	return false;
	}
	return false;
}

function analyzeServerSnipingResponse(responseText,itemId) {
//Uses same principal for response analysis, but for making a snipe request
//Returns status to send back if possible. If not (e.g. asyncronous request needs to be make, returns nothing 
if(responseText.search("Sorry, this item is already present.")!=-1) {
	sendGetHomePageRequest(function(data) {
		var itemProperties = getCurrentItemProperties(data,itemId);
		injected_script_link.postMessage({'message':'snipe_already_exists','maxbid':itemProperties.maxbid});
	});
	return;
	}

else if(responseText.search("id=\"edititemid\" value=\""+itemId+"\"")!=-1) {
	return 'snipe_add_success';
	}
else {
	if(analyzeServerLoginResponse(responseText)) return 'snipe_add_failed';
	else return 'login_required';

}
	
}

function getCurrentItemProperties(homePageHTML,itemId) { 
//This functions analyzes Gixen homePage to get current item's max bid placed

var item = {'maxbid':0};
var $homePageHTML = $(homePageHTML);
var $itemHTML = $homePageHTML.find('input[name=edititemid_'+itemId+']').parent();


item.id = $itemHTML.find('#edititemid').val();
item.maxbid = $itemHTML.find('#editmaxbid').val();

return item;
}

function setNewPreferencesLogin(login) {
//Placing new login in extension's preferences and sending it back to injected script.
//Used only on page load and upon every login 
	storage.login = login;
	injected_script_link.postMessage({'message':'got_login','login':USERNAME});
}

