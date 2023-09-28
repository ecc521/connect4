let Module = require("./build/analyze.js")
const fs = require("fs")

let bookHasBeenLoaded = false; //Used to warn the user if they try to analyze a small position with no book. 

function allocateString(str) {    
    let allocatedMemory = Module.allocateUTF8(str)
    return allocatedMemory
}

function analyzePosition(positionStr) {
    if (!bookHasBeenLoaded) {
        console.warn("WARNING: You have not loaded a book. This will result in very slow analysis.")
    }

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

    bookHasBeenLoaded = true;

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


let concludeInitialize = null;
let onInitialized = new Promise((resolve) => {concludeInitialize = resolve})
Module.onRuntimeInitialized = function() {
    concludeInitialize();
}



module.exports = {
    onInitialized,
    evaluatePosition,
    loadBook,
}


