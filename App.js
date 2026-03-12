import { useState, useEffect, useRef } from "react";
import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc, setDoc, getDoc, updateDoc, increment,
} from "firebase/firestore";

// ── DATA ──────────────────────────────────────────
const GOLD = "#FFD700", GOLD2 = "#FF8C00", GREEN = "#00FF87";
const DARK = "#07090f", DARK2 = "#0e1118";
const syne = "'Syne',sans-serif", dm = "'DM Sans',sans-serif";

const TASKS = [
  { id:"t1", icon:"▶️", name:"Video Dekho",     desc:"30 sec ad — asaan coins!",    coins:20,  type:"ad",       tag:"Easy ✅",       tagBg:"rgba(0,255,135,0.2)",   tagClr:"#00FF87" },
  { id:"t2", icon:"📋", name:"Survey Bharo",    desc:"5 sawaal, 2 minute",          coins:50,  type:"survey",   tag:"Popular 🔥",    tagBg:"rgba(255,200,0,0.18)",  tagClr:"#FFD700" },
  { id:"t3", icon:"📲", name:"App Install Karo",desc:"Partner app download karo",   coins:80,  type:"install",  tag:"Best Pay 💎",   tagBg:"rgba(168,85,247,0.18)", tagClr:"#C084FC" },
  { id:"t4", icon:"🛍️", name:"AliExpress Deal", desc:"Affiliate link visit karo",   coins:25,  type:"affiliate",tag:"Quick ⚡",      tagBg:"rgba(255,140,0,0.18)",  tagClr:"#FF8C00" },
  { id:"t5", icon:"👥", name:"Dost Ko Invite",  desc:"Referral code share karo",    coins:150, type:"referral", tag:"Max Coins ⭐",  tagBg:"rgba(0,255,135,0.15)",  tagClr:"#00FF87" },
];

const REWARDS = [
  { id:"r1", icon:"💚", title:"Easypaisa",        amount:"Rs. 100", coins:500 },
  { id:"r2", icon:"🟠", title:"JazzCash",          amount:"Rs. 100", coins:500 },
  { id:"r3", icon:"💎", title:"Premium (1 Month)", amount:"2x Coins!", coins:300 },
  { id:"r4", icon:"🎁", title:"Daraz Voucher",     amount:"Rs. 200",  coins:900 },
];

const LEADERS = [
  { emoji:"🦁", name:"Ali Raza",    city:"Lahore",     coins:4820, pct:100 },
  { emoji:"🌸", name:"Sana Khan",   city:"Karachi",    coins:3990, pct:83  },
  { emoji:"⚡", name:"Usman Tariq", city:"Faisalabad", coins:3450, pct:72  },
  { emoji:"🌙", name:"Hira Malik",  city:"Multan",     coins:2870, pct:60  },
];

const OB = [
  { icon:"🪙", title:"Coins Kamao",    sub:"Har Task Se!",   desc:"Video dekho, surveys karo, apps install karo — coins kamate raho!" },
  { icon:"💸", title:"Real Paise",     sub:"Withdraw Karo!", desc:"Easypaisa aur JazzCash pe seedha paise bhejo. Bilkul asaan!" },
  { icon:"👥", title:"Refer Karo",     sub:"2x Kamao!",      desc:"Har referral pe +150 coins — jitne zyada dost utna zyada earning!" },
];

// ── KEYFRAMES ─────────────────────────────────────
const KF = `
@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes scaleIn{from{opacity:0;transform:scale(0.6)}to{opacity:1;transform:scale(1)}}
@keyframes shimmer{0%{background-position:-300% center}100%{background-position:300% center}}
@keyframes float{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-16px) rotate(3deg)}}
@keyframes glow{0%,100%{box-shadow:0 0 18px rgba(255,215,0,0.3)}50%{box-shadow:0 0 50px rgba(255,165,0,0.7)}}
@keyframes ring{0%{transform:scale(1);opacity:0.7}100%{transform:scale(2.8);opacity:0}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes coinDrop{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translate(var(--bx),var(--by)) scale(0.2);opacity:0}}
@keyframes progressBar{from{width:0}to{width:100%}}
@keyframes navPop{from{transform:translateY(70px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes taskIn{from{opacity:0;transform:translateX(28px)}to{opacity:1;transform:translateX(0)}}
@keyframes btnShine{0%{left:-100%}100%{left:200%}}
@keyframes toastIn{from{transform:translateX(-50%) translateY(-60px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}
@keyframes toastOut{from{opacity:1;transform:translateX(-50%)}to{opacity:0;transform:translateX(-50%) translateY(-40px)}}
@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
@keyframes particleDrift{0%{transform:translate(0,0);opacity:0.5}100%{transform:translate(var(--dx),var(--dy));opacity:0}}
`;

