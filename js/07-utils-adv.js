/* ═══════════════════════════ UTILS ═══════════════════════════ */
function setStatus(s,txt){document.getElementById('sdot').className=`sdot${s==='loading'?' loading':s==='ok'?' ok':s==='error'?' error':''}`;document.getElementById('stxt').textContent=txt}
function showModal(html){document.getElementById('mBox').innerHTML=html;document.getElementById('mBg').style.display='flex';setTimeout(()=>{const e=document.getElementById('advNome');if(e)e.focus()},50)}
function closeModal(){document.getElementById('mBg').style.display='none'}
function closeModalIf(e){if(e.target===document.getElementById('mBg'))closeModal()}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function openLink(u){window.open(u,'_blank')}


/* ═══════════════════════════ SAVED TAGS ══════════════════════ */
const TAG_COLORS=['#4f8ef7','#34d399','#f87171','#fbbf24','#a78bfa','#fb923c','#38bdf8','#f472b6'];
const _STL_COLORS=['#4f8ef7','#34d399','#f87171','#fbbf24','#a78bfa','#fb923c','#38bdf8','#f472b6','#6ee7b7','#fca5a5'];

/**
 * Aba Tags — gerencia state.appTags (tags globais).
 * Edição é inline, sem modal.
 * Salvar parâmetros como tag (savedTags) está no botão + Nova dentro da aba Tags.
 */
function renderSavedTags(){
  const el=document.getElementById('saved-tags-list');
  if(!el)return;
  // Reconstrói sempre (garante que novos itens aparecem)
  el.innerHTML=`
    <div style="display:flex;gap:5px;align-items:center;padding:5px 8px;border-bottom:1px solid var(--border)">
      <input id="stl-search" type="text" placeholder="🔍 Buscar tag…"
        style="flex:1;font-size:11px;padding:4px 8px;border:1px solid var(--border2);border-radius:var(--r);background:var(--bg3);color:var(--text);font-family:var(--sans);outline:none"
        oninput="renderSavedTagsList(this.value)">
      <button onclick="openInlineNewAppTag()" title="Nova tag"
        style="padding:3px 8px;border-radius:var(--r);border:1px dashed var(--border2);background:none;color:var(--text3);font-size:11px;cursor:pointer;font-family:var(--sans);white-space:nowrap;transition:all .12s"
        onmouseover="this.style.borderColor='var(--accent)';this.style.color='var(--accent)'"
        onmouseout="this.style.borderColor='var(--border2)';this.style.color='var(--text3)'">+ Nova</button>
    </div>
    <div id="stl-inline-new" style="display:none;padding:7px 8px;border-bottom:1px solid var(--border);background:var(--bg3)">
      <div style="display:flex;gap:5px;align-items:center;margin-bottom:5px">
        <input id="stl-new-nome" placeholder="Nome da tag"
          style="flex:1;font-size:11px;padding:4px 8px;border:1px solid var(--border2);border-radius:var(--r);background:var(--bg2);color:var(--text);font-family:var(--sans);outline:none"
          onkeydown="if(event.key==='Enter')confirmInlineNewAppTag();if(event.key==='Escape')closeInlineNewAppTag()">
        <button onclick="confirmInlineNewAppTag()"
          style="padding:3px 10px;border-radius:var(--r);border:none;background:var(--accent);color:#fff;font-size:11px;cursor:pointer;font-family:var(--sans)">OK</button>
        <button onclick="closeInlineNewAppTag()"
          style="padding:3px 8px;border-radius:var(--r);border:1px solid var(--border2);background:none;color:var(--text3);font-size:11px;cursor:pointer">✕</button>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:4px" id="stl-new-colors">
        ${_STL_COLORS.map((c,i)=>`<span data-cor="${c}" style="width:16px;height:16px;border-radius:50%;background:${c};cursor:pointer;box-sizing:border-box;border:2px solid ${i===0?'rgba(255,255,255,.8)':'transparent'}" onclick="pickInlineTagColor('${c}',this)"></span>`).join('')}
      </div>
    </div>
    <div id="stl-list"></div>`;
  window._stlNewCor=_STL_COLORS[0];
  renderSavedTagsList('');
}

