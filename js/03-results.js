/* ═══════════════════════════ RESULTS ═════════════════════════ */
function renderResults(){
  // Aplica filtros pós-pesquisa + remoções
  let items=applyPostFilters(
    filterText?dedupResults.filter(it=>JSON.stringify(it).toLowerCase().includes(filterText.toLowerCase())):[...dedupResults]
  );
  items.sort((a,b)=>{
    const da=a.data_disponibilizacao||a.dataDisponibilizacao||'',db=b.data_disponibilizacao||b.dataDisponibilizacao||'';
    const na=a.numero_processo||a.numeroProcesso||'',nb=b.numero_processo||b.numeroProcesso||'';
    if(sortField==='data_desc')return db.localeCompare(da);
    if(sortField==='data_asc')return da.localeCompare(db);
    if(sortField==='num_asc')return na.localeCompare(nb);
    if(sortField==='num_desc')return nb.localeCompare(na);
    return 0;
  });
  const hc=filterText.length>0;
  const toolbar=`<div class="res-tb">
    <span class="res-cnt"><strong>${items.length}</strong>/${dedupResults.length}</span>
    <div class="fw"><input class="fi" placeholder="Filtrar…" oninput="onFilter(this.value)" value="${esc(filterText)}">
    <button class="fclear${hc?' ':'  h'}" onclick="clearFilter()">✕</button></div>
    <select class="sort-sel" onchange="sortField=this.value;renderResults()">
      <option value="data_desc"${sortField==='data_desc'?' selected':''}>Data ↓</option>
      <option value="data_asc" ${sortField==='data_asc' ?' selected':''}>Data ↑</option>
      <option value="num_asc"  ${sortField==='num_asc'  ?' selected':''}>Nº ↑</option>
      <option value="num_desc" ${sortField==='num_desc' ?' selected':''}>Nº ↓</option>
    </select>
    <button class="ib" style="padding:5px 7px;line-height:0" title="Expandir todos" onclick="expandAll(true)">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.4"/>
        <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.4"/>
        <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.4"/>
        <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.4"/>
      </svg>
    </button>
    <button class="ib" style="padding:5px 7px;line-height:0" title="Recolher todos" onclick="expandAll(false)">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="2" width="12" height="2.5" rx="1" fill="currentColor"/>
        <rect x="1" y="6.5" width="12" height="2.5" rx="1" fill="currentColor"/>
        <rect x="1" y="11" width="12" height="2.5" rx="1" fill="currentColor"/>
      </svg>
    </button>
  </div>`;
  if(!items.length){
    document.getElementById('resultsContent').innerHTML=toolbar+`<div class="empty"><div class="ei">🔎</div><div class="et">${filterText||Object.values(postFilters).some(v=>v.length)?'Sem resultados para os filtros':'Sem resultados'}</div></div>`;
    renderPostFilterBar(); return;
  }
  // Cards expandíveis — combinam lista + detalhe (ex-leitura)
  const cards=items.map(it=>buildPubCard(it,'rc_'+getHash(it).replace(/[^a-zA-Z0-9]/g,'_').slice(0,20))).join('');
  document.getElementById('resultsContent').innerHTML=toolbar+`<div id="pub-cards-list">${cards}</div>`;
  renderPostFilterBar();
}

function expandAll(open){
  document.querySelectorAll('.pub-body').forEach(b=>{b.classList.toggle('open',open);});
  document.querySelectorAll('.pub-exp').forEach(e=>{e.classList.toggle('open',open);});
}


function onFilter(v){filterText=v;renderResults();renderReader();const b=document.querySelector('.fclear');if(b)b.classList.toggle('h',!v)}
function clearFilter(){filterText='';renderResults();renderReader()}

/* ═══════════════════════════ READER ══════════════════════════ */
function renderReader(items){renderResults();}


