/* ═══════════════════════ APP TAGS SYSTEM ═══════════════════════ */

// Retorna HTML dos chips de uma tag
function renderTagChip(tag,removable=false,ctx=''){
  const style=`background:${tag.cor}22;border:1px solid ${tag.cor}55;color:${tag.cor}`;
  const rm=removable?`<button class="chip-x" style="color:${tag.cor}88" onclick="removeTagFrom('${ctx}','${tag.id}')">×</button>`:'';
  return`<span class="chip" style="${style}" data-tag-id="${tag.id}">${esc(tag.nome)}${rm}</span>`;
}

// Gerenciar appTags (CRUD)
function openManageTagsModal(){if(!CAN.manageTags()){alert('Acesso restrito: apenas administradores podem gerenciar tags.');return;}
  const tagsHtml=state.appTags.map(t=>`
    <div style="display:flex;align-items:center;gap:7px;padding:5px 0;border-bottom:1px solid var(--border)">
      <span style="width:12px;height:12px;border-radius:50%;background:${t.cor};flex-shrink:0"></span>
      <span style="font-size:12px;color:var(--text);flex:1">${esc(t.nome)}</span>
      <span style="font-size:10px;color:var(--text3);font-family:var(--mono)">#${esc(t.id)}</span>
      <button class="sbtn" onclick="editAppTag('${t.id}')">✏</button>
      <button class="sbtn" onclick="delAppTag('${t.id}')">✕</button>
    </div>`).join('');
  showModal(`<h3>🏷️ Gerenciar tags</h3>
    <div style="max-height:200px;overflow-y:auto;margin-bottom:12px">${tagsHtml||'<div style="font-size:11px;color:var(--text3);padding:8px">Nenhuma tag criada</div>'}</div>
    <h4 style="font-size:12px;color:var(--text2);margin-bottom:8px">Nova tag</h4>
    <div class="mf"><label>Nome</label><input id="newTagNome" placeholder="Ex: Cliente XYZ"></div>
    <div class="mf"><label>Cor</label><div class="crow" id="newTagCorRow">
      ${['#fbbf24','#4f8ef7','#34d399','#f87171','#a78bfa','#fb923c','#38bdf8','#f472b6','#6ee7b7','#fca5a5'].map((c,i)=>
        `<span class="csw${i===0?' sel':''}" style="background:${c}" onclick="pickTagColor('${c}',this)"></span>`).join('')}
    </div></div>
    <div class="macts"><button class="btn" onclick="closeModal()">Fechar</button><button class="btn p" onclick="saveNewAppTag()">Criar tag</button></div>`);
  window._newTagCor='#fbbf24';
}
function pickTagColor(c,el){window._newTagCor=c;document.querySelectorAll('.csw').forEach(s=>s.classList.remove('sel'));el.classList.add('sel')}
function saveNewAppTag(){
  const nome=document.getElementById('newTagNome').value.trim();
  if(!nome)return;
  const id=nome.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
  if(state.appTags.find(t=>t.id===id)){alert('Tag já existe');return;}
  state.appTags.push({id,nome,cor:window._newTagCor||'#4f8ef7'});
  saveState(); openManageTagsModal();
}
function delAppTag(id){
  if(!confirm('Excluir tag?'))return;
  state.appTags=state.appTags.filter(t=>t.id!==id);
  // Remove de todos os processos
  Object.keys(state.processTags).forEach(k=>{state.processTags[k]=(state.processTags[k]||[]).filter(t=>t!==id);});
  saveState(); openManageTagsModal();
}
function editAppTag(id){
  const t=state.appTags.find(x=>x.id===id);if(!t)return;
  closeModal();
  showModal(`<h3>Editar tag: ${esc(t.nome)}</h3>
    <div class="mf"><label>Nome</label><input id="editTagNome" value="${esc(t.nome)}"></div>
    <div class="mf"><label>Cor</label><div class="crow">
      ${['#fbbf24','#4f8ef7','#34d399','#f87171','#a78bfa','#fb923c','#38bdf8','#f472b6','#6ee7b7','#fca5a5'].map(c=>
        `<span class="csw${c===t.cor?' sel':''}" style="background:${c}" onclick="pickTagColor('${c}',this)"></span>`).join('')}
    </div></div>
    <div class="macts"><button class="btn" onclick="openManageTagsModal()">Voltar</button><button class="btn p" onclick="saveEditAppTag('${id}')">Salvar</button></div>`);
  window._newTagCor=t.cor;
}
function saveEditAppTag(id){
  const nome=document.getElementById('editTagNome').value.trim();if(!nome)return;
  const t=state.appTags.find(x=>x.id===id);if(!t)return;
  t.nome=nome;t.cor=window._newTagCor||t.cor;
  saveState(); closeModal();
}