// ── SMALL COMPONENTS ──────────────────────────────
function Shimmer({ text, size = 26 }) {
  return (
    <span style={{ fontFamily: syne, fontSize: size, fontWeight: 800, background: `linear-gradient(90deg,${GOLD} 0%,#FFF3A0 40%,${GOLD} 60%,${GOLD2} 100%)`, backgroundSize: "300% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "shimmer 2.5s linear infinite" }}>
      {text}
    </span>
  );
}

function Toast({ msg, show }) {
  if (!msg) return null;
  return (
    <div style={{ position: "fixed", top: 18, left: "50%", background: "linear-gradient(135deg,#0e1f10,#0b1a0d)", border: "1px solid rgba(0,255,135,0.4)", borderRadius: 16, padding: "11px 22px", zIndex: 9999, fontSize: 13, fontWeight: 600, color: GREEN, boxShadow: "0 8px 30px rgba(0,255,135,0.2)", whiteSpace: "nowrap", fontFamily: dm, animation: show ? "toastIn 0.4s cubic-bezier(.36,2,.5,1) both" : "toastOut 0.3s ease both" }}>
      {msg}
    </div>
  );
}

function Bursts({ bursts }) {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 998, overflow: "hidden" }}>
      {bursts.map(b => (
        <div key={b.id} style={{ position: "absolute", left: b.x, top: b.y, fontSize: b.sz, animation: `coinDrop ${b.dur}s ease-out forwards`, "--bx": `${b.dx}px`, "--by": `${b.dy}px` }}>🪙</div>
      ))}
    </div>
  );
}

function PrimaryBtn({ children, onClick, disabled }) {
  const [p, setP] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled}
      onPointerDown={() => setP(true)} onPointerUp={() => setP(false)}
      style={{ width: "100%", padding: "17px", borderRadius: 18, border: "none", background: disabled ? "rgba(255,255,255,0.08)" : `linear-gradient(135deg,${GOLD},${GOLD2})`, fontFamily: syne, fontSize: 16, fontWeight: 700, color: disabled ? "rgba(255,255,255,0.3)" : "#000", cursor: disabled ? "not-allowed" : "pointer", boxShadow: disabled ? "none" : "0 8px 28px rgba(255,165,0,0.35)", transform: p ? "scale(0.96)" : "scale(1)", transition: "transform 0.15s", position: "relative", overflow: "hidden" }}>
      {children}
      {!disabled && <div style={{ position: "absolute", top: 0, bottom: 0, width: "40%", background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)", animation: "btnShine 2.5s ease-in-out infinite", pointerEvents: "none" }} />}
    </button>
  );
}

function Particles({ count = 12 }) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div key={i} style={{ position: "absolute", width: 2 + Math.random() * 4, height: 2 + Math.random() * 4, borderRadius: "50%", left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, background: i % 2 === 0 ? "rgba(255,215,0,0.3)" : "rgba(0,255,135,0.2)", "--dx": `${(Math.random() - .5) * 60}px`, "--dy": `${(Math.random() - .5) * 60}px`, animation: `particleDrift ${4 + Math.random() * 4}s ease-in-out ${Math.random() * 3}s infinite alternate` }} />
      ))}
    </>
  );
}

// ── SPLASH ────────────────────────────────────────
function Splash({ onDone }) {
  const [exit, setExit] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => { setExit(true); setTimeout(onDone, 700); }, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 100, background: `radial-gradient(ellipse at 50% 30%,#1a1200 0%,${DARK} 65%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transition: "opacity 0.7s ease,transform 0.7s ease", opacity: exit ? 0 : 1, transform: exit ? "scale(1.1)" : "scale(1)" }}>
      <Particles />
      <div style={{ position: "relative", marginBottom: 32, animation: "scaleIn 0.6s cubic-bezier(.36,2,.5,1) 0.3s both" }}>
        <div style={{ width: 100, height: 100, borderRadius: 28, background: `linear-gradient(135deg,${GOLD},${GOLD2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 50, animation: "glow 2.5s ease-in-out 1s infinite", position: "relative" }}>
          💰
          <div style={{ position: "absolute", inset: 0, borderRadius: 28, border: "2px solid rgba(255,215,0,0.6)", animation: "ring 1.8s ease-out 1s infinite" }} />
        </div>
      </div>
      <div style={{ animation: "fadeUp 0.5s ease 0.7s both" }}><Shimmer text="RozKamao" size={38} /></div>
      <div style={{ fontFamily: dm, fontSize: 12, color: "rgba(255,255,255,0.35)", letterSpacing: 4, textTransform: "uppercase", marginTop: 8, animation: "fadeUp 0.5s ease 0.9s both" }}>Karo Kaam · Kamao Daam</div>
      <div style={{ marginTop: 56, width: 180, height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 10, overflow: "hidden", animation: "fadeUp 0.4s ease 1.1s both" }}>
        <div style={{ height: "100%", borderRadius: 10, background: `linear-gradient(90deg,${GOLD},${GOLD2})`, animation: "progressBar 2s ease 1.2s both" }} />
      </div>
    </div>
  );
}

