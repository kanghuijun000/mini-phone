let powered=true;
let currentPage=null;

let cameraStream=null;
let flashlightStream=null;

let wifi=true;
let airplane=false;
let sound=true;
let vibration=false;

let touchStartY=0;


/* 기본 */

function $(id){
return document.getElementById(id);
}

function toast(message){

const t=$("toast");

t.textContent=message;
t.style.display="block";

clearTimeout(window.toastTimer);

window.toastTimer=setTimeout(()=>{
t.style.display="none";
},1800);

}


/* 시간 */

function updateTime(){

const now=new Date();

const h=String(now.getHours()).padStart(2,"0");
const m=String(now.getMinutes()).padStart(2,"0");
const s=String(now.getSeconds()).padStart(2,"0");

$("statusTime").textContent=h+":"+m;
$("bigTime").textContent=h+":"+m;
$("clockBig").textContent=h+":"+m+":"+s;

$("dateText").textContent=
now.getFullYear()+"년 "+
(now.getMonth()+1)+"월 "+
now.getDate()+"일";

}

setInterval(updateTime,1000);
updateTime();


/* 앱 */

const appNames={
phonePage:"전화",
cameraPage:"카메라",
galleryPage:"갤러리",
memoPage:"메모",
clockPage:"시계",
settingsPage:"설정",
recentPage:"최근 앱"
};


function openApp(id){

if(!powered)return;

document.querySelectorAll(".page").forEach(page=>{
page.style.display="none";
});

$("home").style.display="none";
$(id).style.display="block";

currentPage=id;

let recent=
JSON.parse(localStorage.getItem("recentApps")||"[]");

recent=[
id,
...recent.filter(x=>x!==id)
].slice(0,8);

localStorage.setItem(
"recentApps",
JSON.stringify(recent)
);

if(id==="cameraPage")startCamera();

if(id==="galleryPage")loadGallery();

if(id==="memoPage"){
$("memo").value=
localStorage.getItem("phoneMemo")||"";
}

if(id==="recentPage")loadRecent();

}


function goHome(){

stopCamera();

document.querySelectorAll(".page").forEach(page=>{
page.style.display="none";
});

$("home").style.display="block";

currentPage=null;

}


function goBack(){

if(currentPage){
goHome();
}

}


/* 전화 */

function callNumber(){

const number=$("phoneNumber").value.trim();

if(!number){
toast("전화번호를 입력하세요.");
return;
}

toast(number+"로 전화합니다.");

}


/* 카메라 */

async function startCamera(){

try{

if(
!navigator.mediaDevices||
!navigator.mediaDevices.getUserMedia
){
toast("카메라를 사용할 수 없습니다.");
return;
}

cameraStream=
await navigator.mediaDevices.getUserMedia({
video:{
facingMode:{
ideal:"environment"
}
},
audio:false
});

$("camera").srcObject=cameraStream;

}catch(e){

toast("카메라 사용 권한을 허용해주세요.");

}

}


function stopCamera(){

if(!cameraStream)return;

cameraStream.getTracks().forEach(track=>{
track.stop();
});

cameraStream=null;
$("camera").srcObject=null;

}


function closeCamera(){

stopCamera();
goHome();

}


function takePhoto(){

if(!cameraStream){
toast("카메라가 켜져 있지 않습니다.");
return;
}

const video=$("camera");
const canvas=$("photoCanvas");

canvas.width=video.videoWidth;
canvas.height=video.videoHeight;

const context=canvas.getContext("2d");

context.drawImage(
video,
0,
0,
canvas.width,
canvas.height
);

const image=
canvas.toDataURL("image/jpeg",.8);

let photos=
JSON.parse(
localStorage.getItem("phoneGallery")||"[]"
);

photos.unshift(image);

photos=photos.slice(0,30);

localStorage.setItem(
"phoneGallery",
JSON.stringify(photos)
);

toast("사진이 저장되었습니다.");

}


/* 갤러리 */