function buildPubCard(it,uid){
  const num=it.numero_processo||it.numeroProcesso||'—';
  const numMask=it.numeroprocessocommascara||num;
  const org=it.siglaTribunal||it.orgao||'';
  const nomeOrgao=it.nomeOrgao||it.orgaoJulgador||org||'';
  const data=dateToDisplay(it.data_disponibilizacao||it.dataDisponibilizacao||'');
  const tipo=it.tipoComunicacao||'';
  const meio=it.meiocompleto||it.meio||'';
  const tipoDoc=it.tipoDocumento||'';
  const nomeClasse=it.nomeClasse||it.classeProcessual||'';
  const codClasse=it.codigoClasse||'';
  const numCom=it.numeroComunicacao||'';
  const hash=getHash(it);
  const isFav=state.favorites.includes(hash);
  const link=it.link||it.url||'https://comunica.pje.jus.br';
  const texto=it.texto||it.teor||'';
  // Certidão URL: GET /api/v1/comunicacao/{hash}/certidao
  const certidaoUrl=it._certidaoUrl||(hash?`${API}/${hash}/certidao`:'');
  const isMonitored=state.monitoredProcesses.some(p=>p.numero===num);
  const procTagsList=getProcessTags(num);

  // destinatarios (partes)
  const dests=it.destinatarios||it.partes||[];
  const destsHtml=Array.isArray(dests)&&dests.length
    ?dests.map(d=>`<div class="parte-row">
        <span class="polo-dot" style="background:${d.polo==='ATIVO'||d.ativo?'var(--green)':d.polo==='PASSIVO'?'var(--red)':'var(--text3)'}"></span>
        <div><div class="parte-nm">${esc(d.nome||d.nomeParte||d.name||'')}</div>${d.polo?`<div class="parte-polo">${esc(d.polo)}</div>`:''}</div>
      </div>`).join('')
    :'<span style="font-size:11px;color:var(--text3)">—</span>';

  // destinatarioadvogados — schema real:
  // [{id, comunicacao_id, advogado_id, created_at, updated_at,
  //   advogado: {id, nome, numero_oab, uf_oab}}]
  const advs=it.destinatarioadvogados||it.advogados||it.advogado||[];
  const advsHtml=Array.isArray(advs)&&advs.length
    ?advs.map(a=>{
        if(typeof a==='string')return`<div class="adv-row-r">${esc(a)}</div>`;
        // Objeto aninhado: a.advogado.{nome, numero_oab, uf_oab}
        const adv=a.advogado||a;
        const nome=adv.nome||a.nomeAdvogado||a.nome||a.name||'';
        const oab=adv.numero_oab||a.numero_oab||adv.numeroOab||a.numeroOab||adv.oab||a.oab||'';
        const uf=adv.uf_oab||a.uf_oab||adv.ufOab||a.ufOab||adv.uf||a.uf||'';
        const oabStr=oab?(uf?`OAB ${oab}/${uf}`:`OAB ${oab}`):'';
        return`<div class="adv-row-r">${esc(nome||'(sem nome)')}${oabStr?`<span class="adv-oab-r">${esc(oabStr)}</span>`:''}</div>`;
      }).join('')
    :'<span style="font-size:11px;color:var(--text3)">—</span>';

  // Coluna esquerda: metadados
  const sideRows=[
    nomeOrgao&&['Órgão',nomeOrgao,''],
    data&&['Data de disponibilização',data,''],
    tipo&&['Tipo de comunicação',tipo,''],
    meio&&['Meio',meio,''],
    tipoDoc&&['Tipo de documento',tipoDoc,''],
    nomeClasse&&['Classe',nomeClasse+(codClasse?` (${codClasse})`:''),''],
    numCom&&['Nº comunicação',numCom,'mono'],
    link&&['Inteiro teor','Clique aqui','lnk'],
    it._source&&['Fonte da busca',it._source,'amb'],
  ].filter(Boolean).map(([lbl,val,cls])=>`<div class="pfl">
    <div class="pfl-lbl">${lbl}</div>
    <div class="pfl-val${cls?' '+cls:''}"${cls==='lnk'?` onclick="openLink('${esc(link)}')"`:''} >${esc(val)}</div>
  </div>`).join('');

  return`<div class="pub-card${isFav?' fav-card':''}" id="${uid}">
    <div class="pub-head">
      <div style="flex:1;min-width:0" onclick="togglePub('${uid}')">
        <div class="pub-num">${esc(numMask||num)}</div>
        <div class="pub-meta-row">
          ${org?`<span class="badge b-org">${esc(org)}</span>`:''}
          ${tipo?`<span class="badge b-tipo">${esc(tipo)}</span>`:''}
          ${data?`<span style="font-size:9px;color:var(--text3);font-family:var(--mono)">📅 ${esc(data)}</span>`:''}
        </div>
        ${getParts(it)?`<div class="pub-pl">Parte(s): <strong>${esc(getParts(it))}</strong></div>`:''}
      </div>
      <div class="pub-hr">
        <button class="fav-btn" onclick="toggleSelect('${hash}',this)" title="Selecionar">${selectedForFav.has(hash)?'☑':'☐'}</button>
        <button class="fav-btn${isFav?' on':''}" onclick="toggleFav('${hash}',this)" title="${isFav?'Remover favorito':'Favoritar'}">${isFav?'⭐':'☆'}</button>
        <button class="fav-btn${isMonitored?' on':''}" onclick="toggleMonitor('${num}')" title="${isMonitored?'Parar monitoramento':'Monitorar processo'}">🔔</button>
        <button class="fav-btn" onclick="removeItem('${hash}')" style="color:var(--red)" title="Remover">✕</button>
        <button class="pub-exp" id="exp_${uid}" onclick="togglePub('${uid}')">›</button>
      </div>
    </div>
    <div class="pub-body" id="body_${uid}">
      <!-- Tags do processo -->
      <div class="proc-tags-bar" id="ptbar_${uid}">
        ${procTagsList.map(t=>renderTagChip(t,true,num)).join('')}
        <div class="add-tag-inline" style="position:relative;display:inline-flex">
          <input class="tag-inline-input" placeholder="+ tag" title="Adicionar tag ao processo"
            oninput="tagAutocomplete(this,(id)=>{addTagToProcess('${num}',id);renderResults();})"
            onkeydown="addTagToProcess_input(event,'${num}',this)">
        </div>
      </div>
      <div class="pub-layout">
        <div class="pub-left">
          ${sideRows}
          <div class="pfl"><div class="pfl-lbl">Destinatário(s)</div>${destsHtml}</div>
          <div class="pfl"><div class="pfl-lbl">Advogado(s)</div>${advsHtml}</div>
        </div>
        <div class="pub-right">
          <div class="teor-hdr">
            <span>Teor da comunicação</span>
            ${link?`<a href="${esc(link)}" target="_blank" class="teor-lnk">Ver portal ↗</a>`:''}
          </div>
          ${texto
            ?`<div class="teor-body">${esc(texto)}</div>`
            :`<div style="font-size:11px;color:var(--text3);line-height:1.5">Teor não disponível via API.${link?` <a href="${esc(link)}" target="_blank" class="teor-lnk">Acesse o portal ↗</a>`:''}</div>`}
          ${certidaoUrl?`<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border)">
            <a href="${esc(certidaoUrl)}" target="_blank" class="cert-btn">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1.5" y="1" width="8" height="11" rx="1" stroke="currentColor" stroke-width="1.2"/><path d="M3.5 4h5M3.5 6.5h5M3.5 9h3" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/><circle cx="10" cy="10" r="2.5" fill="currentColor" fill-opacity=".15" stroke="currentColor" stroke-width="1"/><path d="M9.5 10l.7.7 1.3-1.2" stroke="currentColor" stroke-width=".9" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Certidão de Publicação
            </a>
          </div>`:''}
        </div>
      </div>
    </div>
  </div>`;
}

