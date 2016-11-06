var fs = require('fs');
path = require('path');

var Xray = require('x-ray');
var x = Xray();
var Promise = require('bluebird');
var _ = require('lodash');

var appendFileP = Promise.promisify(fs.appendFile);
var writeFileP = Promise.promisify(fs.writeFile);

var selectorMap = require('./selectors');
var utils = require('./utils');

var logFile = './log.txt';
var emptyOrErrorFile = './empty-or-error.txt';
var outputFolder = './output';

var index = 0;
var indexEnd = 1;
var initialInterval = 4000;
var interval = initialInterval;
var numOfTries = 0;

var URL = 'TBD';
var xRayInput = [URL, selectorMap];



//promise version of xray scraper
function xP(xRayOptsArr){
    if (xRayOptsArr[2])
    {
        return Promise.promisify(x(xRayOptsArr[0], xRayOptsArr[1], xRayOptsArr[2]));
    }
    else return Promise.promisify(x(xRayOptsArr[0], xRayOptsArr[1]));
}


function scrape() {
	console.log("initializing scrape from index: " + index);
    if (index < indexEnd) {
        
        xP(xRayInput)()
        .then(filterEmpty)
        .then(processInformation)
        .then(waitForAll)
        .then(writeResult)
        .delay(interval)
        .then(function(){
          ++index;
          console.log("successful scrape");
          scrape();
        })
          
        .catch(function(e){
            if (e.message === 'EmptyProperty'){
                console.log('EmptyProperty');
                ++index;
                setTimeout (scrape, interval / 2);
            }
            else {
                return appendFileP(logFile, new Date().toString() + " unhandled error at " + propertyNumber + ' ' + e + '\r\n', 'utf8') //deals with any remaining errors
                    .then(function(){
                    	if (numOfTries < 2){
                            console.log("Looks like some other error: %j", e.message);
                            console.log("I'll retry");
                            setTimeout (scrape, interval * 5);
                            ++numOfTries;
                    	}
                    	else {
                    		console.log("Tried 3 times, moving on");
                    		++index;
                    		numOfTries = 0;
                    		setTimeout (scrape, interval * 5);
                    	}
                    })
            }
        })

    }

    function filterEmpty(resultArr) {
      if (!(resultArr[0] >= 0)){
        return appendFileP(emptyOrErrorFile, propertyNumber + '\r\n', 'utf8')
        .then(function(){
          throw new Error('EmptyProperty');
        });
      }
      else {
          return resultArr;
      }
    }

    //this function is for you to define, determined by how you want the information to be formatted.
    function processInformaition(result){}

    //waits for all the promises in the previous function to resolve before proceeding with the formatting process.
	function waitForAll(result) {
		//console.log("waiting", resultArr);
        return Promise.all(result).then(function(resArr){          
            result.pop();
            result.push(resArr);
            return result;
        })
    }

    function writeResult(result){
    	console.log("writing");
        outputFileName = 'TBD';
        writeFileP(outputFolder + '/' + outputFileName, result) //don't forget to JSON.stringify(result) if 'result' is still in JSON format
        
    }
}

scrape();
