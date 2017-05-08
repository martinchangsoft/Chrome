chrome.runtime.onMessage.addListener(function (request, sender, callback) {

	if (request.type === "edt.amazon.closeTab") {
		closeTab(sender.tab.id);
        return true;
	}

    if (request.type === "edt.ebay.newAddr") {
        var tab = sender.tab.id;
        var addressInfo = request.value;
        chrome.cookies.getAll({
            url: "https://www.amazon.com",
            name: "session-id"
        }, function(resp) {
            addNewAddr(addressInfo, resp[0].value, false, tab, false);
        });
        return true;        
    }

    if (request.type === "edt.ebay.newBuy") {
        var tab = sender.tab.id;
        newBuy(request.value, tab);
        return true;
    }     	

    if (request.task === "login") {

        var login = request.login;
        var password = request.password;

        $.ajax({
            url: "https://dropship4arbitrage.com/ext-login",
            type: "POST",
            data: { email: login, password: password }
        }).done(function(response) {
            if (response.status) {
                chrome.storage.sync.set({login: login, password: password});
                chrome.browserAction.setPopup({popup: "popup.html"}); 
                callback({status: true});
            } else {
                callback({message: response.message, status: false});
            }
        });  
        return true;      
    }

    if (request.task === "checkuser") {
        chrome.storage.sync.get(["login", "password"], function(data) {
            var login = data.login;
            var password = data.password; 
            
            $.ajax({
                url: "https://dropship4arbitrage.com/ext-login",
                type: "POST",
                data: { email: login, password: password }
            }).done(function(response) {
                
                if (response.status) {
                    chrome.browserAction.setPopup({popup: "popup.html"}); 
                    callback({status: true});
                } else {
                    chrome.browserAction.setPopup({popup: "message.html?message="+response.message});
                    callback({status: false});
                }
            });                         
        });
        return true;
    }

});


function newBuy(asin, tab) {

    $.ajax({
        method: "GET",
        url: "https://www.amazon.com/dp/" + asin
    }).done(function(html) {

        var data = {};
        var href = $(html).find("#addToCart").attr("action");
        console.log(href);
        var inputs = $(html).find("#addToCart input:not(#add-to-registry-baby-button-submit, #add-to-wishlist-button-submit)");
        inputs.each(function() {
            data[$(this).attr("name")] = $(this).val();
        });
        $.ajax({
            method: "POST",
            url: "https://www.amazon.com/"+href,
            data: data
        }).done(function(response) {
            chrome.tabs.sendMessage(tab, {
                type: "edt.bg.itemBought"
            }, function() {
                
            });
            return true;
        }).fail(function(XMLHttpRequest, textStatus, errorThrown) {

            if (XMLHttpRequest.status === 404) {
                console.log(asin);
                console.log("item not found "+asin);
                chrome.tabs.sendMessage(tab, {
                    type: "edt.bg.itemNotFound"
                }, function() {
                    
                });                
            } else {
                console.log(XMLHttpRequest);
                console.log(textStatus);
                console.log(errorThrown);
            }    


        });       

    }).fail(function(XMLHttpRequest, textStatus, errorThrown) {

        if (XMLHttpRequest.status === 404) {
            console.log(asin);
            console.log("item not found "+asin);
            chrome.tabs.sendMessage(tab, {
                type: "edt.bg.itemNotFound"
            }, function() {
                
            });                
        } else {
            console.log(XMLHttpRequest);
            console.log(textStatus);
            console.log(errorThrown);
        }    


    });

}

