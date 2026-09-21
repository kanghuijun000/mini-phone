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

      }
    );

    box.appendChild(card);

  });

}      "click",
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

  $("callResult").textContent =
    `${number}로 전화 거는 중...`;

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
    );$("closePhotoViewer")
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

}/* =========================================
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

  $("unlockPin").value = "";

}


/* =========================================
   잠금 확인
   ========================================= */

let verifyAction = null;


function beginVerifyLock(type) {

  verifyAction = () => {

    if (type === "pin") {

      $("unlockPinTitle").textContent =
        "현재 PIN 입력";

      $("unlockPin")
        .classList
        .remove("hidden");

      $("unlockPinButton")
        .classList
        .remove("hidden");

      $("unlockPatternBoard")
        .classList
        .add("hidden");

      $("lockVerifyOverlay")
        .classList
        .remove("hidden");

    }

    if (type === "pattern") {

      $("unlockPin")
        .classList
        .add("hidden");

      $("unlockPinButton")
        .classList
        .add("hidden");

      $("unlockPatternBoard")
        .classList
        .remove("hidden");

      verifyPattern.reset();

      $("lockVerifyOverlay")
        .classList
        .remove("hidden");

    }

  };

  verifyAction();

}


$("closeLockVerify")
  .addEventListener("click", () => {

    vibrate();

    $("lockVerifyOverlay")
      .classList
      .add("hidden");

    verifyAction = null;

  });


/* =========================================
   PIN으로 잠금 변경
   ========================================= */

$("changeLockType")
  .addEventListener("click", () => {

    vibrate();

    const type = getLockType();

    if (type === "pin") {

      openPinSetup();

    } else {

      openPatternSetup();

    }

  });


$("removeLock")
  .addEventListener("click", () => {

    vibrate();

    if (!getLockType()) {

      alert("현재 설정된 잠금이 없습니다.");

      return;
    }

    if (
      !confirm(
        "잠금 설정을 삭제할까요?"
      )
    ) {

      return;
    }

    localStorage.removeItem(
      STORAGE.lockType
    );

    localStorage.removeItem(
      STORAGE.lockValue
    );

    updateLockStatus();

    alert("잠금이 삭제되었습니다.");

  });  function end() {

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

    return;
  }

  $("lockScreen")
    .classList
    .remove("hidden");

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
);/* =========================================
   빠른 설정
   ========================================= */

const quickPanel =
  $("quickPanel");

let gestureStartY = null;
let gestureActive = false;


function openQuickPanel() {

  if (state.isPoweredOff) {
    return;
  }

  quickPanel
    .classList
    .add("open");

}


function closeQuickPanel() {

  quickPanel
    .classList
    .remove("open");

}


/*
  화면 최상단에서 아래로 스와이프
  빠른 설정창에서 위로 스와이프
*/

$("phone")
  .addEventListener(
    "pointerdown",
    event => {

      if (state.isPoweredOff) {
        return;
      }

      if (
        event.target.closest(
          "#powerButton"
        ) ||
        event.target.closest(
          "#quickPanel"
        ) ||
        event.target.closest(
          "#bottomNav"
        ) ||
        event.target.closest(
          ".overlay"
        ) ||
        event.target.closest(
          "#photoViewer"
        )
      ) {

        return;
      }

      gestureStartY =
        event.clientY;

      gestureActive = true;

    }
  );


$("phone")
  .addEventListener(
    "pointerup",
    event => {

      if (
        !gestureActive ||
        gestureStartY === null
      ) {

        return;
      }

      const difference =
        event.clientY -
        gestureStartY;

      if (
        !quickPanel.classList.contains(
          "open"
        ) &&
        gestureStartY <= 55 &&
        difference >= 55
      ) {

        openQuickPanel();

      } else if (
        quickPanel.classList.contains(
          "open"
        ) &&
        difference <= -55
      ) {

        closeQuickPanel();

      }

      gestureStartY = null;
      gestureActive = false;

    }
  );


$("phone")
  .addEventListener(
    "pointercancel",
    () => {

      gestureStartY = null;
      gestureActive = false;

    }
  );


/*
  빠른 설정 내부에서 위로 스와이프
*/

quickPanel.addEventListener(
  "pointerdown",
  event => {

    gestureStartY =
      event.clientY;

    gestureActive = true;

  }
);


quickPanel.addEventListener(
  "pointerup",
  event => {

    if (
      gestureStartY !== null &&
      event.clientY -
      gestureStartY <= -55
    ) {

      closeQuickPanel();

    }

    gestureStartY = null;
    gestureActive = false;

  }
);


/* =========================================
   밝기
   ========================================= */

const savedBrightness =
  localStorage.getItem(
    STORAGE.brightness
  ) || "100";

$("brightness").value =
  savedBrightness;

$("screen").style.filter =
  `brightness(${savedBrightness}%)`;


$("brightness")
  .addEventListener(
    "input",
    event => {

      const value =
        event.target.value;

      localStorage.setItem(
        STORAGE.brightness,
        value
      );

      $("screen").style.filter =
        `brightness(${value}%)`;

    }
  );


/* =========================================
   Wi-Fi
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


/* =========================================
   비행기 모드
   ========================================= */

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


/* =========================================
   소리
   ========================================= */

function updateSoundUI() {

  const button =
    $("soundButton");

  const icon =
    button.querySelector("span");

  if (state.sound === "sound") {

    button.classList.remove(
      "active"
    );

    icon.textContent = "🔊";

    $("soundText").textContent =
      "소리";

  } else if (
    state.sound === "silent"
  ) {

    button.classList.remove(
      "active"
    );

    icon.textContent = "🔇";

    $("soundText").textContent =
      "무음";

  } else {

    button.classList.add(
      "active"
    );

    icon.textContent = "📳";

    $("soundText").textContent =
      "진동";

  }

}


