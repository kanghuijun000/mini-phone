/* =========================================
   Mini Phone
   ========================================= */

const $ = (id) => document.getElementById(id);

const STORAGE = {
  lockType: "mini_lock_type",
  lockValue: "mini_lock_value",
  photos: "mini_photos",
  memos: "mini_memos",
  recent: "mini_recent",
  background: "mini_background",
  sound: "mini_sound",
  brightness: "mini_brightness"
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
   기본
   ========================================= */

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
   페이지
   ========================================= */

function showPage(pageId) {

  document.querySelectorAll(".page").forEach(page => {
    page.classList.add("hidden");
  });

  const page = $(pageId);

  if (!page) {
    return;
  }

  page.classList.remove("hidden");

  state.currentPage = pageId;

  if (
    pageId !== "homePage" &&
    pageId !== "recentPage" &&
    pageId !== "memoEditPage"
  ) {
    saveRecent(pageId);
  }

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

    if (app === "phone") {
      showPage("phonePage");
    }

    if (app === "camera") {
      showPage("cameraPage");
    }

    if (app === "gallery") {
      showPage("galleryPage");
      renderGallery();
    }

    if (app === "memo") {
      showPage("memoPage");
      renderMemos();
    }

    if (app === "clock") {
      showPage("clockPage");
    }

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

function handleNavAction(action) {

  if (state.isPoweredOff) {
    return;
  }

  if (!$("lockScreen").classList.contains("hidden")) {
    return;
  }

  vibrate();

  if (action === "home") {
    showPage("homePage");
    return;
  }

  if (action === "recent") {
    renderRecent();
    showPage("recentPage");
    return;
  }

  if (
    action === "back" &&
    state.currentPage !== "homePage"
  ) {
    showPage("homePage");
  }

}

$("homeNav").addEventListener("click", event => {

  event.stopPropagation();

  handleNavAction("home");

});

$("recentNav").addEventListener("click", event => {

  event.stopPropagation();

  handleNavAction("recent");

});

$("backNav").addEventListener("click", event => {

  event.stopPropagation();

  handleNavAction("back");

});


/* =========================================
   최근 앱
   ========================================= */

function saveRecent(pageId) {

  if (
    pageId === "homePage" ||
    pageId === "recentPage"
  ) {
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


const pageNames = {
  phonePage: "전화",
  cameraPage: "카메라",
  galleryPage: "갤러리",
  memoPage: "메모",
  clockPage: "시계",
  settingsPage: "설정"
};


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
      <strong>${pageNames[pageId] || "앱"}</strong>
      <br>
      <button>열기</button>
    `;

    card.querySelector("button").addEventListener(
      "click",
      () => {

        vibrate();

        showPage(pageId);

        if (pageId === "galleryPage") {
          renderGallery();
        }

        if (pageId === "memoPage") {
          renderMemos();
        }

      }
    );

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

  const number =
    $("phoneNumber").value.trim();

  if (!number) {

    $("callResult").textContent =
      "전화번호를 입력하세요.";

    return;
  }

  const phoneNumber =
    number.replace(/[^0-9+#*]/g, "");

  if (!phoneNumber) {

    $("callResult").textContent =
      "올바른 전화번호를 입력하세요.";

    return;
  }

  $("callResult").textContent =
    `${number}로 전화 연결 중...`;

  window.location.href =
    `tel:${phoneNumber}`;

});


/* =========================================
   카메라
   ========================================= */

$("startCamera").addEventListener(
  "click",
  async () => {

    vibrate();

    try {

      stopCamera();

      state.stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {
              ideal: "environment"
            }
          },
          audio: false
        });

      $("cameraVideo").srcObject =
        state.stream;

    } catch (error) {

      alert(
        "카메라를 사용할 수 없습니다.\n카메라 권한을 확인하세요."
      );

    }

  }
);


$("stopCamera").addEventListener("click", () => {

  vibrate();

  stopCamera();

});


function stopCamera() {

  if (state.stream) {

    state.stream
      .getTracks()
      .forEach(track => track.stop());

    state.stream = null;

  }

  $("cameraVideo").srcObject = null;

  if (state.flashlight) {

    state.flashlight = false;

    $("flashButton").classList.remove("active");

  }

}


/* =========================================
   사진 촬영
   ========================================= */

$("takePhoto").addEventListener("click", () => {

  vibrate();

  const video = $("cameraVideo");
  const canvas = $("photoCanvas");

  if (
    !state.stream ||
    video.readyState < 2
  ) {

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

  const image =
    canvas.toDataURL("image/jpeg", 0.85);

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
      <div style="
        grid-column:1/-1;
        text-align:center;
        color:#aaa;
        padding:30px
      ">
        저장된 사진이 없습니다.
      </div>
    `;

    return;
  }

  photos.forEach(photo => {

    const item =
      document.createElement("div");

    item.className = "galleryItem";

    item.innerHTML = `
      <img>
      <button class="galleryDelete">×</button>
    `;

    item.querySelector("img").src =
      photo.image;

    item.querySelector("img")
      .addEventListener("click", () => {

        vibrate();

        state.currentPhoto =
          photo.id;

        $("viewerImage").src =
          photo.image;

        $("photoViewer")
          .classList
          .remove("hidden");

      });

    item.querySelector(".galleryDelete")
      .addEventListener("click", event => {

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

  photos =
    photos.filter(photo => photo.id !== id);

  localStorage.setItem(
    STORAGE.photos,
    JSON.stringify(photos)
  );

  renderGallery();

}


$("deleteAllPhotos")
  .addEventListener("click", () => {

    vibrate();

    if (!confirm("모든 사진을 삭제할까요?")) {
      return;
    }

    localStorage.removeItem(
      STORAGE.photos
    );

    renderGallery();

  });


$("closePhotoViewer")
  .addEventListener("click", () => {

    vibrate();

    $("photoViewer")
      .classList
      .add("hidden");

  });


$("deleteCurrentPhoto")
  .addEventListener("click", () => {

    vibrate();

    deletePhoto(
      state.currentPhoto
    );

    $("photoViewer")
      .classList
      .add("hidden");

  });


/* =========================================
   메모
   ========================================= */

function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


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

    const card =
      document.createElement("div");

    card.className = "memoCard";

    card.innerHTML = `
      <h3>
        ${escapeHTML(
          memo.title || "제목 없음"
        )}
      </h3>

      <p>
        ${escapeHTML(
          memo.content || ""
        )}
      </p>
    `;

    card.addEventListener("click", () => {

      vibrate();

      state.currentMemo = memo.id;

      $("memoTitle").value =
        memo.title || "";

      $("memoContent").value =
        memo.content || "";

      showPage("memoEditPage");

    });

    list.appendChild(card);

  });

}


$("newMemoButton")
  .addEventListener("click", () => {

    vibrate();

    state.currentMemo = null;

    $("memoTitle").value = "";
    $("memoContent").value = "";

    showPage("memoEditPage");

  });


$("memoEditBack")
  .addEventListener("click", () => {

    vibrate();

    showPage("memoPage");

    renderMemos();

  });


$("saveMemo")
  .addEventListener("click", () => {

    vibrate();

    const title =
      $("memoTitle").value.trim();

    const content =
      $("memoContent").value.trim();

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

      const index =
        memos.findIndex(
          memo =>
            memo.id === state.currentMemo
        );

      if (index !== -1) {

        memos[index].title =
          title;

        memos[index].content =
          content;

      }

    }

    localStorage.setItem(
      STORAGE.memos,
      JSON.stringify(memos)
    );

    showPage("memoPage");

    renderMemos();

  });


$("deleteMemo")
  .addEventListener("click", () => {

    vibrate();

    if (state.currentMemo === null) {

      showPage("memoPage");

      return;
    }

    let memos = JSON.parse(
      localStorage.getItem(STORAGE.memos) || "[]"
    );

    memos =
      memos.filter(
        memo =>
          memo.id !== state.currentMemo
      );

    localStorage.setItem(
      STORAGE.memos,
      JSON.stringify(memos)
    );

    state.currentMemo = null;

    showPage("memoPage");

    renderMemos();

  });


/* =========================================
   잠금 상태
   ========================================= */

function updateLockStatus() {

  const type = getLockType();

  if (!type) {

    $("lockStatus").textContent =
      "잠금 없음";

  } else if (type === "pin") {

    $("lockStatus").textContent =
      "PIN 잠금 사용 중";

  } else {

    $("lockStatus").textContent =
      "패턴 잠금 사용 중";

  }

}


/* =========================================
   PIN
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

  $("pinSetupTitle").textContent =
    "PIN 설정";

  $("pinSetupDescription").textContent =
    "4~6자리 PIN을 입력하세요.";

  $("setupPinInput").value = "";
  $("setupPinConfirm").value = "";

  $("pinSetupOverlay")
    .classList
    .remove("hidden");

}


$("confirmPinSetup")
  .addEventListener("click", () => {

    vibrate();

    const pin =
      $("setupPinInput").value;

    const confirmPin =
      $("setupPinConfirm").value;

    if (!/^\d{4,6}$/.test(pin)) {

      alert(
        "PIN은 숫자 4~6자리여야 합니다."
      );

      return;
    }

    if (pin !== confirmPin) {

      alert("PIN이 서로 다릅니다.");

      return;
    }

    localStorage.setItem(
      STORAGE.lockType,
      "pin"
    );

    localStorage.setItem(
      STORAGE.lockValue,
      pin
    );

    $("pinSetupOverlay")
      .classList
      .add("hidden");

    updateLockStatus();

    alert(
      "PIN 잠금이 설정되었습니다."
    );

  });


/* =========================================
   패턴 설정
   ========================================= */

$("setPattern").addEventListener(
  "click",
  () => {

    vibrate();

    if (getLockType()) {

      beginVerifyLock("pattern");

    } else {

      openPatternSetup();

    }

  }
);


function openPatternSetup() {

  patternSetup.reset();

  $("patternSetupOverlay")
    .classList
    .remove("hidden");

}
/* =========================================
   잠금 해제
   ========================================= */

$("unlockPinButton")
  .addEventListener(
    "click",
    verifyPinUnlock
  );


$("unlockPin")
  .addEventListener(
    "keydown",
    event => {

      if (event.key === "Enter") {
        verifyPinUnlock();
      }

    }
  );


function verifyPinUnlock() {

  const input =
    $("unlockPin").value;

  if (
    input === getLockValue()
  ) {

    unlockPhone();

  } else {

    $("unlockPin").value = "";

    alert(
      "PIN이 올바르지 않습니다."
    );

  }

}


function unlockPhone() {

  $("lockScreen")
    .classList
    .add("hidden");

  $("bottomNav")
    .classList
    .remove("powerHidden");

  $("unlockPin").value = "";

}


/* =========================================
   잠금 확인
   ========================================= */

let verifyAction = null;


function beginVerifyLock(action) {

  verifyAction = action;

  $("verifyPin").value = "";

  const type = getLockType();

  if (type === "pin") {

    $("verifyPin")
      .classList
      .remove("hidden");

    $("verifyBoard")
      .classList
      .add("hidden");

  } else {

    $("verifyPin")
      .classList
      .add("hidden");

    $("verifyBoard")
      .classList
      .remove("hidden");

    verifyPattern.reset();

  }

  $("verifyLockOverlay")
    .classList
    .remove("hidden");

}


$("closeVerifyLock")
  .addEventListener(
    "click",
    () => {

      vibrate();

      $("verifyLockOverlay")
        .classList
        .add("hidden");

    }
  );


$("verifyLockButton")
  .addEventListener(
    "click",
    () => {

      vibrate();

      const type = getLockType();

      let verified = false;

      if (type === "pin") {

        verified =
          $("verifyPin").value ===
          getLockValue();

      } else {

        const pattern =
          verifyPattern.getPattern();

        verified =
          pattern === getLockValue();

      }

      if (!verified) {

        if (type === "pin") {
          $("verifyPin").value = "";
        } else {
          verifyPattern.reset();
        }

        alert(
          "현재 잠금 정보가 올바르지 않습니다."
        );

        return;
      }

      $("verifyLockOverlay")
        .classList
        .add("hidden");

      if (verifyAction === "pin") {

        openPinSetup();

      } else if (
        verifyAction === "pattern"
      ) {

        openPatternSetup();

      } else if (
        verifyAction === "remove"
      ) {

        localStorage.removeItem(
          STORAGE.lockType
        );

        localStorage.removeItem(
          STORAGE.lockValue
        );

        updateLockStatus();

        alert(
          "잠금이 해제되었습니다."
        );

      }

    }
  );


/* =========================================
   잠금 제거
   ========================================= */

$("removeLock")
  .addEventListener("click", () => {

    vibrate();

    if (!getLockType()) {

      alert(
        "현재 설정된 잠금이 없습니다."
      );

      return;
    }

    beginVerifyLock("remove");

  });


/* =========================================
   패턴 엔진
   ========================================= */

function createPatternBoard(boardElement) {

  const canvas =
    boardElement.querySelector("canvas");

  const ctx =
    canvas.getContext("2d");

  let pattern = [];

  let drawing = false;

  let pointer = {
    x: 0,
    y: 0
  };


  function resizeCanvas() {

    const rect =
      boardElement.getBoundingClientRect();

    const dpr =
      window.devicePixelRatio || 1;

    canvas.width =
      rect.width * dpr;

    canvas.height =
      rect.height * dpr;

    canvas.style.width =
      rect.width + "px";

    canvas.style.height =
      rect.height + "px";

    ctx.setTransform(
      dpr,
      0,
      0,
      dpr,
      0,
      0
    );

    draw();

  }


  function position(event) {

    const rect =
      boardElement.getBoundingClientRect();

    return {
      x:
        event.clientX -
        rect.left,

      y:
        event.clientY -
        rect.top
    };

  }


  function getDot(index) {

    return boardElement.querySelector(
      `i[data-index="${index}"]`
    );

  }


  function findDot(x, y) {

    const rect =
      boardElement.getBoundingClientRect();

    const dots =
      [
        ...boardElement
          .querySelectorAll("i")
      ];

    for (const dot of dots) {

      const dotRect =
        dot.getBoundingClientRect();

      const dx =
        x -
        (
          dotRect.left -
          rect.left +
          dotRect.width / 2
        );

      const dy =
        y -
        (
          dotRect.top -
          rect.top +
          dotRect.height / 2
        );

      const distance =
        Math.sqrt(
          dx * dx +
          dy * dy
        );

      if (distance < 28) {

        return Number(
          dot.dataset.index
        );

      }

    }

    return null;

  }


  function addDot(index) {

    if (index === null) {
      return;
    }

    if (pattern.includes(index)) {
      return;
    }

    pattern.push(index);

    const dot =
      getDot(index);

    if (dot) {
      dot.classList.add("active");
    }

    draw();

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

    const rect =
      boardElement.getBoundingClientRect();

    ctx.beginPath();

    pattern.forEach(
      (index, positionIndex) => {

        const dot =
          getDot(index);

        if (!dot) {
          return;
        }

        const dotRect =
          dot.getBoundingClientRect();

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

      }
    );

    if (drawing) {

      ctx.lineTo(
        pointer.x,
        pointer.y
      );

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
      .forEach(
        dot =>
          dot.classList.remove(
            "active"
          )
      );

    pointer =
      position(event);

    addDot(
      findDot(
        pointer.x,
        pointer.y
      )
    );

    try {

      boardElement.setPointerCapture(
        event.pointerId
      );

    } catch {}

    draw();

  }


  function move(event) {

    if (!drawing) {
      return;
    }

    event.preventDefault();

    pointer =
      position(event);

    addDot(
      findDot(
        pointer.x,
        pointer.y
      )
    );

    draw();

  }


  function end() {

    if (!drawing) {
      return;
    }

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


  window.addEventListener(
    "resize",
    resizeCanvas
  );

  setTimeout(
    resizeCanvas,
    100
  );


  return {

    reset() {

      pattern = [];

      drawing = false;

      boardElement
        .querySelectorAll("i")
        .forEach(
          dot =>
            dot.classList.remove(
              "active"
            )
        );

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
  createPatternBoard(
    $("setupBoard")
  );


const verifyPattern =
  createPatternBoard(
    $("verifyBoard")
  );


const unlockPattern =
  createPatternBoard(
    $("unlockBoard")
  );


/* =========================================
   패턴 저장
   ========================================= */

$("confirmPattern")
  .addEventListener(
    "click",
    () => {

      vibrate();

      const pattern =
        patternSetup.getPattern();

      if (!pattern) {

        alert(
          "4개 이상의 점을 연결하세요."
        );

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

      $("patternSetupOverlay")
        .classList
        .add("hidden");

      updateLockStatus();

      alert(
        "패턴 잠금이 설정되었습니다."
      );

    }
  );


/* =========================================
   잠금화면
   ========================================= */

function showLockScreen() {

  const type =
    getLockType();

  if (!type) {

    $("lockScreen")
      .classList
      .add("hidden");

    $("bottomNav")
      .classList
      .remove("powerHidden");

    return;
  }

  $("lockScreen")
    .classList
    .remove("hidden");

  /* 잠금 화면에서는
     내비게이션 바를 숨김 */
  $("bottomNav")
    .classList
    .add("powerHidden");

  if (type === "pin") {

    $("pinUnlock")
      .classList
      .remove("hidden");

    $("patternUnlock")
      .classList
      .add("hidden");

  } else {

    $("pinUnlock")
      .classList
      .add("hidden");

    $("patternUnlock")
      .classList
      .remove("hidden");

    unlockPattern.reset();

  }

}


/* =========================================
   패턴 잠금 해제
   ========================================= */

$("unlockBoard")
  .addEventListener(
    "pointerup",
    () => {

      setTimeout(
        () => {

          const pattern =
            unlockPattern.getPattern();

          if (!pattern) {
            return;
          }

          if (
            pattern ===
            getLockValue()
          ) {

            unlockPhone();

          } else {

            alert(
              "패턴이 올바르지 않습니다."
            );

            unlockPattern.reset();

          }

        },
        50
      );

    }
  );


/* =========================================
   배경
   ========================================= */

document
  .querySelectorAll("[data-bg]")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        vibrate();

        setBackground(
          button.dataset.bg
        );

      }
    );

  });


function setBackground(type) {

  localStorage.setItem(
    STORAGE.background,
    type
  );

  applyBackground(type);

}


function applyBackground(type) {

  const screen =
    $("screen");

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
  localStorage.getItem(
    STORAGE.background
  ) || "default"
);


/* =========================================
   빠른 설정
   ========================================= */

const quickPanel = $("quickPanel");

/* 빠른 설정 스와이프 감도 */
const QUICK_START_ZONE = 300;
const QUICK_SWIPE_DISTANCE = 30;

let gestureStartY = null;
let gestureActive = false;
let gestureSource = null;
let gestureHandled = false;


function resetGesture() {

  gestureStartY = null;
  gestureActive = false;
  gestureSource = null;
  gestureHandled = false;

}


function openQuickPanel() {

  if (state.isPoweredOff) {
    return;
  }

  if (!$("lockScreen").classList.contains("hidden")) {
    return;
  }

  quickPanel.classList.add("open");

}


function closeQuickPanel() {

  quickPanel.classList.remove("open");

}


function getPhoneLocalY(clientY) {

  const rect =
    $("phone").getBoundingClientRect();

  return clientY - rect.top;

}


/* =========================================
   화면에서 빠른 설정 열기/닫기
   ========================================= */

$("phone").addEventListener(
  "pointerdown",
  event => {

    if (state.isPoweredOff) {
      return;
    }

    if (
      !$("lockScreen")
        .classList
        .contains("hidden")
    ) {
      return;
    }

    if (
      event.target.closest("#powerButton") ||
      event.target.closest("#quickPanel") ||
      event.target.closest("#bottomNav") ||
      event.target.closest(".overlay") ||
      event.target.closest("#photoViewer")
    ) {
      return;
    }

    gestureStartY =
      getPhoneLocalY(event.clientY);

    gestureActive = true;

    gestureSource = "screen";

    gestureHandled = false;

  }
);


$("phone").addEventListener(
  "pointermove",
  event => {

    if (
      !gestureActive ||
      gestureStartY === null ||
      gestureHandled
    ) {
      return;
    }

    const currentY =
      getPhoneLocalY(event.clientY);

    const difference =
      currentY - gestureStartY;


    if (
      gestureSource === "screen" &&
      !quickPanel.classList.contains("open") &&
      gestureStartY <= QUICK_START_ZONE &&
      difference >= QUICK_SWIPE_DISTANCE
    ) {

      gestureHandled = true;

      openQuickPanel();

      resetGesture();

      return;

    }


    if (
      gestureSource === "screen" &&
      quickPanel.classList.contains("open") &&
      difference <= -QUICK_SWIPE_DISTANCE
    ) {

      gestureHandled = true;

      closeQuickPanel();

      resetGesture();

    }

  }
);


$("phone").addEventListener(
  "pointerup",
  event => {

    if (
      !gestureActive ||
      gestureStartY === null
    ) {

      resetGesture();

      return;
    }

    const currentY =
      getPhoneLocalY(event.clientY);

    const difference =
      currentY - gestureStartY;


    if (
      !gestureHandled &&
      gestureSource === "screen" &&
      !quickPanel.classList.contains("open") &&
      gestureStartY <= QUICK_START_ZONE &&
      difference >= QUICK_SWIPE_DISTANCE
    ) {

      openQuickPanel();

    } else if (
      !gestureHandled &&
      gestureSource === "screen" &&
      quickPanel.classList.contains("open") &&
      difference <= -QUICK_SWIPE_DISTANCE
    ) {

      closeQuickPanel();

    }

    resetGesture();

  }
);


$("phone").addEventListener(
  "pointercancel",
  resetGesture
);


/* =========================================
   빠른 설정창에서 위로 스와이프
   ========================================= */

quickPanel.addEventListener(
  "pointerdown",
  event => {

    if (state.isPoweredOff) {
      return;
    }

    gestureStartY =
      event.clientY;

    gestureActive = true;

    gestureSource = "quickPanel";

    gestureHandled = false;

  }
);


quickPanel.addEventListener(
  "pointermove",
  event => {

    if (
      !gestureActive ||
      gestureStartY === null ||
      gestureHandled
    ) {
      return;
    }

    if (
      event.clientY -
      gestureStartY <=
      -QUICK_SWIPE_DISTANCE
    ) {

      gestureHandled = true;

      closeQuickPanel();

      resetGesture();

    }

  }
);


quickPanel.addEventListener(
  "pointerup",
  event => {

    if (
      !gestureActive ||
      gestureStartY === null
    ) {

      resetGesture();

      return;
    }

    if (
      !gestureHandled &&
      event.clientY -
      gestureStartY <=
      -QUICK_SWIPE_DISTANCE
    ) {

      closeQuickPanel();

    }

    resetGesture();

  }
);


quickPanel.addEventListener(
  "pointercancel",
  resetGesture
);
$("brightnessSlider")
  .addEventListener(
    "input",
    event => {

      const value =
        Number(event.target.value);

      setBrightness(value);

    }
  );


function setBrightness(value) {

  state.brightness = value;

  localStorage.setItem(
    STORAGE.brightness,
    String(value)
  );

  applyBrightness(value);

}


function applyBrightness(value) {

  const brightness =
    Math.max(
      0.25,
      Math.min(1, value / 100)
    );

  $("screen").style.filter =
    `brightness(${brightness})`;

}


const savedBrightness =
  Number(
    localStorage.getItem(
      STORAGE.brightness
    ) || 100
  );


$("brightnessSlider").value =
  savedBrightness;

applyBrightness(
  savedBrightness
);


/* =========================================
   빠른 설정 버튼
   ========================================= */

$("wifiButton")
  .addEventListener(
    "click",
    () => {

      vibrate();

      state.wifi =
        !state.wifi;

      $("wifiButton")
        .classList
        .toggle(
          "active",
          state.wifi
        );

    }
  );


$("airplaneButton")
  .addEventListener(
    "click",
    () => {

      vibrate();

      state.airplane =
        !state.airplane;

      $("airplaneButton")
        .classList
        .toggle(
          "active",
          state.airplane
        );

    }
  );


$("soundButton")
  .addEventListener(
    "click",
    () => {

      vibrate();

      state.sound =
        !state.sound;

      $("soundButton")
        .classList
        .toggle(
          "active",
          state.sound
        );

    }
  );


/* =========================================
   손전등
   ========================================= */

let flashlightStream = null;
let flashlightTrack = null;
let flashlightOn = false;


$("flashButton")
  .addEventListener(
    "click",
    async () => {

      vibrate();

      try {

        if (!flashlightOn) {

          if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia
          ) {

            alert(
              "이 브라우저에서는 손전등 기능을 사용할 수 없습니다."
            );

            return;

          }


          flashlightStream =
            await navigator.mediaDevices
              .getUserMedia({
                video: {
                  facingMode: {
                    ideal: "environment"
                  }
                },
                audio: false
              });


          flashlightTrack =
            flashlightStream.getVideoTracks()[0];


          const capabilities =
            flashlightTrack
              .getCapabilities();


          if (!capabilities.torch) {

            flashlightStream
              .getTracks()
              .forEach(
                track =>
                  track.stop()
              );

            flashlightStream = null;
            flashlightTrack = null;

            alert(
              "이 기기 또는 브라우저에서 손전등 제어를 지원하지 않습니다."
            );

            return;

          }


          await flashlightTrack
            .applyConstraints({
              advanced: [
                {
                  torch: true
                }
              ]
            });


          flashlightOn = true;

          $("flashButton")
            .classList
            .add("active");


        } else {

          if (flashlightTrack) {

            await flashlightTrack
              .applyConstraints({
                advanced: [
                  {
                    torch: false
                  }
                ]
              });

          }


          if (flashlightStream) {

            flashlightStream
              .getTracks()
              .forEach(
                track =>
                  track.stop()
              );

          }


          flashlightStream = null;
          flashlightTrack = null;

          flashlightOn = false;

          $("flashButton")
            .classList
            .remove("active");

        }

      } catch (error) {

        console.error(
          "Flashlight error:",
          error
        );

        if (flashlightStream) {

          flashlightStream
            .getTracks()
            .forEach(
              track =>
                track.stop()
            );

        }

        flashlightStream = null;
        flashlightTrack = null;
        flashlightOn = false;

        $("flashButton")
          .classList
          .remove("active");

        alert(
          "손전등을 사용할 수 없습니다.\n브라우저 권한 또는 기기 지원 여부를 확인하세요."
        );

      }

    }
  );


/* =========================================
   전원 버튼
   ========================================= */

$("powerButton")
  .addEventListener(
    "click",
    () => {

      if (state.isPoweredOff) {

        powerOn();

        return;

      }

      vibrate();

      powerOff();

    }
  );


function powerOff() {

  state.isPoweredOff = true;

  stopCamera();

  closeQuickPanel();

  $("bottomNav")
    .classList
    .add("powerHidden");

  $("statusBar")
    .style
    .display = "none";

  $("powerOffOverlay")
    .classList
    .remove("hidden");

}


function powerOn() {

  state.isPoweredOff = false;

  $("powerOffOverlay")
    .classList
    .add("hidden");

  $("bottomNav")
    .classList
    .remove("powerHidden");

  $("statusBar")
    .style
    .display = "flex";

  showLockScreen();

}


/* =========================================
   페이지 전환
   ========================================= */

function showPage(pageId) {

  if (state.isPoweredOff) {
    return;
  }

  if (
    !$("lockScreen")
      .classList
      .contains("hidden")
  ) {
    return;
  }

  document
    .querySelectorAll(".page")
    .forEach(
      page =>
        page.classList.add("hidden")
    );


  const page =
    $(pageId);

  if (!page) {
    return;
  }

  page.classList.remove("hidden");

  state.currentPage =
    pageId;


  if (pageId === "galleryPage") {
    renderGallery();
  }

  if (pageId === "memoPage") {
    renderMemos();
  }

  if (pageId === "recentPage") {
    renderRecent();
  }

}


document
  .querySelectorAll("[data-page]")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        vibrate();

        showPage(
          button.dataset.page
        );

      }
    );

  });


