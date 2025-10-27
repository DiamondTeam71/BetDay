const clickSound = new Audio('assets/sounds/click.mp3');
const crashSound = new Audio('assets/sounds/explode.mp3');
const cashoutSound = new Audio('assets/sounds/out.mp3');

function playSound(s) {
    if (!s) return;
    if (!s.paused) s.pause();
    s.currentTime = 0;
    s.play().catch(() => {});
}

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

const multiplierDisplay = document.getElementById('multiplierDisplay');
const multiplierFill = document.getElementById('multiplierFill');
const crashDisplay = document.getElementById('crashDisplay');
const userList = document.getElementById('userList');
const balanceEl = document.getElementById('userBalance');
const betSection = document.getElementById('betSection');
const cashoutSection = document.getElementById('cashoutSection');
const betInput = document.getElementById('betAmount');
const placeBetBtn = document.getElementById('placeBetBtn');
const cashoutBtn = document.getElementById('cashoutBtn');
const crashHistoryEl = document.getElementById('crashHistory');

let uid = null,
    balance = 0,
    userBet = null,
    cashedOut = false,
    roundActive = false,
    multiplier = 1.0,
    targetMultiplier = 1.0,
    lastUpdateTime = performance.now(),
    currentRoundId = null,
    currentUsername = "User",
    liveUserListListener = null,
    multiplierAnimRunning = false,
    crashPlayed = false;

auth.onAuthStateChanged(async user => {
    if (!user) { window.location.href = "UserLogin.html"; return; }
    uid = user.uid;
    db.ref(`users/${uid}/MainBalance`).on('value', s => {
        balance = parseFloat(s.val() || 0);
        balanceEl.innerText = balance.toFixed(2);
    });
    db.ref(`users/${uid}/username`).on('value', s => {
        currentUsername = s.val() || "User";
    });
});

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

function popup(m, c = "limegreen") {
    const b = document.createElement("div");
    b.innerText = m;
    b.style.position = "fixed";
    b.style.top = "50%";
    b.style.left = "50%";
    b.style.transform = "translate(-50%,-50%)";
    b.style.background = c;
    b.style.color = "white";
    b.style.padding = "20px 30px";
    b.style.borderRadius = "12px";
    b.style.fontSize = "18px";
    b.style.fontWeight = "bold";
    b.style.textAlign = "center";
    b.style.boxShadow = "0 0 15px rgba(0,0,0,0.3)";
    b.style.opacity = "0";
    b.style.transition = "opacity 0.4s ease-in-out";
    document.body.appendChild(b);
    requestAnimationFrame(() => b.style.opacity = "1");
    setTimeout(() => { b.style.opacity = "0"; setTimeout(() => b.remove(), 400); }, 2000);
}

function animateMultiplier() {
    if (!multiplierAnimRunning) return;
    const now = performance.now();
    const delta = now - lastUpdateTime;
    lastUpdateTime = now;
    if (roundActive) {
        const diff = targetMultiplier - multiplier;
        multiplier += diff > 0.001 ? diff * Math.min(delta / 50, 1) : 0;
        multiplier = Math.min(multiplier, targetMultiplier);
        multiplierDisplay.innerText = multiplier.toFixed(2) + 'x';
        multiplierFill.style.width = Math.min((multiplier - 1) * 10, 100) + '%';
        if (userBet && !cashedOut) {
            cashoutBtn.innerText = `Cashout ৳${(multiplier * userBet).toFixed(2)}`;
        }
    }
    requestAnimationFrame(animateMultiplier);
}

db.ref('aviator/multiplier').on('value', s => {
    const v = parseFloat(s.val());
    if (!isNaN(v)) targetMultiplier = parseFloat(v.toFixed(2));
});

function updateCrashHistoryDisplay(list) {
    crashHistoryEl.innerHTML = '';
    list.slice().reverse().forEach(p => {
        const sp = document.createElement('span');
        sp.innerText = p.toFixed(2) + 'x ';
        if (p < 2) sp.style.color = 'yellow';
        else if (p <= 5) sp.style.color = 'deeppink';
        else sp.style.color = 'limegreen';
        crashHistoryEl.appendChild(sp);
    });
}

db.ref('aviator/lastCrashes').on('value', s => updateCrashHistoryDisplay(s.val() || []));

