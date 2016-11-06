var fs = require('fs');
path = require('path');

var Xray = require('x-ray');
var x = Xray();
var Promise = require('bluebird');
var _ = require('lodash');

var appendFileP = Promise.promisify(fs.appendFile);
var writeFileP = Promise.promisify(fs.writeFile);

var css = require('./selectors');
var utils = require('./utils');

var logFile = './log.txt';
var multImprovementFile = './multiple-improvements.txt';
var emptyOrErrorFile = './empty-or-error.txt';
var resultPathDeep = './scraped-data/deep/';
var resultPathFlattened = './scraped-data/flat/';

var index = 41296;
var indexEnd = 999999999;
var initialInterval = 4000;
var interval = initialInterval;
var subFolderIndex = 9;
var numOfTries = 0;

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
        var propertyNumber = utils.padToNine(index);

        if (index%100 === 0) {
            appendFileP(logFile, propertyNumber + ' ' + new Date().toString() + '\r\n', 'utf8');
            console.log(propertyNumber + ' ' + new Date().toString() + '\r\n', 'utf8');
        }

        if (index%5000 === 0) { //organize results in folders of 5000 entries each
            ++subFolderIndex;
            var flatPath = resultPathFlattened + subFolderIndex + '/';
            var deepPath = resultPathDeep + subFolderIndex + '/';
            fs.mkdirSync(deepPath);
            fs.mkdirSync(flatPath);
            var currentTime = new Date();
            interval = (currentTime.getHours() > 7 && currentTime.getHours() < 19) ? initialInterval : initialInterval * 0.5;
        }

        xP([utils.getPropertyPageUrL(propertyNumber), {
					  generalInformation: css.generalInformation,
					  propertyInventory: css.propertyInventory,
					  improvements: css.improvements
					}])()
        .then(filterEmpty)
        .then(cleanGeneralInformation)
        .then(cleanPropertyInventory)
        .then(scrapeNeighborhoodSalesAndImprovements)
        .then(waitForAll)
        .then(cleanNeighborhoodSalesInfo)
        .then(cleanImprovements)
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
                        console.log("Looks like some other error, I'll retry: %j", e.message);
                        setTimeout (scrape, interval * 5);
                        ++numOfTries;
                    	}
                    	else {
                    		console.log("Tried 3 times, moving on");
                    		++index;
                    		numOfTries = 0;
                    		setTimeout (scrape, interval * 5);
                    	}
                    });
            }
        })

    }

    

	//early test function, specifically scraped the number of improvements for a given entry.
	function scrapeImprovementNumber(resultArr){
	  if(resultArr.length >= 1){
	  	console.log(resultArr);
	  	for (var i = 0; i < resultArr.length; i++){
	  		console.log('character ' + i + ' = ' + resultArr[i] + ' ' + '\r\n');
	  	}
	    return appendFileP(multImprovementFile, propertyNumber + ' ' + resultArr.length + '\r\n' + resultArr, 'utf8');
	  }
	}

	//checks to see if the URL information exists
	function filterEmpty(resultOne) {
		//console.log("filtering", resultOne);
      if (!(resultOne.generalInformation.pin)){
        return appendFileP(emptyOrErrorFile, propertyNumber + '\r\n', 'utf8')
        .then(function(){
          throw new Error('EmptyProperty');
        });
      }
      else {
      		console.log("finished filtering");
          return resultOne;
      }
    }


	//prepares the General Information tab for sending by cutting off excess characters and splitting up bits of information for insertion into JSON.
	function cleanGeneralInformation(resultTwo){
		console.log("cleaning GI");
		var genInfo = resultTwo.generalInformation;
		var cleanGenInfo = {};		
		cleanGenInfo.pin = genInfo.pin.slice(genInfo.pin.indexOf(':') + 1);
		cleanGenInfo.parcelNumber = genInfo.parcelNumber.slice(genInfo.parcelNumber.indexOf(':') + 1);
		cleanGenInfo.propertyType = genInfo.propertyType.slice(genInfo.propertyType.indexOf(':') + 1, genInfo.propertyType.indexOf('\n') - 1);
		var idx = /\s[a-z]{2}\s/gi.exec(genInfo.propertyAddressCityState).index;
		cleanGenInfo.propertyAddressCity = genInfo.propertyAddressCityState.slice(0, idx);
		cleanGenInfo.propertyAddressState = genInfo.propertyAddressCityState.slice(idx, idx + 3);
		cleanGenInfo.propertyAddressZip = genInfo.propertyAddressCityState.slice(idx + 3);
		cleanGenInfo.neighborhoodNumber = genInfo.neighborhood.slice(genInfo.neighborhood.indexOf(':') + 1, genInfo.neighborhood.indexOf('-'));
		cleanGenInfo.neighborhoodName = genInfo.neighborhood.slice(genInfo.neighborhood.indexOf('-') + 1);
		resultTwo.generalInformation = cleanGenInfo;
		var resultArr = [resultTwo];
		console.log("finished cleaning GI");
		return resultArr;
	}

	//prepares the Property Inventory tab for sending by cutting off excess characters and splitting up bits of information before inserting them into the JSON object.
	function cleanPropertyInventory(resultArr){
		console.log("cleaning PI");
		var intermedPI = resultArr[0].propertyInventory;
		//console.log("propertyInventory improvement length: " + intermedPI.improvementNumber.length);
		var propertyInventory = {};
		var splitArray = (intermedPI.inventoryPropertyType ? intermedPI.inventoryPropertyType.split("\n") : [[],[],[]]);
		propertyInventory.propertyType = splitArray[2];
		propertyInventory.numberOfImprovements = intermedPI.improvementNumber.length;
		propertyInventory.yearBuilt = {};
		propertyInventory.yearBuilt.new = (intermedPI.yearBuiltAndAdjusted[0] ? intermedPI.yearBuiltAndAdjusted[0].split("\n")[2] : null);
		propertyInventory.yearBuilt.adjusted = (intermedPI.yearBuiltAndAdjusted[1] ? intermedPI.yearBuiltAndAdjusted[1].split("\n")[2] : null);
		propertyInventory.design = (intermedPI.design[0] ? intermedPI.design[0].split("\n")[2] : null);
		propertyInventory.subdivision = {};
		propertyInventory.subdivision.number = (intermedPI.subdivisionName[0] ? intermedPI.subdivisionName[0].split("\n")[2] : null);
		propertyInventory.subdivision.name = (intermedPI.subdivisionName[0] ? intermedPI.subdivisionName[0].split("\n")[5] : null);
		propertyInventory.totalLand = intermedPI.propertyTotalLand[0];
		propertyInventory.taxInformation = {};
		propertyInventory.taxInformation.payableTwentySeventeen = {};
		propertyInventory.taxInformation.payableTwentySeventeen.actual = intermedPI.taxInformation[1];
		propertyInventory.taxInformation.payableTwentySeventeen.assessed = intermedPI.taxInformation[3];
		resultArr[0].propertyInventory = propertyInventory;
		console.log("finished cleaning PI");
		return resultArr;
	}

	//iterates through the Neighborhood Sales tab, and all the improvement URLs, and stores them as separate JSONs in the result array.
	function scrapeNeighborhoodSalesAndImprovements(resultArr){
		console.log("scraping NSI and Imps");
		var promiseArr = [];
		var neighborhoodSalesURL = utils.getNeighborhoodSalesURL(utils.padToNine(index));
		promiseArr.push(xP([neighborhoodSalesURL, {neighborhoodSales: css.neighborhoodSalesInfo}])()); //scrape neighborhood sales info
		var impnbr = resultArr[0].propertyInventory.numberOfImprovements;
		console.log("impnbr: " + impnbr);
		console.log(utils.getPropertyImpURLs(propertyNumber, 3));
		if (impnbr > 1){
    		var propertyImpURLs = utils.getPropertyImpURLs(propertyNumber, impnbr);
			console.log("propimpurl: " + propertyImpURLs);
    		//console.log("propimpurl length: " + propertyImpURLs.length);
    		for (var u = 0; u < propertyImpURLs.length; u++){
				promiseArr.push(xP([propertyImpURLs[u], {propertyInventory: css.propertyInventory, improvements: css.improvements}])()); //scrape improvement info
    		}
		}
		resultArr.push(promiseArr);
		console.log("finished scraping NSI and Imps");
		return resultArr;
	}

	//waits for all the promises in the previous function to resolve before proceeding with the formatting process.
	function waitForAll(resultArr) {
		//console.log("waiting", resultArr);
        return Promise.all(resultArr[1]).then(function(resArr){            //Todo: think of merging card data & card improvements
            resultArr.pop();
            resultArr.push(resArr);
            return resultArr;
        })
    }

	//retrieves information from the Neighborhood Sales array, cleans and formats it into JSON, before updating the array.
	function cleanNeighborhoodSalesInfo(resultArr){
		console.log("cleaning NSI");
		//console.log("resultArr: %j", resultArr);
		var nSalesArray = resultArr[1][0].neighborhoodSales.neighborhoodSales;
		var nSalesInfo = {};
		var values = (nSalesArray[2] ? nSalesArray[2].split("\n") : [null,null,null,null,null,null,null,null,null,null,null,null,null]);
		nSalesInfo.type = values[1];
		nSalesInfo.design = values[2];
		nSalesInfo.yearBuilt = {};
		nSalesInfo.yearBuilt.new = values[3];
		nSalesInfo.yearBuilt.adjusted = values[4];
		nSalesInfo.qual = values[5];
		nSalesInfo.construct = values[6];
		nSalesInfo.livingArea = {};
		nSalesInfo.livingArea.sqft = values[7];
		nSalesInfo.basement = {};
		nSalesInfo.basement.sqft = values[8];
		nSalesInfo.basement.fin = values[9];
		nSalesInfo.basement.bwgw = values[10];
		nSalesInfo.garage = {};
		nSalesInfo.garage.sqft = values[11];
		nSalesInfo.garage.type = values[12];
		resultArr[0].neighborhoodSalesInfo = nSalesInfo;
		//console.log("nSalesInfo: ", nSalesInfo);
		return resultArr;
	}

	//iterates through all the improvement arrays and formats the data into JSON
    function cleanImprovements(resultArr){
    	console.log("cleaning Imps");
    	var impnbr = (resultArr[1].length ? resultArr[1].length : 1);
		for (var a = 0; a < impnbr; a++){
			var intermedImp = [];
			var impPropInv = {};
			var imprv = {};
			var entireImprvObject = {};
			if (a === 0){ //if it is the first improvement, take information from the initial scraping, instead of scraping again for just the improvement information
				intermedImp = (resultArr[0].improvements.improvements ? resultArr[0].improvements.improvements : []);
				impPropInv.propertyType = resultArr[0].propertyInventory.propertyType;
				impPropInv.yearBuilt = resultArr[0].propertyInventory.yearBuilt;
				impPropInv.yearBuilt.new = resultArr[0].propertyInventory.yearBuilt.new;
				impPropInv.yearBuilt.adjusted = resultArr[0].propertyInventory.yearBuilt.adjusted;
				impPropInv.design = resultArr[0].propertyInventory.design;
				delete resultArr[0].improvements;
				resultArr[0].improvements = {};
			}
			else {
				intermedImp = (resultArr[1][a].improvements.improvements ? resultArr[1][a].improvements.improvements : []);
				impPropInv = cleanImprovementPropertyInventory(resultArr[1][a].propertyInventory);

			}
			var implen = (intermedImp.length ? intermedImp.length : 0);
			var headerIndexes = [];
			var headers = [];
			var impArr = [];
			for (var i = 0; i < implen; i++){
				var holder = (intermedImp[i] ? intermedImp[i].split("\n") : [null,null,null]);
				if(/\t/i.exec(holder[1]) !== null){
					headerIndexes.push(i);
					headers.push(holder[1].split("\t")[1].replace(/ /,"_"));
				}
				impArr.push(holder);
			}
			headerIndexes.push(implen);
			var headCount = 0;
			while (headCount < headerIndexes.length - 1){
				var currentHeader = headers[headCount];
				var currentHeaderIndex = headerIndexes[headCount];
				imprv[currentHeader] = {};

				for (var f = currentHeaderIndex+1; f < headerIndexes[headCount+1]; f++){
					if(impArr[currentHeaderIndex].length > 3){
						var currentItem = impArr[f][1].replace(/ /,"_");
						imprv[currentHeader][currentItem] = {};
						for(var h = 2; h < impArr[currentHeaderIndex].length-1; h++){
							imprv[currentHeader][currentItem][impArr[currentHeaderIndex][h].replace(/ /,"_").split("\t")[1]] = impArr[f][h].replace(/ /,"_"); //e.g improvement.area.sqft
						}	
					}
					else {
						imprv[currentHeader][impArr[f][1].replace(/ /,"_")] = true; //e.g improvement.area
					}
				}
				++headCount;
			}
			resultArr[0].improvements[a+1] = {improvementPropertyInventory: impPropInv, improvements: imprv};
		}
		return resultArr;
		//console.log("result after cleaning: " + resultArr);
    }

    //moves everything in the result array into a single JSON object, and then writes a copy to deep path, and a flattened copy to flat path
    function writeResult(resultArr){
    	console.log("writing");
    	var result = resultArr[0];
      	var flatPath = resultPathFlattened + subFolderIndex + '/'
      	var deepPath = resultPathDeep + subFolderIndex + '/';
        writeFileP(deepPath + propertyNumber + '.json', JSON.stringify(result))
        .then(writeFileP(flatPath + propertyNumber + '.json', JSON.stringify(flatten(result,{}))))
    }

    //each improvement comes with its own set of Property Inventory information, which is formatted and inserted as part of the appropriate improvement entry in the JSON
    function cleanImprovementPropertyInventory(impPropInv){
		console.log("cleaning impPropInv");
		var intermedPI = impPropInv;
		//console.log("propertyInventory improvement length: " + intermedPI.improvementNumber.length);
		var propertyInventory = {};
		var splitArray = (intermedPI.inventoryPropertyType ? intermedPI.inventoryPropertyType.split("\n") : [[],[],[]]);
		propertyInventory.propertyType = splitArray[2];
		propertyInventory.yearBuilt = {};
		propertyInventory.yearBuilt.new = (intermedPI.yearBuiltAndAdjusted[0] ? intermedPI.yearBuiltAndAdjusted[0].split("\n")[2] : null);
		propertyInventory.yearBuilt.adjusted = (intermedPI.yearBuiltAndAdjusted[1] ? intermedPI.yearBuiltAndAdjusted[1].split("\n")[2] : null);
		propertyInventory.design = (intermedPI.design[0] ? intermedPI.design[0].split("\n")[2] : null);
		console.log("finished cleaning impPropInv");
		return propertyInventory;
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

