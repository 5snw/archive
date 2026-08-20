CREATE TABLE IF NOT EXISTS daily_ip_visits (
    client_hash TEXT NOT NULL,
    day_key INTEGER NOT NULL,
    counted_visits INTEGER NOT NULL DEFAULT 0 CHECK (counted_visits BETWEEN 0 AND 4),
    last_seen INTEGER NOT NULL,
    PRIMARY KEY (client_hash, day_key)
) STRICT;