function openInlineNewAppTag(){
  const box=document.getElementById('stl-inline-new');
  if(!box)return;
  box.style.display='block';
  setTimeout(()=>document.getElementById('stl-new-nome')?.focus(),50);
}
function closeInlineNewAppTag(){
  const box=document.getElementById('stl-inline-new');
  if(box)box.style.display='none';
  const inp=document.getElementById('stl-new-nome');
  if(inp)inp.value='';
}
function pickInlineTagColor(c,el){
  window._stlNewCor=c;
  document.querySelectorAll('#stl-new-colors span').forEach(s=>s.style.borderColor='transparent');
  el.style.borderColor='rgba(255,255,255,.8)';
}
function confirmInlineNewAppTag(){
  if(!CAN.manageTags()){alert('Acesso restrito: apenas administradores podem gerenciar tags.');return;}
  const nome=document.getElementById('stl-new-nome')?.value.trim();
  if(!nome)return;
  const id=nome.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
  if(state.appTags.find(t=>t.id===id)){alert('Tag já existe');return;}
  state.appTags.push({id,nome,cor:window._stlNewCor||'#4f8ef7'});
  saveState();
  closeInlineNewAppTag();
  renderSavedTagsList('');
}

function renderSavedTagsList(query){
  const list=document.getElementById('stl-list');
  if(!list)return;
  const q=(query||'').toLowerCase().trim();
  function countUso(tagId){return(state.advogados||[]).filter(a=>(a.tags||[]).includes(tagId)).length;}
  function countProc(tagId){return Object.values(state.processTags||{}).filter(arr=>arr.includes(tagId)).length;}
  const tags=(state.appTags||[]).filter(t=>!q||t.nome.toLowerCase().includes(q)||t.id.includes(q));
  if(!tags.length){
    list.innerHTML=`<div style="font-size:10px;color:var(--text3);padding:12px;text-align:center">${q?'Nenhuma tag encontrada':'Nenhuma tag criada'}</div>`;
    return;
  }

  // Renderiza HTML usando data-* — sem nenhum onclick inline com aspas
  list.innerHTML=tags.map(t=>{
    const adv=countUso(t.id), proc=countProc(t.id);
    const hints=[adv?`${adv}👤`:'',proc?`${proc}📄`:''].filter(Boolean).join(' ');
    return `
    <div id="stl-row-${t.id}" data-tagid="${esc(t.id)}" style="border-bottom:1px solid var(--border)">
      <div class="stl-main-row" style="display:flex;align-items:center;gap:5px;padding:5px 9px;transition:background .1s">
        <span id="stl-dot-${t.id}" style="width:8px;height:8px;border-radius:50%;background:${t.cor||'#4f8ef7'};flex-shrink:0"></span>
        <span class="stl-nome" style="font-size:11px;color:var(--text);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="#${esc(t.id)}">${esc(t.nome)}</span>
        ${hints?`<span style="font-size:9px;color:var(--text3);font-family:var(--mono);flex-shrink:0">${hints}</span>`:''}
        <button class="ib stl-btn-search" data-tagid="${esc(t.id)}" style="padding:2px 6px;font-size:10px" title="Pesquisar por esta tag">▶</button>
        <button class="ib stl-btn-edit"   data-tagid="${esc(t.id)}" style="padding:2px 6px;font-size:10px" title="Editar tag">✏</button>
        <button class="ib stl-btn-del"    data-tagid="${esc(t.id)}" style="padding:2px 5px;font-size:10px" title="Excluir">✕</button>
      </div>
      <div id="stl-edit-${t.id}" style="display:none;padding:6px 9px 8px;background:var(--bg3)">
        <div style="display:flex;gap:5px;align-items:center;margin-bottom:5px">
          <input class="stl-edit-nome" data-tagid="${esc(t.id)}" value="${esc(t.nome)}"
            style="flex:1;font-size:11px;padding:3px 8px;border:1px solid var(--border2);border-radius:var(--r);background:var(--bg2);color:var(--text);font-family:var(--sans);outline:none">
          <button class="stl-btn-ok" data-tagid="${esc(t.id)}"
            style="padding:2px 9px;border-radius:var(--r);border:none;background:var(--accent);color:#fff;font-size:11px;cursor:pointer;font-family:var(--sans)">OK</button>
          <button class="stl-btn-cancel" data-tagid="${esc(t.id)}"
            style="padding:2px 7px;border-radius:var(--r);border:1px solid var(--border2);background:none;color:var(--text3);font-size:11px;cursor:pointer">✕</button>
        </div>
        <div class="stl-color-row" data-tagid="${esc(t.id)}" style="display:flex;flex-wrap:wrap;gap:4px">
          ${_STL_COLORS.map(c=>`<span data-cor="${c}" data-tagid="${esc(t.id)}" style="width:14px;height:14px;border-radius:50%;background:${c};cursor:pointer;box-sizing:border-box;border:2px solid ${c===t.cor?'rgba(255,255,255,.8)':'transparent'}"></span>`).join('')}
        </div>
      </div>
    </div>`;
  }).join('');

  // Inicializa cor de edição
  tags.forEach(t=>{ window[`_editCor_${t.id}`]=t.cor||'#4f8ef7'; });

  // Hover nas linhas principais
  list.querySelectorAll('.stl-main-row').forEach(row=>{
    row.addEventListener('mouseenter',()=>row.style.background='var(--bg3)');
    row.addEventListener('mouseleave',()=>row.style.background='none');
  });

  // Botão ▶ pesquisar
  list.querySelectorAll('.stl-btn-search').forEach(btn=>{
    btn.addEventListener('click',()=>injectAdvTag(btn.dataset.tagid));
  });

  // Botão ✏ editar — abre/fecha painel inline
  list.querySelectorAll('.stl-btn-edit').forEach(btn=>{
    btn.addEventListener('click',()=>toggleEditTagRow(btn.dataset.tagid));
  });

  // Botão ✕ excluir
  list.querySelectorAll('.stl-btn-del').forEach(btn=>{
    btn.addEventListener('click',()=>delAppTagInline(btn.dataset.tagid));
  });

  // Picker de cor no painel de edição
  list.querySelectorAll('.stl-color-row span').forEach(dot=>{
    dot.addEventListener('click',()=>{
      const id=dot.dataset.tagid, c=dot.dataset.cor;
      window[`_editCor_${id}`]=c;
      list.querySelectorAll(`.stl-color-row[data-tagid="${id}"] span`).forEach(s=>s.style.borderColor='transparent');
      dot.style.borderColor='rgba(255,255,255,.8)';
    });
  });

  // Botão OK salvar
  list.querySelectorAll('.stl-btn-ok').forEach(btn=>{
    btn.addEventListener('click',()=>confirmEditTagRow(btn.dataset.tagid));
  });

  // Botão ✕ cancelar edição
  list.querySelectorAll('.stl-btn-cancel').forEach(btn=>{
    btn.addEventListener('click',()=>toggleEditTagRow(btn.dataset.tagid));
  });

  // Enter/Escape nos inputs de edição
  list.querySelectorAll('.stl-edit-nome').forEach(inp=>{
    inp.addEventListener('keydown',e=>{
      if(e.key==='Enter') confirmEditTagRow(inp.dataset.tagid);
      if(e.key==='Escape') toggleEditTagRow(inp.dataset.tagid);
    });
  });
}

