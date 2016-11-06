/*
This file is what you will use to find your selectors, and/or define the path that your scraper will take through the website. 
You will spend more time altering and running this file than anything else. A gulp server is constantly watching for saved changes to this file, and will automatically run the file everytime it detects something.
To begin, make sure you are in the top level directory of your project, and then run the 'gulp' command, to start your server.
You should now see that your results.json file contains some information about a Building Number, as was specified by the exampleString selector.
*/


var Nightmare = require('nightmare');

//use the first declaration of nightmare below for development, and then switch to the bare bones one below that one when you are running your scraper for real.
var nightmare = Nightmare({ openDevTools: true, show: true })
//var nightmare = Nightmare();
var Xray = require('x-ray');
var x = Xray();


var html = require('./html.js').html;
var css = require('./jeffco/selectors');
var _ = require('lodash');
var fs = require("fs");


var URL = 'TBD';

var exampleURL = 'http://gisapp.adcogov.org/quicksearch/doreport.aspx?pid=0172110305003';
var exampleString = ['span span div span:contains("Building Number:") + table tr td']; //<==== don't forget to enclose the string in brackets if you want to accept multiple return strings

nightmare
  .goto(URL)
  .wait(2500) //be liberal with waiting when it comes to page loading. Alternatively, one can do:
  //.wait(CSS-selector) <==== wait for an element of the page to be loaded
  //.wait(200) //it's good to add a little time for rendering, even after the element is loaded
  .evaluate(function() { //this is for running some code in the browser, good for extracting html.
    return document.querySelector('body').innerHTML;
  })
  .then(function(body) {
    console.log('body', body);
    return body;
  })
  .write('results.json');


/*
Optionally, I recommend using the block below to write an entire page to a local file, and then using that html as the argument for the xray instance above. 
That way, you do not have to hit the site everytime you are testing something, you can just hit it once, and then run everything locally. 
It is much faster, and allows you to work without an internet connection. (see example project)
*/

//   x(result, 'body@html')
//     .write('html.js');


//Below is the block of code used for testing a direct non-nightmare scraper

/*
console.log("Scraping URL: ", exampleURL);
x(exampleURL, exampleString)
  // (function(err, test){
  // //console.log('test: ', test);
  // //console.log('error ', err);
  // })
 .write('results.json'); //Note: I've found that this write only works reliably if the function before it is commented out.
 */