document.addEventListener('DOMContentLoaded', function() {
    // Canvas setup
    const canvas = document.getElementById('pathfindingCanvas');
    const ctx = canvas.getContext('2d');
    
    // Colors from the original Python implementation
    const COLORS = {
        RED: '#FF9999',       // Closed nodes (already evaluated)
        BLUE: '#99CCFF',      // Open nodes (to be evaluated)
        WHITE: '#FFFFFF',     // Unvisited nodes
        BLACK: '#000000',     // Barriers/walls
        GREY: '#808080',      // Path
        GREEN: '#00FF00',     // Start node
        YELLOW: '#FFFF00'     // End node
    };
    
    // Grid configuration
    let ROWS = 25;
    let WIDTH = 800;
    let NODE_WIDTH;
    let grid = [];
    let startNode = null;
    let endNode = null;
    let isRunning = false;
    
    // Current tool selection
    let currentTool = 'start';
    
    // Initialize the canvas
    function initCanvas() {
        // Make the canvas responsive but maintain aspect ratio
        const containerWidth = document.getElementById('canvas-container').offsetWidth;
        const canvasSize = Math.min(containerWidth - 20, WIDTH);
        
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        NODE_WIDTH = canvasSize / ROWS;
        
        makeGrid();
        drawGrid();
    }
    
    // Create the grid data structure
    function makeGrid() {
        grid = [];
        for (let i = 0; i < ROWS; i++) {
            const row = [];
            for (let j = 0; j < ROWS; j++) {
                row.push({
                    row: i,
                    col: j,
                    x: i * NODE_WIDTH,
                    y: j * NODE_WIDTH,
                    color: COLORS.WHITE,
                    width: NODE_WIDTH,
                    neighbors: [],
                    f_score: Infinity,
                    g_score: Infinity,
                    previous: null,
                    isBarrier: function() { return this.color === COLORS.BLACK; },
                    isStart: function() { return this.color === COLORS.GREEN; },
                    isEnd: function() { return this.color === COLORS.YELLOW; }
                });
            }
            grid.push(row);
        }
        
        startNode = null;
        endNode = null;
    }
    
    // Draw a node on the canvas
    function drawNode(node) {
        ctx.fillStyle = node.color;
        ctx.fillRect(node.x, node.y, node.width, node.width);
        ctx.strokeStyle = '#E0E0E0';
        ctx.strokeRect(node.x, node.y, node.width, node.width);
    }
    
    // Draw the entire grid
    function drawGrid() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw all nodes
        for (let i = 0; i < ROWS; i++) {
            for (let j = 0; j < ROWS; j++) {
                drawNode(grid[i][j]);
            }
        }
        
        // Draw grid lines
        ctx.strokeStyle = '#E0E0E0';
        for (let i = 0; i <= ROWS; i++) {
            // Draw horizontal lines
            ctx.beginPath();
            ctx.moveTo(0, i * NODE_WIDTH);
            ctx.lineTo(canvas.width, i * NODE_WIDTH);
            ctx.stroke();
            
            // Draw vertical lines
            ctx.beginPath();
            ctx.moveTo(i * NODE_WIDTH, 0);
            ctx.lineTo(i * NODE_WIDTH, canvas.height);
            ctx.stroke();
        }
    }
    
    // Calculate the heuristic (Manhattan distance)
    function heuristic(a, b) {
        return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
    }
    
    // Update the neighbors of a node
    function updateNeighbors(node) {
        node.neighbors = [];
        
        // Check DOWN
        if (node.row < ROWS - 1 && !grid[node.row + 1][node.col].isBarrier()) {
            node.neighbors.push(grid[node.row + 1][node.col]);
        }
        
        // Check UP
        if (node.row > 0 && !grid[node.row - 1][node.col].isBarrier()) {
            node.neighbors.push(grid[node.row - 1][node.col]);
        }
        
        // Check RIGHT
        if (node.col < ROWS - 1 && !grid[node.row][node.col + 1].isBarrier()) {
            node.neighbors.push(grid[node.row][node.col + 1]);
        }
        
        // Check LEFT
        if (node.col > 0 && !grid[node.row][node.col - 1].isBarrier()) {
            node.neighbors.push(grid[node.row][node.col - 1]);
        }
    }
    
    // Update neighbors for all nodes
    function updateAllNeighbors() {
        for (let i = 0; i < ROWS; i++) {
            for (let j = 0; j < ROWS; j++) {
                updateNeighbors(grid[i][j]);
            }
        }
    }
    
    // A* Pathfinding Algorithm
    async function aStarAlgorithm() {
        if (!startNode || !endNode) {
            alert('Please set both start and end points before running the algorithm.');
            return;
        }
        
        isRunning = true;
        
        // Update all neighbors
        updateAllNeighbors();
        
        // Reset all nodes
        for (let i = 0; i < ROWS; i++) {
            for (let j = 0; j < ROWS; j++) {
                const node = grid[i][j];
                if (node.color !== COLORS.BLACK && node.color !== COLORS.GREEN && node.color !== COLORS.YELLOW) {
                    node.color = COLORS.WHITE;
                }
                node.f_score = Infinity;
                node.g_score = Infinity;
                node.previous = null;
            }
        }
        
        // Initialize data structures for A* algorithm
        let openSet = [];
        let closedSet = [];
        
        startNode.g_score = 0;
        startNode.f_score = heuristic(startNode, endNode);
        openSet.push(startNode);
        
        while (openSet.length > 0 && isRunning) {
            // Find node with lowest f_score in openSet
            let currentIndex = 0;
            for (let i = 0; i < openSet.length; i++) {
                if (openSet[i].f_score < openSet[currentIndex].f_score) {
                    currentIndex = i;
                }
            }
            
            const current = openSet[currentIndex];
            
            // If we reached the end, reconstruct and visualize the path
            if (current === endNode) {
                await reconstructPath();
                isRunning = false;
                return;
            }
            
            // Remove current from openSet and add to closedSet
            openSet.splice(currentIndex, 1);
            closedSet.push(current);
            
            // Mark as visited (closed) if not start node
            if (current !== startNode) {
                current.color = COLORS.RED;
                drawNode(current);
                // Delay to visualize the algorithm step by step
                await new Promise(resolve => setTimeout(resolve, 15));
            }
            
            // Check all neighbors
            for (const neighbor of current.neighbors) {
                // Skip if already in closedSet
                if (closedSet.includes(neighbor)) continue;
                
                // Calculate tentative g_score
                const tentative_g_score = current.g_score + 1;
                
                // Check if this path is better
                if (tentative_g_score < neighbor.g_score) {
                    neighbor.previous = current;
                    neighbor.g_score = tentative_g_score;
                    neighbor.f_score = neighbor.g_score + heuristic(neighbor, endNode);
                    
                    // Add to openSet if not already there
                    if (!openSet.includes(neighbor)) {
                        openSet.push(neighbor);
                        // Mark as open if not start or end node
                        if (neighbor !== startNode && neighbor !== endNode) {
                            neighbor.color = COLORS.BLUE;
                            drawNode(neighbor);
                        }
                    }
                }
            }
        }
        
        // If while loop completes without finding a path
        if (isRunning) {
            alert('No path found!');
        }
        
        isRunning = false;
    }
    
    // Reconstruct the path from end to start
    async function reconstructPath() {
        let current = endNode;
        
        while (current !== startNode && current.previous) {
            current = current.previous;
            if (current !== startNode) {
                current.color = COLORS.GREY;
                drawNode(current);
                // Add delay to visualize path reconstruction
                await new Promise(resolve => setTimeout(resolve, 30));
            }
        }
        
        // Ensure start and end nodes remain their original colors
        startNode.color = COLORS.GREEN;
        endNode.color = COLORS.YELLOW;
        drawNode(startNode);
        drawNode(endNode);
    }
    
    // Handle grid click events
    function handleGridClick(event) {
        if (isRunning) return;
        
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        // Calculate grid cell position
        const row = Math.floor(mouseX / NODE_WIDTH);
        const col = Math.floor(mouseY / NODE_WIDTH);
        
        // Make sure we're within the grid
        if (row >= 0 && row < ROWS && col >= 0 && col < ROWS) {
            const node = grid[row][col];
            
            // Handle based on current selected tool
            if (currentTool === 'start') {
                // Remove previous start node if it exists
                if (startNode) {
                    startNode.color = COLORS.WHITE;
                    drawNode(startNode);
                }
                
                // Set this node as the new start
                startNode = node;
                node.color = COLORS.GREEN;
            } 
            else if (currentTool === 'end') {
                // Remove previous end node if it exists
                if (endNode) {
                    endNode.color = COLORS.WHITE;
                    drawNode(endNode);
                }
                
                // Set this node as the new end
                endNode = node;
                node.color = COLORS.YELLOW;
            } 
            else if (currentTool === 'barrier') {
                // Make sure we're not overwriting start or end
                if (node !== startNode && node !== endNode) {
                    node.color = COLORS.BLACK;
                }
            } 
            else if (currentTool === 'eraser') {
                // Handle eraser tool
                if (node === startNode) {
                    startNode = null;
                } else if (node === endNode) {
                    endNode = null;
                }
                node.color = COLORS.WHITE;
            }
            
            drawNode(node);
        }
    }
    
    // Initialize tool selection behavior
    function initToolSelection() {
        const toolInputs = document.querySelectorAll('input[name="drawingTool"]');
        toolInputs.forEach(input => {
            input.addEventListener('change', function() {
                currentTool = this.value;
            });
        });
    }
    
    // Initialize button events
    function initButtons() {
        // Start Algorithm button
        document.getElementById('startButton').addEventListener('click', function() {
            if (!isRunning) {
                aStarAlgorithm();
            }
        });
        
        // Reset Grid button
        document.getElementById('resetButton').addEventListener('click', function() {
            isRunning = false;
            makeGrid();
            drawGrid();
        });
        
        // Clear Path button (keeps walls but removes path)
        document.getElementById('clearPathButton').addEventListener('click', function() {
            if (!isRunning) {
                for (let i = 0; i < ROWS; i++) {
                    for (let j = 0; j < ROWS; j++) {
                        const node = grid[i][j];
                        if (node !== startNode && node !== endNode && !node.isBarrier()) {
                            node.color = COLORS.WHITE;
                        }
                    }
                }
                drawGrid();
            }
        });
        
        // Grid size selector
        document.getElementById('gridSizeSelect').addEventListener('change', function() {
            ROWS = parseInt(this.value);
            isRunning = false;
            initCanvas();
        });
    }
    
    // Initialize event listeners
    function initEventListeners() {
        // Handle mouse interactions
        canvas.addEventListener('mousedown', handleGridClick);
        
        // Initialize drag behavior for building walls
        let isDragging = false;
        let lastNodeCoords = null;
        
        canvas.addEventListener('mousedown', function(event) {
            isDragging = true;
            handleGridClick(event);
            
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            lastNodeCoords = {
                row: Math.floor(mouseX / NODE_WIDTH),
                col: Math.floor(mouseY / NODE_WIDTH)
            };
        });
        
        canvas.addEventListener('mousemove', function(event) {
            if (isDragging && !isRunning) {
                const rect = canvas.getBoundingClientRect();
                const mouseX = event.clientX - rect.left;
                const mouseY = event.clientY - rect.top;
                
                const row = Math.floor(mouseX / NODE_WIDTH);
                const col = Math.floor(mouseY / NODE_WIDTH);
                
                // Only update if we've moved to a new node
                if (lastNodeCoords.row !== row || lastNodeCoords.col !== col) {
                    lastNodeCoords = { row, col };
                    
                    if (row >= 0 && row < ROWS && col >= 0 && col < ROWS) {
                        const node = grid[row][col];
                        
                        // Only allow barrier drawing and erasing during drag
                        if (currentTool === 'barrier') {
                            if (node !== startNode && node !== endNode) {
                                node.color = COLORS.BLACK;
                                drawNode(node);
                            }
                        } else if (currentTool === 'eraser') {
                            if (node === startNode) {
                                startNode = null;
                            } else if (node === endNode) {
                                endNode = null;
                            }
                            node.color = COLORS.WHITE;
                            drawNode(node);
                        }
                    }
                }
            }
        });
        
        window.addEventListener('mouseup', function() {
            isDragging = false;
        });
        
        // Handle window resize
        window.addEventListener('resize', function() {
            initCanvas();
        });
    }
    
    // Initialize the application
    function init() {
        initCanvas();
        initToolSelection();
        initButtons();
        initEventListeners();
    }
    
    // Start the application
    init();
});
