const API = 'https://comunicaapi.pje.jus.br/api/v1/comunicacao';
const COLORS=['#4f8ef7','#34d399','#f87171','#fbbf24','#a78bfa','#fb923c','#38bdf8','#f472b6'];

/* ═══════════════════════════ STATE ═══════════════════════════ */
let state = JSON.parse(localStorage.getItem('pje_v7')||'null') || {
  advogados:[
    {id:101,nome:'CLEIA OLIVEIRA RAMOS',oab:'24410',uf:'MA',tags:['exemplo','ma']},
    {id:102,nome:'JOAO PAULO MENDES NETO',oab:'15583',uf:'PA',tags:['exemplo','para','tributario']}
  ],
  favorites:[],favCache:{},
  // Tags pré-selecionáveis: {id, nome, cor, campos:{advTags,advogados,oabs,ufOabs,nomes,processos,teor,...}}
  savedTags:[],
  // Tags globais reutilizáveis em todo o app
  appTags:[
    {id:'tributaria',nome:'Tributária',cor:'#fbbf24'},
    {id:'civel',nome:'Cível',cor:'#4f8ef7'},
    {id:'trabalhista',nome:'Trabalhista',cor:'#34d399'},
    {id:'criminal',nome:'Criminal',cor:'#f87171'},
    {id:'previdenciaria',nome:'Previdenciária',cor:'#a78bfa'},
    {id:'administrativa',nome:'Administrativa',cor:'#fb923c'},
    {id:'familia',nome:'Família',cor:'#38bdf8'},
  ],
  // Processos monitorados para push
  monitoredProcesses:[],
  // Tags por número de processo: {'1234567-89...': ['tributaria','cliente-x']}
  processTags:{},
  // Configuração de envio de e-mail via EmailJS (envio sem abrir cliente externo)
  // serviceId/templateId/publicKey vêm do painel https://www.emailjs.com
  emailCfg:{publicKey:'',serviceId:'',templateId:''}
};
const saveState=()=>localStorage.setItem('pje_v7',JSON.stringify(state));

// Normaliza state após carregar do localStorage — garante campos novos mesmo em dados antigos
function normalizeState(){
  if(!Array.isArray(state.appTags))state.appTags=[
    {id:'tributaria',nome:'Tributária',cor:'#fbbf24'},{id:'civel',nome:'Cível',cor:'#4f8ef7'},
    {id:'trabalhista',nome:'Trabalhista',cor:'#34d399'},{id:'criminal',nome:'Criminal',cor:'#f87171'},
    {id:'previdenciaria',nome:'Previdenciária',cor:'#a78bfa'},{id:'administrativa',nome:'Administrativa',cor:'#fb923c'},
    {id:'familia',nome:'Família',cor:'#38bdf8'},
  ];
  if(!Array.isArray(state.monitoredProcesses))state.monitoredProcesses=[];
  if(typeof state.processTags!=='object'||!state.processTags)state.processTags={};
  if(!Array.isArray(state.savedTags))state.savedTags=[];
  if(!Array.isArray(state.favorites))state.favorites=[];
  if(typeof state.favCache!=='object'||!state.favCache)state.favCache={};
  if(!Array.isArray(state.advogados))state.advogados=[];
  if(!Array.isArray(state.scheduledTasks))state.scheduledTasks=[];
  if(typeof state.emailCfg!=='object'||!state.emailCfg)state.emailCfg={publicKey:'',serviceId:'',templateId:''};
}
normalizeState();

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
// Map global para lookup de itens por hash (evita JSON inline nos handlers)
const _itemMap=new Map();
function _storeItem(it){const h=it.hash||it.id||'';if(h)_itemMap.set(h,it);return h;}
function _getItem(h){return _itemMap.get(h)||null;}


// Search params — always live, no "etiquetas"
let params = JSON.parse(localStorage.getItem('pje_v7_params')||'null') || {
  // mass-search fields (chips)
  advTags:[],          // tags de equipe
  advogados:[],        // nomes advogados (chips)
  oabs:[],             // números OAB (chips)
  ufOabs:[],           // UFs OAB (chips)
  nomes:[],            // partes (chips)
  processos:[],        // processos (chips)
  // single-value filters
  teor:'',             // teor texto livre
  _delay:400,          // ms entre requisições (rate limit)
  dataInicial:'',      // dd.mm.aaaa
  dataFinal:'',        // dd.mm.aaaa
  instituicoes:[],     // tribunais selecionados
  orgaos:[],           // órgãos selecionados
  meios:[],            // meios selecionados
  tipoComunicacao:''
};
const saveParams=()=>localStorage.setItem('pje_v7_params',JSON.stringify(params));