/* =========================================
   하단 네비게이션
   ========================================= */

function handleNavAction(action) {

  if (state.isPoweredOff) {
    return;
  }

  if (
    !$("lockScreen")
      .classList
      .contains("hidden")
  ) {
    return;
  }

  vibrate();


  if (action === "home") {

    showPage("homePage");

    return;

  }


  if (action === "recent") {

    renderRecent();

    showPage("recentPage");

    return;

  }


  if (
    action === "back" &&
    state.currentPage !== "homePage"
  ) {

    showPage("homePage");

  }

}


document
  .querySelectorAll(
    "#bottomNav button"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        handleNavAction(
          button.dataset.action
        );

      }
    );

  });


/* =========================================
   전화
   ========================================= */

$("callButton")
  .addEventListener(
    "click",
    () => {

      vibrate();

      const number =
        $("phoneNumber")
          .value
          .trim();

      if (!number) {

        $("callResult")
          .textContent =
          "전화번호를 입력하세요.";

        return;

      }

      $("callResult")
        .textContent =
        `${number}로 전화를 시도합니다.`;

      window.location.href =
        `tel:${number}`;

    }
  );


/* =========================================
   시계
   ========================================= */

function updateClock() {

  const now =
    new Date();


  const hours =
    String(
      now.getHours()
    ).padStart(2, "0");


  const minutes =
    String(
      now.getMinutes()
    ).padStart(2, "0");


  const seconds =
    String(
      now.getSeconds()
    ).padStart(2, "0");


  const time =
    `${hours}:${minutes}`;


  const timeWithSeconds =
    `${hours}:${minutes}:${seconds}`;


  document
    .querySelectorAll(".homeClock")
    .forEach(
      element =>
        element.textContent =
          time
    );


  document
    .querySelectorAll(".bigClock")
    .forEach(
      element =>
        element.textContent =
          timeWithSeconds
    );


  const date =
    `${now.getFullYear()}년 ${
      now.getMonth() + 1
    }월 ${
      now.getDate()
    }일`;


  document
    .querySelectorAll(".homeDate")
    .forEach(
      element =>
        element.textContent =
          date
    );


  document
    .querySelectorAll(".bigDate")
    .forEach(
      element =>
        element.textContent =
          date
    );


  const lockTime =
    $("lockTime");

  if (lockTime) {
    lockTime.textContent =
      time;
  }


  const lockDate =
    $("lockDate");

  if (lockDate) {
    lockDate.textContent =
      date;
  }


  const statusTime =
    $("statusTime");

  if (statusTime) {
    statusTime.textContent =
      time;
  }

}


