// Smart Braille Reader — client-side prototype
const $ = (id) => document.getElementById(id);
const textInput = $("textInput");
let converted = [];
let currentIndex = 0;
let recognition = null;
let recognizing = false;
let toastTimer;

const brailleMap = {
 a:[1],b:[1,2],c:[1,4],d:[1,4,5],e:[1,5],f:[1,2,4],g:[1,2,4,5],h:[1,2,5],i:[2,4],j:[2,4,5],
 k:[1,3],l:[1,2,3],m:[1,3,4],n:[1,3,4,5],o:[1,3,5],p:[1,2,3,4],q:[1,2,3,4,5],r:[1,2,3,5],s:[2,3,4],t:[2,3,4,5],
 u:[1,3,6],v:[1,2,3,6],w:[2,4,5,6],x:[1,3,4,6],y:[1,3,4,5,6],z:[1,3,5,6],
 ",":[2],";":[2,3]," :":[2,5],".":[2,5,6],"!":[2,3,5],"?":[2,3,6],"'":[3],"-":[3,6],"/":[3,4],":":[2,5],"(":[2,3,5,6],")":[2,3,5,6],
 '"':[5,6],"=":[2,3,5,6],"+":[3,4,6],"*":[3,5],"@":[4,5],"#":[3,4,5,6]
};
const numberMap = {1:"a",2:"b",3:"c",4:"d",5:"e",6:"f",7:"g",8:"h",9:"i",0:"j"};
const numberSign = [3,4,5,6];
const capitalSign = [6];
const dotNames = ["1","2","3","4","5","6"];

