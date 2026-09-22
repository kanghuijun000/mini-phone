"use strict";

/* =========================================================
   Mini Phone - script.js
   ========================================================= */


/* =========================================================
   기본 함수
   ========================================================= */

function $(id) {
  return document.getElementById(id);
}


/* =========================================================
   저장소
   ========================================================= */

const STORAGE = {
  lockType: "miniPhone_lockType",
  lockValue: "miniPhone_lockValue",
  photos: "miniPhone_photos",
  memos: "miniPhone_memos",
  recent: "miniPhone_recent",
  background: "miniPhone_background",
  brightness: "miniPhone_brightness",
  sound: "miniPhone_sound"
};


/* =========================================================
   상태
   ========================================================= */

const state = {
  currentPage: "homePage",
  currentMemo: null,
  currentPhoto: null,

  cameraStream: null,
  flashlightStream: null,

  wifi: true,
  airplane: false,
  sound: true,
  flashlight: false,

  isPoweredOff: false,

  patternSetup: [],
  patternVerify: [],
  patternUnlock: []
};


/* =========================================================
   진동
   ========================================================= */

function vibrate(time = 20) {

  if (
    navigator.vibrate &&
    state.sound
  ) {
    navigator.vibrate(time);
  }

}


/* =========================================================
   페이지 이동
   ========================================================= */

function showPage(pageId) {

  if (state.isPoweredOff) {
    return;
  }

  document
    .querySelectorAll(".page")
    .forEach(page => {

      page.classList.add("hidden");

    });


  const page = $(pageId);

  if (!page) {
    return;
  }

  page.classList.remove("hidden");

  state.currentPage = pageId;


  if (pageId !== "homePage") {

    saveRecent(pageId);

  }

}


/* =========================================================
   앱 이름
   ========================================================= */

function getAppName(pageId) {

  const names = {
    phonePage: "전화",
    cameraPage: "카메라",
    galleryPage: "갤러리",
    memoPage: "메모",
    memoEditPage: "메모",
    clockPage: "시계",
    settingsPage: "설정",
    recentPage: "최근 앱",
    homePage: "홈"
  };

  return names[pageId] || "앱";

}


/* =========================================================
   최근 앱
   ========================================================= */

function saveRecent(pageId) {

  if (
    pageId === "homePage" ||
    pageId === "recentPage"
  ) {
    return;
  }

  let recent =
    JSON.parse(
      localStorage.getItem(STORAGE.recent) || "[]"
    );


  recent =
    recent.filter(
      item => item !== pageId
    );


  recent.unshift(pageId);


  recent =
    recent.slice(0, 8);


  localStorage.setItem(
    STORAGE.recent,
    JSON.stringify(recent)
  );

}


function renderRecent() {

  const list = $("recentList");

  if (!list) {
    return;
  }

  list.innerHTML = "";


  const recent =
    JSON.parse(
      localStorage.getItem(STORAGE.recent) || "[]"
    );


  if (recent.length === 0) {

    list.innerHTML =
      '<div class="recentCard">최근 앱이 없습니다.</div>';

    return;
  }


  recent.forEach(pageId => {

    const card =
      document.createElement("button");

    card.className = "recentCard";

    card.type = "button";

    card.textContent =
      getAppName(pageId);


    card.addEventListener(
      "click",
      () => {

        vibrate();

        showPage(pageId);

      }
    );


    list.appendChild(card);

  });

}


$("clearRecent").addEventListener(
  "click",
  () => {

    vibrate();

    localStorage.removeItem(
      STORAGE.recent
    );

    renderRecent();

  }
);


/* =========================================================
   홈 앱 실행
   ========================================================= */

document
  .querySelectorAll(".appIcon")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        if (state.isPoweredOff) {
          return;
        }

        vibrate();

        const app =
          button.dataset.app;


        const pages = {
          phone: "phonePage",
          camera: "cameraPage",
          gallery: "galleryPage",
          memo: "memoPage",
          clock: "clockPage",
          settings: "settingsPage"
        };


        if (pages[app]) {

          if (app === "gallery") {
            renderGallery();
          }

          if (app === "memo") {
            renderMemos();
          }

          if (app === "settings") {
            updateLockStatus();
          }

          showPage(pages[app]);

        }

      }
    );

  });


/* =========================================================
   앱 내부 뒤로가기
   ========================================================= */

document
  .querySelectorAll(".backApp")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        vibrate();

        showPage("homePage");

      }
    );

  });


$("memoEditBack").addEventListener(
  "click",
  () => {

    vibrate();

    showPage("memoPage");

  }
);


/* =========================================================
   하단 네비게이션
   ========================================================= */