function togglePub(uid){const b=document.getElementById('body_'+uid);const e=document.getElementById('exp_'+uid);const o=b.classList.toggle('open');if(e)e.classList.toggle('open',o)}

/* ═══════════════════════════ EXPORT DOC ══════════════════════ */
function exportDoc(){
  const list=getFilteredForExport();
  if(!list.length){alert('Nenhuma publicação para exportar.');return;}
  const rows=list.map(it=>{
    const dl=it.destinatarios||it.partes||[];
    const al=it.destinatarioadvogados||it.advogados||[];
    const partes=dl.map(p=>`${p.nome||p.nomeParte||''} (${p.polo||''})`).join('; ')||'—';
    const advs=al.map(a=>{
      const adv=a.advogado||a;
      const nome=adv.nome||a.nome||'';
      const oab=adv.numero_oab||adv.oab||a.numero_oab||'';
      const uf=adv.uf_oab||adv.uf||a.uf_oab||'';
      return nome+(oab?` — OAB ${oab}${uf?'/'+uf:''}`:'');
    }).join('; ')||'—';
    const texto=it.texto||'(teor não disponível)';
    const data=dateToDisplay(it.data_disponibilizacao||it.dataDisponibilizacao||'');
    const certUrl=it._certidaoUrl||'';
    const num=it.numero_processo||it.numeroProcesso||'—';
    const numMask=it.numeroprocessocommascara||num;
    return`<div class="pub"><h2>${esc(numMask)}</h2>
      <table>
        <tr><th>Órgão</th><td>${esc(it.nomeOrgao||it.siglaTribunal||'—')}</td><th>Data</th><td>${esc(data||'—')}</td></tr>
        <tr><th>Tipo</th><td>${esc(it.tipoComunicacao||'—')}</td><th>Meio</th><td>${esc((it.meiocompleto||it.meio||'').replace('Diário de Justiça Eletrônico Nacional','DJe Nacional')||'—')}</td></tr>
        <tr><th>Classe</th><td>${esc(it.nomeClasse||'—')}</td><th>Tipo doc.</th><td>${esc(it.tipoDocumento||'—')}</td></tr>
        <tr><th>Parte(s)</th><td colspan="3">${esc(partes)}</td></tr>
        <tr><th>Advogado(s)</th><td colspan="3">${esc(advs)}</td></tr>
        ${certUrl?`<tr><th>Certidão</th><td colspan="3"><a href="${esc(certUrl)}">${esc(certUrl)}</a></td></tr>`:''}
      </table>
      <h3>Teor da Comunicação</h3><div class="teor">${esc(texto)}</div>
      ${it.link?`<p class="link"><a href="${esc(it.link)}">${esc(it.link)}</a></p>`:''}</div>`;
  }).join('');
  const html=`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Relatório PJe</title>
  <style>body{font-family:Arial,sans-serif;font-size:12px;color:#111;max-width:960px;margin:0 auto;padding:24px}
  h1{font-size:18px;text-align:center;margin-bottom:3px}.sub{text-align:center;font-size:11px;color:#555;margin-bottom:20px}
  .pub{border:1px solid #ccc;border-radius:5px;padding:16px 20px;margin-bottom:18px;break-inside:avoid}
  h2{font-size:14px;font-weight:bold;color:#003380;margin-bottom:10px;font-family:monospace}
  table{width:100%;border-collapse:collapse;margin-bottom:11px;font-size:11px}
  th{text-align:left;font-weight:bold;background:#f5f5f5;padding:4px 8px;border:1px solid #ddd;width:14%;white-space:nowrap}
  td{padding:4px 8px;border:1px solid #ddd}td a{color:#003380;word-break:break-all}
  h3{font-size:12px;font-weight:bold;margin-bottom:5px;border-bottom:1px solid #ddd;padding-bottom:3px}
  .teor{font-size:11px;line-height:1.75;color:#333;white-space:pre-wrap;word-break:break-word}
  .link{font-size:10px;color:#555;margin-top:7px}@media print{.pub{page-break-inside:avoid}}</style></head>
  <body><h1>Relatório de Publicações PJe</h1>
  <div class="sub">${list.length} publicação(ões) · gerado em ${new Date().toLocaleString('pt-BR')}</div>
  ${rows}</body></html>`;
  dl(html,'text/html',`pje_relatorio_${ts()}.html`);
}


