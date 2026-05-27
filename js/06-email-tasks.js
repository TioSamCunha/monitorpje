
/* ════════════════════════════════════════════════════════════
   TASK SCHEDULER
   Tasks are stored in localStorage and executed when the app
   opens (on load/login). Email delivery uses EmailJS (free,
   client-side, no backend needed). Manual run always available.
   ════════════════════════════════════════════════════════════ */

// EmailJS config — agora persistido em state.emailCfg (configurável pela UI)
// https://www.emailjs.com → conta grátis → conecte Gmail → pegue os IDs
// A constante abaixo serve só como fallback/padrão de fábrica (deixe vazio).
const EMAILJS_PUBLIC_KEY  = ''; // legado — use state.emailCfg.publicKey
let _emailjsLoaded = false;

// Retorna a config efetiva (state tem prioridade sobre a constante legada)
function getEmailCfg(){
  const c=state.emailCfg||{};
  return {
    publicKey: c.publicKey || EMAILJS_PUBLIC_KEY || '',
    serviceId: c.serviceId || '',
    templateId: c.templateId || '',
  };
}
// True quando dá pra enviar de verdade sem abrir cliente de e-mail
function emailJSReady(){
  const c=getEmailCfg();
  return !!(c.publicKey && c.serviceId && c.templateId);
}

async function loadEmailJS(){
  if(_emailjsLoaded) return true;
  try{
    const s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
    await new Promise((res,rej)=>{s.onload=res;s.onerror=rej;document.head.appendChild(s);});
    const c=getEmailCfg();
    if(c.publicKey) window.emailjs.init({publicKey:c.publicKey});
    _emailjsLoaded=true;
    return true;
  }catch(e){
    console.warn('EmailJS not loaded:',e);
    return false;
  }
}

// ── Helpers ──────────────────────────────────────────────────
function genId(){ return Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7); }

function calcNextRun(schedule, lastRun){
  if(schedule.frequency==='manual') return null;
  const now=new Date();
  const base=lastRun?new Date(lastRun):new Date(now.getTime()-1);
  let next=new Date(base);
  if(schedule.frequency==='daily'){
    next.setDate(next.getDate()+1);
    next.setHours(7,0,0,0);
  } else if(schedule.frequency==='weekly'){
    const dow=schedule.dayOfWeek??1;
    next.setDate(next.getDate()+1);
    while(next.getDay()!==dow) next.setDate(next.getDate()+1);
    next.setHours(7,0,0,0);
  } else if(schedule.frequency==='monthly'){
    const dom=schedule.dayOfMonth??1;
    next=new Date(now.getFullYear(),now.getMonth()+1,dom,7,0,0,0);
    if(next<=now) next=new Date(now.getFullYear(),now.getMonth()+2,dom,7,0,0,0);
  }
  if(next<=now){
    // Already past → schedule for next occurrence
    if(schedule.frequency==='daily') next=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1,7,0,0,0);
  }
  return next.toISOString();
}

function isTaskDue(task){
  if(!task.enabled||!task.schedule?.frequency||task.schedule.frequency==='manual') return false;
  if(!task.nextRun) return true;
  return new Date(task.nextRun)<=new Date();
}

function formatNextRun(isoStr){
  if(!isoStr) return '—';
  const d=new Date(isoStr);
  const now=new Date();
  const diff=d-now;
  if(diff<0) return 'Vencida';
  const days=Math.floor(diff/86400000);
  const hrs=Math.floor((diff%86400000)/3600000);
  if(days>0) return `Em ${days}d ${hrs}h`;
  if(hrs>0) return `Em ${hrs}h`;
  return 'Em breve';
}

// ── State helpers ─────────────────────────────────────────────
function getScheduledTasks(){ return state.scheduledTasks||[]; }
function saveScheduledTasks(tasks){ state.scheduledTasks=tasks; saveState(); }

// ── On app load: check and run due tasks ──────────────────────
async function checkDueTasks(){
  const tasks=getScheduledTasks();
  const due=tasks.filter(isTaskDue);
  if(!due.length) return;
  for(const task of due){
    try{
      await executeTask(task, true);
    }catch(e){
      console.warn('Task failed:',task.name,e);
    }
  }
}

