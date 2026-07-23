# Fonti della nuova home

Tutti i file pubblicati dalla nuova home si trovano dentro `nuova-home/`. Non è stata generata alcuna immagine con intelligenza artificiale.

## Immagini

- Le immagini dei gioielli e della storia provengono dalla repository originale della Gioielleria Di Nucci. Le serie `images/catalog-fedi-*`, `images/catalog-fidanzamento-*`, `images/catalog-perle-*`, `images/catalog-anelli-*` e `images/catalog-bracciali-*` sono copie locali degli asset presenti in `img/uploads/`, scelte per corrispondere alle rispettive categorie.
- L'impostazione espositiva del catalogo riprende il riferimento indicato dal cliente, <https://ansuini.it/>, senza copiarne fotografie o testi.
- `images/negozio-1.png`–`images/negozio-4.png` derivano dagli scatti del negozio forniti dal cliente (`7.png`–`10.png`).
- `images/esterno-di-nucci.jpeg` è la fotografia dell'esterno fornita dal cliente come `17.jpeg`.
- `images/compro-oro-pesatura.jpg` è “Weighing gold” di Mauro Cateb, Wikimedia Commons, licenza CC BY-SA 4.0: <https://commons.wikimedia.org/wiki/File:Weighing_gold.jpg>. Nella pagina viene usata come fotografia di sfondo con ritaglio CSS, senza alterare il file originale.

## Informazioni e Google Business

- Storia, indirizzo, telefono fisso ed email sono ricavati dai contenuti originali presenti nella repository. Nella CTA Contatti viene utilizzato esclusivamente il numero fisso della gioielleria.
- La sezione Recensioni incorpora direttamente la scheda Google Maps dell'attività e rimanda al Profilo Google Business tramite il CID già presente nel sito originale. La mappa è caricata da Google; valutazione, conteggio e singole recensioni non sono copiati o simulati nel codice della home.
- Il pulsante “Lascia una recensione” usa il riferimento Google dell'attività. Per un collegamento breve proprietario è possibile sostituirlo con quello esportato dal pannello Google Business Profile, senza altre modifiche alla pagina.
- Un carosello automatico con i testi delle singole recensioni richiede un'applicazione registrata e credenziali OAuth 2.0 del proprietario: è il requisito indicato dalla documentazione ufficiale per l'endpoint `accounts.locations.reviews.list` (<https://developers.google.com/my-business/reference/rest/v4/accounts.locations.reviews/list>). Le credenziali non vanno inserite nel JavaScript pubblico della home; in loro assenza è stato mantenuto il collegamento live e verificabile al Profilo Google.
