/* =========================================
   Mini Smartphone
========================================= */

const $ = (id) => document.getElementById(id);

const STORAGE = {
  lockType: "mini_lock_type",
  lockValue: "mini_lock_value",
  photos: "mini_photos",
  memos: "mini_memos",
  recent: "mini_recent",
  background: "mini_background",
  sound: "mini_sound"
};

const state = {
  currentPage: "homePage",
  currentMemo: null,
  currentPhoto: null,

  stream: null,

  sound: localStorage.getItem(STORAGE.sound) || "sound",

  wifi: true,
  airplane: false,
  flashlight: false,

  isPoweredOff: false
};


/* =========================================
   기본 함수
========================================= */

function showPage(pageId) {

  document.querySelectorAll(".page").forEach(page => {
    page.classList.add("hidden");
  });

  const page = $(pageId);

  if (page) {
    page.classList.remove("hidden");
    state.currentPage = pageId;
  }

  if (pageId !== "recentPage" && pageId !== "homePage") {
    saveRecent(pageId);
  }
}


function vibrate() {

  if (state.sound === "silent") {
    return;
  }

  if ("vibrate" in navigator) {
    navigator.vibrate(15);
  }
}


function getLockType() {
  return localStorage.getItem(STORAGE.lockType);
}


function getLockValue() {
  return localStorage.getItem(STORAGE.lockValue);
}


/* =========================================
   시계
========================================= */

function updateClock() {

  const now = new Date();

  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");

  const time = `${h}:${m}`;
  const fullTime = `${h}:${m}:${s}`;

  const date = now.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  });

  $("statusTime").textContent = time;

  $("homeClock").textContent = time;
  $("homeDate").textContent = date;

  $("lockTime").textContent = time;
  $("lockDate").textContent = date;

  $("bigClock").textContent = fullTime;
  $("bigDate").textContent = date;
}

setInterval(updateClock, 1000);
updateClock();


/* =========================================
   홈 앱
========================================= */

document.querySelectorAll(".appIcon").forEach(button => {

  button.addEventListener("click", () => {

    vibrate();

    const app = button.dataset.app;

    if (app === "phone") showPage("phonePage");
    if (app === "camera") showPage("cameraPage");
    if (app === "gallery") {
      showPage("galleryPage");
      renderGallery();
    }
    if (app === "memo") {
      showPage("memoPage");
      renderMemos();
    }
    if (app === "clock") showPage("clockPage");
    if (app === "settings") {
      showPage("settingsPage");
      updateLockStatus();
    }

  });

});


/* =========================================
   앱 뒤로가기
========================================= */

document.querySelectorAll(".backApp").forEach(button => {

  button.addEventListener("click", () => {

    vibrate();
    showPage("homePage");

  });

});


/* =========================================
   하단 네비게이션
========================================= */

$("homeNav").addEventListener("click", () => {

  vibrate();
  showPage("homePage");

});


$("recentNav").addEventListener("click", () => {

  vibrate();

  renderRecent();
  showPage("recentPage");

});


$("backNav").addEventListener("click", () => {

  vibrate();

  if (state.currentPage !== "homePage") {
    showPage("homePage");
  }

});


/* =========================================
   최근 앱
========================================= */

function saveRecent(pageId) {

  if (pageId === "homePage" || pageId === "recentPage") {
    return;
  }

  let recent = JSON.parse(
    localStorage.getItem(STORAGE.recent) || "[]"
  );

  recent = recent.filter(item => item !== pageId);

  recent.unshift(pageId);

  recent = recent.slice(0, 8);

  localStorage.setItem(
    STORAGE.recent,
    JSON.stringify(recent)
  );
}


function pageName(pageId) {

  const names = {
    phonePage: "전화",
    cameraPage: "카메라",
    galleryPage: "갤러리",
    memoPage: "메모",
    clockPage: "시계",
    settingsPage: "설정"
  };

  return names[pageId] || "앱";
}


function renderRecent() {

  const box = $("recentList");

  box.innerHTML = "";

  const recent = JSON.parse(
    localStorage.getItem(STORAGE.recent) || "[]"
  );

  if (recent.length === 0) {

    box.innerHTML = `
      <div class="recentCard">
        최근 사용한 앱이 없습니다.
      </div>
    `;

    return;
  }

  recent.forEach(pageId => {

    const card = document.createElement("div");

    card.className = "recentCard";

    card.innerHTML = `
      <strong>${pageName(pageId)}</strong>
      <br>
      <button>열기</button>
    `;

    card.querySelector("button").addEventListener("click", () => {

      vibrate();
      showPage(pageId);

      if (pageId === "galleryPage") renderGallery();
      if (pageId === "memoPage") renderMemos();

    });

    box.appendChild(card);

  });

}