function handleNavigation(action) {

  if (state.isPoweredOff) {
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


  if (action === "back") {

    if (
      state.currentPage === "homePage" ||
      state.currentPage === "recentPage"
    ) {

      return;

    }


    showPage("homePage");

  }

}


$("homeNav").addEventListener(
  "click",
  event => {

    event.stopPropagation();

    handleNavigation("home");

  }
);


$("recentNav").addEventListener(
  "click",
  event => {

    event.stopPropagation();

    handleNavigation("recent");

  }
);


$("backNav").addEventListener(
  "click",
  event => {

    event.stopPropagation();

    handleNavigation("back");

  }
);


/* =========================================================
   시간
   ========================================================= */

function updateClock() {

  const now = new Date();

  const hours =
    String(now.getHours()).padStart(2, "0");

  const minutes =
    String(now.getMinutes()).padStart(2, "0");

  const seconds =
    String(now.getSeconds()).padStart(2, "0");


  const time =
    `${hours}:${minutes}`;

  const fullTime =
    `${hours}:${minutes}:${seconds}`;


  const date =
    now.toLocaleDateString(
      "ko-KR",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long"
      }
    );


  if ($("statusTime")) {
    $("statusTime").textContent = time;
  }

  if ($("homeClock")) {
    $("homeClock").textContent = time;
  }

  if ($("lockTime")) {
    $("lockTime").textContent = time;
  }

  if ($("bigClock")) {
    $("bigClock").textContent = fullTime;
  }

  if ($("homeDate")) {
    $("homeDate").textContent = date;
  }

  if ($("lockDate")) {
    $("lockDate").textContent = date;
  }

  if ($("bigDate")) {
    $("bigDate").textContent = date;
  }

}


updateClock();

setInterval(
  updateClock,
  1000
);


/* =========================================================
   전화
   ========================================================= */

$("callButton").addEventListener(
  "click",
  () => {

    vibrate();

    const number =
      $("phoneNumber").value.trim();


    if (!number) {

      $("callResult").textContent =
        "전화번호를 입력하세요.";

      return;

    }


    const cleaned =
      number.replace(
        /[^0-9+#*]/g,
        ""
      );


    if (!cleaned) {

      $("callResult").textContent =
        "올바른 전화번호를 입력하세요.";

      return;

    }


    /*
      브라우저가 실제 전화 기능을 지원하는
      모바일 기기에서는 전화 앱을 호출한다.
    */

    $("callResult").textContent =
      `${number}로 전화를 연결합니다.`;


    window.location.href =
      `tel:${cleaned}`;

  }
);


/* =========================================================
   카메라
   ========================================================= */

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


  stopCamera();


  try {

    state.cameraStream =
      await navigator.mediaDevices.getUserMedia({

        video: {
          facingMode: {
            ideal: "environment"
          }
        },

        audio: false

      });


    $("cameraVideo").srcObject =
      state.cameraStream;


    await $("cameraVideo").play();


  } catch (error) {

    console.error(error);

    alert(
      "카메라 권한을 허용해야 카메라를 사용할 수 있습니다."
    );

  }

}


function stopCamera() {

  if (state.cameraStream) {

    state.cameraStream
      .getTracks()
      .forEach(track => {

        track.stop();

      });

    state.cameraStream = null;

  }


  if ($("cameraVideo")) {

    $("cameraVideo").srcObject =
      null;

  }

}


$("startCamera").addEventListener(
  "click",
  () => {

    vibrate();

    startCamera();

  }
);


$("stopCamera").addEventListener(
  "click",
  () => {

    vibrate();

    stopCamera();

  }
);


/* =========================================================
   사진 촬영
   ========================================================= */

