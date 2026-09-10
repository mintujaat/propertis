import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, setDoc, serverTimestamp, getDoc } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import { firebaseConfig, IMGBB_API_KEY } from './firebase-config.js';

const ADMIN_PASSWORD = 'mintupulkit';
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const $ = id => document.getElementById(id);
let cats = [];

function showDashboard(){
  $('loginBox').classList.add('hidden');
  $('dashboard').classList.remove('hidden');
  loadAdmin();
}
function showLogin(){
  $('loginBox').classList.remove('hidden');
  $('dashboard').classList.add('hidden');
}

$('loginBtn').onclick = () => {
  const password = $('password')?.value || '';
  if (password === ADMIN_PASSWORD) {
    sessionStorage.setItem('nestora_admin', '1');
    $('loginMsg').textContent = '';
    showDashboard();
  } else {
    $('loginMsg').textContent = 'Wrong password.';
  }
};

$('password').addEventListener('keydown', e => {
  if (e.key === 'Enter') $('loginBtn').click();
});

$('logoutBtn').onclick = () => {
  sessionStorage.removeItem('nestora_admin');
  showLogin();
};

if (sessionStorage.getItem('nestora_admin') === '1') showDashboard();
else showLogin();

async function loadAdmin(){
  try {
    const s = await getDocs(collection(db,'categories'));
    cats = s.docs.map(x => ({id:x.id,...x.data()}));
    renderCats();
    const settings = await getDoc(doc(db,'settings','site'));
    if(settings.exists()){
      const d = settings.data();
      $('marqueeInput').value = d.marquee || '';
      $('waInput').value = d.whatsapp || '';
    }
    fillSelect();
    renderProps();
  } catch(e) {
    console.error(e);
    $('loginMsg').textContent = e.message;
  }
}

function renderCats(){
  $('catList').innerHTML = cats.map(c => `<span class="chip">${esc(c.name)} <button data-id="${c.id}">×</button></span>`).join('');
  $('catList').querySelectorAll('button').forEach(b => b.onclick = async () => {
    await deleteDoc(doc(db,'categories',b.dataset.id));
    loadAdmin();
  });
}

$('addCat').onclick = async () => {
  const n = $('catInput').value.trim();
  if(!n) return;
  await addDoc(collection(db,'categories'), {name:n,createdAt:serverTimestamp()});
  $('catInput').value='';
  loadAdmin();
};

function fillSelect(){
  $('pCategory').innerHTML = '<option value="">Select category</option>' + cats.map(c => `<option value="${esc(c.name)}">${esc(c.name)}</option>`).join('');
}

$('saveSettings').onclick = async () => {
  await setDoc(doc(db,'settings','site'), {
    marquee:$('marqueeInput').value.trim(),
    whatsapp:$('waInput').value.replace(/\D/g,''),
    updatedAt:serverTimestamp()
  }, {merge:true});
  $('settingsMsg').textContent='Settings saved.';
};

async function uploadImg(file){
  const fd = new FormData();
  fd.append('image',file);
  const r = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,{method:'POST',body:fd});
  const j = await r.json();
  if(!j.success) throw new Error('ImgBB upload failed');
  return j.data.url;
}

$('addProperty').onclick = async () => {
  const files = [...$('pImages').files];
  if(!$('pTitle').value.trim() || !$('pCategory').value || !files.length){
    $('uploadStatus').textContent='Title, category and at least one image are required.';
    return;
  }
  try{
    $('addProperty').disabled=true;
    $('uploadStatus').textContent='Uploading images…';
    const urls=[];
    for(let i=0;i<files.length;i++){
      urls.push(await uploadImg(files[i]));
      $('uploadStatus').textContent=`Uploaded ${i+1}/${files.length} images…`;
    }
    const settings=await getDoc(doc(db,'settings','site'));
    const wa=settings.exists()?settings.data().whatsapp||'':'';
    await addDoc(collection(db,'properties'),{
      title:$('pTitle').value.trim(),
      price:$('pPrice').value.trim(),
      location:$('pLocation').value.trim(),
      category:$('pCategory').value,
      description:$('pDesc').value.trim(),
      images:urls,
      whatsapp:wa,
      createdAt:serverTimestamp()
    });
    ['pTitle','pPrice','pLocation','pDesc'].forEach(x=>$(x).value='');
    $('pImages').value='';
    $('uploadStatus').textContent='Property added successfully.';
    renderProps();
  }catch(e){
    console.error(e);
    $('uploadStatus').textContent=e.message;
  }finally{
    $('addProperty').disabled=false;
  }
};

async function renderProps(){
  const s=await getDocs(collection(db,'properties'));
  const arr=s.docs.map(x=>({id:x.id,...x.data()}));
  $('count').textContent=`${arr.length} listing${arr.length===1?'':'s'}`;
  $('adminProperties').innerHTML=arr.map(p=>`<div class="adminProp"><img src="${p.images?.[0]||''}"><div><b>${esc(p.title)}</b><small>${esc(p.category||'')} • ${esc(p.price||'')}</small><small>📍 ${esc(p.location||'')}</small></div><button class="danger" data-id="${p.id}">Delete</button></div>`).join('');
  $('adminProperties').querySelectorAll('.danger').forEach(b=>b.onclick=async()=>{
    if(confirm('Delete this property?')){
      await deleteDoc(doc(db,'properties',b.dataset.id));
      renderProps();
    }
  });
}

function esc(v=''){
  return String(v).replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));
}
