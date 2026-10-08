import {firebaseConfig} from './config.js';
export async function connect(){
 if(!firebaseConfig.apiKey){
  const key='nature-demo-v1'; let state=JSON.parse(localStorage.getItem(key)||'{}'); const listeners=[]; const channel=new BroadcastChannel(key);
  const emit=()=>listeners.forEach(f=>f(state));channel.onmessage=e=>{state=e.data;emit()};
  const uid=localStorage.natureDemoUid||(localStorage.natureDemoUid=crypto.randomUUID());
  return {demo:true,uid,login:async()=>{},create:async r=>{state[r]??={};},join:async()=>{},listen:(r,f)=>{const cb=s=>f(s[r]||{});listeners.push(cb);cb(state);return()=>listeners.splice(listeners.indexOf(cb),1)},put:async(r,k,id,data)=>{state[r]??={};state[r][k]??={};state[r][k][id]=data;localStorage.setItem(key,JSON.stringify(state));channel.postMessage(state);emit()},remove:async(r,k,id)=>{delete state[r]?.[k]?.[id];localStorage.setItem(key,JSON.stringify(state));channel.postMessage(state);emit()}};
 }
 const base='https://www.gstatic.com/firebasejs/12.19.0/';
 const [a,b,c]=await Promise.all([import(base+'firebase-app.js'),import(base+'firebase-auth.js'),import(base+'firebase-firestore.js')]);
 const app=a.initializeApp(firebaseConfig),auth=b.getAuth(app),db=c.getFirestore(app);
 await auth.authStateReady();if(!auth.currentUser)await b.signInAnonymously(auth);
 return {demo:false,get uid(){return auth.currentUser.uid},login:async()=>b.signInWithPopup(auth,new b.GoogleAuthProvider()),create:async r=>{const ref=c.doc(db,'rooms',r);const snap=await c.getDoc(ref);if(snap.exists()){if(snap.data().teacher!==auth.currentUser.uid)throw Error('다른 교사가 사용하는 수업 이름입니다. 새 이름을 입력하세요.');return;}await c.setDoc(ref,{teacher:auth.currentUser.uid,createdAt:Date.now()})},join:async(r,g,name)=>{const ref=c.doc(db,'rooms',r,'members',auth.currentUser.uid);const snap=await c.getDoc(ref);if(snap.exists()&&snap.data().group!==g)throw Error('이 기기는 이미 '+snap.data().group+'모둠에 참여했습니다.');await c.setDoc(ref,{group:g,name})},listen:(r,f,err)=>{const state={},unsubs=['artworks','themes','positions'].map(k=>c.onSnapshot(c.collection(db,'rooms',r,k),s=>{state[k]=Object.fromEntries(s.docs.map(d=>[d.id,d.data()]));f(state)},err));return()=>unsubs.forEach(u=>u())},put:(r,k,id,data)=>c.setDoc(c.doc(db,'rooms',r,k,id),data),remove:(r,k,id)=>c.deleteDoc(c.doc(db,'rooms',r,k,id))};
}