function exportCSV(){
  if(!dedupResults.length)return;
  const sep=';',q=(v)=>`"${String(v||'').replace(/"/g,'""')}"`;
  const h1=['Nº Processo','Nº com máscara','Data Disp.','Tipo Comunicação','Meio','Tribunal','Órgão','Tipo Documento','Classe','Nº Comunicação','Hash','Certidão URL','Parte(s)','Advogado(s)','Fonte','Teor'];
  const r1=dedupResults.map(it=>{
    const dl=it.destinatarios||it.partes||[];const al=it.destinatarioadvogados||it.advogados||[];
    const partes=dl.map(p=>`${p.nome||p.nomeParte||''}${p.polo?' ('+p.polo+')':''}`).join(' | ');
    const advs=al.map(a=>typeof a==='string'?a:`${a.nome||''} OAB ${a.numeroOab||a.oab||''}`).join(' | ');
    const data=dateToDisplay(it.data_disponibilizacao||'');
    return[q(it.numero_processo||''),q(it.numeroprocessocommascara||''),q(data),q(it.tipoComunicacao||''),
      q((it.meiocompleto||it.meio||'').replace('Diário de Justiça Eletrônico Nacional','DJe Nacional')),
      q(it.siglaTribunal||''),q(it.nomeOrgao||it.orgao||''),q(it.tipoDocumento||''),
      q(it.nomeClasse||''),q(it.numeroComunicacao||''),q(it.hash||''),q(it._certidaoUrl||''),
      q(partes),q(advs),q(it._source||''),q(it.texto||it.teor||'')].join(sep);
  });
  const h2=['Nº Processo','Parte','Polo','Advogado(s)','Tribunal','Órgão','Data Disponibilização','Certidão URL','Transcrição do Conteúdo'];
  const r2=[];
  dedupResults.forEach(it=>{
    const al=it.destinatarioadvogados||it.advogados||[];
    const advs=al.map(a=>typeof a==='string'?a:`${a.nome||''} OAB ${a.numeroOab||a.oab||''}`).join(' | ');
    const data=dateToDisplay(it.data_disponibilizacao||'');
    const texto=it.texto||it.teor||'';
    const pl=it.destinatarios||it.partes||[];
    const num=it.numero_processo||'';
    if(pl.length)pl.forEach(p=>r2.push([q(num),q(p.nome||p.nomeParte||''),q(p.polo||''),q(advs),q(it.siglaTribunal||''),q(it.nomeOrgao||it.orgao||''),q(data),q(it._certidaoUrl||''),q(texto)].join(sep)));
    else r2.push([q(num),'','',q(advs),q(it.siglaTribunal||''),q(it.nomeOrgao||''),q(data),q(it._certidaoUrl||''),q(texto)].join(sep));
  });
  const csv='\uFEFF'+'PUBLICAÇÕES DETALHADAS\n'+h1.join(sep)+'\n'+r1.join('\n')+'\n\n\nLISTA DE PROCESSOS POR PARTE\n'+h2.join(sep)+'\n'+r2.join('\n');
  dl(csv,'text/csv;charset=utf-8;',`pje_${ts()}.csv`);
}
function dl(c,m,n){const u=URL.createObjectURL(new Blob([c],{type:m}));const a=document.createElement('a');a.href=u;a.download=n;a.click();URL.revokeObjectURL(u)}
function ts(){return new Date().toISOString().slice(0,10)}