// ── Execute a task ────────────────────────────────────────────
async function executeTask(task, auto=false){
  const tasks=getScheduledTasks();
  const idx=tasks.findIndex(t=>t.id===task.id);
  if(idx<0) return;

  // Add log entry
  const logEntry=`${new Date().toLocaleString('pt-BR')} — ${auto?'automático':'manual'}`;
  tasks[idx].lastRunLog=logEntry;
  tasks[idx].status='running';
  saveScheduledTasks(tasks);
  renderTasksPanel();

  try{
    if(task.type==='report_email'){
      await runReportEmailTask(task);
    } else if(task.type==='search_save'){
      await runSearchSaveTask(task);
    } else if(task.type==='monitor_check'){
      await checkAllMonitored();
    }
    tasks[idx].lastRun=new Date().toISOString();
    tasks[idx].nextRun=calcNextRun(task.schedule,tasks[idx].lastRun);
    tasks[idx].runCount=(tasks[idx].runCount||0)+1;
    tasks[idx].status='ok';
    tasks[idx].lastRunLog=logEntry+' ✓';
  }catch(e){
    tasks[idx].status='error';
    tasks[idx].lastRunLog=logEntry+' ✗ '+e.message;
  }
  saveScheduledTasks(tasks);
  renderTasksPanel();
}

// ── Report Email task ─────────────────────────────────────────
async function runReportEmailTask(task){
  const p=task.params||{};
  // Build query and run search (reuses existing runSearch infrastructure)
  const queries=[];
  const taggedAdvs=getAdvsByTags(p.advTags||[]);
  taggedAdvs.forEach(a=>{const q={};if(a.nome)q.nomeAdvogado=a.nome;if(a.oab)q.numeroOab=a.oab;if(a.uf)q.ufOab=a.uf;queries.push({label:a.nome,q});});
  const nAdv=Math.max((p.advogados||[]).length,(p.oabs||[]).length,(p.ufOabs||[]).length);
  for(let i=0;i<nAdv;i++){const q={};if(p.advogados?.[i])q.nomeAdvogado=p.advogados[i];if(p.oabs?.[i])q.numeroOab=p.oabs[i];if(p.ufOabs?.[i])q.ufOab=p.ufOabs[i];if(Object.keys(q).length)queries.push({label:p.advogados?.[i]||'Adv',q});}
  (p.nomes||[]).forEach(n=>queries.push({label:'Parte: '+n,q:{nomeParte:n}}));
  (p.processos||[]).forEach(n=>queries.push({label:'Proc: '+n,q:{numeroProcesso:n}}));
  if(!queries.length)queries.push({label:'Geral',q:{}});

  const tribs=(p.instituicoes||[]).length?p.instituicoes:[null];
  const allQ=[];
  queries.forEach(q=>tribs.forEach(t=>{const qc={...q,q:{...q.q}};if(t)qc.q.siglaTribunal=t;allQ.push(qc);}));

  // Calculate date range for the period
  const periodDays={'daily':1,'weekly':7,'monthly':30}[task.schedule?.frequency||'weekly']||7;
  const now=new Date();
  const from=new Date(now);from.setDate(from.getDate()-periodDays);
  const fromISO=from.toISOString().slice(0,10);
  const toISO=now.toISOString().slice(0,10);

  const collected=[];
  for(const q of allQ.slice(0,20)){ // cap at 20 queries per scheduled run
    const qp={...q.q,pagina:1,itensPorPagina:50,dataDisponibilizacaoInicio:fromISO,dataDisponibilizacaoFim:toISO};
    if(p.tipoComunicacao)qp.tipoComunicacao=p.tipoComunicacao;
    if(p.meios?.length===1)qp.meio=p.meios[0];
    try{
      const r=await fetchWithRateLimit(`${API}?${new URLSearchParams(qp)}`);
      if(!r.ok) continue;
      const data=await r.json();
      const items=Array.isArray(data)?data:(data.items||data.comunicacoes||data.data||[]);
      items.forEach(it=>{normalizeItem(it);it._source=q.label;});
      collected.push(...items);
    }catch(_){}
  }
  const unique=dedup(collected);

  if(!unique.length&&task.email?.skipIfEmpty){
    return; // nothing to send
  }

  // Build email body
  const dateFrom=`${from.getDate().toString().padStart(2,'0')}.${(from.getMonth()+1).toString().padStart(2,'0')}.${from.getFullYear()}`;
  const dateTo=`${now.getDate().toString().padStart(2,'0')}.${(now.getMonth()+1).toString().padStart(2,'0')}.${now.getFullYear()}`;
  let body=`RELATÓRIO AUTOMÁTICO DE PUBLICAÇÕES PJe\n`;
  body+=`Tarefa: ${task.name}\nPeríodo: ${dateFrom} a ${dateTo}\nTotal: ${unique.length} publicação(ões)\n\n`;

  unique.forEach((it,i)=>{
    const num=it.numero_processo||it.numeroProcesso||'—';
    const data=dateToDisplay(it.data_disponibilizacao||'');
    const org=it.nomeOrgao||it.siglaTribunal||'';
    body+=`${i+1}. ${num}\n   ${data} | ${org} | ${it.tipoComunicacao||'—'}\n`;
    const partes=(it.destinatarios||[]).map(p=>p.nome||p.nomeParte||'').filter(Boolean).join(', ');
    if(partes) body+=`   Partes: ${partes}\n`;
    if(it.texto) body+=`   Teor: ${it.texto.slice(0,200)}${it.texto.length>200?'…':''}\n`;
    if(it._certidaoUrl) body+=`   Certidão: ${it._certidaoUrl}\n`;
    body+='\n';
  });

  await sendTaskEmail(task, `[PJe] ${task.name} — ${unique.length} publicações (${dateFrom} a ${dateTo})`, body, unique.length);
}