// ── ONBOARDING ────────────────────────────────────
function Onboarding({ onDone }) {
  const [slide, setSlide] = useState(0);
  const [going, setGoing] = useState(false);
  const s = OB[slide];

  const next = () => {
    if (going) return;
    if (slide < 2) { setGoing(true); setTimeout(() => { setSlide(v => v + 1); setGoing(false); }, 280); }
    else onDone();
  };

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 90, background: DARK, display: "flex", flexDirection: "column", fontFamily: dm }}>
      <div style={{ padding: "20px 24px 0", display: "flex", justifyContent: "flex-end" }}>
        <button onClick={onDone} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "6px 16px", color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: dm }}>Skip</button>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px", textAlign: "center", opacity: going ? 0 : 1, transform: going ? "translateX(-30px)" : "translateX(0)", transition: "all 0.28s ease" }}>
        <div style={{ position: "relative", width: 148, height: 148, marginBottom: 36 }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: 42, background: `linear-gradient(${slide * 120}deg,${GOLD},${GREEN},${GOLD2})`, animation: "spin 3s linear infinite" }} />
          <div style={{ position: "absolute", inset: 3, borderRadius: 40, background: DARK2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 68 }}>{s.icon}</div>
        </div>
        <h2 style={{ fontFamily: syne, fontSize: 28, fontWeight: 800, marginBottom: 12, lineHeight: 1.2 }}>
          {s.title}<br /><Shimmer text={s.sub} size={28} />
        </h2>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", lineHeight: 1.65, maxWidth: 280 }}>{s.desc}</p>
      </div>
      <div style={{ padding: "24px 28px 44px" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 28 }}>
          {[0, 1, 2].map(i => (
            <div key={i} onClick={() => setSlide(i)} style={{ height: 6, borderRadius: 3, cursor: "pointer", background: i === slide ? GOLD : "rgba(255,255,255,0.18)", width: i === slide ? 28 : 6, transition: "all 0.4s cubic-bezier(.4,0,.2,1)" }} />
          ))}
        </div>
        <PrimaryBtn onClick={next}>{slide < 2 ? "Aage Chalein →" : "🎉 Shuru Karein!"}</PrimaryBtn>
      </div>
    </div>
  );
}

