var fs = require('fs');
path = require('path');

var Nightmare = require('nightmare');
//var nightmare = Nightmare({ openDevTools: true, show: true })
var nightmare = Nightmare();

var Xray = require('x-ray');
var x = Xray();
var Promise = require('bluebird');
var _ = require('lodash');

var appendFileP = Promise.promisify(fs.appendFile);
var writeFileP = Promise.promisify(fs.writeFile);

var css = require('./selectors');
//var utils = require('./utils');
var ids = fs.readFileSync('./processids.txt').toString().split('\n');

var logFile = './log.txt';
var emptyOrErrorFile = './empty-or-error.txt';



var URL = 'TBD';

var index = 0;
var indexEnd = ids.length;
var initialInterval = 4000;
var interval = initialInterval;
var subFolderIndex = 1;
var numOfTries = 0;

console.log("indexEnd = ", indexEnd);


function xP(xRayOptsArr){
    if (xRayOptsArr[2])
    {
        return Promise.promisify(x(xRayOptsArr[0], xRayOptsArr[1], xRayOptsArr[2]));
    }
    else return Promise.promisify(x(xRayOptsArr[0], xRayOptsArr[1]));
}



function scrape() {
    console.log("initializing scrape from index: " + index);
    var nightmare = Nightmare();
    if (index < indexEnd) {

        if (index%100 === 0) {
            appendFileP(logFile, ids[index] + ' ' + new Date().toString() + '\r\n', 'utf8');
            console.log(ids[index] + ' ' + new Date().toString() + '\r\n', 'utf8');
        }
        


        nightmare
        .goto(URL) //connect to the main site
        .wait('input[name="propertySearchOptions:advanced"]')
        .wait(4000)
        .goto(pageURL) //navigate to the specific entry's info page
        .wait('a[id="propertyHeading_searchResults"]')
        .wait(2500)
        .evaluate(function(){
            return document.querySelector('body').innerHTML;
        })
        .then(function(html){
          //console.log('first result', resultArr[0].length)
          return xP([html, {data: css.data}])() //scrape the data from the page
        })
        .then(cleanDetails)
        .then(writeResult)
        //.delay(interval)
        .then(function(){
              console.log("successful scrape for ", ids[index]);
              //streetListing.pop();
              ++index;
              setTimeout(scrape(), interval); //start scraping the next entry after a specified delay (default 4 seconds)
            })
        .catch(function(e){
          if (e.message === 'EmptyProperty'){
            console.log('EmptyProperty');
              ++index;
              setTimeout (scrape, interval / 2);
          }
          else {
                return appendFileP(logFile, new Date().toString() + " unhandled error at " + street + index + ' ' + e + '\r\n', 'utf8')
                    .then(function(){
                        if (numOfTries < 2){
                            console.log("Looks like some other error, I'll retry: %j", e.message);
                            ++numOfTries;                      
                            setTimeout (scrape, interval * 5);
                            return nightmare.end();
                        }
                        else {
                            console.log("Tried 3 times, moving on");
                            ++index;
                            numOfTries = 0;
                            setTimeout (scrape, interval * 5);
                            return nightmare.end();
                        }
                    });
            }
        })

    }
    
    //this function is for you to define, determined by how you want the information to be formatted.
    function processInformaition(result){}


    //Writes a copy to deep path, and a flattened copy to flat path
    function writeResult(result){
        console.log("writing");
            var propertyNumber = result.PropertyDetails["account"]["Property_ID"];
            var flatPath = resultPathFlattened + subFolderIndex + '/'
            var deepPath = resultPathDeep + subFolderIndex + '/';
            writeFileP(deepPath + propertyNumber + '.json', JSON.stringify(result))
            .then(writeFileP(flatPath + propertyNumber + '.json', JSON.stringify(flatten(result,{}))))
            .then(writeFileP('indexLog.txt', index + '\n'))
            return nightmare.end();
    }

}

scrape();

function flatten (obj, result, prefix){
    //console.log("flattening");
    if (_.isObject(obj)) {
        _.each(obj, function(v, k) {
            flatten(v, result, prefix ? prefix + '_' + k : k);
        })
    } else {
        result[prefix] = obj;
    }
    return result;
}
