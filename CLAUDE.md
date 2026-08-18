# CLAUDE.md

## Chi sono e cosa costruisco
- Sviluppo siti commerciali: landing page, e-commerce, siti vetrina, local business.
- Nessun sistema/stack fisso da rispettare in automatico: valuta caso per caso.
- Obiettivo tecnico: codice funzionale e con economia di codice (evita over-engineering, evita dipendenze/righe superflue).
- Se il sito è già esistente e ha convenzioni proprie, seguile. Se è un progetto nuovo, punta su semplicità ed efficienza.

## Modalità di lavoro
- Default: **Plan mode** — descrivi il piano e aspetta approvazione prima di eseguire, tranne per modifiche banali/ovvie (lì procedi direttamente).
- Modifica **sempre i file direttamente nella cartella del progetto** — non produrre il contenuto finale come output separato da incollare.
- **Non fare mai commit o push senza una richiesta esplicita**, anche quando sembrerebbe il passo logico successivo.
- Nessuna convenzione fissa per naming di branch o commit, al momento.

## Skill da usare (fonte di verità)
Tre skill portano la logica dettagliata; questo file porta il workflow. **Chiunque legga questo CLAUDE.md — qualsiasi modello o agente, non solo Claude Code — deve aprire e seguire questi file prima di scrivere codice o copy per un sito local:**

- `C:\Users\sscir\.claude\skills\local-seo\SKILL.md`
  (+ dettaglio: `C:\Users\sscir\.claude\skills\local-seo\references\onpage-playbook.md` e `...\references\local-seo-context.md`)
  → struttura pagine e on-page/local SEO: formule title/H1/H2, NAP, schema, architettura di autorità topica e locale, interlinking, word count, e i prompt di copy. Leggila ogni volta che il lavoro tocca un sito local, il posizionamento local o la SEO on-page — anche se non viene nominata la parola "SEO".
- `C:\Users\sscir\.claude\skills\copy-voice\SKILL.md`
  → come deve suonare il copy: voce di casa estratta dai siti reali del cliente (nucleo costante + registro che cambia per nicchia). Leggila ogni volta che si scrive o modifica copy che andrà online.
- `C:\Users\sscir\.claude\skills\web-design\SKILL.md`
  (+ template: `...\references\design-brief-template.md` e `...\references\prompt-templates.md`)
  → il layer visivo: colori, tipografia, spaziatura, componenti, immagini, e come mantenere coerenza tra pagine. Leggila ogni volta che si crea o modifica una pagina, sezione, footer o navbar — le decisioni di stile non si inventano al momento, si leggono dal design brief del sito.

Questi tre file sono condivisi su questo PC e valgono per tutti i progetti — non sono dentro questo repo, ma nella cartella utente. Se il modello che stai usando non ha accesso al filesystem fuori da questo progetto, chiedi all'utente di incollarne il contenuto.

**Il design di QUESTO sito specifico** vive invece in `DESIGN-BRIEF.md`, nella root di questo stesso repo (a fianco di questo CLAUDE.md) — non è condiviso, è specifico di questo progetto. Se non esiste ancora, proponi di costruirlo (skill `web-design`) prima di creare o modificare qualsiasi pagina/sezione/footer/navbar: non inventare colori, font o spaziature senza quel file.

**Priorità in caso di conflitto:** eccezione specifica di nicchia/cliente data sul momento **>** DESIGN-BRIEF.md di questo sito (per le decisioni visive) **>** contenuto delle skill sopra **>** promemoria di questo file. Le regole comunicate caso per caso vincono sempre sui default.

## SEO — promemoria dei non-negoziabili
Questi valgono sempre, anche senza la skill caricata. Per tutto il resto (struttura avanzata, word count, gerarchia, interlinking) segui la skill `local-seo`, che è la versione completa.

