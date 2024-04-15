const audio = document.getElementById('audio');
const progressBar = document.getElementById('progress');
const playPauseButton = document.getElementById('play-pause-button');
const btnIcon = document.getElementById("btn-icon")
const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d');
const lyricsCanvas = document.getElementById('lyricsCanvas');
const ctxLyrics = lyricsCanvas.getContext('2d');
const centerX = canvas.width/2 ;
const centerY = canvas.height/2;
const label = document.getElementById('time')
let lyrics = []
let indexs = []
let currentIndex = 0;
let words = [];

// format time
const formatTime = (seconds) => {
  var minutes = Math.floor(seconds / 60);
  var remainingSeconds = seconds % 60;

  var formattedMinutes = (minutes < 10 ? '0' : '') + minutes;
  var formattedSeconds = (remainingSeconds < 10 ? '0' : '') + remainingSeconds;

  return formattedMinutes + ':' + formattedSeconds;
}

label.textContent = `${formatTime(Math.floor(audio.currentTime))}/${formatTime(Math.floor(audio.duration))}`

// get XML file
const fetchXML = () => {
  fetch('https://storage.googleapis.com/ikara-storage/ikara/lyrics.xml')
  .then(response => response.text())
  .then(xml => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, 'text/xml');

    const params = xmlDoc.querySelectorAll('param');
    
    for (let param of params) {
      const wordsInParam = Array.from(param.getElementsByTagName('i')).map(word => ({
        text: word.textContent.trim(),
        start: parseFloat(word.getAttribute('va'))
      }));
      words.push(wordsInParam);
    }
  })
}

fetchXML()
let intervalID;

// play / stop button event
playPauseButton.addEventListener('click', () => {
  if (audio.paused) {
    audio.play();
    btnIcon.classList.add('fa-pause')
    btnIcon.classList.remove('fa-play')
    intervalID = setInterval(updateAudio, 100)
  } else {
    audio.pause();
    btnIcon.classList.add('fa-play')
    btnIcon.classList.remove('fa-pause')
    clearInterval(intervalID)
  }
});

const getParams = (time) => {
  if(time >= words[words.length - 1][0].start)
    return [words[words.length - 2], words[words.length - 1]]
  for(let i = 0; i < words.length; i++){
    if(time >= words[i][0].start && time <= words[i+1][0].start){
      if(i===0)
        return [words[i], words[i+1]]
      return [words[i - 1], words[i], words[i+1]]
    }
  }
  return [words[0], words[1]]
}

const getWidth = (currentParam) => {
  let width = 0;
  currentParam.forEach((item) => {
    width+= ctxLyrics.measureText(item.text).width + 10;
  })
  return width;
}

// show lyrics
const drawLyrics = () => {
  const currentTime = audio.currentTime;
  ctxLyrics.clearRect(0, 0, lyricsCanvas.width, lyricsCanvas.height);
  ctxLyrics.font = `24px Arial`;

  const currentParams = getParams(audio.currentTime);

  for (let i = 0; i < currentParams.length; i++) {
    const currentParam = currentParams[i];
    let width = 20;
    for (let j = 0; j < currentParam.length; j++) {
      const word = currentParam[j];
      const textWidth = ctxLyrics.measureText(word.text).width
      if (word.start <=  currentTime){
        const gradientColor = ctx.createLinearGradient(width, 30 + 30*i, width + textWidth, 30 + 30*i);
        let time;
        if(j === currentParam.length -1){
          time =( 
            (
              currentParams[i+1] 
              && currentParams[i+1][0].start - word.start <= 1 
            ) ?
            currentParams[i+1] && currentParams[i+1][0].start - word.start : 
            1
          );
        }else{
          time = currentParam[j+1].start - word.start;
        }
        let percentGradient = ((currentTime - word.start)/ time);
        percentGradient = percentGradient <= 1 ? percentGradient : 1;
        gradientColor.addColorStop(0, 'blue');
        gradientColor.addColorStop(percentGradient, 'blue');
        if(percentGradient <= 0.99){
          gradientColor.addColorStop(percentGradient + 0.01, '#fff')
        }
        gradientColor.addColorStop(1, '#fff');
        ctxLyrics.fillStyle = gradientColor;
      }else{
        ctxLyrics.fillStyle = '#fff';
      }
      ctxLyrics.fillText(word.text, width, 30 + 30*i);
      width += textWidth + 10;
    }
  }
}

// add update timer audio
const updateAudio = () => {
  if (!audio.paused){
    const currentTime = Math.floor(audio.currentTime);
    const duration = Math.floor(audio.duration);
    const progress = (currentTime / duration) * 100;
    progressBar.value = `${progress}`;
    label.textContent = `${formatTime(currentTime)}/${formatTime(duration)}`
    drawLyrics();
  }
};

// add progress bar input event
progressBar.addEventListener('input', (event) => {
  const value = event.target.value
  audio.currentTime = (parseInt(value) / 100) * audio.duration
  if(audio.paused){
    btnIcon.classList.add('fa-pause')
    btnIcon.classList.remove('fa-play')
    intervalID = setInterval(updateAudio, 100)
  }
})

// draw circle
for(var i = 0; i < 5; i++){
    let radius = 150 - 30 * i;
    let gradient = ctx.createLinearGradient(centerX - radius, centerY , centerX + radius, centerY);
    gradient.addColorStop(0, 'blue');
    gradient.addColorStop(1, 'purple');

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 1000 * Math.PI);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.stroke();
}