updateClock();

setInterval(
  updateClock,
  1000
);


/* =========================================
   카메라
   ========================================= */

let cameraStream = null;


$("openCamera")
  ?.addEventListener(
    "click",
    () => {

      startCamera();

    }
  );


async function startCamera() {

  if (
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia
  ) {

    alert(
      "이 브라우저에서는 카메라를 사용할 수 없습니다."
    );

    return;

  }


  try {

    cameraStream =
      await navigator.mediaDevices
        .getUserMedia({
          video: {
            facingMode: {
              ideal: "environment"
            }
          },
          audio: false
        });


    const video =
      $("cameraVideo");

    video.srcObject =
      cameraStream;

    await video.play();

  } catch (error) {

    console.error(
      "Camera error:",
      error
    );

    alert(
      "카메라를 사용할 수 없습니다.\n브라우저 카메라 권한을 확인하세요."
    );

  }

}


function stopCamera() {

  if (!cameraStream) {
    return;
  }

  cameraStream
    .getTracks()
    .forEach(
      track =>
        track.stop()
    );

  cameraStream = null;

  const video =
    $("cameraVideo");

  if (video) {
    video.srcObject = null;
  }

}


$("stopCamera")
  ?.addEventListener(
    "click",
    () => {

      stopCamera();

    }
  );


