# Connect 4 Game Solver

C++ Connect 4 Game Solver with JavaScript bindings created using Emscripten. 

Exports loadBook, analyzePosition, and onInitialized

Wait for onInitialized before calling other functions, or crashes may occur. 

Loading a book is effectively mandatory to analyze positions with very few moves played (as otherwise, the search tree is extremely large and might take hours)

loadBook takes one parameter, the ArrayBuffer for the bytes of the book file. 

analyzePosition takes one parameter, the sequence of moves played on the board as a string, with "1" representing first column, "2" second, etc. 
So "" is an empty board, "4424" is 4th column, 4th column, 2nd column, 4th column, in that order, etc. 

Example Calls:

connect4solver = require("connect-4-solver")

//Wait for connect4solver.onInitialized to resolve
connect4solver.loadBook(new Uint8Array(fs.readFileSync("7x6.book").buffer))
connect4solver.evaluatePosition("74637")

This C++ source code is published under AGPL v3 license.

Read the associated [step by step tutorial to build a perfect Connect 4 AI](http://blog.gamesolver.org) for explanations.