async function sendTaskEmail(task, subject, body, count){
  const emailConf=task.email||{};
  if(!emailConf.to) throw new Error('E-mail do destinatário não configurado');

  const cfg=getEmailCfg();
  // Permite que a tarefa sobrescreva service/template, senão usa o global
  const serviceId=emailConf.serviceId||cfg.serviceId;
  const templateId=emailConf.templateId||cfg.templateId;
  const userEmail=(currentUser&&currentUser.email)||(currentProfile&&currentProfile.email)||'';
  const userName=(currentUser&&(currentUser.displayName||currentUser.email))||'Monitor PJe';

  if(serviceId&&templateId&&cfg.publicKey){
    // Send via EmailJS (real email, sem abrir app)
    await loadEmailJS();
    await window.emailjs.send(serviceId, templateId, {
      to_email: emailConf.to,
      subject,
      body,
      from_name: userName,
      reply_to: userEmail||'',
      user_email: userEmail||'',
      task_name: task.name,
      count: String(count),
      generated_at: new Date().toLocaleString('pt-BR'),
    });
  } else {
    // Fallback: open mailto (always works, no config needed)
    const mailto=`mailto:${encodeURIComponent(emailConf.to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.slice(0,2000))}`;
    window.open(mailto,'_blank');
  }
}

async function runSearchSaveTask(task){
  // Just run the search and save results to state for review
  // (doesn't change current UI params)
  const saved=state.savedSearchResults||{};
  saved[task.id]={taskName:task.name,runAt:new Date().toISOString(),count:0};
  state.savedSearchResults=saved;
  saveState();
}

// ── RENDER TASKS PANEL ────────────────────────────────────────
function renderTasksPanel(){
  const el=document.getElementById('tasksContent');
  if(!el) return;
  const tasks=getScheduledTasks();
  const due=tasks.filter(t=>t.enabled&&isTaskDue(t));

  el.innerHTML=`
    <div class="sched-bar">
      <div class="sched-bar-left">
        ${tasks.length} tarefa(s)${due.length?` · <span style="color:var(--amber)">${due.length} vencida(s)</span>`:''}
      </div>
      <button class="new-task-btn" onclick="openNewTaskModal()">＋ Nova tarefa</button>
    </div>
    ${!emailJSReady()?`<div class="emailjs-banner">
      📧 <strong>Envio automático de e-mail:</strong> conecte o
      <a href="https://www.emailjs.com" target="_blank">EmailJS</a> (gratuito, 200 emails/mês)
      para enviar relatórios sem abrir o cliente de e-mail.
      <span style="color:var(--accent);cursor:pointer;text-decoration:underline" onclick="openEmailCfgModal()">Configurar agora</span>.
      Sem configurar, o botão "Executar" abre o cliente de e-mail padrão (mailto:).
    </div>`:`<div class="emailjs-banner" style="border-color:rgba(52,211,153,.25);background:rgba(52,211,153,.06)">
      ✅ <strong style="color:var(--green)">Envio automático ativo.</strong> Relatórios são enviados sem abrir outro app.
      <span style="color:var(--accent);cursor:pointer;text-decoration:underline" onclick="openEmailCfgModal()">Editar configuração</span>.
    </div>`}
    ${tasks.length===0
      ?`<div class="empty" style="padding:40px 16px">
          <div class="ei">📅</div>
          <div class="et">Nenhuma tarefa agendada</div>
          <div class="es">Crie tarefas para enviar relatórios periódicos por e-mail</div>
        </div>`
      :tasks.map(task=>buildTaskCard(task)).join('')}`;
}

