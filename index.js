'use strict';

const request = require('request');
const fs = require('fs');

class Client {
  constructor(userId, apiToken, opts) {
    if (!userId) throw new Error('API User ID required');
    if (!apiToken) throw new Error('API Auth Token required');
    if (!(this instanceof Client)) {
      return new Client(userId, apiToken, opts);
    }

    this.userId = userId;
    this.apiToken = apiToken;

    opts = opts || {};
    this.baseUrl = opts.baseUrl || 'https://api.speechmatics.com';
    this.apiVersion = opts.apiVersion || '1.0';
    this.callbackUrl = opts.callbackUrl;
    this.headers = opts.headers || {};

    return this;
  }

  makeRequest(method, path, opts, callback) {
    path = path.replace(':userId', this.userId);
    const options = Object.assign(opts, {
      method,
      json: true,
      headers: this.headers,
      baseUrl: this.baseUrl,
      url: `/v${this.apiVersion}/${path}`,
    });
    options.qs = options.qs || {};
    options.qs.auth_token = this.apiToken;

    request(options, (err, resp, body) => {
      if (!err && resp.statusCode >= 400) {
        err = new Error(body);
      }
      callback(err, body);
    });
  }

  get(path, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }

    this.makeRequest('GET', path, opts, callback);
  }

  post(path, opts, callback) {
    const fd = Object.assign({
      model: 'en-US',
      diarisation: 'false',
      notification: this.callbackUrl ? 'callback' : null,
      callback: this.callbackUrl,
    }, opts.formData);

    if (opts.audioFilename) {
      fd.data_file = fs.createReadStream(opts.audioFilename);
      delete opts.audioFilename;
    }
    if (opts.textFilename) {
      fd.text_file = fs.createReadStream(opts.textFilename);
      delete opts.textFilename;
    }
    opts.formData = fd;

    this.makeRequest('POST', path, opts, callback);
  }


    /* User */
  getUser(opts, callback) {
    this.get('user/:userId/', opts, callback);
  }

  getPayments(opts, callback) {
    this.get('user/:userId/payments/', opts, callback);
  }

  getJobs(opts, callback) {
    this.get('user/:userId/jobs/', opts, callback);
  }

  createJob(opts, callback) {
    this.post('user/:userId/jobs/', opts, callback);
  }

  getJob(jobId, opts, callback) {
    this.get(`user/:userId/jobs/${jobId}/`, opts, callback);
  }

  getTranscript(jobId, opts, callback) {
    this.get(`user/:userId/jobs/${jobId}/transcript`, opts, callback);
  }

  getAlignment(jobId, opts, callback) {
    this.get(`user/:userId/jobs/${jobId}/alignment`, opts, callback);
  }


    /* Status */
  getStatus(opts, callback) {
    this.get('status', opts, callback);
  }


    /* Statics */
  static parseAligment(text) {
    return text.split('\n').reduce((arr, line) => {
      const re = /<time=(\d+\.\d+)>(\S*)<time=(\d+\.\d+)>/g;
      const words = [];

      function recurse(str) {
        const match = re.exec(str);
        if (match) {
          words.push({
            term: match[2],
            start: parseFloat(match[1], 10),
            end: parseFloat(match[3], 10),
          });
          recurse(str);
        }
      }
      recurse(line);

      if (words.length) {
        arr.push({
          start: words[0].start,
          end: words[words.length - 1].end,
          words,
        });
      }
      return arr;
    }, []);
  }
}

module.exports = Client;
