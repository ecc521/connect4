/*
 * This file is part of Connect4 Game Solver <http://connect4.gamesolver.org>
 * Copyright (C) 2017-2019 Pascal Pons <contact@gamesolver.org>
 *
 * Connect4 Game Solver is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * Connect4 Game Solver is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Connect4 Game Solver. If not, see <http://www.gnu.org/licenses/>.
 */

#include "Solver.hpp"
#include <iostream>

using namespace GameSolver::Connect4;

#include <emscripten/emscripten.h>

extern "C" {

Solver solver;

EMSCRIPTEN_KEEPALIVE void loadBook(const char* bookFilePath) {
  std::string opening_book = std::string(bookFilePath);
  solver.loadBook(opening_book);
}


EMSCRIPTEN_KEEPALIVE char * analyzePosition(const char* positionCharArr) {
  bool weak = false;

  //Create the position from positionStr. 
  std::string positionString = std::string(positionCharArr);
  Position P;

  std::string output = "";

  if(P.play(positionString) != positionString.size()) {
    output = "Invalid Move #" + std::to_string(P.nbMoves() + 1) + ". Last Valid Position " + positionString.substr(0, P.nbMoves()) + ".";

    //Let's check if the invalid move made us win. If so, return the winning combination. 
    int lastColPlayed = positionString[P.nbMoves()] - '1';

    if (P.isWinningMove(lastColPlayed)) {
      output = "Won on Move #" + std::to_string(P.nbMoves() + 1) + ". Ending Position " + positionString.substr(0, P.nbMoves()) + ".";
    }


  } 
  else {
    std::vector<int> scores = solver.analyze(P, weak);
    for(int i = 0; i < Position::WIDTH; i++) {
      if (output.size() > 0) {
        output = output + " ";
      }
      output = output + std::to_string(scores[i]);
    }
  }

  char* outputArr = output.data();
  return outputArr;

}

} //extern "C"