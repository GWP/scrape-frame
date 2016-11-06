var fs = require('fs');
path = require('path');

var Nightmare = require('nightmare');
var nightmare = Nightmare();

var Xray = require('x-ray');
var x = Xray();
var Promise = require('bluebird');
var _ = require('lodash');

var appendFileP = Promise.promisify(fs.appendFile);
var writeFileP = Promise.promisify(fs.writeFile);

var index = 0;
var indexEnd = 9999;
var interval = 4000;

var URL = 'TBD';


function scrape(){
	if (index < indexEnd){

		if (index%100 === 0) {
            appendFileP(logFile, ids[index] + ' ' + new Date().toString() + '\r\n', 'utf8');
            console.log(ids[index] + ' ' + new Date().toString() + '\r\n', 'utf8');
        }
	
		nightmare
        .goto(URL)
        .wait(2500)
        .click('input[name="propertySearchOptions:advanced"]') 
        .wait(2500)
        .type(textboxSelector, textboxInput)
        .wait(2500)
        .select(dropdownSelector, chosenDropdownOption)
        .wait(2500)
        .click('input[name="propertySearchOptions:search"]') 
        .wait(2500)
        .evaluate(function(){
          return Array.from(
            document.querySelectorAll('a[href*="SearchResults.aspx?rtype"]'))
          .map(a => a.href);
	//	return document.querySelector('body').innerHTML.slice(0, 30).split('=').map(a => a + 'hi!');
	//	return x(document.querySelector('body').innerHTML, ['div[id="content"] div[id="propertySearchResults_searchResults"] table tr td:nth-of-type(2)']);

        })
        .then(function(firstPages){
          console.log("firstPages = ", firstPages);
              var pages = [];
          if(firstPages.length > 0){
            var numPages = firstPages.pop().split('page=').pop();
            console.log("number of pages = ", numPages);
            for(var n = 2; n <= parseInt(numPages, 10); n++){
              pages.push('SearchResults.aspx?rtype=address&page=' + n);
            }
            //var tmp = pages.shift();
            //pages.splice(1, 0, tmp);
            //pages.shift();
          }
	  //else {
	  //    ++index;
	  //    scrapeids();
         // }
          pages.unshift('one page');
          console.log("pages = ", pages);
          return pages;
        })
        .then(function(pages){
			console.log("Pages now equals: ", pages);
          	return pages.reduce(function(accumulated, page){
	            return accumulated.then(function(resultArr){
	                console.log("on page: ", page);
	              	return nightmare
	                .evaluate(function(){
	                  	//using `Array.from` as the DOMList is not an array, but an array-like, sort of like `arguments`
	                  	//planning on using `Array.map()` in a moment
	                  	// return ['Property.aspx?prop_id=228645', 'Property.aspx?prop_id=228579', 'Property.aspx?prop_id=839472', 'Property.aspx?prop_id=768626'];
	                  	return Array.from(
	                    	//give me all of the elements where the href contains 'Property.aspx'
	                    	document.querySelectorAll('a[href*="Property.aspx?prop_id"]'))
	                    	//pull the target hrefs for those anchors
	                    	.map(a => a.href).map(a => a.slice(41));
	                })
	                .end()
	                .then(function(hrefs){
	                	for (var i = 0; i < hrefs.length; i++){
	                		ids.push(hrefs[i]);
	                	}
	                	return ids;
	                })
						//here, there are two options:
						//  1. you could navigate to each link, get the information you need, then navigate back, or
						//  2. you could navigate straight to each link and get the information you need.
						//I'm going to go with #1 as that's how it was in your original script.

						//here, we're going to use the vanilla JS way of executing a series of promises in a sequence.
						//for every href in hrefs,
						//console.log("starting reduce, hrefs are: ", hrefs);
	                 

            	})
	            .then(function(result){
		          	if (page == 'one page'){
		          		return result;
		          	}
		          	else {
		          		return nightmare
		          		.click('a[href="'+page+'"]')
		          	}
	            })

          }, Promise.resolve([]))
        })
        .then(writeResult)
        .then(function(){
        	++index;
        	setTimeout(interval, scrape());
        })
	}

	    function writeResult(result){
	        console.log("writing " + ids.length + " entries");
	        for (var x = 0; x < ids.length; x++){
	            appendFileP(processids, ids[x].slice(22) + '\n');
	        }
		appendFileP('./logs.txt', streetListing[index] + '\n');
		return;
    	}
	return;
}
scrape();
