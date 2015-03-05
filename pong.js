//////////////////////////////////// PADDLE ////////////////////////////////
function Paddle(x, frontX, y, width, height, courtHeight) {
    this.defaultSpeed = courtHeight >> 6; // 1/128 of the height
    this.x = x;
    this.frontX = frontX;
    this.y = y;
    this.width = width;
    this.height = height;
    this.halfHeight = this.height >> 1;
    // restrict movement and leave a gap of half a paddle height at top and bottom
    this.minY = this.halfHeight;
    this.maxY = courtHeight - this.height - this.halfHeight;
    this.topSection = this.height >> 2; // top quarter
    this.bottomSection = this.height - (this.height >> 2); // bottom quarter
}

//////////////////////////////////// PLAYER ////////////////////////////////
function Player(court, name) {
    this.court = court;
    this.name = name;
}

Player.prototype.givePaddle = function (paddle) {
    this.paddle = paddle;
};

//////////////////////////////////// COMPUTER PLAYER ////////////////////////////////
ComputerPlayer.prototype = new Player();

function ComputerPlayer(court, name) {
    Player.apply(this, court);
    this.name = name;
}

ComputerPlayer.prototype.updatePaddle = function (ball) {
    var diff = this.paddle.y + this.paddle.halfHeight - ball.y;
    return -diff >> 2;
};

ComputerPlayer.prototype.gameOver = function (won) {
};

//////////////////////////////////// BALL ////////////////////////////////
function Ball(court, ballSize) {
    // X and Y are the top left of the ball
    this.court = court;
    this.ballSize = ballSize;
    this.halfBallSize = ballSize >> 1;
    this.x = (this.court.width >> 1) - this.halfBallSize;
    this.y = (this.court.height >> 1) - this.halfBallSize;
    this.minX = -this.halfBallSize;
    this.maxX = this.court.width - this.halfBallSize;
    this.minY = -this.halfBallSize;
    this.maxY = this.court.height - this.halfBallSize;
    this.y_speed = -2;
    this.x_speed = court.width >> 7; // / 256
}

/*
 Top & Bottom thirds returns by inverting or increases by glancing
 Middle third reflects balls current angle

 TODO adjust for new ball coordinates
 */
Ball.prototype.bouncePaddle = function (paddle) {
    // Gain a bit of speed with every bounce
    this.x_speed = -(this.x_speed + 1);

    if (this.y < paddle.y + paddle.topSection) {
        if (this.y_speed == 0) {
            this.y_speed = court.height >> 8; // ricochet
        } else if (this.y_speed > 0) {
            this.y_speed = -this.y_speed; // reflection
        } else {
            this.y_speed = this.y_speed << 1; // glance
        }
    } else if (this.y > paddle.y + paddle.bottomSection) { // bottom section
        if (this.y_speed == 0) {
            this.y_speed = -court.height >> 8; // ricochet
        } else if (this.y_speed > 0) {
            this.y_speed = this.y_speed << 1; // glance
        } else {
            this.y_speed = -this.y_speed; // reflection
        }
    }

    //noinspection JSUnresolvedFunction
    window.audio.src = "paddle.mp3";
    window.audio.play();
};

// Result
// -1 player 0 failed
// -2 player 1 failed
// 0 nothing happened
// 1 bounced off player 0
// 2 bunced off player 1
Ball.prototype.getCollisons = function () {
    // check for hitting the top wall
    if (this.y <= this.minY) {
        this.y = this.minY;

        // bounce off wall
        this.y_speed = -this.y_speed;
        //noinspection JSUnresolvedFunction
        window.audio.src = "wall.mp3";
        window.audio.play();

        return 0;
    }

    // check for hitting bottom wall
    if (this.y >= this.maxY) {
        this.y = this.maxY;

        // bounce off wall
        this.y_speed = -this.y_speed;
        //noinspection JSUnresolvedFunction
        window.audio.src = "wall.mp3";
        window.audio.play();

        return 0;
    }

    if (this.x_speed < 0) { // Going left
        // touching or behind paddle
        if ((this.x <= this.court.paddles[0].frontX)) {
            // Check for exiting court left - using the middle of the ball to calculate that
            if (this.x < this.minX) {
                return -1;
            }

            if ((this.y + this.ballSize > this.court.paddles[0].y) &&
                (this.y < (this.court.paddles[0].y + this.court.paddles[0].height))) {
                this.bouncePaddle(this.court.paddles[0]);
                return 1;
            }
        }
    } else { // Going right
        // touching or behind paddle
        if ((this.x >= this.court.paddles[1].frontX)) {
            // if leaves the court at the right
            if (this.x > this.maxX) {
                return -2;
            }

            if ((this.y + this.ballSize > this.court.paddles[1].y) &&
                (this.y < (this.court.paddles[1].y + this.court.paddles[1].height))) {
                this.bouncePaddle(this.court.paddles[1]);
                return 2;
            }
        }
    }

    return 0;
};