$("takePhoto")
  ?.addEventListener(
    "click",
    () => {

      const video =
        $("cameraVideo");

      const canvas =
        $("photoCanvas");

      if (
        !video ||
        !canvas ||
        !cameraStream
      ) {
        return;
      }

      canvas.width =
        video.videoWidth;

      canvas.height =
        video.videoHeight;


      const ctx =
        canvas.getContext("2d");


      ctx.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
      );


      const image =
        canvas.toDataURL(
          "image/jpeg",
          0.9
        );


      const photos =
        JSON.parse(
          localStorage.getItem(
            STORAGE.photos
          ) || "[]"
        );


      photos.unshift({
        id: Date.now(),
        image
      });


      localStorage.setItem(
        STORAGE.photos,
        JSON.stringify(photos)
      );


      renderGallery();

      showPage(
        "galleryPage"
      );

    }
  );


/* =========================================
   갤러리
   ========================================= */

function getPhotos() {

  try {

    return JSON.parse(
      localStorage.getItem(
        STORAGE.photos
      ) || "[]"
    );

  } catch {

    return [];

  }

}


function savePhotos(photos) {

  localStorage.setItem(
    STORAGE.photos,
    JSON.stringify(photos)
  );

}


function renderGallery() {

  const grid =
    $("galleryGrid");

  if (!grid) {
    return;
  }

  const photos =
    getPhotos();


  grid.innerHTML = "";


  if (photos.length === 0) {

    grid.innerHTML =
      `<p>저장된 사진이 없습니다.</p>`;

    return;

  }


  photos.forEach(photo => {

    const item =
      document.createElement("div");

    item.className =
      "galleryItem";


    const img =
      document.createElement("img");

    img.src =
      photo.image;


    img.addEventListener(
      "click",
      () => {

        openPhotoViewer(
          photo.id
        );

      }
    );


    const deleteButton =
      document.createElement("button");

    deleteButton.className =
      "galleryDelete";

    deleteButton.textContent =
      "×";


    deleteButton.addEventListener(
      "click",
      event => {

        event.stopPropagation();

        deletePhoto(
          photo.id
        );

      }
    );


    item.appendChild(img);

    item.appendChild(
      deleteButton
    );

    grid.appendChild(item);

  });

}


