let powered = true;
let currentPage = null;
let cameraStream = null;
let flashlightStream = null;

let wifi = true;
let airplane = false;
let sound = true;
let vibration = false;

let quickOpen = false;
let touchStartY = 0;


/* ---------------- 기본 ---------------- */

function $(id) {
  return document.getElementById(id);
}


function toast(message) {
  const t = $("toast");

  t.textContent = message;
  t.style.display = "block";

  clearTimeout(window.toastTimer);

  window.toastTimer = setTimeout(() => {
    t.style.display = "none";
  }, 1800);
}


/* ---------------- 시간 ---------------- */

function updateTime() {
  const now = new Date();

  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");

  $("statusTime").textContent = h + ":" + m;
  $("bigTime").textContent = h + ":" + m;
  $("clockBig").textContent = h + ":" + m + ":" + s;

  $("dateText").textContent =
    now.getFullYear() + "년 " +
    (now.getMonth() + 1) + "월 " +
    now.getDate() + "일";
}

setInterval(updateTime, 1000);
updateTime();


/* ---------------- 앱 ---------------- */

const appNames = {
  phonePage: "전화",
  cameraPage: "카메라",
  galleryPage: "갤러리",
  memoPage: "메모",
  clockPage: "시계",
  settingsPage: "설정",
  recentPage: "최근 앱"
};


function openApp(id, name) {
  if (!powered) return;

  document.querySelectorAll(".page").forEach(page => {
    page.style.display = "none";
  });

  $("home").style.display = "none";
  $(id).style.display = "block";

  currentPage = id;

  let recent =
    JSON.parse(localStorage.getItem("recentApps") || "[]");

  recent = [
    id,
    ...recent.filter(x => x !== id)
  ].slice(0, 8);

  localStorage.setItem(
    "recentApps",
    JSON.stringify(recent)
  );

  if (id === "cameraPage") {
    startCamera();
  }

  if (id === "galleryPage") {
    loadGallery();
  }

  if (id === "memoPage") {
    $("memo").value =
      localStorage.getItem("phoneMemo") || "";
  }

  if (id === "recentPage") {
    loadRecent();
  }
}


function goHome() {
  stopCamera();

  document.querySelectorAll(".page").forEach(page => {
    page.style.display = "none";
  });

  $("home").style.display = "block";

  currentPage = null;
}


function goBack() {
  if (currentPage) {
    goHome();
  }
}


/* ---------------- 전화 ---------------- */

function callNumber() {
  const number = $("phoneNumber").value.trim();

  if (!number) {
    toast("전화번호를 입력하세요.");
    return;
  }

  toast(number + "로 전화합니다.");
}


/* ---------------- 카메라 ---------------- */

async function startCamera() {

  try {

    if (!navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia) {

      toast("이 브라우저에서는 카메라를 사용할 수 없습니다.");
      return;
    }

    cameraStream =
      await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: "environment"
          }
        },
        audio: false
      });

    $("camera").srcObject = cameraStream;

  } catch (error) {

    toast("카메라 사용 권한을 허용해주세요.");

  }
}


function stopCamera() {

  if (!cameraStream) return;

  cameraStream.getTracks().forEach(track => {
    track.stop();
  });

  cameraStream = null;
  $("camera").srcObject = null;
}


function closeCamera() {
  stopCamera();
  goHome();
}


