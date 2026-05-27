/* ════════════ AUTH STATE ════════════ */
let currentUser   = null;  // Firebase user object
let currentRole   = null;  // 'superadmin' | 'admin' | 'user'
let currentProfile= null;  // Firestore doc {email,name,role,createdAt,photoURL}
let _fbApp=null, _fbAuth=null, _fbDb=null;
let _authReady=false;

// Role helpers
const isSuperAdmin = () => currentRole === 'superadmin';
const isAdmin      = () => currentRole === 'admin' || currentRole === 'superadmin';
const isUser       = () => !!currentRole; // any logged-in user

// Feature permission map
const CAN = {
  search:          () => isUser(),
  export:          () => isUser(),
  favorites:       () => isUser(),
  monitor:         () => isUser(),
  processTags:     () => isUser(),
  manageAdvogados: () => isAdmin(),
  manageTags:      () => isAdmin(),
  manageSavedTags: () => isAdmin(),
  manageUsers:     () => isSuperAdmin(),
};

/* ════════════ FIREBASE INIT ════════════ */
async function initFirebase(){
  try{
    // Dynamic import of Firebase SDK (CDN)
    const {initializeApp}=await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const {getAuth,GoogleAuthProvider,signInWithPopup,signOut,onAuthStateChanged}
      =await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
    const {getFirestore,doc,getDoc,setDoc,collection,getDocs,updateDoc,serverTimestamp,query,orderBy}
      =await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

    _fbApp  = initializeApp(FIREBASE_CONFIG);
    _fbAuth = getAuth(_fbApp);
    _fbDb   = getFirestore(_fbApp);

    // Guardar helpers no escopo global
    window._fb={getAuth,GoogleAuthProvider,signInWithPopup,signOut,onAuthStateChanged,
      getFirestore,doc,getDoc,setDoc,collection,getDocs,updateDoc,serverTimestamp,query,orderBy};

    onAuthStateChanged(_fbAuth, async fbUser=>{
      if(fbUser){
        await handleSignedIn(fbUser);
      } else {
        handleSignedOut();
      }
      _authReady=true;
    });
  }catch(e){
    console.error('Firebase init error:',e);
    // Fallback: se Firebase falhar (sem internet, config errada), mostra tela de erro
    showAuthError('Erro ao conectar com o serviço de autenticação. Verifique a configuração do Firebase.');
  }
}

async function handleSignedIn(fbUser){
  currentUser=fbUser;
  // Buscar perfil no Firestore
  const {doc,getDoc,setDoc,getDocs,collection,serverTimestamp}=window._fb;
  const userRef=doc(_fbDb,'users',fbUser.uid);
  let snap=await getDoc(userRef);

  if(!snap.exists()){
    // Primeiro login: verificar se é o primeiro usuário do sistema (→ superadmin)
    const allSnap=await getDocs(collection(_fbDb,'users'));
    const role=allSnap.empty?'superadmin':'pending'; // pending = aguarda aprovação
    await setDoc(userRef,{
      email:fbUser.email,
      name:fbUser.displayName||fbUser.email,
      photoURL:fbUser.photoURL||'',
      role,
      createdAt:serverTimestamp(),
    });
    snap=await getDoc(userRef);
  }

  currentProfile=snap.data();
  currentRole=currentProfile.role;

  if(currentRole==='pending'){
    // Usuário aguardando aprovação
    showPendingScreen();
    return;
  }

  // Usuário aprovado — inicializar app
  hideAuthScreen();
  initApp();
  renderUserBadge();
}

function handleSignedOut(){
  currentUser=null; currentRole=null; currentProfile=null;
  showAuthScreen();
}

/* ════════════ SIGN IN / OUT ════════════ */
async function signInWithGoogle(){
  const{GoogleAuthProvider,signInWithPopup}=window._fb;
  const provider=new GoogleAuthProvider();
  provider.setCustomParameters({prompt:'select_account'});
  try{
    document.getElementById('authError').style.display='none';
    document.getElementById('googleBtn').disabled=true;
    document.getElementById('googleBtn').innerHTML=`<span class="spin">⟳</span> Entrando…`;
    await signInWithPopup(_fbAuth,provider);
  }catch(e){
    document.getElementById('googleBtn').disabled=false;
    document.getElementById('googleBtn').innerHTML=`${googleIcon()} Entrar com Google`;
    if(e.code!=='auth/popup-closed-by-user'){
      showAuthError('Erro ao entrar: '+e.message);
    }
  }
}

async function doSignOut(){
  closeUserMenu();
  await window._fb.signOut(_fbAuth);
}

