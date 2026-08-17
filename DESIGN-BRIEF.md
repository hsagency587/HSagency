# DESIGN-BRIEF.md — Sistema di design del sito

> Bozza estratta automaticamente dal codice esistente (`css/styles.css`, `landing/analisi/landing.css`)
> il 2026-08-17. Non descritta a memoria dall'utente: confermare/correggere prima di usarla come
> riferimento vincolante per nuove pagine.

## Identità del brand
- Nome cliente / attività: HS Agency
- Settore/nicchia: Marketing locale / Local SEO — agenzia che porta attività locali in Top 3 su Google in 90 giorni
- Parole chiave del mood: diretto, risultati-oriented, agenzia digitale moderna, un po' "tech/performance" (badge, metriche, prima/dopo)
- Asset esistenti: logo in `/img/logo-header.png`, palette e font già codificati in `:root` di `css/styles.css`

## Colori
- Colore primario (background/brand): `--bg: #f2eee6` (crema/panna caldo) su testo `--text: #111`
- Colore secondario: nero pieno `#0b0b0b` / `#111` per header, footer, bottoni primari e testo forte
- **Colore CTA — uno solo, per le call-to-action:** nero `#0b0b0b`/`#111` (`.btn--primary`, `.analysis-submit`) — non è un colore "vivo" ma è coerente: tutti i CTA del sito sono neri su sfondo chiaro, mai colorati
- Colori neutri: `--muted: rgba(0,0,0,.65)`, card `--card: #fff`, bordi `--stroke: rgba(0,0,0,.08)`
- Colori funzionali/accento (usati con parsimonia, per badge/stat/microcopy, MAI per i CTA):
  `--green: #2db24a` / `--green2: #1d8f35` (esiti positivi), `--red: #e04848` (errori/validazione — bordi,
  badge, decorazioni), `--red-text: #c62e2e` (variante scurita, obbligatoria per testo d'errore su sfondo
  chiaro: `--red` puro non raggiunge il contrasto AA per il testo), `--yellow: #f5c144` (badge/micro-icone
  tipo il fulmine "3 minuti"), `--blue: #2b6cff` (dettagli player video)
- Contrasto: testo `#111`/`rgba(0,0,0,.65+)` su `--bg` chiaro e su `#fff` → ampiamente sopra WCAG AA;
  testo bianco su `#111`/`#0b0b0b` (header, footer, bottoni) → ampiamente sopra WCAG AA

## Tipografia
- Font titoli: `--font: "Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif` (grassetto 700/800), con un accento serif corsivo `--serif: "Playfair Display", Georgia, "Times New Roman", Times, serif` solo per una parola/frase enfatizzata dentro i titoli (`.serif-italic`)
- Font corpo testo: stessa famiglia `--font` (Inter), peso 500, body `font-weight: 500` di default
- Scala tipografica indicativa:
  - H1 hero: `clamp(42px, 4.2vw, 66px)`, peso 700, letter-spacing negativo
  - H2 sezione: `clamp(30px, 3.2vw, 44px)`
  - Body: 16–20px, `line-height` 1.5–1.65
  - Small/label (badge, legend, micro-testo): 11–12px, uppercase, `letter-spacing: .1–.12em`, peso 700/800

## Spaziatura e layout
- Scala di spaziatura: multipli di ~4–8px (12, 14, 16, 18, 22, 24, 26, 36, 48, 64px ricorrono nel CSS)
- Larghezza massima del contenuto: `--container: 1180px`, con gutter laterale di 48px (`calc(100% - 48px)`) su pagine standard e 32px sulle landing
- Padding standard delle sezioni: `.section { padding: 52px 0; }`; hero/landing usano `clamp(56px, 7vw, 92px) 0`

## Componenti
- **Bottoni**: `border-radius: 14px`, `padding: 14px 16px` (o più largo per CTA hero), `font-weight: 700`,
  transizione su `transform`/`box-shadow`/`background` (~.18s ease).
  - Primario (`.btn--primary`, `.analysis-submit`): sfondo nero `#0b0b0b`/`#111`, testo bianco,
    `box-shadow: 0 12–14px 28–30px rgba(0,0,0,.16)`, hover `translateY(-1px)` + ombra più marcata
  - Ghost/secondario (`.btn--ghost`): sfondo `rgba(0,0,0,.04)`, stesso radius, hover solo su ombra/transform
- **Card**: `background: var(--card) #fff`, `border: 1px solid var(--stroke)`, `border-radius: var(--r20) 20px`,
  `box-shadow: 0 10px 30px rgba(0,0,0,.06)`, padding ~22px
- **Form/input** (da `landing/analisi/landing.css`, unico form del sito ad oggi):
  - input: `height: 56px`, `padding: 0 16px`, `background: rgba(255,255,255,.72)`,
    `border: 1px solid rgba(0,0,0,.1)`, `border-radius: 14px`, `font-size: 16px`, `font-weight: 500`
  - focus: `background: #fff`, `border-color: rgba(0,0,0,.58)`, `box-shadow: 0 0 0 3px rgba(0,0,0,.055), 0 12px 28px rgba(0,0,0,.08)`, `transform: translateY(-1px)`
  - stato non valido: `border-color: rgba(224,72,72,.62)` (usa `--red`)
  - stato "selezionato/ok" (place autocomplete): `border-color: rgba(45,178,74,.65)` + glow verde (usa `--green`)
  - legend/label di sezione: uppercase, 12px, peso 800, `letter-spacing: .1em`, colore `rgba(0,0,0,.62)`,
    con linea sottile (`1px solid rgba(0,0,0,.12)`) che prosegue fino al bordo destro della colonna
  - bottone submit: stesso stile `.btn--primary` (nero, radius 14px, ombra), stato disabled `opacity: .72`

## Immagini
- Trattamento foto: non ancora normato in questa bozza — homepage usa principalmente video-card/screenshot UI, non fotografia editoriale. Da confermare quando servirà.
- Stile illustrazioni: nessuna illustrazione decorativa fuori dalle micro-icone (emoji/SVG a 2 colori tipo fulmine/lucchetto)
- Origine immagini: screenshot prodotto/UI reali (video-card, price-card), nessuno stock generico rilevato

## Riferimenti
- Siti/stili che piacciono: —
- Siti/stili da evitare: —

## Note ed eccezioni
- Le landing page (`landing/*`) hanno scope ridotto per copy/struttura per policy di CLAUDE.md — ma
  **lo stile visivo dei componenti (bottoni, input, card) resta lo stesso design system del sito**,
  quindi nuovi form/CTA su landing devono riusare le classi già presenti in `css/styles.css` e
  `landing/analisi/landing.css`, non inventarne di nuove.
- Bozza da confermare con il cliente/utente: colori, font e componenti sono estratti dal codice
  esistente, non da un brief scritto a priori.
