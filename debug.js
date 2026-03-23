const debugState = {
  menuOpen: false,
  overlayOpen: false,
  boarProbes: false,
  collisionBoxes: false,
  playerInvincible: false,
  winScoreOne: false,
};

class DebugOverlay {
  constructor() {
    this.lines = [];
    this.maxLines = 6;
  }

  toggle() {
    debugState.overlayOpen = !debugState.overlayOpen;
  }

  log(msg) {
    if (!msg) return;
    this.lines.unshift(String(msg));
    if (this.lines.length > this.maxLines) this.lines.length = this.maxLines;
  }

  draw(game) {
    if (!debugState.overlayOpen) return;

    camera.off();
    push();

    noStroke();
    fill(0, 180);
    rect(6, 6, 230, 110, 8);

    fill(255);
    textAlign(LEFT, TOP);
    textSize(11);

    const lines = [
      `Score: ${game.score}`,
      `Health: ${game.health}/${game.maxHealth}`,
      `Player: ${Math.round(game.playerX)}, ${Math.round(game.playerY)}`,
      `Grounded: ${game.grounded}`,
      `Dead: ${game.dead}  Won: ${game.won}`,
      `Invuln: ${game.invulnTimer}`,
    ];

    let y = 12;
    for (const line of lines) {
      text(line, 12, y);
      y += 14;
    }

    y += 4;
    fill("#ffff66");
    for (const line of this.lines) {
      text(line, 12, y);
      y += 12;
    }

    pop();
    camera.on();
  }
}

class DebugMenu {
  constructor() {
    this.selected = 0;
    this.options = [
      { label: "Show Boar Probes", key: "boarProbes" },
      { label: "Show Collision Boxes", key: "collisionBoxes" },
      { label: "Player Invincible", key: "playerInvincible" },
      { label: "Win Condition = 1", key: "winScoreOne" },
    ];
  }

  toggle() {
    debugState.menuOpen = !debugState.menuOpen;
  }

  get enabled() {
    return debugState.menuOpen;
  }

  handleInput(key) {
    if (!this.enabled) return false;

    if (key === "ArrowUp") {
      this.selected =
        (this.selected - 1 + this.options.length) % this.options.length;
      return true;
    }

    if (key === "ArrowDown") {
      this.selected = (this.selected + 1) % this.options.length;
      return true;
    }

    if (key === "Enter" || key === " ") {
      const opt = this.options[this.selected];
      debugState[opt.key] = !debugState[opt.key];
      return true;
    }

    return false;
  }

  draw() {
    if (!this.enabled) return;

    camera.off();
    push();

    noStroke();
    fill(0, 220);
    rect(10, 22, 220, 150, 14);

    textAlign(LEFT, TOP);
    textSize(16);
    fill(255);
    text("DEBUG MENU", 30, 40);

    textSize(13);

    for (let i = 0; i < this.options.length; i++) {
      const opt = this.options[i];
      const y = 74 + i * 24;
      const value = debugState[opt.key] ? "ON" : "OFF";

      fill(i === this.selected ? "#ffff00" : "#ffffff");
      text(`${opt.label}: ${value}`, 20, y);
    }

    pop();
    camera.on();
  }
}