/* ════════════ AUTH SCREENS ════════════ */
function showAuthScreen(){
  let el=document.getElementById('authScreen');
  if(!el){
    el=document.createElement('div');
    el.id='authScreen';
    el.className='auth-screen';
    el.innerHTML=`
      <div class="auth-card">
        <div class="auth-logo">⚖️</div>
        <div class="auth-title">Monitor Processual PJe</div>
        <div class="auth-sub">Acesse com sua conta Google para continuar.<br>Somente usuários autorizados têm acesso.</div>
        <button class="google-btn" id="googleBtn" onclick="signInWithGoogle()">
          ${googleIcon()} Entrar com Google
        </button>
        <div class="auth-note">Ao entrar, você concorda com o uso interno desta ferramenta.<br>Suas informações são usadas apenas para controle de acesso.</div>
        <div class="auth-error" id="authError"></div>
      </div>`;
    document.body.appendChild(el);
  }
  el.style.display='flex';
  document.querySelector('.app') && (document.querySelector('.app').style.display='none');
}

function hideAuthScreen(){
  const el=document.getElementById('authScreen');
  if(el) el.style.display='none';
  document.querySelector('.app') && (document.querySelector('.app').style.display='flex');
}

function showPendingScreen(){
  let el=document.getElementById('authScreen');
  if(!el){el=document.createElement('div');el.id='authScreen';el.className='auth-screen';document.body.appendChild(el);}
  el.style.display='flex';
  document.querySelector('.app') && (document.querySelector('.app').style.display='none');
  el.innerHTML=`
    <div class="auth-card">
      <div class="auth-logo">⏳</div>
      <div class="auth-title">Aguardando aprovação</div>
      <div class="auth-sub" style="margin-bottom:20px">Sua conta <strong style="color:var(--text)">${esc(currentUser?.email||'')}</strong> foi registrada.<br>Aguarde a aprovação de um administrador para acessar o sistema.</div>
      <button class="google-btn" onclick="doSignOut()">Sair</button>
    </div>`;
}

function showAuthError(msg){
  const el=document.getElementById('authError');
  if(el){el.textContent=msg;el.style.display='block';}
}

function googleIcon(){return`<svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/><path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04c-.72.48-1.63.77-2.7.77a4.82 4.82 0 01-4.56-3.34H1.74v2.07A8 8 0 008.98 17z"/><path fill="#FBBC05" d="M4.42 10.45a4.8 4.8 0 010-2.9V5.48H1.74a8 8 0 000 7.04l2.68-2.07z"/><path fill="#EA4335" d="M8.98 3.58c1.32 0 2.5.45 3.44 1.35l2.54-2.54A8 8 0 001.74 5.48l2.68 2.07A4.77 4.77 0 018.98 3.58z"/></svg>`;}

/* ════════════ USER BADGE + MENU ════════════ */
function renderUserBadge(){
  const topbar=document.querySelector('.topbar');
  if(!topbar||!currentUser) return;
  let badge=document.getElementById('userBadgeCont');
  if(!badge){
    badge=document.createElement('div');
    badge.id='userBadgeCont';
    badge.style.cssText='position:relative;margin-left:auto;flex-shrink:0';
    topbar.appendChild(badge);
  }
  const initials=(currentUser.displayName||currentUser.email||'?').slice(0,2).toUpperCase();
  const roleLabel={superadmin:'Super Admin',admin:'Admin',user:'Usuário',pending:'Pendente'}[currentRole]||currentRole;
  const roleClass='role-'+currentRole;
  badge.innerHTML=`
    <div class="user-badge" onclick="toggleUserMenu()">
      ${currentUser.photoURL
        ?`<img class="user-avatar" src="${esc(currentUser.photoURL)}" alt="">`
        :`<div class="user-avatar-initials">${esc(initials)}</div>`}
      <span class="user-name">${esc(currentUser.displayName||currentUser.email||'')}</span>
      <span class="user-role ${roleClass}">${esc(roleLabel)}</span>
    </div>
    <div class="user-menu" id="userMenu">
      <div class="user-menu-header">
        <div class="user-menu-name">${esc(currentUser.displayName||'')}</div>
        <div class="user-menu-email">${esc(currentUser.email||'')}</div>
      </div>
      ${isSuperAdmin()?`<div class="user-menu-item" onclick="closeUserMenu();switchRTab('users');renderUsersPanel()">👥 Gerenciar usuários</div>`:''}
      <div class="user-menu-sep"></div>
      <div class="user-menu-item danger" onclick="doSignOut()">⏏ Sair</div>
    </div>`;
  document.addEventListener('click',e=>{if(!e.target.closest('#userBadgeCont'))closeUserMenu();},{once:false,capture:false});
}

function toggleUserMenu(){const m=document.getElementById('userMenu');if(m)m.classList.toggle('open');}
function closeUserMenu(){const m=document.getElementById('userMenu');if(m)m.classList.remove('open');}