//////////////////////////////////// GAME ////////////////////////////////
function Game(court) {
    console.log("New Game");
    this.court = court;
    this.court.game = this;
    this.pointsToWin = 21;

    // Create a new ball in the center of the court - Moving
    this.court.ball = new Ball(this.court, this.court.ballSize);

    // add players until enough for a game (2)
    while (this.court.numPlayers < 2) {
        this.court.enter(new ComputerPlayer(this.court, "Computer"));
    }

    this.court.players[0].score = 0;
    this.court.players[1].score = 0;

    // draw initial scoreboard
    this.court.scoreboard.leftScore.innerHTML = this.court.players[0].score.toString();
    this.court.scoreboard.rightScore.innerHTML = this.court.players[1].score.toString();
}

Game.prototype.point = function (player, opponent) {
    console.log("Point for player: " + player.name);

    this.court.scoreboard.pointWon(player);

    if (player.score == this.pointsToWin) {
        this.end(player, opponent);
    } else {
        // Create a new ball in the center of the court - Moving
        this.court.ball = new Ball(this.court, this.court.ballSize);
    }
};

Game.prototype.end = function (winner, looser) {
    console.log("End of game. '" + winner.name + "' wins");
    winner.gameOver(true);
    looser.gameOver(false);

    // TODO find this sound then enable
//    this.gameWon.play();

    this.court.pausePlay();
    this.court.game = null;

    window.message("GAME OVER");
};

//////////////////////////////////// SCOREBOARD ////////////////////////////////
function ScoreBoard(court, scoreboardElement) {
    this.court = court;
    this.leftScore = scoreboardElement.getElementsByClassName("left")[0];
    this.rightScore = scoreboardElement.getElementsByClassName("right")[0];
}

ScoreBoard.prototype.pointWon = function (player) {
    // Play point won sound
    //noinspection JSUnresolvedFunction
    window.audio.src = "point.mp3";
    window.audio.play();

    // increment score of that player
    player.score++;

    // draw new score
    this.leftScore.innerHTML = this.court.players[0].score.toString();
    this.rightScore.innerHTML = this.court.players[1].score.toString();
};

//////////////////////////////////// COURT ////////////////////////////////
function Court(canvas) {
    this.context = canvas.getContext('2d');

    this.width = canvas.width;
    this.height = canvas.height;

    // set the fill for ball and paddles and net from now on
    this.context.fillStyle = "#FFFFFF";

    var paddleWidth = 10;
    var paddleHeight = 50;
    var paddleXOffset = 60;
    this.ballSize = 10;

    var courtMiddleY = Math.floor((this.height - paddleHeight) / 2);

    this.paddles = new Array(2);
    this.paddles[0] = new Paddle(paddleXOffset, paddleXOffset + paddleWidth, courtMiddleY, paddleWidth, paddleHeight, this.height, this.context);
    var front = this.width - paddleXOffset - paddleWidth;
    // adjust frontX by ball size to remove calculation each time
    this.paddles[1] = new Paddle(front, front - this.ballSize, courtMiddleY, paddleWidth, paddleHeight, this.height);

    this.scoreboard = new ScoreBoard(this, document.getElementById("scoreboard"));

    this.paused = false;

    this.players = new Array(2);
    this.players[0] = null;
    this.players[1] = null;
    this.numPlayers = 0;
    this.game = null;

    window.message(this.enterMessage);

    // Install into the global window object
    window.court = this;
    window.draw = 1;
}

Court.prototype.enter = function (player) {
    var response;

    if (this.players[0] == null) {
        this.players[0] = player;
        this.players[0].givePaddle(this.paddles[0]);
        this.context.fillRect(this.paddles[0].x, this.paddles[0].y, this.paddles[0].width, this.paddles[0].height);
        this.numPlayers++;
        console.log("Player '" + player.name + "' enters court, gets left paddle");
        response = "PADDLE YES LEFT";
    } else if (this.players[1] == null) {
        this.players[1] = player;
        this.players[1].givePaddle(this.paddles[1]);
        this.context.fillRect(this.paddles[1].x, this.paddles[1].y, this.paddles[1].width, this.paddles[1].height);
        this.numPlayers++;
        console.log("Player '" + player.name + "' enters court, gets right paddle");
        response = "PADDLE YES RIGHT";
    } else {
        console.log("PADDLE NONE");
        response = "PADDLE NONE";
    }

    window.message(window.court.startMessage);
    return response;
};