// Autocomplete de tags em inputs
// Registry global para callbacks de autocomplete de tags
const _tagACCallbacks={};
let _tagACCounter=0;

function tagAutocomplete(inputEl,onSelect){
  const val=inputEl.value.trim().toLowerCase();
  // Criar/encontrar a lista de autocomplete para este input
  let listId='tagac_'+( inputEl.dataset.tagacId||(inputEl.dataset.tagacId=++_tagACCounter));
  let list=document.getElementById(listId);
  if(!list){
    list=document.createElement('div');
    list.id=listId;
    list.className='ac-list';
    list.style.cssText='position:absolute;z-index:500;min-width:200px';
    const parent=inputEl.parentNode;
    if(getComputedStyle(parent).position==='static') parent.style.position='relative';
    parent.appendChild(list);
  }
  // Guardar callback no registry
  _tagACCallbacks[listId]=onSelect;
  if(!val){list.classList.remove('show');return;}
  const matches=state.appTags.filter(t=>t.nome.toLowerCase().includes(val)||t.id.includes(val));
  if(!matches.length){list.classList.remove('show');return;}
  list.innerHTML=matches.map(t=>`<div class="ac-item" style="border-left:3px solid ${t.cor};padding:5px 10px;cursor:pointer" onmousedown="event.preventDefault()" onclick="_tagACSelect('${listId}','${t.id}')">
    <span style="color:${t.cor};font-weight:500">${esc(t.nome)}</span> <span class="ac-sub">#${esc(t.id)}</span>
  </div>`).join('');
  list.classList.add('show');
}

function _tagACSelect(listId,tagId){
  const cb=_tagACCallbacks[listId];
  if(cb) cb(tagId);
  const list=document.getElementById(listId);
  if(list) list.classList.remove('show');
}

// Fechar todos os AC de tags ao clicar fora
document.addEventListener('click',e=>{
  if(!e.target.closest('.ac-list')&&!e.target.dataset.tagacId){
    document.querySelectorAll('[id^=tagac_]').forEach(el=>el.classList.remove('show'));
  }
});

// Tags por processo
function getProcessTags(numProcesso){return(state.processTags[numProcesso]||[]).map(id=>state.appTags.find(t=>t.id===id)).filter(Boolean);}
function addTagToProcess(numProcesso,tagId){
  if(!state.processTags[numProcesso])state.processTags[numProcesso]=[];
  if(!state.processTags[numProcesso].includes(tagId))state.processTags[numProcesso].push(tagId);
  saveState(); renderResults();
}
function removeTagFrom(numProcesso,tagId){
  if(!state.processTags[numProcesso])return;
  state.processTags[numProcesso]=state.processTags[numProcesso].filter(t=>t!==tagId);
  saveState(); renderResults();
}

// Autocomplete de tags para advogados (chip input)
function addAdvTagWithAC(e,inputEl){
  if(e.key!=='Enter'&&e.key!==',')return;
  e.preventDefault();
  const v=e.target.value.trim().toLowerCase().replace(/\s+/g,'-');if(!v)return;
  const box=document.getElementById('advTagBox'),inp=inputEl||document.getElementById('ati');
  const existing=state.appTags.find(t=>t.id===v||t.nome.toLowerCase()===v);
  const sp=document.createElement('span');sp.className='chip';sp.dataset.tag=v;
  const cor=existing?.cor||'var(--accent)';
  sp.style.cssText=`background:${cor}22;border:1px solid ${cor}55;color:${cor}`;
  sp.innerHTML=`${esc(existing?.nome||v)}<button class="chip-x" style="color:${cor}88" onclick="rmAdvChip('${v.replace(/'/g,"\\'")}')">×</button>`;
  box.insertBefore(sp,inp);inp.value='';
  // Fechar autocomplete
  document.getElementById('tag-ac-list')?.classList.remove('show');
}

/* ═══════════════════════════ FAVORITES + HASH/PARTS ════════════════════ */

function getHash(it){
  return it.hash||it.id||[
    (it.numero_processo||it.numeroProcesso||''),
    (it.data_disponibilizacao||it.dataDisponibilizacao||''),
    (it.tipoComunicacao||''),
    (it.siglaTribunal||it.orgao||'')
  ].join('|');
}