function toggleEditTagRow(id){
  const row=document.getElementById(`stl-edit-${id}`);
  if(!row)return;
  const open=row.style.display==='none';
  row.style.display=open?'block':'none';
  if(open){
    const inp=row.querySelector(`.stl-edit-nome[data-tagid="${id}"]`);
    if(inp)setTimeout(()=>inp.focus(),30);
  }
}
function confirmEditTagRow(id){
  if(!CAN.manageTags()){alert('Acesso restrito: apenas administradores podem gerenciar tags.');return;}
  const inp=document.querySelector(`.stl-edit-nome[data-tagid="${id}"]`);
  const nome=inp?.value.trim();
  if(!nome){alert('Informe um nome');return;}
  const t=state.appTags.find(x=>x.id===id);
  if(!t)return;
  t.nome=nome;
  t.cor=window[`_editCor_${id}`]||t.cor;
  saveState();
  // Atualiza dot e nome sem re-render
  const dot=document.getElementById(`stl-dot-${id}`);
  if(dot)dot.style.background=t.cor;
  const nameEl=document.querySelector(`#stl-row-${id} .stl-nome`);
  if(nameEl)nameEl.textContent=t.nome;
  toggleEditTagRow(id);
  renderAdvsList();
}
function delAppTagInline(id){
  if(!CAN.manageTags()){alert('Acesso restrito: apenas administradores podem gerenciar tags.');return;}
  const nome=(state.appTags.find(x=>x.id===id)||{}).nome||id;
  if(!confirm(`Excluir tag "${nome}"?`))return;
  state.appTags=state.appTags.filter(t=>t.id!==id);
  Object.keys(state.processTags||{}).forEach(k=>{state.processTags[k]=(state.processTags[k]||[]).filter(t=>t!==id);});
  state.advogados.forEach(a=>{if(Array.isArray(a.tags))a.tags=a.tags.filter(t=>t!==id);});
  saveState();
  // Remove só a linha sem re-render total
  document.getElementById(`stl-row-${id}`)?.remove();
  renderAdvsList();
}

