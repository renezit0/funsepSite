# FUNSEP Admin Desktop (Electron)

Aplicativo desktop do painel administrativo (`/admin`) com auto-atualização via GitHub Releases.

## Scripts

- `npm run icons:generate`: gera ícones PWA + Electron a partir de `public/images/logo-funsep-completa.svg`.
- `npm run electron:dev`: abre o admin em modo desktop apontando para `http://localhost:8080/admin`.
- `npm run dist:win`: build Windows (NSIS) sem publicar.
- `npm run release:win`: build Windows + publicação no GitHub Releases.

## Auto-update (GitHub)

O updater usa `electron-updater` com provider GitHub.

Config padrão:
- owner: `renezit0`
- repo: `funsepSite`

Opcionalmente, pode sobrescrever em runtime:
- `ELECTRON_UPDATER_OWNER`
- `ELECTRON_UPDATER_REPO`

## URL carregada pelo desktop

- Dev: `ELECTRON_START_URL` (ou padrão `http://localhost:8080/admin`)
- Produção: `FUNSEP_ADMIN_URL` (ou padrão `https://funsep.com.br/admin`)

## Instalação no Windows

Gerar instalador:
```bash
npm run dist:win
```

Pacotes saem em `release/`.

## Workflow GitHub

Arquivo: `.github/workflows/release-electron-win.yml`

Publica em release quando push em tag `desktop-v*` ou via execução manual (`workflow_dispatch`).
