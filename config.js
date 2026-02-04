const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const TILE = 32;
const ROWS = 15;
const COLS = 15;

const DIRS = [
  [1, 0], [-1, 0], [0, 1], [0, -1]
];

const startButton = document.getElementById("startButton");
const messageBox = document.getElementById("messageBox");
const messageText = document.getElementById("messageText");
const retryButton = document.getElementById("retryButton");

messageBox.classList.add("hidden");