- **Title tag**: `BEST + categoria primaria + città + nome business + servizi primari + "near me"` (se c'è spazio). Punta a ~200 caratteri, non ai classici 60.
- **H1**: categoria primaria + città. **H2**: categorie/servizi più rilevanti, individuati con ricerca reale su competitor/GBP, non a tavolino.
- **NAP** (Nome, Indirizzo, Telefono) coerente in homepage e footer di tutto il sito, identico al Google Business Profile.
- **Schema** LocalBusiness (+ FAQ dove serve) e **mappa GBP incorporata** in homepage.
- **Autorità topica/locale** (pagine servizio, pagine "aree che serviamo", gerarchia rank 1/2/3, interlinking): è il livello da costruire quando serve spingere il posizionamento — segui `local-seo\SKILL.md` (percorso sopra) per struttura e numeri.
- **Recensioni**: rispondere alle recensioni Google aiuta il ranking. Segnalalo al cliente (non è un intervento sul codice).

**Landing page — scope ridotto**
- Su una landing page applica di default **solo** il **title tag** e lo **schema JSON-LD**.
- **Non** applicare in automatico il resto (NAP, footer, navbar, H1/H2, mappa GBP, pagine servizio/area, interlinking): su queste pagine **copy, footer, navbar e struttura li gestisco io**.
- Tocca copy o struttura di una landing page solo se te lo chiedo esplicitamente.

**Come procedere sulla struttura pagine** (siti local completi, non landing)
- La lista di aree e servizi del cliente arriva durante la creazione della home.
- Su quella base, **proponi tu la struttura di pagine** (gerarchia servizi + aree, quali interlinkare) prima di crearle.
- Aspetta la mia valutazione sulla struttura proposta prima di creare effettivamente le pagine.

## Copywriting e tono
- Per la voce, segui `copy-voice\SKILL.md` (percorso sopra).
- Guardrail sempre validi, a prescindere dalla skill:
  - Ogni sezione resta aderente al proprio argomento e dimostra competenza reale: dettagli approfonditi, tips da esperto, terminologia specifica del settore.
  - Il settore/nicchia del cliente arriva caso per caso, sul momento: usalo per scrivere come un esperto di *quel* settore.
  - Se il sito è già esistente o vengono fornite fonti/riferimenti, adatta il tono a quelli.
  - **Da evitare sempre**: liste infinite con troppi elementi elencati/virgolettati; frasi lunghe che sembrano dire molto ma hanno poco contenuto reale.

## Design e coerenza visiva
- Per i principi di design (colori, tipografia, spaziatura, componenti, immagini), segui `web-design\SKILL.md` (percorso sopra).
- Prima di creare o modificare qualsiasi pagina, sezione, footer o navbar, **leggi `DESIGN-BRIEF.md`** in questo repo. Se non esiste, proponi di costruirlo prima di procedere.
- **Regola non negoziabile**: un solo colore per le call-to-action, usato esclusivamente per quelle — mai per altro.
- Non introdurre mai un nuovo colore, font, o stile di componente "solo per questa pagina": se manca qualcosa nel brief, proponilo e fallo approvare, poi aggiungilo al brief.
- Footer e navbar devono restare identici (struttura e stile) su tutte le pagine del sito.

## Competenza di settore e verifica
- Se l'argomento è tecnico, di nicchia o non banale, verifica con ricerca web prima di scrivere dati o affermazioni specifiche di settore.
- Se l'argomento è di uso comune/banale, non serve verificare.

## Revisione
- Prima stesura → revisione dell'utente (round 1).
- Correzioni applicate → seconda revisione (round 2), poi via libera.

---
Nota: la logica SEO, copy e design dettagliata vive nei file skill linkati sopra (fonte di verità unica, per non avere copie che divergono). Questo file tiene solo il workflow always-on e i non-negoziabili, e rimanda ai file skill per il resto. Qualsiasi modello/agente che legge questo CLAUDE.md deve aprire anche quei file — non sono un dettaglio opzionale.
