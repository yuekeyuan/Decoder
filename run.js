var args = require("./args");
var utils = require("./utils");
var returnedNull = args.RETURNEDNUL;
var plugin = require("./referenceFunction");

//对于数字的转换先不做处理
var findValue = function (g, l, name) {
    if (utils.isNum(name)) return Number(name);
    if (utils.trim(name) == "false") return false;
    var list = [], newList = [];
    splitFindName(name, list);
    for (var i in list)
        list[i][1] != "" ? newList.push(list[i]) : 1;
    return _findValue(g, l, newList);
};

var _findValue = function (g, l, list, isGlobal) {
    isGlobal = isGlobal == undefined ? 2 : isGlobal;
    var _list = null;
    if (isGlobal == 0) {
        for (var i = l.length - 1; i >= 0; i--) {
            _list = copyObject(list);
            local = l[i];
            var tem = local[_list.shift()[1]];
            while (_list.length != 0 && tem != undefined)
                tem = tem[_list.shift()[1]];
            if (tem == undefined || _list.length != 0) continue;
            else return [true, tem];
        }
        return [false];
    } else if (isGlobal == 1) {                    // global search
        _list = copyObject(list);
        var tem = g[_list.shift()[1]];
        while (_list.length != 0 && tem != undefined)
            tem = tem[_list.shift()[1]];
        if (tem == undefined || _list.length != 0)
            return [false];
        return [true, tem];
    } else {
        var val = _findValue(g, l, list, 0);
        if (val[0]) return val[1];
        val = _findValue(g, l, list, 1);
        return val[0] ? val[1] : returnedNull;
    }
};

//需要再精简, 哎， 当年离散没学好啊
var splitFindName = function (name, list) {
    var dotIndex = name.indexOf(".");
    var braIndex = name.indexOf("[");
    if (dotIndex == -1 && braIndex == -1)
        list.push(["plain", name]);
    else if (braIndex == -1) {
        list.push(["plain", name.substring(0, dotIndex)]);
        splitFindName(name.substring(dotIndex + 1), list);
    } else if (dotIndex == -1) {
        list.push(["plain", name.substring(0, braIndex)]);
        list.push(["inner", name.substring(braIndex + 1, name.indexOf("]"))]);
        splitFindName(name.substring(name.indexOf("]") + 1), list);
    } else if (dotIndex > braIndex) {
        list.push(["plain", name.substring(0, braIndex)]);
        list.push(["inner", name.substring(braIndex + 1, name.indexOf("]"))]);
        splitFindName(name.substring(name.indexOf("]") + 1), list);
    } else {
        list.push(["plain", name.substring(0, dotIndex)]);
        splitFindName(name.substring(dotIndex + 1), list);
    }
};

var findListValue = function (g, l, list) {
    var obj = {}, returnedList = [];
    var value = findValue(g, l, list[1]);
    _getListValue(list, obj, value);
    var begin = obj["list"];
    var end   = obj["to"];
    var step  = obj["step"];
    var limit = obj["limit"];

    if(obj["type"] == "number"){                                    //number
        if(obj["order"] == "asc"){
            for(var i=obj["list"], j=0; i<obj["to"] && j<limit; i+=obj["step"], j++)
                returnedList.push(i);
        }else
            for(var i=obj["list"], j=0; i>obj["to"] && j<limit; i+=obj["step"], j++)
                returnedList.push(i);
    }else{
        if(obj["order"] == "asc"){
            for(var i=begin, j=0; i<end && j<limit; i+=step, j++)
                returnedList.push(value[i]);
        }else{
            for(var i=begin, j=0; i>end && j<limit; i+=step, j++)
                returnedList.push(value[i]);
        }
    }
    return returnedList;
};

//list a as b (step num) (limit num) (asc)   list as to step limit asc/desc   || num/paramenter
//list num as b (to num) (step 2)(limit num) (desc)
var _getListValue = function (piece, obj, value) {
    var newPiece = utils.copyObject(piece);
    obj["order"] = obj["order"] || "asc";
    obj["type"] = utils.isNum(newPiece[1]) ? "number" : "param";
    if (newPiece.length % 2 == 1) {
        var orderIndex = (newPiece.indexOf("asc") != -1)
            ? newPiece.indexOf("asc") : newPiece.indexOf("desc");
        obj["order"] = newPiece[orderIndex];
        newPiece.splice(orderIndex, 1);
    }
    if (newPiece.indexOf("as") == -1)
        return _getListValue(newPiece.concat(["as", "$_"]), obj, value);             //list a   ==> list a as $_
    for (var i = 0; i < newPiece.length; i += 2)
        obj[newPiece[i]] = newPiece[i + 1];

    if (obj["type"] == "number") {
        obj["list"] = parseFloat(obj["list"]);
        obj["to"] = parseFloat(obj["to"] || 0);
        obj["step"] = obj["step"] == undefined ? 1 : Math.abs(parseFloat(obj["step"]));
        obj["limit"] = parseFloat(obj["limit"] || Math.abs(obj["list"] - obj["to"]));
        var tem = [obj["list"], obj["to"]].sort();
        if (obj["order"] == "desc") {
            tem.reverse();
            obj["step"] = -obj["step"];
        }
        obj["list"] = tem[0];
        obj["to"] = tem[1];
    } else {                                             // 处理 param 类型的数据，小心有地雷！
        obj["list"] = 0;
        obj["to"] = value.length;
        obj["limit"] = obj["limit"] == undefined ? Number.MAX_VALUE : parseFloat(obj["limit"]);
        obj["step"] = obj["step"] == undefined ? 1 : Math.abs(parseFloat(obj["step"]));
        if (obj["order"] == "desc") {
            obj["list"] = obj["to"];
            obj["to"] = 0;
            obj["step"] = -obj["step"];
        }
    }
};


var copyObject = function (l) {
    return utils.copyObject(l);
};

// if true | if false | if a | if not true | if not false | if ! a | if a = b
// | if a > b | if a < b | if a >= b | if a != b | if a && b || if a || b
var judgeIf = function (g, l, value) {
    var simbal = ["&&", "||", "!", ">", ">=", "==", "<", "<=", "===", "!="];
    if (value.length == 2)
        return findValue(g, l, value[1]);
    if (value.length == 3) {
        if (value[1] = "not" || value[1] == "!")
            return !judgeIf(g, l, [value[0], value[2]]);
        return false;                               //出现错误了，需要提前被处理掉, 这句代码需要被删掉，先保留，做个纪念
    }
    else if (value.length == 4 && simbal.indexOf(value[2]) != -1) {                      //这里先取个巧， 以后再修改
        var $a = findValue(g, l, value[1]);
        var $b = findValue(g, l, value[3]);
        return eval("$a" + value[2] + "$b");
    }
    return false;
};

var runGeneratedFunction = function (g, l, fun) {
    return eval(fun);
};

module.exports = {
    runGeneratedFunction: runGeneratedFunction
};
