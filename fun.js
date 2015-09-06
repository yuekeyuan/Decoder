var utils = require("./utils");
var args = require("./args");
var singleMark = args.SINGLEMARK;
var doubleMark = args.DOUBLEMARK;
var unFuncMark = args.UNFUNCMARK;
var isComment = args.ISFUNCTIONCOMMENT;

// 只生成一个完整的， 可执行的函数
// block 和 if 返回 list[]， 其他的返回 []
var genChildren = function (piece, indent, comment) {
    indent = indent || 0;
    var list = [];
    _getChildrenList(piece, list, indent);
    return mergeSentence(list, indent, comment);
};
//直接返回 html
var genHtml = function (piece, indent) {
    return [true, utils.wrapString(piece["content"])];
};

var genParam = function (piece, indent) {
    return [true, "findValue(g, l, \"" + piece["type"][1] + "\")"];
};

//list a as b (step num) (limit num) (asc)
//list num as b (to num) (step 2)(limit num) (desc)
var genList = function (piece, indent) {
    var list = [], listObj = {};
    var listName = piece["type"].indexOf("as") == -1
        ? "$_" : piece["type"][piece["type"].indexOf("as") + 1];
    list.push([false, "var listVal  = findListValue(g, l, " + JSON.stringify(piece["type"]) + ")"]);
    list.push([false, "var stackLen = l.length"]);
    list.push([false, "l[stackLen] = {}"]);
    list.push([false, "l = copyObject(l)"]);
    var begin = "for(var i in listVal){";
    var end = "}";
    var newList = [];
    newList.push([false, "l[stackLen][\"" + listName + "\"] = listVal[i]"]);
    _getChildrenList(piece["children"], newList, indent + 2);
    list.push([false, mergeSentence(newList, indent + 2, undefined, begin, end, false), 0, ""]);
    return [true, mergeSentence(list, indent + 1, piece["content"])];
};

//目前暂定 map 的形式为
//map mp as key value
//其实怎么写都差不多，现在又不用执行，也执行不了
var genMap = function (piece, indent) {
    var list = [];
    list.push([false, "var listVal  = findValue(g, l, \"" + piece["type"][1] + "\")"]);
    list.push([false, "var localLen = l.length"]);
    list.push([false, "l[localLen] = []"]);
    list.push([false, "l = copyObject(l)"]);                                //重新复制拷贝变量，但是又不影响前面的变量使用
    var begin = "for(var key in listVal){";
    var end = "}";
    var newList = [];
    newList.push([false, "l[localLen][\"" + piece["type"][3] + "\"] = key"]);
    newList.push([false, "l[localLen][\"" + piece["type"][4] + "\"] = listVal[key]"]);
    _getChildrenList(piece["children"], newList, indent, 1);
    list.push([false, mergeSentence(newList, indent + 2, undefined, begin, end, false), 0, ""]);
    return [true, mergeSentence(list, indent + 1, piece["content"])];
};

var genBlock = function (piece, indent) {
    var list = [];
    _getChildrenList(piece["children"], list, indent);
    return list;
};

var genIf = function (piece, indent) {
    var list = [];
    var newList = [];
    var ifVal = JSON.stringify(piece["type"]);
    var begin = "if(judgeIf(g, l, " + ifVal + ")){";
    var end = "}";
    _getChildrenList(piece["children"], newList, indent + 1, 0);
    list.push([false, mergeSentence(newList, indent + 1, undefined, begin, end, false), 0, ""]);
    return list;
};

var genElse = function (piece, indent) {
    return [false, "}else {", -1, ""];
};

var genElif = function (piece, indent) {
    pieceType = utils.copyObject(piece)["type"];
    pieceType[0] = "if";
    var ifVal = JSON.stringify(pieceType);
    return [false, "}else if(judgeIf(g, l, " + ifVal + ")) {", -1, ""];
};

// script 有 concat  independent 和 global 三种类型， 目前只实现 cancat 一种类型
// concat 类型的主要麻烦是除去语句中的 占位符， 并再次进行缩进，下面， 看我来耍大刀！
var genScript = function (piece, indent) {
    var list = [];
    if (piece["children"].length != 0) {
        var scriptList = piece["children"][0]["content"].split(args.newLine);
        var newList = [];
        for (var i = 0, len = scriptList.length; i < len; i++)
            if (utils.trim(scriptList[i]) != 0) newList.push(scriptList[i]);
        var blank = newList[0].match(/^\s/)[0];
        for (var i = 0, len = newList.length; i < len; i++)
            list.push([false, utils.trimBlank(newList[i], blank), 0, ""]);
    }
    if (piece["type"][1] == "concat") {
        list[0][0] = true;
    }
    return [true, mergeSentence(list, indent + 1, piece["content"])];
};

var genFun = function (piece, indent) {
    var genedFunName = piece["type"][1] + "(" +
        ["g", "l"].concat(piece["type"].slice(2)).join(", ") + ")";
    return [true, genedFunName];
};

var genImport = function (piece, indent) {
    var list = [];
    return [true, mergeSentence(list, indent + 1, piece["content"])];
};

/***
 * baseIndent: bool 决定 children的类型， 即 是否进行再次缩进
 * */
var _getChildrenList = function (piece, list, indent, baseIndent) {
    baseIndent = baseIndent || 0;
    for (var i = 0, len = piece.length; i < len; i++) {
        var newList = markFunMap[piece[i]["type"][0]](piece[i], indent);
        if (unFuncMark.indexOf(piece[i]["type"][0]) >= 0) {
            for (var j = 0, lenj = newList.length; j < lenj; j++) {
                list.push(newList.shift());
            }
        } else list.push(newList);
    }
    for (var i = 0, len = list.length; i < len; i++) {
        if (!list[i][2])
            list[i][2] = baseIndent;
    }
};

var markFunMap = {
    "html": genHtml,
    "=": genParam,
    "list": genList,
    "map": genMap,
    "block": genBlock,
    "if": genIf,
    "else": genElse,
    "elif": genElif,
    "import": genImport,
    "script": genScript,
    "fun": genFun
};

//list 必须是 字符串类型
//list: bool, content, baseIndent, comma
var mergeSentence = function (list, indent, comment, begin, end, isFunction) {
    begin = begin || "(function(g, l){";
    end = end || "})(g, l)";
    isFunction = isFunction == undefined;
    if (isComment && comment) begin += (" \t/* " + comment + " */");
    var content = begin + args.newLine;
    if (isFunction) {
        content += (utils.indent(indent + 1) +
        "var content = \"\";" + args.newLine);
    }
    for (var i = 0, len = list.length; i < len; i++) {
        var baseIndent = list[i][2] == undefined ? 0 : list[i][2];
        var comma = list[i][3] == undefined ? ";" : list[i][3];
        if (list[i][0]) {
            content += (utils.indent(indent + 1 + baseIndent)
            + "content += " + list[i][1] + comma
            + args.newLine);
        } else {
            content += (utils.indent(indent + 1 + baseIndent)
            + list[i][1] + comma + args.newLine);
        }
    }
    if (isFunction) content += (utils.indent(indent + 1) + "return content;" + "\n");
    return content + utils.indent(indent) + end;
};

module.exports = {
    genChildren: genChildren
};