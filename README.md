# Voedingscheck

Mobiel-eerst web-app (PWA) voor Safari op iPhone: vink door de dag heen af wat je hebt gegeten,
op basis van de "Dagelijkse voedingscheck".

- Geen login, geen backend. Alles staat lokaal op je telefoon (localStorage).
- Elke dag begint de lijst leeg.
- Werkt offline en vanaf het beginscherm (Deel → Zet op beginscherm).

## Gebruiken

Open `app/index.html` via een statische server (bijv. GitHub Pages met `app/` als root) en
voeg de pagina toe aan het beginscherm van je iPhone.

## Ontwikkelen

```
node tools/shoot.mjs <map>     # iPhone-screenshots van vier toestanden
node tools/verify.mjs          # gedragschecks: bewaren, dagreset, offline, caps
node tools/icons.mjs           # PNG-iconen uit app/icon.svg
```

De tools gebruiken de globaal geïnstalleerde Playwright (`tools/node_modules` is een symlink).