// ── AUTH ──────────────────────────────────────────
function Auth({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState(""), [pass, setPass] = useState(""), [name, setName] = useState("");
  const [loading, setLoading] = useState(false), [err, setErr] = useState(""), [shake, setShake] = useState(false);

  const inp = { width: "100%", padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 14, outline: "none", fontFamily: dm, marginBottom: 12, boxSizing: "border-box" };
  const trigShake = () => { setShake(true); setTimeout(() => setShake(false), 500); };

  const doAuth = async () => {
    if (!email || !pass) { setErr("Email aur password dalein!"); trigShake(); return; }
    setLoading(true); setErr("");
    try {
      if (mode === "signup") {
        if (!name) { setErr("Naam dalein!"); trigShake(); setLoading(false); return; }
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        const refCode = "RK" + Math.random().toString(36).substr(2, 6).toUpperCase();
        await setDoc(doc(db, "users", cred.user.uid), { name, email, coins: 50, completedTasks: {}, referrals: 0, joined: new Date().toISOString(), premium: false, withdrawals: 0, streak: 1, dailyTasks: 0, referralCode: refCode });
        onAuth({ uid: cred.user.uid, name, email, coins: 50, referralCode: refCode, referrals: 0, withdrawals: 0 });
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, pass);
        const snap = await getDoc(doc(db, "users", cred.user.uid));
        if (snap.exists()) onAuth({ uid: cred.user.uid, ...snap.data() });
      }
    } catch (e) {
      const m = { "auth/email-already-in-use": "Email pehle se registered hai!", "auth/wrong-password": "Galat password!", "auth/invalid-credential": "Email ya password galat hai!", "auth/user-not-found": "Account nahi mila!", "auth/invalid-email": "Email sahi likho!", "auth/weak-password": "Password 6+ characters ka hona chahiye!" };
      setErr(m[e.code] || "Kuch ghalat hua — dobara try karo!"); trigShake();
    }
    setLoading(false);
  };

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 85, background: DARK, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 28px", fontFamily: dm }}>
      <Particles count={10} />
      <div style={{ fontSize: 52, marginBottom: 16, animation: "float 3s ease-in-out infinite" }}>💰</div>
      <div style={{ marginBottom: 6 }}><Shimmer text="RozKamao" size={32} /></div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 36, letterSpacing: 2, textTransform: "uppercase" }}>{mode === "login" ? "Wapas Aagaye! 👋" : "Naya Account Banao 🎉"}</div>
      <div style={{ width: "100%", maxWidth: 340, animation: shake ? "shake 0.4s ease" : "none" }}>
        {mode === "signup" && <input placeholder="Tumhara Naam" value={name} onChange={e => setName(e.target.value)} style={inp} />}
        <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} style={inp} />
        <input type="password" placeholder="Password (6+ characters)" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && doAuth()} style={{ ...inp, marginBottom: 0 }} />
        {err && <div style={{ color: "#FF6B6B", fontSize: 12, margin: "10px 0", textAlign: "center", fontWeight: 600 }}>⚠️ {err}</div>}
        <div style={{ marginTop: 16 }}>
          <PrimaryBtn onClick={doAuth} disabled={loading}>{loading ? "⏳ Please wait..." : mode === "login" ? "Login Karo →" : "Account Banao 🎉"}</PrimaryBtn>
        </div>
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
          {mode === "login" ? "Pehli baar? " : "Account hai? "}
          <span onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(""); }} style={{ color: GOLD, fontWeight: 700, cursor: "pointer" }}>{mode === "login" ? "Signup Karo" : "Login Karo"}</span>
        </div>
        {mode === "signup" && <div style={{ marginTop: 16, background: "rgba(0,255,135,0.06)", border: "1px solid rgba(0,255,135,0.15)", borderRadius: 12, padding: "10px 14px", fontSize: 12, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>🎁 Signup pe <span style={{ color: GREEN, fontWeight: 700 }}>+50 bonus coins</span>!</div>}
      </div>
    </div>
  );
}

