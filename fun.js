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
    var listObj = {};
    _getListObject(piece["type"], listObj);
    console.log("", JSON.stringify(listObj, 4, 4));
/*
    if(listObj["type"] == "number"){                    //处理数据类型
        for(var i=begin, len= length; i<len; i+=x){

        }
    }
*/


    var list = [];
    list.push([false, "var listVal  = findValue(g, l, \"" + piece["type"][1] + "\")"])
    list.push([false, "var stackLen = l.length"]);
    list.push([false, "l[stackLen] = {}"]);
    list.push([false, "l = copyObject(l)"]);
    var begin = "for(var i in listVal){";
    var end = "}";
    var newList = [];
    newList.push([false, "l[stackLen][\"" + piece["type"][3] + "\"] = listVal[i]"]);
    _getChildrenList(piece["children"], newList, indent + 2);
    list.push([false, mergeSentence(newList, indent + 2, undefined, begin, end, false), 0, ""]);
    return [true, mergeSentence(list, indent + 1, piece["content"])];

};

//list a as b (step num) (limit num) (asc)
//list num as b (to num) (step 2)(limit num) (desc)
var _getListObject = function(piece, obj){
    var newPiece = utils.copyObject(piece);
    var len = piece.length;
    obj["order"] = "asc";
    obj["type"]  = utils.isNum(piece[1]) ? "number" : "param";
    if(len % 2 == 1){
        if(piece.indexOf("asc") != -1)
            piece.splice(piece.indexOf("asc"), 1);
        else if(piece.indexOf("desc")) {
            obj["order"] = "desc";
            console.log("ordderrrrrrrrrrrrrrrrrrrrrrrrrrrrr, ", obj["order"]);
            piece.splice(piece.indexOf("desc"), 1);
        }
    }
    if(piece.indexOf("as") == -1) return _getListObject(piece.concat(["as", "$_"]), obj);             //list a   ==> list a as $_
    for(var i=0;i<piece.length;i+=2){
        obj[piece[i]] = piece[i+1];
    }
    //对数据进行深加工！！！！
    if(obj["type"] == "number"){
        obj["list"] = parseFloat(obj["list"]);
        obj["to"]   = parseFloat(obj["to"] || (false ? parseFloat(obj["to"]) : 0));
        obj["step"] = obj["step"] == undefined ? 1 : Math.abs(parseFloat(obj["step"]));
        var tem = [obj["list"], obj["to"]].sort();   //上面没有转彻底，现在在这儿补一刀， 以后再规范一下
        if(obj["order"] == "desc"){
            tem.reverse();
            obj["step"] == - obj["step"];
        }
        obj["list"] = tem[0];
        obj["to"]   = tem[1];
    }else {                                             // 处理 param 类型的数据，小心有地雷！
        //list a as b (step num) (limit num) (asc)
        //使用  for 循环完成数据的调用，哦哦！
        obj["list"]  = 0;
        obj["to"]    = "(listVal.length-1)";
        obj["limit"] = obj["limit"] == undefined ? "Number.POSITIVE_INFINITY" : obj["limit"];
        obj["step"] = obj["step"] == undefined ? 1 : Math.abs(parseFloat(obj["step"]));
        if(obj["order"] == "desc"){
            obj["list"] = obj["to"];
            obj["to"] = 0;
            obj["step"] = - obj["step"];
        }
    }
};

//目前暂定 map 的形式为
//map mp as key value
//其实怎么写都差不多，现在又不用执行，也执行不了
var genMap = function (piece, indent) {
    var list = [];
    list.push([false, "var listVal  = findValue(g, l, \"" + piece["type"][1] + "\")"])
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
    if(piece["children"].length != 0){
        var scriptList = piece["children"][0]["content"].split(args.newLine);
        var newList = [];
        for(var i= 0, len = scriptList.length; i<len; i++)
            if(utils.trim(scriptList[i]) != 0) newList.push(scriptList[i]);
        var blank = newList[0].match(/^\s/)[0];
        for(var i= 0, len=newList.length;i <len; i++)
            list.push([false, utils.trimBlank(newList[i], blank),0, ""]);
    }
    if(piece["type"][1] == "concat"){
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