function loadGallery(){

const photos=
JSON.parse(
localStorage.getItem("phoneGallery")||"[]"
);

const gallery=$("gallery");

if(!photos.length){

gallery.innerHTML="<p>사진이 없습니다.</p>";
return;

}

gallery.innerHTML="";

photos.forEach((photo,index)=>{

const img=document.createElement("img");

img.src=photo;
img.className="galleryImage";

img.onclick=()=>{
openPhotoViewer(index);
};

gallery.appendChild(img);

});

}


function clearGallery(){

if(!confirm("사진을 모두 삭제할까요?")){
return;
}

localStorage.removeItem("phoneGallery");

loadGallery();

toast("사진을 모두 삭제했습니다.");

}


/* 사진 크게 보기 */

let currentPhotoIndex=-1;


function openPhotoViewer(index){

const photos=
JSON.parse(
localStorage.getItem("phoneGallery")||"[]"
);

if(!photos[index])return;

currentPhotoIndex=index;

$("largePhoto").src=photos[index];

$("photoViewer").style.display="flex";

}


function closePhotoViewer(){

$("photoViewer").style.display="none";

currentPhotoIndex=-1;

}


function deleteCurrentPhoto(){

if(currentPhotoIndex<0)return;

let photos=
JSON.parse(
localStorage.getItem("phoneGallery")||"[]"
);

photos.splice(currentPhotoIndex,1);

localStorage.setItem(
"phoneGallery",
JSON.stringify(photos)
);

closePhotoViewer();
loadGallery();

toast("사진을 삭제했습니다.");

}


/* 메모 */

function saveMemo(){

localStorage.setItem(
"phoneMemo",
$("memo").value
);

toast("메모가 저장되었습니다.");

}


/* 최근 앱 */

function loadRecent(){

const list=$("recentList");

const recent=
JSON.parse(
localStorage.getItem("recentApps")||"[]"
);

if(!recent.length){

list.innerHTML="<p>최근 앱이 없습니다.</p>";
return;

}

list.innerHTML="";

recent.forEach(id=>{

const button=document.createElement("button");

button.className="recentItem";
button.textContent=appNames[id]||id;

button.onclick=()=>{
openApp(id);
};

list.appendChild(button);

});

}


/* 잠금 상태 */

function getLockType(){

return localStorage.getItem("lockType")||"none";

}


function updateLockInfo(){

const type=getLockType();

if(type==="pin"){
$("lockInfo").textContent="숫자 PIN";
}
else if(type==="pattern"){
$("lockInfo").textContent="패턴";
}
else{
$("lockInfo").textContent="잠금 없음";
}

}

updateLockInfo();


/* 잠금 변경 */

let lockChangeStage="";
let setupPattern=[];


/*
lockChangeStage

newPin
newPattern
currentPattern
*/

function changeLock(){

const type=getLockType();


/* 현재 잠금이 없는 경우 */

if(type==="none"){

chooseNewLock();

return;

}


/* 현재 PIN */

if(type==="pin"){

const current=
prompt("현재 사용 중인 PIN을 입력하세요.");

const saved=
localStorage.getItem("phonePin");

if(current!==saved){

toast("현재 PIN이 틀렸습니다.");
return;

}

chooseNewLock();
return;

}


/* 현재 패턴 */

if(type==="pattern"){

startPatternVerification();
return;

}

}


function chooseNewLock(){

const choice=
prompt(
"새 잠금 방식을 선택하세요.\n\n"+
"1 = 숫자 PIN\n"+
"2 = 패턴\n"+
"3 = 잠금 없음"
);

if(choice==="1"){

const pin=
prompt("새로운 4자리 PIN을 입력하세요.");

if(!/^\d{4}$/.test(pin)){

toast("4자리 숫자만 사용할 수 있습니다.");
return;

}

localStorage.setItem("lockType","pin");
localStorage.setItem("phonePin",pin);
localStorage.removeItem("phonePattern");

updateLockInfo();

toast("PIN 잠금이 설정되었습니다.");

}


else if(choice==="2"){

startNewPattern();

}


else if(choice==="3"){

localStorage.removeItem("lockType");
localStorage.removeItem("phonePin");
localStorage.removeItem("phonePattern");

updateLockInfo();

toast("잠금이 해제되었습니다.");

}

}


/* PIN 새로 설정 */

