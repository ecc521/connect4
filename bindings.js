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


function evaluatePosition(positionStr) {
    //If the position is invalid, analyzePosition will return "Invalid Move #__. Last Valid Position _______."
    //If the position is won, analyzePosition will return "Won on Move #__. Ending Position ________."
    //If the position is valid, but not won, analyzePosition will return a string of numbers, separated by spaces. 
        //Positive numbers mean going to win n moves BEFORE board fills up
        //Negative numbers mean going to lose n moves before board fills up. 
        //-1000 means the move is invalid (column is full).

    let resStr = analyzePosition(positionStr);


    let position = positionStr
    let lastValidPosition = positionStr
    let result = null;
    let evaluation = null;
    let moveEvaluations = new Array(7).fill(null);
    let bestMove = null;

    if (resStr.startsWith("Invalid")) {
        lastValidPosition = resStr.slice(0, -1).split(" ").pop()

        return {
            position,
            lastValidPosition,
            result,
            evaluation,
            moveEvaluations,
            bestMove,
        }
    }

    if (resStr.startsWith("Won")) {
        lastValidPosition = resStr.slice(0, -1).split(" ").pop()
        result = lastValidPosition.length % 2 == 1 ? "Y" : "R";
        evaluation = result;
        
        return {
            position,
            lastValidPosition,
            result,
            evaluation,
            moveEvaluations,
            bestMove,
        }
    }

    //In Connect 4, Yellow always goes first. 
    //Therefore, we can determine which color is next by checking if the number of moves played is even or odd. 

    let evaluations = resStr.split(" ").map(n => Number(n))
    
    let isYellowNext = positionStr.length % 2 == 0
    let movesRemaining = 42 - positionStr.length

    let halfMovesRemaining = Math.ceil(movesRemaining / 2)

    moveEvaluations = evaluations.map(n => {
        if (n == -1000) {return null}
        if (n == 0) {return "D"}
        if (n > 0) {return (isYellowNext ? "Y" : "R") + (halfMovesRemaining - n + 1)}
        if (n < 0) {return (isYellowNext ? "R" : "Y") + (halfMovesRemaining + n + 1)}
    })


    //If no moves are available, the game is a draw. 
    if (moveEvaluations.every(e => e == null)) {
        return {
            position,
            lastValidPosition,
            result: "D",
            evaluation: "D",
            moveEvaluations,
            bestMove,
        }
    }

    //Now we find our best move. 
    //We want to delay the game as much as possible if we are losing, and end the game as soon as possible if we are winning.
    //We will use this to set bestMove and evaluation. 

    let bestMoveIndex = null;
    let bestMoveEvaluation = null;

    function scoreEvaluation(evaluation) {
        let whoWins = evaluation[0];
        let howManyMoves = Number(evaluation.slice(1));

        if (whoWins == "D") {return 0}
        return (whoWins == (isYellowNext ? "Y" : "R")) ? 1/howManyMoves : -1/howManyMoves;
    }

    for (let i=0;i<moveEvaluations.length;i++) {
        let moveEval = moveEvaluations[i];
        if (moveEval == null) {continue} //Invalid move. 

        if (bestMoveIndex == null || scoreEvaluation(moveEval) > bestMoveEvaluation) {
            bestMoveIndex = i;
            bestMoveEvaluation = scoreEvaluation(moveEval);
        }
    }

    bestMove = bestMoveIndex + 1 //Columns 1 indexed, not 0. 
    evaluation = moveEvaluations[bestMoveIndex];

    return {
        position,
        lastValidPosition,
        result,
        evaluation,
        moveEvaluations,
        bestMove,
    }


}


function loadBook(bookFilePath) {
    let arrayBuffer = new Uint8Array(fs.readFileSync(bookFilePath).buffer)

    //bookFilePath is technically irrelevant -
    //We are using the virtual file system, so we can call bookFilePath anything, as long as we pass the same string to Module._loadBook. 

    Module.FS.writeFile(bookFilePath, arrayBuffer)

    let allocatedMemory = allocateString(bookFilePath)

    let outputPointer = Module._loadBook(allocatedMemory)

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


        // console.log(evaluatePosition("44444433")) //Yellow wins in 2 moves
        // console.log(evaluatePosition("4444443")) //Yellow wins in 17 moves
        // console.log(evaluatePosition("44444432")) //Yellow wins in 17 moves

        // console.log(evaluatePosition("4444443322")) //Yellow wins next move
        // console.log(evaluatePosition("44444433225")) //Yellow won

        // console.log(evaluatePosition("333333556444445666664255577777722222111111")) //Draw (game over)

        // console.log(evaluatePosition("444444433225")) //Invalid Combo


    }, 100)
}