function takePhoto() {

  if (!cameraStream) {
    toast("카메라가 켜져 있지 않습니다.");
    return;
  }

  const video = $("camera");
  const canvas = $("photoCanvas");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const context = canvas.getContext("2d");

  context.drawImage(
    video,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const image =
    canvas.toDataURL("image/jpeg", 0.8);

  let photos =
    JSON.parse(localStorage.getItem("phoneGallery") || "[]");

  photos.unshift(image);

  photos = photos.slice(0, 30);

  localStorage.setItem(
    "phoneGallery",
    JSON.stringify(photos)
  );

  toast("사진이 저장되었습니다.");
}


/* ---------------- 갤러리 ---------------- */

function loadGallery() {

  const photos =
    JSON.parse(localStorage.getItem("phoneGallery") || "[]");

  const gallery = $("gallery");

  if (!photos.length) {
    gallery.innerHTML = "<p>사진이 없습니다.</p>";
    return;
  }

  gallery.innerHTML = photos.map(photo => {

    return `
      <img
        class="galleryImage"
        src="${photo}"
      >
    `;

  }).join("");
}


function clearGallery() {

  if (!confirm("사진을 모두 삭제할까요?")) {
    return;
  }

  localStorage.removeItem("phoneGallery");

  loadGallery();

  toast("사진을 삭제했습니다.");
}


/* ---------------- 메모 ---------------- */

function saveMemo() {

  localStorage.setItem(
    "phoneMemo",
    $("memo").value
  );

  toast("메모가 저장되었습니다.");
}


/* ---------------- 최근 앱 ---------------- */

function loadRecent() {

  const list = $("recentList");

  const recent =
    JSON.parse(localStorage.getItem("recentApps") || "[]");

  if (!recent.length) {
    list.innerHTML = "<p>최근 앱이 없습니다.</p>";
    return;
  }

  list.innerHTML = recent.map(id => {

    return `
      <button
        class="recentItem"
        onclick="openApp('${id}','${appNames[id]}')"
      >
        ${appNames[id] || id}
      </button>
    `;

  }).join("");
}


/* ---------------- 설정 ---------------- */

function setLock() {

  const type =
    prompt(
      "잠금 방식을 선택하세요.\n\n1 = 숫자 PIN\n2 = 패턴"
    );

  if (type === "1") {

    const pin =
      prompt("4자리 숫자 PIN을 입력하세요.");

    if (!/^\d{4}$/.test(pin)) {
      toast("4자리 숫자만 입력하세요.");
      return;
    }

    localStorage.setItem("lockType", "pin");
    localStorage.setItem("phonePin", pin);

    toast("PIN이 설정되었습니다.");
  }

  else if (type === "2") {

    const pattern =
      prompt(
        "패턴 순서를 입력하세요.\n" +
        "예: 01258\n" +
        "0~8 중 4개 이상"
      );

    if (
      !/^[0-8]+$/.test(pattern) ||
      pattern.length < 4 ||
      new Set(pattern).size < 4
    ) {
      toast("올바른 패턴이 아닙니다.");
      return;
    }

    localStorage.setItem(
      "lockType",
      "pattern"
    );

    localStorage.setItem(
      "phonePattern",
      pattern
    );

    toast("패턴이 설정되었습니다.");
  }

  updateLockInfo();
}


function updateLockInfo() {

  const type =
    localStorage.getItem("lockType") || "pin";

  $("lockInfo").textContent =
    type === "pattern"
      ? "패턴 잠금"
      : "숫자 PIN";
}


function changeBackground() {

  const choice =
    prompt(
      "배경을 선택하세요.\n\n" +
      "1 = 기본\n" +
      "2 = 검정\n" +
      "3 = 파랑\n" +
      "4 = 초록"
    );

  const backgrounds = {
    "1": "#f4f4f4",
    "2": "#222",
    "3": "#b9d9ff",
    "4": "#c9f5d0"
  };

  if (!backgrounds[choice]) return;

  $("screen").style.background =
    backgrounds[choice];

  localStorage.setItem(
    "phoneBackground",
    backgrounds[choice]
  );
}


/* ---------------- 빠른 설정 ---------------- */

function showQuick() {

  if (!powered) return;

  if ($("lockScreen").style.display !== "none") {
    return;
  }

  $("quickPanel").style.display = "block";
  quickOpen = true;
}


function hideQuick() {

  $("quickPanel").style.display = "none";
  quickOpen = false;
}


function toggleWifi() {

  wifi = !wifi;

  $("wifiButton").innerHTML =
    "📶 Wi-Fi<br>" +
    (wifi ? "ON" : "OFF");
}


function toggleAirplane() {

  airplane = !airplane;

  $("airButton").innerHTML =
    "✈️ 비행기<br>" +
    (airplane ? "ON" : "OFF");
}


function toggleSound() {

  sound = !sound;

  $("soundButton").textContent =
    sound ? "🔊 소리" : "🔇 무음";
}


function toggleVibration() {

  vibration = !vibration;

  $("vibrationButton").textContent =
    vibration
      ? "📳 진동 ON"
      : "📳 진동 OFF";

  if (
    vibration &&
    navigator.vibrate
  ) {
    navigator.vibrate(150);
  }
}


$("brightness").addEventListener(
  "input",
  function () {

    $("screen").style.filter =
      "brightness(" + this.value + "%)";

  }
);


/* ---------------- 손전등 ---------------- */

async function toggleFlash() {

  if (flashlightStream) {

    flashlightStream
      .getTracks()
      .forEach(track => track.stop());

    flashlightStream = null;

    $("flashButton").textContent =
      "🔦 손전등 OFF";

    return;
  }


  try {

    const stream =
      await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: "environment"
          }
        }
      });

    const track =
      stream.getVideoTracks()[0];

    const capabilities =
      track.getCapabilities
        ? track.getCapabilities()
        : {};

    if (!capabilities.torch) {

      track.stop();

      toast(
        "이 기기에서는 실제 손전등을 지원하지 않습니다."
      );

      return;
    }

    await track.applyConstraints({
      advanced: [
        {
          torch: true
        }
      ]
    });

    flashlightStream = stream;

    $("flashButton").textContent =
      "🔦 손전등 ON";

  }

  catch (error) {

    toast("손전등을 사용할 수 없습니다.");

  }
}


/* ---------------- 전원 ---------------- */