function buildTaskCard(task){
  const typeIcons={'report_email':'📧','search_save':'💾','monitor_check':'🔔'};
  const typeLabels={'report_email':'Relatório por e-mail','search_save':'Salvar busca','monitor_check':'Verificar monitorados'};
  const freqLabels={'daily':'Diário','weekly':'Semanal','monthly':'Mensal','manual':'Manual'};
  const icon=typeIcons[task.type]||'📋';
  const nextStr=task.schedule?.frequency==='manual'?'Manual':formatNextRun(task.nextRun);
  const due=isTaskDue(task);
  const statusDot=task.status==='ok'?'🟢':task.status==='error'?'🔴':task.status==='running'?'🟡':'⚪';

  return`<div class="task-card${task.enabled?'':' disabled'}" id="tcard_${task.id}">
    <div class="task-head" onclick="toggleTaskBody('${task.id}')">
      <div class="task-icon type-${task.type==='report_email'?'report':task.type==='search_save'?'search':'monitor'}">${icon}</div>
      <div class="task-info">
        <div class="task-name">${esc(task.name)}</div>
        <div class="task-meta">
          <span>${freqLabels[task.schedule?.frequency||'manual']||'—'}</span>
          ${task.email?.to?`<span>→ ${esc(task.email.to)}</span>`:''}
          <span class="task-next${due?' task-status-err':''}">${statusDot} ${esc(nextStr)}</span>
          ${task.runCount?`<span>${task.runCount}x executada(s)</span>`:''}
        </div>
      </div>
      <div class="task-actions" onclick="event.stopPropagation()">
        <button class="ib" style="padding:3px 9px;font-size:11px" onclick="executeTask(getScheduledTasks().find(t=>t.id==='${task.id}'))" title="Executar agora">▶</button>
        <button class="task-toggle ${task.enabled?'on':'off'}" onclick="toggleTask('${task.id}')" title="${task.enabled?'Desativar':'Ativar'}"></button>
      </div>
    </div>
    <div class="task-body" id="tbody_${task.id}">
      ${buildTaskEditor(task)}
      ${task.lastRunLog?`<div class="task-log">${esc(task.lastRunLog)}</div>`:''}
      <div style="display:flex;gap:8px;margin-top:10px">
        <button class="task-run-btn" onclick="executeTask(getScheduledTasks().find(t=>t.id==='${task.id}'))">▶ Executar agora</button>
        <button class="task-del-btn" onclick="deleteTask('${task.id}')">🗑 Excluir tarefa</button>
      </div>
    </div>
  </div>`;
}

