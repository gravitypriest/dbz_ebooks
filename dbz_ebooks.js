const https = require('https');
const crypto = require('crypto');
const childProcess = require('child_process');
const config = require(__dirname + '/config');

var hostname = 'api.twitter.com';
var endpoint = '/1.1/statuses/update.json';
var method = 'POST';

var percentEncode = function(str) {
    // encodeURIComponent misses some stuff, fix here
    return encodeURIComponent(str).replace(/!/g, '%21')
                                  .replace(/\'/g, '%27');
};

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

var generateOAuthHeader = function(tweetText) {
    var params = {'oauth_consumer_key': config.consumerKey,
                  'oauth_nonce': crypto.randomBytes(8).toString('hex'),
                  'oauth_signature_method': 'HMAC-SHA1',
                  'oauth_timestamp': Date.now().toString().slice(0,-3),
                  'oauth_token': config.token,
                  'oauth_version': '1.0',
                  'status': tweetText};

    var signature = generateOAuthSig(params);
    params['oauth_signature'] = signature;
    delete params['status'];
    var authString = 'OAuth ' + generateParamString(params, true);
    return authString;
};

var generateOAuthSig = function(params) {
    var paramString = generateParamString(params);
    var sigBaseString = [method, percentEncode('https://' + hostname + endpoint), percentEncode(paramString)].join('&');
    var signingKey = percentEncode(config.consumerSecret) + '&' + percentEncode(config.tokenSecret);
    var hmac = crypto.createHmac('sha1', signingKey);
    hmac.update(sigBaseString);
    return hmac.digest('base64'); 
};

var generateParamString = function(params, header) {
    // 'header' if building for header string, otherwise signature
    if (typeof(header) === 'undefined') {
        header = false;
    }
    var keyList = Object.keys(params);
    var paramString = '';
    keyList.sort().forEach(function(k, i) {
        paramString += percentEncode(k) + '=';
        if (header) {
            paramString += '\"' + percentEncode(params[k]) + '\"';
        } else {
            paramString += percentEncode(params[k]);
        }
        if (i < keyList.length-1) {
            if (header) {
                paramString += ', ';
            } else {
                paramString += '&';
            }
        }
    });
    return paramString;
};

var tweet = function(tweetText) {
    var req = https.request({
        method: 'POST',
        hostname: hostname,
        path: endpoint + '?status=' + percentEncode(tweetText),
        headers: {'Authorization': generateOAuthHeader(tweetText),
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