let currentPhotoId = null;


function openPhotoViewer(id) {

  const photo =
    getPhotos()
      .find(
        item =>
          item.id === id
      );

  if (!photo) {
    return;
  }

  currentPhotoId =
    id;

  $("viewerImage").src =
    photo.image;

  $("photoViewer")
    .classList
    .remove("hidden");

}


$("closePhotoViewer")
  ?.addEventListener(
    "click",
    () => {

      $("photoViewer")
        .classList
        .add("hidden");

      currentPhotoId = null;

    }
  );


$("deleteCurrentPhoto")
  ?.addEventListener(
    "click",
    () => {

      if (
        currentPhotoId === null
      ) {
        return;
      }

      deletePhoto(
        currentPhotoId
      );

      $("photoViewer")
        .classList
        .add("hidden");

      currentPhotoId = null;

    }
  );


function deletePhoto(id) {

  const photos =
    getPhotos()
      .filter(
        photo =>
          photo.id !== id
      );

  savePhotos(photos);

  renderGallery();

}


/* =========================================
   메모
   ========================================= */

function getMemos() {

  try {

    return JSON.parse(
      localStorage.getItem(
        STORAGE.memos
      ) || "[]"
    );

  } catch {

    return [];

  }

}


function saveMemos(memos) {

  localStorage.setItem(
    STORAGE.memos,
    JSON.stringify(memos)
  );

}