// ── savedTags (tags de parâmetros) — via openManageTagsModal ou programaticamente ──
function openSaveTagModal(){if(!CAN.manageSavedTags()){alert('Acesso restrito: apenas administradores podem salvar tags de parâmetros.');return;}
  showModal2(`<h3>Salvar como tag de parâmetros</h3>
    <p style="font-size:11px;color:var(--text3);margin-bottom:11px">Salva todos os parâmetros atuais como uma tag reutilizável.</p>
    <div class="mf"><label>Nome da tag</label><input id="tgNome" placeholder="Ex: Equipe Tributário PA"></div>
    <div class="mf"><label>Cor</label><div class="crow">${TAG_COLORS.map((c,i)=>`<span class="csw${i===0?' sel':''}" style="background:${c}" onclick="pickTagC('${c}',this)"></span>`).join('')}</div></div>
    <div style="font-size:10px;color:var(--text3);margin-bottom:8px">Será salvo: ${summarizeParams()}</div>
    <div class="macts"><button class="btn" onclick="closeModal2()">Cancelar</button><button class="btn p" onclick="confirmSaveTag()">Salvar tag</button></div>`);
}

let _tagColor=TAG_COLORS[0];
function pickTagC(c,el){_tagColor=c;document.querySelectorAll('.csw').forEach(s=>s.classList.remove('sel'));el.classList.add('sel')}

function summarizeParams(){
  const parts=[];
  if(params.advTags&&params.advTags.length)parts.push(`tags: ${params.advTags.join(',')}`);
  if(params.advogados&&params.advogados.length)parts.push(`${params.advogados.length} adv.`);
  if(params.oabs&&params.oabs.length)parts.push(`${params.oabs.length} OAB`);
  if(params.nomes&&params.nomes.length)parts.push(`${params.nomes.length} parte(s)`);
  if(params.processos&&params.processos.length)parts.push(`${params.processos.length} processo(s)`);
  if(params.instituicoes&&params.instituicoes.length)parts.push(`${params.instituicoes.length} tribunal(is)`);
  return parts.join(' · ')||'(parâmetros vazios)';
}

function confirmSaveTag(){
  const nome=document.getElementById('tgNome').value.trim();
  if(!nome){alert('Informe um nome para a tag');return}
  if(!state.savedTags)state.savedTags=[];
  state.savedTags.push({id:Date.now(),nome,cor:_tagColor,campos:JSON.parse(JSON.stringify(params))});
  saveState(); closeModal2(); renderSavedTags();
}

function applyTag(id){
  const t=state.savedTags.find(x=>x.id===id);
  if(!t)return;
  // Mescla os campos salvos nos params atuais (sobrescreve os campos da tag)
  const c=t.campos;
  Object.keys(c).forEach(k=>{if(c[k]!==undefined&&c[k]!==''&&!(Array.isArray(c[k])&&!c[k].length))params[k]=JSON.parse(JSON.stringify(c[k]))});
  saveParams(); renderParams();
  switchLTab('params');
}

function deleteTag(id){
  if(!confirm('Excluir esta tag?'))return;
  state.savedTags=state.savedTags.filter(t=>t.id!==id);
  saveState(); renderSavedTags();
}


