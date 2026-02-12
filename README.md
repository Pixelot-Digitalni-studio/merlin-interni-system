# 🧙‍♂️ Merlin - Fakturační systém

Merlin je moderní desktopová aplikace pro snadnou a rychlou tvorbu faktur, navržená pro živnostníky a malé firmy. Aplikace běží na platformě Electron a nabízí intuitivní uživatelské rozhraní vytvořené v Reactu.

## ✨ Hlavní funkce

- **📝 Tvorba faktur**: Jednoduchý editor pro vytváření a úpravu faktur v reálném čase.
- **👥 Správa zákazníků**: Ukládání a správa kontaktů pro rychlé doplňování údajů do faktur.
- **🏢 Firemní profily**: Možnost spravovat více firemních profilů (identit) pro vystavování faktur.
- **💾 Export do PDF**: Okamžitý tisk nebo uložení faktury do formátu PDF.
- **📱 QR Platby**: Automatické generování QR kódů pro snadné platby faktur.
- **🔄 Automatické aktualizace**: Aplikace se sama aktualizuje na nejnovější verzi.
- **🎨 Přizpůsobení**: Nastavení loga a vzhledu faktury.

## 🛠️ Použité technologie

- **Frontend**: React, Vite
- **Desktop**: Electron
- **Další knihovny**: 
  - `qrcode.react` (QR kódy)
  - `electron-updater` (aktualizace)
  - `iban` (validace IBAN)

## 🚀 Jak spustit aplikaci

### Vývojový režim
Spuštění aplikace v režimu pro vývojáře:
```bash
npm run dev
# nebo pro spuštění s Electronem:
npm run electron
```

### Sestavení (Build)
Vytvoření instalátoru pro Windows:
```bash
npm run electron:build
```