function renderMemos() {

  const list =
    $("memoList");

  if (!list) {
    return;
  }

  const memos =
    getMemos();


  list.innerHTML = "";


  if (memos.length === 0) {

    list.innerHTML =
      `<p>저장된 메모가 없습니다.</p>`;

    return;

  }


  memos.forEach(memo => {

    const card =
      document.createElement("div");

    card.className =
      "memoCard";


    const title =
      document.createElement("h3");

    title.textContent =
      memo.title;


    const content =
      document.createElement("p");

    content.textContent =
      memo.content;


    const edit =
      document.createElement("button");

    edit.textContent =
      "수정";


    const remove =
      document.createElement("button");

    remove.textContent =
      "삭제";


    edit.addEventListener(
      "click",
      () => {

        openMemoEditor(
          memo.id
        );

      }
    );


    remove.addEventListener(
      "click",
      () => {

        const updated =
          getMemos()
            .filter(
              item =>
                item.id !== memo.id
            );

        saveMemos(updated);

        renderMemos();

      }
    );


    card.appendChild(title);

    card.appendChild(content);

    card.appendChild(edit);

    card.appendChild(remove);

    list.appendChild(card);

  });

}


let editingMemoId = null;


$("newMemo")
  ?.addEventListener(
    "click",
    () => {

      openMemoEditor(null);

    }
  );