function getParts(it){
  const l=it.destinatarios||it.partes||[];
  if(Array.isArray(l)&&l.length)
    return l.map(p=>p.nome||p.nomeParte||p.name||'').filter(Boolean).slice(0,3).join(', ')+(l.length>3?` +${l.length-3}`:'');
  return '';
}

function toggleFav(hash,btn){
  const it=_getItem(hash)||state.favCache[hash]||{};
  const idx=state.favorites.indexOf(hash);
  if(idx>=0){
    state.favorites.splice(idx,1);
    delete state.favCache[hash];
    if(btn){btn.classList.remove('on');btn.textContent='☆';}
    // Remover classe fav-card do card pai
    const card=btn?.closest?.('.pub-card');
    if(card)card.classList.remove('fav-card');
  } else {
    state.favorites.push(hash);
    state.favCache[hash]=it;
    if(btn){btn.classList.add('on');btn.textContent='⭐';}
    const card=btn?.closest?.('.pub-card');
    if(card)card.classList.add('fav-card');
  }
  saveState();
  renderFavsList();
  const fb=document.getElementById('favBadge');
  if(fb)fb.textContent=state.favorites.length||'';
}

function removeFav(hash){
  const idx=state.favorites.indexOf(hash);
  if(idx>=0){state.favorites.splice(idx,1);delete state.favCache[hash];}
  saveState();renderFavsList();renderFavsPanel();
  const fb=document.getElementById('favBadge');
  if(fb)fb.textContent=state.favorites.length||'';
}

function renderFavsList(){
  const el=document.getElementById('favs-inner');
  if(!el)return;
  if(!state.favorites.length){
    el.innerHTML=`<div style="padding:14px 10px;text-align:center;font-size:11px;color:var(--text3)">Nenhum favorito</div>`;
    return;
  }
  el.innerHTML=state.favorites.map(h=>{
    const it=state.favCache[h]||{};
    const num=it.numero_processo||it.numeroProcesso||it.numero||h.slice(0,12)+'…';
    const data=dateToDisplay(it.data_disponibilizacao||it.dataDisponibilizacao||'');
    const org=it.siglaTribunal||it.orgao||'';
    return`<div class="fav-item" onclick="switchRTab('favorites');renderFavsPanel()">
      <span style="font-size:11px">⭐</span>
      <div style="flex:1;min-width:0">
        <div class="fav-num">${esc(num)}</div>
        <div class="fav-meta">${esc(data)} ${esc(org)}</div>
      </div>
      <button class="ib" style="padding:2px 5px;font-size:10px" onclick="event.stopPropagation();removeFav('${h}')">✕</button>
    </div>`;
  }).join('');
}

function renderFavsPanel(){
  const el=document.getElementById('favoritesContent');
  if(!el)return;
  if(!state.favorites.length){
    el.innerHTML=`<div class="empty"><div class="ei">⭐</div><div class="et">Nenhuma publicação favoritada</div><div class="es">Use o ☆ nas publicações</div></div>`;
    return;
  }
  const items=state.favorites.map(h=>state.favCache[h]).filter(Boolean);
  const allSel=items.length>0&&items.every(it=>selectedForFav.has(getHash(it)));
  el.innerHTML=`<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid var(--border)">
    <span style="font-size:10px;color:var(--text3);font-family:var(--mono);flex:1">${items.length} favoritada(s)</span>
    <button class="ib" style="font-size:10px;padding:3px 8px" onclick="selectAllFavs()">${allSel?'☑ Desmarcar tudo':'☐ Selecionar tudo'}</button>
    <button class="ib" style="font-size:10px;padding:3px 8px;color:var(--red)" onclick="removeAllFavs()" title="Desfavoritar todas">✕ Todas</button>
  </div>${items.map((it,i)=>buildPubCard(it,'fav_'+i)).join('')}`;
}

function selectAllFavs(){
  const items=state.favorites.map(h=>state.favCache[h]).filter(Boolean);
  const allSel=items.length>0&&items.every(it=>selectedForFav.has(getHash(it)));
  items.forEach(it=>{const h=getHash(it);allSel?selectedForFav.delete(h):selectedForFav.add(h);});
  renderFavsPanel();
}
function removeAllFavs(){
  if(!confirm('Desfavoritar todas as publicações?'))return;
  state.favorites=[];state.favCache={};
  saveState();renderFavsList();
  const fb=document.getElementById('favBadge');if(fb)fb.textContent='';
  renderFavsPanel();
}


