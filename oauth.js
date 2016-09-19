const crypto = require('crypto');
const config = require(__dirname + '/config');

var _generateOAuthSig = function(hostname, endpoint, method, params) {
    var paramString = _generateParamString(params);
    var sigBaseString = [method, percentEncode('https://' + hostname + endpoint), percentEncode(paramString)].join('&');
    var signingKey = percentEncode(config.consumerSecret) + '&' + percentEncode(config.tokenSecret);
    var hmac = crypto.createHmac('sha1', signingKey);
    hmac.update(sigBaseString);
    return hmac.digest('base64'); 
};

var _generateParamString = function(params, header) {
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

var percentEncode = function(str) {
    // encodeURIComponent misses some stuff, fix here
    return encodeURIComponent(str).replace(/!/g, '%21')
                                  .replace(/\'/g, '%27');
};

var generateOAuthHeader = function(hostname, endpoint, method, extraParams) {
    var params = {'oauth_consumer_key': config.consumerKey,
                  'oauth_nonce': crypto.randomBytes(8).toString('hex'),
                  'oauth_signature_method': 'HMAC-SHA1',
                  'oauth_timestamp': Date.now().toString().slice(0,-3),
                  'oauth_token': config.token,
                  'oauth_version': '1.0'};
    var extendedParams = {};

    for (var key in params) {
        extendedParams[key] = params[key];
    }
    if (typeof(extraParams) !== 'undefined') {
        for (var key in extraParams) {
            extendedParams[key] = extraParams[key];
        }
    }

    var signature = _generateOAuthSig(hostname, endpoint, method, extendedParams);
    params['oauth_signature'] = signature;
    var authString = 'OAuth ' + _generateParamString(params, true);
    return authString;
};

module.exports = { generateOAuthHeader: generateOAuthHeader,
                   percentEncode: percentEncode};
