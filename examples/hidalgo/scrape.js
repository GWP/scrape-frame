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
var hidTestURL = 'http://propaccess.hidalgoad.org/ClientDB/PropertySearch.aspx?cid=1';
var ids = fs.readFileSync('./processids.txt').toString().split('\n');

var logFile = './log.txt';
var multImprovementFile = './multiple-improvements.txt';
var emptyOrErrorFile = './empty-or-error.txt';
var resultPathDeep = './scraped-data/deep/';
var resultPathFlattened = './scraped-data/flat/';

//start index was 86
var index = 383;
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
        //TODO: Write code that zips results and deletes temporary folders when index is 25K
        if (index%5000 === 0) { //group data into folders of 5000
            ++subFolderIndex;
            var flatPath = resultPathFlattened + subFolderIndex + '/';
            var deepPath = resultPathDeep + subFolderIndex + '/';
            fs.mkdirSync(deepPath);
            fs.mkdirSync(flatPath);
            var currentTime = new Date();
            interval = (currentTime.getHours() > 7 && currentTime.getHours() < 19) ? initialInterval : initialInterval * 0.5;
        }

        var pageURL = 'http://propaccess.hidalgoad.org/ClientDB/Property.aspx?prop_id=' + ids[index];

        nightmare
        .goto(hidTestURL) //connect to the main site
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


    //takes the returned JSON from x-ray and formats the data into a new JSON, cutting off extra characters and neatly organizing useful information into a nested form.
    function cleanDetails(result){
       //console.log("cleaning ", result);
        var cleanData = {};
        var kmap = {"PropertyDetails": [[result.data.propertyDetails], cleanPropertyDetails],
                    "ValueDetails": [[result.data.valuesDetails], cleanValuesDetails],
                    "LandDetails": [[result.data.landDetails, result.data.landDetailsHeaders], cleanLandDetails],
                    "Improvements": [[result.data.improvements, result.data.improvementHeaders], cleanImprovements]
                    };
        //console.log("valueDetails.length: ", result.data.valueDetails.length);
        _.forEach(kmap, function(value, key){
            //console.log("forEaching on " + key + " and " + value);
            var intermed = (value[0][0] ? value[0][0] : []);
            if (intermed.length > 0){
                cleanData[key] = (value[0].length > 1 ? value[1](intermed, value[0][1]) : value[1](intermed));
            }
        });
        //writeFileP("cleanImp.json", JSON.stringify(cleanData));
        return cleanData;
    }


    //prepares the Property Details tab for sending by cutting off excess characters and splitting up bits of information for insertion into JSON.
    function cleanPropertyDetails(intermedPD){
        var cleanPD = {};
        cleanPD.account = {};
        cleanPD.location = {};
        cleanPD.owner = {};
        if (intermedPD.length === 1){
            return intermedPD[0];
        }
        for (var v = 0; v < intermedPD.length; v++){
            if([0,21,32,43].indexOf(v) !== -1){
                continue;
            }
            else {
                if(/:/.exec(intermedPD[v]) !== null){
                    var key = intermedPD[v].slice(0,-1);
                    key = key.replace(/ /,"_");
                    if(v < 21){
                        cleanPD.account[key] = intermedPD[v+1];
                    }
                    else if(v < 32){
                        cleanPD.location[key] = intermedPD[v+1];
                    }
                    else{
                        cleanPD.owner[key] = intermedPD[v+1];
                    }
                }
            }
        }
        //console.log("cleanPD = ", cleanPD);
        return cleanPD;
    }


    function cleanValuesDetails(intermedVD){
        var cleanVD = {};
        if (intermedVD.length === 1){
            return intermedVD[0];
        }
        for (var v = 0; v < intermedVD.length; v++){
            //console.log("intermedVD is longer than zero");
            if(/:/.exec(intermedVD[v]) !== null){
                var key = intermedVD[v].slice(0,-1);
                key = key.replace(/ /g,"_");
                cleanVD[key] = intermedVD[v+2];
            }
        }
        //console.log("cleanVD = ", cleanVD);
        return cleanVD;
    }

    function cleanLandDetails(intermedLD, intermedLandHead){
        //console.log("cleaning land details: ", intermedLandHead.length);
    if (intermedLD.length === 1){
        return intermedLD[0];
    }
        var cleanLD = {};
        var landEntry = 0;
        for (var v = 0; v < intermedLD.length; v++){
            var currentAttribute = intermedLandHead[v % 9].replace(/ /,"_");
            if (v % 9 === 0){
                landEntry = intermedLD[v]; //landDetails can contain 1 or more entries, each with eight attributes
                //console.log("landEntry = ", landEntry);
                cleanLD[landEntry] = {};
            }
            else{
                cleanLD[landEntry][currentAttribute] = intermedLD[v];
            }
        }
        //console.log("cleanLD = ", cleanLD);
        return cleanLD;
    }

    function cleanImprovements(improvements, improvementHeaders){
        //console.log("cleaning improvements: ", improvements.length);
        var cleanImp = {};
        var impNum = 0;
        var impMod = 0;
        var subImpNum = 0;
        if (improvements.length === 1){
            return improvements[0];
        }
        for (var n = 0; n < improvements.length; n++){
            //console.log("more than zero improvements: ", improvements.length);
            //console.log("n = ", n);
            //var tmp = n+4;
            //console.log(improvements[tmp].replace(/\s/g, " ") === " ");
            //console.log();
            if(n < improvements.length - 6 && improvements[n+4].replace(/\s/g, " ") === ' ' && improvements[n+5].replace(/\s/g, " ") === ' '){
                ++impNum;
                cleanImp[impNum] = {};
                cleanImp[impNum].type = improvements[n];
                cleanImp[impNum]["State_Code"] = improvements[n+1];
                cleanImp[impNum]["Living_Area"] = improvements[n+2];
                cleanImp[impNum]["Value"] = improvements[n+3];
                impMod = -5;
                //console.log("made new imp. First values are: ", cleanImp[impNum]);
                subImpNum = 1;
            }
            else if(impMod >= 0){
                //console.log("switching for n = ", n);
                //console.log("impMod = ", impMod);
                switch(impMod % 7){
                    case 0:
                        cleanImp[impNum][subImpNum] = {};
                        break;
                    case 1:
                        // if(cleanImp[impNum][subImpNum].hasOwnProperty(improvements[n]) === false){
                        //     cleanImp[impNum][subImpNum][improvements[n]] = {};
                        // }
                        cleanImp[impNum][subImpNum]["Type"] = improvements[n];
                        break;
                    case 2:
                        // if(cleanImp[impNum][subImpNum][improvements[n-1]].hasOwnProperty(improvements[n]) === false){
                        //     cleanImp[impNum][subImpNum][improvements[n-1]][improvements[n]] = {};
                        // }
                        cleanImp[impNum][subImpNum]["Description"] = improvements[n];
                        break;
                    case 3:
                        cleanImp[impNum][subImpNum]["Class_CD"] = improvements[n];
                        break;
                    case 4:
                        cleanImp[impNum][subImpNum]["Exterior_Wall"] = improvements[n];
                        break;
                    case 5:
                        cleanImp[impNum][subImpNum]["Year_Built"] = improvements[n];
                        break;
                    case 6:
                        cleanImp[impNum][subImpNum]["sqft"] = improvements[n];
                        impMod = -1;
                        ++subImpNum;
                        break;
                }
            }
            //console.log("subImpMod: ", subImpMod);
            impMod = impMod + 1;
            //console.log("impMod after add: ", impMod);
        }
        //console.log("cleanImp = %j", cleanImp);
        //writeFileP("cleanImp.json", JSON.stringify(cleanImp));
        return cleanImp;
    }


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
