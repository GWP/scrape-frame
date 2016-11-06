var scrape-frame = require('./scrape-frame');

it('findScrapeType should return direct', function(done){
	assert.strictEqual(findScrapeType('www.reddit.com'), 'direct');
	done();
})



it('findScrapeType should return nightmare', function(done){
	assert.strictEqual(findScrapeType(propURL), 'nightmare');
	done();
})


it('created file should be equal to the chosen scrape type with appropriate user entered values included', function(done){
	fileArray.push(fs.readFileSync(newScrape).toString().split('\n'));
	
})