/* ═════════════════════ POST-SEARCH FILTERS ══════════════════ */
// Estado dos filtros pós-pesquisa
let postFilters={tribunais:[],areas:[],advogados:[],partes:[],polos:[],classes:[],tiposDoc:[],datas:[],procTags:[]};
let removedHashes=new Set();
let selectedForFav=new Set();
let _stopSearch=false; // flag para parar busca

// Mapa de área → keywords (normalizado em UPPERCASE)
const AREA_MAP={
  'Tributária':      ['TRIBUT','FISCAL','FAZEND','EXECUÇÃO FISCAL','EMBARGOS À EXECUÇÃO FISCAL','CRÉDITO TRIBUTÁRIO','DÍVIDA ATIVA'],
  'Cível':           ['CÍVEL','CIVIL','APELAÇÃO','AGRAVO','RECURSO ESPECIAL','RECURSO ORDINÁRIO','EMBARGO','INDENIZ'],
  'Trabalhista':     ['TRABALHIST','RECLAMAÇÃO','TST','TRT','CLT','HORAS EXTRAS','VERBAS TRABALHISTAS'],
  'Criminal':        ['CRIMINAL','PENAL','CRIME','HABEAS CORPUS','INQUÉRITO','AÇÃO PENAL'],
  'Previdenciária':  ['PREVIDENCI','INSS','BENEFÍCIO','APOSENTADORI','PENSÃO POR MORTE','AUXÍLIO'],
  'Administrativa':  ['ADMINISTRAT','MANDADO DE SEGURANÇA','IMPROBIDADE','CONCURSO','SERVIDOR'],
  'Família':         ['FAMÍLI','DIVÓRCIO','ALIMENTOS','GUARDA','ADOÇÃO','UNIÃO ESTÁVEL'],
};

// Detecta a área de um item baseado em nomeClasse + texto
function detectArea(it){
  const hay=((it.nomeClasse||it.classeProcessual||'')+'|'+(it.texto||'').slice(0,500)).toUpperCase();
  for(const [area,kws] of Object.entries(AREA_MAP)){
    if(kws.some(kw=>hay.includes(kw))) return area;
  }
  return 'Outras';
}

function getFilteredForExport(){return applyPostFilters(dedupResults);}

function applyPostFilters(items){
  return items.filter(it=>{
    const hash=getHash(it);
    if(removedHashes.has(hash)) return false;
    const {tribunais,areas,advogados,partes,polos,classes,tiposDoc,datas}=postFilters;
    if(tribunais.length){
      const trib=it.siglaTribunal||it.orgao||'';
      if(!tribunais.includes(trib)) return false;
    }
    if(classes.length){
      const cl=it.nomeClasse||it.classeProcessual||'';
      if(!classes.includes(cl)) return false;
    }
    if(tiposDoc.length){
      const td=it.tipoDocumento||'';
      if(!tiposDoc.includes(td)) return false;
    }
    if(polos.length){
      // Busca polo em destinatarios E no texto (robustez)
      const itemPolos=(it.destinatarios||it.partes||[]).map(p=>(p.polo||'').toUpperCase()).filter(Boolean);
      const hayUpper=(it.texto||'').toUpperCase();
      const matched=polos.some(p=>{
        const pu=p.toUpperCase();
        return itemPolos.includes(pu)||hayUpper.includes('POLO '+pu)||hayUpper.includes('PARTE '+pu);
      });
      if(!matched) return false;
    }
    if(advogados.length){
      const itemAdvNames=(it.destinatarioadvogados||it.advogados||[]).map(a=>{const adv=a.advogado||a;return(adv.nome||a.nome||'').toUpperCase();}).filter(Boolean);
      if(!advogados.some(a=>itemAdvNames.some(n=>n.includes(a.toUpperCase())))) return false;
    }
    if(partes.length){
      const itemParteNames=(it.destinatarios||it.partes||[]).map(p=>(p.nome||p.nomeParte||'').toUpperCase()).filter(Boolean);
      if(!partes.some(p=>itemParteNames.some(n=>n.includes(p.toUpperCase())))) return false;
    }
    if(areas.length){
      const itemArea=it._area||detectArea(it);
      if(!areas.includes(itemArea)) return false;
    }
    if(datas.length){
      // datas = ['YYYY-MM-DD|YYYY-MM-DD'] range ou datas exatas
      const itemData=(it.data_disponibilizacao||it.dataDisponibilizacao||'').slice(0,10);
      if(!datas.includes(itemData)) return false;
    }
    // Filtro por tag de processo
    if(postFilters.procTags&&postFilters.procTags.length){
      const itemTags=state.processTags[it.numero_processo||it.numeroProcesso||'']||[];
      if(!postFilters.procTags.some(t=>itemTags.includes(t)))return false;
    }
    return true;
  });
}

