let Module = require("./analyze.js")
const fs = require("fs")

function allocateString(str) {    
    let allocatedMemory = Module.allocateUTF8(str)
    return allocatedMemory
}

function analyzePosition(positionStr) {
    let allocatedMemory = allocateString(positionStr)

    let outputPointer = Module._analyzePosition(allocatedMemory)
    let str = Module.UTF8ToString(outputPointer)

    Module._free(allocatedMemory)
    Module._free(outputPointer)

    return str
}


//TODO: Now let's write a system to take positionStr and return a much more useful object.
var a = {
    result: "D", //D means draw, Y means yellow won, R means red won.
    evaluation: "D", //D means draw, Y11 means yellow wins in 11 moves, R7 means red wins in 7 moves. 
    moveEvaluations: ["D", "Y11", "R7", "R1", "Y7", null, "D"], //The evaluation of each move. Null means move not legal
    bestMove: 1, //The index of the best move
}

//If result is defined, then evaluation should be D, Y0, or R0, and moveEvaluations and bestMove should be all null

function evaluatePosition(positionStr) {
    let resStr = analyzePosition(positionStr);
    console.log(resStr)

    //Positive numbers mean going to win n moves BEFORE board fills up
    //Negative numbers mean going to lose n moves before board fills up. 

    //Board has 42 total spaces

    let evaluations = resStr.split(" ").map(n => Number(n))
    
    //In Connect 4, Yellow always goes first. 

    //From the beginning of the game, yellow will win with 1 empty space. 

    let isYellowNext = positionStr.length % 2 == 0
    let movesRemaining = 42 - positionStr.length

    let halfMovesRemaining = Math.ceil(movesRemaining / 2)

    let moveEvaluations = evaluations.map(n => {
        if (n == -1000) {return null}
        if (n == 0) {return "D"}
        if (n > 0) {return "Y" + (halfMovesRemaining - n + 1)}
        if (n < 0) {return "R" + (halfMovesRemaining + n + 1)}
    })

    console.log(evaluations)




    return moveEvaluations


}


function loadBook(bookFilePath) {
    let arrayBuffer = new Uint8Array(fs.readFileSync(bookFilePath).buffer)


    //bookFilePath is technically irrelevant -
    //We are using the virtual file system, so we can call bookFilePath anything, as long as we pass the same string to Module._loadBook. 
    Module.FS.writeFile(bookFilePath, arrayBuffer)

    let allocatedMemory = allocateString(bookFilePath)

    let outputPointer = Module._loadBook(allocatedMemory)
    // let str = Module.UTF8ToString(outputPointer)

    Module._free(allocatedMemory)
    Module._free(outputPointer)

    return;
}


Module.onRuntimeInitialized = function() {
    setTimeout(function() {

        console.time("Loading Book")

        //The bigger book actually DRAMATICALLY improves some performance, but it takes a lot of memory (~100MB), 
        //and around 24MB more storage (the books really don't compress)

        //That said, it's probably a good thing to include, just because of the insane performance improvement on some checks. 

        //We probably want to do something like:
        //1. Try to initialize with large book (except on web, where bandwidth is a concern)
        //2. If that fails, initialize with small book
        //3. If that fails, use no book

        //When initializing fails, the module crashes with OOM. We might need to create a new module or something. 



        // console.log(loadBook("7x6_small.book"))
                console.log(loadBook("7x6.book"))

        console.timeEnd("Loading Book")


        console.time("Test Cases")

        console.log(analyzePosition("7422341735647741166133573473242566"))
        console.log(analyzePosition("742234173"))

        console.log(analyzePosition("742234174"))




        console.timeEnd("Test Cases")


        console.log(evaluatePosition("")) //Red loses in 21 moves. 

        console.log(evaluatePosition("1")) //Red wins in 20 moves
        console.log(evaluatePosition("2")) //Red wins in 21 moves
        console.log(evaluatePosition("3")) //Draw
        console.log(evaluatePosition("4")) //Red loses in 20 moves
        console.log(evaluatePosition("5")) //Draw
        console.log(evaluatePosition("6")) //Red wins in 21 moves
        console.log(evaluatePosition("7")) //Red wins in 20 moves


        console.log(evaluatePosition("44444433")) //Yellow wins in 2 moves
        console.log(evaluatePosition("4444443")) //Yellow wins in 17 moves
        console.log(evaluatePosition("44444432")) //Yellow wins in 17 moves

        console.log(evaluatePosition("4444443322")) //Yellow wins next move
        console.log(evaluatePosition("44444433225")) //Yellow won

        console.log(evaluatePosition("444444433225")) //Invalid Combo



    }, 100)
}





