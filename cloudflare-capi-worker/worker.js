/**
 * HS Agency — Conversions API (Lead) worker.
 *
 * Riceve il submit riuscito del form "Analisi Gratuita" dalla landing (fetch lato client,
 * vedi landing/analisi/landing.js) e lo inoltra alla Conversions API di Meta, hashando i
 * dati identificativi lato server come richiesto da Meta.
 *
 * Deploy: vedi README-DEPLOY.md in questa stessa cartella.
 *
 * Env richiesti (Cloudflare secret, MAI in chiaro nel codice):
 *   META_PIXEL_ID    -> ID dataset/pixel (2437661746700984)
 *   META_CAPI_TOKEN  -> Access Token di un System User (Business Settings)
 *
 * Env opzionale:
 *   ALLOWED_ORIGIN   -> es. "https://hsagency-seo.com" (per limitare le chiamate CORS)
 */

const GRAPH_API_VERSION = "v21.0"; // verificare la versione corrente su developers.facebook.com prima di ogni revisione

async function sha256Hex(value) {
  const normalized = value.trim().toLowerCase();
  const data = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(env) });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders(env) });
    }

    if (!env.META_PIXEL_ID || !env.META_CAPI_TOKEN) {
      return new Response("Worker non configurato: mancano META_PIXEL_ID / META_CAPI_TOKEN", {
        status: 500,
        headers: corsHeaders(env)
      });
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return new Response("JSON non valido", { status: 400, headers: corsHeaders(env) });
    }

    const { eventId, eventSourceUrl, phone, fbp, fbc, fbclid } = body || {};

    if (!eventId || !eventSourceUrl) {
      return new Response("eventId e eventSourceUrl sono obbligatori", {
        status: 400,
        headers: corsHeaders(env)
      });
    }

    const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "";
    const userAgent = request.headers.get("user-agent") || "";

    const userData = {
      client_ip_address: ip || undefined,
      client_user_agent: userAgent || undefined,
      fbp: fbp || undefined
    };

    if (phone) {
      // Normalizza in sole cifre prima dell'hashing, come richiesto da Meta per il campo "ph".
      const digitsOnly = String(phone).replace(/\D/g, "");
      if (digitsOnly) userData.ph = [await sha256Hex(digitsOnly)];
    }

    if (fbc) {
      userData.fbc = fbc;
    } else if (fbclid) {
      // Fallback se il cookie _fbc non è ancora presente ma l'URL aveva ?fbclid=
      userData.fbc = `fb.1.${Date.now()}.${fbclid}`;
    }

    const payload = {
      data: [
        {
          event_name: "Lead",
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          action_source: "website",
          event_source_url: eventSourceUrl,
          user_data: userData,
          custom_data: { content_name: "analisi-gratuita" }
        }
      ]
    };

    const graphUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/${env.META_PIXEL_ID}/events?access_token=${env.META_CAPI_TOKEN}`;

    const metaResponse = await fetch(graphUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!metaResponse.ok) {
      const errorBody = await metaResponse.text();
      console.error("Errore Conversions API:", errorBody);
      return new Response("Errore inoltro a Meta", { status: 502, headers: corsHeaders(env) });
    }

    return new Response("ok", { status: 200, headers: corsHeaders(env) });
  }
};
