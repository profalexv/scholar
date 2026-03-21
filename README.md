# Scholar — SPA Pedagógica

SPA dedicada para gestão pedagógica e de alunos, hospedada no GitHub Pages em **[scholar.axom.app](https://scholar.axom.app)**.

## Funcionalidades

- **Chamada** — registro de frequência diária por aula e turma
- **Diário** — conteúdo ministrado e registro de diário de classe
- **Ocorrências** — registro de ocorrências disciplinares e pedagógicas
- **Alunos** — cadastro de alunos com dados de contato e responsáveis
- **Matrículas** — matrícula de alunos em turmas por ano letivo
- **Transferências** — transferência de alunos entre turmas
- **Períodos** — configuração de períodos e anos letivos
- **Avaliações** — criação e gestão de avaliações por turma/disciplina
- **Notas** — lançamento e consulta de notas
- **Boletins** — geração de boletins escolares
- **Assinatura** — gestão da assinatura do addon ESCOLAR

## Arquitetura

```
scholar/
├── index.html              (shell ~95 linhas)
├── styles/
│   ├── variables.css       (paleta roxa: --primary:#7c3aed)
│   ├── components.css
│   └── layout.css
└── src/
    ├── state.js            (S: token, schoolId, apiBase, schoolName)
    ├── api.js              (fetch com x-aula-token automático)
    ├── utils.js
    ├── modal.js
    ├── auth.js
    ├── app.js              (roteador goTo, startApp, doLogin)
    └── modules/
        ├── chamada.js
        ├── diario.js
        ├── ocorrencias.js
        ├── alunos.js
        ├── matriculas.js
        ├── transferencias.js
        ├── periodos.js
        ├── avaliacoes.js
        ├── notas.js
        ├── boletins.js
        └── assinatura.js
```

ES modules nativos — sem build, funciona diretamente no GitHub Pages.

## Acesso via SSO

O `app/` (aula.axom.app) abre `scholar.axom.app` passando token por query string:

```
https://scholar.axom.app/?token=T&schoolId=S&api=BASE_URL
```

A SPA salva essas credenciais em `localStorage` e inclui `x-aula-token` em todas as requisições.

## API Backend

Routes `/api/escolar/*` no motor (Fly.io). Ver `motor/src/routes/` para detalhes.

## Addon ESCOLAR — Planos

| Plano   | Turmas inclusas | Preço/mês   | Excedente/turma |
|---------|----------------|-------------|------------------|
| `lite`  | até 10          | R$ 560,00   | R$ 43,00         |
| `basic` | até 30          | R$ 980,00   | R$ 34,00         |
| `flex`  | até 60          | R$ 1.790,00 | R$ 28,00         |
| `total` | ilimitado       | R$ 2.600,00 | R$ 23,00 (redes) |