function startNewPattern(){

lockChangeStage="newPattern";
setupPattern=[];

$("patternSetupTitle").textContent=
"새 패턴 설정";

$("patternSetupText").textContent=
"손가락으로 점을 연결하세요.";

clearSetupPattern();

$("patternSetup").style.display="block";

}


/* 현재 패턴 확인 */

function startPatternVerification(){

lockChangeStage="currentPattern";
setupPattern=[];

$("patternSetupTitle").textContent=
"현재 패턴 확인";

$("patternSetupText").textContent=
"현재 사용 중인 패턴을 입력하세요.";

clearSetupPattern();

$("patternSetup").style.display="block";

}


/* 패턴 확인 완료 */

function finishPatternSetup(){

const entered=setupPattern.join("");

if(entered.length<4){

toast("4개 이상의 점을 연결하세요.");
return;

}


/* 현재 패턴 확인 */

if(lockChangeStage==="currentPattern"){

const saved=
localStorage.getItem("phonePattern");

if(entered!==saved){

toast("현재 패턴이 틀렸습니다.");
clearSetupPattern();
return;

}

$("patternSetup").style.display="none";

chooseNewLock();

return;

}


/* 새로운 패턴 */

if(lockChangeStage==="newPattern"){

localStorage.setItem(
"lockType",
"pattern"
);

localStorage.setItem(
"phonePattern",
entered
);

localStorage.removeItem("phonePin");

$("patternSetup").style.display="none";

updateLockInfo();

toast("새 패턴이 설정되었습니다.");

}

}


function cancelPatternSetup(){

$("patternSetup").style.display="none";

clearSetupPattern();

lockChangeStage="";

}


/* ---------------- 잠금 화면 ---------------- */

function showLockScreen(){

const type=getLockType();


/* 잠금 없음 */

if(type==="none"){

$("lockScreen").style.display="none";
return;

}

$("lockScreen").style.display="block";


if(type==="pin"){

$("pinArea").style.display="block";
$("patternArea").style.display="none";

}

else{

$("pinArea").style.display="none";
$("patternArea").style.display="block";

clearUnlockPattern();

}

}


function unlockPin(){

const input=$("pinInput").value;

const saved=
localStorage.getItem("phonePin");

if(input===saved){

$("lockScreen").style.display="none";
$("pinInput").value="";

toast("잠금 해제");

}

else{

toast("PIN이 틀렸습니다.");
$("pinInput").value="";

}

}


/* ---------------- 패턴 공통 ---------------- */

const positions=[
[54,54],
[135,54],
[216,54],

[54,135],
[135,135],
[216,135],

[54,216],
[135,216],
[216,216]
];


/* 잠금화면 패턴 */

let unlockDrawing=false;
let unlockPattern=[];


function unlockPoint(event){

const rect=
$("patternArea").getBoundingClientRect();

return{
x:event.clientX-rect.left,
y:event.clientY-rect.top
};

}


function findUnlockDot(event){

const p=unlockPoint(event);

for(let i=0;i<9;i++){

const d=positions[i];

if(
Math.hypot(
p.x-d[0],
p.y-d[1]
)<38
){
return i;
}

}

return -1;

}


function drawUnlockPattern(x,y){

const canvas=$("patternCanvas");
const ctx=canvas.getContext("2d");

ctx.clearRect(0,0,270,270);

if(!unlockPattern.length)return;

ctx.beginPath();

unlockPattern.forEach((n,i)=>{

const p=positions[n];

if(i===0){
ctx.moveTo(p[0],p[1]);
}
else{
ctx.lineTo(p[0],p[1]);
}

});

if(unlockDrawing){
ctx.lineTo(x,y);
}

ctx.strokeStyle="#2196f3";
ctx.lineWidth=7;
ctx.lineCap="round";
ctx.stroke();

}


function clearUnlockPattern(){

unlockPattern=[];
unlockDrawing=false;

$("patternCanvas")
.getContext("2d")
.clearRect(0,0,270,270);

$("patternDots")
.querySelectorAll(".patternDot")
.forEach(dot=>{
dot.classList.remove("active");
});

}


