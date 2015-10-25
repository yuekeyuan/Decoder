//这一个是主文件，在本人的开发历史中占有相当重要的地位。
var lex = require("./lex");
var args = require("./args");
var fun = require("./fun");
var run = require("./run");
var utils = require("./utils");
var templates = args.PRECOMPILETEMPLATE;

var Render = function(){
    //这里想用哈希来着，但又一想， 模板不可能有太多，就直接用命称好了， 但是，为了防止冲突，和提高效率，还是用一下比较好
    //至于 传入的string， 还是 hash 一下比较好， 不知道他会不会冲突，
    // 但又不可能写很多的代码来解决这个问题， 先放在这个地方， 以后有机会再解决，毕竟实际开发过程中，基本上没有人传字符串
    var  registerTemplate = [];
    var generatedFunction = [];

    var compileTemplate = function(templateName){
        if(registerTemplate.indexOf(templateName) == -1){
            var lexStr = lex.generateFile(templateName);
            var funStr = fun.genChildren(lexStr);
            var funObj = run.generateAnonymoussFunction(funStr);
            var index = registerTemplate.length;

            registerTemplate[index]  = templateName;
            generatedFunction[index] = funObj;
        }
    };

    var renderTemplate  = function(template, global, isFile){
        global = global || {};
        isFile = isFile || true;                    //现在统一按照 file 来处理
        if(registerTemplate.indexOf(template) == -1) compileTemplate(template);
        return generatedFunction[registerTemplate.indexOf(template)](global, []);
    };
    var preCompileTemplate = function(){
        for(var i in templates)
            compileTemplate(templates[i]);
    };

    var init = function(){
        //模板的预编译
        if(args.CANPRECOMPILETEMPLATE)
            preCompileTemplate();
        console.log("load template properly");
        a = renderTemplate("index.yky");
        console.log(a);
    };
    init();
};

new Render();

module.exports = Render;