class Player {
    private name: string;
    private symbol: string;

    constructor(name: string, symbol: string) {
        this.name = name;
        this.symbol = symbol;
    }

    public getName(): string {
        return this.name;
    }

    public getSymbol(): string {
        return this.symbol;
    }
}

class Board {
    private grid: string[][];
    private movesCount: number = 0;

    constructor() {
        this.grid = [];
        this.initializeBoard();
    }

    private initializeBoard(): void {
        this.grid = [
            ['-', '-', '-'],
            ['-', '-', '-'],
            ['-', '-', '-'],
        ];
        this.movesCount = 0;
    }

    public makeMove(row: number, col: number, symbol: string): void {
        if (
            row < 0 || row >= 3 || 
            col < 0 || col >= 3 || 
            this.grid[row][col] !== '-'
        ) {
            throw new Error('Invalid move!');
        }
        this.grid[row][col] = symbol;
        this.movesCount++;
    }

    public isFull(): boolean {
        return this.movesCount === 9;
    }

    public hasWinner(): boolean {
        // Check rows
        for (let row = 0; row < 3; row++) {
            if (this.grid[row][0] !== '-' && this.grid[row][0] === this.grid[row][1] && this.grid[row][1] === this.grid[row][2]) {
                return true;
            }
        }

        // Check columns
        for (let col = 0; col < 3; col++) {
            if (this.grid[0][col] !== '-' && this.grid[0][col] === this.grid[1][col] && this.grid[1][col] === this.grid[2][col]) {
                return true;
            }
        }

        // Check diagonals
        if (this.grid[0][0] !== '-' && this.grid[0][0] === this.grid[1][1] && this.grid[1][1] === this.grid[2][2]) {
            return true;
        }

        if (this.grid[0][2] !== '-' && this.grid[0][2] === this.grid[1][1] && this.grid[1][1] === this.grid[2][0]) {
            return true;
        }

        return false;
    }

    public printBoard(): void {
        for (let row = 0; row < 3; row++) {
            console.log(this.grid[row].join(' '));
        }
        console.log();
    }
}


class Game {
    private player1: Player;
    private player2: Player;
    private board: Board;
    private currentPlayer: Player;

    constructor(player1: Player, player2: Player) {
        this.player1 = player1;
        this.player2 = player2;
        this.board = new Board();
        this.currentPlayer = player1;
    }

    public async play(): Promise<void> {
        this.board.printBoard();

        while (!this.board.isFull() && !this.board.hasWinner()) {
            console.log(`${this.currentPlayer.getName()}'s turn.`);
            const row = await this.getValidInput('Enter row (0-2): ');
            const col = await this.getValidInput('Enter column (0-2): ');

            try {
                this.board.makeMove(row, col, this.currentPlayer.getSymbol());
                this.board.printBoard();
                this.switchPlayer();
            } catch (e) {
                if (e instanceof Error) {
                    console.log(e.message);
                }
            }
        }

        if (this.board.hasWinner()) {
            this.switchPlayer(); // Switch back to the winning player
            console.log(`${this.currentPlayer.getName()} wins!`);
        } else {
            console.log("It's a draw!");
        }
    }

    private switchPlayer(): void {
        this.currentPlayer = (this.currentPlayer === this.player1) ? this.player2 : this.player1;
    }

    private async getValidInput(message: string): Promise<number> {
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        return new Promise<number>((resolve) => {
            rl.question(message, (input : any) => {
                rl.close();
                const parsedInput = parseInt(input, 10);
                if (!isNaN(parsedInput) && parsedInput >= 0 && parsedInput <= 2) {
                    resolve(parsedInput);
                } else {
                    console.log('Invalid input! Please enter a number between 0 and 2.');
                    resolve(this.getValidInput(message));
                }
            });
        });
    }
}


class TicTacToeDemo {
    public static run(): void {
        const player1 = new Player('Player 1', 'X');
        const player2 = new Player('Player 2', 'O');

        const game = new Game(player1, player2);
        game.play();
    }
}

// Run the demo
TicTacToeDemo.run();
