import { createServer } from "node:http";
import { createReadStream, existsSync, mkdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(ROOT, "data");
const DB_PATH = path.join(DATA_DIR, "visitors.sqlite");
const PORT = Number.parseInt(process.env.PORT || "6767", 10);
const HOST = "0.0.0.0";
const MAX_COUNTED_VISITS_PER_IP = 4;
const saoPauloDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
});

mkdirSync(DATA_DIR, { recursive: true });

const database = new DatabaseSync(DB_PATH);
database.exec("PRAGMA journal_mode = WAL");
database.exec("PRAGMA synchronous = FULL");
database.exec("PRAGMA busy_timeout = 5000");
database.exec(`
    CREATE TABLE IF NOT EXISTS daily_ip_visits (
        client_hash TEXT PRIMARY KEY,
        window_start INTEGER NOT NULL,
        counted_visits INTEGER NOT NULL,
        last_seen INTEGER NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS visitor_totals (
        singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
        total INTEGER NOT NULL
    ) STRICT;
`);
database.prepare(`
    INSERT OR IGNORE INTO visitor_totals (singleton, total) VALUES (1, 0)
`).run();

const readVisitTotal = database.prepare("SELECT total FROM visitor_totals WHERE singleton = 1");
const incrementVisitTotal = database.prepare("UPDATE visitor_totals SET total = total + 1 WHERE singleton = 1");
const readDailyVisits = database.prepare("SELECT window_start, counted_visits FROM daily_ip_visits WHERE client_hash = ?");
const writeDailyVisits = database.prepare(`
    INSERT INTO daily_ip_visits (client_hash, window_start, counted_visits, last_seen)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(client_hash) DO UPDATE SET
        window_start = excluded.window_start,
        counted_visits = excluded.counted_visits,
        last_seen = excluded.last_seen
`);

const MIME = new Map([
    [".html", "text/html; charset=utf-8"],
    [".css", "text/css; charset=utf-8"],
    [".js", "text/javascript; charset=utf-8"],
    [".json", "application/json; charset=utf-8"],
    [".png", "image/png"],
    [".jpg", "image/jpeg"],
    [".jpeg", "image/jpeg"],
    [".webp", "image/webp"],
    [".svg", "image/svg+xml"],
    [".woff", "font/woff"],
    [".mp3", "audio/mpeg"],
    [".mp4", "video/mp4"],
    [".glb", "model/gltf-binary"]
]);

function clientAddress(request) {
    const forwarded = String(request.headers["cf-connecting-ip"] || request.headers["x-forwarded-for"] || request.headers["x-real-ip"] || "").split(",")[0].trim();
    if (forwarded) return forwarded.slice(0, 128);
    return String(request.socket.remoteAddress || "unknown").slice(0, 128);
}

function clientHash(request) {
    return createHash("sha256").update(clientAddress(request)).digest("hex");
}

function dayKey(now) {
    const parts = Object.fromEntries(
        saoPauloDate.formatToParts(new Date(now)).map(part => [part.type, part.value])
    );
    return Number(`${parts.year}${parts.month}${parts.day}`);
}

function countVisit(clientHash, now) {
    const daily = readDailyVisits.get(clientHash);
    let countedVisits = daily ? Number(daily.counted_visits) : 0;
    const currentDay = dayKey(now);
    let windowStart = daily ? Number(daily.window_start) : currentDay;
    let counted = false;
    if (!daily || windowStart !== currentDay) {
        windowStart = currentDay;
        countedVisits = 1;
        counted = true;
    } else if (countedVisits < MAX_COUNTED_VISITS_PER_IP) {
        countedVisits += 1;
        counted = true;
    }
    if (counted) {
        writeDailyVisits.run(clientHash, windowStart, countedVisits, now);
        incrementVisitTotal.run();
    }
    return {
        total: Number(readVisitTotal.get().total),
        counted,
        ipVisits: countedVisits
    };
}

function requestIsSameOrigin(request) {
    const fetchSite = String(request.headers["sec-fetch-site"] || "").toLowerCase();
    if (fetchSite === "cross-site") return false;
    const origin = request.headers.origin;
    if (!origin) return true;
    try {
        return new URL(origin).host === request.headers.host;
    } catch {
        return false;
    }
}

function json(response, status, body, headers = {}) {
    const payload = JSON.stringify(body);
    response.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": Buffer.byteLength(payload),
        "Cache-Control": "no-store, max-age=0",
        ...headers
    });
    response.end(payload);
}