// Dynamic lists loaded from API
let tribunaisList=[{"sigla": "CJF", "nome": "Conselho da Justiça Federal"}, {"sigla": "CNJ", "nome": "Conselho Nacional de Justiça"}, {"sigla": "PJeCor", "nome": "Corregedorias"}, {"sigla": "SEEU", "nome": "Sistema Eletrônico de Execução Unificado"}, {"sigla": "STJ", "nome": "Superior Tribunal de Justiça"}, {"sigla": "STM", "nome": "Superior Tribunal Militar"}, {"sigla": "TJAC", "nome": "Tribunal de Justiça do Estado do Acre"}, {"sigla": "TJAL", "nome": "Tribunal de Justiça do Estado de Alagoas"}, {"sigla": "TJAM", "nome": "Tribunal de Justiça do Estado do Amazonas"}, {"sigla": "TJAP", "nome": "Tribunal de Justiça do Estado do Amapá"}, {"sigla": "TJBA", "nome": "Tribunal de Justiça do Estado da Bahia"}, {"sigla": "TJCE", "nome": "Tribunal de Justiça do Estado do Ceará"}, {"sigla": "TJDFT", "nome": "Tribunal de Justiça do Distrito Federal e dos Territórios"}, {"sigla": "TJES", "nome": "Tribunal de Justiça do Estado do Espírito Santo"}, {"sigla": "TJGO", "nome": "Tribunal de Justiça do Estado de Goiás"}, {"sigla": "TJMA", "nome": "Tribunal de Justiça do Estado do Maranhão"}, {"sigla": "TJMG", "nome": "Tribunal de Justiça do Estado de Minas Gerais"}, {"sigla": "TJMMG", "nome": "Tribunal de Justiça Militar do Estado de Minas Gerais"}, {"sigla": "TJMRS", "nome": "Tribunal de Justiça Militar do Estado do Rio Grande do Sul"}, {"sigla": "TJMS", "nome": "Tribunal de Justiça do Estado de Mato Grosso do Sul"}, {"sigla": "TJMSP", "nome": "Tribunal de Justiça Militar do Estado de São Paulo"}, {"sigla": "TJMT", "nome": "Tribunal de Justiça do Estado de Mato Grosso"}, {"sigla": "TJPA", "nome": "Tribunal de Justiça do Estado do Pará"}, {"sigla": "TJPB", "nome": "Tribunal de Justiça do Estado da Paraíba"}, {"sigla": "TJPE", "nome": "Tribunal de Justiça do Estado de Pernambuco"}, {"sigla": "TJPI", "nome": "Tribunal de Justiça do Estado do Piauí"}, {"sigla": "TJPR", "nome": "Tribunal de Justiça do Estado do Paraná"}, {"sigla": "TJRJ", "nome": "Tribunal de Justiça do Estado do Rio de Janeiro"}, {"sigla": "TJRN", "nome": "Tribunal de Justiça do Estado do Rio Grande do Norte"}, {"sigla": "TJRO", "nome": "Tribunal de Justiça do Estado de Rondônia"}, {"sigla": "TJRR", "nome": "Tribunal de Justiça do Estado de Roraima"}, {"sigla": "TJRS", "nome": "Tribunal de Justiça do Estado do Rio Grande do Sul"}, {"sigla": "TJSC", "nome": "Tribunal de Justiça do Estado de Santa Catarina"}, {"sigla": "TJSE", "nome": "Tribunal de Justiça do Estado de Sergipe"}, {"sigla": "TJSP", "nome": "Tribunal de Justiça do Estado de São Paulo"}, {"sigla": "TJTO", "nome": "Tribunal de Justiça do Estado de Tocantins"}, {"sigla": "TRE-AC", "nome": "Tribunal Regional Eleitoral do Acre"}, {"sigla": "TRE-AL", "nome": "Tribunal Regional Eleitoral de Alagoas"}, {"sigla": "TRE-AM", "nome": "Tribunal Regional Eleitoral do Amazonas"}, {"sigla": "TRE-AP", "nome": "Tribunal Regional Eleitoral do Amapá"}, {"sigla": "TRE-BA", "nome": "Tribunal Regional Eleitoral da Bahia"}, {"sigla": "TRE-ES", "nome": "Tribunal Regional Eleitoral do Espírito Santo"}, {"sigla": "TRE-GO", "nome": "Tribunal Regional Eleitoral de Goiás"}, {"sigla": "TRE-MA", "nome": "Tribunal Regional Eleitoral do Maranhão"}, {"sigla": "TRE-MS", "nome": "Tribunal Regional Eleitoral do Mato Grosso do Sul"}, {"sigla": "TRE-MT", "nome": "Tribunal Regional Eleitoral do do Mato Grosso"}, {"sigla": "TRE-PA", "nome": "Tribunal Regional Eleitoral do do Pará"}, {"sigla": "TRE-PE", "nome": "Tribunal Regional Eleitoral de Pernambuco"}, {"sigla": "TRE-PI", "nome": "Tribunal Regional Eleitoral do Piauí"}, {"sigla": "TRE-PR", "nome": "Tribunal Regional Eleitoral do Paraná"}, {"sigla": "TRE-RJ", "nome": "Tribunal Regional Eleitoral do Rio de Janeiro"}, {"sigla": "TRE-RN", "nome": "Tribunal Regional Eleitoral do Rio Grande do Norte"}, {"sigla": "TRE-RO", "nome": "Tribunal Regional Eleitoral de Rondônia"}, {"sigla": "TRE-RS", "nome": "Tribunal Regional Eleitoral do Rio Grande do Sul"}, {"sigla": "TRE-SC", "nome": "Tribunal Regional Eleitoral de Santa Catarina"}, {"sigla": "TRE-SP", "nome": "Tribunal Regional Eleitoral de São Paulo"}, {"sigla": "TRE-TO", "nome": "Tribunal Regional Eleitoral de Tocantins"}, {"sigla": "TRF1", "nome": "Tribunal Regional Federal da 1ª Região"}, {"sigla": "TRF2", "nome": "Tribunal Regional Federal da 2ª Região"}, {"sigla": "TRF3", "nome": "Tribunal Regional Federal da 3ª Região"}, {"sigla": "TRF4", "nome": "Tribunal Regional Federal da 4ª Região"}, {"sigla": "TRF5", "nome": "Tribunal Regional Federal da 5ª Região"}, {"sigla": "TRF6", "nome": "Tribunal Regional Federal da 6ª Região"}, {"sigla": "TRT1", "nome": "Tribunal Regional do Trabalho da 1ª Região"}, {"sigla": "TRT10", "nome": "Tribunal Regional do Trabalho da 10ª Região"}, {"sigla": "TRT11", "nome": "Tribunal Regional do Trabalho da 11ª Região"}, {"sigla": "TRT12", "nome": "Tribunal Regional do Trabalho da 12ª Região"}, {"sigla": "TRT13", "nome": "Tribunal Regional do Trabalho da 13ª Região"}, {"sigla": "TRT14", "nome": "Tribunal Regional do Trabalho da 14ª Região"}, {"sigla": "TRT15", "nome": "Tribunal Regional do Trabalho da 15ª Região"}, {"sigla": "TRT16", "nome": "Tribunal Regional do Trabalho da 16ª Região"}, {"sigla": "TRT17", "nome": "Tribunal Regional do Trabalho da 17ª Região"}, {"sigla": "TRT18", "nome": "Tribunal Regional do Trabalho da 18ª Região"}, {"sigla": "TRT19", "nome": "Tribunal Regional do Trabalho da 19ª Região"}, {"sigla": "TRT2", "nome": "Tribunal Regional do Trabalho da 2ª Região"}, {"sigla": "TRT20", "nome": "Tribunal Regional do Trabalho da 20ª Região"}, {"sigla": "TRT21", "nome": "Tribunal Regional do Trabalho da 21ª Região"}, {"sigla": "TRT22", "nome": "Tribunal Regional do Trabalho da 22ª Região"}, {"sigla": "TRT23", "nome": "Tribunal Regional do Trabalho da 23ª Região"}, {"sigla": "TRT24", "nome": "Tribunal Regional do Trabalho da 24ª Região"}, {"sigla": "TRT3", "nome": "Tribunal Regional do Trabalho da 3ª Região"}, {"sigla": "TRT4", "nome": "Tribunal Regional do Trabalho da 4ª Região"}, {"sigla": "TRT5", "nome": "Tribunal Regional do Trabalho da 5ª Região"}, {"sigla": "TRT6", "nome": "Tribunal Regional do Trabalho da 6ª Região"}, {"sigla": "TRT7", "nome": "Tribunal Regional do Trabalho da 7ª Região"}, {"sigla": "TRT8", "nome": "Tribunal Regional do Trabalho da 8ª Região"}, {"sigla": "TRT9", "nome": "Tribunal Regional do Trabalho da 9ª Região"}, {"sigla": "TSE", "nome": "Tribunal Superior Eleitoral"}, {"sigla": "TST", "nome": "Tribunal Superior do Trabalho"}], orgaosList=[], meiosList=[
  {sigla:'Diário de Justiça Eletrônico',nome:'Diário de Justiça Eletrônico'},
  {sigla:'Plataforma de Editais',nome:'Plataforma de Editais'},
  {sigla:'Portal',nome:'Portal do PJe'}
];

let allResults=[], dedupResults=[];
let progItems=[], sortField='data_desc', filterText='';
let ltab='params';
let _selColor=COLORS[0], _editId=null;
let _openDDs=new Set();

