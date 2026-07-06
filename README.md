# Qbpm

**Quantum BPM — Music Collab** · spatial node graph · live jam · mass collaboration

Live: **https://fornevercollective.github.io/Qbpm/**

Static shell (canvas, music lab, dock UI). Full API stack: [qbitOS/qbpm](https://github.com/qbitOS/qbpm) · `./start.sh` on port 8796.

## Deploy

1. **Settings → Pages → Source:** GitHub Actions
2. Push to `main` — workflow builds with base path `/Qbpm/`

## Sync from qbitOS/qbpm

```bash
./scripts/publish-fornevercollective.sh
cd Qbpm && git add -A && git commit -m "sync pages" && git push
```

Apache-2.0
