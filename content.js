var countryDomainExtensions = "(com|co.uk|ca)";
var domainExtensionRE = location.href.toLowerCase().match(/(com|co\.uk|ca)/);
var domainExtension;
if (domainExtensionRE) {
    domainExtension = domainExtensionRE[1];
} else {
    domainExtension = "nothing";
}

var EDT = function () {

	var EDT = this;

    this.spinner = {
        html: "<div id='sd-spinner' class='hide'> <div class='uil-ring-css' style='transform:scale(0.75);'><div> </div></div> </div>",
        show: function () {
            this.element.removeClass("hide");
        },
        hide: function () {
            this.element.addClass("hide");
        },
        init: function () {
            $("body").append(this.html);
            this.element = $("#sd-spinner");
        }
    };    

    this.isEbay = function () {
        if (location.href.indexOf('k2b-bulk.ebay.'+domainExtension+'/ws/eBayISAPI.dll?SalesRecordConsole&status=WaitShipment') > -1) {
            $(".shreskin-search-query-row").after("<tr><td id='sd-below-search'><div id='sd-below-search-div'></td></tr>");
            $("#sd-below-search-div").append('<div id="load_btns" style="color: red; font-weight: bold;">Please wait until extension get all addresses, and then you will be able to use multiple addresses copying functions <img src="'+chrome.extension.getURL('images/loading_old.gif')+'"></div>');
            
            setTimeout(function () {
                var rows_wrap = $("#tbl_mu_active_tbl_id");
                var rows_length = rows_wrap.find(".dt-sh.dt-slb #LineID>input").length;
                var rows = rows_wrap.find(".dt-rs.dt-cs").next().find(".dt-ntb.dt-slb #RecordNumber").parents(".dt-ntb.dt-slb");
                rows = $(rows.get().reverse()); 

                var counter = 0;

                var _0x41b5x29 = 0;
                var AddRecordNumber = true;            
                
                var countin = 0;
                console.log(rows_length);

                var lead_items = new Array();
                chrome.storage.sync.set({leads: lead_items});

                var names = new Array();

                var searcher = 0;

                rows.each(function() {
                    var row = $(this);
                    var lineid_tag = row.parent().prev().find("#LineID>input");
                    var lineid = lineid_tag.val();
                    var lineids = lineid.split("+"); 
                    var existRecords = false;

                    if (lineids.length === 1) {
                        existRecords = true;
                        var tx = lineid_tag.attr("tx");
                        var itemId = tx.match(/itemId:.+?\'/g).join().match(/[0-9]+/g);
                        var transactId = tx.match(/transactId:.+?\'/g).join().match(/[0-9]+/g);
                        lineids[0] = tx.match(/itemId:.+?\'/)[0].match(/[0-9]+/)[0];
                        lineids[1] = tx.match(/transactId:.+?\'/)[0].match(/[0-9]+/)[0];
                    }

                    var record_url = EDT.buildURL(lineids[0], lineids[1]);

                    var request = $.get(record_url, function (response) {
                        counter++;
                        //console.log(lineids[0], lineids[1]);
                        var json_record = JSON.parse(response.match(/var orderDataResponse = \{.+?\};/igm)[0].replace("var orderDataResponse = ", "").replace(/;$/igm, ""));

                        var record_title = json_record.orderData.salesOrder.items[0].title;

                        var date = "";
                        if (json_record.orderData.salesOrder.shippingPackages[0].deliveryInfo.latestDelivery !== null) {
                            date = json_record.orderData.salesOrder.shippingPackages[0].deliveryInfo.latestDelivery.prettyDate.split(",");
                        };
                        var shippingAddress;
                        var shippingAddressText = "";
                        if (json_record.orderData.salesOrder.warehouseAddress !== null) {
                            shippingAddress = json_record.orderData.salesOrder.warehouseAddress;
                            shippingAddress.name = json_record.orderData.salesOrder.shippingAddress.name;
                            shippingAddress.phoneNumber = "";
                            shippingAddressText = "<br><span class='global-shipping-notice'><i class='fa fa-globe'></i> Global shipping</span>";
                        } else {
                            shippingAddress = json_record.orderData.salesOrder.shippingAddress;
                        };   
                        
                        var referenceId = shippingAddress.referenceId === null ? "" : shippingAddress.referenceId + "<br>";
                        if (typeof shippingAddress.addressLine2 !== "string") {
                            if (/(Apt.*)|(#.*)/gi.test(shippingAddress.addressLine1)) {
                                shippingAddress.addressLine2 = shippingAddress.addressLine1.match(/(Apt.*)|(#.*)/gi)[0];
                                shippingAddress.addressLine2 = shippingAddress.addressLine2.replace(/#/gi, 'no ');
                            } else {
                                shippingAddress.addressLine2 = "";
                            }
                            
                        }

                        shippingAddress.addressLine2 = shippingAddress.addressLine2.replace(/#/gi, 'no ');

                        shippingAddress.addressLine1 = shippingAddress.addressLine1.replace(/(Apt.*)|(#.*)/gi, '');

                        addressLine2 = shippingAddress.addressLine2 + "<br>";

                        var fullAddressText = "<span class='sd-ebay-addr'>" + "<span class='sd-ebay-name'>" + shippingAddress.name + "</span><br>" + shippingAddress.addressLine1 + "<br>" + addressLine2 + shippingAddress.prettyCityStateZip + "<br>" + shippingAddress.country + referenceId + shippingAddressText + "</span>";    
                        var shippingAddressJson = escape(JSON.stringify(shippingAddress));
                        if (shippingAddress.referenceId !== null) {
                            //console.log(shippingAddress);
                        }
                        var copyBtn = $("<a class='sd-btn' data-addr='" + shippingAddressJson + "'><i class='fa fa-files-o'></i> Copy</a>");



                        copyBtn.on("click", function () {
                            var thisCopyBtn = $(this);
                            $(document).one("pc.addressSaved", function () {
                                thisCopyBtn.notify("Address copied successfully!", {
                                    className: "success"
                                    , position: "top center"
                                });
                            });
                            var jsonAddr = unescape($(this).attr("data-addr"));
                            var jsonAddrExt = JSON.parse(jsonAddr);

                            //console.log(jsonAddrExt);

                            jsonAddrExt.date = date[1] + date[2];
                            EDT._clearAddressProperties();
                            EDT._extractAddress(jsonAddrExt);
                            EDT._saveAddressToStorage();
                            var output = '';
                            for (var entry in jsonAddrExt) {
                              output += entry + ': ' + jsonAddrExt[entry] + '\n';
                            }
                        });

                       

                        var amazon_buy_link = "https://www.amazon." + domainExtension + "/dp/";
                        var label = row.find("#CustomLabel [id^=label_link_]").text(); 
                        var addtocartbtn = "";
                        var addtocartnote = "";
                        var addAddressBtn = "";
                        if (label !== "[Add]") {
                            amazon_buy_link += label;                            

                            var amazon_add_to_cart_btn = $("<a data-addr='" + shippingAddressJson + "' href='" + amazon_buy_link + "?add-to-cart=1' target='_blank' class='sd-btn add-to-cart'><i class='fa fa-cart-plus'></i> Add to amazon cart</a>"); 
                            
                            amazon_add_to_cart_btn.on('click', function() {
                                var jsonAddr = unescape($(this).attr("data-addr"));
                                var jsonAddrExt = JSON.parse(jsonAddr);
                                jsonAddrExt.date = date[1] + date[2];
                                EDT._clearAddressProperties();
                                EDT._extractAddress(jsonAddrExt);
                                EDT._saveAddressToStorage();
                                var output = '';
                                for (var entry in jsonAddrExt) {
                                  output += entry + ': ' + jsonAddrExt[entry] + '\n';
                                }                                
                            });

                            var amazon_goto_item_btn = $("<a data-addr='" + shippingAddressJson + "' class='sd-link sd-to-amazon' href='" + amazon_buy_link + "' target='_blank'><i class='fa fa-amazon'></i> Go to amazon item</a>");
                            amazon_goto_item_btn.on('click', function() {
                                var jsonAddr = unescape($(this).attr("data-addr"));
                                var jsonAddrExt = JSON.parse(jsonAddr);
                                jsonAddrExt.date = date[1] + date[2];
                                EDT._clearAddressProperties();
                                EDT._extractAddress(jsonAddrExt);
                                EDT._saveAddressToStorage();
                                var output = '';
                                for (var entry in jsonAddrExt) {
                                  output += entry + ': ' + jsonAddrExt[entry] + '\n';
                                }                                
                            }); 

                            if (/^B/.test(label)) {

                                if (searcher < 20) {

                                    addtocartbtn = $(document.createElement('a')).addClass('sd-btn add-addr-to-cart-btn').css('padding','1px').text("Add item to cart");

                                    addtocartnote = $(document.createElement('div')).addClass('btn_note_add').css({'display':'none','color':'red','text-align':'center','width':'111px','overflow':'hidden','font-weight':'bold','white-space':'initial'}).text("Please wait, we adding item to cart");

                                    

                                    addAddressBtn = $("<a style='padding:1px;' number='"+searcher+"' class='sd-btn add-addr-btn' data-addr='" + shippingAddressJson + "'><i class='fa fa-plus'></i> Add address</a><div class='btn_note' style='display: none; color: red;text-align: center;width: 111px;overflow: hidden;font-weight: bold;white-space: initial;'>Please wait</div>");
                                    
                                    searcher++;

                                                                      


                                    $(addtocartbtn).on('click', function() {




                                        chrome.runtime.sendMessage({
                                            type: "edt.ebay.newBuy"
                                            , value: label
                                        }, function(response) {
                                            
                                            
                                        });                                      

                                    });

                                    addAddressBtn.on("click", function (e) {

                                            var AddressBtn = $(this);
                                            var AddressBtn_info_json = unescape($(this).attr("data-addr"));
                                            var AddressBtn_info = JSON.parse(AddressBtn_info_json);

                                            var search = [label, AddressBtn_info.name.toLowerCase().trim() + ', ' + AddressBtn_info.addressLine1.toLowerCase().trim().split(" ")[0], {'isPasted': false}];
                                            var btn_number = $(this).attr('number');

                                            var obj= {};

                                            obj[btn_number] = search

                                            chrome.storage.sync.set(obj);



                                            if (AddressBtn_info.phoneNumber == "") {
                                                AddressBtn_info.phoneNumber = "+1 999 999 9999"
                                            }

                                            chrome.runtime.sendMessage({
                                                type: "edt.ebay.newAddr"
                                                , value: AddressBtn_info
                                            }, function(response) {
                                                
                                                
                                            });

                                    });  
                                }                                 

                            }



                            var walmart_add_to_cart_btn = "";
                            var walmart_goto_item_btn = "";
                            var walmart_buy_link = "https://www.walmart." + domainExtension + "/search/?query=";
                            if (!/^B/.test(label)) {
                                walmart_buy_link += label;
                                walmart_add_to_cart_btn = $("<a data-addr='" + shippingAddressJson + "' href='" + walmart_buy_link + "&add-to-cart=1' target='_blank' class='sd-btn walmart add-to-cart'><i class='fa fa-cart-plus'></i> Add to walmart cart</a>");

                                walmart_add_to_cart_btn.on('click', function() {
                                    var jsonAddr = unescape($(this).attr("data-addr"));
                                    var jsonAddrExt = JSON.parse(jsonAddr);
                                    jsonAddrExt.date = date[1] + date[2];
                                    EDT._clearAddressProperties();
                                    EDT._extractAddress(jsonAddrExt);
                                    EDT._saveAddressToStorage();
                                    var output = '';
                                    for (var entry in jsonAddrExt) {
                                      output += entry + ': ' + jsonAddrExt[entry] + '\n';
                                    }                                
                                });

                                walmart_goto_item_btn = $("<a data-addr='" + shippingAddressJson + "' class='sd-link sd-to-walmart walmart' href='" + walmart_buy_link + "' target='_blank'><i class='fa fa-amazon'></i> Go to walmart item</a>");

                                walmart_goto_item_btn.on('click', function() {
                                    var jsonAddr = unescape($(this).attr("data-addr"));
                                    var jsonAddrExt = JSON.parse(jsonAddr);
                                    jsonAddrExt.date = date[1] + date[2];
                                    EDT._clearAddressProperties();
                                    EDT._extractAddress(jsonAddrExt);
                                    EDT._saveAddressToStorage();
                                    var output = '';
                                    for (var entry in jsonAddrExt) {
                                      output += entry + ': ' + jsonAddrExt[entry] + '\n';
                                    }                                
                                });                            
                            }

                            row.find("#CustomLabel").append(amazon_add_to_cart_btn);     
                            row.find("#CustomLabel").append(amazon_goto_item_btn);   
                            row.find("#CustomLabel").append(walmart_add_to_cart_btn); 
                            row.find("#CustomLabel").append(walmart_goto_item_btn);                                                                                                                

                        }

                        row.find("#LineActions").html(fullAddressText);
                        row.find("#RecordNumber").append(copyBtn).append(addAddressBtn).append(addtocartbtn).append(addtocartnote).addClass("center");
                        row.find("#BuyerEmail").append("<div class='sd-ebay-delivery'><span class='title'>Estimated delivery</span> " + date[1] + date[2] + "<br><span class=''></span></div>");
                        console.log(countin);      
                        countin++;
                        if (countin == rows_length) {
                            $('#load_btns').remove();
                            $("#sd-below-search-div").append("<div type='button' class='sd-btn' id='add-all-addresses'>Copy 20 addresses to Amazon</div>");
                            $("#sd-below-search-div").append("<div type='button' class='sd-btn' id='add-all-items-to-cart'>Add 20 items to cart on Amazon</div>");


                            $(document).on("click", "#add-all-items-to-cart", function () {

                                $('.btn_note_add').show();

                                var this_btn = $(this);
                                this_btn.text("Loading...");
                                this_btn.attr("disabled", true);    
                                
                                var add_items_btns = $(".add-addr-to-cart-btn");      

                                var number = add_items_btns.length;   
                                var cntr = 0;
                                $(".add-addr-to-cart-btn").eq(0).click();                       

                                function after_buying(request) {
                                    if (request.type === "edt.bg.itemBought") {
                                        cntr++;
                                        $(".add-addr-to-cart-btn").eq(cntr-1).parent().find('.btn_note_add').text("Successfully added to amazon cart!");
                                        this_btn.text("Loading... " + cntr);
                                        if (cntr === number) {
                                            this_btn.attr("disabled", false);
                                            this_btn.text("Add 20 items to cart on Amazon");  
                                            chrome.runtime.onMessage.removeListener(after_buying)                                          
                                        } else {
                                            add_items_btns.eq(cntr).click();
                                        }
                                    } else {
                                        if (request.type === "edt.bg.itemNotFound") {
                                            cntr++;
                                            $(".add-addr-to-cart-btn").eq(cntr-1).parent().find('.btn_note_add').text("Item not found!");
                                            this_btn.text("Loading... " + cntr);
                                            if (cntr === number) {
                                                this_btn.attr("disabled", false);
                                                this_btn.text("Add 20 items to cart on Amazon");  
                                                chrome.runtime.onMessage.removeListener(after_buying)                                          
                                            } else {
                                                add_items_btns.eq(cntr).click();
                                            }                            
                                        }
                                    }
                                }
                  
                                chrome.runtime.onMessage.addListener(after_buying);                

                            }); 

                            $(document).on("click", "#add-all-addresses", function () {

                                $('.btn_note').show();

                                chrome.storage.sync.get(function(data) {
                                    $.each(data, function(index, value) {
                                        console.log(index);
                                        if (index != "password" && index != "login") {
                                            chrome.storage.sync.remove(index, function() {

                                            });
                                        }
                                    });
                                });                             

                                var this_btn = $(this);
                                this_btn.text("Loading...");
                                this_btn.attr("disabled", true);

                                var add_addr_btns = $(".add-addr-btn");
                                var number = add_addr_btns.length;   
                                var cntr = 0;
                                $(".add-addr-btn").eq(0).click();  


                                function after_adding(request) {
                                    if (request.type === "edt.bg.addressAdded") {
                                        cntr++;
                                        console.log(cntr, number);
                                        $(".add-addr-btn").eq(cntr-1).parent().find('.btn_note').text("Successfully copied as new shipping address on amazon");
                                        this_btn.text("Loading... " + cntr);
                                        if (cntr === number) {
                                            this_btn.attr("disabled", false);
                                            this_btn.text("Copy 20 addresses to Amazon");  
                                            chrome.runtime.onMessage.removeListener(after_adding);
                                            $.get("https://www.amazon.com/gp/css/account/address/view.html", function (response) {
                                                add_addr_btns.each(function() {
                                                    var AddressBtn = $(this);
                                                    var AddressBtn_info_json = unescape($(this).attr("data-addr"));
                                                    var AddressBtn_info = JSON.parse(AddressBtn_info_json);                                         
                                                    
                                                            if (response.indexOf(AddressBtn_info.name.trim()) === -1) {
                                                                console.log(AddressBtn_info.name);
                                                            }
                                                });                                                
                                            });
                                            
                                                                                      
                                        } else {
                                            add_addr_btns.eq(cntr).click();
                                        }
                                    }
                                }
  
                                chrome.runtime.onMessage.addListener(after_adding);                                
                      

                            });                                            
                        }                         
                    });
                });
            }, 500);
        
        }
    };

    this.isAmazon = function () {

        var item_link = new RegExp("amazon\." + countryDomainExtensions + ".*?/dp/?", "i");

        if (item_link.test(location.href)) {
            if (location.href.toLowerCase().indexOf("add-to-cart=1") > -1) {
                $("[id='submit.add-to-cart'] input")[0].click();
                chrome.runtime.sendMessage({
                    type: "edt.amazon.closeTab"
                })
            }
        } else if (location.href.indexOf("amazon." + domainExtension + '/gp/huc/view.html') !== -1) {
            console.log("test");
            $('#hlb-ptc-btn-native')[0].click();
        } else if ((location.href.indexOf("amazon." + domainExtension + '/gp/ordering/checkout/item/select.html/ref=ox_shipaddress_multi_addr?ie=UTF8&useCase=multiAddress') !== -1) || (location.href.indexOf("amazon." + domainExtension + '/gp/buy/itemselect/handlers/static-continue.html') !== -1)) {
            $('.tablewrapper').before("<input class='sd-btn' style='width:100%;' type='button' id='amazonPasteAllAddr' value='Paste all addresses'>");

            $('.tablewrapper select').val("");

            chrome.storage.sync.get(function(data) {
                var leads = data;
                $.each(leads, function(index, value) {
                    if (index != "password" && index != "login") {
                        leads[index][2].isPasted = false;
                        //console.log(leads[index][2].isPasted);
                        chrome.storage.sync.set(leads);
                    }
                });
                $('#amazonPasteAllAddr').click();
            });

            $('#amazonPasteAllAddr').on('click', function() {

                var pasteall = $(this);

                var number = $('.itemrow').length;

                var cntrer = 0;

                (function loopsiloop(){
                   setTimeout(function(){

                        chrome.storage.sync.get(function(data) {

                            var asin = $('.itemrow').eq(cntrer).find('input[name^=asin]').val();
                            var now_item = $('.itemrow').eq(cntrer);
                            $.each(data, function(i, val) {

                                if (val[0] == asin) {
                                        
                                        
                                            console.log("now number: "+i);
                                            console.log("isPasted: "+data[i][2].isPasted);
                                            console.log("Found same asin: "+asin);
                                            console.log("We are at "+cntrer+" row");
                                            
                                            
                                                data[i][2].isPasted = true;
                                                chrome.storage.sync.set(data, function() {
                                                    now_item.find('select option').each(function() {
                                                        
                                                        if ($(this).text().toLowerCase().trim().indexOf(val[1].toLowerCase().trim()) > -1) {
                                                            console.log($(this).text().toLowerCase().trim());
                                                            console.log(val[1].toLowerCase().trim());
                                                            now_item.find('select').val($(this).text());
                                                            $(this).prop('selected', true);
                                                            var option_val = $(this).val();
                                                            option_val = option_val.substr(0, option_val.indexOf('.')); 
                                                            now_item.find('select').prev('input').val(option_val);
                                                            console.log("%c-----------------------------------------", "color: red; font-weight: bold;");
                                                            return false;
                                                        }                                        
                                                    });                                                      
                                                });
                                              

                                            console.log(val[1]);
                                            
                                            

                                        

                                    
                                }

                            });
                            cntrer++;
                            //console.log(cntrer, number-1);
                            if (cntrer != number+1) {
                                loopsiloop();
                            } else {
                                if (!$('#alladded').length) {
                                    pasteall.after("<p id='alladded' style='color: red; text-align: center; font-weight: bold;'>All addresses was selected successfully!</p>");
                                }
                                $('.tablewrapper select').each(function() {
                                    console.log($(this).val());
                                    if ($(this).val() == null) {
                                        $(this).css('border', '4px solid red');
                                        $(this).after('<p style="color: red; font-weight: bold;">Failed to choose address!</p>')
                                    }
                                });
                            }
                            

                        }); 

                        
                   }, 1000);
                })();  

            });

        } else {
            var url = new RegExp("amazon\." + countryDomainExtensions + "\/gp\/buy\/addressselect\/handlers\/display\.html\?hasWorkingJavascript=1", "i");
                setTimeout(function () {
                    $("#enterAddressFullNameContainer").before("<input class='sd-btn' style='width:100%;' type='button' id='amazonFillData' value='Paste Address'>");
                    $("#amazonFillData").on("click", function () {
                        EDT.fillAmazon();
                    });
                }, 1000);

            chrome.runtime.onMessage.addListener(
                function(request, sender, sendResponse) {
                    if (request.past == "amaz")
                        EDT.fillAmazon();
            });
        }        


    };


    this.isAmazonCeller = function() {
        $(document).ready(function() {
            setTimeout(function() {
                $('.order-row').each(function() {
                    var row = this;
                    var url = $(this).find('td.data-display-field:nth-child(3) a').attr('href');
                    $.get(url, function(data) {
                        var html = $.parseHTML(data)
                        var userinfo = $(html).find('#myo-order-details-buyer-address').html();
                        var split_info = userinfo.split(/<br>/);
                        var shippingAddress = {};
                        shippingAddress.name = $.trim(split_info[0]);
                        shippingAddress.addressLine1 = $.trim(split_info[1]);
                        shippingAddress.addressLine2 = "";
                        shippingAddress.referenceId = "";
                        shippingAddress.date = "";
                        shippingAddress.city = $.trim(split_info[2].match(/(.*?),/i)[1]);
                        shippingAddress.stateOrProvince = $.trim(split_info[2].split('<span class=\"a-letter-space\"><\/span>')[1]);
                        shippingAddress.zip = $.trim(split_info[2].split('<span class=\"a-letter-space\"><\/span>')[2]);
                        if (split_info[3]) {
                            var phone = split_info[3].split('<span class=\"a-letter-space\"><\/span>')[1];
                            shippingAddress.phoneNumber = ($.trim(phone)).replace(/[-.]/ig, '');
                        }
                        console.log(shippingAddress);
                        var shippingAddressJson = escape(JSON.stringify(shippingAddress));
                        
                        var copyBtn = $("<a class='sd-btn' data-addr='" + shippingAddressJson + "'><i class='fa fa-files-o'></i> Copy</a>");
                        copyBtn.on("click", function () {
                            var thisCopyBtn = $(this);
                            $(document).one("pc.addressSaved", function () {
                                thisCopyBtn.notify("Address copied successfully!", {
                                    className: "success"
                                    , position: "top center"
                                });
                            });
                            var jsonAddr = unescape($(this).attr("data-addr"));
                            var jsonAddrExt = JSON.parse(jsonAddr);
                            console.log(jsonAddrExt);
                            EDT._clearAddressProperties();
                            EDT._extractAddress(jsonAddrExt);
                            EDT._saveAddressToStorage();
                            var output = '';
                            for (var entry in jsonAddrExt) {
                              output += entry + ': ' + jsonAddrExt[entry] + '\n';
                            }
                        });

                        $(row).find('.order-id').before(copyBtn).addClass("center");

                    });
                });
            }, 5000);
        });
    }

    this.isWalmart = function() {
        $(document).ready(function() {

            if (location.href.indexOf("walmart." + domainExtension + '/checkout') !== -1) {
                function addBtn() {
                    if (!$('#walmartFillData').length) {
                        $('body').append('<div style="position: fixed; top: 0; z-index: 999; background: #ffdd0c; left: 0; right: 0;"><input class="sd-btn" style="width:100%;" type="button" id="walmartFillData" value="Paste Address"></div>');
                        setTimeout(addBtn, 100);
                    } else {
                        $('#walmartFillData').on('click', function() {
                            EDT.fillWalmart();
                        });
                    }
                }
                addBtn();                
            } else if (location.href.indexOf("walmart." + domainExtension + '/search/?query=') !== -1 && location.href.indexOf('&add-to-cart=1') !== -1) {
                var href = $('.js-product-title').attr('href');
                href += '?add-to-cart=1';
                $('.js-product-title').attr('href', href);
                $('.js-product-title')[0].click();
            } else if (location.href.indexOf("walmart." + domainExtension + '/ip/') !== -1 && location.href.indexOf('?add-to-cart=1') !== -1) {
                $('button:contains("Add to Cart")')[0].click();
                setTimeout(function() {
                    $('#PACCheckoutBtn')[0].click();
                },3000);
            } else if (location.href.indexOf("walmart." + domainExtension + '/search/?query=') !== -1 && location.href.indexOf('&add-to-cart=1') === -1) {
                $('.js-product-title')[0].click();
            }

        });


        chrome.runtime.onMessage.addListener(
            function(request, sender, sendResponse) {
                if (request.past == "wal")
                    EDT.fillWalmart();
        });        

    };  

    this.fillWalmart = function() {

        chrome.storage.local.get(function (address) {
            
            var addrForm = $(".accordion-form");
            var fullName = address.name.split(' ');
            var lastName = address.name.substr(address.name.indexOf(" ") + 1);
            addrForm.find("input[name=firstName]").focus();
            addrForm.find("input[name=firstName]").val(fullName[0]);
            addrForm.find("input[name=lastName]").focus();
            addrForm.find("input[name=lastName]").val(lastName);
            var number = "";
            console.log(address);
            if (address.phone != "" && address.phone !== null && address.phone.length > 0) {
                number = number+address.phone;
            } else {
                if (address.referenceId != null && !address.phone) {
                    number = "999-999-9999";
                }
                
            }
            addrForm.find("input[name=shippingPhone], input[name=phone]").focus();
            addrForm.find("input[name=shippingPhone], input[name=phone]").val(number);       

            var add2 = "";
            if (address.add1.length >= 30) {
                var add1 = address.add1.substr(0, 30);
                addrForm.find("input[name=addressLineOne]").focus();
                addrForm.find("input[name=addressLineOne]").val(add1);
                add2 = address.add1.substr(30);
            } else {
                addrForm.find("input[name=addressLineOne]").focus();
                addrForm.find("input[name=addressLineOne]").val(address.add1);
            }

            if (typeof address.referenceId == 'string') {
                add2 = add2+' '+address.add2+' '+address.referenceId;
                addrForm.find("input[name=addressLineTwo]").focus();
                addrForm.find("input[name=addressLineTwo]").val(add2);
            } else {
                add2 = address.add2;
                addrForm.find("input[name=addressLineTwo]").focus();
                addrForm.find("input[name=addressLineTwo]").val(add2);
            }
            console.log(address.city);
            addrForm.find("input[name=city]").focus();
            addrForm.find("input[name=city]").val("");
            addrForm.find("input[name=city]").val(address.city); 
            addrForm.find("select[name=state]").focus();
            var state = addrForm.find("option[value="+address.state+"]").prop('selected', true);
            addrForm.find(".chooser-option-current").text($(".js-delivery-identity option:selected").text());
            addrForm.find("input[name=postalCode]").focus();
            addrForm.find("input[name=postalCode]").val(address.zip);
        });

    };

    this.fillAmazon = function () {
        chrome.storage.local.get(function (address) {
            
            if ($("#identity-add-new-address").length) {
                var addrForm = $("#identity-add-new-address");
            } else {
                var addrForm = $("form");
            }
            addrForm.find("#enterAddressFullName").val(address.name);
            var add2 = "";
            if (address.add1.length >= 60) {
                var add1 = address.add1.substr(0, 60);
                addrForm.find("#enterAddressAddressLine1").val(add1);
                add2 = address.add1.substr(60);
            } else {
                addrForm.find("#enterAddressAddressLine1").val(address.add1);
            }

            if (typeof address.referenceId == 'string') {
                add2 = add2+' '+address.add2+' '+address.referenceId;
                addrForm.find("#enterAddressAddressLine2").val(add2);
            } else {
                add2 = address.add2;
                addrForm.find("#enterAddressAddressLine2").val(add2);
            }
            
            addrForm.find("#enterAddressCity").val(address.city);
            addrForm.find("#enterAddressStateOrRegion").val(address.state);
            addrForm.find("#enterAddressPostalCode").val(address.zip);
            var number = "+1";
            if (address.phone != "" && address.phone !== null && address.phone.length > 0) {
                if (location.href.indexOf('amazon.co.uk') !== -1) {
                    number = '+44'+address.phone;
                } else {
                    number = number+address.phone;
                }
                
            } else {
                console.log(address.referenceId != null);
                if (address.referenceId != null) {
                    if (location.href.indexOf('amazon.co.uk') !== -1) {
                        number = '+44 999-999-9999';
                    } else {
                        number = "+1 999-999-9999";
                    }
                    
                }
                
            }
            addrForm.find("#enterAddressPhoneNumber").val(number);
            $("#AddressType").val("RES");
            //$("#GateCode").val(address.referenceId);
            $(".weekendDeliveryCheckboxes input").eq(0).attr("checked", true);
            $(".weekendDeliveryCheckboxes input").eq(1).attr("checked", true)
        });
    };

    this._clearAddressProperties = function () {
        this.name = "";
        this.add1 = "";
        this.add2 = "";
        this.city = "";
        this.state = "";
        this.zip = "";
        this.country = "";
        this.phone = "";
        this.referenceId = "";
        this.date = "";
    };

    this._extractAddress = function (jsonAddr) {
        this.name = jsonAddr.name;
        this.add1 = jsonAddr.addressLine1;
        this.add2 = jsonAddr.addressLine2;
        this.city = jsonAddr.city;
        this.state = jsonAddr.stateOrProvince;
        this.zip = jsonAddr.zip;
        this.country = jsonAddr.country;
        this.phone = jsonAddr.phoneNumber;
        this.referenceId = jsonAddr.referenceId;
        this.date = jsonAddr.date;
        return;
    };

    this._saveAddressToStorage = function () {
        chrome.storage.local.set({
            name: this.name,
            add1: this.add1,
            add2: this.add2,
            city: this.city,
            state: this.state,
            zip: this.zip,
            country: this.country,
            phone: this.phone,
            referenceId: this.referenceId,
            date: this.date
        }, function () {
            $(document).trigger("pc.addressSaved");
        });

        chrome.storage.local.get(name, function() {
            console.log(name);
        });
    };        	

    this.buildURL = function (itemId, transactId) {
        return "https://vod.ebay." + domainExtension + "/vod/FetchOrderDetails?sspagename=STRK%3AMESOX%3AVPS&itemid=" + itemId + "&transid=" + transactId;
    };

    this.checktime = function() {


        if (!localStorage['checktime'] || localStorage['checktime'] == "undefined") {
            var time_now = (new Date()).getTime();
            localStorage['checktime'] = time_now;
            EDT.init();
        } else {
            var time_now  = (new Date()).getTime();
            if ((time_now - localStorage['checktime']) > 1000 * 60 * 10) {
                chrome.runtime.sendMessage({task: "checkuser"}, function(response) {
                    if (response.status) {
                        localStorage['checktime'] = time_now;
                        EDT.init();
                    } else {
                        return false;
                    }
                });
            } else {
                EDT.init();
            }               
        }


    }     	

    this.init = function () {
        console.log("we start!");
        this.spinner.init();
        if (location.href.indexOf("ebay." + domainExtension) !== -1) {
            EDT.isEbay();
        } else if (location.href.indexOf("sellercentral.amazon." + domainExtension) !== -1) {
            EDT.isAmazonCeller();
        } else if (location.href.indexOf("www.amazon." + domainExtension) !== -1) {
            EDT.isAmazon();
        } else {
            if (location.href.indexOf("walmart." + domainExtension) !== -1) {
                console.log("test");
                EDT.isWalmart();
            }
        }
        
    };	

    this._const = function() {
    	this.checktime();
    };    

};


chrome.storage.sync.get(["login", "password"], function(data) {
    if (data.login && data.password) {
        var ebay = new EDT();
        ebay._const();        
    }
});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.empty == "addr") {
            $(document).ready(function() {
                $('.deletebutton').each(function() {
                    var del = this;
                    setTimeout(function() {
                        del.click();
                    }, 2000);
                });
            });
        }
});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.empty == "cart") {
            $(document).ready(function() {
                if (location.href.indexOf('https://www.amazon.com/gp/cart/view.html') !== -1) {
                    var timer = setInterval(function() {
                        if ($('input[name^="submit\.delete"]').length) {
                            $('input[name^="submit\.delete"]')[0].click();
                        } else {
                            clearInterval(timer);
                        }
                    }, 1);
                }

            });
        }
});

/*$(document).ready(function() {

if (/icam_deleteAddressButton/.test($('body').html())) {
    console.log("test");
    $('#icam_deleteAddressButton')[0].click();    
} else {
    $('#myab_AddrBookDeleteAddr_1')[0].click();    
}

});*/



