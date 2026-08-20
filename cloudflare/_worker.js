const MAX_DAILY_VISITS = 4;

function json(body, status = 200, headers = {}) {
    return Response.json(body, {
        status,
        headers: {
            "Cache-Control": "no-store, max-age=0",
            ...headers
        }
    });
}

function sameOrigin(request) {
    const fetchSite = String(request.headers.get("Sec-Fetch-Site") || "").toLowerCase();
    if (fetchSite === "cross-site") return false;
    const origin = request.headers.get("Origin");
    if (!origin) return true;
    try {
        return new URL(origin).host === new URL(request.url).host;
    } catch {
        return false;
    }
}

function dayKey() {
    const parts = Object.fromEntries(
        new Intl.DateTimeFormat("en-CA", {
            timeZone: "America/Sao_Paulo",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).formatToParts(new Date()).map(part => [part.type, part.value])
    );
    return Number(`${parts.year}${parts.month}${parts.day}`);
}

async function hashAddress(address) {
    const bytes = new TextEncoder().encode(address);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

async function registerVisit(request, env) {
    if (request.method !== "POST") {
        return new Response(null, { status: 405, headers: { Allow: "POST" } });
    }
    if (!sameOrigin(request)) return json({ error: "cross_origin_request_blocked" }, 403);
    if (!env.VISITOR_DB) return json({ error: "visitor_database_unavailable" }, 503);

    const address = request.headers.get("CF-Connecting-IP") || "unknown";
    const clientHash = await hashAddress(address);
    const today = dayKey();
    const now = Date.now();

    const update = await env.VISITOR_DB.prepare(`
        INSERT INTO daily_ip_visits (client_hash, day_key, counted_visits, last_seen)
        VALUES (?, ?, 1, ?)
        ON CONFLICT(client_hash, day_key) DO UPDATE SET
            counted_visits = counted_visits + 1,
            last_seen = excluded.last_seen
        WHERE counted_visits < ?
        RETURNING counted_visits
    `).bind(clientHash, today, now, MAX_DAILY_VISITS).first();

    const [daily, total] = await env.VISITOR_DB.batch([
        env.VISITOR_DB.prepare("SELECT counted_visits FROM daily_ip_visits WHERE client_hash = ? AND day_key = ?").bind(clientHash, today),
        env.VISITOR_DB.prepare("SELECT COALESCE(SUM(counted_visits), 0) AS total FROM daily_ip_visits")
    ]);

    const ipVisitsToday = Number(daily.results[0]?.counted_visits || 0);
    const uniqueVisitors = Number(total.results[0]?.total || 0);
    return json({
        uniqueVisitors,
        pageViews: uniqueVisitors,
        counted: Boolean(update),
        ipVisitsToday
    });
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        if (url.pathname === "/api/visit") return registerVisit(request, env);
        if (url.pathname === "/healthz") return json({ ok: true, database: Boolean(env.VISITOR_DB) });
        return env.ASSETS.fetch(request);
    }
};