function powerToggle() {

  if (powered) {

    powered = false;

    hideQuick();
    stopCamera();

    if (flashlightStream) {

      flashlightStream
        .getTracks()
        .forEach(track => track.stop());

      flashlightStream = null;
    }

    $("powerOff").style.display =
      "block";

  }

  else {

    powered = true;

    $("powerOff").style.display =
      "none";

    showLockScreen();
  }
}


/* ---------------- 잠금 ---------------- */

function showLockScreen() {

  $("lockScreen").style.display =
    "block";

  const type =
    localStorage.getItem("lockType") || "pin";

  if (type === "pattern") {

    $("pinArea").style.display =
      "none";

    $("patternArea").style.display =
      "block";

  }

  else {

    $("pinArea").style.display =
      "block";

    $("patternArea").style.display =
      "none";
  }
}


function unlockPin() {

  const input =
    $("pinInput").value;

  const saved =
    localStorage.getItem("phonePin") || "1234";

  if (input === saved) {

    $("lockScreen").style.display =
      "none";

    $("pinInput").value = "";

    toast("잠금 해제");

  }

  else {

    toast("PIN이 틀렸습니다.");

    $("pinInput").value = "";
  }
}


/* ---------------- 패턴 드래그 ---------------- */

const patternCanvas =
  $("patternCanvas");

const patternContext =
  patternCanvas.getContext("2d");

let patternDrawing = false;
let enteredPattern = [];

const dotPositions = [
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


function getPatternPoint(event) {

  const rect =
    $("patternArea").getBoundingClientRect();

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}


function findPatternDot(event) {

  const point =
    getPatternPoint(event);

  for (let i = 0; i < 9; i++) {

    const dot =
      dotPositions[i];

    const distance =
      Math.hypot(
        point.x - dot[0],
        point.y - dot[1]
      );

    if (distance < 35) {
      return i;
    }
  }

  return -1;
}


function drawPattern(x, y) {

  patternContext.clearRect(
    0,
    0,
    270,
    270
  );

  if (!enteredPattern.length) {
    return;
  }

  patternContext.beginPath();

  enteredPattern.forEach(
    (number, index) => {

      const point =
        dotPositions[number];

      if (index === 0) {
        patternContext.moveTo(
          point[0],
          point[1]
        );
      }
      else {
        patternContext.lineTo(
          point[0],
          point[1]
        );
      }

    }
  );

  if (patternDrawing) {
    patternContext.lineTo(x, y);
  }

  patternContext.strokeStyle =
    "#2196f3";

  patternContext.lineWidth = 7;
  patternContext.lineCap = "round";
  patternContext.stroke();
}


$("patternDots").addEventListener(
  "pointerdown",
  function(event) {

    patternDrawing = true;
    enteredPattern = [];

    document
      .querySelectorAll(".patternDot")
      .forEach(dot =>
        dot.classList.remove("active")
      );

    const number =
      findPatternDot(event);

    if (number !== -1) {

      enteredPattern.push(number);

      document
        .querySelector(
          '.patternDot[data-number="' +
          number +
          '"]'
        )
        .classList.add("active");
    }

    $("patternDots")
      .setPointerCapture(event.pointerId);
  }
);


$("patternDots").addEventListener(
  "pointermove",
  function(event) {

    if (!patternDrawing) return;

    const point =
      getPatternPoint(event);

    const number =
      findPatternDot(event);

    if (
      number !== -1 &&
      !enteredPattern.includes(number)
    ) {

      enteredPattern.push(number);

      document
        .querySelector(
          '.patternDot[data-number="' +
          number +
          '"]'
        )
        .classList.add("active");
    }

    drawPattern(
      point.x,
      point.y
    );
  }
);


$("patternDots").addEventListener(
  "pointerup",
  function() {

    if (!patternDrawing) return;

    patternDrawing = false;

    const entered =
      enteredPattern.join("");

    const saved =
      localStorage.getItem("phonePattern") ||
      "01258";

    patternContext.clearRect(
      0,
      0,
      270,
      270
    );

    if (entered === saved) {

      $("lockScreen").style.display =
        "none";

      toast("잠금 해제");

    }
    else {

      toast("패턴이 틀렸습니다.");

    }

    enteredPattern = [];

    document
      .querySelectorAll(".patternDot")
      .forEach(dot =>
        dot.classList.remove("active")
      );
  }
);


/* ---------------- 위에서 아래로 스와이프 ---------------- */

$("phone").addEventListener(
  "touchstart",
  function(event) {

    if (!powered) return;

    touchStartY =
      event.touches[0].clientY;
  },
  { passive: true }
);


$("phone").addEventListener(
  "touchend",
  function(event) {

    if (!powered) return;

    const endY =
      event.changedTouches[0].clientY;

    const distance =
      endY - touchStartY;

    if (
      distance > 70 &&
      touchStartY < 90
    ) {

      showQuick();
    }
  },
  { passive: true }
);


/* ---------------- 초기화 ---------------- */

const savedBackground =
  localStorage.getItem("phoneBackground");

if (savedBackground) {

  $("screen").style.background =
    savedBackground;
}

updateLockInfo();