/* ══════════════ PROCESS MONITORING (PUSH) ══════════════════ */
function toggleMonitor(numProcesso){
  const idx=state.monitoredProcesses.findIndex(p=>p.numero===numProcesso);
  if(idx>=0){
    state.monitoredProcesses.splice(idx,1);
  } else {
    state.monitoredProcesses.push({
      numero:numProcesso,
      addedAt:new Date().toISOString(),
      lastChecked:null,
      lastHash:null
    });
  }
  saveState(); renderResults();
  // Atualizar badge e painel se estiver aberto
  const badge=document.getElementById('monitorBadge');
  if(badge)badge.textContent=state.monitoredProcesses.length||'';
  const panel=document.getElementById('monitorContent');
  if(panel&&document.getElementById('panel-monitor')?.classList.contains('show'))renderMonitorPanel();
}

function renderMonitorPanel(){
  const el=document.getElementById('monitorContent');
  if(!el)return;
  const list=state.monitoredProcesses;

  // Atualiza badge
  const badge=document.getElementById('monitorBadge');
  if(badge)badge.textContent=list.length||'';

  if(!list.length){
    el.innerHTML=`<div class="empty">
      <div class="ei">🔔</div>
      <div class="et">Nenhum processo monitorado</div>
      <div class="es">Use o botão 🔔 em cada publicação para monitorar um processo</div>
    </div>
    <div style="padding:12px 16px">
      <div style="font-size:11px;color:var(--text2);margin-bottom:8px">Adicionar manualmente:</div>
      <div style="display:flex;gap:6px">
        <input id="monitorNewProc" placeholder="Número do processo…" class="plain-input" style="flex:1">
        <button class="run-btn" style="flex:0;padding:6px 14px;font-size:11px" onclick="addMonitorManualPanel()">+</button>
      </div>
    </div>`;
    return;
  }

  el.innerHTML=`
    <div style="padding:10px 16px 6px;display:flex;align-items:center;justify-content:space-between;gap:8px;border-bottom:1px solid var(--border)">
      <span style="font-size:11px;color:var(--text2)">${list.length} processo(s) monitorado(s)</span>
      <button class="ib" style="font-size:11px;padding:4px 10px" onclick="checkAllMonitored();renderMonitorPanel()">🔍 Verificar agora</button>
    </div>
    <div style="padding:0 16px">
      ${list.map(p=>`
        <div style="display:flex;align-items:center;gap:8px;padding:9px 0;border-bottom:1px solid var(--border)">
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:500;color:var(--accent);font-family:var(--mono);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(p.numero)}</div>
            <div style="font-size:10px;color:var(--text3);margin-top:2px">
              ${p.lastChecked?'✓ verificado em '+dateToDisplay(p.lastChecked.slice(0,10)):'Ainda não verificado'}
              ${p.addedAt?' · adicionado em '+dateToDisplay(p.addedAt.slice(0,10)):''}
            </div>
          </div>
          <button class="ib" style="padding:3px 8px;font-size:11px;color:var(--red)" onclick="toggleMonitor('${p.numero.replace(/'/g,"\\'")}');renderMonitorPanel()" title="Remover">✕</button>
        </div>`).join('')}
    </div>
    <div style="padding:12px 16px">
      <div style="font-size:11px;color:var(--text2);margin-bottom:8px">Adicionar manualmente:</div>
      <div style="display:flex;gap:6px">
        <input id="monitorNewProc" placeholder="Número do processo…" class="plain-input" style="flex:1">
        <button class="run-btn" style="flex:0;padding:6px 14px;font-size:11px" onclick="addMonitorManualPanel()">+</button>
      </div>
    </div>`;
}

function addMonitorManualPanel(){
  const n=document.getElementById('monitorNewProc')?.value.trim();
  if(!n)return;
  if(!state.monitoredProcesses.find(p=>p.numero===n)){
    state.monitoredProcesses.push({numero:n,addedAt:new Date().toISOString(),lastChecked:null,lastHash:null});
    saveState();
  }
  renderMonitorPanel();
}


