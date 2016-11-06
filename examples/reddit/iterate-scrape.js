var Nightmare = require('nightmare');
var nightmare = Nightmare({ openDevTools: true, show: true })
//var nightmare = Nightmare();
var Xray = require('x-ray');
var x = Xray();

var html2 = require('./html2.js').html;
var html1 = require('./html1.js').html;
var html = require('./html.js').html;
var css = require('./jeffco/selectors');
var _ = require('lodash');
var papaparse = require('papaparse');
var fs = require("fs");



nightmare
.goto(hidTestURL)
.wait(2500)
//.goto('http://propaccess.hidalgoad.org/ClientDB/Property.aspx?prop_id=185010')
.wait('input[name="propertySearchOptions:advanced"]')
.wait(200)
.click('input[name="propertySearchOptions:advanced"]') //start navigating to listing page
.wait('select[name="propertySearchOptions:recordsPerPage"]')
.wait(2000)
.type('input[name="propertySearchOptions:streetName"]', 'Pleasant')
.wait('select[name="propertySearchOptions:recordsPerPage"]')
.wait(200)
.select('select[name="propertySearchOptions:recordsPerPage"]', '25')
//.wait('input[name="propertySearchOptions:search"]')
.wait(2000)
.click('input[name="propertySearchOptions:search"]') //at listing page
.wait(2000)
.evaluate(function(){
  return Array.from(
    document.querySelectorAll('a[href*="SearchResults.aspx?rtype"]'))
  .map(a => a.href);

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
  pages.push('one page');
  console.log("pages = ", pages);
  return pages;
})
.then(function(pages){
  return pages.reduce(function(accumulated, page){
    return accumulated.then(function(result){
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
        .then(function(hrefs){
          //here, there are two options:
          //  1. you could navigate to each link, get the information you need, then navigate back, or
          //  2. you could navigate straight to each link and get the information you need.
          //I'm going to go with #1 as that's how it was in your original script.

          //here, we're going to use the vanilla JS way of executing a series of promises in a sequence.
          //for every href in hrefs,
          //console.log("starting reduce, hrefs are: ", hrefs);
          return hrefs.reduce(function(accumulator, href){
            //return the accumulated promise results, followed by...
            console.log("We're on: ", href);
            return accumulator.then(function(results){
              return nightmare
                //click on the href
                .click('a[href="'+href+'"]')
                .wait(2500)
                //get the html
                .evaluate(function(){
                  return document.querySelector('html').innerHTML;
                })
                //add the result to the results
                .then(function(html){
                  results.push(html);
                  return results;
                })
                .then(function(results){
                  //click on the search result link to go back to the search result page
                  if (page == 'one page'){
                    console.log("it's that page");
                    return nightmare
                      .click('a[id="propertyHeading_searchResults"]')
                      .wait(2500)
                      .then(function() {
                        //make sure the results are returned
                         console.log("just did: ", results);
                        return results;
                      })
                  }
                  else {
                    return nightmare
                      .click('a[id="propertyHeading_searchResults"]')
                      .wait(2500)
                      .then(function() {
                        //make sure the results are returned
                         console.log("just did: ", results);
                        return results;
                      })
                      .click('a[href="'+page+'"]')
                  }
                })
            });
          }, Promise.resolve([])) //kick off the reduce with a promise that resolves an empty array
        })
        .then(function(accumResult){
              resultArr.push(accumResult);
              return resultArr;
            })
    })

  }, Promise.resolve([]))

})
.then(function (resultArr) {
  //if I haven't made a mistake above with the `Array.reduce`, `resultArr` should now contain all of your links' results
  console.log('resultArr', resultArr.length);
  console.log('first result', resultArr[0].length)
  x(resultArr[0], 'body@html') //output listing page html
    .write('results.json');
});