function registerVisit(request, response) {
    const now = Date.now();
    let visit;
    database.exec("BEGIN IMMEDIATE");
    try {
        visit = countVisit(clientHash(request), now);
        database.exec("COMMIT");
    } catch (error) {
        database.exec("ROLLBACK");
        throw error;
    }

    json(response, 200, {
        uniqueVisitors: visit.total,
        pageViews: visit.total,
        counted: visit.counted,
        ipVisitsToday: visit.ipVisits
    });
}

function publicFile(urlPath) {
    if (urlPath === "/") return path.join(ROOT, "index.html");
    const decoded = decodeURIComponent(urlPath);
    const cleanProject = /^\/projects\/([a-z0-9-]+)\/?$/.exec(decoded);
    if (cleanProject) return path.join(ROOT, "projects", `${cleanProject[1]}.html`);
    if (!/^\/(assets|projects|scripts|styles)\//.test(decoded)) return null;
    const candidate = path.resolve(ROOT, `.${decoded}`);
    const rootPrefix = `${ROOT}${path.sep}`;
    return candidate.startsWith(rootPrefix) ? candidate : null;
}

function serveNotFound(request, response) {
    const filePath = path.join(ROOT, "404.html");
    if (!existsSync(filePath)) {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Not found");
        return;
    }
    const stat = statSync(filePath);
    response.writeHead(404, {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Length": stat.size,
        "Cache-Control": "no-cache"
    });
    if (request.method === "HEAD") response.end();
    else createReadStream(filePath).pipe(response);
}

function serveFile(request, response, filePath) {
    if (!filePath || !existsSync(filePath)) {
        serveNotFound(request, response);
        return;
    }
    const stat = statSync(filePath);
    if (!stat.isFile()) {
        response.writeHead(404).end();
        return;
    }
    const type = MIME.get(path.extname(filePath).toLowerCase()) || "application/octet-stream";
    const range = request.headers.range;
    const common = {
        "Content-Type": type,
        "Accept-Ranges": "bytes",
        "Cache-Control": filePath.endsWith(".html") || filePath.includes(`${path.sep}assets${path.sep}build${path.sep}`) ? "no-cache" : "public, max-age=3600"
    };

    if (range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(range);
        if (!match) {
            response.writeHead(416, { "Content-Range": `bytes */${stat.size}` }).end();
            return;
        }
        const start = match[1] ? Number(match[1]) : 0;
        const end = match[2] ? Number(match[2]) : stat.size - 1;
        if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start || end >= stat.size) {
            response.writeHead(416, { "Content-Range": `bytes */${stat.size}` }).end();
            return;
        }
        response.writeHead(206, {
            ...common,
            "Content-Range": `bytes ${start}-${end}/${stat.size}`,
            "Content-Length": end - start + 1
        });
        if (request.method === "HEAD") response.end();
        else createReadStream(filePath, { start, end }).pipe(response);
        return;
    }

    response.writeHead(200, { ...common, "Content-Length": stat.size });
    if (request.method === "HEAD") response.end();
    else createReadStream(filePath).pipe(response);
}

const server = createServer((request, response) => {
    try {
        const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
        if (url.pathname === "/healthz" && request.method === "GET") {
            database.prepare("SELECT 1").get();
            json(response, 200, { ok: true, database: true });
            return;
        }
        if (url.pathname === "/api/visit") {
            if (request.method !== "POST") {
                response.writeHead(405, { "Allow": "POST" }).end();
                return;
            }
            if (!requestIsSameOrigin(request)) {
                json(response, 403, { error: "cross_origin_request_blocked" });
                return;
            }
            registerVisit(request, response);
            return;
        }
        if (request.method !== "GET" && request.method !== "HEAD") {
            response.writeHead(405, { "Allow": "GET, HEAD" }).end();
            return;
        }
        if (url.pathname === "/index.html") {
            response.writeHead(308, { "Location": `/${url.search}` }).end();
            return;
        }
        const legacyProject = /^\/projects\/([a-z0-9-]+)\.html$/.exec(url.pathname);
        if (legacyProject) {
            response.writeHead(308, { "Location": `/projects/${legacyProject[1]}${url.search}` }).end();
            return;
        }
        serveFile(request, response, publicFile(url.pathname));
    } catch (error) {
        console.error("[server]", error);
        if (!response.headersSent) json(response, 500, { error: "internal_server_error" });
        else response.destroy();
    }
});

server.listen(PORT, HOST, () => {
    console.log(`snow running at http://${HOST}:${PORT}`);
    console.log(`visitor database: ${DB_PATH}`);
});

function shutdown() {
    server.close(() => {
        database.close();
        process.exit(0);
    });
    setTimeout(() => process.exit(1), 5e3).unref();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
