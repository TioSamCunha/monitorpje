/* ═══════════════════════════ LEFT TABS ═══════════════════════ */
function switchLTab(t){
  ltab=t;
  ['params','advs','tags','favs'].forEach(x=>{
    const tabEl=document.getElementById('ltab-'+x);
    const panelEl=document.getElementById('lpanel-'+x);
    if(tabEl)tabEl.classList.toggle('active',x===t);
    if(panelEl)panelEl.style.display=x===t?'':'none';
  });
  const addBtn=document.getElementById('lb-adv-add');
  if(addBtn)addBtn.style.display=t==='advs'?'flex':'none';
  // Renderiza a lista de tags ao entrar na aba
  if(t==='tags')renderSavedTags();
}

/* ═══════════════════════════ DYNAMIC DROPDOWNS ═══════════════ */
async function loadTribunais(){
  // Dados embutidos do endpoint GET /api/v1/comunicacao/tribunal (sigla extraída)
  const embedded=[{"sigla": "CJF", "nome": "Conselho da Justiça Federal"}, {"sigla": "CNJ", "nome": "Conselho Nacional de Justiça"}, {"sigla": "PJeCor", "nome": "Corregedorias"}, {"sigla": "SEEU", "nome": "Sistema Eletrônico de Execução Unificado"}, {"sigla": "STJ", "nome": "Superior Tribunal de Justiça"}, {"sigla": "STM", "nome": "Superior Tribunal Militar"}, {"sigla": "TJAC", "nome": "Tribunal de Justiça do Estado do Acre"}, {"sigla": "TJAL", "nome": "Tribunal de Justiça do Estado de Alagoas"}, {"sigla": "TJAM", "nome": "Tribunal de Justiça do Estado do Amazonas"}, {"sigla": "TJAP", "nome": "Tribunal de Justiça do Estado do Amapá"}, {"sigla": "TJBA", "nome": "Tribunal de Justiça do Estado da Bahia"}, {"sigla": "TJCE", "nome": "Tribunal de Justiça do Estado do Ceará"}, {"sigla": "TJDFT", "nome": "Tribunal de Justiça do Distrito Federal e dos Territórios"}, {"sigla": "TJES", "nome": "Tribunal de Justiça do Estado do Espírito Santo"}, {"sigla": "TJGO", "nome": "Tribunal de Justiça do Estado de Goiás"}, {"sigla": "TJMA", "nome": "Tribunal de Justiça do Estado do Maranhão"}, {"sigla": "TJMG", "nome": "Tribunal de Justiça do Estado de Minas Gerais"}, {"sigla": "TJMMG", "nome": "Tribunal de Justiça Militar do Estado de Minas Gerais"}, {"sigla": "TJMRS", "nome": "Tribunal de Justiça Militar do Estado do Rio Grande do Sul"}, {"sigla": "TJMS", "nome": "Tribunal de Justiça do Estado de Mato Grosso do Sul"}, {"sigla": "TJMSP", "nome": "Tribunal de Justiça Militar do Estado de São Paulo"}, {"sigla": "TJMT", "nome": "Tribunal de Justiça do Estado de Mato Grosso"}, {"sigla": "TJPA", "nome": "Tribunal de Justiça do Estado do Pará"}, {"sigla": "TJPB", "nome": "Tribunal de Justiça do Estado da Paraíba"}, {"sigla": "TJPE", "nome": "Tribunal de Justiça do Estado de Pernambuco"}, {"sigla": "TJPI", "nome": "Tribunal de Justiça do Estado do Piauí"}, {"sigla": "TJPR", "nome": "Tribunal de Justiça do Estado do Paraná"}, {"sigla": "TJRJ", "nome": "Tribunal de Justiça do Estado do Rio de Janeiro"}, {"sigla": "TJRN", "nome": "Tribunal de Justiça do Estado do Rio Grande do Norte"}, {"sigla": "TJRO", "nome": "Tribunal de Justiça do Estado de Rondônia"}, {"sigla": "TJRR", "nome": "Tribunal de Justiça do Estado de Roraima"}, {"sigla": "TJRS", "nome": "Tribunal de Justiça do Estado do Rio Grande do Sul"}, {"sigla": "TJSC", "nome": "Tribunal de Justiça do Estado de Santa Catarina"}, {"sigla": "TJSE", "nome": "Tribunal de Justiça do Estado de Sergipe"}, {"sigla": "TJSP", "nome": "Tribunal de Justiça do Estado de São Paulo"}, {"sigla": "TJTO", "nome": "Tribunal de Justiça do Estado de Tocantins"}, {"sigla": "TRE-AC", "nome": "Tribunal Regional Eleitoral do Acre"}, {"sigla": "TRE-AL", "nome": "Tribunal Regional Eleitoral de Alagoas"}, {"sigla": "TRE-AM", "nome": "Tribunal Regional Eleitoral do Amazonas"}, {"sigla": "TRE-AP", "nome": "Tribunal Regional Eleitoral do Amapá"}, {"sigla": "TRE-BA", "nome": "Tribunal Regional Eleitoral da Bahia"}, {"sigla": "TRE-ES", "nome": "Tribunal Regional Eleitoral do Espírito Santo"}, {"sigla": "TRE-GO", "nome": "Tribunal Regional Eleitoral de Goiás"}, {"sigla": "TRE-MA", "nome": "Tribunal Regional Eleitoral do Maranhão"}, {"sigla": "TRE-MS", "nome": "Tribunal Regional Eleitoral do Mato Grosso do Sul"}, {"sigla": "TRE-MT", "nome": "Tribunal Regional Eleitoral do do Mato Grosso"}, {"sigla": "TRE-PA", "nome": "Tribunal Regional Eleitoral do do Pará"}, {"sigla": "TRE-PE", "nome": "Tribunal Regional Eleitoral de Pernambuco"}, {"sigla": "TRE-PI", "nome": "Tribunal Regional Eleitoral do Piauí"}, {"sigla": "TRE-PR", "nome": "Tribunal Regional Eleitoral do Paraná"}, {"sigla": "TRE-RJ", "nome": "Tribunal Regional Eleitoral do Rio de Janeiro"}, {"sigla": "TRE-RN", "nome": "Tribunal Regional Eleitoral do Rio Grande do Norte"}, {"sigla": "TRE-RO", "nome": "Tribunal Regional Eleitoral de Rondônia"}, {"sigla": "TRE-RS", "nome": "Tribunal Regional Eleitoral do Rio Grande do Sul"}, {"sigla": "TRE-SC", "nome": "Tribunal Regional Eleitoral de Santa Catarina"}, {"sigla": "TRE-SP", "nome": "Tribunal Regional Eleitoral de São Paulo"}, {"sigla": "TRE-TO", "nome": "Tribunal Regional Eleitoral de Tocantins"}, {"sigla": "TRF1", "nome": "Tribunal Regional Federal da 1ª Região"}, {"sigla": "TRF2", "nome": "Tribunal Regional Federal da 2ª Região"}, {"sigla": "TRF3", "nome": "Tribunal Regional Federal da 3ª Região"}, {"sigla": "TRF4", "nome": "Tribunal Regional Federal da 4ª Região"}, {"sigla": "TRF5", "nome": "Tribunal Regional Federal da 5ª Região"}, {"sigla": "TRF6", "nome": "Tribunal Regional Federal da 6ª Região"}, {"sigla": "TRT1", "nome": "Tribunal Regional do Trabalho da 1ª Região"}, {"sigla": "TRT10", "nome": "Tribunal Regional do Trabalho da 10ª Região"}, {"sigla": "TRT11", "nome": "Tribunal Regional do Trabalho da 11ª Região"}, {"sigla": "TRT12", "nome": "Tribunal Regional do Trabalho da 12ª Região"}, {"sigla": "TRT13", "nome": "Tribunal Regional do Trabalho da 13ª Região"}, {"sigla": "TRT14", "nome": "Tribunal Regional do Trabalho da 14ª Região"}, {"sigla": "TRT15", "nome": "Tribunal Regional do Trabalho da 15ª Região"}, {"sigla": "TRT16", "nome": "Tribunal Regional do Trabalho da 16ª Região"}, {"sigla": "TRT17", "nome": "Tribunal Regional do Trabalho da 17ª Região"}, {"sigla": "TRT18", "nome": "Tribunal Regional do Trabalho da 18ª Região"}, {"sigla": "TRT19", "nome": "Tribunal Regional do Trabalho da 19ª Região"}, {"sigla": "TRT2", "nome": "Tribunal Regional do Trabalho da 2ª Região"}, {"sigla": "TRT20", "nome": "Tribunal Regional do Trabalho da 20ª Região"}, {"sigla": "TRT21", "nome": "Tribunal Regional do Trabalho da 21ª Região"}, {"sigla": "TRT22", "nome": "Tribunal Regional do Trabalho da 22ª Região"}, {"sigla": "TRT23", "nome": "Tribunal Regional do Trabalho da 23ª Região"}, {"sigla": "TRT24", "nome": "Tribunal Regional do Trabalho da 24ª Região"}, {"sigla": "TRT3", "nome": "Tribunal Regional do Trabalho da 3ª Região"}, {"sigla": "TRT4", "nome": "Tribunal Regional do Trabalho da 4ª Região"}, {"sigla": "TRT5", "nome": "Tribunal Regional do Trabalho da 5ª Região"}, {"sigla": "TRT6", "nome": "Tribunal Regional do Trabalho da 6ª Região"}, {"sigla": "TRT7", "nome": "Tribunal Regional do Trabalho da 7ª Região"}, {"sigla": "TRT8", "nome": "Tribunal Regional do Trabalho da 8ª Região"}, {"sigla": "TRT9", "nome": "Tribunal Regional do Trabalho da 9ª Região"}, {"sigla": "TSE", "nome": "Tribunal Superior Eleitoral"}, {"sigla": "TST", "nome": "Tribunal Superior do Trabalho"}];
  tribunaisList=embedded;

  // Tenta atualizar via API em background
  try{
    const r=await fetch(`${API}/tribunal`,{headers:{Accept:'application/json'}});
    if(r.ok){
      const d=await r.json();
      if(Array.isArray(d)&&d.length&&d[0]&&d[0].instituicoes){
        const all=[]; const seen=new Set();
        d.forEach(estado=>{
          (estado.instituicoes||[]).forEach(inst=>{
            if(inst.sigla&&!seen.has(inst.sigla)){
              seen.add(inst.sigla);
              all.push({sigla:inst.sigla,nome:inst.nome||inst.sigla});
            }
          });
        });
        if(all.length)tribunaisList=all.sort((a,b)=>a.sigla.localeCompare(b.sigla));
      }
    }
  }catch(_){/* usa embedded */}
  buildDD('inst','instituicoes','Todas as instituições');
  buildDD('orgao','orgaos','Todos os órgãos');
  buildDD('meio','meios','Todos os meios');
}