$("soundButton")
  .addEventListener(
    "click",
    () => {

      if (state.sound === "sound") {

        state.sound = "silent";

      } else if (
        state.sound === "silent"
      ) {

        state.sound = "vibrate";

      } else {

        state.sound = "sound";

      }

      localStorage.setItem(
        STORAGE.sound,
        state.sound
      );

      updateSoundUI();

      if (
        state.sound !== "silent" &&
        "vibrate" in navigator
      ) {

        navigator.vibrate(15);

      }

    }
  );


updateSoundUI();/* =========================================
   손전등
   ========================================= */

$("flashButton")
  .addEventListener(
    "click",
    async () => {

      vibrate();

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {

        alert(
          "이 브라우저에서는 손전등 기능을 사용할 수 없습니다."
        );

        return;
      }

      try {

        if (!state.flashlight) {

          if (!state.stream) {

            state.stream =
              await navigator.mediaDevices
                .getUserMedia({
                  video: {
                    facingMode: {
                      ideal: "environment"
                    }
                  },
                  audio: false
                });

          }

          const track =
            state.stream
              .getVideoTracks()[0];

          const capabilities =
            track.getCapabilities
              ? track.getCapabilities()
              : {};

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

          $("flashButton")
            .classList
            .add("active");

        } else {

          const track =
            state.stream
              ?.getVideoTracks()[0];

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

          $("flashButton")
            .classList
            .remove("active");

        }

      } catch (error) {

        alert(
          "손전등을 제어하지 못했습니다."
        );

      }

    }
  );


/* =========================================
   전원
   ========================================= */

/*
  전원이 켜져 있으면 OFF
  전원이 꺼져 있으면 ON

  화면 안에는 전원 켜기 버튼을
  절대로 표시하지 않는다.
*/

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

  $("bottomNav").style.display =
    "none";

  $("statusBar").style.display =
    "none";

  $("powerOffOverlay")
    .classList
    .remove("hidden");

}


function powerOn() {

  state.isPoweredOff = false;

  $("powerOffOverlay")
    .classList
    .add("hidden");

  $("bottomNav").style.display =
    "grid";

  $("statusBar").style.display =
    "flex";

  showLockScreen();

}


/* =========================================
   초기 실행
   ========================================= */

updateLockStatus();

showPage("homePage");

showLockScreen();/* =========================================
   빠른 설정 / 하단 네비게이션 안정화
   ========================================= */

(() => {

  const phone =
    document.getElementById("phone");

  const screen =
    document.getElementById("screen");

  const quickPanel =
    document.getElementById("quickPanel");

  const bottomNav =
    document.getElementById("bottomNav");


  if (!phone) {
    return;
  }


  /*
    하단 네비게이션이 화면에
    제대로 표시되고 눌리도록 설정
  */

  if (bottomNav) {

    bottomNav.style.zIndex = "900";

    bottomNav.style.pointerEvents =
      "auto";

  }


  /*
    빠른 설정창은 열렸을 때만
    터치 가능하도록 설정
  */

  if (quickPanel) {

    quickPanel.style.zIndex = "850";

    quickPanel.style.pointerEvents =
      "none";

  }


  if (screen) {

    screen.style.zIndex = "1";

  }


  let startY = null;


  /*
    위에서 아래로 스와이프
  */

  phone.addEventListener(
    "pointerdown",
    event => {

      if (
        typeof state !== "undefined" &&
        state.isPoweredOff
      ) {
        return;
      }


      if (
        event.target.closest(
          "#powerButton"
        ) ||
        event.target.closest(
          "#quickPanel"
        ) ||
        event.target.closest(
          "#bottomNav"
        ) ||
        event.target.closest(
          ".overlay"
        ) ||
        event.target.closest(
          "#photoViewer"
        )
      ) {

        return;
      }


      startY =
        event.clientY;

    },
    true
  );


  phone.addEventListener(
    "pointerup",
    event => {

      if (
        typeof state !== "undefined" &&
        state.isPoweredOff
      ) {

        startY = null;

        return;
      }


      if (startY === null) {
        return;
      }


      const difference =
        event.clientY - startY;


      const panelOpen =
        quickPanel &&
        quickPanel.classList.contains(
          "open"
        );


      if (
        !panelOpen &&
        startY <= 70 &&
        difference >= 50
      ) {

        if (
          typeof openQuickPanel ===
          "function"
        ) {

          openQuickPanel();

        }

      } else if (
        panelOpen &&
        difference <= -50
      ) {

        if (
          typeof closeQuickPanel ===
          "function"
        ) {

          closeQuickPanel();

        }

      }


      startY = null;

    },
    true
  );


  phone.addEventListener(
    "pointercancel",
    () => {

      startY = null;

    },
    true
  );


  /*
    빠른 설정창이 열렸을 때만
    내부 버튼을 누를 수 있도록 함
  */

  if (quickPanel) {

    const observer =
      new MutationObserver(() => {

        quickPanel.style.pointerEvents =
          quickPanel.classList.contains(
            "open"
          )
            ? "auto"
            : "none";

      });


    observer.observe(
      quickPanel,
      {
        attributes: true,
        attributeFilter: ["class"]
      }
    );

  }


  /*
    하단 네비게이션 버튼 터치 보장
  */

  [
    "homeNav",
    "recentNav",
    "backNav"
  ].forEach(id => {

    const button =
      document.getElementById(id);

    if (!button) {
      return;
    }

    button.style.pointerEvents =
      "auto";

    button.style.position =
      "relative";

    button.style.zIndex =
      "1";

  });

})();