// Extrai valores únicos
function getUniqueValues(field){
  const s=new Set();
  dedupResults.forEach(it=>{
    if(field==='tribunais'){const v=it.siglaTribunal||it.orgao||'';if(v)s.add(v);}
    else if(field==='classes'){const v=it.nomeClasse||it.classeProcessual||'';if(v)s.add(v);}
    else if(field==='tiposDoc'){const v=it.tipoDocumento||'';if(v)s.add(v);}
    else if(field==='polos'){
      (it.destinatarios||it.partes||[]).forEach(p=>{
        const v=(p.polo||'').trim().toUpperCase();
        if(v)s.add(v);
      });
      // Fallback: inferir polo do texto
      if(!s.size){
        if((it.texto||'').toUpperCase().includes('POLO ATIVO')) s.add('ATIVO');
        if((it.texto||'').toUpperCase().includes('POLO PASSIVO')) s.add('PASSIVO');
      }
    }
    else if(field==='advogados'){
      (it.destinatarioadvogados||it.advogados||[]).forEach(a=>{
        const adv=a.advogado||a;const n=adv.nome||a.nome||'';if(n)s.add(n);
      });
    }
    else if(field==='partes'){
      (it.destinatarios||it.partes||[]).forEach(p=>{const n=p.nome||p.nomeParte||'';if(n)s.add(n);});
    }
    else if(field==='areas'){
      if(!it._area)it._area=detectArea(it);
      s.add(it._area);
    }
    else if(field==='datas'){
      const v=(it.data_disponibilizacao||it.dataDisponibilizacao||'').slice(0,10);
      if(v)s.add(v);
    }
    else if(field==='procTags'){
      const tags=state.processTags[it.numero_processo||it.numeroProcesso||'']||[];
      tags.forEach(t=>s.add(t));
    }
  });
  return [...s].filter(Boolean).sort();
}

// Mapeia _area em todos os resultados após busca
function mapAreas(){
  dedupResults.forEach(it=>{if(!it._area)it._area=detectArea(it);});
}

