let Module = require("./analyze.js")
const fs = require("fs")

function allocateString(str) {    
    let allocatedMemory = Module.allocateUTF8(str)
    return allocatedMemory
}

function analyzePosition(positionStr) {
    //If the position is invalid, analyzePosition will return "Invalid Move #__. Last Valid Position _______."
    //If the position is won, analyzePosition will return "Won on Move #__. Ending Position ________."
    //If the position is valid, but not won, analyzePosition will return a string of numbers, separated by spaces. 
        //Positive numbers mean going to win n moves BEFORE board fills up
        //Negative numbers mean going to lose n moves before board fills up. 
        //-1000 means the move is invalid (column is full).

    let allocatedMemory = allocateString(positionStr)

    let outputPointer = Module._analyzePosition(allocatedMemory)
    let str = Module.UTF8ToString(outputPointer)

    Module._free(allocatedMemory)
    Module._free(outputPointer)

    return str
}


function loadBook(arrayBuffer) {
    let bookFilePath = "book.book"

    Module.FS.writeFile(bookFilePath, arrayBuffer)

    let allocatedMemory = allocateString(bookFilePath)

    let outputPointer = Module._loadBook(allocatedMemory)

    Module._free(allocatedMemory)
    Module._free(outputPointer)

    return;
}


function evaluatePosition(positionStr) {
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

    //TODO: For best move, do we want to supply a list of all moves that are equally good, or have some other system (top moves in order?)

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


Module.onRuntimeInitialized = function() {

    console.time("Loading Book")

    //The bigger book actually DRAMATICALLY improves some performance, but it takes a lot of memory (~100MB), 
    //and around 24MB more storage (the books really don't compress)

    //The small book is, at a minimum, absolutely necessary. Otherwise, some combinations just take too long to compute. 
    //The big book can cause OOM crashes (if <200MB ram on device
    //so we want a fallback system or at least something for web. 



    // let bookBuffer = new Uint8Array(fs.readFileSync("7x6_small.book").buffer)
    let bookBuffer = new Uint8Array(fs.readFileSync("7x6.book").buffer)
    console.log(loadBook(bookBuffer))

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

    console.log(evaluatePosition("333333556444445666664255577777722222111111")) //Draw (game over)

    console.log(evaluatePosition("444444433225")) //Invalid Combo
}





