/* eslint-disable prefer-promise-reject-errors */
const https = require('https');
const {URL} = require('url');
const qs = require('querystring');

function correctKey(obj, targetkey) {
	const remap = {};
	for (const key of Object.keys(obj)) {
		remap[key.toLowerCase()] = obj[key];
	}
	return remap[targetkey.toLowerCase()];
}

function pet(url, options) {
	return new Promise((resolve, reject) => {
		if (!url) {
			return reject({status: 400, remote: false, response: 'no URL specified'});
		}

		const payload = options || {};

		/* eslint-disable dot-notation */
		if (!payload.headers || !payload.headers['Accept']) {
			payload.headers = payload.headers || {};
			payload.headers['Accept'] = 'application/json;q=0.9, text/*;q=0.5, */*;q=0.1';
		}
		/* eslint-enable dot-notation */

		url = url instanceof URL ? url : new URL(url);

		payload.protocol = url.protocol;
		payload.host = url.hostname;
		payload.port = url.port || null;
		payload.path = (url.pathname || '/') + (url.search || '') + (url.hash || '');
		if (url.username) {
			payload.auth = url.password ? `${url.username}:${url.password}` : url.username;
		}

		let bodyObj = null;
		if (payload.body && !payload.headers['Content-Type']) {
			try {
				bodyObj = JSON.stringify(payload.body);
				payload.headers['Content-Type'] = 'application/json';
			} catch (err) {
				return reject({status: 400, remote: false, message: `Bad Request: ${err.message}`});
			}
		}

		console.log(payload);

		const request = https.request(payload, msg => {
			let totalLength = 0;
			const buffers = [];

			msg.on('data', buf => {
				buffers.push(buf);
				totalLength += buf.length;
			});

			msg.on('aborted', () => reject({status: 596, remote: false, message: 'Request Aborted by Server'}));
			msg.on('close', () => reject({status: 596, remote: false, message: 'Request Aborted by Server'}));
			msg.on('end', () => {
				const report = msg.statusCode < 300 ? resolve : reject;

				// Sorry, we don't support anything but utf-8 here. Error prone, potentially - however,
				// non-utf8 is pretty much extinct.
				let contentType = (correctKey(msg.headers || {}, 'Content-Type') || '').toLowerCase();
				contentType = contentType.split(';', 2)[0].trim();

				let response = Buffer.concat(buffers, totalLength);
				if (response.length === 0) {
					response = null;
				} else if (['application/json', 'application/x-json', 'text/json'].indexOf(contentType) !== -1) {
					try {
						response = JSON.parse(response.toString('utf-8'));
					} catch (err) {
						return reject({status: 498, remote: false, message: 'Malformed Response', response});
					}
				} else if (contentType === 'application/x-www-form-urlencoded') {
					response = qs.parse(response.toString('utf-8'));
				} else {
					response = response.toString('utf-8'); // Can be converted back to a Buffer with no loss if need-be.
				}

				return report({
					status: msg.statusCode,
					remote: true,
					message: msg.statusMessage,
					headers: msg.headers || {},
					response
				});
			});
		});

		request.on('abort', () => reject({status: 499, remote: false, message: 'Request Aborted by Client'}));
		request.on('aborted', () => reject({status: 596, remote: false, message: 'Request Aborted by Server'}));
		request.on('timeout', () => reject({status: 408, remote: false, message: 'Request Timeout'}));
		request.on('error', err => reject({status: 599, remote: false, message: 'Connection error: ' + err.message}));

		if (bodyObj) {
			request.end(bodyObj, 'utf-8');
		} else {
			request.end();
		}
	});
}

function preconfigure(opts) {
	return (url, options) => pet(url, Object.assign(options || {}, opts));
}

pet.get = preconfigure({method: 'GET'});
pet.post = preconfigure({method: 'POST'});
pet.put = preconfigure({method: 'PUT'});
pet.patch = preconfigure({method: 'PATCH'});
pet.delete = preconfigure({method: 'DELETE'});

module.exports = pet;
