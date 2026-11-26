# Como usar o Estúdio

## 1. Colocar no Drive (uma vez)

1. Instale o **Google Drive para computador** (assim o Drive vira uma pasta no PC, tipo `G:\Meu Drive`).
2. Copie esta pasta `estudio` inteira para dentro do Drive.
3. Instale o Python (python.org, marque "Add to PATH") e rode no terminal: `pip install pillow pyyaml pillow-heif "rembg[cpu]"`
4. O logo e as cores da Hanauer já estão em `marcas/hanauer/`. Falta só o contato (WhatsApp/@) em `marcas/hanauer/marca.yaml`.

## 2. Abrir o Claude nesta pasta

- **No PC**: abra o Claude Code (app Desktop ou terminal) apontando para a pasta `estudio` do Drive. Ele lê o `CLAUDE.md` sozinho e já sabe como você trabalha.
- **Pelo celular**: no PC, rode `claude remote-control` dentro da pasta `estudio` (ou ative o Remote Control no app Desktop: Configurações → Claude Code → Remote Control). A sessão aparece no app do Claude no celular.

## 3. Cada campanha

1. Copie `campanhas/_modelo` e renomeie: `campanhas/2026-11-27 black-friday-bebidas`.
2. Jogue as fotos em `fotos/` (de preferência produto com fundo recortado, PNG).
3. Diga ao Claude: **"acessa a pasta campanhas/2026-11-27 black-friday-bebidas"** e passe os preços.
4. As artes saem em `saida/`, prontas para postar.