function unlockStart(event){

event.preventDefault();

unlockDrawing=true;
unlockPattern=[];

$("patternDots")
.querySelectorAll(".patternDot")
.forEach(dot=>{
dot.classList.remove("active");
});

const number=findUnlockDot(event);

if(number!==-1){

unlockPattern.push(number);

$("patternDots")
.querySelector(
'.patternDot[data-number="'+number+'"]'
).classList.add("active");

}

$("patternDots")
.setPointerCapture(event.pointerId);

}


function unlockMove(event){

if(!unlockDrawing)return;

event.preventDefault();

const p=unlockPoint(event);
const number=findUnlockDot(event);

if(
number!==-1 &&
!unlockPattern.includes(number)
){

unlockPattern.push(number);

$("patternDots")
.querySelector(
'.patternDot[data-number="'+number+'"]'
).classList.add("active");

}

drawUnlockPattern(p.x,p.y);

}


function unlockEnd(event){

if(!unlockDrawing)return;

event.preventDefault();

unlockDrawing=false;

const entered=unlockPattern.join("");

const saved=
localStorage.getItem("phonePattern");

$("patternCanvas")
.getContext("2d")
.clearRect(0,0,270,270);

if(entered===saved){

$("lockScreen").style.display="none";

toast("잠금 해제");

}
else{

toast("패턴이 틀렸습니다.");

}

setTimeout(clearUnlockPattern,100);

}


/* 잠금 패턴 이벤트 */

$("patternDots").addEventListener(
"pointerdown",
unlockStart
);

$("patternDots").addEventListener(
"pointermove",
unlockMove
);

$("patternDots").addEventListener(
"pointerup",
unlockEnd
);

$("patternDots").addEventListener(
"pointercancel",
unlockEnd
);


/* ---------------- 새 패턴 설정창 ---------------- */

let setupDrawing=false;


function setupPoint(event){

const rect=
$("setupPatternArea").getBoundingClientRect();

return{
x:event.clientX-rect.left,
y:event.clientY-rect.top
};

}


function findSetupDot(event){

const p=setupPoint(event);

for(let i=0;i<9;i++){

const d=positions[i];

if(
Math.hypot(
p.x-d[0],
p.y-d[1]
)<38
){
return i;
}

}

return -1;

}


function drawSetupPattern(x,y){

const canvas=$("setupPatternCanvas");
const ctx=canvas.getContext("2d");

ctx.clearRect(0,0,270,270);

if(!setupPattern.length)return;

ctx.beginPath();

setupPattern.forEach((n,i)=>{

const p=positions[n];

if(i===0){
ctx.moveTo(p[0],p[1]);
}
else{
ctx.lineTo(p[0],p[1]);
}

});

if(setupDrawing){
ctx.lineTo(x,y);
}

ctx.strokeStyle="#2196f3";
ctx.lineWidth=7;
ctx.lineCap="round";
ctx.stroke();

}


function clearSetupPattern(){

setupPattern=[];
setupDrawing=false;

$("setupPatternCanvas")
.getContext("2d")
.clearRect(0,0,270,270);

$("setupPatternDots")
.querySelectorAll(".patternDot")
.forEach(dot=>{
dot.classList.remove("active");
});

}


function setupStart(event){

event.preventDefault();

setupDrawing=true;
setupPattern=[];

$("setupPatternDots")
.querySelectorAll(".patternDot")
.forEach(dot=>{
dot.classList.remove("active");
});

const number=findSetupDot(event);

if(number!==-1){

setupPattern.push(number);

$("setupPatternDots")
.querySelector(
'.patternDot[data-number="'+number+'"]'
).classList.add("active");

}

$("setupPatternDots")
.setPointerCapture(event.pointerId);

}


function setupMove(event){

if(!setupDrawing)return;

event.preventDefault();

const p=setupPoint(event);
const number=findSetupDot(event);

if(
number!==-1 &&
!setupPattern.includes(number)
){

setupPattern.push(number);

$("setupPatternDots")
.querySelector(
'.patternDot[data-number="'+number+'"]'
).classList.add("active");

}

drawSetupPattern(p.x,p.y);

}


