var args = require("./args");
tabLength = args.TABLENGTH;
var getMime = function (fileName, mimeCollection) {
    return mimeCollection["suffix"][fileName
        .substring(fileName.lastIndexOf(".") + 1)];
};

var ltrim = function (s) {
    return s.replace(/^\s*/, "");
};

var rtrim = function (s) {
    return s.replace(/\s*$/, "");
};

var trim = function (s) {
    return rtrim(ltrim(s));
};


var trimBlank = function (origin, blank) {
    if (startWith(origin, blank));
    return origin.substring(blank.length * tabLength, origin.length);
}

var startWith = function (orign, str) {
    if (str == null || str == "" || orign.length == 0
        || str.length > orign.length)
        return false;
    if (orign.substr(0, str.length) == str)
        return true;
    return false;
};

var endWith = function (orign, str) {
    if (str == null || str == "" || orign.length == 0
        || str.length > orign.length)
        return false;
    if (orign.substring(orign.length - str.length) == str)
        return true;
    return false;
};

var indent = function (count) {
    var content = "";
    for (var i = 0; i < count; i++)
        content += "\t";
    return content;
};

var wrapString = function (str) {
    str = str.replace(/\r/g, "\\r")
        .replace(/\n/g, "\\n")
        .replace(/\"/g, "\\\"")
        .replace(/\'/g, "\\\'");
    return "\"" + str + "\"";
};

var isNum = function (str) {
    r = /^[+-]?[0-9]+(\.[0-9]+)?$/;
    return r.test(trim(str));
};

var deepCopy = function (source) {
    var result = source instanceof Array ? [] : {};
    for (var key in source) {
        result[key] = typeof source[key]==='object'?
            deepCopy(source[key]): source[key];
    }
    return result;
};

module.exports = {
    "getMime": getMime,
    "ltrim": ltrim,
    "rtrim": rtrim,
    "trim": trim,
    "trimBlank": trimBlank,
    "startWith": startWith,
    "endWith": endWith,
    "indent": indent,
    "wrapString": wrapString,
    "isNum": isNum,
    "copyObject": deepCopy
};