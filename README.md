# Speechmatics API for Node.js

[Speechmatics](https://speechmatics.com) provides an [API](https://speechmatics.com/api-details) for speech to text. This package implements the API making it easier to integrate into [Node.js](https://nodejs.org) projects.

## Install

```
npm install speechmatics
```

## Usage

[Read here](https://speechmatics.com/api-details) for more detailed description of the API.

### Instantiation

```js
const Speechmatics = require('speechmatics');
const sm = new Speechmatics(userId, apiKey, options);
```

`userId` and `apiKey` are required as the first two parameters for Speechmatics client instantiation. `options` are...optional. Defaults detailed below.

#### Options

- `baseUrl`: string - defaults to 'https://api.speechmatics.com'
- `apiVersion`: number - defaults to 1.0;
- `callbackUrl`: string - URL for notification callbacks
  - if this option is set, `notification` field for request will automatically be set as 'callback'
- `headers`: object - extra header fields

### Requests

For each request, `opts` are settings that will be passed along to the [`request`](https://github.com/request/request) module.

```js
/* User */
sm.getUser(opts, callback);
sm.getPayments(opts, callback);
sm.getJobs(opts, callback);
sm.createJob(opts, callback);
sm.getJob(jobId, opts, callback);
sm.getTranscript(jobId, opts, callback);
sm.getAlignment(jobId, opts, callback);

/* Status */
sm.getStatus(opts, callback);

/* Statics */
Speechmatics.parseAlignment(text);
```
##### Gets

If the response object has only a single key, the callback object is pared to that value. This provides a more simplified than the actual Speechmatics API. Specifically this applies, `getUser`, `getPayments`, `getJobs`, and `getJob`

Example:

According the Speechmatics API, a GET on `/user/$userId/` wil respond with:

```json
{
  "user": {
     "balance": 90,
     "email": "demo@speechmatics.com",
     "id": 1
   }
}
```

Whereas, this module will simply return the value of the `user` key:

```js
{
  balance: 90,
  email: 'demo@speechmatics.com',
  id: userId
}
```

##### Create Job

`sm.createJob` has a built-in nicety. Setting `opts.audioFilename` or `opts.textFilename` (for alignment) will read those files from the supplied paths as a [ReadStream](https://nodejs.org/api/fs.html#fs_class_fs_readstream), which is then passed through to the request as the correct `formData` fields.

You can also use the `opts.audioStream` and `opts.textStream` parameters to pass in readable streams. This is useful when uploading from a remote source, for example:
```js
var request = https.get("https://example.com/catVideo.webm")
.on('response', function(response) {
		sm.createJob({audioStream: response}, callback);
});
```
Or, if you already happen to have a read stream open:
```js
var existingReadStream = fs.createReadStream("./zero.wav");
//do stuff...
sm.createJob({audioStream: existingReadStream}, callback);
```

*note: "auth_token" request parameter is automatically set based on apiKey*
