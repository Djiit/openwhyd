var assert = require('assert');
var request = require('request');

var { URL_PREFIX, ADMIN_USER, TEST_USER } = require('../fixtures.js')

function loginAs(user, callback) {
	const url = URL_PREFIX + `/login?action=login&ajax=1&email=${user.email}&md5=${user.md5}`;
	request.get(url, function(error, response, body) {
		assert.ifError(error);
		assert.equal(response.statusCode, 200);
		const jar = request.jar();
		if (((response.headers || {})['set-cookie'] || []).length) {
			jar.setCookie(request.cookie(response.headers['set-cookie'][0]), URL_PREFIX);
		}
		callback(error, { response, body, jar });
	});
}

describe('auth api -- login with email', function() {

	it('succeeds', function (done) {
		loginAs(ADMIN_USER, function(error, { response, body }) {
			const cookies = ((response.headers || {})['set-cookie'] || []).join(' ');
			assert(/whydSid\=/.test(cookies));
			assert(JSON.parse(body).redirect);
			done();
		});
	});

	it('gives access to personal /stream', function (done) {
		loginAs(ADMIN_USER, function(error, { response, body, jar }) {
			request({ jar, url: URL_PREFIX + '/stream?format=json' }, function(error, response, body) {
				assert.ifError(error);
				assert.equal(response.statusCode, 200);
				var json = JSON.parse(body);
				assert.ifError(json.error);
				assert(json.join); // check that it's an array
				done();
			});
		});
	});

	it('fails if wrong email', function (done) {
		loginAs(Object.assign({}, ADMIN_USER, { email: 'qq' }), function(error, { response, body }) {
			assert(/email/.test(JSON.parse(body).error));
			done();
		});
	});

	it('fails if wrong password', function (done) {
		loginAs(Object.assign({}, ADMIN_USER, { md5: 'qq' }), function(error, { response, body }) {
			assert(JSON.parse(body).wrongPassword);
			done();
		});
	});
});