$("takePhoto").addEventListener(
  "click",
  () => {

    vibrate();

    if (!state.cameraStream) {

      alert(
        "먼저 카메라를 켜세요."
      );

      return;

    }


    const video =
      $("cameraVideo");

    const canvas =
      $("photoCanvas");


    canvas.width =
      video.videoWidth ||
      720;

    canvas.height =
      video.videoHeight ||
      960;


    const context =
      canvas.getContext("2d");


    context.drawImage(
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


    let photos =
      JSON.parse(
        localStorage.getItem(STORAGE.photos) || "[]"
      );


    photos.unshift({
      id: Date.now(),
      image
    });


    /*
      브라우저 저장공간을 너무 많이 사용하지
      않도록 최근 사진 50장까지만 유지한다.
    */

    photos =
      photos.slice(0, 50);


    localStorage.setItem(
      STORAGE.photos,
      JSON.stringify(photos)
    );


    alert("사진이 저장되었습니다.");

  }
);


/* =========================================================
   갤러리
   ========================================================= */

function renderGallery() {

  const grid =
    $("galleryGrid");

  if (!grid) {
    return;
  }

  grid.innerHTML = "";


  const photos =
    JSON.parse(
      localStorage.getItem(STORAGE.photos) || "[]"
    );


  if (photos.length === 0) {

    grid.innerHTML =
      '<div class="recentCard">저장된 사진이 없습니다.</div>';

    return;

  }


  photos.forEach(photo => {

    const item =
      document.createElement("div");

    item.className =
      "galleryItem";


    const image =
      document.createElement("img");

    image.src =
      photo.image;

    image.alt =
      "저장된 사진";


    image.addEventListener(
      "click",
      () => {

        vibrate();

        state.currentPhoto =
          photo.id;

        $("viewerImage").src =
          photo.image;

        $("photoViewer")
          .classList
          .remove("hidden");

      }
    );


    const deleteButton =
      document.createElement("button");

    deleteButton.className =
      "galleryDelete";

    deleteButton.type =
      "button";

    deleteButton.textContent =
      "×";


    deleteButton.addEventListener(
      "click",
      event => {

        event.stopPropagation();

        vibrate();

        deletePhoto(photo.id);

        renderGallery();

      }
    );


    item.appendChild(image);

    item.appendChild(deleteButton);

    grid.appendChild(item);

  });

}


function deletePhoto(id) {

  let photos =
    JSON.parse(
      localStorage.getItem(STORAGE.photos) || "[]"
    );


  photos =
    photos.filter(
      photo => photo.id !== id
    );


  localStorage.setItem(
    STORAGE.photos,
    JSON.stringify(photos)
  );

}


$("closePhotoViewer").addEventListener(
  "click",
  () => {

    vibrate();

    $("photoViewer")
      .classList
      .add("hidden");

    state.currentPhoto = null;

  }
);


$("deleteCurrentPhoto").addEventListener(
  "click",
  () => {

    vibrate();

    if (state.currentPhoto === null) {
      return;
    }


    deletePhoto(
      state.currentPhoto
    );


    state.currentPhoto = null;


    $("photoViewer")
      .classList
      .add("hidden");


    renderGallery();

  }
);


$("deleteAllPhotos").addEventListener(
  "click",
  () => {

    vibrate();

    if (
      !confirm(
        "저장된 사진을 모두 삭제할까요?"
      )
    ) {
      return;
    }


    localStorage.removeItem(
      STORAGE.photos
    );


    renderGallery();

  }
);


/* =========================================================
   메모
   ========================================================= */

function getMemos() {

  return JSON.parse(
    localStorage.getItem(
      STORAGE.memos
    ) || "[]"
  );

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


  list.innerHTML = "";


  const memos =
    getMemos();


  if (memos.length === 0) {

    list.innerHTML =
      '<div class="memoCard">저장된 메모가 없습니다.</div>';

    return;

  }


  memos.forEach(memo => {

    const card =
      document.createElement("button");

    card.className =
      "memoCard";

    card.type =
      "button";


    const title =
      document.createElement("h3");

    title.textContent =
      memo.title ||
      "제목 없음";


    const content =
      document.createElement("p");

    content.textContent =
      memo.content ||
      "";


    card.appendChild(title);

    card.appendChild(content);


    card.addEventListener(
      "click",
      () => {

        vibrate();

        state.currentMemo =
          memo.id;


        $("memoTitle").value =
          memo.title || "";


        $("memoContent").value =
          memo.content || "";


        showPage("memoEditPage");

      }
    );


    list.appendChild(card);

  });

}


$("newMemoButton").addEventListener(
  "click",
  () => {

    vibrate();

    state.currentMemo = null;

    $("memoTitle").value = "";

    $("memoContent").value = "";

    showPage("memoEditPage");

  }
);


$("saveMemo").addEventListener(
  "click",
  () => {

    vibrate();

    const title =
      $("memoTitle").value.trim();

    const content =
      $("memoContent").value.trim();


    let memos =
      getMemos();


    if (state.currentMemo === null) {

      memos.unshift({

        id: Date.now(),

        title,

        content

      });

    } else {

      const memo =
        memos.find(
          item =>
            item.id === state.currentMemo
        );


      if (memo) {

        memo.title =
          title;

        memo.content =
          content;

      }

    }


    saveMemos(memos);

    state.currentMemo = null;

    renderMemos();

    showPage("memoPage");

  }
);


$("deleteMemo").addEventListener(
  "click",
  () => {

    vibrate();

    if (state.currentMemo === null) {

      showPage("memoPage");

      return;

    }


    let memos =
      getMemos();


    memos =
      memos.filter(
        memo =>
          memo.id !== state.currentMemo
      );


    saveMemos(memos);

    state.currentMemo = null;

    renderMemos();

    showPage("memoPage");

  }
);


/* =========================================================
   잠금 관련
   ========================================================= */

function getLockType() {

  return localStorage.getItem(
    STORAGE.lockType
  );

}


function getLockValue() {

  return localStorage.getItem(
    STORAGE.lockValue
  );

}


function updateLockStatus() {

  const type =
    getLockType();


  if (!type) {

    $("lockStatus").textContent =
      "잠금 없음";

    return;

  }


  if (type === "pin") {

    $("lockStatus").textContent =
      "PIN 잠금 사용 중";

  }


  if (type === "pattern") {

    $("lockStatus").textContent =
      "패턴 잠금 사용 중";

  }

}


/* =========================================================
   PIN 설정
   ========================================================= */

let lockChangeMode =
  null;


function openPinSetup() {

  $("pinSetupOverlay")
    .classList
    .remove("hidden");


  $("setupPinInput").value =
    "";

  $("setupPinConfirm").value =
    "";

}


$("setPin").addEventListener(
  "click",
  () => {

    vibrate();

    if (getLockType()) {

      lockChangeMode =
        "pin";

      beginCurrentLockVerification();

      return;

    }


    lockChangeMode =
      "pin";

    openPinSetup();

  }
);


$("confirmPinSetup").addEventListener(
  "click",
  () => {

    vibrate();

    const pin =
      $("setupPinInput")
        .value
        .trim();

    const confirmPin =
      $("setupPinConfirm")
        .value
        .trim();


    if (!/^\d{4,6}$/.test(pin)) {

      alert(
        "PIN은 숫자 4~6자리로 입력하세요."
      );

      return;

    }


    if (pin !== confirmPin) {

      alert(
        "두 PIN이 일치하지 않습니다."
      );

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

  }
);


/* =========================================================
   패턴 설정
   ========================================================= */

let setupPattern =
  [];


$("setPattern").addEventListener(
  "click",
  () => {

    vibrate();

    if (getLockType()) {

      lockChangeMode =
        "pattern";

      beginCurrentLockVerification();

      return;

    }


    lockChangeMode =
      "pattern";

    openPatternSetup();

  }
);


function openPatternSetup() {

  setupPattern = [];

  $("patternSetupOverlay")
    .classList
    .remove("hidden");


  createPatternBoard(
    $("setupBoard"),
    pattern => {

      setupPattern =
        [...pattern];

    }
  );

}


$("confirmPattern").addEventListener(
  "click",
  () => {

    vibrate();


    if (
      setupPattern.length < 4
    ) {

      alert(
        "패턴은 최소 4개의 점을 연결해야 합니다."
      );

      return;

    }


    localStorage.setItem(
      STORAGE.lockType,
      "pattern"
    );


    localStorage.setItem(
      STORAGE.lockValue,
      setupPattern.join("-")
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


/* =========================================================
   잠금 삭제
   ========================================================= */

$("removeLock").addEventListener(
  "click",
  () => {

    vibrate();

    if (!getLockType()) {

      alert(
        "현재 설정된 잠금이 없습니다."
      );

      return;

    }


    lockChangeMode =
      "remove";


    beginCurrentLockVerification();

  }
);


/* =========================================================
   현재 잠금 확인
   ========================================================= */

let verifiedCurrentLock =
  false;


function beginCurrentLockVerification() {

  verifiedCurrentLock =
    false;


  const type =
    getLockType();


  if (type === "pin") {

    $("verifyLockOverlay")
      .classList
      .remove("hidden");


    $("verifyPin")
      .classList
      .remove("hidden");


    $("verifyBoard")
      .classList
      .add("hidden");


    $("verifyPin").value =
      "";


    return;

  }


  if (type === "pattern") {

    $("verifyLockOverlay")
      .classList
      .remove("hidden");


    $("verifyPin")
      .classList
      .add("hidden");


    $("verifyBoard")
      .classList
      .remove("hidden");


    state.patternVerify = [];


    createPatternBoard(
      $("verifyBoard"),
      pattern => {

        state.patternVerify =
          [...pattern];

      }
    );

  }

}


$("verifyLockButton").addEventListener(
  "click",
  () => {

    vibrate();


    const type =
      getLockType();


    let correct =
      false;


    if (type === "pin") {

      correct =
        $("verifyPin")
          .value
          .trim() ===
        getLockValue();

    }


    if (type === "pattern") {

      correct =
        state.patternVerify.join("-") ===
        getLockValue();

    }


    if (!correct) {

      alert(
        type === "pin"
          ? "현재 PIN이 올바르지 않습니다."
          : "현재 패턴이 올바르지 않습니다."
      );


      if (type === "pin") {

        $("verifyPin").value =
          "";

      } else {

        state.patternVerify = [];

        createPatternBoard(
          $("verifyBoard"),
          pattern => {

            state.patternVerify =
              [...pattern];

          }
        );

      }

      return;

    }


    verifiedCurrentLock =
      true;


    $("verifyLockOverlay")
      .classList
      .add("hidden");


    if (lockChangeMode === "remove") {

      localStorage.removeItem(
        STORAGE.lockType
      );

      localStorage.removeItem(
        STORAGE.lockValue
      );


      updateLockStatus();


      alert(
        "잠금이 삭제되었습니다."
      );


      return;

    }


    if (lockChangeMode === "pin") {

      openPinSetup();

      return;

    }


    if (lockChangeMode === "pattern") {

      openPatternSetup();

    }

  }
);


$("closeVerifyLock").addEventListener(
  "click",
  () => {

    vibrate();

    $("verifyLockOverlay")
      .classList
      .add("hidden");

    lockChangeMode =
      null;

  }
);


/* =========================================================
   패턴 입력 엔진
   ========================================================= */

function createPatternBoard(
  board,
  onComplete
) {

  if (!board) {
    return;
  }


  const canvas =
    board.querySelector("canvas");


  const dots =
    [...board.querySelectorAll("i")];


  if (!canvas || dots.length !== 9) {
    return;
  }


  let pattern = [];

  let drawing = false;

  let pointerId = null;


  function resize() {

    const rect =
      board.getBoundingClientRect();


    canvas.width =
      rect.width;

    canvas.height =
      rect.height;

  }


  resize();


  function getPosition(event) {

    const rect =
      board.getBoundingClientRect();


    return {

      x:
        event.clientX -
        rect.left,

      y:
        event.clientY -
        rect.top

    };

  }


  function getCenter(index) {

    const dot =
      dots[index];


    const boardRect =
      board.getBoundingClientRect();

    const dotRect =
      dot.getBoundingClientRect();


    return {

      x:
        dotRect.left -
        boardRect.left +
        dotRect.width / 2,

      y:
        dotRect.top -
        boardRect.top +
        dotRect.height / 2

    };

  }


  function findDot(x, y) {

    let nearest =
      null;

    let nearestDistance =
      Infinity;


    dots.forEach(
      (dot, index) => {

        const center =
          getCenter(index);


        const dx =
          center.x - x;

        const dy =
          center.y - y;


        const distance =
          Math.sqrt(
            dx * dx +
            dy * dy
          );


        if (
          distance < nearestDistance
        ) {

          nearestDistance =
            distance;

          nearest =
            index;

        }

      }
    );


    return nearestDistance <= 38
      ? nearest
      : null;

  }


  function clear() {

    pattern = [];


    dots.forEach(
      dot => {

        dot.classList.remove(
          "active"
        );

      }
    );


    const ctx =
      canvas.getContext("2d");


    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

  }


  function addDot(index) {

    if (
      index === null ||
      index === undefined
    ) {

      return;

    }


    if (
      pattern.includes(index)
    ) {

      return;

    }


    /*
      실제 패턴 잠금처럼
      두 점 사이의 정확한 중간점이 존재하고
      아직 선택되지 않았다면 자동 연결한다.
    */

    if (pattern.length > 0) {

      const previous =
        pattern[
          pattern.length - 1
        ];


      const previousRow =
        Math.floor(previous / 3);

      const previousCol =
        previous % 3;


      const currentRow =
        Math.floor(index / 3);

      const currentCol =
        index % 3;


      const rowDifference =
        currentRow -
        previousRow;

      const colDifference =
        currentCol -
        previousCol;


      if (
        Math.abs(rowDifference) === 2 &&
        colDifference === 0
      ) {

        const middle =
          (
            previousRow +
            currentRow
          ) / 2 * 3 +
          currentCol;


        if (
          !pattern.includes(middle)
        ) {

          pattern.push(middle);

          dots[middle]
            .classList
            .add("active");

        }

      }


      if (
        Math.abs(colDifference) === 2 &&
        rowDifference === 0
      ) {

        const middle =
          currentRow * 3 +
          (
            previousCol +
            currentCol
          ) / 2;


        if (
          !pattern.includes(middle)
        ) {

          pattern.push(middle);

          dots[middle]
            .classList
            .add("active");

        }

      }


      if (
        Math.abs(rowDifference) === 2 &&
        Math.abs(colDifference) === 2
      ) {

        const middleRow =
          (
            previousRow +
            currentRow
          ) / 2;


        const middleCol =
          (
            previousCol +
            currentCol
          ) / 2;


        const middle =
          middleRow * 3 +
          middleCol;


        if (
          !pattern.includes(middle)
        ) {

          pattern.push(middle);

          dots[middle]
            .classList
            .add("active");

        }

      }

    }


    pattern.push(index);


    dots[index]
      .classList
      .add("active");

  }


  function draw(
    temporaryX = null,
    temporaryY = null
  ) {

    const ctx =
      canvas.getContext("2d");


    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );


    if (pattern.length === 0) {
      return;
    }


    ctx.lineWidth =
      5;

    ctx.lineCap =
      "round";

    ctx.lineJoin =
      "round";


    ctx.beginPath();


    const first =
      getCenter(
        pattern[0]
      );


    ctx.moveTo(
      first.x,
      first.y
    );


    for (
      let i = 1;
      i < pattern.length;
      i++
    ) {

      const point =
        getCenter(
          pattern[i]
        );


      ctx.lineTo(
        point.x,
        point.y
      );

    }


    if (
      temporaryX !== null &&
      temporaryY !== null
    ) {

      ctx.lineTo(
        temporaryX,
        temporaryY
      );

    }


    ctx.stroke();

  }


  function finish() {

    drawing =
      false;


    if (
      pointerId !== null
    ) {

      try {

        board.releasePointerCapture(
          pointerId
        );

      } catch (error) {}

    }


    pointerId =
      null;


    draw();


    if (
      pattern.length >= 4
    ) {

      onComplete(
        [...pattern]
      );

    } else {

      alert(
        "패턴은 최소 4개의 점을 연결해야 합니다."
      );


      clear();


      onComplete([]);

    }

  }


  board.onpointerdown =
    event => {

      event.preventDefault();


      clear();


      drawing =
        true;

      pointerId =
        event.pointerId;


      try {

        board.setPointerCapture(
          event.pointerId
        );

      } catch (error) {}


      const position =
        getPosition(event);


      const index =
        findDot(
          position.x,
          position.y
        );


      addDot(index);


      draw(
        position.x,
        position.y
      );

    };


  board.onpointermove =
    event => {

      if (!drawing) {
        return;
      }


      event.preventDefault();


      const position =
        getPosition(event);


      const index =
        findDot(
          position.x,
          position.y
        );


      addDot(index);


      draw(
        position.x,
        position.y
      );

    };


  board.onpointerup =
    event => {

      if (!drawing) {
        return;
      }


      event.preventDefault();

      finish();

    };


  board.onpointercancel =
    () => {

      if (!drawing) {
        return;
      }


      drawing =
        false;

      pointerId =
        null;

      clear();

      onComplete([]);

    };

}


/* =========================================================
   잠금 화면
   ========================================================= */

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


    $("unlockPin").value =
      "";


    return;

  }


  if (type === "pattern") {

    $("pinUnlock")
      .classList
      .add("hidden");


    $("patternUnlock")
      .classList
      .remove("hidden");


    state.patternUnlock =
      [];


    createPatternBoard(
      $("unlockBoard"),
      pattern => {

        state.patternUnlock =
          [...pattern];

      }
    );

  }

}


$("unlockPinButton").addEventListener(
  "click",
  () => {

    vibrate();


    if (
      $("unlockPin")
        .value
        .trim() ===
      getLockValue()
    ) {

      unlockPhone();

    } else {

      alert(
        "PIN이 올바르지 않습니다."
      );


      $("unlockPin").value =
        "";

    }

  }
);


function unlockPhone() {

  $("lockScreen")
    .classList
    .add("hidden");


  state.currentPage =
    "homePage";


  showPage("homePage");

}


$("unlockBoard").addEventListener(
  "pointerup",
  () => {

    setTimeout(
      () => {

        if (
          state.patternUnlock.join("-") ===
          getLockValue()
        ) {

          unlockPhone();

        } else if (
          state.patternUnlock.length >= 4
        ) {

          alert(
            "패턴이 올바르지 않습니다."
          );


          state.patternUnlock =
            [];


          createPatternBoard(
            $("unlockBoard"),
            pattern => {

              state.patternUnlock =
                [...pattern];

            }
          );

        }

      },
      50
    );

  }
);


/* =========================================================
   배경화면
   ========================================================= */

function applyBackground(value) {

  const phone =
    $("phone");


  if (!phone) {
    return;
  }


  if (value === "default") {

    phone.style.background =
      "#000";

    return;

  }


  if (value === "blue") {

    phone.style.background =
      "linear-gradient(160deg,#071b35,#164f8a)";

    return;

  }


  if (value === "purple") {

    phone.style.background =
      "linear-gradient(160deg,#1b092d,#6b2a83)";

    return;

  }


  if (value === "green") {

    phone.style.background =
      "linear-gradient(160deg,#062b1a,#18734a)";

    return;

  }


  if (
    value.startsWith("data:image")
  ) {

    phone.style.background =
      `url("${value}") center/cover no-repeat`;

  }

}


function loadBackground() {

  const saved =
    localStorage.getItem(
      STORAGE.background
    );


  if (saved) {

    applyBackground(saved);

  }

}


document
  .querySelectorAll("[data-bg]")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        vibrate();

        const value =
          button.dataset.bg;


        localStorage.setItem(
          STORAGE.background,
          value
        );


        applyBackground(value);

      }
    );

  });


