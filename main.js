var lex = require("./lex");
var fun = require("./fun");
var run = require("./run");
var utils = require("./utils");
var startTime, endTime;
startTime = new Date().getTime();

var finallTemplate = null;
var generateFuntion = null;
var generatedString = null;
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