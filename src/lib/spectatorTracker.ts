/**
 * In-Memory Spectator Presence Tracker
 *
 * Tracks active spectator connections per room without incurring
 * persistent database writes or MongoDB document bloat.
 */

const SPECTATOR_TIMEOUT_MS = 15000; // 15 seconds heartbeat window

// Map of roomCode -> (spectatorIdentifier -> lastSeenTimestamp)
const roomSpectators = new Map<string, Map<string, number>>();

// Clean up stale spectators every 30 seconds
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [roomCode, spectators] of roomSpectators.entries()) {
      for (const [spectatorId, lastSeen] of spectators.entries()) {
        if (now - lastSeen > SPECTATOR_TIMEOUT_MS) {
          spectators.delete(spectatorId);
        }
      }
      if (spectators.size === 0) {
        roomSpectators.delete(roomCode);
      }
    }
  }, 30000);
}

/**
 * Records a spectator's presence heartbeat for a given room
 * and returns the current active spectator count.
 */
export function recordSpectatorPresence(roomCode: string, spectatorId: string): number {
  const normalized = roomCode.trim().toUpperCase();
  const now = Date.now();

  let spectators = roomSpectators.get(normalized);
  if (!spectators) {
    spectators = new Map<string, number>();
    roomSpectators.set(normalized, spectators);
  }

  spectators.set(spectatorId, now);

  // Prune expired entries for this specific room
  let activeCount = 0;
  for (const [id, lastSeen] of spectators.entries()) {
    if (now - lastSeen <= SPECTATOR_TIMEOUT_MS) {
      activeCount++;
    } else {
      spectators.delete(id);
    }
  }

  return activeCount;
}

/**
 * Gets the current active spectator count for a room.
 */
export function getActiveSpectatorCount(roomCode: string): number {
  const normalized = roomCode.trim().toUpperCase();
  const spectators = roomSpectators.get(normalized);
  if (!spectators) return 0;

  const now = Date.now();
  let count = 0;
  for (const lastSeen of spectators.values()) {
    if (now - lastSeen <= SPECTATOR_TIMEOUT_MS) {
      count++;
    }
  }
  return count;
}