function openMonitorModal(){
  const list=state.monitoredProcesses;
  showModal(`<h3>🔔 Processos monitorados</h3>
    <p style="font-size:11px;color:var(--text3);margin-bottom:10px">
      ${list.length?list.length+' processo(s) monitorado(s)':'Nenhum processo monitorado ainda.'}<br>
      O sistema verifica automaticamente ao abrir o app e a cada busca executada.
    </p>
    ${list.map(p=>`<div style="display:flex;align-items:center;gap:7px;padding:5px 0;border-bottom:1px solid var(--border)">
      <span style="font-size:11px;font-family:var(--mono);color:var(--accent);flex:1">${esc(p.numero)}</span>
      <span style="font-size:10px;color:var(--text3)">${p.lastChecked?'Verificado '+dateToDisplay(p.lastChecked.slice(0,10)):'Nunca verificado'}</span>
      <button class="sbtn" onclick="toggleMonitor('${p.numero.replace(/'/g,"\\'")}')">✕</button>
    </div>`).join('')}
    <div style="margin-top:12px">
      <div class="mf"><label>Adicionar processo manualmente</label>
        <div style="display:flex;gap:5px">
          <input id="monitorNewProc" placeholder="Número do processo…" style="flex:1;font-size:12px;padding:5px 9px;border:1px solid var(--border2);border-radius:var(--r);background:var(--bg3);color:var(--text);outline:none">
          <button class="btn p" style="padding:5px 10px" onclick="addMonitorManual()">+</button>
        </div>
      </div>
    </div>
    <div class="macts"><button class="btn p" onclick="checkAllMonitored();closeModal()">🔍 Verificar agora</button><button class="btn" onclick="closeModal()">Fechar</button></div>`);
}
function addMonitorManual(){
  const n=document.getElementById('monitorNewProc').value.trim();
  if(!n)return;
  if(!state.monitoredProcesses.find(p=>p.numero===n)){
    state.monitoredProcesses.push({numero:n,addedAt:new Date().toISOString(),lastChecked:null,lastHash:null});
    saveState();
  }
  openMonitorModal();
}
async function checkAllMonitored(){
  if(!state.monitoredProcesses.length)return;
  for(const proc of state.monitoredProcesses){
    try{
      const r=await fetch(`${API}?numeroProcesso=${encodeURIComponent(proc.numero)}&pagina=1&itensPorPagina=1`,{headers:{Accept:'application/json'}});
      if(!r.ok)continue;
      const d=await r.json();
      const items=Array.isArray(d)?d:(d.items||d.data||[]);
      if(items.length){
        const newHash=items[0].hash||items[0].id||'';
        if(newHash&&newHash!==proc.lastHash&&proc.lastHash!==null){
          // Nova publicação!
          if(Notification&&Notification.permission==='granted'){
            new Notification('Nova publicação PJe',{body:`Processo ${proc.numero} tem nova publicação`,icon:'⚖️'});
          } else {
            alert(`🔔 Nova publicação detectada!\nProcesso: ${proc.numero}`);
          }
        }
        proc.lastHash=newHash;
      }
      proc.lastChecked=new Date().toISOString();
    }catch(_){}
  }
  saveState();
}
// Solicitar permissão de notificação na inicialização
function requestNotificationPermission(){
  if(typeof Notification!=='undefined'&&Notification.permission==='default'){
    Notification.requestPermission();
  }
}

// input helper para adicionar tag por teclado
function addTagToProcess_input(e,num,inp){
  if(e.key!=='Enter'&&e.key!==',')return;
  e.preventDefault();
  const v=inp.value.trim().toLowerCase().replace(/\s+/g,'-');
  if(!v)return;
  const t=state.appTags.find(x=>x.id===v||x.nome.toLowerCase()===v.toLowerCase());
  if(t){addTagToProcess(num,t.id);}
  else{
    // Criar tag nova
    state.appTags.push({id:v,nome:inp.value.trim(),cor:'#4f8ef7'});
    saveState();
    addTagToProcess(num,v);
  }
  inp.value='';
}


/* ════════════════════════════════════════════════════════════
   FIREBASE CONFIG — substitua pelos valores do seu projeto
   https://console.firebase.google.com → Project Settings → Config
   ════════════════════════════════════════════════════════════ */
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyAW790Vj4-_eRRRTiLmTnVcNGWnEtwEgaI",
  authDomain:        "monitor-pje-5606c.firebaseapp.com",
  projectId:         "monitor-pje-5606c",
  storageBucket:     "monitor-pje-5606c.firebasestorage.app",
  messagingSenderId: "388207179407",
  appId:             "1:388207179407:web:a5d59140dd7188b18c22fa"
};