function buildTaskEditor(task){
  const p=task.params||{};
  const e=task.email||{};
  const s=task.schedule||{frequency:'weekly',dayOfWeek:1};
  const freqs=['manual','daily','weekly','monthly'];
  const freqLabels={manual:'Manual',daily:'Diário',weekly:'Semanal',monthly:'Mensal'};
  const days=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

  return`<div class="task-section">
    <label>Nome da tarefa</label>
    <input value="${esc(task.name)}" oninput="updateTask('${task.id}','name',this.value)" placeholder="Ex: Relatório semanal tributário">
  </div>
  <div class="task-section">
    <label>Frequência</label>
    <div class="task-freq-row">
      ${freqs.map(f=>`<span class="freq-chip${s.frequency===f?' sel':''}" onclick="updateTaskSchedule('${task.id}','frequency','${f}')">${freqLabels[f]}</span>`).join('')}
    </div>
    ${s.frequency==='weekly'?`<div><label style="font-size:10px;color:var(--text3)">Dia da semana</label>
      <select style="font-size:11px;padding:4px 7px;border:1px solid var(--border2);border-radius:var(--r);background:var(--bg3);color:var(--text);outline:none" onchange="updateTaskSchedule('${task.id}','dayOfWeek',+this.value)">
        ${days.map((d,i)=>`<option value="${i}"${s.dayOfWeek===i?' selected':''}>${d}</option>`).join('')}
      </select></div>`:''}
    ${s.frequency==='monthly'?`<div><label style="font-size:10px;color:var(--text3)">Dia do mês</label>
      <input type="number" min="1" max="28" value="${s.dayOfMonth||1}" style="width:70px;font-size:11px;padding:4px 7px;border:1px solid var(--border2);border-radius:var(--r);background:var(--bg3);color:var(--text);outline:none" onchange="updateTaskSchedule('${task.id}','dayOfMonth',+this.value)"></div>`:''}
  </div>
  ${task.type==='report_email'?`
  <div class="task-section">
    <label>Período do relatório</label>
    <select style="font-size:11px;padding:4px 7px;border:1px solid var(--border2);border-radius:var(--r);background:var(--bg3);color:var(--text);outline:none;width:100%" onchange="updateTask('${task.id}','reportPeriod',this.value)">
      <option value="auto"${(task.reportPeriod||'auto')==='auto'?' selected':''}>Automático (igual à frequência)</option>
      <option value="1"${task.reportPeriod==='1'?' selected':''}>Últimas 24 horas</option>
      <option value="7"${task.reportPeriod==='7'?' selected':''}>Últimos 7 dias</option>
      <option value="15"${task.reportPeriod==='15'?' selected':''}>Últimos 15 dias</option>
      <option value="30"${task.reportPeriod==='30'?' selected':''}>Últimos 30 dias</option>
    </select>
  </div>
  <div class="task-section">
    <label>E-mail do destinatário</label>
    <input type="email" value="${esc(e.to||'')}" placeholder="destinatario@exemplo.com" oninput="updateTaskEmail('${task.id}','to',this.value)">
  </div>
  <div class="task-section">
    <label>Assunto do e-mail</label>
    <input value="${esc(e.subject||'[PJe] Relatório de Publicações')}" oninput="updateTaskEmail('${task.id}','subject',this.value)">
  </div>
  <div class="task-section">
    <label>EmailJS — Service ID <span style="font-size:9px;color:var(--text3)">(opcional, para envio automático)</span></label>
    <input value="${esc(e.serviceId||'')}" placeholder="service_xxxxxxx" oninput="updateTaskEmail('${task.id}','serviceId',this.value)">
  </div>
  <div class="task-section">
    <label>EmailJS — Template ID</label>
    <input value="${esc(e.templateId||'')}" placeholder="template_xxxxxxx" oninput="updateTaskEmail('${task.id}','templateId',this.value)">
  </div>
  <div class="task-section">
    <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
      <input type="checkbox" ${task.email?.skipIfEmpty?'checked':''} onchange="updateTaskEmail('${task.id}','skipIfEmpty',this.checked)" style="accent-color:var(--accent)">
      Não enviar se não houver publicações
    </label>
  </div>`:''}
  <div class="task-section">
    <label>Parâmetros de busca</label>
    <div style="font-size:11px;color:var(--text3);line-height:1.5;padding:7px 9px;border:1px solid var(--border);border-radius:var(--r);background:var(--bg2)">
      ${summarizeTaskParams(p)}
      <button class="ib" style="margin-top:6px;padding:3px 8px;font-size:10px" onclick="applyCurrentParamsToTask('${task.id}')">📋 Usar parâmetros atuais</button>
    </div>
  </div>`;
}

function summarizeTaskParams(p){
  const parts=[];
  if(p.advTags?.length) parts.push(`Tags: ${p.advTags.join(', ')}`);
  if(p.advogados?.length) parts.push(`${p.advogados.length} adv.`);
  if(p.nomes?.length) parts.push(`${p.nomes.length} parte(s)`);
  if(p.processos?.length) parts.push(`${p.processos.length} proc.`);
  if(p.instituicoes?.length) parts.push(`${p.instituicoes.length} tribunal(is)`);
  if(p.teor) parts.push(`teor: "${p.teor.slice(0,20)}…"`);
  return parts.length?parts.join(' · '):'<span style="color:var(--text3)">Nenhum parâmetro definido — use "Usar parâmetros atuais"</span>';
}

