function isChrome() {
  var isChromium = window.chrome,
    winNav = window.navigator,
    vendorName = winNav.vendor,
    isOpera = winNav.userAgent.indexOf("OPR") > -1,
    isIEedge = winNav.userAgent.indexOf("Edge") > -1,
    isIOSChrome = winNav.userAgent.match("CriOS");

  if(isIOSChrome){
    return true;
  } else if(isChromium !== null && isChromium !== undefined && vendorName === "Google Inc." && isOpera == false && isIEedge == false) {
    return true;
  } else {
    return false;
  }
}

function gotoListeningState() {
  const micListening = document.querySelector(".mic .listening");
  const micReady = document.querySelector(".mic .ready");

  micListening.style.display = "block";
  micReady.style.display = "none";
}

function gotoReadyState() {
  const micListening = document.querySelector(".mic .listening");
  const micReady = document.querySelector(".mic .ready");

  micListening.style.display = "none";
  micReady.style.display = "block";
}

function addBotItem(text) {
  const appContent = document.querySelector(".app-content");
  appContent.innerHTML += '<div class="item-container item-container-bot"><div class="item"><p>' + text + '</p></div></div>';
  appContent.scrollTop = appContent.scrollHeight; // scroll to bottom
}

function addUserItem(text) {
  const appContent = document.querySelector(".app-content");
  appContent.innerHTML += '<div class="item-container item-container-user"><div class="item"><p>' + text + '</p></div></div>';
  appContent.scrollTop = appContent.scrollHeight; // scroll to bottom
}

function displayCurrentTime() {
  const timeContent = document.querySelector(".time-indicator-content");
  const d = new Date();
  const s = d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  timeContent.innerHTML = s;
}

function addError(text) {
  addBotItem(text);
  const footer = document.querySelector(".app-footer");
  footer.style.display = "none";
}

document.addEventListener("DOMContentLoaded", function(event) {
  displayCurrentTime();

  // check for Chrome
  if (!isChrome()) {
    addError("This demo only works in Google Chrome.");
    return;
  }

  if (!('speechSynthesis' in window)) {
    addError("Your browser doesn’t support speech synthesis. This demo won’t work.");
    return;
  }

  if (!('webkitSpeechRecognition' in window)) {
    addError("Your browser cannot record voice. This demo won’t work.");
    return;
  }
  // Initial feedback message.
  const initMessage = "Hi! I’m voicebot. Tap the microphone and start talking to me."

  addBotItem(initMessage);
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(initMessage));

  var recognition = new webkitSpeechRecognition();
  var recognizedText = null;
  recognition.continuous = false;

  recognition.onstart = function() {
    recognizedText = null;
  };

  recognition.onresult = function(ev) {
    recognizedText = ev["results"][0][0]["transcript"];
    addUserItem(recognizedText);
  // Query the text to api server 
    var settings = {
      "url": "https://api-inference.huggingface.co/models/gpt2",
      "method": "POST",
      "timeout": 0,
      "headers": {
        "Connection": "keep-alive",
        "Pragma": "no-cache",
        "Cache-Control": "no-cache",
        "Origin": "https://huggingface.co",
        "Sec-Fetch-Dest": "empty",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36",
        "Content-Type": "text/plain;charset=UTF-8",
        "Accept": "*/*",
        "Sec-Fetch-Site": "same-site",
        "Sec-Fetch-Mode": "cors",
        "Referer": "https://huggingface.co/gpt2?text="+recognizedText,
        "Accept-Language": "en-US,en;q=0.9"
      },
      "data": "\""+recognizedText+"\""
    };
    $.ajax(settings).done(function (response) {
      console.log(response);
      var data = response[0].generated_text;
      var timer = window.setTimeout(function() { startListening(); }, 5000);              
      var msg = new SpeechSynthesisUtterance(data);
      addBotItem(recognizedText);
      msg.addEventListener("end", function(ev) {
        window.clearTimeout(timer);
        startListening();
      });
      msg.addEventListener("error", function(ev) {
        window.clearTimeout(timer);
        startListening();
      });

    window.speechSynthesis.speak(msg);

    });
//     $.ajax({
//             type: 'POST',
//             url: './api/',
//             contentType: "application/json",
//             data: JSON.stringify({"text": recognizedText}),
//             success: function(data){
//                         // Set a timer just in case. so if there was an error speaking or whatever, there will at least be a prompt to continue
//                         var timer = window.setTimeout(function() { startListening(); }, 5000);
                  
//                         var msg = new SpeechSynthesisUtterance(data);
//                         addBotItem(data);
                        
//                         msg.addEventListener("end", function(ev) {
//                           window.clearTimeout(timer);
//                           startListening();
//                         });

//                         msg.addEventListener("error", function(ev) {
//                           window.clearTimeout(timer);
//                           startListening();
//                         });

//                         window.speechSynthesis.speak(msg);
//                      }
//       });
  };

  recognition.onerror = function(ev) {
    console.log("Speech recognition error", ev);
  };
  recognition.onend = function() {
    gotoReadyState();
  };

  function startListening() {
    gotoListeningState();
    recognition.start();
  }

  const startButton = document.querySelector("#start");
  startButton.addEventListener("click", function(ev) {
    startListening();
    ev.preventDefault();
  });

  // Esc key handler - cancel listening if pressed
  // http://stackoverflow.com/questions/3369593/how-to-detect-escape-key-press-with-javascript-or-jquery
  document.addEventListener("keydown", function(evt) {
    evt = evt || window.event;
    var isEscape = false;
    if ("key" in evt) {
        isEscape = (evt.key == "Escape" || evt.key == "Esc");
    } else {
        isEscape = (evt.keyCode == 27);
    }
    if (isEscape) {
        recognition.abort();
    }
  });
});