function buildDD(field, paramKey, placeholder){
  const wrap=document.getElementById('dd-'+field);
  if(!wrap) return;
  // Obter lista correta
  const rawList = field==='inst' ? tribunaisList : field==='orgao' ? orgaosList : meiosList;
  const sel=params[paramKey]||[];
  const selCount=sel.length;
  const label=selCount===0?placeholder:selCount===1?(()=>{const f=rawList.find(t=>t.sigla===sel[0]);return f?`${f.sigla} — ${f.nome}`:sel[0];})():`${selCount} selecionado(s)`;
  const searchBar=rawList.length>8?`<div class="dd-search"><input type="text" placeholder="Buscar…" oninput="filterDD('ddp-${field}',this.value)"></div>`:'';
  const itemsHtml=rawList.length===0
    ?`<div class="dd-loading">${field==='orgao'?'(use após selecionar instituição)':'Carregando…'}</div>`
    :rawList.map(t=>{
        const sigla=t.sigla||t; const nome=t.nome||sigla;
        const checked=sel.includes(sigla);
        return`<div class="dd-item">
          <input type="checkbox" id="ddi_${field}_${sigla.replace(/[^a-zA-Z0-9]/g,'_')}" value="${sigla}" ${checked?'checked':''} onchange="ddToggle('${field}','${paramKey}','${sigla.replace(/'/g,"\\'")}',this.checked)">
          <label for="ddi_${field}_${sigla.replace(/[^a-zA-Z0-9]/g,'_')}">${sigla}${nome&&nome!==sigla?` <span style="font-size:10px;color:var(--text3)">— ${nome}</span>`:''}
          </label>
        </div>`;
      }).join('');
  wrap.innerHTML=`
    <button class="dd-btn" onclick="toggleDD('dd-${field}')" type="button">
      <span class="dd-label">${label}</span>
      <span class="dd-arrow">▾</span>
    </button>
    <div class="dd-panel" id="ddp-${field}">
      ${searchBar}
      <div class="dd-sel-all">
        <span onclick="ddSelAll('${field}','${paramKey}',true)">Todos</span>
        <span onclick="ddSelAll('${field}','${paramKey}',false)">Nenhum</span>
      </div>
      ${itemsHtml}
    </div>`;
}