$("clearRecent").addEventListener("click", () => {

  vibrate();

  localStorage.removeItem(STORAGE.recent);

  renderRecent();

});


/* =========================================
   전화
========================================= */

$("callButton").addEventListener("click", () => {

  vibrate();

  const number = $("phoneNumber").value.trim();

  if (!number) {

    $("callResult").textContent =
      "전화번호를 입력하세요.";

    return;
  }

  $("callResult").textContent =
    `${number}로 전화 거는 중...`;

});


/* =========================================
   카메라
========================================= */

$("startCamera").addEventListener("click", async () => {

  vibrate();

  try {

    if (state.stream) {
      state.stream.getTracks().forEach(track => track.stop());
    }

    state.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: {
          ideal: "environment"
        }
      },
      audio: false
    });

    $("cameraVideo").srcObject = state.stream;

  } catch (error) {

    alert("카메라를 사용할 수 없습니다.\n카메라 권한을 확인하세요.");

  }

});


$("stopCamera").addEventListener("click", () => {

  vibrate();

  stopCamera();

});


function stopCamera() {

  if (state.stream) {

    state.stream.getTracks().forEach(track => track.stop());

    state.stream = null;

  }

  $("cameraVideo").srcObject = null;

}


/* =========================================
   사진 촬영
========================================= */

