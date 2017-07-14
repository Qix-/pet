# Pet

HTTP requests. JSON. Promises. No dependencies.

```javascript
const {get, post} = require('pet');

(async () => {

	const response = await get('https://google.com');
	/*
	{
		status: 200,     // HTTP status (see `Statuses` section below)
		remote: true,    // Response came from the server (false = error generated on client)
		message: 'OK',   // Status message (sometimes has debugging information)
		headers: {...},
		response: '<!doctype html>...</html>'
	}
	*/

	const body = {
		foo: 'bar'
	};

	const response = await post('https://some-site.com/api/v1/post', {body});
	/*
	{
		status: 201,
		remote: true,
		message: 'Empty Response',
		headers: {...},
		response: null
	}
	*/
})();
```

## Installation

```
$ npm i -S pet
```

## Usage

`pet` by itself is a function that can be called. It also has convenience functions (_not_ methods, so as
to be required piecemeal) for the most common HTTP verbs.

The default `pet` function, along with its pre-defined method functions (below), all have the same signature:

```javascript
pet(url, options) //-> Promise
```

- `url` is either a string or a [WHATWG URL](https://nodejs.org/api/url.html#url_the_whatwg_url_api) object
- `options` is the standard [`http.request()` options object](https://nodejs.org/api/http.html#http_http_request_options_callback)

The only non-standard option is `body`, which is used by `pet` to be sent up to the server.
Bodies are `JSON.stringify()`'d if the `Content-Type` header isn't specified.

All status codes (including client-generated status codes - see _Statuses_ below) that are `< 300` cause the promise to resolve (i.e. fire `.then()`).<br>
All status codes `>= 300` cause the promise to reject (i.e. fire `.catch()`).

Both promise resolution and rejection are passed similarly-shaped response objects (i.e. with `status`, `message` and `remote` fields).

Promise rejection will never yield an `Error` object.

The two headers that are set automatically (if you either don't provide a `headers` object or you don't specify them explicitly) are:

- `Content-Type` - set to `application/json` by default. Upon defaulting to this, `request.body` is `JSON.stringify()`'d if a body is provided.
- `Accept` - set to `application/json;q=0.9, text/*;q=0.5, */*;q=0.1` by default if not specified.

The server's `Content-Type` response header affects response parsing in one of three ways:

- `application/json` - response is decoded as `utf-8` and `JSON.parse()`'d
- `application/x-www-form-urlencoded` - response is decoded as `utf-8` and `querystring.parse()`'d
- otherwise, response is decoded as `utf-8` - if you know the response type, you can turn it back into a `Buffer` and use it appropriately.

If the response is zero-length, then `response` is set to `null`.

The common verbs that can be used in lieu of manually specifying a `method` in options:

- `pet.get()`
- `pet.post()`
- `pet.put()`
- `pet.patch()`
- `pet.delete()`

These functions do not rely on `pet` being the `this` object, so they may be imported and used as
standalone functions.

## Why _another_ HTTP wrapper?

Because it's 2017 and all I need are JSON and Promises, with the ability to _sometimes_ customize a request. Handling
the multitude of errors that comes with HTTP communications gets tiring, so reducing it to codes (even non-standard
codes) helps everything.

## Statuses

`pet` uses a few non-standard/completely made up HTTP codes for **non-`remote`** errors. Some of them have been
borrowed from other non-standard status sets (e.g. NGINX codes).

- `499` - Request was aborted by the client
- `596` - Request was aborted by the server
- `408` - The request timed out (by specifying `timeout` in the options)
- `498` - The server sent a malformed response (generated when trying to parse JSON)

## License
Licensed under the [MIT License](http://opensource.org/licenses/MIT).
You can find a copy of it in [LICENSE](LICENSE).
