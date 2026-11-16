// 저장소 계층 — Firebase 설정이 있으면 Firestore, 없으면 브라우저 localStorage(데모 모드)
import { firebaseConfig } from './firebase-config.js';

const FB = 'https://www.gstatic.com/firebasejs/10.12.2';
export const DEMO = !firebaseConfig.apiKey;
const COL = 'responses';
const LOCAL_KEY = 'aiSurvey.demoResponses';

let _fb;
async function fb() {
  if (_fb) return _fb;
  const [{ initializeApp }, fs, auth] = await Promise.all([
    import(`${FB}/firebase-app.js`),
    import(`${FB}/firebase-firestore.js`),
    import(`${FB}/firebase-auth.js`),
  ]);
  const app = initializeApp(firebaseConfig);
  _fb = { fs, auth, db: fs.getFirestore(app), au: auth.getAuth(app) };
  return _fb;
}

function readLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); } catch { return []; }
}

export async function saveResponse(doc) {
  if (DEMO) {
    const all = readLocal();
    all.push({ ...doc, submittedAt: new Date().toISOString() });
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(all)); } catch {}
    return;
  }
  const { fs, db } = await fb();
  await fs.addDoc(fs.collection(db, COL), { ...doc, submittedAt: fs.serverTimestamp() });
}

// ── 관리자용 ──
export async function adminSignIn() {
  if (DEMO) return { email: 'demo' };
  const { auth, au } = await fb();
  const res = await auth.signInWithPopup(au, new auth.GoogleAuthProvider());
  return res.user;
}
export async function adminSignOut() {
  if (DEMO) return;
  const { auth, au } = await fb();
  await auth.signOut(au);
}
export async function onAdmin(cb) {
  if (DEMO) return cb({ email: '데모 모드' });
  const { auth, au } = await fb();
  auth.onAuthStateChanged(au, cb);
}
export async function loadResponses() {
  if (DEMO) return readLocal();
  const { fs, db } = await fb();
  const snap = await fs.getDocs(fs.query(fs.collection(db, COL), fs.orderBy('submittedAt', 'desc')));
  return snap.docs.map((d) => {
    const x = d.data();
    return { id: d.id, ...x, submittedAt: x.submittedAt?.toDate?.().toISOString() ?? '' };
  });
}
