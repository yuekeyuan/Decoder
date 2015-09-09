//这一个是主文件，在本人的开发历史中占有相当重要的地位。
var lex = require("./lex");
var args = require("./args");
var fun = require("./fun");
var run = require("./run");
var utils = require("./utils");
var templates = args.PRECOMPILETEMPLATE;

var Render = function(){
    //这里想用哈希来着，但又一想， 模板不可能有太多，就直接用命称好了，
    //至于 传入的string， 还是 hash 一下比较好， 不知道他会不会冲突，
    // 但又不可能写很多的代码来解决这个问题， 先放在这个地方， 以后有机会再解决，毕竟实际开发过程中，基本上没有人传字符串
    var  registerTemplate = [];
    var generateString    = [];
    var generatedFunction = [];

    var compileTemplate = function(templateName){
        if(_existTemplate(templateName) >=0 )
            return true;
        else

    };
    var renderTemplate  = function(template, global, isFile){

    };
    var preCompileTemplate = function(){
        for(var i in templates)
            this.compileTemplate(templates[i]);
    };
    //先默认所有的type 均为 文件类型， TODO：
    var _existTemplate = function(template, type){
        return registerTemplate.indexOf(template);
    };
};

module.exports = Render;






var startTime, endTime;
startTime = new Date().getTime();

for (var i = 0; i < 1; i++) {
    if (false) {
        var generatedString = run.runGeneratedFunction([], [], generateFuntion);
    } else {
        finallTemplate = lex.generateFile("index.yky");
        //console.log("genrated template:\n", JSON.stringify(finallTemplate, 4, 4));

        generateFuntion = fun.genChildren(finallTemplate, 0, "main Function started");
        console.log("\n\ngenerated function:\n", generateFuntion);

        //global 是一个 对象，
        // local 是一个 数组， 数组的每一层代表一层嵌套， 在代码中会定义这么一个 层的代表
        // 由于自定义语言的限制， 栈内不会存放很多东西， 每次for 循环， 存放一个变量
        g = {"a":[1,2,3,4,5,6,7,8,9]};
        var l = [];
        var generatedString = run.runGeneratedFunction(g, l, generateFuntion);
        console.log("\n\ngenerated String:\n", generatedString);
    }
}

endTime = new Date().getTime();
console.log("total running time", endTime - startTime);