function toggleTaskBody(id){
  const el=document.getElementById('tbody_'+id);
  if(el) el.classList.toggle('open');
}
function toggleTask(id){
  const tasks=getScheduledTasks();
  const t=tasks.find(x=>x.id===id);
  if(t){t.enabled=!t.enabled;if(t.enabled&&!t.nextRun)t.nextRun=calcNextRun(t.schedule,t.lastRun);}
  saveScheduledTasks(tasks); renderTasksPanel();
}
function deleteTask(id){
  if(!confirm('Excluir esta tarefa?')) return;
  saveScheduledTasks(getScheduledTasks().filter(t=>t.id!==id));
  renderTasksPanel();
}
function updateTask(id,field,val){
  const tasks=getScheduledTasks();
  const t=tasks.find(x=>x.id===id);
  if(t){t[field]=val;saveScheduledTasks(tasks);}
}
function updateTaskEmail(id,field,val){
  const tasks=getScheduledTasks();
  const t=tasks.find(x=>x.id===id);
  if(t){if(!t.email)t.email={};t.email[field]=val;saveScheduledTasks(tasks);}
}
function updateTaskSchedule(id,field,val){
  const tasks=getScheduledTasks();
  const t=tasks.find(x=>x.id===id);
  if(t){if(!t.schedule)t.schedule={};t.schedule[field]=val;t.nextRun=calcNextRun(t.schedule,t.lastRun);saveScheduledTasks(tasks);renderTasksPanel();}
}
function applyCurrentParamsToTask(id){
  const tasks=getScheduledTasks();
  const t=tasks.find(x=>x.id===id);
  if(t){t.params=JSON.parse(JSON.stringify(params));saveScheduledTasks(tasks);renderTasksPanel();}
}

// ── New task modal ────────────────────────────────────────────
function openNewTaskModal(){
  showModal(`<h3>📅 Nova tarefa agendada</h3>
    <p style="font-size:11px;color:var(--text3);margin-bottom:12px;line-height:1.5">
      Escolha o tipo de tarefa. Os parâmetros de busca podem ser configurados após criar.
    </p>
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
      <div style="padding:12px 14px;border:1px solid var(--border2);border-radius:var(--r2);cursor:pointer;transition:all .12s"
           onclick="createTask('report_email');closeModal()"
           onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border2)'">
        <div style="font-size:13px;font-weight:600;margin-bottom:3px">📧 Relatório por e-mail</div>
        <div style="font-size:11px;color:var(--text3)">Executa uma busca e envia os resultados por e-mail no período configurado</div>
      </div>
      <div style="padding:12px 14px;border:1px solid var(--border2);border-radius:var(--r2);cursor:pointer;transition:all .12s"
           onclick="createTask('monitor_check');closeModal()"
           onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border2)'">
        <div style="font-size:13px;font-weight:600;margin-bottom:3px">🔔 Verificar monitorados</div>
        <div style="font-size:11px;color:var(--text3)">Verifica automaticamente todos os processos monitorados e notifica novidades</div>
      </div>
    </div>
    <div class="macts"><button class="btn" onclick="closeModal()">Cancelar</button></div>`);
}

function createTask(type){
  const names={'report_email':'Relatório por e-mail','monitor_check':'Verificar monitorados'};
  const task={
    id:genId(),
    name:names[type]||'Nova tarefa',
    type,
    enabled:true,
    schedule:{frequency:'weekly',dayOfWeek:1},
    params:JSON.parse(JSON.stringify(params)), // snapshot dos params atuais
    email:{to:currentUser?.email||'',subject:'[PJe] Relatório de Publicações',serviceId:'',templateId:'',skipIfEmpty:true},
    lastRun:null,
    nextRun:null,
    runCount:0,
    status:'',
    lastRunLog:'',
  };
  task.nextRun=calcNextRun(task.schedule,null);
  const tasks=getScheduledTasks();
  tasks.push(task);
  saveScheduledTasks(tasks);
  renderTasksPanel();
  // Auto-expand the new task
  setTimeout(()=>{ const el=document.getElementById('tbody_'+task.id); if(el)el.classList.add('open'); }, 100);
}