function patternForChar(ch, inNumber=false) {
  if(/[0-9]/.test(ch)) return brailleMap[numberMap[ch]];
  return brailleMap[ch.toLowerCase()] || [];
}
function encodeText(str){
  const result=[]; let inNumber=false;
  for(const ch of str){
    if(/[0-9]/.test(ch)){
      if(!inNumber) result.push({char:"NUMBER SIGN",dots:numberSign,unicode:unicodeFromDots(numberSign),kind:"indicator"});
      inNumber=true; const dots=patternForChar(ch); result.push({char:ch,dots,unicode:unicodeFromDots(dots),kind:"number"}); continue;
    }
    inNumber=false;
    if(/[A-Z]/.test(ch)) result.push({char:"CAPITAL SIGN",dots:capitalSign,unicode:unicodeFromDots(capitalSign),kind:"indicator"});
    if(ch===" "){result.push({char:" ",dots:[],unicode:"⠀",kind:"space"});continue;}
    const dots=patternForChar(ch);
    if(dots.length || brailleMap[ch]) result.push({char:ch,dots,unicode:unicodeFromDots(dots),kind:"letter"});
    else result.push({char:ch,dots:[],unicode:"�",kind:"unsupported"});
  }
  return result;
}
function unicodeFromDots(dots){
  // Unicode Braille cell U+2800 uses bit order: dot1=bit0, dot2=bit1 ... dot8=bit7
  let bits=0; dots.forEach(d=>bits |= (1<<(d-1)));
  return String.fromCodePoint(0x2800+bits);
}
function asciiCell(dots){
  const active=new Set(dots);
  return [ [1,4],[2,5],[3,6] ].map(row=>row.map(d=>active.has(d)?"*":".").join(" ")).join("\n");
}
function asciiFor(items){
  return items.map(item=>`${item.char===" "?"SPACE":item.char}  ${item.unicode}\n${asciiCell(item.dots)}${item.kind==="indicator"?"  (indicator)":""}`).join("\n\n");
}
function brailleFor(items){return items.map(x=>x.unicode).join("");}
function showToast(msg){
  const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2300);
}
function setConverted(){
  converted=encodeText(textInput.value);currentIndex=0;
  $("brailleOutput").textContent=converted.length?brailleFor(converted):"Your Braille output will appear here.";
  $("brailleStatus").textContent=converted.length?`${converted.length} Braille cells generated`:"Waiting for text";
  $("asciiOutput").textContent=converted.length?asciiFor(converted):"Your ASCII representation will appear here.";
  $("espPreview").textContent=converted.length?JSON.stringify({text:textInput.value,cells:converted.map(x=>({character:x.char,dots:x.dots,unicode:x.unicode}))},null,2):"Convert text first to preview the payload.";
  renderExplorer(); updateCount();
}
function updateCount(){const n=textInput.value.length;$("charCount").textContent=`${n} character${n===1?"":"s"}`;}
function createCell(dots,large=false){
  const cell=document.createElement("div");cell.className="braille-cell"+(large?" large-cell":"");
  cell.setAttribute("aria-label",`Dots ${dots.length?dots.join(", "):"none"}`);
  for(let d=1;d<=6;d++){const s=document.createElement("span");if(dots.includes(d))s.classList.add("on");cell.appendChild(s);}
  return cell;
}
function renderExplorer(){
  const item=converted[currentIndex]||{char:"—",dots:[],unicode:"⠀"};
  const big=$("bigCell");big.replaceWith(createCell(item.dots,true));$("bigCell").id="bigCell";
  $("selectedChar").textContent=item.char===" "?"Space":item.char;
  $("selectedDots").textContent=item.dots.length?`Dots ${item.dots.join(", ")}`:"No raised dots";
  $("selectedUnicode").textContent=item.unicode;
  $("charPosition").textContent=`Character ${converted.length?currentIndex+1:0} of ${converted.length}`;
  const strip=$("patternStrip");strip.innerHTML="";
  if(!converted.length){strip.innerHTML='<p class="helper">Convert some text first to explore its Braille patterns.</p>';return;}
  converted.forEach((x,i)=>{
    const btn=document.createElement("button");btn.className="pattern-item"+(i===currentIndex?" selected":"");btn.setAttribute("aria-label",`Select ${x.char===" "?"space":x.char}, dots ${x.dots.join(",")||"none"}`);
    btn.appendChild(createCell(x.dots));const b=document.createElement("b");b.textContent=x.char===" "?"Space":x.char;b.style.marginTop="7px";btn.appendChild(b);
    const sm=document.createElement("small");sm.textContent=x.dots.length?x.dots.join("·"):"blank";btn.appendChild(sm);
    btn.addEventListener("click",()=>{currentIndex=i;renderExplorer();});strip.appendChild(btn);
  });
}
function moveChar(delta){if(!converted.length)return;currentIndex=(currentIndex+delta+converted.length)%converted.length;renderExplorer();}
function setRate(v){$("speechRate").value=v;$("settingsSpeechRate").value=v;$("rateValue").textContent=Number(v).toFixed(1)+"×";$("settingsRate").textContent=Number(v).toFixed(1)+"×";}
function speak(){
  if(!textInput.value.trim()){showToast("Enter text before reading aloud.");textInput.focus();return;}
  if(!("speechSynthesis" in window)){showToast("Speech synthesis is not supported in this browser.");return;}
  speechSynthesis.cancel();const utter=new SpeechSynthesisUtterance(textInput.value);utter.rate=Number($("speechRate").value);
  utter.onstart=()=>{$("speechStatus").textContent="Reading aloud…";$("speakBtn").disabled=true;$("pauseBtn").disabled=false;$("stopBtn").disabled=false;};
  utter.onend=()=>{$("speechStatus").textContent="Finished reading.";resetSpeechButtons();};
  utter.onerror=()=>{$("speechStatus").textContent="Speech could not be played.";resetSpeechButtons();};
  speechSynthesis.speak(utter);
}
function resetSpeechButtons(){$("speakBtn").disabled=false;$("pauseBtn").disabled=true;$("stopBtn").disabled=true;$("pauseBtn").textContent="Ⅱ Pause";}
function stopSpeech(){if("speechSynthesis"in window)speechSynthesis.cancel();$("speechStatus").textContent="Speech stopped.";resetSpeechButtons();}
function copyText(text,label){if(!text){showToast("Nothing to copy yet.");return;}navigator.clipboard?.writeText(text).then(()=>showToast(label+" copied!")).catch(()=>{const ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove();showToast(label+" copied!");});}
function switchView(name){
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  $("view-"+name).classList.add("active");
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===name));
  const names={reader:"Reader",simulator:"Braille simulator",ascii:"ASCII Braille",accessibility:"Accessibility",esp32:"ESP32 integration",about:"About project"};
  $("pageName").textContent=names[name]||"Reader";window.scrollTo({top:0,behavior:"smooth"});
}
document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>switchView(b.dataset.view)));
textInput.addEventListener("input",updateCount);
$("convertBtn").addEventListener("click",()=>{setConverted();showToast("Text converted into Braille.");});
$("asciiRefresh").addEventListener("click",()=>{setConverted();showToast("ASCII output refreshed.");});
$("copyBraille").addEventListener("click",()=>copyText(brailleFor(converted),"Braille"));
$("copyAscii").addEventListener("click",()=>copyText(asciiFor(converted),"ASCII Braille"));
$("prevChar").addEventListener("click",()=>moveChar(-1));$("nextChar").addEventListener("click",()=>moveChar(1));
$("speakBtn").addEventListener("click",speak);$("stopBtn").addEventListener("click",stopSpeech);
$("pauseBtn").addEventListener("click",()=>{if(speechSynthesis.paused){speechSynthesis.resume();$("pauseBtn").textContent="Ⅱ Pause";$("speechStatus").textContent="Reading resumed.";}else{speechSynthesis.pause();$("pauseBtn").textContent="▶ Resume";$("speechStatus").textContent="Reading paused.";}});
$("speechRate").addEventListener("input",e=>setRate(e.target.value));$("settingsSpeechRate").addEventListener("input",e=>setRate(e.target.value));
$("clearBtn").addEventListener("click",()=>{textInput.value="";setConverted();textInput.focus();showToast("Text cleared.");});
$("pasteBtn").addEventListener("click",async()=>{try{textInput.value=await navigator.clipboard.readText();updateCount();textInput.focus();showToast("Text pasted.");}catch(e){showToast("Clipboard permission unavailable. Use Ctrl+V in the text box.");textInput.focus();}});
$("sampleBtn").addEventListener("click",()=>{textInput.value="Hello, world! Technology should be inclusive.";setConverted();showToast("Sample loaded and converted.");});
$("sendBraille").addEventListener("click",()=>{$("hardwareStatus").textContent="Payload prepared. No ESP32 is connected or data transmitted.";showToast("Braille payload is ready for future integration.");});
$("themeBtn").addEventListener("click",()=>{document.body.classList.toggle("dark");$("darkToggle").checked=document.body.classList.contains("dark");});
$("darkToggle").addEventListener("change",e=>document.body.classList.toggle("dark",e.target.checked));
$("contrastToggle").addEventListener("change",e=>document.body.classList.toggle("high-contrast",e.target.checked));
$("largeToggle").addEventListener("change",e=>document.body.classList.toggle("large-text",e.target.checked));

