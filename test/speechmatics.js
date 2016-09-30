'use strict';

const Speechmatics = require('..');

const fs = require('fs');
const should = require('should');
const nock = require('nock');

const userId = '1234';
const apiKey = 'token';

const sm = new Speechmatics(userId, apiKey);
const aligned = fs.readFileSync(`${__dirname}/fixtures/aligned.txt`);

function nocker(path, statusCode, body) {
  return nock(sm.baseUrl)
    .get(`/v${sm.apiVersion}/${path}`)
    .query(true)
    .delay(100)
    .reply(statusCode, body);
}

describe('Speechmatics API tests', function() {
  describe('baseline tests', function() {
    it('should throw error if no userId provided', function() {
      (function () {
        return new Speechmatics();
      }).should.throw('API User ID required');
    });
    it('should throw error if no apiKey provided', function() {
      (function () {
        return new Speechmatics(userId);
      }).should.throw('API Auth Token required');
    });
    it('should be valid client with defaults', function() {
      const client = new Speechmatics(userId, apiKey);
      should.exist(client);

      client.baseUrl.should.eql('https://api.speechmatics.com');
      client.apiVersion.should.eql('1.0');
    });
  });

  describe('Errors', function() {
    it('Should error for any status code 400 or above', function (done) {
      nocker('user/', 404, {
        code: 404,
        error: 'Page Not Found'
      });

      sm.makeRequest('get', 'user/', (err) => {
        err.should.containEql({
          code: 404,
          error: 'Page Not Found',
          name: 'SpeechmaticsError',
          statusCode: 404,
          message: 'Page Not Found'
        });
        done();
      });
    });

    it('Should correctly expose authentication error', function (done) {
      nocker(`user/${userId}/`, 401, {
        code: 401,
        error: 'Invalid User Id or Token'
      });

      sm.getUser(userId, (err) => {
        err.should.containEql({
          statusCode: 401,
          message: 'Invalid User Id or Token'
        });
        done();
      });
    });
  });

  describe('API tests', function () {
    describe('User', function() {
      it('should get the user', function (done) {
        const body = {
          user: {
            balance: 90,
            email: 'demo@speechmatics.com',
            id: userId
          }
        };
        nocker(`user/${userId}/`, 200, body);
        sm.getUser((err, user) => {
          // console.log('user:', user);
          // console.log('body:', body);
          user.should.eql(body.user);
          done(err);
        });
      });

      it('get user payments', function (done) {
        const body = {
          payments: [{
            balance: -12,
            created_at: 'Wed, 01 Jan 2014 09:10:00 GMT',
            description: 'Transcription of hello.wav'
          }, {
            balance: 1000,
            created_at: 'Wed, 01 Jan 2014 09:10:00 GMT',
            description: '1,000 credits added'
          }]
        };
        nocker(`user/${userId}/payments/`, 200, body);
        sm.getPayments((err, payments) => {
          payments.should.eql(body.payments);
          done(err);
        });
      });

      describe('Job', function() {
        it('get jobs', function (done) {
          const body = {
            jobs: [
              {
                check_wait: null,
                created_at: 'Wed, 04 Dec 2013 16:00:47 GMT',
                duration: 244,
                id: 2,
                job_status: 'done',
                job_type: 'transcription',
                lang: 'en-US',
                meta: null,
                name: 'test.mp3',
                next_check: 0,
                notification: 'email',
                transcription: 'test.json',
                url: '/v1.0/user/1/jobs/2/audio',
                user_id: 1
              },
              {
                alignment: null,
                check_wait: 30,
                created_at: 'Mon, 10 Aug 2015 09:02:23 GMT',
                duration: 10,
                id: 3,
                job_status: 'aligning',
                job_type: 'alignment',
                lang: 'en-US',
                meta: 'Project X',
                name: 'hello.wav',
                next_check: 0,
                notification: 'email',
                text_name: 'hello.txt',
                url: '/v1.0/user/1/jobs/3/audio',
                user_id: 1
              }
            ]
          };
          nocker(`user/${userId}/jobs/`, 200, body);
          sm.getJobs((err, payments) => {
            payments.should.eql(body.jobs);
            done(err);
          });
        });

        it('get a particular job', function (done) {
          const body = {
            job: {
              check_wait: null,
              created_at: 'Wed, 04 Dec 2013 16:00:47 GMT',
              duration: 244,
              id: 2,
              job_status: 'done',
              job_type: 'transcription',
              lang: 'en-US',
              meta: null,
              name: 'test.mp3',
              next_check: 0,
              notification: 'email',
              transcription: 'test.json',
              url: '/v1.0/user/1/jobs/2/audio',
              user_id: 1
            }
          };
          nocker(`user/${userId}/jobs/2/`, 200, body);
          sm.getJob(2, (err, payments) => {
            payments.should.eql(body.job);
            done(err);
          });
        });

        it('get a transcript', function (done) {
          const body = {
            job: {
              lang: 'en-US',
              user_id: 1,
              name: 'hello_world.mp3',
              duration: 2,
              created_at: 'Thu Jan 01 00:00:00 1970',
              id: 1
            },
            speakers: [{
              duration: '2.000',
              confidence: null,
              name: 'F1',
              time: '0.000'
            }],
            words: [{
              duration: '1.000',
              confidence: '0.943',
              name: 'Hello',
              time: '1.000'
            }, {
              duration: '1.000',
              confidence: '0.995',
              name: 'world',
              time: '1.000'
            }, {
              duration: '0.000',
              confidence: null,
              name: '.',
              time: '2.000'
            }],
            format: '1.0'
          };
          nocker(`user/${userId}/jobs/2/transcript`, 200, body);
          sm.getTranscript(2, (err, transcript) => {
            transcript.should.eql(body);
            done(err);
          });
        });

        it('get an alignment', function (done) {
          nocker(`user/${userId}/jobs/2/alignment`, 200, aligned);
          sm.getAlignment(2, (err, alignment) => {
            alignment.should.eql(aligned.toString());
            done(err);
          });
        });
      });

      describe('Status', function() {
        it('should get service status', function (done) {
          const body = {
            Average_Turnaround_Mins: 5,
            Queue_Length_Mins: 0,
            Status: 'Good',
            Time_UTC: 'Mon, 01 Jan 2016 00:00:00 GMT'
          };
          nocker('status', 200, body);
          sm.getStatus((err, status) => {
            status.should.eql(body);
            done(err);
          });
        });
      });
    });
  });

  describe('Util tests', function () {
    describe('Parse Aligment', function() {
      it('should parse the alignment file as a javascript object', function () {
        const parsed = Speechmatics.parseAligment(aligned);
        parsed.should.eql([{
          start: 0.12,
          end: 1,
          words: [
            { term: 'Hello', start: 0.12, end: 0.23 },
            { term: 'world,', start: 0.34, end: 0.45 },
            { term: 'how', start: 0.56, end: 0.67 },
            { term: 'are', start: 0.78, end: 0.89 },
            { term: 'you?', start: 0.9, end: 1 }
          ]
        }, {
          start: 1.12,
          end: 2,
          words: [
            { term: 'Goodnight', start: 1.12, end: 1.23 },
            { term: 'moon,', start: 1.34, end: 1.45 },
            { term: 'time', start: 1.56, end: 1.67 },
            { term: 'to', start: 1.78, end: 1.89 },
            { term: 'sleep.', start: 1.9, end: 2 }
          ]
        }]);
      });
    });
  });
});