function toggleDD(wrapId){
  const panel=document.getElementById(wrapId).querySelector('.dd-panel');
  const isOpen=panel.classList.contains('open');
  // close all
  document.querySelectorAll('.dd-panel.open').forEach(p=>p.classList.remove('open'));
  if(!isOpen) panel.classList.add('open');
}
// Close dropdowns when clicking outside
document.addEventListener('click',e=>{
  if(!e.target.closest('.dd-wrap'))
    document.querySelectorAll('.dd-panel.open').forEach(p=>p.classList.remove('open'));
});

function ddToggle(field,paramKey,val,on){
  if(!params[paramKey])params[paramKey]=[];
  if(on){if(!params[paramKey].includes(val))params[paramKey].push(val)}
  else{params[paramKey]=params[paramKey].filter(x=>x!==val)}
  // Update label
  const wrap=document.getElementById('dd-'+field);
  if(wrap){const lbl=wrap.querySelector('.dd-label');if(lbl){const ph=getDDPlaceholder(field);updateDDLabel(field,paramKey,ph);}}
  saveParams();
}

function ddSelAll(field,paramKey,all){
  const rawList=field==='inst'?tribunaisList:field==='orgao'?orgaosList:meiosList;
  params[paramKey]=all?rawList.map(t=>t.sigla||t):[];
  saveParams();
  buildDD(field,paramKey,getDDPlaceholder(field));
}

function getDDPlaceholder(field){return field==='inst'?'Todas as instituições':field==='orgao'?'Todos os órgãos':'Todos os meios'}

function updateDDLabel(id,field,placeholder){
  const sel=params[field]||[];
  const label=sel.length===0?placeholder:sel.length===1?sel[0]:`${sel.length} selecionado(s)`;
  const lbl=document.querySelector(`#dd-${id} .dd-label`);
  if(lbl)lbl.textContent=label;
}
function filterDD(panelId,q){
  document.querySelectorAll(`#${panelId} .dd-item`).forEach(el=>{
    el.style.display=el.querySelector('label').textContent.toLowerCase().includes(q.toLowerCase())?'':'none';
  });
}

