var args = require("./args");
var fs = require("fs");
var utils = require("./utils");
var SUFFIX = args.SUFFIX;
var singleMark = args.SINGLEMARK;
var doubleMark = args.DOUBLEMARK;

////////////////////////////////////////////////////////////////////////
// 文件处理的总入口
////////////////////////////////////////////////////////////////////////
var generateFile = function(fileName) {
    //对文件进行切片
    var splitpiece = analysFile(fileName);
    //console.log("splitpiece\n", JSON.stringify(splitpiece, 4, 4), "\n\n");
    //对切片后的文件进行重建
    var rebuildpiece = rebuild(splitpiece);
    //console.log("rebuildpiece\n", JSON.stringify(rebuildpiece, 4, 4), "\n\n");
    //对文件进行扩展
    var expands = includeAndExtends(rebuildpiece);
    //console.log("expands\n", JSON.stringify(expands, 4, 4), "\n\n");
    return expands;
};

////////////////////////////////////////////////////////////////////////
// 对 piece 进行判断，判断他的属性，作用，返回他的具体类型
////////////////////////////////////////////////////////////////////////
var getpieceType = function(begin, end, content){
    var piece = content.substring(begin, end); //  最长的是{{end block
    //判断是否为 空字符串
    if(utils.trim(piece).length == 0)
        return ["blank"];
    //自定义语句
    if(utils.startWith(utils.ltrim(piece), "{{"))
        return getSpiltParamenter(piece);
    //默认返回值
    return ["html"];
};

var getSpiltParamenter = function(piece){
    var content = utils.trim(piece).substring(2, piece.length - 2);
    var ls = content.split(" ");
    var newls = [];
    for(var i in ls){
        if(!utils.trim(ls[i]).length == 0){
            newls.push(ls[i]);
        }
    }
    return newls;
};

////////////////////////////////////////////////////////////////////////
// 对 piece进行拆分, 将标签进行一个大的归类，
//  extends， block， param， list
//  map， define 等
////////////////////////////////////////////////////////////////////////
var split = function(str) {
    var arr = [];
    var stacklen = 0;
    var cutPoint = [ 0, ];
    for (var i = 0; i < str.length; i++) {
        if (str[i] == "{" && str[i + 1] == "{") {
            if (stacklen++ == 0) {
                cutPoint.push(i);
            }
        } else if (str[i] == "}" && str[i + 1] == "}") {
            if (stacklen-- == 1) {
                cutPoint.push(i + 2);
                i++;
            }
        }
    }
    cutPoint.push(str.length);
    //对文件进行切片
    stacklen = 0;
    for (i = 0, size = cutPoint.length - 1; i < size; i++) {
        var type = getpieceType(cutPoint[i], cutPoint[i+1], str);
        if(type[0] == "blank") continue;
        arr.push({
            "type":type,
            "content":str.substring(cutPoint[i], cutPoint[i + 1])});
    }
    return arr;
};

////////////////////////////////////////////////////////////////////////
// 将文件拉入内存， 并处理文件
////////////////////////////////////////////////////////////////////////
var analysFile = function(file, type) {
    type = type || "file";
    if(type == "file"){
        name = file.substring(file.lastIndexOf(args.spliter) + 1);
        prefix = name.substring(0, name.lastIndexOf("."));
        suffix = name.substring(name.lastIndexOf(".") + 1);
        var content = "";
        var contentList = [];
        var temContentList = [];
        if (suffix.toLowerCase() != SUFFIX) {
            throw new error("not the proper file: file: " + file);
        } else {
            content = fs.readFileSync(file, 'utf-8');
            if (content == "" || content == null)  return [];
            else return split(content);
        }
    }else{    											//单独传入的语句
        if (file == "" || file == null || file == undefined) return [];
        else return split(file);
    }
};

////////////////////////////////////////////////////////////////////////
//  对拆分的文件进行归并
////////////////////////////////////////////////////////////////////////
var rebuild = function(piece, begin, end){
    var begin = begin || 0;
    var end   = end   || piece.length;
    var rebuildpiece = [];
    var index = 0;
    for(index=begin; index < end;){
        if(singleMark.indexOf(piece[index]["type"][0]) >= 0){  //单列属性
            rebuildpiece.push(piece[index++]);
        }else{									  //多列属性
            var tem = _rebuild(piece, index);
            index = tem[0];
            rebuildpiece.push(tem[1]);
        }
    }
    return rebuildpiece;
};

var _rebuild = function(piece, index){
    var rebuildpiece = [];
    var stacklen = 0;
    do{
        if(piece[index]["type"][0] == "end"){                   //处理end
            stacklen--;
            if(stacklen == 0){
                index ++;
                tem = rebuild(rebuildpiece, 1);
                rebuildpiece[0]["children"] = tem;
                rebuildpiece = rebuildpiece[0];
            }else{
                rebuildpiece.push(piece[index++]);
            }
        }else

        if(singleMark.indexOf(piece[index]["type"][0]) >= 0){    //单列属性
            rebuildpiece.push(piece[index++]);
        }else{													//多列属性
            stacklen ++;
            rebuildpiece.push(piece[index++]);
        }
    }while(stacklen != 0);
    return [index, rebuildpiece];
};

