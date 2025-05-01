// Security measures
document.addEventListener("DOMContentLoaded", () => {
  // Prevent XSS by sanitizing input
  function sanitizeInput(input) {
    const div = document.createElement("div")
    div.textContent = input
    return div.innerHTML
  }

  // Game state
  const state = {
    board: [1, 2, 3, 4, 5, 6, 7, 8, 0], // 0 represents the empty tile
    emptyIndex: 8,
    moves: 0,
    startTime: null,
    timerInterval: null,
    isPlaying: false,
    isSolving: false,
  }

  // DOM elements
  const puzzleBoard = document.getElementById("puzzle-board")
  const shuffleBtn = document.getElementById("shuffle-btn")
  const solveBtn = document.getElementById("solve-btn")
  const movesElement = document.getElementById("moves")
  const timeElement = document.getElementById("time")
  const scoreboardElement = document.getElementById("scoreboard")
  const nextUpdateElement = document.getElementById("next-update")
  const nameModal = document.getElementById("name-modal")
  const finalMovesElement = document.getElementById("final-moves")
  const finalTimeElement = document.getElementById("final-time")
  const playerNameInput = document.getElementById("player-name")
  const saveScoreBtn = document.getElementById("save-score")

  // Initialize the game
  initGame()

  // Event listeners
  shuffleBtn.addEventListener("click", shufflePuzzle)
  solveBtn.addEventListener("click", solvePuzzle)
  saveScoreBtn.addEventListener("click", saveScore)

  // Initialize the game
  function initGame() {
    createBoard()
    loadScoreboard()
    updateNextUpdateTime()
  }

  // Create the puzzle board
  function createBoard() {
    puzzleBoard.innerHTML = ""

    for (let i = 0; i < 9; i++) {
      const tile = document.createElement("div")
      const value = state.board[i]

      if (value !== 0) {
        tile.className = "tile"
        tile.textContent = value
        tile.dataset.value = value

        // Add click event to move tile
        tile.addEventListener("click", () => {
          if (!state.isSolving && canMoveTile(i)) {
            moveTile(i)

            // Start timer on first move
            if (!state.isPlaying) {
              startTimer()
              state.isPlaying = true
            }

            // Check if puzzle is solved
            if (isPuzzleSolved()) {
              endGame()
            }
          }
        })
      } else {
        tile.className = "tile empty"
        state.emptyIndex = i
      }

      puzzleBoard.appendChild(tile)
    }
  }

  // Check if a tile can be moved
  function canMoveTile(index) {
    // A tile can move if it's adjacent to the empty tile (not diagonally)
    const row = Math.floor(index / 3)
    const col = index % 3
    const emptyRow = Math.floor(state.emptyIndex / 3)
    const emptyCol = state.emptyIndex % 3

    return (row === emptyRow && Math.abs(col - emptyCol) === 1) || (col === emptyCol && Math.abs(row - emptyRow) === 1)
  }

  // Move a tile
  function moveTile(index) {
    // Swap the tile with the empty tile
    const temp = state.board[index]
    state.board[index] = 0
    state.board[state.emptyIndex] = temp
    state.emptyIndex = index

    // Update the board
    createBoard()

    // Update moves counter
    state.moves++
    movesElement.textContent = state.moves
  }

  // Check if the puzzle is solved
  function isPuzzleSolved() {
    for (let i = 0; i < 8; i++) {
      if (state.board[i] !== i + 1) {
        return false
      }
    }
    return state.board[8] === 0
  }

  // Shuffle the puzzle
  function shufflePuzzle() {
    // Reset game state
    resetGame()

    // Perform random moves to shuffle
    const moves = 100 // Number of random moves
    const directions = [-3, -1, 1, 3] // Up, left, right, down

    for (let i = 0; i < moves; i++) {
      const validMoves = []

      // Find valid moves
      for (const dir of directions) {
        const newIndex = state.emptyIndex + dir

        // Check if the move is valid
        if (
          (dir === -3 && state.emptyIndex >= 3) || // Up
          (dir === 3 && state.emptyIndex < 6) || // Down
          (dir === -1 && state.emptyIndex % 3 !== 0) || // Left
          (dir === 1 && state.emptyIndex % 3 !== 2) // Right
        ) {
          validMoves.push(newIndex)
        }
      }

      // Make a random valid move
      if (validMoves.length > 0) {
        const randomIndex = Math.floor(Math.random() * validMoves.length)
        const tileIndex = validMoves[randomIndex]

        // Swap tiles
        const temp = state.board[tileIndex]
        state.board[tileIndex] = 0
        state.board[state.emptyIndex] = temp
        state.emptyIndex = tileIndex
      }
    }

    // Make sure the puzzle is solvable
    if (!isSolvable(state.board)) {
      // Swap two tiles to make it solvable
      let index1 = 0
      let index2 = 1

      // Find two non-empty tiles
      while (state.board[index1] === 0) index1++
      index2 = index1 + 1
      while (index2 < 9 && state.board[index2] === 0) index2++

      // Swap them
      const temp = state.board[index1]
      state.board[index1] = state.board[index2]
      state.board[index2] = temp
    }

    // Update the board
    createBoard()
  }

  // Check if a puzzle is solvable
  function isSolvable(board) {
    let inversions = 0
    const boardWithoutZero = board.filter((tile) => tile !== 0)

    for (let i = 0; i < boardWithoutZero.length; i++) {
      for (let j = i + 1; j < boardWithoutZero.length; j++) {
        if (boardWithoutZero[i] > boardWithoutZero[j]) {
          inversions++
        }
      }
    }

    return inversions % 2 === 0
  }

  // Solve the puzzle using A* algorithm
  function solvePuzzle() {
    if (state.isSolving) return

    state.isSolving = true
    solveBtn.disabled = true

    // Start timer if not already started
    if (!state.isPlaying) {
      startTimer()
      state.isPlaying = true
    }

    // Use A* algorithm to find the solution
    const solution = findSolution()

    if (solution) {
      // Animate the solution
      animateSolution(solution, 0)
    } else {
      alert("No se pudo encontrar una solución. Intenta barajar de nuevo.")
      state.isSolving = false
      solveBtn.disabled = false
    }
  }

  // Find solution using A* algorithm
  function findSolution() {
    // Goal state
    const goalState = [1, 2, 3, 4, 5, 6, 7, 8, 0]

    // Priority queue for A*
    const openSet = [
      {
        board: [...state.board],
        emptyIndex: state.emptyIndex,
        moves: [],
        g: 0,
        h: calculateHeuristic([...state.board]),
        f: calculateHeuristic([...state.board]),
      },
    ]

    // Set to keep track of visited states
    const closedSet = new Set()

    // A* algorithm
    while (openSet.length > 0) {
      // Sort by f value (lowest first)
      openSet.sort((a, b) => a.f - b.f)

      // Get the node with the lowest f value
      const current = openSet.shift()

      // Check if we reached the goal
      if (current.board.every((value, index) => value === goalState[index])) {
        return current.moves
      }

      // Add to closed set
      closedSet.add(current.board.join(","))

      // Generate neighbors
      const neighbors = getNeighbors(current)

      for (const neighbor of neighbors) {
        // Skip if already visited
        if (closedSet.has(neighbor.board.join(","))) {
          continue
        }

        // Check if already in open set
        const existingIndex = openSet.findIndex((node) => node.board.join(",") === neighbor.board.join(","))

        if (existingIndex === -1) {
          // Add to open set
          openSet.push(neighbor)
        } else if (neighbor.g < openSet[existingIndex].g) {
          // Update existing node
          openSet[existingIndex] = neighbor
        }
      }
    }

    return null // No solution found
  }

  // Get neighboring states
  function getNeighbors(node) {
    const neighbors = []
    const directions = [
      { dx: 0, dy: -1, name: "up" }, // Up
      { dx: 0, dy: 1, name: "down" }, // Down
      { dx: -1, dy: 0, name: "left" }, // Left
      { dx: 1, dy: 0, name: "right" }, // Right
    ]

    const emptyRow = Math.floor(node.emptyIndex / 3)
    const emptyCol = node.emptyIndex % 3

    for (const dir of directions) {
      const newRow = emptyRow + dir.dy
      const newCol = emptyCol + dir.dx

      // Check if the new position is valid
      if (newRow >= 0 && newRow < 3 && newCol >= 0 && newCol < 3) {
        const newEmptyIndex = newRow * 3 + newCol
        const newBoard = [...node.board]

        // Swap tiles
        newBoard[node.emptyIndex] = node.board[newEmptyIndex]
        newBoard[newEmptyIndex] = 0

        // Create new node
        const newNode = {
          board: newBoard,
          emptyIndex: newEmptyIndex,
          moves: [...node.moves, newEmptyIndex],
          g: node.g + 1,
          h: calculateHeuristic(newBoard),
          f: 0,
        }

        newNode.f = newNode.g + newNode.h
        neighbors.push(newNode)
      }
    }

    return neighbors
  }

  // Calculate heuristic (Manhattan distance)
  function calculateHeuristic(board) {
    let distance = 0

    for (let i = 0; i < 9; i++) {
      const value = board[i]

      if (value !== 0) {
        const goalRow = Math.floor((value - 1) / 3)
        const goalCol = (value - 1) % 3
        const currentRow = Math.floor(i / 3)
        const currentCol = i % 3

        distance += Math.abs(goalRow - currentRow) + Math.abs(goalCol - currentCol)
      }
    }

    return distance
  }

  // Animate the solution
  function animateSolution(solution, index) {
    if (index >= solution.length) {
      state.isSolving = false
      solveBtn.disabled = false

      if (isPuzzleSolved()) {
        endGame()
      }

      return
    }

    setTimeout(() => {
      const tileIndex = solution[index]
      moveTile(tileIndex)
      animateSolution(solution, index + 1)
    }, 300) // Delay between moves
  }

  // Start the timer
  function startTimer() {
    state.startTime = Date.now()

    state.timerInterval = setInterval(() => {
      const elapsedTime = Math.floor((Date.now() - state.startTime) / 1000)
      const minutes = Math.floor(elapsedTime / 60)
        .toString()
        .padStart(2, "0")
      const seconds = (elapsedTime % 60).toString().padStart(2, "0")

      timeElement.textContent = `${minutes}:${seconds}`
    }, 1000)
  }

  // Reset the game
  function resetGame() {
    // Stop timer
    if (state.timerInterval) {
      clearInterval(state.timerInterval)
    }

    // Reset state
    state.moves = 0
    state.startTime = null
    state.isPlaying = false
    state.isSolving = false

    // Reset UI
    movesElement.textContent = "0"
    timeElement.textContent = "00:00"
    solveBtn.disabled = false
  }

  // End the game
  function endGame() {
    // Stop timer
    if (state.timerInterval) {
      clearInterval(state.timerInterval)
    }

    // Calculate final time
    const elapsedTime = Math.floor((Date.now() - state.startTime) / 1000)
    const minutes = Math.floor(elapsedTime / 60)
      .toString()
      .padStart(2, "0")
    const seconds = (elapsedTime % 60).toString().padStart(2, "0")
    const timeString = `${minutes}:${seconds}`

    // Update modal
    finalMovesElement.textContent = state.moves
    finalTimeElement.textContent = timeString

    // Show modal
    nameModal.style.display = "flex"
  }

  // Save score
  function saveScore() {
    const playerName = sanitizeInput(playerNameInput.value.trim())

    if (!playerName) {
      alert("Por favor ingresa tu nombre")
      return
    }

    // Calculate time
    const elapsedTime = Math.floor((Date.now() - state.startTime) / 1000)
    const minutes = Math.floor(elapsedTime / 60)
      .toString()
      .padStart(2, "0")
    const seconds = (elapsedTime % 60).toString().padStart(2, "0")
    const timeString = `${minutes}:${seconds}`

    // Create score object
    const score = {
      name: playerName,
      moves: state.moves,
      time: timeString,
      timeValue: elapsedTime,
      date: new Date().toISOString(),
    }

    // Get existing scores
    let scores = JSON.parse(localStorage.getItem("puzzleScores")) || []

    // Add new score
    scores.push(score)

    // Sort scores (by moves, then by time)
    scores.sort((a, b) => {
      if (a.moves !== b.moves) {
        return a.moves - b.moves
      }
      return a.timeValue - b.timeValue
    })

    // Keep only top 10 scores
    scores = scores.slice(0, 10)

    // Save to localStorage
    localStorage.setItem("puzzleScores", JSON.stringify(scores))

    // Hide modal
    nameModal.style.display = "none"

    // Reset game
    resetGame()

    // Update scoreboard
    loadScoreboard()
  }

  // Load scoreboard
  function loadScoreboard() {
    // Get scores from localStorage
    const scores = JSON.parse(localStorage.getItem("puzzleScores")) || []

    // Clear scoreboard
    scoreboardElement.innerHTML = ""

    // Add scores to scoreboard
    scores.forEach((score, index) => {
      const scoreItem = document.createElement("div")
      scoreItem.className = "scoreboard-item"

      const position = document.createElement("span")
      position.textContent = index + 1

      const name = document.createElement("span")
      name.textContent = score.name

      const moves = document.createElement("span")
      moves.textContent = score.moves

      const time = document.createElement("span")
      time.textContent = score.time

      scoreItem.appendChild(position)
      scoreItem.appendChild(name)
      scoreItem.appendChild(moves)
      scoreItem.appendChild(time)

      scoreboardElement.appendChild(scoreItem)
    })

    // Add empty rows if less than 10 scores
    for (let i = scores.length; i < 10; i++) {
      const emptyRow = document.createElement("div")
      emptyRow.className = "scoreboard-item"

      const position = document.createElement("span")
      position.textContent = i + 1

      const name = document.createElement("span")
      name.textContent = "-"

      const moves = document.createElement("span")
      moves.textContent = "-"

      const time = document.createElement("span")
      time.textContent = "-"

      emptyRow.appendChild(position)
      emptyRow.appendChild(name)
      emptyRow.appendChild(moves)
      emptyRow.appendChild(time)

      scoreboardElement.appendChild(emptyRow)
    }
  }

  // Update next update time
  function updateNextUpdateTime() {
    // Get current date
    const now = new Date()

    // Find next Sunday
    const nextSunday = new Date(now)
    nextSunday.setDate(now.getDate() + ((7 - now.getDay()) % 7))
    nextSunday.setHours(0, 0, 0, 0)

    // Format date
    const options = { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }
    const formattedDate = nextSunday.toLocaleDateString("es-ES", options)

    // Update element
    nextUpdateElement.textContent = `Próxima actualización: ${formattedDate}`

    // Check if we need to reset scores
    const lastReset = localStorage.getItem("lastScoreboardReset")

    if (lastReset) {
      const lastResetDate = new Date(lastReset)

      // If it's been more than a week since the last reset
      if (now > nextSunday && lastResetDate < nextSunday) {
        // Reset scoreboard
        localStorage.removeItem("puzzleScores")
        localStorage.setItem("lastScoreboardReset", now.toISOString())
        loadScoreboard()
      }
    } else {
      // First time, set last reset
      localStorage.setItem("lastScoreboardReset", now.toISOString())
    }
  }

  // Close modal when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target === nameModal) {
      nameModal.style.display = "none"
      resetGame()
    }
  })

  // Prevent XSS in player name input
  playerNameInput.addEventListener("input", () => {
    playerNameInput.value = playerNameInput.value.replace(/[<>]/g, "")
  })

  // Check if HTTPS is being used
  if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
    console.warn("This site should be accessed over HTTPS for better security.")
  }
})
