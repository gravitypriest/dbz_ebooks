const https = require('https');
const crypto = require('crypto');
const childProcess = require('child_process');
const config = require(__dirname + '/config.json');
const oauth = require(__dirname + '/oauth');

const hostname = 'api.twitter.com';
const endpoint = '/1.1/statuses/update.json';
const method = 'POST';

var getLine = function() {
    childProcess.exec('python ' + __dirname + '/randomline.py', function(error, stdout, stderr) {
        if (error) {
            console.log('something goofed: ' + error);
            return;
        }
        console.log(stdout);
        tweet(stdout);
    });
};

var tweet = function(tweetText) {
    console.log(oauth.generateOAuthHeader(tweetText))
    var req = https.request({
        method: 'POST',
        hostname: hostname,
        path: endpoint + '?status=' + oauth.percentEncode(tweetText),
        headers: {'Authorization': oauth.generateOAuthHeader(hostname, endpoint, 'POST', {'status': tweetText}),
                  'Content-Type': 'application/x-www-form-urlencoded'},

    }, function(res) {
        res.on('data', function () {});
        res.on('end', function() {
            console.log('Tweeted at ' + new Date());
            console.log('Response code: ' + res.statusCode);
        });
    });
    req.end();
    req.on('error', function(e) {
        console.log(e);
    });
};

// run it
getLine();