/* ═══════════════════ E-MAIL — BOTÃO ✉ (envio manual do relatório) ═══════════════════
   Movido de results.js para centralizar tudo de e-mail neste módulo.
   Funções: openEmailModal, buildReportBody, doSendEmail, openEmailCfgModal, saveEmailCfg
   ════════════════════════════════════════════════════════════════════════════════════ */
/* E-mail */
function openEmailModal(){
  const list=getFilteredForExport();
  if(!list.length){alert('Nenhuma publicação para enviar.');return;}
  const ready=emailJSReady();
  const userEmail=(currentUser&&currentUser.email)||(currentProfile&&currentProfile.email)||'';
  const statusBox = ready
    ? `<div style="font-size:10px;color:var(--green);padding:7px 9px;border:1px solid rgba(52,211,153,.25);border-radius:var(--r);background:rgba(52,211,153,.06);margin-bottom:10px">
         ✅ Envio direto ativado. O e-mail será enviado sem abrir nenhum app.
         ${userEmail?`<br>Respostas voltarão para <strong style="color:var(--text)">${esc(userEmail)}</strong>.`:''}</div>`
    : `<div style="font-size:10px;color:var(--text3);padding:7px 9px;border:1px solid var(--border2);border-radius:var(--r);background:rgba(79,142,247,.05);margin-bottom:10px">
         ℹ️ Envio direto não configurado — vai abrir seu cliente de e-mail (mailto:).
         <span style="color:var(--accent);cursor:pointer;text-decoration:underline" onclick="openEmailCfgModal()">Configurar envio automático</span></div>`;
  showModal(`<h3>✉ Enviar relatório por e-mail</h3>
    <p style="font-size:11px;color:var(--text3);margin-bottom:11px">${list.length} publicação(ões) serão incluídas.</p>
    <div class="mf"><label>Destinatário</label><input id="emailTo" placeholder="email@exemplo.com" type="email"></div>
    <div class="mf"><label>Assunto</label><input id="emailSubj" value="Relatório PJe — ${new Date().toLocaleDateString('pt-BR')}"></div>
    <div class="mf"><label>Mensagem adicional</label>
      <textarea id="emailMsg" style="width:100%;font-size:12px;padding:6px 9px;border:1px solid var(--border2);border-radius:var(--r);background:var(--bg3);color:var(--text);resize:vertical;min-height:60px;font-family:var(--sans);outline:none" placeholder="(opcional)"></textarea></div>
    ${statusBox}
    <div class="macts"><button class="btn" onclick="closeModal()">Cancelar</button><button class="btn p" id="emailSendBtn" onclick="doSendEmail()">${ready?'Enviar agora':'Gerar e-mail'}</button></div>`);
}

// Monta o corpo do relatório em texto puro (reutilizado por mailto e EmailJS)
function buildReportBody(list,msg){
  let body=msg?(msg+'\n\n---\n\n'):'';
  body+=`RELATÓRIO DE PUBLICAÇÕES PJe\nGerado em: ${new Date().toLocaleString('pt-BR')}\nTotal: ${list.length} publicação(ões)\n\n`;
  list.forEach((it,i)=>{
    const num=it.numero_processo||it.numeroProcesso||'—';
    const data=dateToDisplay(it.data_disponibilizacao||'');
    const org=it.nomeOrgao||it.siglaTribunal||'';
    body+=`${i+1}. ${num}\n   Data: ${data} | ${org} | ${it.tipoComunicacao||'—'}`;
    if(it._area)body+=` | Área: ${it._area}`;
    body+='\n';
    const partes=(it.destinatarios||it.partes||[]).map(p=>p.nome||p.nomeParte||'').filter(Boolean).join(', ');
    if(partes)body+=`   Partes: ${partes}\n`;
    if(it.texto)body+=`   Teor: ${it.texto.slice(0,300)}${it.texto.length>300?'…':''}\n`;
    if(it._certidaoUrl)body+=`   Certidão: ${it._certidaoUrl}\n`;
    body+='\n';
  });
  return body;
}

