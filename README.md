# Voedingscheck

Mobiel-eerst web-app (PWA) voor Safari op iPhone: vink door de dag heen af wat je hebt gegeten,
op basis van de "Dagelijkse voedingscheck".

- Geen login, geen backend. Alles staat lokaal op je telefoon (localStorage).
- Elke dag begint de lijst leeg.
- Werkt offline en vanaf het beginscherm (Deel → Zet op beginscherm).

## Gebruiken

De app staat op GitHub Pages: https://selweshype.github.io/food-checker/

Eén keer instellen: Settings → Pages → Build and deployment → Source: **GitHub Actions**.
Daarna publiceert elke push van `app/` automatisch.

Op je iPhone: open de link in Safari, Deel → Zet op beginscherm.

## Ontwikkelen

```
node tools/shoot.mjs <map>     # iPhone-screenshots van vier toestanden
node tools/verify.mjs          # gedragschecks: bewaren, dagreset, offline, caps
node tools/icons.mjs           # PNG-iconen uit app/icon.svg
```

De tools gebruiken de globaal geïnstalleerde Playwright (`tools/node_modules` is een symlink).