// Modal 2 — para salvar tags (não interfere com o modal principal)
function showModal2(html){document.getElementById('mBox2').innerHTML=html;document.getElementById('mBg2').style.display='flex';setTimeout(()=>{const e=document.getElementById('tgNome');if(e)e.focus()},50)}
function closeModal2(){document.getElementById('mBg2').style.display='none'}
function closeModal2If(e){if(e.target===document.getElementById('mBg2'))closeModal2()}

/* ═══════════════════════════ ADV CRUD ════════════════════════ */
function renderAdvsList(){
  const el=document.getElementById('advs-inner');
  if(!el)return;
  if(!state.advogados.length){el.innerHTML=`<div style="padding:14px 10px;text-align:center;font-size:11px;color:var(--text3)">Nenhum advogado cadastrado</div>`;return}
  el.innerHTML=state.advogados.map(a=>`
    <div class="adv-card">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:4px">
        <div style="min-width:0">
          <div class="adv-nm">${esc(a.nome||'(sem nome)')}</div>
          <div class="adv-oab">${advLabel(a)}</div>
          ${a.email?`<div style="font-size:10px;color:var(--text3);font-family:var(--mono);margin-bottom:2px">✉ ${esc(a.email)}</div>`:''}
          <div class="adv-tags">${(a.tags||[]).map(t=>`<span class="tpill" onclick="injectAdvTag('${t.replace(/'/g,"\\'")}')">#${esc(t)}</span>`).join('')}</div>
        </div>
        <div style="display:flex;gap:1px">
          ${CAN.manageAdvogados()?`<button class="ib" style="padding:3px 5px;font-size:10px" onclick="editAdv(${a.id})" title="Editar">✏</button><button class="ib" style="padding:3px 5px;font-size:10px" onclick="delAdv(${a.id})" title="Excluir">✕</button>`:''}
        </div>
      </div>
    </div>`).join('');
}

// Callback nomeado para seleção de tag no autocomplete do advogado
// Evita problema de aspas aninhadas no oninput inline
function _onAdvTagSelect(tagId){
  const t=state.appTags.find(x=>x.id===tagId);
  if(!t)return;
  const box=document.getElementById('advTagBox');
  const inp=document.getElementById('ati');
  if(!box||!inp)return;
  // Evita duplicata
  if([...box.querySelectorAll('.chip')].some(c=>c.dataset.tag===t.id))return;
  const sp=document.createElement('span');
  sp.className='chip';
  sp.dataset.tag=t.id;
  sp.style.cssText=`background:${t.cor}22;border:1px solid ${t.cor}55;color:${t.cor}`;
  sp.innerHTML=`${esc(t.nome)}<button class="chip-x" style="color:${t.cor}88" onclick="rmAdvChip(this)">×</button>`;
  box.insertBefore(sp,inp);
  inp.value='';
  document.querySelectorAll('[id^=tagac_]').forEach(el=>el.classList.remove('show'));
}

function openNewAdv(){if(!CAN.manageAdvogados()){alert('Acesso restrito: apenas administradores podem cadastrar advogados.');return;}
  showModal(`<h3>Cadastrar advogado</h3>
    <p style="font-size:11px;color:var(--text3);margin-bottom:11px">Todos os campos são opcionais. 2+ campos = busca <span class="and-badge">AND</span>.</p>
    <div class="mf"><label>Nome completo (opcional)</label><input id="advNome" placeholder="JOAO PAULO MENDES NETO" autocomplete="off"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:7px">
      <div><label style="font-size:10px;color:var(--text3);display:block;margin-bottom:3px">Número OAB (opcional)</label>
        <input id="advOab" placeholder="15583" style="width:100%;font-size:12px;padding:5px 9px;border:1px solid var(--border2);border-radius:var(--r);background:var(--bg3);color:var(--text);font-family:var(--sans);outline:none" autocomplete="off"></div>
      <div><label style="font-size:10px;color:var(--text3);display:block;margin-bottom:3px">UF da OAB (opcional)</label>
        <input id="advUf" placeholder="PA" maxlength="2" style="width:100%;font-size:12px;padding:5px 9px;border:1px solid var(--border2);border-radius:var(--r);background:var(--bg3);color:var(--text);font-family:var(--sans);outline:none" autocomplete="off"></div>
    </div>
    <div class="mf"><label>E-mail (opcional)</label>
      <input id="advEmail" type="email" placeholder="email@exemplo.com" style="width:100%;font-size:12px;padding:5px 9px;border:1px solid var(--border2);border-radius:var(--r);background:var(--bg3);color:var(--text);font-family:var(--sans);outline:none" autocomplete="off">
    </div>
    <div class="mf"><label>Tags (Enter ou vírgula para adicionar)</label>
      <div class="mbox" id="advTagBox" onclick="document.getElementById('ati').focus()">
        <input class="ci" id="ati" placeholder="tributario, equipe-pa…" onkeydown="addAdvChip(event)" oninput="tagAutocomplete(this,_onAdvTagSelect)" autocomplete="off">
      </div>
      <div style="font-size:10px;color:var(--text3);margin-top:3px">Tags permitem busca em massa — clique na tag na aba Advogados para pesquisar</div>
    </div>
    <div class="macts"><button class="btn" onclick="closeModal()">Cancelar</button><button class="btn p" onclick="saveNewAdv()">Cadastrar</button></div>`);
}

function editAdv(id){window._editAdvId=id;
  const a=state.advogados.find(x=>x.id===id);if(!a)return;
  // Renderiza chips existentes com cor da appTag correspondente
  const existingChips=(a.tags||[]).map(tagId=>{
    const t=state.appTags.find(x=>x.id===tagId);
    const cor=t?t.cor:'var(--accent)';
    const nome=t?t.nome:tagId;
    return `<span class="chip" data-tag="${esc(tagId)}" style="background:${cor}22;border:1px solid ${cor}55;color:${cor}">${esc(nome)}<button class="chip-x" style="color:${cor}88" onclick="rmAdvChip(this)">×</button></span>`;
  }).join('');
  showModal(`<h3>Editar advogado</h3>
    <p style="font-size:11px;color:var(--text3);margin-bottom:11px">Todos os campos são opcionais. 2+ campos = busca <span class="and-badge">AND</span>.</p>
    <div class="mf"><label>Nome completo</label><input id="advNome" value="${esc(a.nome||'')}" autocomplete="off"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:7px">
      <div><label style="font-size:10px;color:var(--text3);display:block;margin-bottom:3px">Número OAB</label>
        <input id="advOab" value="${esc(a.oab||'')}" style="width:100%;font-size:12px;padding:5px 9px;border:1px solid var(--border2);border-radius:var(--r);background:var(--bg3);color:var(--text);font-family:var(--sans);outline:none" autocomplete="off"></div>
      <div><label style="font-size:10px;color:var(--text3);display:block;margin-bottom:3px">UF da OAB</label>
        <input id="advUf" value="${esc(a.uf||'')}" maxlength="2" style="width:100%;font-size:12px;padding:5px 9px;border:1px solid var(--border2);border-radius:var(--r);background:var(--bg3);color:var(--text);font-family:var(--sans);outline:none" autocomplete="off"></div>
    </div>
    <div class="mf"><label>E-mail (opcional)</label>
      <input id="advEmail" type="email" placeholder="email@exemplo.com" value="${esc(a.email||'')}" style="width:100%;font-size:12px;padding:5px 9px;border:1px solid var(--border2);border-radius:var(--r);background:var(--bg3);color:var(--text);font-family:var(--sans);outline:none" autocomplete="off">
    </div>
    <div class="mf"><label>Tags</label>
      <div class="mbox" id="advTagBox" onclick="document.getElementById('ati').focus()">
        ${existingChips}
        <input class="ci" id="ati" placeholder="nova tag…" onkeydown="addAdvChip(event)" oninput="tagAutocomplete(this,_onAdvTagSelect)" autocomplete="off">
      </div>
    </div>
    <div class="macts"><button class="btn" onclick="closeModal()">Cancelar</button><button class="btn p" onclick="saveEditAdv()">Salvar</button></div>`);
}

function getAdvTagsFromBox(){return[...document.querySelectorAll('#advTagBox .chip')].map(el=>el.dataset.tag||el.textContent.replace('×','').trim()).filter(Boolean)}
function addAdvChip(e){
  if(e.key!=='Enter'&&e.key!==',')return;e.preventDefault();
  const raw=e.target.value.trim();if(!raw)return;
  const v=raw.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
  // Busca em appTags primeiro (por id ou nome)
  let existing=state.appTags.find(t=>t.id===v||t.nome.toLowerCase()===raw.toLowerCase());
  if(!existing){
    // Cria nova appTag automaticamente para manter consistência
    existing={id:v,nome:raw,cor:'#4f8ef7'};
    state.appTags.push(existing);
    saveState();
  }
  const box=document.getElementById('advTagBox'),inp=document.getElementById('ati');
  // Evita duplicata no box
  if([...box.querySelectorAll('.chip')].some(c=>c.dataset.tag===existing.id))return;
  const sp=document.createElement('span');sp.className='chip';sp.dataset.tag=existing.id;
  sp.style.cssText=`background:${existing.cor}22;border:1px solid ${existing.cor}55;color:${existing.cor}`;
  sp.innerHTML=`${esc(existing.nome)}<button class="chip-x" style="color:${existing.cor}88" onclick="rmAdvChip('${existing.id.replace(/'/g,"\\'")}')">×</button>`;
  box.insertBefore(sp,inp);inp.value='';
  document.getElementById('tag-ac-list')?.classList.remove('show');
  // Fecha qualquer ac-list de tagAutocomplete
  document.querySelectorAll('[id^=tagac_]').forEach(el=>el.classList.remove('show'));
}
function rmAdvChip(elOrId){
  if(typeof elOrId==='string'){
    document.querySelectorAll('#advTagBox .chip').forEach(el=>{if((el.dataset.tag||'')==elOrId)el.remove()});
  } else {
    // elOrId é o botão chip-x — sobe ao .chip pai e remove
    elOrId.closest?.('.chip')?.remove();
  }
}

