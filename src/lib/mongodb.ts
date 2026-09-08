import mongoose from "mongoose";
import dns from "dns";

const dnsResolver = new dns.promises.Resolver();
dnsResolver.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

/**
 * Masks the password in a MongoDB URI for safe logging.
 */
function sanitizeUri(uri: string): string {
  return uri.replace(
    /mongodb(\+srv)?:\/\/([^:]+):([^@]+)@/,
    (_, srv, user) => `mongodb${srv || ""}://${user}:***@`
  );
}

/**
 * Resolves a mongodb+srv:// URI into a standard mongodb:// URI by manually
 * performing SRV and TXT DNS lookups using Google Public DNS (8.8.8.8).
 *
 * This bypasses the Node.js c-ares default DNS resolver which fails on
 * Windows when the local DNS proxy (127.0.0.1) refuses SRV query packets.
 */
async function resolveSrvToStandardUri(srvUri: string): Promise<string> {
  const match = srvUri.match(
    /^mongodb\+srv:\/\/([^@]+)@([^/?]+)(\/[^?]*)?(\?.*)?$/
  );
  if (!match) {
    throw new Error("[MongoDB] Cannot parse mongodb+srv:// URI");
  }

  const credentials = match[1]; // user:pass
  const srvHost = match[2]; // insidcode.znbgedq.mongodb.net
  const dbPath = match[3] || ""; // /insidcode or empty
  const queryString = match[4] || ""; // ?appName=...

  // Resolve SRV records: _mongodb._tcp.<host>
  const srvRecords = await dnsResolver.resolveSrv(
    `_mongodb._tcp.${srvHost}`
  );
  if (!srvRecords.length) {
    throw new Error(`[MongoDB] No SRV records for _mongodb._tcp.${srvHost}`);
  }

  // Resolve TXT records for authSource, replicaSet, etc.
  let txtOptions = "";
  try {
    const txtRecords = await dnsResolver.resolveTxt(srvHost);
    if (txtRecords.length > 0) {
      txtOptions = txtRecords[0].join("");
    }
  } catch {
    // TXT records are optional
  }

  const hostList = srvRecords
    .map((r) => `${r.name}:${r.port}`)
    .join(",");

  // Merge query parameters: TXT defaults < original query overrides
  const params = new URLSearchParams();
  params.set("tls", "true");
  if (txtOptions) {
    for (const [k, v] of new URLSearchParams(txtOptions)) {
      params.set(k, v);
    }
  }
  if (queryString) {
    for (const [k, v] of new URLSearchParams(queryString.slice(1))) {
      params.set(k, v);
    }
  }

  // Default database name from path, or "insidcode" if unspecified
  const dbName = dbPath.replace(/^\//, "") || "insidcode";

  const resolvedUri = `mongodb://${credentials}@${hostList}/${dbName}?${params.toString()}`;

  console.log(
    `[MongoDB] Resolved SRV: ${srvRecords.length} hosts (${srvRecords.map((r) => r.name.split(".")[0]).join(", ")})`
  );

  return resolvedUri;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  const rawUri = process.env.MONGODB_URI;

  if (!rawUri) {
    throw new Error(
      "[MongoDB] MONGODB_URI is not set. Check .env.local"
    );
  }

  // Return cached connection if still alive
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // Reset stale cache
  if (cached.conn && mongoose.connection.readyState !== 1) {
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    cached.promise = (async () => {
      let connectUri = rawUri.trim();

      // Manually resolve SRV if needed
      if (connectUri.startsWith("mongodb+srv://")) {
        try {
          connectUri = await resolveSrvToStandardUri(connectUri);
        } catch (srvErr) {
          console.error(
            "[MongoDB] Manual SRV resolution failed:",
            (srvErr as Error).message
          );
          throw srvErr;
        }
      }

      const opts: mongoose.ConnectOptions = {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
        dbName: "insidcode",
      };

      try {
        const instance = await mongoose.connect(connectUri, opts);

        // Verify with ping
        const pingResult = await instance.connection.db
          ?.admin()
          .command({ ping: 1 });
        console.log(
          `[MongoDB] Connected and verified. Ping: ${pingResult?.ok === 1 ? "OK" : "FAILED"}`
        );

        return instance;
      } catch (connErr) {
        console.error(
          `[MongoDB] Connection failed (${sanitizeUri(connectUri)}):`,
          (connErr as Error).message
        );
        throw connErr;
      }
    })();

    // Clear cached promise on failure so next call retries
    cached.promise.catch(() => {
      cached.promise = null;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    throw e;
  }

  return cached.conn;
}
