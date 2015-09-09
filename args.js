os = require("os");
var spliter = "\\";
var newLine = os["EOL"];
var suffix = "yky";
var base_dir = __dirname.substring(0, __dirname.lastIndexOf(""));
var isFunctonComment = true;
var returnedNil = "nil";
var tabLength = 4;

var singleMark = ["html", "blank", "extends", "include", "import", "fun", "=", "else", "elif"];
var doubleMark = ["list", "map", "block", "if", "script"];
var unFuncMark = ["block", "if"];

var preCompileTemplate = ["index.yky"];

module.exports = {
    spliter: spliter,
    newLine: newLine,
    SUFFIX: suffix,
    BASE_DIR: base_dir,
    SINGLEMARK: singleMark,
    DOUBLEMARK: doubleMark,
    UNFUNCMARK: unFuncMark,
    ISFUNCTIONCOMMENT: isFunctonComment,
    RETURNEDNUL: returnedNil,
    TABLENGTH: tabLength,
    PRECOMPILETEMPLATE: preCompileTemplate
};