/* ════════════ USERS PANEL (superadmin only) ════════════ */
async function renderUsersPanel(){
  const el=document.getElementById('usersContent');
  if(!el)return;
  if(!isSuperAdmin()){
    el.innerHTML=`<div class="empty"><div class="ei">🔒</div><div class="et">Acesso restrito a superadministradores</div></div>`;
    return;
  }
  el.innerHTML=`<div class="empty"><div class="ei"><span class="spin">⟳</span></div><div class="et">Carregando usuários…</div></div>`;
  try{
    const{collection,getDocs,query,orderBy}=window._fb;
    const snap=await getDocs(query(collection(_fbDb,'users'),orderBy('createdAt','asc')));
    const users=[];
    snap.forEach(d=>users.push({uid:d.id,...d.data()}));

    el.innerHTML=`
      <div style="padding:12px 16px 8px;display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:12px;color:var(--text2)">${users.length} usuário(s) registrado(s)</span>
      </div>
      <div style="padding:0 12px">
        <table class="users-table">
          <thead><tr>
            <th>Usuário</th><th>E-mail</th><th>Papel</th><th>Cadastro</th><th></th>
          </tr></thead>
          <tbody>
            ${users.map(u=>{
              const isMe=u.uid===currentUser.uid;
              const dt=u.createdAt?.toDate?.()?u.createdAt.toDate().toLocaleDateString('pt-BR'):'—';
              return`<tr>
                <td>
                  ${u.photoURL?`<img src="${esc(u.photoURL)}" style="width:20px;height:20px;border-radius:50%;vertical-align:middle;margin-right:6px" alt="">`:''}
                  <span style="color:var(--text)">${esc(u.name||u.email||'')}</span>
                  ${isMe?`<span style="font-size:9px;color:var(--text3);margin-left:4px">(você)</span>`:''}
                </td>
                <td style="font-family:var(--mono);font-size:10px">${esc(u.email||'')}</td>
                <td>
                  ${isMe?`<span class="user-role role-${u.role}" style="font-size:10px">${{superadmin:'Super Admin',admin:'Admin',user:'Usuário',pending:'Pendente'}[u.role]||u.role}</span>`
                  :`<select class="role-sel" onchange="updateUserRole('${u.uid}',this.value)" ${u.role==='superadmin'?'disabled':''}>
                      <option value="pending" ${u.role==='pending'?'selected':''}>Pendente</option>
                      <option value="user"    ${u.role==='user'   ?'selected':''}>Usuário</option>
                      <option value="admin"   ${u.role==='admin'  ?'selected':''}>Admin</option>
                    </select>`}
                </td>
                <td style="font-size:10px">${dt}</td>
                <td>
                  ${!isMe&&u.role!=='superadmin'
                    ?`<button class="ib" style="padding:2px 8px;font-size:10px;color:var(--red)" onclick="removeUser('${u.uid}','${esc(u.name||u.email||'')}')">✕</button>`
                    :''}
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  }catch(e){
    el.innerHTML=`<div class="empty"><div class="et">Erro ao carregar usuários: ${esc(e.message)}</div></div>`;
  }
}

async function updateUserRole(uid,newRole){
  if(!isSuperAdmin())return;
  const{doc,updateDoc}=window._fb;
  try{
    await updateDoc(doc(_fbDb,'users',uid),{role:newRole});
    // Se o usuário estava na tela de pendente e agora foi aprovado, não tem como notificar
    // em tempo real sem subscription — exibe confirmação
    setStatus('ok',`Papel atualizado para "${newRole}"`);
  }catch(e){
    alert('Erro ao atualizar papel: '+e.message);
    renderUsersPanel();
  }
}

async function removeUser(uid,name){
  if(!isSuperAdmin())return;
  if(!confirm(`Remover o usuário "${name}" do sistema?\nEle precisará ser aprovado novamente se tentar entrar.`))return;
  const{doc,updateDoc}=window._fb;
  try{
    await updateDoc(doc(_fbDb,'users',uid),{role:'pending'});
    renderUsersPanel();
    setStatus('ok',`Acesso de "${name}" revogado`);
  }catch(e){
    alert('Erro: '+e.message);
  }
}

/* ════════════ PERMISSION GUARDS ════════════ */
// Aplica visibilidade baseada em permissões após renderização
function applyPermissions(){
  if(!currentRole)return;
  // Botões que só admins veem
  const adminOnly=[
    document.getElementById('lb-adv-add'),         // + novo advogado
    document.querySelector('button[onclick="openManageTagsModal()"]'), // 🏷️
  ];
  adminOnly.forEach(el=>{if(el)el.style.display=CAN.manageAdvogados()?'':'none';});

  // Esconder botões de edit/delete em cards de advogados (renderAdvsList já verifica)
  // Esconder aba Usuários se não for superadmin
  const tabUsers=document.getElementById('tab-users');
  if(tabUsers)tabUsers.style.display=isSuperAdmin()?'':'none';
}