function addNewAddr(address, session_id, olds, tab, countryinfo) {
    var counter = 0;


    var ajax_data = {
        url: 'https://www.amazon.com/gp/css/account/address/view.html',
        method: 'POST',
        traditional: true,
        data: {
            enterAddressFullName: address.name,
            enterAddressAddressLine1: address.addressLine1,
            enterAddressAddressLine2: address.addressLine2,
            enterAddressCity: address.city,
            enterAddressStateOrRegion: address.stateOrProvince,
            enterAddressPostalCode: address.zip,
            enterAddressCountryCode: address.country,
            enterAddressTaxId: '',
            enterAddressPhoneNumber: address.phoneNumber,
            enterAddressIsDomestic: 0,
            enterAddressBlockOriginalAddress: '',
            AddressType: 'RES',
            BusinessHours: ['SAT', 'SUN'],
            weekendDeliveryDisplayType: 'checkboxes',
            GateCode: address.referenceId,
            newAddress: 'Save & Continue',
            forceAddingAPaymentMethod: '',
            isDomestic: 0,
            addressID: '',
            sessionId: session_id,
            ref_: 'myab_newAddress_action_button'
        }

    };   

    if (olds === true) {
        ajax_data.data.oldFullName = ajax_data.data.enterAddressFullName;
        ajax_data.data.oldAddressLine1 = ajax_data.data.enterAddressAddressLine1;
        ajax_data.data.oldAddressLine2 = ajax_data.data.enterAddressAddressLine2;
        ajax_data.data.oldCity = ajax_data.data.enterAddressCity;
        ajax_data.data.oldStateOrRegion = ajax_data.data.enterAddressStateOrRegion;
        ajax_data.data.oldPostalCode = ajax_data.data.enterAddressPostalCode;
        ajax_data.data.oldCountryCode = ajax_data.data.enterAddressCountryCode;
        ajax_data.data.oldPhoneNumber = ajax_data.data.enterAddressPhoneNumber;
        ajax_data.data.oldAddressType = ajax_data.data.AddressType;
        ajax_data.data.oldCountryName = countryinfo.countryName;
        ajax_data.data.oldaddressFields = countryinfo.oldaddressFieldsHashValue;        
    }

    function get_request() {
        $.ajax(ajax_data).done(function(resp) {
            if (resp.match(/name="addr_1suggestionId" value="(.+?)"/)) {
                console.log("suggest");
                console.log(address);
                var suggestionId = resp.match(/name="addr_1suggestionId" value="(.+?)"/);
                console.log(suggestionId);
                console.log(address);
                setTimeout(function() {
                    suggestedAddr(address, session_id, suggestionId, tab);                    
                }, 1000);                
                return;
            } else if (resp.indexOf('Confirm Your Address') > -1) {
                 
                    console.log("confirm");
                    console.log(address);
                    var AddressCountryCode = resp.match(/id="enterAddressCountryCode"(.|\n)+?<\/select/igm);
                    var enterAddressCountryCode = new RegExp('value="' + ajax_data.data.enterAddressCountryCode + '"(.|\n)+?>(.+)?</option', 'im');
                    var AddressCountryCode = AddressCountryCode[0].match(enterAddressCountryCode)[2];
                    var oldaddressFieldsHashValue = resp.match(/name="oldaddressFields"(.|\n)+?value="(.+)?".+?>/im);
                    var countryinfo = {
                        countryName: AddressCountryCode,
                        oldaddressFieldsHashValue: oldaddressFieldsHashValue
                    };
                    console.log(countryinfo);
                    console.log(address);   
                    addNewAddr(address, session_id, true, tab, countryinfo);
                    return;
                
            } else {
                if (counter < 4) {
                    $.get('https://www.amazon.com/gp/css/account/address/view.html', function(info) {
                        if (info.indexOf(address.name.trim()) === -1) {
                            console.log("failed");
                            addNewAddr(address, session_id, true, tab);
                            counter++;
                            return;                         
                        }
                    });
                }
            }
            chrome.tabs.sendMessage(tab, {
                type: "edt.bg.addressAdded"
            }, function() {
                console.log("send_to_click");
            });    
            return true;             
        }).fail(function(XMLHttpRequest, textStatus, errorThrown) {
            console.log("failed");
            if (counter === 3) {
                console.log("failed");
                return;
            };
            counter++            
        });
    }
    get_request();   


}

function suggestedAddr(address, session_id, suggestionId, tab) {
    var counter = 0;
    var ajax_data = {
        url: 'https://www.amazon.com/gp/css/account/address/view.html',
        method: 'POST',
        traditional: true,
        data: {
            addr: "addr_0",
            addr_0name: address.name,
            addr_0address1: address.addressLine1,
            addr_0address2: address.addressLine2,
            addr_0address3: '',
            addr_0city: address.city,
            addr_0county: '',
            addr_0state: address.stateOrProvince,
            addr_0zip: address.zip,
            addr_0country: '',
            addr_0voice: address.phoneNumber,
            addr_0countryCode: address.country,
            addr_1name: address.name,
            addr_1address1: address.addressLine1,
            addr_1address2: address.addressLine2,
            addr_1address3: '',
            addr_1city: address.city,
            addr_1county: '',
            addr_1state: address.stateOrProvince,
            addr_1zip: address.zip,
            addr_1country: "United States",
            addr_1voice: address.phoneNumber,
            addr_1validationStrategy: "AVESv2_MULT_CHANGES_CTY_ZIP",
            addr_1suggestionId: suggestionId,
            addr_1countryCode: address.country,
            useSelectedAddress: 'Save & Continue',
            AddressType: 'RES',
            BusinessHours: ["SAT", "SUN"],
            weekendDeliveryDisplayType: 'checkboxes',
            forceAddingAPaymentMethod: '',
            isDomestic: 0,
            sessionId: session_id,
            addressID: '',
            addressValidationClientName: "manage-your-address",
            addressValidationUseCase: "create"
        },
        success: function() {
            chrome.tabs.sendMessage(tab, {
                type: "edt.bg.addressAdded"
            }, function() {})
        },
        fail: function() {
            if (counter === 3) {
                return
            };
            get_request();
            counter++
        }
    };

    function get_request() {
        $.ajax(ajax_data)
    }
    get_request()
}

chrome.browserAction.onClicked.addListener(function(tab) {
   chrome.storage.sync.get(["login", "password"], function(data) {
        if (!data.login && !data.password) {
            chrome.browserAction.setPopup({popup: "login.html"}); 
        } else {
            chrome.browserAction.setPopup({popup: "popup.html"}); 
        }
   });
});