/* Render da barra de filtros */
function renderPostFilterBar(){
  const el=document.getElementById('postFilterBar');
  if(!el)return;
  if(!dedupResults.length){el.innerHTML='';return;}
  // Garante que áreas foram mapeadas
  mapAreas();
  const FILTER_DEFS=[
    {key:'tribunais',label:'Tribunal',values:getUniqueValues('tribunais')},
    {key:'areas',    label:'Área',    values:getUniqueValues('areas')},
    {key:'advogados',label:'Advogado',values:getUniqueValues('advogados')},
    {key:'partes',   label:'Parte',   values:getUniqueValues('partes')},
    {key:'polos',    label:'Polo',    values:getUniqueValues('polos').length?getUniqueValues('polos'):['ATIVO','PASSIVO']},
    {key:'classes',  label:'Classe',  values:getUniqueValues('classes')},
    {key:'tiposDoc', label:'Tipo doc.',values:getUniqueValues('tiposDoc')},
    {key:'datas',    label:'Data',    values:getUniqueValues('datas')},
    {key:'procTags', label:'Tag',     values:getUniqueValues('procTags').map(id=>{const t=state.appTags.find(x=>x.id===id);return t?t.nome:id;})},
  ].filter(f=>f.values.length>0);

  const filtered=applyPostFilters(dedupResults);
  const removedCount=removedHashes.size;
  const selCount=selectedForFav.size;
  const anyActive=FILTER_DEFS.some(f=>(postFilters[f.key]||[]).length>0);

  const ddHtml=FILTER_DEFS.map(f=>{
    const sel=postFilters[f.key]||[];
    const lbl=sel.length===0?f.label:sel.length===1?sel[0].slice(0,16):`${f.label} (${sel.length})`;
    // Guarda os valores como atributo data para evitar JSON no onclick
    const ddId=`pf_${f.key}`;
    return`<div class="pf-dd-wrap" data-key="${f.key}">
      <button class="pf-tag${sel.length?' pf-tag-active':''}" onclick="togglePfDD('${ddId}')" type="button">
        ${esc(lbl)} <span class="pf-arr">▾</span>
      </button>
      <div class="pf-dd" id="${ddId}">
        <div class="pf-dd-search">
          <input type="text" placeholder="Buscar…" oninput="filterPfDD('${ddId}',this.value)" onclick="event.stopPropagation()">
        </div>
        <div class="pf-dd-selall">
          <span onclick="pfSelAllById('${f.key}','${ddId}',true); event.stopPropagation()">☑ Todos</span>
          <span onclick="pfSelAllById('${f.key}','${ddId}',false); event.stopPropagation()">☐ Nenhum</span>
        </div>
        <div class="pf-dd-items" id="${ddId}_items">
          ${f.values.map(v=>{
            const safe=v.replace(/[^a-zA-Z0-9]/g,'_').slice(0,24);
            return`<div class="pf-dd-item" data-val="${esc(v)}">
              <input type="checkbox" id="pfck_${f.key}_${safe}" ${sel.includes(v)?'checked':''}
                onclick="event.stopPropagation()"
                onchange="pfToggle('${f.key}','${v.replace(/\\/g,'\\\\').replace(/'/g,"\\'")}',this.checked); event.stopPropagation()">
              <label for="pfck_${f.key}_${safe}" onclick="event.stopPropagation()">${esc(f.key==='datas'?dateToDisplay(v):v)}</label>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>`;
  }).join('');

  el.innerHTML=`<div class="pf-bar">
    <div class="pf-bar-left">${ddHtml}</div>
    <div class="pf-bar-right">
      <span class="pf-count" title="publicações após filtros">${filtered.length}/${dedupResults.length}</span>
      ${anyActive?`<button class="pf-clear-filters" onclick="clearPostFilters()" title="Limpar todos os filtros pós-pesquisa">✕</button>`:''}
      ${removedCount?`<button class="pf-restore" onclick="restoreRemoved()" title="Restaurar ${removedCount} removida(s)">↩${removedCount}</button>`:''}
      <button class="pf-fav-sel${selCount?' pf-sel-active':''}" onclick="favSelected()" title="Favoritar selecionadas (${selCount})">⭐${selCount?` ${selCount}`:''}</button>
      <button class="pf-fav-all" onclick="favAll()" title="Favoritar/desfavoritar todas as visíveis">⭐ Tudo</button>
      <button class="pf-remove-sel${selCount?' pf-sel-active':''}" onclick="removeSelected()" title="Remover selecionadas (${selCount})">🗑${selCount?` ${selCount}`:''}</button>
      <button class="pf-email" onclick="openEmailModal()" title="Enviar relatório por e-mail">✉</button>
    </div>
  </div>`;
}

// Filtro de busca dentro do dropdown
function filterPfDD(ddId,q){
  const items=document.querySelectorAll(`#${ddId}_items .pf-dd-item`);
  items.forEach(el=>{
    const val=(el.dataset.val||'').toLowerCase();
    el.style.display=val.includes(q.toLowerCase())?'':'none';
  });
}

// Toggle dropdown — NÃO fecha ao clicar dentro
function togglePfDD(id){
  const panel=document.getElementById(id);
  if(!panel)return;
  const isOpen=panel.classList.contains('open');
  // Fecha outros dropdowns de filtro (não o próprio)
  document.querySelectorAll('.pf-dd.open').forEach(el=>{if(el.id!==id)el.classList.remove('open');});
  panel.classList.toggle('open',!isOpen);
}

// Fecha ao clicar fora — mas NÃO fecha ao clicar dentro do dropdown
document.addEventListener('click',e=>{
  if(!e.target.closest('.pf-dd-wrap')){
    document.querySelectorAll('.pf-dd.open').forEach(el=>el.classList.remove('open'));
  }
});

function pfToggle(key,val,on){
  if(!postFilters[key])postFilters[key]=[];
  if(on){if(!postFilters[key].includes(val))postFilters[key].push(val);}
  else{postFilters[key]=postFilters[key].filter(x=>x!==val);}
  // Atualiza apenas o label do botão e contagem, não re-renderiza tudo (mantém dropdown aberto)
  updatePfTagLabel(key);
  updatePfCount();
  renderResults(); renderReader();
}

// Atualiza o label do botão da tag sem re-renderizar o dropdown inteiro
function updatePfTagLabel(key){
  const wrap=document.querySelector(`.pf-dd-wrap[data-key="${key}"]`);
  if(!wrap)return;
  const btn=wrap.querySelector('.pf-tag');
  if(!btn)return;
  const sel=postFilters[key]||[];
  const FILTER_LABELS={tribunais:'Tribunal',areas:'Área',advogados:'Advogado',partes:'Parte',polos:'Polo',classes:'Classe',tiposDoc:'Tipo doc.',datas:'Data'};
  const label=FILTER_LABELS[key]||key;
  const lbl=sel.length===0?label:sel.length===1?sel[0].slice(0,16):`${label} (${sel.length})`;
  btn.innerHTML=`${esc(lbl)} <span class="pf-arr">▾</span>`;
  btn.classList.toggle('pf-tag-active',sel.length>0);
}

function updatePfCount(){
  const cnt=document.querySelector('.pf-count');
  if(cnt){
    const filtered=applyPostFilters(dedupResults);
    cnt.textContent=`${filtered.length}/${dedupResults.length}`;
  }
}

// Selecionar todos sem fechar o dropdown
function pfSelAllById(key,ddId,all){
  const items=document.querySelectorAll(`#${ddId}_items .pf-dd-item input[type=checkbox]`);
  postFilters[key]=all?[...(all?items:[])]:[]; // placeholder
  if(all){
    const vals=[];
    items.forEach(inp=>{
      const item=inp.closest('.pf-dd-item');
      if(item&&item.style.display!=='none'){
        const v=item.dataset.val||inp.value;
        vals.push(v);
        inp.checked=true;
      }
    });
    postFilters[key]=vals;
  } else {
    postFilters[key]=[];
    items.forEach(inp=>inp.checked=false);
  }
  updatePfTagLabel(key);
  updatePfCount();
  renderResults(); renderReader();
}
function clearPostFilters(){
  Object.keys(postFilters).forEach(k=>postFilters[k]=[]);
  renderPostFilterBar(); renderResults(); renderReader();
}

/* Remoção */
function removeItem(hash){
  removedHashes.add(hash);
  updatePfCount(); renderResults(); renderReader();
  const rc=document.getElementById('rc_'+hash.replace(/[^a-zA-Z0-9]/g,'_').slice(0,20));
  if(rc)rc.remove();
}
function restoreRemoved(){removedHashes.clear(); renderPostFilterBar(); renderResults(); renderReader();}

/* Multi-seleção */
function toggleSelect(hash,el){
  if(selectedForFav.has(hash)){selectedForFav.delete(hash);if(el)el.textContent='☐';}
  else{selectedForFav.add(hash);if(el)el.textContent='☑';}
  // Atualiza contadores na barra
  const fb=document.querySelector('.pf-fav-sel');
  if(fb){const c=selectedForFav.size;fb.textContent=`⭐${c?' '+c:''}`;fb.classList.toggle('pf-sel-active',c>0);}
  const rb=document.querySelector('.pf-remove-sel');
  if(rb){const c=selectedForFav.size;rb.textContent=`🗑${c?' '+c:''}`;rb.classList.toggle('pf-sel-active',c>0);}
}
function favSelected(){
  if(!selectedForFav.size){alert('Nenhuma publicação selecionada. Use ☐ nos cards.');return;}
  selectedForFav.forEach(hash=>{
    if(!state.favorites.includes(hash)){
      state.favorites.push(hash);
      const it=_itemMap.get(hash)||dedupResults.find(x=>getHash(x)===hash);
      if(it)state.favCache[hash]=it;
    }
  });
  selectedForFav.clear();
  saveState(); renderFavsList();
  const fb=document.getElementById('favBadge');if(fb)fb.textContent=state.favorites.length||'';
  renderResults();
}
// Favoritar/desfavoritar todas as visíveis
function favAll(){
  const visible=applyPostFilters(dedupResults);
  const allFaved=visible.every(it=>state.favorites.includes(getHash(it)));
  if(allFaved){
    // Desfavoritar todas
    visible.forEach(it=>{
      const hash=getHash(it);
      const idx=state.favorites.indexOf(hash);
      if(idx>=0){state.favorites.splice(idx,1);delete state.favCache[hash];}
    });
  } else {
    // Favoritar todas
    visible.forEach(it=>{
      const hash=getHash(it);
      _storeItem(it);
      if(!state.favorites.includes(hash)){state.favorites.push(hash);state.favCache[hash]=it;}
    });
  }
  saveState(); renderFavsList();
  const fb=document.getElementById('favBadge');if(fb)fb.textContent=state.favorites.length||'';
  renderResults();
}
function removeSelected(){
  if(!selectedForFav.size){alert('Nenhuma publicação selecionada. Use ☐ nos cards.');return;}
  selectedForFav.forEach(hash=>removedHashes.add(hash));
  selectedForFav.clear();
  renderPostFilterBar(); renderResults(); renderReader();
}