$("micBtn").addEventListener("click",()=>{
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){$("micStatus").textContent="Speech recognition is not supported in this browser. Try Chrome or use keyboard input.";showToast("Speech recognition unavailable.");return;}
  if(recognizing){recognition.stop();return;}
  recognition=new SR();recognition.lang="en-IN";recognition.interimResults=true;recognition.continuous=false;
  recognition.onstart=()=>{recognizing=true;$("micLabel").textContent="Stop listening";$("micStatus").textContent="Listening… Speak clearly.";};
  recognition.onresult=e=>{let finalText="",interim="";for(let i=e.resultIndex;i<e.results.length;i++){if(e.results[i].isFinal)finalText+=e.results[i][0].transcript;else interim+=e.results[i][0].transcript;}
    if(finalText){textInput.value=(textInput.value.trim()?textInput.value.trim()+" ":"")+finalText.trim();updateCount();$("micStatus").textContent="Speech recognized. You can edit the text before converting.";textInput.focus();}
    else $("micStatus").textContent="Recognizing: "+interim;};
  recognition.onerror=e=>{$("micStatus").textContent="Microphone error: "+e.error+". You can use keyboard input instead.";};
  recognition.onend=()=>{recognizing=false;$("micLabel").textContent="Voice input";};
  try{recognition.start();}catch(e){$("micStatus").textContent="Could not start microphone. Please try again.";}
});
$("themeBtn").setAttribute("aria-label","Toggle dark mode");
document.addEventListener("keydown",e=>{
  if(e.key==="Escape")stopSpeech();
  if(e.ctrlKey&&e.key==="Enter"){e.preventDefault();setConverted();showToast("Text converted into Braille.");}
  if(e.ctrlKey&&e.shiftKey&&e.key.toLowerCase()==="r"){e.preventDefault();speak();}
  if($("view-simulator").classList.contains("active")&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&e.target.tagName!=="TEXTAREA"&&e.target.tagName!=="INPUT"){
    if(e.key==="ArrowLeft")moveChar(-1);if(e.key==="ArrowRight")moveChar(1);
  }
});
setConverted();
