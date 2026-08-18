# Deploy del worker CAPI — HS Agency

Questo worker riceve il Lead dalla landing (`/landing/analisi/landing.js`) e lo inoltra alla
Conversions API di Meta. Non fa parte del deploy statico del sito (GitHub Pages): va pubblicato
separatamente su Cloudflare, una volta sola.

## 1. Prendere l'Access Token della Conversions API

1. Vai su **Events Manager** → dataset "HS Agency - Website pixel" → **Impostazioni** → sezione
   **Conversions API**.
2. Per un test rapido puoi generare un token da lì direttamente. Per la produzione, meglio: vai in
   **Business Settings → Utenti → Utenti di sistema (System Users)**, crea (o usa) un System User,
   assegnagli accesso al dataset/pixel, e genera da lì un token con permesso `ads_management` (o
   equivalente per gli eventi). Questo token non si invalida se una persona perde l'accesso
   all'account.
3. Copia il token: non va mai scritto nel codice o committato su GitHub.

## 2. Installare Wrangler (CLI Cloudflare)

```bash
npm install -g wrangler
wrangler login
```

Serve un account Cloudflare (gratuito) — non serve che il dominio del sito sia già su Cloudflare:
un Worker può girare su un sottodominio `*.workers.dev` senza toccare il DNS esistente.

## 3. Configurare i secret

Dalla cartella `cloudflare-capi-worker/`:

```bash
wrangler secret put META_PIXEL_ID
# incolla: 2437661746700984

wrangler secret put META_CAPI_TOKEN
# incolla il token generato al punto 1
```

## 4. Deploy

```bash
wrangler deploy
```

Wrangler stampa l'URL pubblico del worker, tipo:

```
https://hsagency-capi-lead.<tuo-account>.workers.dev
```

## 5. Collegare l'URL al sito

Apri `landing/analisi/runtime-config.js` e valorizza `capiEndpoint` con l'URL ottenuto:

```js
capiEndpoint: "https://hsagency-capi-lead.<tuo-account>.workers.dev",
```

Finché questo campo resta vuoto, il sito continua a funzionare normalmente: semplicemente non
manda l'evento server-side (solo Pixel browser).

## 6. Verifica

Segui la sequenza di verifica in Events Manager → dataset → **Test Events**:

1. Tieni Test Events aperto in una tab, la landing in un'altra.
2. Accetta il banner cookie, compila e invia il form.
3. Devono comparire **due** eventi Lead con lo stesso `event_id` — uno da Browser, uno da Server —
   mostrati come deduplicati.
4. Controlla che `user_data` lato server abbia `ph` (telefono hashato), `client_ip_address`,
   `client_user_agent` e possibilmente `fbp`/`fbc` valorizzati.

Se qualcosa non torna, vedi la checklist troubleshooting nella skill `meta-tracking-setup`
(`references/qa-troubleshooting.md`).

## Note su CORS

`ALLOWED_ORIGIN` in `wrangler.toml` è impostato su `https://hsagency-seo.com`. Se testi in locale
da un altro origin (es. `http://127.0.0.1:...`), le chiamate CORS falliranno per design — è corretto,
non serve "aprire" l'origin per il test locale: verifica direttamente sul dominio di produzione o
su un ambiente di staging con lo stesso host.
