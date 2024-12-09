let cols, rows;
let grid;
let cellSize = 10;
let running = false;
let birthRules = [3]; // Default birth rules
let survivalRules = [2, 3]; // Default survival rules
let isWrapEdges = true;
let enableFade = false;
let liveCellCounter;
let birthCheckboxes = [];
let survivalCheckboxes = [];

function setup() {
    let mainContainer = createDiv();
    mainContainer.style('display', 'grid');
    mainContainer.style('grid-template-columns', '640px auto');
    mainContainer.style('gap', '20px');
    mainContainer.style('padding-top', '20px'); // Add padding at the top
    mainContainer.parent(document.body);

    let canvasContainer = createDiv();
    createCanvas(640, 640).parent(canvasContainer);
    canvasContainer.parent(mainContainer);

    cols = floor(width / cellSize);
    rows = floor(height / cellSize);
    grid = createGrid(cols, rows);

    let controlsContainer = createDiv();
    controlsContainer.style('display', 'flex');
    controlsContainer.style('flex-direction', 'column');
    controlsContainer.style('gap', '10px');
    controlsContainer.parent(mainContainer);

    // Add Buttons
    let buttonContainer = createDiv();
    buttonContainer.style('display', 'flex');
    buttonContainer.style('gap', '10px');
    buttonContainer.parent(controlsContainer);

    let startButton = createButton('Start');
    startButton.parent(buttonContainer);
    startButton.mousePressed(() => running = true);

    let pauseButton = createButton('Pause');
    pauseButton.parent(buttonContainer);
    pauseButton.mousePressed(() => running = false);

    let resetButton = createButton('Reset');
    resetButton.parent(buttonContainer);
    resetButton.mousePressed(() => {
        grid = createGrid(cols, rows);
        running = false;
    });

    let stepForwardButton = createButton('Step Forward');
    stepForwardButton.parent(buttonContainer);
    stepForwardButton.mousePressed(() => {
        grid = updateGrid(grid);
    });

    // Add Sliders
    let speedSlider = createSlider(1, 30, 10);
    speedSlider.parent(controlsContainer);
    speedSlider.input(() => frameRate(speedSlider.value()));

    let gridSizeSlider = createSlider(10, 300, 40);
    gridSizeSlider.parent(controlsContainer);
    gridSizeSlider.input(() => {
        cols = gridSizeSlider.value();
        rows = gridSizeSlider.value();
        cellSize = width / cols; // Adjust cell size dynamically
        grid = createGrid(cols, rows); // Recreate grid
    });

    // Add Rule Controls
    let rulesContainer = createDiv();
    rulesContainer.style('display', 'flex');
    rulesContainer.style('flex-direction', 'column');
    rulesContainer.style('gap', '10px');

    // Birth Rules
    let birthRulesContainer = createDiv();
    birthRulesContainer.style('display', 'flex'); // Horizontal layout for checkboxes
    birthRulesContainer.style('align-items', 'center');
    birthRulesContainer.parent(rulesContainer);

    let birthLabel = createP('Birth Rules:');
    birthLabel.style('margin-right', '10px');
    birthLabel.parent(birthRulesContainer);

    for (let i = 0; i <= 8; i++) {
        let checkbox = createCheckbox(i.toString(), birthRules.includes(i));
        checkbox.parent(birthRulesContainer);
        birthCheckboxes.push(checkbox);
    }

    // Survival Rules
    let survivalRulesContainer = createDiv();
    survivalRulesContainer.style('display', 'flex'); // Horizontal layout for checkboxes
    survivalRulesContainer.style('align-items', 'center');
    survivalRulesContainer.parent(rulesContainer);

    let survivalLabel = createP('Survival Rules:');
    survivalLabel.style('margin-right', '10px');
    survivalLabel.parent(survivalRulesContainer);

    for (let i = 0; i <= 8; i++) {
        let checkbox = createCheckbox(i.toString(), survivalRules.includes(i));
        checkbox.parent(survivalRulesContainer);
        survivalCheckboxes.push(checkbox);
    }

    rulesContainer.parent(controlsContainer);

    let validateButton = createButton('Validate Rules');
    validateButton.parent(controlsContainer);
    validateButton.mousePressed(() => {
        let newBirthRules = [];
        let newSurvivalRules = [];
        birthCheckboxes.forEach((checkbox, index) => {
            if (checkbox.checked()) newBirthRules.push(index);
        });
        survivalCheckboxes.forEach((checkbox, index) => {
            if (checkbox.checked()) newSurvivalRules.push(index);
        });
        if (newBirthRules.length > 0 && newSurvivalRules.length > 0) {
            birthRules = newBirthRules;
            survivalRules = newSurvivalRules;
        } else {
            alert('Invalid rules! Ensure at least one rule is selected for both Birth and Survival.');
        }
    });

    // Add Wrap Edges Toggle
    let wrapEdgesToggle = createCheckbox('Wrap Edges', true); // Default: true
    wrapEdgesToggle.parent(controlsContainer);
    wrapEdgesToggle.changed(() => {
        isWrapEdges = wrapEdgesToggle.checked();
    });

    // Add Live Cell Counter
    liveCellCounter = createP('Live Cells: 0');
    liveCellCounter.parent(controlsContainer);
}

function draw() {
    background(220);
    if (!grid) return;
    if (running) {
        grid = updateGrid(grid);
    }
    drawGrid(grid);
    liveCellCounter.html(`Live Cells: ${grid.flat().filter(cell => cell === 1).length}`);
}

function createGrid(cols, rows) {
    let grid = [];
    for (let i = 0; i < rows; i++) {
        grid[i] = [];
        for (let j = 0; j < cols; j++) {
            grid[i][j] = floor(random(2));
        }
    }
    return grid;
}

function updateGrid(grid) {
    let next = createGrid(cols, rows);
    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[i].length; j++) {
            let state = grid[i][j];
            let neighbors = countNeighbors(grid, i, j);
            if (state === 0 && birthRules.includes(neighbors)) {
                next[i][j] = 1; // Birth
            } else if (state === 1 && survivalRules.includes(neighbors)) {
                next[i][j] = 1; // Survival
            } else {
                next[i][j] = 0; // Death
            }
        }
    }
    return next;
}

function drawGrid(grid) {
    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[i].length; j++) {
            fill(grid[i][j] === 1 ? 0 : 255);
            stroke(200);
            rect(j * cellSize, i * cellSize, cellSize, cellSize); // Use dynamic cell size
        }
    }
}

function countNeighbors(grid, x, y) {
    let sum = 0;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            let row, col;

            if (isWrapEdges) {
                // Toroidal grid (wrapping edges)
                row = (x + i + rows) % rows;
                col = (y + j + cols) % cols;
            } else {
                // Hard boundaries (no wrapping)
                row = x + i;
                col = y + j;
                if (row < 0 || col < 0 || row >= rows || col >= cols) {
                    continue; // Skip neighbors outside the grid
                }
            }

            sum += grid[row][col];
        }
    }
    sum -= grid[x][y]; // Subtract the cell itself
    return sum;
}