// ── HOME TAB ──────────────────────────────────────
function HomeTab({ user, coins, setCoins, completed, setCompleted }) {
  const [bursts, setBursts] = useState([]);
  const [toast, setToast] = useState({ msg: "", show: false });
  const [bars, setBars] = useState(false);
  const [pulse, setPulse] = useState(false);
  const tt = useRef(null);

  useEffect(() => { const t = setTimeout(() => setBars(true), 800); return () => clearTimeout(t); }, []);

  const showToast = msg => { setToast({ msg, show: true }); clearTimeout(tt.current); tt.current = setTimeout(() => setToast(p => ({ ...p, show: false })), 2600); };

  const addBursts = (x, y) => {
    const nb = [...Array(7)].map((_, i) => ({ id: Date.now() + i, x, y, sz: 16 + Math.random() * 12, dx: (Math.random() - .5) * 120, dy: -(40 + Math.random() * 80), dur: 0.6 + Math.random() * 0.4 }));
    setBursts(b => [...b, ...nb]);
    setTimeout(() => setBursts(b => b.filter(x => !nb.find(n => n.id === x.id))), 1200);
  };

  const doTask = async (task, e) => {
    if (completed.has(task.id)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setCompleted(c => new Set([...c, task.id]));
    setCoins(c => c + task.coins);
    addBursts(rect.left + rect.width / 2, rect.top + rect.height / 2);
    setPulse(true); setTimeout(() => setPulse(false), 400);
    showToast(`+${task.coins} 🪙 ${task.name} complete!`);
    try { await updateDoc(doc(db, "users", user.uid), { coins: increment(task.coins), [`completedTasks.${task.id}`]: true, dailyTasks: increment(1) }); } catch {}
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 90 }}>
      <Bursts bursts={bursts} />
      {toast.msg && <Toast msg={toast.msg} show={toast.show} />}

      {/* Header */}
      <div style={{ padding: "22px 20px 0", animation: "fadeUp 0.5s ease both" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 3 }}>Assalam o Alaikum 👋</div>
            <div style={{ fontFamily: syne, fontSize: 22, fontWeight: 800 }}>{user?.name || "Dost"}!</div>
          </div>
          <div onClick={() => { addBursts(window.innerWidth - 70, 55); setPulse(true); setTimeout(() => setPulse(false), 400); }}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.28)", borderRadius: 40, cursor: "pointer", animation: "glow 3s ease-in-out infinite", transform: pulse ? "scale(1.18)" : "scale(1)", transition: "transform 0.3s cubic-bezier(.36,2,.5,1)" }}>
            <span style={{ fontSize: 20 }}>🪙</span>
            <span style={{ fontFamily: syne, fontSize: 20, fontWeight: 800, color: GOLD }}>{coins}</span>
          </div>
        </div>
      </div>

      {/* Streak */}
      <div style={{ margin: "0 20px 16px", display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(255,107,53,0.13)", border: "1px solid rgba(255,107,53,0.28)", borderRadius: 30, padding: "6px 14px", animation: "fadeUp 0.5s ease 0.08s both" }}>
        <span style={{ fontSize: 16 }}>🔥</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#FF8A50" }}>Aaj Ka Pehla Task = 2x Coins!</span>
      </div>

      {/* Hero Banner */}
      <div style={{ margin: "0 20px 20px", borderRadius: 24, padding: "22px 20px", background: "linear-gradient(135deg,#181000,#2e1f00,#181000)", border: "1px solid rgba(255,215,0,0.18)", position: "relative", overflow: "hidden", animation: "fadeUp 0.5s ease 0.12s both" }}>
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "55%", background: "radial-gradient(ellipse at 80% 50%,rgba(255,165,0,0.13) 0%,transparent 70%)" }} />
        <div style={{ display: "inline-block", background: "rgba(255,215,0,0.18)", border: "1px solid rgba(255,215,0,0.38)", borderRadius: 20, padding: "3px 12px", fontSize: 10, fontWeight: 700, color: GOLD, marginBottom: 10, letterSpacing: 1.5, textTransform: "uppercase" }}>⚡ Aaj Ka Offer</div>
        <div style={{ fontFamily: syne, fontSize: 24, fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>Pehla Task<br />Double Coins! 🎯</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 16 }}>Sirf aaj ke liye — Rs.280 tak kamao</div>
        <button style={{ display: "inline-flex", alignItems: "center", gap: 8, background: `linear-gradient(135deg,${GOLD},${GOLD2})`, border: "none", borderRadius: 14, padding: "10px 20px", fontFamily: syne, fontSize: 13, fontWeight: 700, color: "#000", cursor: "pointer" }}>Tasks Dekho →</button>
        <div style={{ position: "absolute", right: 22, top: "50%", transform: "translateY(-50%)", fontSize: 54, animation: "float 3s ease-in-out infinite", filter: "drop-shadow(0 0 18px rgba(255,215,0,0.5))" }}>💰</div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 11, margin: "0 20px 20px", animation: "fadeUp 0.5s ease 0.18s both" }}>
        {[{ icon: "✅", val: completed.size, label: "Tasks Done", color: GREEN }, { icon: "🪙", val: coins, label: "Coins Aaj", color: GOLD }, { icon: "🔥", val: "3", label: "Day Streak", color: "#FF6B35" }].map((s, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: "16px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontFamily: syne, fontSize: 20, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", marginTop: 3, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tasks */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "0 20px", marginBottom: 14, animation: "fadeUp 0.5s ease 0.22s both" }}>
        <div style={{ fontFamily: syne, fontSize: 16, fontWeight: 800 }}>⚡ Aaj Ki Tasks</div>
        <div style={{ fontSize: 12, color: GOLD, fontWeight: 600 }}>Sab Dekho →</div>
      </div>
      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {TASKS.map((t, i) => {
          const done = completed.has(t.id);
          const stripColor = t.type === "ad" ? `linear-gradient(180deg,${GREEN},#00C6FF)` : t.type === "survey" ? `linear-gradient(180deg,${GOLD},${GOLD2})` : t.type === "install" ? "linear-gradient(180deg,#C084FC,#818CF8)" : `linear-gradient(180deg,${GOLD2},${GOLD})`;
          return (
            <div key={t.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "15px 14px", display: "flex", alignItems: "center", gap: 13, opacity: done ? 0.55 : 1, animation: `taskIn 0.4s ease ${0.28 + i * 0.07}s both`, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: stripColor }} />
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{t.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: syne, fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{t.name}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", marginBottom: 5 }}>{t.desc}</div>
                <div style={{ display: "inline-block", background: t.tagBg, color: t.tagClr, borderRadius: 7, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>{t.tag}</div>
              </div>
              <button onClick={e => doTask(t, e)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: done ? "rgba(0,255,135,0.13)" : `linear-gradient(135deg,${GOLD},${GOLD2})`, border: "none", borderRadius: 13, padding: "9px 13px", cursor: "pointer", boxShadow: done ? "none" : "0 4px 14px rgba(255,165,0,0.32)", flexShrink: 0, fontFamily: dm }}>
                {done ? <><span style={{ fontSize: 18, color: GREEN }}>✓</span><span style={{ fontSize: 9, fontWeight: 700, color: GREEN }}>Done!</span></> : <><span style={{ fontFamily: syne, fontSize: 14, fontWeight: 800, color: "#000", lineHeight: 1 }}>+{t.coins}</span><span style={{ fontSize: 9, fontWeight: 700, color: "rgba(0,0,0,0.6)" }}>🪙 COINS</span></>}
              </button>
            </div>
          );
        })}
      </div>

      {/* Leaderboard */}
      <div style={{ margin: "20px 20px 0", borderRadius: 20, padding: "18px", background: "linear-gradient(135deg,rgba(0,255,135,0.05),rgba(0,198,255,0.05))", border: "1px solid rgba(0,255,135,0.13)", animation: "fadeUp 0.5s ease 0.5s both" }}>
        <div style={{ fontFamily: syne, fontSize: 14, fontWeight: 800, color: GREEN, marginBottom: 14 }}>🏆 Is Hafte Ke Top Earners</div>
        {LEADERS.map((l, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: i < 3 ? 12 : 0 }}>
            <div style={{ fontSize: 16, width: 22, textAlign: "center" }}>{["🥇", "🥈", "🥉", "4️⃣"][i]}</div>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{l.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{l.name} <span style={{ fontSize: 10, color: "rgba(255,255,255,0.33)" }}>· {l.city}</span></span>
                <span style={{ fontFamily: syne, fontSize: 13, fontWeight: 800, color: GOLD }}>{l.coins.toLocaleString()} 🪙</span>
              </div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginTop: 5 }}>
                <div style={{ height: 4, borderRadius: 2, background: `linear-gradient(90deg,${GREEN},${GOLD})`, width: bars ? l.pct + "%" : "0%", transition: `width 1s ease ${0.5 + i * 0.15}s` }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Referral */}
      <div style={{ margin: "16px 20px 20px", borderRadius: 20, padding: "18px 20px", background: "linear-gradient(135deg,rgba(168,85,247,0.1),rgba(59,130,246,0.1))", border: "1px solid rgba(168,85,247,0.22)", animation: "fadeUp 0.5s ease 0.55s both", cursor: "pointer" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: 1.5, marginBottom: 5, textTransform: "uppercase" }}>Tumhara Code</div>
            <div style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 800, letterSpacing: 4, color: "#C084FC" }}>{user?.referralCode || "RK2026"}</div>
          </div>
          <div style={{ background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.4)", borderRadius: 10, padding: "7px 14px", fontSize: 12, fontWeight: 700, color: "#C084FC" }}>Share 📤</div>
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.38)" }}>Dosto ke saath share karo</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#C084FC", marginTop: 4 }}>+150 coins har invite pe 🎉</div>
      </div>
    </div>
  );
}