$("takePhoto").addEventListener("click", () => {

  vibrate();

  const video = $("cameraVideo");
  const canvas = $("photoCanvas");

  if (!state.stream || video.readyState < 2) {

    alert("먼저 카메라를 켜주세요.");

    return;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");

  ctx.drawImage(
    video,
    0,
    0,
    canvas.width,
    canvas.height
  );

  const image = canvas.toDataURL("image/jpeg", 0.85);

  let photos = JSON.parse(
    localStorage.getItem(STORAGE.photos) || "[]"
  );

  photos.unshift({
    id: Date.now(),
    image: image
  });

  localStorage.setItem(
    STORAGE.photos,
    JSON.stringify(photos)
  );

  alert("사진이 저장되었습니다.");

});


/* =========================================
   갤러리
========================================= */

function renderGallery() {

  const grid = $("galleryGrid");

  grid.innerHTML = "";

  const photos = JSON.parse(
    localStorage.getItem(STORAGE.photos) || "[]"
  );

  if (photos.length === 0) {

    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;color:#aaa;padding:30px">
        저장된 사진이 없습니다.
      </div>
    `;

    return;
  }

  photos.forEach(photo => {

    const item = document.createElement("div");

    item.className = "galleryItem";

    item.innerHTML = `
      <img src="${photo.image}">
      <button class="galleryDelete">×</button>
    `;

    item.querySelector("img").addEventListener("click", () => {

      vibrate();

      state.currentPhoto = photo.id;

      $("viewerImage").src = photo.image;
      $("photoViewer").classList.remove("hidden");

    });

    item.querySelector(".galleryDelete").addEventListener("click", event => {

      event.stopPropagation();

      vibrate();

      deletePhoto(photo.id);

    });

    grid.appendChild(item);

  });

}


function deletePhoto(id) {

  let photos = JSON.parse(
    localStorage.getItem(STORAGE.photos) || "[]"
  );

  photos = photos.filter(photo => photo.id !== id);

  localStorage.setItem(
    STORAGE.photos,
    JSON.stringify(photos)
  );

  renderGallery();

}


$("deleteAllPhotos").addEventListener("click", () => {

  vibrate();

  if (!confirm("모든 사진을 삭제할까요?")) {
    return;
  }

  localStorage.removeItem(STORAGE.photos);

  renderGallery();

});


$("closePhotoViewer").addEventListener("click", () => {

  vibrate();

  $("photoViewer").classList.add("hidden");

});


$("deleteCurrentPhoto").addEventListener("click", () => {

  vibrate();

  deletePhoto(state.currentPhoto);

  $("photoViewer").classList.add("hidden");

});


/* =========================================
   메모
========================================= */

function renderMemos() {

  const list = $("memoList");

  list.innerHTML = "";

  const memos = JSON.parse(
    localStorage.getItem(STORAGE.memos) || "[]"
  );

  if (memos.length === 0) {

    list.innerHTML = `
      <div class="memoCard">
        저장된 메모가 없습니다.
      </div>
    `;

    return;
  }

  memos.forEach(memo => {

    const card = document.createElement("div");

    card.className = "memoCard";

    card.innerHTML = `
      <h3>${escapeHTML(memo.title || "제목 없음")}</h3>
      <p>${escapeHTML(memo.content || "")}</p>
    `;

    card.addEventListener("click", () => {

      vibrate();

      state.currentMemo = memo.id;

      $("memoTitle").value = memo.title || "";
      $("memoContent").value = memo.content || "";

      showPage("memoEditPage");

    });

    list.appendChild(card);

  });

}


$("newMemoButton").addEventListener("click", () => {

  vibrate();

  state.currentMemo = null;

  $("memoTitle").value = "";
  $("memoContent").value = "";

  showPage("memoEditPage");

});


$("memoEditBack").addEventListener("click", () => {

  vibrate();

  showPage("memoPage");
  renderMemos();

});


$("saveMemo").addEventListener("click", () => {

  vibrate();

  const title = $("memoTitle").value.trim();
  const content = $("memoContent").value.trim();

  let memos = JSON.parse(
    localStorage.getItem(STORAGE.memos) || "[]"
  );

  if (state.currentMemo === null) {

    memos.unshift({
      id: Date.now(),
      title: title,
      content: content
    });

  } else {

    const index = memos.findIndex(
      memo => memo.id === state.currentMemo
    );

    if (index !== -1) {

      memos[index].title = title;
      memos[index].content = content;

    }

  }

  localStorage.setItem(
    STORAGE.memos,
    JSON.stringify(memos)
  );

  showPage("memoPage");

  renderMemos();

});


$("deleteMemo").addEventListener("click", () => {

  vibrate();

  if (state.currentMemo === null) {
    showPage("memoPage");
    return;
  }

  let memos = JSON.parse(
    localStorage.getItem(STORAGE.memos) || "[]"
  );

  memos = memos.filter(
    memo => memo.id !== state.currentMemo
  );

  localStorage.setItem(
    STORAGE.memos,
    JSON.stringify(memos)
  );

  state.currentMemo = null;

  showPage("memoPage");

  renderMemos();

});


function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* =========================================
   설정 - 잠금 상태
========================================= */

function updateLockStatus() {

  const type = getLockType();

  if (!type) {

    $("lockStatus").textContent = "잠금 없음";

  } else if (type === "pin") {

    $("lockStatus").textContent = "PIN 잠금 사용 중";

  } else if (type === "pattern") {

    $("lockStatus").textContent = "패턴 잠금 사용 중";

  }

}


/* =========================================
   PIN 설정
========================================= */

$("setPin").addEventListener("click", () => {

  vibrate();

  if (getLockType()) {

    beginVerifyLock("pin");

  } else {

    openPinSetup();

  }

});


function openPinSetup() {

  $("pinSetupTitle").textContent = "PIN 설정";
  $("pinSetupDescription").textContent =
    "4~6자리 PIN을 입력하세요.";

  $("setupPinInput").value = "";
  $("setupPinConfirm").value = "";

  $("pinSetupOverlay").classList.remove("hidden");

}


$("confirmPinSetup").addEventListener("click", () => {

  vibrate();

  const pin = $("setupPinInput").value;
  const confirmPin = $("setupPinConfirm").value;

  if (!/^\d{4,6}$/.test(pin)) {

    alert("PIN은 숫자 4~6자리여야 합니다.");

    return;
  }

  if (pin !== confirmPin) {

    alert("PIN이 서로 다릅니다.");

    return;
  }

  localStorage.setItem(STORAGE.lockType, "pin");
  localStorage.setItem(STORAGE.lockValue, pin);

  $("pinSetupOverlay").classList.add("hidden");

  updateLockStatus();

  alert("PIN 잠금이 설정되었습니다.");

});


/* =========================================
   패턴 설정
========================================= */

$("setPattern").addEventListener("click", () => {

  vibrate();

  if (getLockType()) {

    beginVerifyLock("pattern");

  } else {

    openPatternSetup();

  }

});


function openPatternSetup() {

  patternSetup.reset();

  $("patternSetupOverlay").classList.remove("hidden");

}


/* =========================================
   잠금 해제
========================================= */

$("unlockPinButton").addEventListener("click", verifyPinUnlock);

$("unlockPin").addEventListener("keydown", event => {

  if (event.key === "Enter") {
    verifyPinUnlock();
  }

});


function verifyPinUnlock() {

  const input = $("unlockPin").value;

  if (input === getLockValue()) {

    unlockPhone();

  } else {

    alert("PIN이 올바르지 않습니다.");

    $("unlockPin").value = "";

  }

}


function unlockPhone() {

  $("lockScreen").classList.add("hidden");

  $("unlockPin").value = "";

}


/* =========================================
   잠금 확인 후 설정 변경
========================================= */

let verifyAction = null;

function beginVerifyLock(action) {

  verifyAction = action;

  const type = getLockType();

  $("verifyPin").value = "";

  if (type === "pin") {

    $("verifyPin").classList.remove("hidden");
    $("verifyBoard").classList.add("hidden");

  } else {

    $("verifyPin").classList.add("hidden");
    $("verifyBoard").classList.remove("hidden");

    verifyPattern.reset();

  }

  $("verifyLockOverlay").classList.remove("hidden");

}


$("verifyLockButton").addEventListener("click", () => {

  vibrate();

  if (getLockType() === "pin") {

    if ($("verifyPin").value === getLockValue()) {

      finishVerifyAction();

    } else {

      alert("현재 PIN이 올바르지 않습니다.");

      $("verifyPin").value = "";

    }

  } else {

    const pattern = verifyPattern.getPattern();

    if (
      pattern &&
      pattern === getLockValue()
    ) {

      finishVerifyAction();

    } else {

      alert("패턴이 올바르지 않습니다.");

      verifyPattern.reset();

    }

  }

});


function finishVerifyAction() {

  $("verifyLockOverlay").classList.add("hidden");

  if (verifyAction === "pin") {
    openPinSetup();
  }

  if (verifyAction === "pattern") {
    openPatternSetup();
  }

  if (verifyAction === "remove") {

    localStorage.removeItem(STORAGE.lockType);
    localStorage.removeItem(STORAGE.lockValue);

    updateLockStatus();

    alert("잠금이 해제되었습니다.");

  }

}


/* =========================================
   잠금 제거
========================================= */

$("removeLock").addEventListener("click", () => {

  vibrate();

  if (!getLockType()) {

    alert("현재 설정된 잠금이 없습니다.");

    return;
  }

  verifyAction = "remove";

  beginVerifyLock("remove");

});


/* =========================================
   패턴 엔진
========================================= */

function createPatternBoard(boardElement) {

  const canvas = boardElement.querySelector("canvas");
  const ctx = canvas.getContext("2d");

  let pattern = [];
  let drawing = false;
  let pointer = { x: 0, y: 0 };

  function resizeCanvas() {

    const rect = boardElement.getBoundingClientRect();

    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;

    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";

    ctx.setTransform(
      devicePixelRatio,
      0,
      0,
      devicePixelRatio,
      0,
      0
    );

    draw();

  }

  function position(event) {

    const rect = boardElement.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

  }

  function getDot(index) {

    return boardElement.querySelector(
      `i[data-index="${index}"]`
    );

  }

  function findDot(x, y) {

    const rect = boardElement.getBoundingClientRect();

    const dots = [...boardElement.querySelectorAll("i")];

    for (const dot of dots) {

      const dotRect = dot.getBoundingClientRect();

      const dx =
        x -
        (dotRect.left - rect.left + dotRect.width / 2);

      const dy =
        y -
        (dotRect.top - rect.top + dotRect.height / 2);

      const distance = Math.sqrt(
        dx * dx + dy * dy
      );

      if (distance < 28) {

        return Number(dot.dataset.index);

      }

    }

    return null;

  }

  function addDot(index) {

    if (index === null) return;

    if (!pattern.includes(index)) {

      pattern.push(index);

      const dot = getDot(index);

      if (dot) {
        dot.classList.add("active");
      }

      draw();

    }

  }

  function draw() {

    ctx.clearRect(
      0,
      0,
      boardElement.clientWidth,
      boardElement.clientHeight
    );

    if (pattern.length === 0) {
      return;
    }

    const rect = boardElement.getBoundingClientRect();

    ctx.beginPath();

    pattern.forEach((index, positionIndex) => {

      const dot = getDot(index);

      if (!dot) return;

      const dotRect = dot.getBoundingClientRect();

      const x =
        dotRect.left -
        rect.left +
        dotRect.width / 2;

      const y =
        dotRect.top -
        rect.top +
        dotRect.height / 2;

      if (positionIndex === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

    });

    if (drawing) {
      ctx.lineTo(pointer.x, pointer.y);
    }

    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#ffffff";

    ctx.stroke();

  }

  function start(event) {

    event.preventDefault();

    drawing = true;

    pattern = [];

    boardElement
      .querySelectorAll("i")
      .forEach(dot => dot.classList.remove("active"));

    pointer = position(event);

    addDot(findDot(pointer.x, pointer.y));

    try {
      boardElement.setPointerCapture(event.pointerId);
    } catch {}

    draw();

  }

  function move(event) {

    if (!drawing) return;

    event.preventDefault();

    pointer = position(event);

    addDot(findDot(pointer.x, pointer.y));

    draw();

  }

  function end() {

    if (!drawing) return;

    drawing = false;

    draw();

  }

  boardElement.addEventListener(
    "pointerdown",
    start
  );

  boardElement.addEventListener(
    "pointermove",
    move
  );

  boardElement.addEventListener(
    "pointerup",
    end
  );

  boardElement.addEventListener(
    "pointercancel",
    end
  );

  window.addEventListener("resize", resizeCanvas);

  setTimeout(resizeCanvas, 100);

  return {

    reset() {

      pattern = [];
      drawing = false;

      boardElement
        .querySelectorAll("i")
        .forEach(dot => dot.classList.remove("active"));

      draw();

    },

    getPattern() {

      if (pattern.length < 4) {
        return null;
      }

      return pattern.join("");

    }

  };

}


const patternSetup =
  createPatternBoard($("setupBoard"));

const verifyPattern =
  createPatternBoard($("verifyBoard"));

const unlockPattern =
  createPatternBoard($("unlockBoard"));


/* =========================================
   패턴 저장
========================================= */

$("confirmPattern").addEventListener("click", () => {

  vibrate();

  const pattern = patternSetup.getPattern();

  if (!pattern) {

    alert("4개 이상의 점을 연결하세요.");

    return;
  }

  localStorage.setItem(
    STORAGE.lockType,
    "pattern"
  );

  localStorage.setItem(
    STORAGE.lockValue,
    pattern
  );

  $("patternSetupOverlay").classList.add("hidden");

  updateLockStatus();

  alert("패턴 잠금이 설정되었습니다.");

});


/* =========================================
   잠금화면 표시
========================================= */

function showLockScreen() {

  const type = getLockType();

  if (!type) {

    $("lockScreen").classList.add("hidden");

    return;

  }

  $("lockScreen").classList.remove("hidden");

  if (type === "pin") {

    $("pinUnlock").classList.remove("hidden");
    $("patternUnlock").classList.add("hidden");

  } else {

    $("pinUnlock").classList.add("hidden");
    $("patternUnlock").classList.remove("hidden");

    unlockPattern.reset();

  }

}


/* =========================================
   패턴 잠금 화면 처리
========================================= */

$("unlockBoard").addEventListener("pointerup", () => {

  setTimeout(() => {

    const pattern = unlockPattern.getPattern();

    if (!pattern) {
      return;
    }

    if (pattern === getLockValue()) {

      unlockPhone();

    } else {

      alert("패턴이 올바르지 않습니다.");

      unlockPattern.reset();

    }

  }, 100);

});


/* =========================================
   배경
========================================= */

document.querySelectorAll("[data-bg]").forEach(button => {

  button.addEventListener("click", () => {

    vibrate();

    setBackground(button.dataset.bg);

  });

});


function setBackground(type) {

  localStorage.setItem(
    STORAGE.background,
    type
  );

  applyBackground(type);

}


function applyBackground(type) {

  const screen = $("screen");

  if (type === "blue") {

    screen.style.background =
      "linear-gradient(160deg,#061b3a,#1261a0)";

  } else if (type === "purple") {

    screen.style.background =
      "linear-gradient(160deg,#210638,#7020a0)";

  } else if (type === "green") {

    screen.style.background =
      "linear-gradient(160deg,#062e20,#14805b)";

  } else {

    screen.style.background =
      "linear-gradient(160deg,#111,#222)";

  }

}


applyBackground(
  localStorage.getItem(STORAGE.background) || "default"
);


/* =========================================
   빠른 설정
========================================= */

const quickPanel = $("quickPanel");

let touchStartY = null;


function openQuickPanel() {

  quickPanel.classList.add("open");

}


function closeQuickPanel() {

  quickPanel.classList.remove("open");

}


$("phone").addEventListener("pointerdown", event => {

  touchStartY = event.clientY;

});


$("phone").addEventListener("pointerup", event => {

  if (touchStartY === null) return;

  const difference =
    event.clientY - touchStartY;

  if (touchStartY < 70 && difference > 60) {

    openQuickPanel();

  }

  if (quickPanel.classList.contains("open") && difference < -60) {

    closeQuickPanel();

  }

  touchStartY = null;

});


/* 밝기 */

$("brightness").addEventListener("input", event => {

  const value = event.target.value;

  $("screen").style.filter =
    `brightness(${value}%)`;

});


/* Wi-Fi */

$("wifiButton").addEventListener("click", () => {

  vibrate();

  state.wifi = !state.wifi;

  $("wifiButton").classList.toggle(
    "active",
    state.wifi
  );

});


/* 비행기 */

$("airplaneButton").addEventListener("click", () => {

  vibrate();

  state.airplane = !state.airplane;

  $("airplaneButton").classList.toggle(
    "active",
    state.airplane
  );

});


/* 소리 */

function updateSoundUI() {

  if (state.sound === "sound") {

    $("soundButton").classList.remove("active");
    $("soundButton").querySelector("span").textContent = "🔊";
    $("soundText").textContent = "소리";

  } else if (state.sound === "silent") {

    $("soundButton").classList.remove("active");
    $("soundButton").querySelector("span").textContent = "🔇";
    $("soundText").textContent = "무음";

  } else {

    $("soundButton").classList.add("active");
    $("soundButton").querySelector("span").textContent = "📳";
    $("soundText").textContent = "진동";

  }

}


$("soundButton").addEventListener("click", () => {

  if (state.sound === "sound") {

    state.sound = "silent";

  } else if (state.sound === "silent") {

    state.sound = "vibrate";

  } else {

    state.sound = "sound";

  }

  localStorage.setItem(
    STORAGE.sound,
    state.sound
  );

  updateSoundUI();

  if (state.sound !== "silent") {

    if ("vibrate" in navigator) {
      navigator.vibrate(15);
    }

  }

});


updateSoundUI();


/* =========================================
   손전등
========================================= */

$("flashButton").addEventListener("click", async () => {

  vibrate();

  if (!navigator.mediaDevices?.getUserMedia) {

    alert("이 브라우저에서는 손전등 기능을 사용할 수 없습니다.");

    return;
  }

  try {

    if (!state.flashlight) {

      if (!state.stream) {

        state.stream =
          await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: {
                ideal: "environment"
              }
            },
            audio: false
          });

      }

      const track =
        state.stream.getVideoTracks()[0];

      const capabilities =
        track.getCapabilities();

      if (!capabilities.torch) {

        alert(
          "현재 기기 또는 브라우저가 실제 손전등 제어를 지원하지 않습니다."
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

      state.flashlight = true;

      $("flashButton").classList.add("active");

    } else {

      const track =
        state.stream?.getVideoTracks()[0];

      if (track) {

        await track.applyConstraints({
          advanced: [
            {
              torch: false
            }
          ]
        });

      }

      state.flashlight = false;

      $("flashButton").classList.remove("active");

    }

  } catch (error) {

    alert(
      "손전등을 제어하지 못했습니다."
    );

  }

});


/* =========================================
   전원
========================================= */

$("powerButton").addEventListener("click", () => {

  vibrate();

  powerOff();

});


function powerOff() {

  state.isPoweredOff = true;

  stopCamera();

  $("quickPanel").classList.remove("open");

  $("powerOffOverlay").classList.remove("hidden");

}


$("powerOnButton").addEventListener("click", () => {

  vibrate();

  state.isPoweredOff = false;

  $("powerOffOverlay").classList.add("hidden");

  showLockScreen();

});


/* =========================================
   초기 실행
========================================= */

updateLockStatus();

showPage("homePage");

showLockScreen();