function saveNewAdv(){
  const nome=document.getElementById('advNome').value.trim().toUpperCase();
  const oab=document.getElementById('advOab').value.trim();
  const uf=document.getElementById('advUf').value.trim().toUpperCase();
  const email=document.getElementById('advEmail').value.trim().toLowerCase();
  if(!nome&&!oab&&!uf){alert('Preencha ao menos um campo');return}
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){alert('E-mail inválido');return}
  const tags=getAdvTagsFromBox();
  state.advogados.push({id:Date.now(),nome,oab,uf,email,tags});
  saveState();closeModal();renderAdvsList();
  setupACs();
}
function saveEditAdv(){
  const nome=document.getElementById('advNome').value.trim().toUpperCase();
  const oab=document.getElementById('advOab').value.trim();
  const uf=document.getElementById('advUf').value.trim().toUpperCase();
  const email=document.getElementById('advEmail').value.trim().toLowerCase();
  if(!nome&&!oab&&!uf){alert('Preencha ao menos um campo');return}
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){alert('E-mail inválido');return}
  const i=state.advogados.findIndex(a=>a.id===(window._editAdvId));if(i<0)return;
  state.advogados[i]={...state.advogados[i],nome,oab,uf,email,tags:getAdvTagsFromBox()};
  saveState();closeModal();renderAdvsList();
}
function delAdv(id){
  if(!confirm('Excluir este advogado?'))return;
  state.advogados=state.advogados.filter(a=>a.id!==id);
  saveState();renderAdvsList();
}

// Override editAdv to store id
const _editAdvOrig=editAdv;
// INIT — wrapped in initApp() called after auth
function initApp(){
  renderParams();
  renderAdvsList();
  renderFavsList();
  renderSavedTags();
  document.getElementById('favBadge').textContent=state.favorites.length||'';
  loadTribunais();
  requestNotificationPermission();
  setTimeout(()=>checkAllMonitored(), 3000);
  const _mb=document.getElementById('monitorBadge');
  if(_mb)_mb.textContent=state.monitoredProcesses.length||'';
  applyPermissions();
  // Update tasks badge
  const _tb=document.getElementById('tasksBadge');
  if(_tb){ const due=getScheduledTasks().filter(isTaskDue); if(due.length)_tb.textContent=due.length; }
  // Run any due scheduled tasks in background (after 5s to let app finish loading)
  setTimeout(()=>checkDueTasks(), 5000);
}
// Start auth flow
initFirebase();
