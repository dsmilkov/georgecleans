'use strict';

d3.keybinding = function() {
  // via https://github.com/keithamus/jwerty/
  // and https://github.com/madrobby/keymaster
  const KEYS = {
    // Left Arrow Key, or ←
    '←': 37, left: 37, 'arrow-left': 37,
    // Right Arrow Key, or →
    '→': 39, right: 39, 'arrow-right': 39
  };
  const pairs = d3.entries(KEYS),
      event = d3.dispatch.apply(d3, d3.keys(KEYS));

  function keys(selection) {
      selection.on('keydown', function () {
          const tagName = d3.select(d3.event.target).node().tagName;
          if (tagName == 'INPUT' || tagName == 'SELECT' || tagName == 'TEXTAREA') {
              return;
          }

          let modifiers = '';
          if (d3.event.shiftKey) modifiers += '⇧';
          if (d3.event.ctrlKey) modifiers += '⌃';
          if (d3.event.altKey) modifiers += '⌥';
          if (d3.event.metaKey) modifiers += '⌘';

          pairs.filter(function(d) {
              return d.value === d3.event.keyCode;
          }).forEach(function(d) {
              event[d.key](d3.event, modifiers);
          });
      });
  }

  return d3.rebind(keys, event, 'on');
};

function Sound(src){
  //sound effect class
  //builds a sound effect based on a url
  //may need both ogg and mp3.
  this.snd = document.createElement("audio");
  this.snd.src = src;
  //preload sounds if possible (won't work on IOS)
  this.snd.setAttribute("preload", "auto");
  //hide controls for now
  this.snd.setAttribute("controls", "none");
  this.snd.style.display = "none";
  //attach to document so controls will show when needed
  document.body.appendChild(this.snd);

  this.play = function(){
    this.snd.play();
  } // end play function

  this.showControls = function(){
    //generally not needed.
    //crude hack for IOS
    this.snd.setAttribute("controls", "controls");
    this.snd.style.display = "block";
  } // end showControls

} // end sound class def

const width = 500;
const height = 500;
const dustSize = 30;
const brushRange = 40;
const brushSize = 30;
const submarine = new Sound('submarine.mp3');

const gameDiv = d3.select('#game')
  .style('height', height + 'px');
const centerGameDiv = gameDiv.select('#center');

const vacuum = d3.select('#vacuum');
const vacuumWidth = parseInt(vacuum.style('width'));

let brushLeft = width/2;
let momentum = 0;
let leftMousedown = false;
let rightMousedown = false;

function move(x) {
  return function(event) {
      event.preventDefault();
      momentum += x;
      momentum *= 1.1;
  };
}

d3.select('body').call(d3.keybinding()
.on('←', move(-2))
.on('→', move(2)));

function moveVacuum() {
  if (leftMousedown) {
    move(-.45)({preventDefault: () => {}});
  }
  if (rightMousedown) {
    move(.45)({preventDefault: () => {}});
  }
  brushLeft = Math.min(width - vacuumWidth,  Math.max(0, momentum + brushLeft));
  vacuum.style('left', brushLeft + 'px');
  momentum *= 0.9;
}


function generateSpeed() {
  return Math.random() * 4 + 1;
}

function generateDust() {
  const left = Math.max(0, Math.random() * width - dustSize);
  const speed = generateSpeed();
  const div = centerGameDiv.append('div')
    .classed('dust', true)
    .style('left', left + 'px');
  const top = 0;
  return {speed, div, top, left};
}

d3.timer(function() {
  moveVacuum();
});

let dusts = [];

function removeDust(dust) {
  dust.remove = true;
  dust.div.remove();
}

let score = 0;
let lives = 5;
d3.select('#lives span').html(lives);

let probDust = 0.3;
let start = performance.now();
let lastGeneration = performance.now();

function tick() {
  score++;
  d3.select('#score span').html(score);

  if (performance.now() - lastGeneration > 1000) {
    lastGeneration = performance.now();
    if (Math.random() < probDust) {
      dusts.push(generateDust());
      if (performance.now() - start > 10000) {
        start = performance.now();
        probDust *= 1.3;
      }
    }
  }

  dusts.forEach((dust, idx) => {
    dust.top += dust.speed;
    if (dust.top >= height - 3 * dustSize) {
      const center = dust.left + dustSize / 2;
      const brushCenter = brushLeft + brushSize / 2;
      if (center >= brushCenter - brushRange && center <= brushCenter + brushRange) {
        score += 1000;
        d3.select('#score span').html(score);
        removeDust(dust);
      } else if (dust.top >= height - dustSize) {
        lives--;
        submarine.play();
        if (lives == 0) {
          d3.select('#lives span').html('THE END');
          return;
        }
        d3.select('#lives span').html(lives);
        removeDust(dust);
      }
    }
    dust.div.style('top', dust.top + 'px');
  });
  dusts = dusts.filter(dust => dust.remove !== true);
  if (lives > 0) {
    requestAnimationFrame(() => tick());
  }
}

// Setup touch button
d3.select("#left").on('touchstart', function() {
  d3.select(this).style('background-color', '#ccc');
  d3.event.preventDefault();
  d3.event.stopPropagation();
  leftMousedown = true;
});
d3.select("#left").on('touchend', function() {
  d3.select(this).style('background-color', null);
  d3.event.preventDefault();
  d3.event.stopPropagation();
  leftMousedown = false;
});


d3.select("#right").on('touchstart', function () {
  d3.select(this).style('background-color', '#ccc');
  d3.event.preventDefault();
  d3.event.stopPropagation();
  rightMousedown = true;
});
d3.select("#right").on('touchend', function() {
  d3.select(this).style('background-color', null);
  d3.event.preventDefault();
  d3.event.stopPropagation();
  rightMousedown = false;
});


dusts.push(generateDust());
tick();
