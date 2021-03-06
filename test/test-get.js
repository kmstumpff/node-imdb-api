var http = require('http');
var nock = require('nock');
var nodeunit = require('nodeunit');

var imdb = require('../lib/imdb.js');

module.exports.testGetSuccessful = function(test) {
	var scope = nock('http://deanclatworthy.com').get('/imdb/?q=The%20Toxic%20Avenger&yg=0').reply(200, require('./data/toxic-avenger.json'));

	return imdb.get('The Toxic Avenger', testResults);

	function testResults(err, data) {
		test.ifError(err);

		test.ok(data);
		test.equal(data.imdbid, 'tt0090191', "testing returned data");
		test.equal(data.series, false, "testing series bool");
		test.equal(data.hasOwnProperty("episodes"), false, "should not have episodes");

		test.done();
	}
}

module.exports.testGetRateLimited = function(test) {
	var scope = nock('http://deanclatworthy.com').get('/imdb/?q=The%20Green%20Mile&yg=0').reply(200, { code: 2, error: "rate limited" });

	return imdb.get('The Green Mile', testResults);

	function testResults(err, data) {
		test.ifError(data);

		test.deepEqual(err, new imdb.ImdbError('rate limited: The Green Mile', { name:'The Green Mile', id: undefined }), "testing error code");

		test.done();
	}
}

module.exports.testGetUnsuccessful = function(test) {
	var scope = nock('http://deanclatworthy.com').get('/imdb/?q=The%20Green%20Mile&yg=0').reply(404);

	return imdb.get('The Green Mile', testResults);

	function testResults(err, data) {
		test.ifError(data);

		test.done();
	}
}

module.exports.testGetMadeupMovie = function(test) {
	var scope = nock('http://deanclatworthy.com').get('/imdb/?q=asdfasdfasdf&yg=0').reply(200, { code: 1, error: "Film not found" });

	return imdb.get('asdfasdfasdf', testResults);

	function testResults(err, data) {
		test.ifError(data);

		test.deepEqual(err, new imdb.ImdbError('Film not found: asdfasdfasdf', { name:'asdfasdfasdf', id: undefined }), "testing film not found error");

		test.done();
	}
}

module.exports.testGetEpisodes = function(test) {
	var scope = nock('http://deanclatworthy.com').get('/imdb/?q=How%20I%20Met%20Your%20Mother&yg=0').reply(200, require('./data/how-I-met-your-mother.json'));

	return imdb.get('How I Met Your Mother', testResults);

	function testResults(err, data) {
		var scope = nock('http://imdbapi.poromenos.org').get('/js/?name=How%20I%20Met%20Your%20Mother').reply(200, require('./data/how-I-met-your-mother-episodes.json'));
		test.ifError(err);

		test.ok(data);
		test.equal(typeof(data.episodes), "function", "testing for episodes function");
		test.equal(data.series, true, "testing series bool");

		return data.episodes(testEpisodes);
	}

	function testEpisodes(err, data) {
		test.ifError(err);

		test.ok(data);
		test.equal(data[0].season, 6, "testing a random value");
		test.equal(data[0].number, 18, "testing another value");

		test.done();
	}
}

module.exports.testUnsuccessfulGetEpisodes = function(test) {
	var scope = nock('http://deanclatworthy.com').get('/imdb/?q=How%20I%20Met%20Your%20Mother&yg=0').reply(200, require('./data/how-I-met-your-mother.json'));

	return imdb.get('How I Met Your Mother', testResults);

	function testResults(err, data) {
		var scope = nock('http://imdbapi.poromenos.org').get('/js/?name=How%20I%20Met%20Your%20Mother').reply(404);

		test.ifError(err);
		test.ok(data);

		return data.episodes(testEpisodes);
	}

	function testEpisodes(err, data) {
		test.ifError(data);

		test.deepEqual(err, new Error("could not get episodes"));

		test.done();
	}
}