/* =========================================================
   빠른 설정
   ========================================================= */

const quickPanel =
  $("quickPanel");


let gestureStartY =
  null;

let gestureActive =
  false;

let gestureSource =
  null;

let gestureHandled =
  false;


function resetGesture() {

  gestureStartY =
    null;

  gestureActive =
    false;

  gestureSource =
    null;

  gestureHandled =
    false;

}


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


function getPhoneLocalY(clientY) {

  const rect =
    $("phone")
      .getBoundingClientRect();


  return clientY -
    rect.top;

}


/*
  중요:
  빠른 설정을 여는 시작점은
  휴대폰 화면의 최상단 80px 이내다.
*/

$("phone").addEventListener(
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
      getPhoneLocalY(
        event.clientY
      );


    gestureActive =
      true;


    gestureSource =
      "screen";


    gestureHandled =
      false;

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
      getPhoneLocalY(
        event.clientY
      );


    const difference =
      currentY -
      gestureStartY;


    if (
      !quickPanel
        .classList
        .contains("open") &&

      gestureSource ===
        "screen" &&

      gestureStartY <= 100 &&

      difference >= 45
    ) {

      gestureHandled =
        true;


      openQuickPanel();


      resetGesture();

      return;

    }


    if (
      quickPanel
        .classList
        .contains("open") &&

      gestureSource ===
        "screen" &&

      difference <= -45
    ) {

      gestureHandled =
        true;


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
      getPhoneLocalY(
        event.clientY
      );


    const difference =
      currentY -
      gestureStartY;


    if (
      !gestureHandled &&

      gestureSource ===
        "screen" &&

      !quickPanel
        .classList
        .contains("open") &&

      gestureStartY <= 100 &&

      difference >= 45
    ) {

      openQuickPanel();

    }


    else if (
      !gestureHandled &&

      gestureSource ===
        "screen" &&

      quickPanel
        .classList
        .contains("open") &&

      difference <= -45
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


/* 빠른 설정창 자체에서 위로 스와이프 */

quickPanel.addEventListener(
  "pointerdown",
  event => {

    if (state.isPoweredOff) {
      return;
    }


    gestureStartY =
      event.clientY;


    gestureActive =
      true;


    gestureSource =
      "quickPanel";


    gestureHandled =
      false;


    event.stopPropagation();

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
      gestureStartY <= -45
    ) {

      gestureHandled =
        true;


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
      gestureStartY <= -45
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


/* =========================================================
   밝기
   ========================================================= */

const brightness =
  $("brightness");


function applyBrightness(value) {

  const screen =
    $("screen");


  if (!screen) {
    return;
  }


  /*
    완전히 어두워지지 않도록 최소 밝기 제한
  */

  const normalized =
    Number(value);


  screen.style.filter =
    `brightness(${normalized}%)`;

}


function loadBrightness() {

  const saved =
    localStorage.getItem(
      STORAGE.brightness
    );


  const value =
    saved === null
      ? 100
      : Number(saved);


  brightness.value =
    value;


  applyBrightness(value);

}


brightness.addEventListener(
  "input",
  () => {

    const value =
      Number(
        brightness.value
      );


    localStorage.setItem(
      STORAGE.brightness,
      value
    );


    applyBrightness(value);

  }
);


/* =========================================================
   Wi-Fi
   ========================================================= */

function updateWifiButton() {

  $("wifiButton")
    .classList
    .toggle(
      "active",
      state.wifi
    );

}


$("wifiButton").addEventListener(
  "click",
  event => {

    event.stopPropagation();

    vibrate();


    if (state.airplane) {
      return;
    }


    state.wifi =
      !state.wifi;


    updateWifiButton();

  }
);


/* =========================================================
   비행기 모드
   ========================================================= */

function updateAirplaneButton() {

  $("airplaneButton")
    .classList
    .toggle(
      "active",
      state.airplane
    );

}


$("airplaneButton").addEventListener(
  "click",
  event => {

    event.stopPropagation();

    vibrate();


    state.airplane =
      !state.airplane;


    if (state.airplane) {

      state.wifi =
        false;


      updateWifiButton();

    }


    updateAirplaneButton();

  }
);


/* =========================================================
   소리
   ========================================================= */

function updateSoundButton() {

  $("soundButton")
    .classList
    .toggle(
      "active",
      state.sound
    );


  $("soundText").textContent =
    state.sound
      ? "소리"
      : "무음";

}


function loadSound() {

  const saved =
    localStorage.getItem(
      STORAGE.sound
    );


  if (saved === "false") {

    state.sound =
      false;

  }


  updateSoundButton();

}


$("soundButton").addEventListener(
  "click",
  event => {

    event.stopPropagation();


    state.sound =
      !state.sound;


    localStorage.setItem(
      STORAGE.sound,
      String(state.sound)
    );


    updateSoundButton();


    if (state.sound) {

      if (navigator.vibrate) {
        navigator.vibrate(20);
      }

    }

  }
);


/* =========================================================
   실제 손전등
   ========================================================= */

async function enableTorch() {

  if (
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia
  ) {

    alert(
      "이 브라우저에서는 실제 손전등 기능을 사용할 수 없습니다."
    );

    return false;

  }


  try {

    if (!state.flashlightStream) {

      state.flashlightStream =
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
      state.flashlightStream
        .getVideoTracks()[0];


    if (
      !track ||
      !track.getCapabilities
    ) {

      throw new Error(
        "torch unsupported"
      );

    }


    const capabilities =
      track.getCapabilities();


    if (!capabilities.torch) {

      throw new Error(
        "torch unsupported"
      );

    }


    await track.applyConstraints({

      advanced: [
        {
          torch: true
        }
      ]

    });


    return true;

  } catch (error) {

    console.error(error);


    if (
      state.flashlightStream
    ) {

      state.flashlightStream
        .getTracks()
        .forEach(
          track => track.stop()
        );


      state.flashlightStream =
        null;

    }


    alert(
      "이 기기 또는 브라우저에서는 실제 손전등 제어를 지원하지 않습니다."
    );


    return false;

  }

}


async function disableTorch() {

  if (!state.flashlightStream) {
    return;
  }


  const track =
    state.flashlightStream
      .getVideoTracks()[0];


  if (track) {

    try {

      await track.applyConstraints({

        advanced: [
          {
            torch: false
          }
        ]

      });

    } catch (error) {}

  }


  state.flashlightStream
    .getTracks()
    .forEach(
      track => track.stop()
    );


  state.flashlightStream =
    null;

}


$("flashButton").addEventListener(
  "click",
  async event => {

    event.stopPropagation();

    vibrate();


    if (!state.flashlight) {

      const success =
        await enableTorch();


      if (!success) {
        return;
      }


      state.flashlight =
        true;


      $("flashButton")
        .classList
        .add("active");


    } else {

      await disableTorch();


      state.flashlight =
        false;


      $("flashButton")
        .classList
        .remove("active");

    }

  }
);


/* =========================================================
   전원 버튼
   ========================================================= */

$("powerButton").addEventListener(
  "click",
  event => {

    event.stopPropagation();


    if (state.isPoweredOff) {

      powerOn();

      return;

    }


    vibrate();

    powerOff();

  }
);


function powerOff() {

  state.isPoweredOff =
    true;


  stopCamera();

  disableTorch();

  closeQuickPanel();


  $("bottomNav")
    .classList
    .add("powerHidden");


  $("statusBar").style.display =
    "none";


  /*
    전원 OFF 화면은 검은색으로만 만든다.
    별도의 전원 켜기 버튼은 표시하지 않는다.
  */

  $("powerOffOverlay")
    .classList
    .remove("hidden");

}


function powerOn() {

  state.isPoweredOff =
    false;


  $("powerOffOverlay")
    .classList
    .add("hidden");


  $("bottomNav")
    .classList
    .remove("powerHidden");


  $("statusBar").style.display =
    "flex";


  showLockScreen();

}


/* =========================================================
   전원 OFF 상태에서 전원 버튼이 항상 눌리도록
   ========================================================= */

$("powerOffOverlay").style.pointerEvents =
  "none";


/* =========================================================
   초기화
   ========================================================= */

loadBackground();

loadBrightness();

loadSound();

updateWifiButton();

updateAirplaneButton();

updateLockStatus();

renderGallery();

renderMemos();

renderRecent();

updateClock();


/*
  기존 잠금이 있다면 부팅 시 잠금 화면,
  없다면 홈 화면.
*/

if (getLockType()) {

  showLockScreen();

} else {

  $("lockScreen")
    .classList
    .add("hidden");

  showPage("homePage");

}


/* =========================================================
   화면 크기 변경 시 패턴 캔버스 갱신
   ========================================================= */

window.addEventListener(
  "resize",
  () => {

    updateClock();

  }
);