# Monitor Processual PJe — estrutura de arquivos

O antigo `index.html` (3.364 linhas) foi dividido. Agora o HTML tem ~115 linhas
e o resto está separado por área. **A ordem dos `<script>` no index.html importa**
(todos compartilham o mesmo escopo global — não são módulos ES).

## Mapa — onde mexer em cada coisa

| Arquivo | O que tem dentro |
|---|---|
| `index.html` | Estrutura HTML, abas, modais. Linka o CSS e os 7 scripts. |
| `style.css` | Todo o visual (cores, layout, componentes). |
| `js/01-config-state.js` | Estado do app, `state`, `params`, salvamento no localStorage, lista de tribunais, config de e-mail (`state.emailCfg`). |
| `js/02-search.js` | Abas, dropdowns de filtros, parâmetros de busca, a busca em si, enriquecimento, progresso. |
| `js/03-results.js` | Renderização de resultados, leitor, cards de publicação, exportar (HTML/CSV), filtros pós-busca. |
| `js/04-tags-favorites.js` | Sistema de tags, favoritos, monitoramento de processos (push). |
| `js/05-auth.js` | Login Firebase, telas de autenticação, painel de usuários, permissões. |
| `js/06-email-tasks.js` | **E-MAIL e TAREFAS AGENDADAS.** Botão ✉, EmailJS, config de envio, relatórios periódicos. |
| `js/07-utils-adv.js` | Utilidades (`esc`, modais), tags salvas, CRUD de advogados, inicialização do app. |

## Dica para edições baratas
Ao pedir uma mudança, diga o arquivo: "no `06-email-tasks.js`, na função `doSendEmail`…".
Assim só preciso abrir aquele arquivo, não o app inteiro.