function openMemoEditor(id) {

  editingMemoId =
    id;

  if (id === null) {

    $("memoTitle").value = "";

    $("memoContent").value = "";

  } else {

    const memo =
      getMemos()
        .find(
          item =>
            item.id === id
        );

    if (!memo) {
      return;
    }

    $("memoTitle").value =
      memo.title;

    $("memoContent").value =
      memo.content;

  }

  $("memoEditor")
    .classList
    .remove("hidden");

}


$("saveMemo")
  ?.addEventListener(
    "click",
    () => {

      const title =
        $("memoTitle")
          .value
          .trim();

      const content =
        $("memoContent")
          .value
          .trim();


      if (!title) {

        alert(
          "제목을 입력하세요."
        );

        return;

      }


      const memos =
        getMemos();


      if (editingMemoId === null) {

        memos.unshift({
          id: Date.now(),
          title,
          content
        });

      } else {

        const memo =
          memos.find(
            item =>
              item.id ===
              editingMemoId
          );

        if (memo) {

          memo.title =
            title;

          memo.content =
            content;

        }

      }


      saveMemos(memos);

      $("memoEditor")
        .classList
        .add("hidden");

      renderMemos();

    }
  );


$("cancelMemo")
  ?.addEventListener(
    "click",
    () => {

      $("memoEditor")
        .classList
        .add("hidden");

    }
  );


