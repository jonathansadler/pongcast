// Keyboard Controller - can introduce a new KeyboardPlayer into the court on pressing "e" or "E" for "Enter"

function KeyboardController() {
    console.log("KeyboardController starting");
    window.keyboardPlayer = new KeyboardPlayer(window.court, "Keyboard");
    window.court.enterMessage = "PRESS E TO ENTER";
    window.court.startMessage = "PRESS S TO START";
    window.court.pausedMessage = "PRESS SPACE TO RESTART";
}

KeyboardPlayer.prototype = new Player();

// KeyboardPlayer that controls a paddle using up and down keys on the keyboard
function KeyboardPlayer(court, name) {
    Player.apply(this, court);
    this.name = name;

    window.keysDown = [];

    window.addEventListener("keydown", function (event) {
        // Mark this key in the keysDown array as pressed
        window.keysDown[event.keyCode] = true;
    });

    window.addEventListener("keyup", function (event) {
        // remove this key from the keysDown array
        delete window.keysDown[event.keyCode];
    });

    // Control court entry, game starting etc
    window.addEventListener("keydown", function (event) {
        var value = Number(event.keyCode);

        if (value == 115) { // 's'
            court.startPlay();
        }

        if (value == 32) { // space
            court.togglePlay();
        }

        if (value == 68) { // 'd'
            window.enableDebug();
        }

        if (value == 69) { // 'e'
            window.court.enter(window.keyboardPlayer);
        }

        if (value == 76) { // 'l'
            window.court.leave(window.keyboardPlayer);
        }
    });

    console.log("Keyboard Player ready");
}

// Check what keys are pressed everytime we get asked to update our paddle position
KeyboardPlayer.prototype.updatePaddle = function () {
    if (window.keysDown.length > 0) {
        for (var key in window.keysDown) {
            var value = Number(key);
            if (value == 38) { // up arrow
                return -this.paddle.defaultSpeed;
            } else if (value == 40) { // down arrow
                return this.paddle.defaultSpeed;
            }
        }
    }
    return 0;
};

KeyboardPlayer.prototype.gameOver = function (won) {
};