function setupEnd(event){

if(!setupDrawing)return;

event.preventDefault();

setupDrawing=false;

drawSetupPattern(
setupPoint(event).x,
setupPoint(event).y
);

}


$("setupPatternDots").addEventListener(
"pointerdown",
setupStart
);

$("setupPatternDots").addEventListener(
"pointermove",
setupMove
);

$("setupPatternDots").addEventListener(
"pointerup",
setupEnd
);

$("setupPatternDots").addEventListener(
"pointercancel",
setupEnd
);


/* ---------------- 배경 ---------------- */

function changeBackground(){

const choice=
prompt(
"배경을 선택하세요.\n\n"+
"1 = 기본\n"+
"2 = 검정\n"+
"3 = 파랑\n"+
"4 = 초록"
);

const backgrounds={
"1":"#f4f4f4",
"2":"#222",
"3":"#b9d9ff",
"4":"#c9f5d0"
};

if(!backgrounds[choice])return;

$("screen").style.background=
backgrounds[choice];

localStorage.setItem(
"phoneBackground",
backgrounds[choice]
);

}

const savedBackground=
localStorage.getItem("phoneBackground");

if(savedBackground){

$("screen").style.background=
savedBackground;

}


/* ---------------- 빠른 설정 ---------------- */

function showQuick(){

if(!powered)return;

if($("lockScreen").style.display!=="none"){
return;
}

$("quickPanel").style.display="block";

}


function hideQuick(){

$("quickPanel").style.display="none";

}


function toggleWifi(){

wifi=!wifi;

$("wifiButton").innerHTML=
"📶 Wi-Fi<br>"+(wifi?"ON":"OFF");

}


function toggleAirplane(){

airplane=!airplane;

$("airButton").innerHTML=
"✈️ 비행기<br>"+(airplane?"ON":"OFF");

}


function toggleSound(){

sound=!sound;

$("soundButton").textContent=
sound?"🔊 소리":"🔇 무음";

}


function toggleVibration(){

vibration=!vibration;

$("vibrationButton").textContent=
vibration?"📳 진동 ON":"📳 진동 OFF";

if(vibration&&navigator.vibrate){

navigator.vibrate(150);

}

}


$("brightness").addEventListener(
"input",
function(){

$("screen").style.filter=
"brightness("+this.value+"%)";

}
);


/* ---------------- 손전등 ---------------- */

async function toggleFlash(){

if(flashlightStream){

flashlightStream
.getTracks()
.forEach(track=>track.stop());

flashlightStream=null;

$("flashButton").textContent=
"🔦 손전등 OFF";

return;

}

try{

const stream=
await navigator.mediaDevices.getUserMedia({
video:{
facingMode:{
ideal:"environment"
}
}
});

const track=
stream.getVideoTracks()[0];

const capabilities=
track.getCapabilities
?track.getCapabilities()
:{};

if(!capabilities.torch){

track.stop();

toast(
"이 기기에서는 실제 손전등을 지원하지 않습니다."
);

return;

}

await track.applyConstraints({
advanced:[
{torch:true}
]
});

flashlightStream=stream;

$("flashButton").textContent=
"🔦 손전등 ON";

}
catch(e){

toast("손전등을 사용할 수 없습니다.");

}

}


/* ---------------- 전원 ---------------- */

function powerToggle(){

if(powered){

powered=false;

hideQuick();
stopCamera();

if(flashlightStream){

flashlightStream
.getTracks()
.forEach(track=>track.stop());

flashlightStream=null;

}

$("powerOff").style.display="block";

}
else{

powered=true;

$("powerOff").style.display="none";

showLockScreen();

}

}


/* ---------------- 스와이프 ---------------- */

$("phone").addEventListener(
"touchstart",
function(event){

if(!powered)return;

touchStartY=
event.touches[0].clientY;

},
{passive:true}
);


$("phone").addEventListener(
"touchend",
function(event){

if(!powered)return;

const endY=
event.changedTouches[0].clientY;

if(
endY-touchStartY>70 &&
touchStartY<90
){

showQuick();

}

},
{passive:true}
);


/* 초기 상태 */

updateLockInfo();