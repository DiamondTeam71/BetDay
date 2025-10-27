const firebaseConfig = {
  apiKey: "AIzaSyAtqi7D6Pn6JOdrscG1gBbpaB2R3PA_3Fk",
  authDomain: "srabonprogrammer-98739.firebaseapp.com",
  databaseURL: "https://srabonprogrammer-98739-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "srabonprogrammer-98739",
  storageBucket: "srabonprogrammer-98739.appspot.com",
  messagingSenderId: "213761619015",
  appId: "1:213761619015:web:YOUR_APP_ID"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

let windowUserUid = null;
let balance = 0;
let currentMultiplier = 1.0;

// ================= AUTH CHECK =================
auth.onAuthStateChanged(async user => {
  if (!user) {
    window.location.href = "UserLogin.html";
    return;
  }
  windowUserUid = user.uid;

  // Realtime balance setup
  const userBalanceRef = db.ref('users/' + user.uid + '/MainBalance');
  userBalanceRef.on('value', snapshot => {
    balance = snapshot.val() ?? 0;
    document.getElementById('balance').textContent = balance.toFixed(2);
  });

  // Load user default data if not exist
  const userRef = db.ref('users/' + user.uid);
  const snap = await userRef.once('value');
  if (!snap.exists()) {
    await userRef.set({
      email: user.email,
      username: "New User",
      dob: "Not Set",
      gender: "Not Set",
      phone: "Not Set",
      MainBalance: 500
    });
    balance = 500;
  }
});

// ================= SOUNDS =================
const clickSound = new Audio('assets/sounds/click.mp3');
const bombSound = new Audio('assets/sounds/explode.mp3');
const outSound = new Audio('assets/sounds/out.mp3');
const winSound = new Audio('assets/sounds/win.mp3');
const bgMusic = new Audio('assets/sounds/bg-music.mp3');
bgMusic.loop = true; bgMusic.volume = 0.4;
let musicStarted = false;
document.addEventListener('click', () => {
  if (!musicStarted) { bgMusic.play().catch(() => {}); musicStarted = true; }
}, { once: true });

// ================= GAME VARIABLES =================
const ROWS = 5, COLS = 5;
let BOMBS = 3;
const boardEl = document.getElementById('board');
const bombCountEl = document.getElementById('bombCount');
const bombInput = document.getElementById('bombInput');
const increaseBtn = document.getElementById('increase');
const decreaseBtn = document.getElementById('decrease');
const balanceEl = document.getElementById('balance');
const betInput = document.getElementById('betInput');
const betBtn = document.getElementById('betBtn');
const multiplierEl = document.getElementById('multiplierDisplay');
const cashoutBtn = document.getElementById('cashoutBtn');

let bombs = new Set(), revealed = new Set();
let disabled = false, gameStarted = false;
let safeClicks = 0, betAmount = 0;

// ================= HELPER FUNCTIONS =================
function playSound(sound){sound.currentTime=0; sound.play().catch(()=>{});}
function updateBalanceDisplay(){balanceEl.textContent = balance.toFixed(2);}
async function deduct(amount){
  if (!windowUserUid) return;
  balance = Math.max(0, balance - amount);
  await db.ref('users/'+windowUserUid+'/MainBalance').set(balance);
}
async function reward(amount){
  if (!windowUserUid) return;
  balance += amount;
  await db.ref('users/'+windowUserUid+'/MainBalance').set(balance);
}

// ================= MULTIPLIERS =================
function getMultiplierArray() {
  const multipliersByBombs = {
    1: [1.01, 1.05, 1.1, 1.15, 1.21, 1.28, 1.35, 1.43, 1.52, 1.62, 1.73, 1.87, 2.02, 2.2, 2.43, 2.62, 3.03, 3.46, 4.04, 4.65, 5.81, 7.75, 11.63, 23.25],
2: [1.05, 1.15, 1.26, 1.39, 1.53, 1.7, 1.9, 2.14, 2.43, 2.77, 3.2, 3.73,  4.41, 5.07, 6.2, 7.75, 9.96, 13.29, 18.6, 27.9, 16.5, 93, 279],
3: [1.1, 1.26, 1.45, 1.68, 1.96, 2.3, 2.73, 3.28, 3.98, 4.7, 5.88, 7.48, 9.72, 11.96, 17.83, 25.46, 38.2, 61.11, 106.95, 213.9, 534.75, 2139],
4: [1.15, 1.39, 1.68, 2.05, 2.53, 3.17, 4.01, 4.94, 6.46, 8.62, 11.75, 16.45, 35.65, 56.02, 93.37, 106, 336.13, 784.3, 2352.9, 11764.5, 12000],
5: [1.22, 1.53, 1.96, 2.53, 3.32, 4.25, 5.77, 7.98, 11.31, 16.45, 24.68, 38.39, 62.39, 106.95, 196.08, 392.15, 882.34, 2352.9, 8235.15, 49410.9],
6: [1.28, 1.7, 1.96, 2.3, 2.7, 3.17, 4.25, 6.07, 8.47, 13.31, 20.7, 32.91, 54.85, 95.98, 178, 356, 784, 1960, 5882.25],
7: [1.35, 2.73, 4.01, 5.77, 8.47, 14.05, 22.99, 39.04, 69.47, 130, 260, 564, 999, 1354, 3725, 12410.8, 58881, 447051],
8: [1.45, 3.2, 5.1, 7.8, 12.3, 19.8, 32.6, 55.9, 97.3, 176, 345, 795, 1860, 5240, 18850, 97400, 725000],
9: [1.55, 3.8, 6.2, 9.8, 15.7, 25.3, 40.8, 68.5, 122.6, 238.4, 485.7, 1054, 2560, 8450, 38600, 852657],
10: [1.65, 4.2, 6.9, 10.8, 17.3, 28.6, 46.3, 78.4, 142.7, 275.5, 560.2, 1260, 3150, 9850, 1285608],  
11: [1.73, 3.2, 5.88, 11.75, 54.85, 85.96, 130.26, 334.95, 949.03, 3036.91, 11383, 53145.92, 345485],
12: [1.73, 3.2, 5.88, 11.75, 54.85, 130.26, 334.95, 949.03, 1024.99, 3036.91, 53145.92, 345485],
13: [2.02, 4.23, 9.72, 23.77, 62.39, 178.25, 564.46, 2032.05, 8636.21, 46059.8, 3454485, 4836279],
15: [2.43, 6.2, 17.83, 56.02, 196.08, 784, 3725.43, 22352.55, 1899966.75, 3039946.8],
16: [2.69, 7.75, 25.46, 93.37, 302.15, 1960.75, 1241808, 11176275, 1899966.75],
17: [3.03, 9.96, 38.2, 168.06, 882.34, 5882.25, 55881.38, 1005864.75],
18: [3.46, 13.29, 61.11, 336.13, 2352.9, 23529, 447051],
19: [4.04, 18.6, 106.95, 784.3, 8235.15, 164703],
20: [4.65, 27.9, 213.9, 2532.9, 49410.9],
21: [5.81, 46.5, 534.75, 11764.5],
22: [7.75, 93, 213],
23: [11.63, 279],
24: [23.25]
  };

  let arr = multipliersByBombs[BOMBS] || multipliersByBombs[1];

  arr = arr.map(m => {
    if(m>1000) return m*0.4;
    if(m>100) return m*0.5;
    if(m>50) return m*0.6;
    if(m>20) return m*0.7;
    if(m>2) return m*0.99;
    return m;
  });

  arr = arr.map(m => (m<2 ? m*0.95 : m));
  return arr;
}

// ================= BOARD =================
function initBoard() {
  bombs.clear(); revealed.clear(); disabled=false; safeClicks=0; currentMultiplier=1.0;
  boardEl.innerHTML=''; BOMBS=parseInt(bombInput.value); bombCountEl.textContent=BOMBS;
  placeBombs(); updateMultiplierDisplay();
  for(let i=0;i<ROWS*COLS;i++){
    const cell=document.createElement('div');
    cell.className='cell'; cell.dataset.idx=i; cell.onclick=onClick;
    boardEl.appendChild(cell);
  }
}

function placeBombs(){
  bombs.clear();
  let bombProbability = betAmount>5?0.7:1.0;
  while(bombs.size<BOMBS){
    let idx = Math.floor(Math.random()*ROWS*COLS);
    if(Math.random()<bombProbability) bombs.add(idx);
  }
}

function updateMultiplierDisplay(bombedIndex=null){
  const arr=getMultiplierArray();
  const boxesToShow=4; const step=3;
  const groupIndex=Math.floor((safeClicks-1)/step);
  const visibleStart = groupIndex*step;
  const visibleEnd = Math.min(arr.length, visibleStart+boxesToShow);
  const visibleMultipliers = arr.slice(visibleStart,visibleEnd);
  multiplierEl.innerHTML='';
  visibleMultipliers.forEach((m,i)=>{
    const actualIndex = visibleStart+i;
    const box = document.createElement('span');
    box.textContent='x'+m.toFixed(2);
    box.style.padding='6px 12px';
    box.style.margin='10px';
    box.style.borderRadius='10px';
    box.style.fontWeight='700';
    box.style.display='inline-block';
    box.style.transition='all 0.3s ease';
    if(bombedIndex!==null && bombedIndex===actualIndex){ box.style.background='#e74c3c'; box.style.color='#fff'; }
    else if(actualIndex===safeClicks-1){ box.style.background='#2ecc71'; box.style.color='#fff'; }
    else if(actualIndex<safeClicks-1){
      if(m<arr[Math.max(0,safeClicks-1)]*0.5){ box.style.background='#f1c40f'; box.style.color='#000'; }
      else{ box.style.background='#3498db'; box.style.color='#fff'; }
    } else{ box.style.background='#555'; box.style.color='#ccc'; }
    multiplierEl.appendChild(box);
  });
  if(gameStarted && !disabled && betAmount>0){
    const cashValue = (betAmount*currentMultiplier).toFixed(2);
    cashoutBtn.innerHTML = `💰 ক্যাশআউট ৳${cashValue}`;
  }
}

// ================= GAME LOGIC =================
function onClick(e){
  if(!gameStarted || disabled) return;
  const cell=e.currentTarget; const idx=Number(cell.dataset.idx);
  if(revealed.has(idx)) return;
  revealed.add(idx); playSound(clickSound);

  if(bombs.has(idx)){
    playSound(bombSound); revealAll(idx); updateMultiplierDisplay(true);
    cashoutBtn.style.display='none'; showMessage(`💥 আপনি হেরে গেছেন! ${betAmount.toFixed(2)} টাকা হারিয়েছেন!`);
    betBtn.style.display='inline-block';
  } else {
    safeClicks++;
    const arr = getMultiplierArray();
    currentMultiplier = arr[Math.min(safeClicks-1,arr.length-1)];
    cell.classList.add('revealed','safe'); cell.innerHTML='<i class="fa-solid fa-gem"></i>';
    updateMultiplierDisplay();
    if(revealed.size===ROWS*COLS-BOMBS){
      disabled=true; revealAll();
      const winAmount=betAmount*currentMultiplier; reward(winAmount);
      playSound(winSound);
      showMessage(`🎉 আপনি সব গেম জিতেছেন! আপনার জেতা: ${winAmount.toFixed(2)} টাকা`);
      cashoutBtn.style.display='none'; betBtn.style.display='inline-block';
    }
  }
}

function revealAll(hitIdx){
  disabled=true;
  [...boardEl.children].forEach((c,i)=>{
    c.classList.add('revealed');
    if(bombs.has(i)){ c.classList.add('bomb'); c.innerHTML='<i class="fa-solid fa-bomb"></i>'; }
    else if(!c.innerHTML){ c.innerHTML='<i class="fa-solid fa-gem"></i>'; }
  });
  if(hitIdx!==undefined) boardEl.children[hitIdx]?.classList.add('explode');
}

function showMessage(text){
  const msg=document.createElement('div'); msg.textContent=text;
  msg.style.background='rgba(0,0,0,0.7)'; msg.style.padding='8px 16px';
  msg.style.marginTop='10px'; msg.style.borderRadius='8px'; msg.style.fontWeight='600';
  msg.style.color='#ffd166'; multiplierEl.appendChild(msg);
  setTimeout(()=>msg.remove(),2500);
}

// ================= BUTTONS =================
increaseBtn.onclick=()=>{ let v=parseInt(bombInput.value)||1; if(v<24) bombInput.value=v+1; };
decreaseBtn.onclick=()=>{ let v=parseInt(bombInput.value)||1; if(v>1) bombInput.value=v-1; };
bombInput.onchange=()=>{ let v=parseInt(bombInput.value)||1; bombInput.value=Math.min(Math.max(v,1),24); };

betBtn.onclick=async ()=>{
  if(gameStarted && !disabled) return;
  betAmount = parseInt(betInput.value)||10; betAmount=Math.min(Math.max(betAmount,10),100);
  if(balance>=betAmount){
    playSound(clickSound); await deduct(betAmount);
    initBoard(); gameStarted=true;
    showMessage(`🎯 আপনি ${betAmount.toFixed(2)} টাকা বেট করেছেন!`);
    cashoutBtn.style.display='inline-block'; betBtn.style.display='none';
    updateMultiplierDisplay();
  } else showMessage('⚠️ ব্যালেন্স যথেষ্ট নয়!');
};

cashoutBtn.onclick=async ()=>{
  if(!gameStarted || disabled) return;
  const cashValue = betAmount*currentMultiplier; await reward(cashValue);
  playSound(outSound); revealAll();
  disabled=true;
  showMessage(`💰 আপনি ক্যাশআউট করেছেন ৳${cashValue.toFixed(2)}!`);
  cashoutBtn.style.display='none'; betBtn.style.display='inline-block';
};

// ================= INIT =================
updateBalanceDisplay(); initBoard();



function enforceOfflineStrict(){
    if(!navigator.onLine){
        showOfflineOverlay();
        setTimeout(()=>window.location.replace("index.html"),2000);
    }
}

function showOfflineOverlay(){
    if(document.getElementById("offlineOverlay")) return;
    const overlay=document.createElement("div");
    overlay.id="offlineOverlay";
    overlay.style.position="fixed";
    overlay.style.top="0";
    overlay.style.left="0";
    overlay.style.width="100%";
    overlay.style.height="100%";
    overlay.style.backgroundColor="rgba(30,30,30,0.97)";
    overlay.style.color="white";
    overlay.style.display="flex";
    overlay.style.flexDirection="column";
    overlay.style.justifyContent="center";
    overlay.style.alignItems="center";
    overlay.style.zIndex="999999";
    overlay.style.fontFamily="'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    overlay.style.fontSize="32px";
    overlay.style.fontWeight="700";
    overlay.style.textAlign="center";
    overlay.style.pointerEvents="all";
    overlay.style.transition="all 0.6s ease-in-out";
    overlay.innerHTML=`
        <div style="margin-bottom:20px;font-size:60px;">⚠️</div>
        <div style="margin-bottom:15px;color:#ff4c4c;">Oops! You're Offline...</div>
        <div style="font-size:20px;color:#bbb;">Redirecting to Home Page...</div>
    `;
    document.body.appendChild(overlay);
    overlay.style.opacity="0";
    requestAnimationFrame(()=>overlay.style.opacity="1");
}

enforceOfflineStrict();
window.addEventListener('offline',()=>enforceOfflineStrict());
window.addEventListener('online',()=>console.log("Back online"));
auth.onAuthStateChanged(user=>{
    if(!user||!navigator.onLine) enforceOfflineStrict();
});