db.ref('aviator/round/active').on('value', async s => {
    roundActive = !!s.val();
    if (!roundActive) {
        multiplierAnimRunning = false;
        if (!crashPlayed) { setTimeout(() => playSound(crashSound), 50); crashPlayed = true; }
        crashDisplay.innerText = 'CRASHED!';
        multiplierDisplay.style.color = 'red';
        multiplierFill.style.background = 'red';
        betSection.classList.remove('hidden');
        cashoutSection.classList.add('hidden');
        if (userBet && !cashedOut) {
            await db.ref(`aviator/roundUsers/${currentRoundId}/${uid}`).update({
                cashedOut: false,
                cashoutMultiplier: 0,
                lost: true
            });
            userBet = null;
        }
        currentRoundId = null;
        if (liveUserListListener) { liveUserListListener.off(); liveUserListListener = null; }
    } else {
        multiplierAnimRunning = true;
        animateMultiplier();
        crashPlayed = false;
        crashDisplay.innerText = 'Started...';
        multiplierDisplay.style.color = 'lime';
        multiplierFill.style.background = 'limegreen';
        multiplier = 1.01;
        multiplierDisplay.innerText = multiplier.toFixed(2) + 'x';
        multiplierFill.style.width = '0%';
        betSection.classList.add('hidden');
        if (userBet && !cashedOut) cashoutSection.classList.remove('hidden');
        if (!currentRoundId) {
            const r = await db.ref('aviator/currentRoundId').get();
            currentRoundId = r.exists() ? r.val() : Date.now().toString();
            await db.ref('aviator/currentRoundId').set(currentRoundId);
        }
        attachLiveUserListener();
    }
});

function attachLiveUserListener() {
    if (!currentRoundId) return;
    if (liveUserListListener) liveUserListListener.off();
    liveUserListListener = db.ref(`aviator/roundUsers/${currentRoundId}`);
    liveUserListListener.on('value', async s => {
        const users = s.val() || {};
        userList.innerHTML = '';
        const ids = Object.keys(users);
        if (ids.length === 0) return;
        const userElems = await Promise.all(ids.map(async id => {
            const d = users[id];
            let res = '';
            if (!roundActive && d.bet && !d.cashedOut) {
                if (!d.lost) {
                    res = 'Lost';
                    await db.ref(`aviator/roundUsers/${currentRoundId}/${id}`).update({ lost: true });
                } else res = 'Lost';
            } else if (d.cashedOut) {
                res = d.cashoutMultiplier > 0 ? `Won: ${parseFloat(d.cashoutMultiplier).toFixed(2)}x` : 'Lost';
            } else if (roundActive && d.bet && !d.cashedOut) res = 'Running';
            let uname = id;
            try {
                const sn = await db.ref(`users/${id}/username`).get();
                uname = sn.val() || id;
            } catch { }
            return `${uname} - Bet: ${d.bet || 0} - ${res}`;
        }));
        userElems.forEach(txt => { const li = document.createElement('li'); li.innerText = txt; userList.appendChild(li); });
    });
}

placeBetBtn.onclick = async () => {
    if (userBet) return;
    const a = parseInt(betInput.value);
    if (isNaN(a) || a < 5 || a > 10000) return;
    if (roundActive || balance < a) return;
    balance -= a;
    db.ref(`users/${uid}/MainBalance`).set(balance);
    userBet = a;
    cashedOut = false;
    if (!currentRoundId) {
        const r = await db.ref('aviator/currentRoundId').get();
        currentRoundId = r.exists() ? r.val() : Date.now().toString();
        await db.ref('aviator/currentRoundId').set(currentRoundId);
    }
    await db.ref(`aviator/roundUsers/${currentRoundId}/${uid}`).set({
        bet: a,
        cashedOut: false
    });
    betSection.classList.add('hidden');
    playSound(clickSound);
    if (roundActive) cashoutSection.classList.remove('hidden');
};

async function triggerCashout() {
    if (!userBet || cashedOut) return;
    if (triggerCashout.processing) return;
    triggerCashout.processing = true;
    try {
        const snap = await db.ref('aviator/multiplier').get();
        const serverMulti = parseFloat(snap.val() || 1);
        const liveMulti = parseFloat(multiplier.toFixed(2));
        const effectiveMultiplier = Math.max(1.01, Math.min(serverMulti, liveMulti));
        const winnings = parseFloat((effectiveMultiplier * userBet).toFixed(2));
        const updates = {};
        updates[`users/${uid}/MainBalance`] = balance + winnings;
        updates[`aviator/roundUsers/${currentRoundId}/${uid}`] = {
            bet: userBet,
            cashedOut: true,
            cashoutMultiplier: effectiveMultiplier
        };
        await db.ref().update(updates);
        balance += winnings;
        balanceEl.innerText = balance.toFixed(2);
        cashedOut = true;
        playSound(cashoutSound);
        popup(`🎉 Cashout Successful! ৳${winnings.toFixed(2)}`, "green");
        cashoutSection.classList.add('hidden');
    } catch {
        popup("❌ Cashout failed, retry!", "red");
    } finally {
        userBet = null;
        triggerCashout.processing = false;
    }
}

cashoutBtn.onclick = () => triggerCashout();