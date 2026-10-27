// Armazenamento local por navegador e sincronização opcional pelo Firebase Firestore.
const PREFIX='zork-organiza-v1';
const copy=x=>JSON.parse(JSON.stringify(x));
export const uid=()=>globalThis.crypto?.randomUUID?.()||'id-'+Date.now()+'-'+Math.random().toString(36).slice(2);
const defaultPrefs={theme:'dark',style:'modern',mix:['tasks','calculator','notes','invest'],monthsCount:12,investStartYear:new Date().getFullYear(),investMode:'weekly',investType:'cdb',annualBase:10.5,percentCDI:100,investInitial:0,investMonthly:200,investYears:3};
let records={},prefs={...defaultPrefs},authUser=null,fire=null,unsubscribe=null,onChange=()=>{},onAccount=()=>{},remoteReady=false;
const pendingWrites=new Map();
const key=()=>`${PREFIX}:${authUser?'user:'+authUser.uid:'guest'}`;
function persist(){try{localStorage.setItem(key(),JSON.stringify({records,prefs}));}catch(e){console.warn('Armazenamento do navegador cheio',e)}}
function loadCache(){try{const v=JSON.parse(localStorage.getItem(key())||'{}');records=v.records||{};prefs={...defaultPrefs,...v.prefs};}catch{records={};prefs={...defaultPrefs}}}
export function subscribe(fn,acct){onChange=fn;onAccount=acct;}
export function currentUser(){return authUser}
export function firebaseReady(){return !!fire}
export function cloudReady(){return !!fire&&!!authUser&&remoteReady}
export function getPrefs(){return prefs}
export function setPrefs(patch){prefs={...prefs,...patch};persist();onChange('prefs');if(fire&&authUser)fire.setDoc(fire.doc(fire.db,'users',authUser.uid,'records','prefs_main'),{kind:'prefs',data:prefs,updatedAt:Date.now()}).catch(fail)}
export function list(kind){return Object.values(records).filter(x=>x.kind===kind).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0))}
export function get(id){return records[id]||null}
export function save(kind,data,syncDelay=0){const now=Date.now();const item={...data,id:data.id||uid(),kind,createdAt:data.createdAt||now,updatedAt:now};records[item.id]=item;persist();if(fire&&authUser){const owner=authUser.uid;const prior=pendingWrites.get(item.id);if(prior)clearTimeout(prior);const write=()=>{pendingWrites.delete(item.id);if(authUser?.uid===owner&&records[item.id])fire.setDoc(fire.doc(fire.db,'users',owner,'records',item.id),records[item.id]).catch(fail)};if(syncDelay)pendingWrites.set(item.id,setTimeout(write,syncDelay));else write()}return item}
export function remove(id){const pending=pendingWrites.get(id);if(pending)clearTimeout(pending);pendingWrites.delete(id);delete records[id];persist();if(fire&&authUser)fire.deleteDoc(fire.doc(fire.db,'users',authUser.uid,'records',id)).catch(fail)}
export function allData(){return {version:1,exportedAt:new Date().toISOString(),records:copy(records),prefs:copy(prefs)}}
export async function importData(data){if(!data||data.version!==1||typeof data.records!=='object'||Array.isArray(data.records))throw new Error('Formato de backup inválido');for(const rec of Object.values(data.records)){if(!rec||typeof rec!=='object'||!rec.id||!rec.kind)throw new Error('Item inválido no backup')};records=copy(data.records);prefs={...defaultPrefs,...(data.prefs||{})};persist();if(fire&&authUser){const snapshot=await fire.getDocs(fire.collection(fire.db,'users',authUser.uid,'records'));for(let i=0;i<snapshot.docs.length;i+=400){const batch=fire.writeBatch(fire.db);snapshot.docs.slice(i,i+400).forEach(d=>batch.delete(d.ref));await batch.commit()}for(const rec of Object.values(records)){await fire.setDoc(fire.doc(fire.db,'users',authUser.uid,'records',rec.id),rec)}await fire.setDoc(fire.doc(fire.db,'users',authUser.uid,'records','prefs_main'),{kind:'prefs',data:prefs,updatedAt:Date.now()})}onChange('all')}
function fail(err){console.error('Sincronização:',err);onAccount('sync-error',err)}
export async function initFirebase(){loadCache();onChange('all');const cfg=window.ZORK_FIREBASE_CONFIG;if(!cfg||!cfg.apiKey||!cfg.projectId)return;
try{
 const [{initializeApp},{getAuth,GoogleAuthProvider,signInWithPopup,signInWithRedirect,getRedirectResult,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut,onAuthStateChanged,sendPasswordResetEmail},{getFirestore,collection,doc,setDoc,deleteDoc,onSnapshot,getDocs,writeBatch,enableIndexedDbPersistence}]=await Promise.all([
 import('https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js'),
 import('https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js'),
 import('https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js')]);
 const app=initializeApp(cfg);const auth=getAuth(app);const db=getFirestore(app);
 fire={auth,db,GoogleAuthProvider,signInWithPopup,signInWithRedirect,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut,sendPasswordResetEmail,collection,doc,setDoc,deleteDoc,onSnapshot,getDocs,writeBatch};
 enableIndexedDbPersistence(db).catch(()=>{});
 getRedirectResult(auth).catch(fail);
 onAuthStateChanged(auth,async user=>{if(unsubscribe){unsubscribe();unsubscribe=null;}authUser=user;remoteReady=false;loadCache();onAccount('user');onChange('all');if(!user)return;
  const coll=collection(db,'users',user.uid,'records');let initial=true;
  unsubscribe=onSnapshot(coll,snap=>{
   if(initial){initial=false;remoteReady=true;
     if(snap.empty){ // não importar dados de visitante sem consentimento
       records={};prefs={...defaultPrefs};persist();onAccount('empty-cloud');onChange('all');return;
     }
     records={};prefs={...defaultPrefs};
     for(const d of snap.docs){const v=d.data();if(d.id==='prefs_main')prefs={...defaultPrefs,...(v.data||{})};else if(v.kind)records[d.id]=v}
     persist();onAccount('synced');onChange('all');return;
   }
   for(const ch of snap.docChanges()){const d=ch.doc;if(d.id==='prefs_main'){if(ch.type==='removed')prefs={...defaultPrefs};else prefs={...defaultPrefs,...(d.data().data||{})};continue}
    if(ch.type==='removed')delete records[d.id];else records[d.id]=d.data();}
   persist();onChange('remote');
  },fail);
 });
 onAccount('firebase-ready');
}catch(e){console.error(e);onAccount('firebase-error',e)}
}
export async function loginGoogle(){if(!fire)throw new Error('Configure o Firebase primeiro.');const provider=new fire.GoogleAuthProvider();try{await fire.signInWithPopup(fire.auth,provider)}catch(e){if(e.code==='auth/popup-blocked'||e.code==='auth/cancelled-popup-request')await fire.signInWithRedirect(fire.auth,provider);else throw e}}
export async function loginEmail(email,password,create=false){if(!fire)throw new Error('Configure o Firebase primeiro.');return create?fire.createUserWithEmailAndPassword(fire.auth,email,password):fire.signInWithEmailAndPassword(fire.auth,email,password)}
export async function resetPassword(email){if(!fire)throw new Error('Configure o Firebase primeiro.');return fire.sendPasswordResetEmail(fire.auth,email)}
export async function logout(){for(const id of pendingWrites.keys()){const item=records[id];if(fire&&authUser&&item)await fire.setDoc(fire.doc(fire.db,'users',authUser.uid,'records',id),item)}for(const t of pendingWrites.values())clearTimeout(t);pendingWrites.clear();if(fire)await fire.signOut(fire.auth)}
export function guestDataExists(){try{const g=JSON.parse(localStorage.getItem(`${PREFIX}:guest`)||'{}');return !!Object.keys(g.records||{}).length}catch{return false}}
export async function importGuest(){const g=JSON.parse(localStorage.getItem(`${PREFIX}:guest`)||'{}');if(!g.records)return;for(const rec of Object.values(g.records)){save(rec.kind,{...rec,id:uid()})}onChange('all')}