async function doSendEmail(){
  const to=document.getElementById('emailTo').value.trim();
  const subj=document.getElementById('emailSubj').value.trim();
  const msg=document.getElementById('emailMsg').value.trim();
  if(!to){alert('Informe o e-mail do destinatário');return;}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)){alert('E-mail do destinatário inválido');return;}
  const list=getFilteredForExport();
  const body=buildReportBody(list,msg);
  const userEmail=(currentUser&&currentUser.email)||(currentProfile&&currentProfile.email)||'';
  const userName=(currentUser&&(currentUser.displayName||currentUser.email))||'';

  if(emailJSReady()){
    // Envio real, sem abrir nenhum app
    const btn=document.getElementById('emailSendBtn');
    if(btn){btn.disabled=true;btn.textContent='Enviando…';}
    try{
      const cfg=getEmailCfg();
      await loadEmailJS();
      await window.emailjs.send(cfg.serviceId, cfg.templateId, {
        to_email: to,
        subject: subj,
        body,
        // Identifica o usuário logado como autor do envio:
        from_name: userName||'Monitor PJe',
        reply_to: userEmail||'',
        user_email: userEmail||'',
        count: String(list.length),
        generated_at: new Date().toLocaleString('pt-BR'),
      });
      closeModal();
      alert('✅ Relatório enviado para '+to);
    }catch(e){
      console.error('Falha no envio EmailJS:',e);
      if(btn){btn.disabled=false;btn.textContent='Enviar agora';}
      const fall=confirm('Não consegui enviar pelo servidor (verifique a configuração do EmailJS).\n\nDeseja abrir o cliente de e-mail como alternativa?');
      if(fall){
        const mailto=`mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body.slice(0,2000))}`;
        window.location.href=mailto;
        closeModal();
      }
    }
    return;
  }

  // Fallback: abre o cliente de e-mail padrão (comportamento antigo)
  const mailto=`mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
  window.location.href=mailto;
  closeModal();
}

// ── Modal de configuração do EmailJS ──────────────────────────
function openEmailCfgModal(){
  const c=getEmailCfg();
  showModal(`<h3>⚙️ Configurar envio automático de e-mail</h3>
    <p style="font-size:11px;color:var(--text3);margin-bottom:11px;line-height:1.5">
      Com o <a href="https://www.emailjs.com" target="_blank" style="color:var(--accent)">EmailJS</a> (grátis, 200 e-mails/mês) o relatório é enviado direto pelo navegador, <strong style="color:var(--text)">sem abrir outro app</strong>.<br>
      Crie uma conta, conecte um Gmail (do escritório) e copie os 3 valores abaixo. O e-mail do usuário logado entra como "responder para".</p>
    <div class="mf"><label>Public Key</label>
      <input id="ejPub" value="${esc(c.publicKey)}" placeholder="ex: AbCd1234EfGh" autocomplete="off"></div>
    <div class="mf"><label>Service ID</label>
      <input id="ejSvc" value="${esc(c.serviceId)}" placeholder="ex: service_xxxxxxx" autocomplete="off"></div>
    <div class="mf"><label>Template ID</label>
      <input id="ejTpl" value="${esc(c.templateId)}" placeholder="ex: template_xxxxxxx" autocomplete="off"></div>
    <div style="font-size:10px;color:var(--text3);padding:7px 9px;border:1px solid var(--border2);border-radius:var(--r);background:rgba(79,142,247,.05);margin-bottom:10px;line-height:1.5">
      No template do EmailJS use as variáveis: <code>{{to_email}}</code>, <code>{{subject}}</code>, <code>{{body}}</code>, <code>{{from_name}}</code>, <code>{{reply_to}}</code>.</div>
    <div class="macts"><button class="btn" onclick="closeModal()">Cancelar</button><button class="btn p" onclick="saveEmailCfg()">Salvar</button></div>`);
}
function saveEmailCfg(){
  state.emailCfg={
    publicKey:document.getElementById('ejPub').value.trim(),
    serviceId:document.getElementById('ejSvc').value.trim(),
    templateId:document.getElementById('ejTpl').value.trim(),
  };
  _emailjsLoaded=false; // força re-init com a nova public key
  saveState();
  closeModal();
  alert(emailJSReady()?'✅ Envio automático configurado!':'Configuração salva. Preencha os 3 campos para ativar o envio direto.');
}