var processBlock = function(piece, ls, seq){
    var newSeq = utils.copyObject(seq);
    newSeq.push(piece["type"][1]); //复制
    ls.push(newSeq);    //将blockName放进去
    var children  = piece["children"];
    for(var i= 0, len = children.length; i< len; i++){
        if(children[i]["type"][0] == "block"){
            processBlock(children[i], ls, newSeq );
        }
    }
};

////////////////////////////////////////////////////////////////////////
// include and extends 处理
////////////////////////////////////////////////////////////////////////
var includeAndExtends = function (piece) {
    //先处理include， 将当前文件展开
    var len = piece.length;
    var newPiece = utils.copyObject(piece);

    //处理 include 模板, 啥时候也离不开指针啊
    recursionInclude(newPiece);
    //继承模板显得非常复杂
    //extends 必定在第一层，而且只有一个
    for(var i= 0; i<len; i++){
        if(newPiece[i]["type"][0] == "extends"){
            var extendsPiece = generateFile(piece[i]["type"][1]);
            newPiece = processExtends(newPiece, extendsPiece);
            return newPiece;
        }
    }
    return newPiece;
};

var recursionInclude = function(newPiece){
    for(var i in newPiece){
        if(newPiece[i]["type"][0] == "include"){
            processInclude(newPiece, i);
        }else if(newPiece[i]["type"][0] == "block"){
            recursionInclude(newPiece[i]["children"]);
        }
    }
};

var processInclude = function(piece, index){
    var content = generateFile(piece[index]["type"][1]);
    var temlist = [];
    for(var i = 0, len=piece.length-index; i<len; i++){
        temlist.push(piece.pop());
    }
    for(var i=0, len = content.length;i<len; i++){
        piece.push(content.pop());
    }
    temlist.pop();
    for(var i=0, len = temlist.length; i<len; i++){
        piece.push(temlist.pop());
    }
};

//反客为主
var processExtends = function (piece, extendsPiece) {
    var pieceList = getPieceList(piece);
    var extendsList = getPieceList(extendsPiece);
    //排序， 让最外围标签能够最先被替换掉
    pieceList = pieceList.sort(function(a, b) {
        return a.length > b.length;
    });
    //只替换最上层的内容, 而且只能被替换一次
    for(var i= 0, leni=pieceList.length;i<leni;i++){
        if(pieceList[i].length != 1){
            break;
        }else{
            var matchedPiece = matchPieceList(pieceList[i][0], extendsList);
            if(matchedPiece != -1){
                matchedPiece = JSON.parse(matchedPiece);
                replaceExtendsBlocks(piece[getPieceIndex(piece, matchedPiece)],
                    extendsPiece, matchedPiece);
            }
        }
    }
    return extendsPiece;
};

var getPieceList = function(piece){
    var ls = [];
    for(var i= 0, len = piece.length;i<len; i++) {
        if (piece[i]["type"][0] == "block") {
            processBlock(piece[i], ls, []);
        }
    }
    return ls;
};

var getPieceIndex = function(piece, matchedPiece){
    var a = matchedPiece[matchedPiece.length - 1];
    for(var i=0;i<piece.length;i++){
        if(piece[i]["type"][0] == "block" && piece[i]["type"][1] == a){
            return i;
        }
    }
};

//匹配相同的量
var matchPieceList = function(value, blockList){
    var tem  = utils.copyObject(blockList);
    var tempList = [];
    for(var i=0,len=blockList.length;i<len;i++){
        if(blockList[i][blockList[i].length - 1] == value){
            var a = JSON.stringify(blockList[i]);
            //查找相同index
            for(var j=i+1;j<blockList.length; j++){
                if(blockList[j] != undefined && blockList[j] != null){
                    if(JSON.stringify(blockList[j].slice(0, blockList[i].length)) == a ){
                        tempList.push(j);
                    }
                    else break;
                }
            }
            //清空原数组， 保留地址
            blockList.splice(0,blockList.length);
            for(var k=0;k<tem.length;k++){
                if(tempList.indexOf(k)  < 0){
                    blockList.push(tem[k]);
                }
            }
            return a;
        }
    }
    return -1;
};

var replaceExtendsBlocks = function(piece, extendsPiece, matchedPiece){
    //直接遍历， 横向遍历更好，但是我不会，也不愿意想了
    for(var i=0; i<extendsPiece.length; i++){
        if(extendsPiece[i]["type"][0] == "block" && extendsPiece[i]["type"][1] == matchedPiece[0]){
            if(matchedPiece.length == 1){
                extendsPiece[i] = piece;
                return;
            }else{
                replaceExtendsBlocks(piece, extendsPiece[i]["children"], matchedPiece.slice(1));
            }
        }
    }
};

var JoinTemplate = function(piece, content, indent){
    content = content || "";
    indent = indent || 0;
    for(var i=0;i<piece.length;i++){
        if(doubleMark.indexOf(piece[i]["type"][0]) >= 0){  						//双列类型
            content += ("\n" + utils.indent(indent) + piece[i]["content"]);
            if(piece[i]["children"].length != 0){
                content = JoinTemplate(piece[i]["children"], content , indent+1);
            }
            content += ("\n" + utils.indent(indent) + "{{end " + piece[i]["type"][0] + "}}");
        }else{
            content += (utils.indent(indent) + piece[i]["content"]);
        }
    }
    return content;
};

module.exports = {
    generateFile : generateFile,
    JoinTemplate: JoinTemplate
};