/* =========================================
   최근 앱
   ========================================= */

function addRecent(pageId) {

  if (
    !pageId ||
    pageId === "recentPage"
  ) {
    return;
  }

  let recent =
    JSON.parse(
      localStorage.getItem(
        STORAGE.recent
      ) || "[]"
    );


  recent =
    recent.filter(
      id =>
        id !== pageId
    );


  recent.unshift(
    pageId
  );


  recent =
    recent.slice(
      0,
      8
    );


  localStorage.setItem(
    STORAGE.recent,
    JSON.stringify(recent)
  );

}


function renderRecent() {

  const list =
    $("recentList");

  if (!list) {
    return;
  }

  const recent =
    JSON.parse(
      localStorage.getItem(
        STORAGE.recent
      ) || "[]"
    );


  list.innerHTML = "";


  if (recent.length === 0) {

    list.innerHTML =
      `<p>최근 사용한 앱이 없습니다.</p>`;

    return;

  }


  recent.forEach(
    pageId => {

      const page =
        $(pageId);

      if (!page) {
        return;
      }


      const titleElement =
        page.querySelector(
          "h2"
        );


      const title =
        titleElement
          ? titleElement.textContent
          : pageId;


      const card =
        document.createElement("div");

      card.className =
        "recentCard";


      const text =
        document.createElement("div");

      text.textContent =
        title;


      const open =
        document.createElement("button");

      open.textContent =
        "열기";


      open.addEventListener(
        "click",
        () => {

          showPage(
            pageId
          );

        }
      );


      card.appendChild(text);

      card.appendChild(open);

      list.appendChild(card);

    }
  );

}


/* =========================================
   페이지 전환 기록
   ========================================= */

const originalShowPage =
  showPage;


showPage =
  function(pageId) {

    addRecent(pageId);

    originalShowPage(pageId);

  };


/* =========================================
   진동
   ========================================= */

function vibrate() {

  if (
    navigator.vibrate &&
    state.sound
  ) {

    navigator.vibrate(
      10
    );

  }

}


/* =========================================
   초기 상태
   ========================================= */

function initialize() {

  updateLockStatus();

  renderGallery();

  renderMemos();

  renderRecent();

  updateClock();


  const lockType =
    getLockType();


  if (lockType) {

    showLockScreen();

  } else {

    $("lockScreen")
      .classList
      .add("hidden");

    $("bottomNav")
      .classList
      .remove("powerHidden");

  }


  if (
    state.isPoweredOff
  ) {

    powerOff();

  }

}


initialize();


/* =========================================
   페이지 이탈 시 카메라 정리
   ========================================= */

window.addEventListener(
  "beforeunload",
  () => {

    stopCamera();

    if (flashlightStream) {

      flashlightStream
        .getTracks()
        .forEach(
          track =>
            track.stop()
        );

    }

  }
);