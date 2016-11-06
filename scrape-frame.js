var fs = require('fs');
path = require('path');
var Promise = require('bluebird');

var appendFileP = Promise.promisify(fs.appendFile);
var writeFileP = Promise.promisify(fs.writeFile);

var name = process.argv[3];
var selectorFile;
var testingFile;
//node scrape-frame new name url method [direct, nightmare, crawler]
//node scrape-frame new name url page
//node scrape-frame run name
//npm test



function main(){
    if (process.argv[2] === 'new'){
        var promise = new Promise(function(resolve, reject){
            fs.mkdirSync('scrapers/' + name);
            resolve();
        });

        promise.then(createScrape)
            .then(function(fileArray){
                var fileNames = ['scrape.js', 'selectors.js', 'testing-file.js', 'gulpfile.js', 'results.json'];
                console.log(fileArray.length);
                for (var i = 0; i < fileArray.length; i++){
                        console.log("writing ", fileNames[i]);
                        for(var c = 0; c < fileArray[i].length; c++){
                            appendFileP('./scrapers/' + name + '/' + fileNames[i], fileArray[i][c] + '\n');
                        }
                }
                return fileArray;
            })
            .then(function(fileArray){
                console.log("The frame for your scraper has been created!");
                console.log("Look for it in the 'scrapers' directory.");
                console.log("Open the instructions.txt file to configure it to your needs.");
                console.log("Happy scraping!");
                return fileArray;
            })

        
    }


    function createScrape(){
        var url = (process.argv[4] ? process.argv[4].toString() : 'TBD');
        var fileArray = [];
        var newScrape;
        var testFile;
        var pushPromise = new Promise(function(resolve,reject){
            resolve();
        })
        switch (process.argv[5]){
            case 'direct':
                newScrape = './directScrape.js';
                testFile = './testing-file.js'; 
                break;
            case 'nightmare':
                newScrape = './nightmareScrape.js'; 
                testFile = './nightmare-testing-file.js';    
                break;
            case 'page-crawler':
                newScrape = './page-crawler.js';
                testFile = './direct-testing-file';    
            default:
                //var output = findScrapeType(url);
                newScrape = output[0];
                testFile = output[1];
        }

        var newFileArray = pushPromise.then(function(){
            fileArray.push(fs.readFileSync(newScrape).toString().split('\n'));
        })
        .then(function(){
            fileArray.push(fs.readFileSync('./skeleton-selectors.js').toString().split('\n'));
        })
        .then(function(){
            fileArray.push(fs.readFileSync(testFile).toString().split('\n'));
        })
        .then(function(){
            fileArray.push(fs.readFileSync('./gulpfile.js').toString().split('\n'));
        })
        .then(function(){
            fileArray.push(fs.readFileSync('./results.json').toString().split('\n'));
            return fileArray;
        })
        .then(function(fileArr){
            fileArray[0][24] = fileArray[0][24].split("'",2) + url + ";";
            return fileArray;
        })

        return newFileArray;
    }

}

// function findScrapeType(url, page = null){
//     if (page === null){
//         //attempt to navigate to a far away page, and then directly access that page
//         nightmare
//             .goto(url)
//             .evaluate() //find a button and return it
//             .then(function(foundButton){
//                 return nightmare
//                     .click(foundButton)
//                     .wait(2500)
//                     .evaluate() //return url of page
//                     .then(function(pageURL){
//                         return nightmare
//                             .goto(pageURL)
//                             .evaluate() //see what is on page
//                             .then(function(result){
//                                 //figure out if page is timeout/error or if it is full page. Compare to full page?
//                             })
//                     })
//             })
//     }
//     else {
//         //crawl to page, record, and then directly access page and compare.
//     }
// }

main();

// module.exports = {
//     //findScrapeType: findScrapeType,
//     createScrape: createScrape
// };