// ── REWARDS TAB ───────────────────────────────────
function RewardsTab({ coins, setCoins, user }) {
  const [claimed, setClaimed] = useState(new Set());
  const [toast, setToast] = useState({ msg: "", show: false });
  const tt = useRef(null);
  const showToast = msg => { setToast({ msg, show: true }); clearTimeout(tt.current); tt.current = setTimeout(() => setToast(p => ({ ...p, show: false })), 2600); };

  const claim = async r => {
    if (claimed.has(r.id)) return;
    if (coins < r.coins) { showToast(`❌ ${r.coins - coins} aur coins chahiye!`); return; }
    setCoins(c => c - r.coins); setClaimed(c => new Set([...c, r.id]));
    showToast(`🎉 ${r.title} ${r.amount} claimed!`);
    try { await updateDoc(doc(db, "users", user.uid), { coins: increment(-r.coins), withdrawals: increment(1) }); } catch {}
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 90, padding: "22px 20px 90px" }}>
      {toast.msg && <Toast msg={toast.msg} show={toast.show} />}
      <div style={{ fontFamily: syne, fontSize: 22, fontWeight: 800, marginBottom: 4, animation: "fadeUp 0.4s ease both" }}>🎁 Rewards</div>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>Tumhare paas: <span style={{ color: GOLD, fontWeight: 700 }}>{coins} 🪙</span></div>
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "16px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8 }}>
          <span style={{ color: "rgba(255,255,255,0.5)" }}>Pehla Withdrawal Tak</span>
          <span style={{ color: GOLD, fontWeight: 700 }}>{Math.min(coins, 500)}/500 🪙</span>
        </div>
        <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", background: `linear-gradient(90deg,${GOLD},${GOLD2})`, width: `${Math.min(100, (coins / 500) * 100)}%`, borderRadius: 4, transition: "width 0.8s ease" }} />
        </div>
      </div>
      {REWARDS.map((r, i) => {
        const can = coins >= r.coins && !claimed.has(r.id);
        const done = claimed.has(r.id);
        return (
          <div key={r.id} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${done ? "rgba(0,255,135,0.3)" : "rgba(255,255,255,0.08)"}`, borderRadius: 20, padding: "18px", marginBottom: 12, display: "flex", alignItems: "center", gap: 16, animation: `fadeUp 0.4s ease ${0.1 + i * 0.07}s both` }}>
            <div style={{ fontSize: 42 }}>{r.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: syne, fontSize: 16, fontWeight: 700 }}>{r.title}</div>
              <div style={{ fontSize: 14, color: GOLD, fontWeight: 600, marginTop: 2 }}>{r.amount}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>Chahiye: {r.coins} 🪙</div>
            </div>
            <button onClick={() => claim(r)} style={{ background: done ? "rgba(0,255,135,0.15)" : can ? `linear-gradient(135deg,${GOLD},${GOLD2})` : "rgba(255,255,255,0.07)", border: "none", borderRadius: 16, padding: "10px 16px", cursor: can ? "pointer" : "not-allowed", fontFamily: syne, fontSize: 13, fontWeight: 800, color: done ? GREEN : can ? "#000" : "rgba(255,255,255,0.25)", boxShadow: can ? "0 4px 16px rgba(255,165,0,0.3)" : "none" }}>
              {done ? "✓ Done!" : can ? "Claim!" : "🔒"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── REFER TAB ─────────────────────────────────────
function ReferTab({ user }) {
  const [copied, setCopied] = useState(false);
  const code = user?.referralCode || "RK2026";
  const link = `https://rozkamao.vercel.app?ref=${code}`;
  const copy = () => { navigator.clipboard?.writeText(code).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 90, padding: "22px 20px 90px" }}>
      <div style={{ fontFamily: syne, fontSize: 22, fontWeight: 800, marginBottom: 24, animation: "fadeUp 0.4s ease both" }}>👥 Refer & Earn</div>
      <div style={{ background: "linear-gradient(135deg,#1a1f0a,#2a3010)", border: "1px solid rgba(0,255,135,0.25)", borderRadius: 22, padding: "24px", marginBottom: 20, textAlign: "center" }}>
        <div style={{ fontSize: 44, marginBottom: 10 }}>🎉</div>
        <div style={{ fontFamily: syne, fontSize: 26, fontWeight: 800, color: GREEN }}>+150 Coins</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 8, lineHeight: 1.6 }}>Har dost jo tumhara code use kare signup pe!</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 6 }}>Dost ko bhi milenge <span style={{ color: GOLD }}>+50 coins</span></div>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,215,0,0.3)", borderRadius: 16, padding: "14px 16px", marginBottom: 20 }}>
        <div style={{ flex: 1, fontFamily: "monospace", fontSize: 24, fontWeight: 800, letterSpacing: 5, color: GOLD }}>{code}</div>
        <button onClick={copy} style={{ background: copied ? "rgba(0,255,135,0.2)" : "rgba(255,215,0,0.15)", border: `1px solid ${copied ? "rgba(0,255,135,0.4)" : "rgba(255,215,0,0.4)"}`, borderRadius: 12, padding: "9px 16px", color: copied ? GREEN : GOLD, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: dm }}>{copied ? "✓ Copied!" : "Copy 📋"}</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { icon: "💬", name: "WhatsApp", color: "#25D366", fn: () => window.open(`https://wa.me/?text=RozKamao+app+se+roz+kamao!+Code:+${code}+Link:+${link}`) },
          { icon: "✈️", name: "Telegram", color: "#0088CC", fn: () => window.open(`https://t.me/share/url?url=${link}&text=RozKamao+Code:+${code}`) },
          { icon: "📘", name: "Facebook", color: "#1877F2", fn: () => window.open(`https://facebook.com/sharer/sharer.php?u=${link}`) },
          { icon: "📤", name: "Copy Link", color: "#888", fn: copy },
        ].map(p => (
          <button key={p.name} onClick={p.fn} style={{ background: `${p.color}18`, border: `1px solid ${p.color}35`, borderRadius: 16, padding: "14px", display: "flex", alignItems: "center", gap: 10, color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: dm }}>
            <span style={{ fontSize: 24 }}>{p.icon}</span>{p.name}
          </button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 20 }}>
        {[{ label: "Tumhare Referrals", val: user?.referrals || 0, color: GREEN }, { label: "Referral Coins", val: (user?.referrals || 0) * 150, color: GOLD }].map((s, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "16px", textAlign: "center" }}>
            <div style={{ fontFamily: syne, fontSize: 26, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── PROFILE TAB ───────────────────────────────────
function ProfileTab({ user, coins, onLogout }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 90, padding: "22px 20px 90px" }}>
      <div style={{ fontFamily: syne, fontSize: 22, fontWeight: 800, marginBottom: 24 }}>👤 Profile</div>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: `linear-gradient(135deg,${GOLD},${GOLD2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 12px", animation: "glow 3s ease-in-out infinite" }}>
          {(user?.name || "A")[0].toUpperCase()}
        </div>
        <div style={{ fontFamily: syne, fontSize: 20, fontWeight: 800 }}>{user?.name}</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{user?.email}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
        {[{ icon: "🪙", val: coins, label: "Coins", color: GOLD }, { icon: "👥", val: user?.referrals || 0, label: "Referrals", color: GREEN }, { icon: "💸", val: user?.withdrawals || 0, label: "Cashouts", color: "#C084FC" }].map((s, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "14px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontFamily: syne, fontSize: 18, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: "4px 0", marginBottom: 20 }}>
        {[["📅", "Joined", user?.joined ? new Date(user.joined).toLocaleDateString("en-PK") : "Aaj"], ["🔥", "Streak", "3 Days"], ["🏆", "Ranking", "#5 Pakistan"], ["💎", "Plan", user?.premium ? "Premium" : "Free"]].map(([icon, label, val], i, arr) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: 18 }}>{icon}</span><span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>{label}</span></div>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{val}</span>
          </div>
        ))}
      </div>
      <button onClick={onLogout} style={{ width: "100%", padding: "15px", borderRadius: 16, border: "1px solid rgba(255,107,107,0.35)", background: "rgba(255,107,107,0.08)", color: "#FF6B6B", fontFamily: syne, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>🚪 Logout</button>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("splash");
  const [tab, setTab] = useState(0);
  const [user, setUser] = useState(null);
  const [coins, setCoins] = useState(0);
  const [completed, setCompleted] = useState(new Set());

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      if (u) {
        try {
          const snap = await getDoc(doc(db, "users", u.uid));
          if (snap.exists()) {
            const d = snap.data();
            setUser({ uid: u.uid, ...d });
            setCoins(d.coins || 0);
            setCompleted(new Set(Object.keys(d.completedTasks || {})));
            setScreen("main");
          }
        } catch {}
      }
    });
    return unsub;
  }, []);

  const handleAuth = d => { setUser(d); setCoins(d.coins || 50); setScreen("main"); };
  const handleLogout = async () => { await signOut(auth); setUser(null); setCoins(0); setCompleted(new Set()); setScreen("auth"); };

  const navTabs = [{ icon: "🏠", label: "Home" }, { icon: "🎁", label: "Rewards" }, { icon: "👥", label: "Refer" }, { icon: "👤", label: "Profile" }];

  return (
    <div style={{ width: "100%", maxWidth: 420, height: "100vh", position: "relative", overflow: "hidden", background: DARK, fontFamily: dm }}>
      <style>{KF}</style>
      {screen === "splash"     && <Splash onDone={() => setScreen("onboarding")} />}
      {screen === "onboarding" && <Onboarding onDone={() => setScreen("auth")} />}
      {screen === "auth"       && <Auth onAuth={handleAuth} />}
      {screen === "main" && (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {tab === 0 && <HomeTab    user={user} coins={coins} setCoins={setCoins} completed={completed} setCompleted={setCompleted} />}
          {tab === 1 && <RewardsTab coins={coins} setCoins={setCoins} user={user} />}
          {tab === 2 && <ReferTab   user={user} />}
          {tab === 3 && <ProfileTab user={user} coins={coins} onLogout={handleLogout} />}
          <div style={{ background: "rgba(7,9,15,0.96)", backdropFilter: "blur(22px)", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-around", alignItems: "center", paddingBottom: 18, paddingTop: 10, flexShrink: 0, animation: "navPop 0.6s cubic-bezier(.36,2,.5,1) 0.5s both" }}>
            {navTabs.map((t, i) => (
              <div key={i} onClick={() => setTab(i)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer", padding: "2px 14px" }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, background: tab === i ? `linear-gradient(135deg,${GOLD},${GOLD2})` : "transparent", transform: tab === i ? "scale(1.1) translateY(-2px)" : "scale(1)", transition: "all 0.28s cubic-bezier(.36,2,.5,1)", boxShadow: tab === i ? "0 4px 16px rgba(255,165,0,0.4)" : "none" }}>{t.icon}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: tab === i ? GOLD : "rgba(255,255,255,0.28)", transition: "color 0.2s" }}>{t.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