Court.prototype.leave = function (leaver) {
    var winner;
    console.log("Player '" + leaver.name + "' has left the court");

    if (leaver == this.players[0]) {
        winner = this.players[1];
        this.players[0] = null;
    } else {
        winner = this.players[0];
        this.players[1] = null;
    }

    if (this.game) {
        this.game.end(winner, leaver);
    } else {
        window.message(this.enterMessage);
    }

    // and remove from the court
    this.numPlayers--;

    // Delete the ball
    if (this.ball) {
        this.context.clearRect(this.ball.x - this.ball.halfBallSize,
            this.ball.y - this.halfBallSize,
            this.ball.ballSize,
            this.ball.ballSize);
    }

    // Delete his paddle
    this.context.clearRect(leaver.paddle.x, leaver.paddle.y, leaver.paddle.width, leaver.paddle.height);
    // Reclaim his paddle
    leaver.paddle = null;
};

Court.prototype.draw = function () {
    var moves = [];

    // update paddle positions for both players
    for (var num = 0; num < 2; num++) {
        var player = this.players[num];
        if (player) {
            var paddle = player.paddle;
            if (paddle) {
                moves[num] = player.updatePaddle(this.ball);
                if (moves[num] != 0) {
                    if (window.draw) {
                        this.context.clearRect(this.paddles[num].x, this.paddles[num].y,
                            this.paddles[num].width, this.paddles[num].height);
                    }

                    paddle.y += moves[num];

                    // Stop at the top of the court
                    if (paddle.y <= paddle.minY) {
                        paddle.y = paddle.minY;
                    } else if (paddle.y >= paddle.maxY) {
                        paddle.y = paddle.maxY;
                    }
                }
            }
        }
    }

    if (window.debug > 1) {
        //noinspection JSUnresolvedVariable
        console.log('    elapsed time to clear() and move() paddles: ' + (performance.now() - window.start) + ' ms');
    }

    if (this.ball) {
        if (window.draw) {
            this.context.clearRect(this.ball.x, this.ball.y, this.ball.ballSize, this.ball.ballSize);
        }

        // detect collisions at previous position
        var result = this.ball.getCollisons();

        this.ball.x += this.ball.x_speed;
        this.ball.y += this.ball.y_speed;

        if (window.draw) {
            this.context.fillRect(this.ball.x, this.ball.y, this.ball.ballSize, this.ball.ballSize);
        }

        if (window.debug > 1) {
            //noinspection JSUnresolvedVariable
            console.log('    elapsed time to end of ball.getCollisons: ' + (performance.now() - window.start) + ' ms');
        }

        if (result < 0) {
            // Delete part of old ball still on screen
            this.context.clearRect(this.ball.oldX, this.ball.oldY, this.ball.ballSize, this.ball.ballSize);

            if (result == -1) {
                this.game.point(this.players[1], this.players[0]);
            }
            else if (result == -2) {
                this.game.point(this.players[0], this.players[1]);
            }
        }

        if (window.debug > 1) {
            //noinspection JSUnresolvedVariable
            console.log('    elapsed time to end of ball.draw(): ' + (performance.now() - window.start) + ' ms');
        }
    }

    if (window.draw) {
        // Draw paddles after the ball may have deleted a part of them, or they moved
        var paddleTouched = result - 1;
        var num = 1;
        do {
            if ((moves[num] != 0) || (paddleTouched == num)) {
                this.context.fillRect(this.paddles[num].x, this.paddles[num].y,
                    this.paddles[num].width, this.paddles[num].height);
            }
        } while(--num >= 0);
    }

    if (window.debug > 1) {
        //noinspection JSUnresolvedVariable
        console.log('    elapsed time to to end of Court.draw(): ' + (performance.now() - window.start) + ' ms');
    }
};

// TODO Control game state
Court.prototype.startPlay = function () {
    if (this.game == null) {
        this.game = new Game(this);
    }

    window.hideMessage();

    console.log("Starting play");
    this.paused = false;
    this.getCollisons();
};

// TODO Control game state
Court.prototype.pausePlay = function () {
    this.paused = true;
    console.log("Play paused");
    window.message(window.court.pausedMessage);
};

// TODO Control game state
Court.prototype.restartPlay = function () {
    this.paused = false;
    window.hideMessage();
    console.log("Play restarted");
    this.getCollisons();
};

// TODO Control game state
Court.prototype.togglePlay = function () {
    // TODO control Game Over state
    if (this.paused) {
        this.restartPlay();
    } else {
        this.pausePlay();
    }
};

// This will be called from window on refresh
Court.prototype.getCollisons = function () {
    if (!window.court.paused) {
        if (window.debug) {
            //noinspection JSUnresolvedVariable
            var start = performance.now();
            console.log('Time since last frame ' + (start - window.start).toFixed(2) + ' ms');
            window.start = start;
        }

        window.court.draw(); // my drawing routing

        if (window.debug) {
            //noinspection JSUnresolvedVariable
            var end = performance.now();

            console.log('court.draw() took ' + (end - window.start) + ' ms');
        }

        // reschedule next animation getCollisons
        window.requestAnimationFrame(window.court.getCollisons);
    }
};

window.enableDebug = function enableDebug() {
    window.debug = 1;
};

window.enableStats = function enableStats() {
    window.stats = true;
};