/* ═══════════════════════════ PARAMS RENDER ═══════════════════ */
function renderParams(){
  const taggedAdvs=getAdvsByTags(params.advTags||[]);
  const taggedHtml=taggedAdvs.length?`
    <div style="margin-top:5px;padding:5px 8px;background:var(--bg2);border:1px solid var(--border2);border-radius:var(--r)">
      <div style="font-size:9px;color:var(--text3);font-family:var(--mono);margin-bottom:3px">Advogados incluídos <span class="and-badge">AND</span></div>
      ${taggedAdvs.map(a=>`<div style="font-size:11px;color:var(--text2);padding:1px 0"><b style="color:var(--text)">${esc(a.nome||'')}</b>${a.oab?` <span style="font-family:var(--mono);color:var(--text3);font-size:10px">OAB ${esc(a.oab)}${a.uf?'/'+esc(a.uf):''}</span>`:''}</div>`).join('')}
    </div>`:'';

  document.getElementById('params-body').innerHTML=`
    <!-- Teor da comunicação -->
    <div class="ps">
      <input class="plain-input" id="inp_teor" placeholder="Teor da comunicação" value="${esc(params.teor||'')}" oninput="setP('teor',this.value)">
    </div>

    <!-- Instituições -->
    <div class="ps">
      <div class="dd-wrap" id="dd-inst"></div>
    </div>

    <!-- Órgãos -->
    <div class="ps">
      <div class="dd-wrap" id="dd-orgao"></div>
    </div>

    <!-- Meios -->
    <div class="ps">
      <div class="dd-wrap" id="dd-meio"></div>
    </div>

    <!-- Datas -->
    <div class="ps">
      <div class="g2">
        <div class="pf">
          <label>Data inicial</label>
          <input type="text" id="inp_di" placeholder="dd.mm.aaaa" value="${esc(params.dataInicial||'')}" maxlength="10"
            oninput="maskDate(this,'dataInicial')" onblur="validateDate(this,'dataInicial')">
        </div>
        <div class="pf">
          <label>Data final</label>
          <input type="text" id="inp_df" placeholder="dd.mm.aaaa" value="${esc(params.dataFinal||'')}" maxlength="10"
            oninput="maskDate(this,'dataFinal')" onblur="validateDate(this,'dataFinal')">
        </div>
      </div>
    </div>

    <!-- Nº do processo (chip) -->
    <div class="ps">
      ${mbox('processos',params.processos||[],'Nº do processo')}
    </div>

    <!-- Nome da parte (chip) -->
    <div class="ps">
      ${mbox('nomes',params.nomes||[],'Nome da parte')}
    </div>

    <!-- Nome do advogado (chip, autocomplete) -->
    <div class="ps">
      <div class="ac-wrap">
        <div class="mbox" id="adv-mbox" onclick="document.getElementById('ci_advogados').focus()">
          ${(params.advogados||[]).map(v=>`<span class="chip">${esc(v)}<button class="chip-x" onclick="rmChip('advogados','${v.replace(/'/g,"\\'")}')">×</button></span>`).join('')}
          <input class="ci" id="ci_advogados" placeholder="Nome do advogado" onkeydown="addChip(event,'advogados','ci_advogados')" autocomplete="off">
        </div>
        <div class="ac-list" id="ac_advogados"></div>
      </div>
    </div>

    <!-- OAB (chip, autocomplete) -->
    <div class="ps">
      <div class="ac-wrap">
        <div class="mbox" onclick="document.getElementById('ci_oabs').focus()">
          ${(params.oabs||[]).map(v=>`<span class="chip">${esc(v)}<button class="chip-x" onclick="rmChip('oabs','${v.replace(/'/g,"\\'")}')">×</button></span>`).join('')}
          <input class="ci" id="ci_oabs" placeholder="Nº da OAB" onkeydown="addChip(event,'oabs','ci_oabs')" autocomplete="off">
        </div>
        <div class="ac-list" id="ac_oabs"></div>
      </div>
    </div>

    <!-- UF da OAB (chip, autocomplete) -->
    <div class="ps">
      <div class="ac-wrap">
        <div class="mbox" onclick="document.getElementById('ci_ufOabs').focus()">
          ${(params.ufOabs||[]).map(v=>`<span class="chip">${esc(v)}<button class="chip-x" onclick="rmChip('ufOabs','${v.replace(/'/g,"\\'")}')">×</button></span>`).join('')}
          <input class="ci" id="ci_ufOabs" placeholder="UF da OAB" onkeydown="addChip(event,'ufOabs','ci_ufOabs')" autocomplete="off">
        </div>
        <div class="ac-list" id="ac_ufOabs"></div>
      </div>
    </div>

    <!-- Tags de equipe (chip, autocomplete) -->
    <div class="ps">
      <div class="ps-title">Busca em massa por tag <span class="and-badge" style="margin-left:2px">AND</span></div>
      <div class="pf">
        <div class="ac-wrap">
          <div class="mbox" id="advTagBox_p" onclick="document.getElementById('ci_advTags').focus()">
            ${(params.advTags||[]).map(v=>{const appT=state.appTags.find(t=>t.id===v.toLowerCase()||t.nome.toUpperCase()===v);const cor=appT?.cor||null;const style=cor?('background:'+cor+'22;border:1px solid '+cor+'55;color:'+cor):'';const label=appT?appT.nome:v;return'<span class="chip ctag" style="'+style+'">'+esc(label)+'<button class="chip-x" onclick="rmChip(\'advTags\',\''+v.replace(/'/g,"\\'")+'\')">×</button></span>';}).join('')}
            <input class="ci" id="ci_advTags" placeholder="Tag da equipe…" onkeydown="addChip(event,'advTags','ci_advTags')" autocomplete="off">
          </div>
          <div class="ac-list" id="ac_advTags"></div>
        </div>
        ${taggedHtml}
      </div>
    </div>

    <!-- Tipo comunicação -->
    <div class="ps">
      <div class="pf">
        <label>Tipo de comunicação</label>
        <select onchange="setP('tipoComunicacao',this.value)">
          <option value="">Todos</option>
          ${['Citação','Intimação','Lista de distribuição'].map(t=>`<option value="${t}"${params.tipoComunicacao===t?' selected':''}>${t}</option>`).join('')}
        </select>
      </div>
    </div>

    <!-- Limpar filtros -->
    <div class="ps">
      <button class="clear-btn" onclick="clearFilters()">Limpar todos os filtros</button>
    </div>`;

  // Rebuild dropdowns with current lists
  buildDD('inst','instituicoes','Todas as instituições');
  buildDD('orgao','orgaos','Todos os órgãos');
  buildDD('meio','meios','Todos os meios');
  setTimeout(setupACs, 60);
}

function clearFilters(){
  const keys=['advTags','advogados','oabs','ufOabs','nomes','processos','teor','dataInicial','dataFinal','instituicoes','orgaos','meios','tipoComunicacao'];
  keys.forEach(k=>{params[k]=Array.isArray(params[k])?[]:''});
  saveParams(); renderParams();
}

/* DATE MASK dd.mm.aaaa */
function maskDate(inp,field){
  let v=inp.value.replace(/\D/g,'').slice(0,8);
  if(v.length>4) v=v.slice(0,2)+'.'+v.slice(2,4)+'.'+v.slice(4);
  else if(v.length>2) v=v.slice(0,2)+'.'+v.slice(2);
  inp.value=v;
}
function validateDate(inp,field){
  const v=inp.value.trim();
  if(!v){params[field]='';saveParams();return;}
  // dd.mm.aaaa → aaaa-mm-dd for API
  const parts=v.split('.');
  if(parts.length===3&&parts[0].length===2&&parts[1].length===2&&parts[2].length===4){
    params[field]=v; // store as dd.mm.aaaa display; convert on query
    saveParams();
    inp.style.borderColor='';
  } else {
    inp.style.borderColor='var(--red)';
  }
}
function dateToISO(ddmmaaaa){
  if(!ddmmaaaa) return '';
  const p=ddmmaaaa.split('.');
  if(p.length===3) return `${p[2]}-${p[1]}-${p[0]}`;
  return ddmmaaaa;
}
function dateToDisplay(iso){
  if(!iso) return '';
  if(iso.includes('-')){const p=iso.split('-');if(p.length===3)return`${p[2]}.${p[1]}.${p[0]}`;}
  return iso;
}

/* CHIPS */
function mbox(field,vals,ph){
  const chips=vals.map(v=>`<span class="chip">${esc(v)}<button class="chip-x" onclick="rmChip('${field}','${v.replace(/\\/g,'\\\\').replace(/'/g,"\\'")}')">×</button></span>`).join('');
  return`<div class="mbox" onclick="document.getElementById('ci_${field}').focus()">${chips}<input class="ci" id="ci_${field}" placeholder="${ph}" onkeydown="addChip(event,'${field}','ci_${field}')"></div>`;
}
function addChip(e,field,iid){
  if(e.key!=='Enter'&&e.key!==',')return;
  e.preventDefault();
  const raw=e.target.value.trim();if(!raw)return;
  const v=raw.toUpperCase();
  if(!params[field])params[field]=[];
  if(!params[field].includes(v)){params[field].push(v);saveParams();renderParams();setTimeout(()=>{const el=document.getElementById(iid);if(el)el.focus()},0)}
  else e.target.value='';
}
function rmChip(field,val){params[field]=(params[field]||[]).filter(v=>v!==val);saveParams();renderParams()}
function setP(field,val){params[field]=val;saveParams()}

/* AUTOCOMPLETE */
function getAdvTags(){
  // Retorna tags de advogados cadastrados
  return [...new Set(state.advogados.flatMap(a=>a.tags||[]).map(t=>t.toLowerCase()))].sort();
}
function getAllAppTagIds(){
  // Retorna IDs de todas as appTags globais
  return state.appTags.map(t=>t.id);
}
function setupACs(){
  setupAC('ci_advTags','ac_advTags',
    v=>{
      // Combina tags de advogados cadastrados + appTags globais
      const advTagMatches=getAdvTags().filter(t=>t.includes(v.toLowerCase())).map(t=>({val:t.toUpperCase(),html:`${esc(t)} <span class="ac-sub">tag adv</span>`}));
      const appTagMatches=state.appTags.filter(t=>t.nome.toLowerCase().includes(v.toLowerCase())||t.id.includes(v.toLowerCase())).map(t=>({val:t.id.toUpperCase(),html:`<span style="color:${t.cor}">${esc(t.nome)}</span> <span class="ac-sub">appTag</span>`}));
      // Dedup por val
      const seen=new Set();
      return [...advTagMatches,...appTagMatches].filter(x=>{if(seen.has(x.val))return false;seen.add(x.val);return true;}).slice(0,10);
    },
    val=>{if(!params.advTags)params.advTags=[];const u=val.toUpperCase();if(!params.advTags.includes(u)){params.advTags.push(u);saveParams();renderParams();}});
  setupAC('ci_advogados','ac_advogados',
    v=>state.advogados.filter(a=>a.nome&&a.nome.toLowerCase().includes(v.toLowerCase())).map(a=>({val:a.nome,html:`${esc(a.nome)} <span class="ac-sub">OAB ${esc(a.oab||'')}${a.uf?'/'+esc(a.uf):''}</span>`})),
    val=>{if(!params.advogados.includes(val)){params.advogados.push(val);saveParams();renderParams();}});
  setupAC('ci_oabs','ac_oabs',
    v=>state.advogados.filter(a=>a.oab&&a.oab.includes(v)).map(a=>({val:a.oab,html:`${esc(a.oab)} <span class="ac-sub">${esc(a.nome||'')} ${esc(a.uf||'')}</span>`})),
    val=>{if(!params.oabs.includes(val)){params.oabs.push(val);saveParams();renderParams();}});
  setupAC('ci_ufOabs','ac_ufOabs',
    v=>[...new Set(state.advogados.filter(a=>a.uf&&a.uf.toLowerCase().includes(v.toLowerCase())).map(a=>a.uf))].map(u=>({val:u,html:esc(u)})),
    val=>{if(!params.ufOabs.includes(val)){params.ufOabs.push(val);saveParams();renderParams();}});
}
function setupAC(inputId,listId,getSugs,onSel){
  const inp=document.getElementById(inputId);
  const lst=document.getElementById(listId);
  if(!inp||!lst)return;
  let fi=-1;
  inp.addEventListener('input',()=>{
    const v=inp.value.trim();if(!v){lst.classList.remove('show');return}
    const sugs=getSugs(v).slice(0,7);
    if(!sugs.length){lst.classList.remove('show');return}
    fi=-1;lst._s=sugs;lst._f=onSel;
    lst.innerHTML=sugs.map((s,i)=>`<div class="ac-item" onmousedown="event.preventDefault()" onclick="window._acSel('${listId}',${i})">${s.html}</div>`).join('');
    lst.classList.add('show');
  });
  inp.addEventListener('keydown',e=>{
    const its=lst.querySelectorAll('.ac-item');
    if(e.key==='ArrowDown'){e.preventDefault();fi=Math.min(fi+1,its.length-1);its.forEach((el,i)=>el.classList.toggle('focused',i===fi))}
    else if(e.key==='ArrowUp'){e.preventDefault();fi=Math.max(fi-1,0);its.forEach((el,i)=>el.classList.toggle('focused',i===fi))}
    else if(e.key==='Enter'&&fi>=0){e.preventDefault();if(lst._s&&lst._s[fi]){onSel(lst._s[fi].val);inp.value='';lst.classList.remove('show');fi=-1;}}
    else if(e.key==='Escape'){lst.classList.remove('show');fi=-1;}
  });
  inp.addEventListener('blur',()=>setTimeout(()=>lst.classList.remove('show'),160));
}
window._acSel=(listId,i)=>{const lst=document.getElementById(listId);if(lst&&lst._s&&lst._s[i]){lst._f(lst._s[i].val);const inp=lst.closest('.ac-wrap')?.querySelector('.ci');if(inp)inp.value='';lst.classList.remove('show');}};

/* ADV HELPERS */
function getAdvsByTags(tags){
  if(!tags||!tags.length)return[];
  const lower=tags.map(t=>t.toLowerCase());
  return state.advogados.filter(a=>(a.tags||[]).some(t=>lower.includes(t.toLowerCase())));
}
function advLabel(a){const p=[];if(a.oab&&a.uf)p.push(`OAB ${a.oab}/${a.uf}`);else if(a.oab)p.push(`OAB ${a.oab}`);else if(a.uf)p.push(`UF:${a.uf}`);return p.join(' ')||'(sem OAB)'}
function injectAdvTag(tag){
  const u=tag.toUpperCase();
  if(!params.advTags)params.advTags=[];
  if(!params.advTags.includes(u)){params.advTags.push(u);saveParams();renderParams();}
  switchLTab('params');
}

/* ═══════════════════════════ RIGHT TABS ═══════════════════════ */
function switchRTab(tab){
  ['results','progress','favorites','monitor','users','tasks'].forEach(t=>{
    document.getElementById('panel-'+t).classList.toggle('show',t===tab);
    document.getElementById('tab-'+t).classList.toggle('active',t===tab);
  });
}

/* ═══════════════════════════ SEARCH ═══════════════════════════ */
// ── Rate limiting global ──
// Política da API: ao receber 429, aguarda retry-after (mín. 60s) e faz 1 retry
let _ratePause=false;

async function fetchWithRateLimit(url){
  while(_ratePause){await sleep(1000);}
  // AbortController para timeout de 30s (evita requisições pendentes indefinidamente)
  const ctrl=new AbortController();
  const timer=setTimeout(()=>ctrl.abort(),30000);
  let r;
  try{
    r=await fetch(url,{headers:{Accept:'application/json'},signal:ctrl.signal});
  }finally{clearTimeout(timer);}
  if(r.status===429){
    const waitSecs=Math.max(parseInt(r.headers.get('retry-after')||'60'),60);
    _ratePause=true;
    for(let s=waitSecs;s>0;s--){
      setStatus('loading',`⏸ Rate limit — aguardando ${s}s…`);
      await sleep(1000);
      if(_stopSearch){_ratePause=false;throw new Error('Interrompido');}
    }
    _ratePause=false;
    // Retry único com timeout
    const ctrl2=new AbortController();
    const timer2=setTimeout(()=>ctrl2.abort(),30000);
    try{return await fetch(url,{headers:{Accept:'application/json'},signal:ctrl2.signal});}
    finally{clearTimeout(timer2);}
  }
  return r;
}


async function runSearch(){
  allResults=[]; dedupResults=[]; progItems=[];
  // Limpa filtros pós-pesquisa e remoções ao iniciar nova busca
  Object.keys(postFilters).forEach(k=>postFilters[k]=[]);
  removedHashes.clear(); selectedForFav.clear();

  const taggedAdvs=getAdvsByTags(params.advTags||[]);
  const queries=[];

  // 1. Tag de equipe → AND por advogado
  taggedAdvs.forEach(a=>{
    const q={}; if(a.nome)q.nomeAdvogado=a.nome; if(a.oab)q.numeroOab=a.oab; if(a.uf)q.ufOab=a.uf;
    queries.push({label:`#${(a.tags||[]).join(',')} ${a.nome||advLabel(a)}`,q});
  });

  // 2. Advogados individuais — AND por posição
  const nAdv=Math.max((params.advogados||[]).length,(params.oabs||[]).length,(params.ufOabs||[]).length);
  for(let i=0;i<nAdv;i++){
    const nome=(params.advogados||[])[i]||'';
    const oab=(params.oabs||[])[i]||'';
    const uf=(params.ufOabs||[])[i]||(params.ufOabs||[])[0]||'';
    const q={};
    if(nome)q.nomeAdvogado=nome; if(oab)q.numeroOab=oab; if(uf)q.ufOab=uf;
    const label=[nome&&`Adv: ${nome}`,oab&&`OAB ${oab}`,uf&&`/${uf}`].filter(Boolean).join(' ');
    if(Object.keys(q).length)queries.push({label,q});
  }

  // 3. Partes
  (params.nomes||[]).forEach(n=>queries.push({label:`Parte: ${n}`,q:{nomeParte:n}}));

  // 4. Processos
  (params.processos||[]).forEach(n=>queries.push({label:`Processo: ${n}`,q:{numeroProcesso:n}}));

  if(!queries.length)queries.push({label:'Busca geral',q:{}});

  // Multiplicar por instituições × meios (cada combinação = 1 query AND)
  const tribs=(params.instituicoes||[]).length?params.instituicoes:[null];
  const meiosSel=(params.meios||[]).length>1?params.meios:[null];
  const allQ=[];
  queries.forEach(q=>{
    tribs.forEach(t=>{
      meiosSel.forEach(m=>{
        const qc={...q,q:{...q.q}};
        if(t)qc.q.siglaTribunal=t;
        if(m)qc.q.meio=m;
        const parts=[];
        if(t)parts.push(t);
        if(m)parts.push(m.replace('Diário de Justiça Eletrônico','DJe'));
        qc.label=parts.length?`${q.label} [${parts.join('+')}]`:q.label;
        allQ.push(qc);
      });
    });
  });

  progItems=allQ.map(q=>({label:q.label,status:'pending',count:0,error:null}));
  _stopSearch=false;
  document.getElementById('runBtn').disabled=true;
  document.getElementById('runBtn').innerHTML='<span class="spin">⟳</span>';
  document.getElementById('stopBtn').style.display='inline-flex';
  document.getElementById('btnDoc').disabled=true;
  document.getElementById('btnCsv').disabled=true;
  setStatus('loading',`0/${allQ.length}`);
  document.getElementById('progBadge').textContent=`0/${allQ.length}`;
  switchRTab('progress'); renderProgress();

  // Rate limiting: ver fetchWithRateLimit global

  for(let i=0;i<allQ.length;i++){
    // Verificar se pesquisa foi interrompida
    if(_stopSearch){
      progItems[i].status='error'; progItems[i].error='Interrompido pelo usuário';
      for(let j=i+1;j<allQ.length;j++){progItems[j].status='error';progItems[j].error='Cancelado';}
      renderProgress(); break;
    }
    progItems[i].status='running'; renderProgress();


    const qp={...allQ[i].q, pagina:1, itensPorPagina:50};
    // Filtros AND — aplicados em TODAS as queries
    if(params.dataInicial)     qp.dataDisponibilizacaoInicio=dateToISO(params.dataInicial);
    if(params.dataFinal)       qp.dataDisponibilizacaoFim   =dateToISO(params.dataFinal);
    if(params.tipoComunicacao) qp.tipoComunicacao           =params.tipoComunicacao;
    if(params.teor)            qp.teor                     =params.teor;
    if((params.meios||[]).length===1) qp.meio=params.meios[0];
    try{
      const r=await fetchWithRateLimit(`${API}?${new URLSearchParams(qp)}`);
      if(!r.ok)throw new Error(`HTTP ${r.status}`);
      const data=await r.json();
      let items=Array.isArray(data)?data:(data.items||data.comunicacoes||data.data||data.result||[]);
      items=await enrichItems(items);
      items.forEach(it=>{it._source=allQ[i].label;});
      allResults.push(...items);
      progItems[i].status='done'; progItems[i].count=items.length;
    }catch(err){
      progItems[i].status='error'; progItems[i].error=err.message;
    }
    const done=progItems.filter(x=>x.status==='done'||x.status==='error').length;
    document.getElementById('progBadge').textContent=`${done}/${allQ.length}`;
    setStatus('loading',`${done}/${allQ.length}`);
    renderProgress();


  }

  dedupResults=dedup(allResults);
  const tot=dedupResults.length;
  document.getElementById('resBadge').textContent=tot;
  document.getElementById('runBtn').disabled=false;
  document.getElementById('runBtn').innerHTML='▶ Pesquisar';
  document.getElementById('btnDoc').disabled=tot===0;
  document.getElementById('btnCsv').disabled=tot===0;
  setStatus(tot>0?'ok':'error',`${tot} únicos · ${allResults.length} total · ${allQ.length} consulta(s)`);
  document.getElementById('stopBtn').style.display='none';
  // Mapear área de cada publicação
  mapAreas();
  renderResults();
  renderPostFilterBar();
  switchRTab('results');
}


function stopSearch(){
  _stopSearch=true;
  document.getElementById('stopBtn').style.display='none';
  setStatus('error','Busca interrompida pelo usuário');
}
/* ═══════════════════════════ ENRICH ═══════════════════════════ */
async function enrichItems(items){
  // Processar itens SEQUENCIALMENTE (não em paralelo) para respeitar rate limit
  const result=[];
  for(const it of items){
    normalizeItem(it);
    if(!it.texto){
      const hash=it.hash||it.id||'';
      if(hash){
        try{
          const r=await fetchWithRateLimit(`${API}/${hash}/certidao`);
          if(r.ok){
            const d=await r.json();
            it.texto=d.texto||d.teor||d.inteiro_teor||d.conteudo||d.teorComunicacao||'';
            // certidão URL for button
            it._certidaoUrl=`${API}/${hash}/certidao`;
            it._certidaoHash=hash;
            if(d.nomeOrgao&&!it.nomeOrgao)it.nomeOrgao=d.nomeOrgao;
            if(d.destinatarios&&(!it.destinatarios||!it.destinatarios.length))it.destinatarios=d.destinatarios;
            if(d.destinatarioadvogados&&(!it.destinatarioadvogados||!it.destinatarioadvogados.length))it.destinatarioadvogados=d.destinatarioadvogados;
            it._srcCertidao=true;
          }
        }catch(_){}
      }
    } else {
      // Has texto but store certidao URL anyway
      const hash=it.hash||it.id||'';
      if(hash) it._certidaoUrl=`${API}/${hash}/certidao`;
    }
    result.push(it);
    // Pequeno delay entre certidões para não sobrecarregar o rate limit
    if(items.indexOf(it)<items.length-1) await sleep(100);
  }
  return result;
}

function normalizeItem(it){
  // datas — vários nomes de campo possíveis
  if(!it.data_disponibilizacao&&it.dataDisponibilizacao)it.data_disponibilizacao=it.dataDisponibilizacao;
  if(!it.data_disponibilizacao&&it.datadisponibilizacao)it.data_disponibilizacao=it.datadisponibilizacao;
  if(!it.data_disponibilizacao&&it.data_publicacao)it.data_disponibilizacao=it.data_publicacao;
  // número processo
  if(!it.numero_processo&&it.numeroProcesso)it.numero_processo=it.numeroProcesso;
  if(!it.numero_processo&&it.numero)it.numero_processo=it.numero;
  if(!it.numero_processo&&it.numeroprocessocommascara)it.numero_processo=it.numeroprocessocommascara;
  // texto/teor
  if(!it.texto&&it.teor)it.texto=it.teor;
  if(!it.texto&&it.inteiro_teor)it.texto=it.inteiro_teor;
  if(!it.texto&&it.teorComunicacao)it.texto=it.teorComunicacao;
  // órgão
  if(!it.nomeOrgao&&it.orgaoJulgador)it.nomeOrgao=it.orgaoJulgador;
  if(!it.nomeOrgao&&it.orgao)it.nomeOrgao=it.orgao;
  // tribunal
  if(!it.siglaTribunal&&it.sigla_tribunal)it.siglaTribunal=it.sigla_tribunal;
  // hash/id
  if(!it.hash&&it.id)it.hash=String(it.id);
  // destinatarioadvogados — schema: [{advogado:{nome,numero_oab,uf_oab}}]
  // Preserva o array original; usa alternativas se ausente
  if(!it.destinatarioadvogados||!it.destinatarioadvogados.length){
    if(it.destinatario_advogados&&it.destinatario_advogados.length)
      it.destinatarioadvogados=it.destinatario_advogados;
    else if(it.advogados&&Array.isArray(it.advogados)&&it.advogados.length)
      it.destinatarioadvogados=it.advogados;
  }
  // certidão URL
  const hash=it.hash||it.id||'';
  if(hash&&!it._certidaoUrl)it._certidaoUrl=`${API}/${hash}/certidao`;
}

function dedup(items){
  const seen=new Set();const out=[];
  for(const it of items){
    const k=it.hash||it.id||[(it.numero_processo||''),(it.data_disponibilizacao||''),(it.tipoComunicacao||''),(it.siglaTribunal||it.orgao||'')].join('|');
    if(!seen.has(k)){seen.add(k);out.push(it)}
  }
  return out;
}

/* ═══════════════════════════ PROGRESS ════════════════════════ */
function renderProgress(){
  if(!progItems.length)return;
  const done=progItems.filter(x=>x.status==='done').length;
  const errs=progItems.filter(x=>x.status==='error').length;
  const cors=progItems.filter(x=>x.status==='error'&&(x.error||'').includes('fetch'));
  const html=progItems.map(it=>{
    const pct=it.status==='done'||it.status==='error'?100:it.status==='running'?55:0;
    const col=it.status==='error'?'var(--red)':it.status==='done'?'var(--green)':it.status==='running'?'var(--amber)':'var(--border2)';
    const st=it.status==='pending'?'aguardando':it.status==='running'?'buscando…':it.status==='done'?`${it.count} result.`:'erro';
    return`<div class="prog-row"><span class="prog-lbl" title="${esc(it.error||it.label)}">${esc(it.label)}</span><div class="prog-bar"><div class="prog-fill" style="width:${pct}%;background:${col}"></div></div><span class="prog-st" style="color:${col}">${st}</span></div>`;
  }).join('');
  let warn='';
  if(cors.length)warn=`<div style="margin-top:10px;padding:8px 10px;border:1px solid rgba(251,191,36,.25);border-radius:var(--r);background:rgba(251,191,36,.06);font-size:11px;color:var(--amber)">⚠️ CORS detectado — use a extensão Chrome (ZIP).</div>`;
  document.getElementById('progressContent').innerHTML=`<div style="font-size:10px;color:var(--text3);margin-bottom:9px;font-family:var(--mono)">${progItems.length} consulta(s) · ${done} ok · ${errs} erro(s)</div>${html}${warn}`;
}

