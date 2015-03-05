#!/bin/bash
java -jar ~/bin/closure/compiler.jar --js_output_file=pong.min.js pong.js
java -jar ~/bin/closure/compiler.jar --js_output_file=keyboardController.min.js keyboardController.js
java -jar ~/bin/closure/compiler.jar --js_output_file=castReceiverController.min.js castReceiverController.js