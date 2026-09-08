"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Users, UserPlus, Check, X, Search, Loader2, Clock, Zap, Flame } from "lucide-react";
import { useSession } from "next-auth/react";

interface Friend {
  id: string;
  username: string;
  displayName: string;
  image?: string;
  xp: number;
  solvedCount: number;
  currentStreak: number;
  role: string;
}

interface FriendRequest {
  requestId: string;
  sender?: {
    _id: string;
    username: string;
    displayName: string;
    image?: string;
    xp: number;
  };
  receiver?: {
    _id: string;
    username: string;
    displayName: string;
    image?: string;
  };
  createdAt: string;
}

interface SearchUser {
  id: string;
  username: string;
  displayName: string;
  image?: string;
  xp: number;
  solvedCount: number;
  friendStatus: "none" | "pending_sent" | "pending_received" | "friends";
}

export default function FriendsPage() {
  const { data: session } = useSession();

  const [friends, setFriends] = useState<Friend[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchFriends = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/friends");
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends || []);
        setIncoming(data.incomingRequests || []);
        setOutgoing(data.outgoingRequests || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/friends/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.users || []);
        }
      } catch {
        // silent
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleFriendAction = async (
    action: "send" | "accept" | "reject" | "remove",
    targetId: string
  ) => {
    setActionLoadingId(targetId);
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, targetUserId: targetId }),
      });

      if (res.ok) {
        await fetchFriends();
        setSearchQuery("");
        setSearchResults([]);
      } else {
        const data = await res.json();
        alert(data.error || "Action failed");
      }
    } catch {
      alert("Network error");
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center text-xs text-[#8B93A7]">
        Please sign in to manage your friends and social connections.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#252936] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-5 w-5 text-[#00F0FF]" />
            <h1 className="text-2xl font-bold tracking-tight text-[#F5F7FA]">Friends</h1>
          </div>
          <p className="text-xs text-[#8B93A7]">
            Connect with other developers to compete on the friends leaderboard and track each other&apos;s progress.
          </p>
        </div>

        {/* Stats badge */}
        <div className="flex items-center gap-2 text-xs font-mono text-[#8B93A7]">
          <span className="rounded border border-[#252936] bg-[#11131A] px-3 py-1.5">
            <strong className="text-[#F5F7FA]">{friends.length}</strong> friends
          </span>
          {incoming.length > 0 && (
            <span className="rounded border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-3 py-1.5 text-[#F59E0B]">
              <strong>{incoming.length}</strong> pending
            </span>
          )}
        </div>
      </div>

      {/* Developer Search */}
      <div className="rounded-xl border border-[#252936] bg-[#11131A] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-[#00F0FF]" />
          <h3 className="text-sm font-bold text-[#F5F7FA]">Find Developers</h3>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8B93A7]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username or display name..."
            className="w-full rounded-lg border border-[#252936] bg-[#181B24] py-2 pl-9 pr-4 text-xs text-[#F5F7FA] placeholder-[#5E667B] focus:border-[#00F0FF] focus:outline-none"
          />
          {searchLoading && (
            <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-[#8B93A7]" />
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-1">
            {searchResults.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-lg border border-[#252936] bg-[#181B24] px-3.5 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#252936] bg-[#090A0F] text-xs font-bold text-[#00F0FF] overflow-hidden">
                    {user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.image} alt={user.displayName} className="h-full w-full object-cover" />
                    ) : (
                      user.username.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <Link href={`/profile/${user.username}`} className="text-xs font-semibold text-[#F5F7FA] hover:text-[#00F0FF]">
                      {user.displayName}
                    </Link>
                    <p className="font-mono text-[10px] text-[#8B93A7]">@{user.username}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-[#8B93A7]">
                    <span className="text-[#00F0FF]">{user.xp} XP</span>
                    <span>{user.solvedCount} solved</span>
                  </div>
                </div>

                <div>
                  {user.friendStatus === "friends" ? (
                    <span className="text-[11px] font-semibold text-[#39FF14]">Friends</span>
                  ) : user.friendStatus === "pending_sent" ? (
                    <span className="text-[11px] text-[#8B93A7]">Request sent</span>
                  ) : user.friendStatus === "pending_received" ? (
                    <button
                      onClick={() => handleFriendAction("accept", user.id)}
                      disabled={actionLoadingId === user.id}
                      className="text-[11px] font-semibold text-[#00F0FF] hover:underline disabled:opacity-50"
                    >
                      Accept
                    </button>
                  ) : (
                    <button
                      onClick={() => handleFriendAction("send", user.id)}
                      disabled={actionLoadingId === user.id}
                      className="flex items-center gap-1 rounded border border-[#252936] bg-[#090A0F] px-2.5 py-1 text-[11px] font-semibold text-[#F5F7FA] hover:border-[#00F0FF] disabled:opacity-50 transition"
                    >
                      <UserPlus className="h-3 w-3" />
                      Add
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {searchQuery.length >= 2 && !searchLoading && searchResults.length === 0 && (
          <p className="text-xs text-[#8B93A7]">No developers found matching your search.</p>
        )}
      </div>

      {/* Incoming Requests */}
      {incoming.length > 0 && (
        <div className="rounded-xl border border-[#F59E0B]/20 bg-[#11131A] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#F59E0B]" />
            <h3 className="text-sm font-bold text-[#F5F7FA]">
              Pending Requests
              <span className="ml-2 rounded bg-[#F59E0B]/10 px-1.5 py-0.5 text-[10px] font-mono text-[#F59E0B]">
                {incoming.length}
              </span>
            </h3>
          </div>

          <div className="space-y-2">
            {incoming.map((req) => {
              const sender = req.sender;
              if (!sender) return null;
              return (
                <div
                  key={req.requestId}
                  className="flex items-center justify-between rounded-lg border border-[#252936] bg-[#181B24] px-3.5 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#252936] bg-[#090A0F] text-xs font-bold text-[#00F0FF] overflow-hidden">
                      {sender.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={sender.image} alt={sender.displayName} className="h-full w-full object-cover" />
                      ) : (
                        sender.username.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <Link href={`/profile/${sender.username}`} className="text-xs font-semibold text-[#F5F7FA] hover:text-[#00F0FF]">
                        {sender.displayName}
                      </Link>
                      <p className="font-mono text-[10px] text-[#8B93A7]">@{sender.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleFriendAction("accept", sender._id)}
                      disabled={actionLoadingId === sender._id}
                      className="flex items-center gap-1 rounded border border-[#39FF14]/30 bg-[#39FF14]/10 px-2.5 py-1 text-[11px] font-semibold text-[#39FF14] hover:bg-[#39FF14]/20 disabled:opacity-50 transition"
                    >
                      <Check className="h-3 w-3" />
                      Accept
                    </button>
                    <button
                      onClick={() => handleFriendAction("reject", sender._id)}
                      disabled={actionLoadingId === sender._id}
                      className="flex items-center gap-1 rounded border border-[#252936] bg-[#181B24] px-2.5 py-1 text-[11px] font-semibold text-[#8B93A7] hover:text-[#FF4D6D] disabled:opacity-50 transition"
                    >
                      <X className="h-3 w-3" />
                      Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Friends List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#00F0FF]" />
        </div>
      ) : friends.length === 0 ? (
        <div className="rounded-xl border border-[#252936] bg-[#11131A] py-16 text-center space-y-2">
          <Users className="h-8 w-8 text-[#252936] mx-auto" />
          <p className="text-xs text-[#8B93A7]">No friends yet. Search for developers above and send a request.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#252936] bg-[#11131A] overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[#252936] px-5 py-3.5">
            <Users className="h-4 w-4 text-[#39FF14]" />
            <h3 className="text-sm font-bold text-[#F5F7FA]">Friends ({friends.length})</h3>
          </div>

          <div className="divide-y divide-[#252936]/60">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center justify-between px-5 py-3 hover:bg-[#181B24]/40 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#252936] bg-[#090A0F] text-xs font-bold text-[#00F0FF] overflow-hidden">
                    {friend.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={friend.image} alt={friend.displayName} className="h-full w-full object-cover" />
                    ) : (
                      friend.username.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <Link
                      href={`/profile/${friend.username}`}
                      className="text-xs font-semibold text-[#F5F7FA] hover:text-[#00F0FF] transition"
                    >
                      {friend.displayName}
                    </Link>
                    <p className="font-mono text-[10px] text-[#8B93A7]">@{friend.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-[11px] font-mono">
                  <div className="hidden sm:flex items-center gap-1 text-[#F59E0B]">
                    <Flame className="h-3 w-3" />
                    {friend.currentStreak}d
                  </div>
                  <div className="hidden sm:block text-[#8B93A7]">
                    {friend.solvedCount} solved
                  </div>
                  <div className="flex items-center gap-1 text-[#00F0FF]">
                    <Zap className="h-3 w-3" />
                    {friend.xp} XP
                  </div>
                  <button
                    onClick={() => handleFriendAction("remove", friend.id)}
                    disabled={actionLoadingId === friend.id}
                    title="Remove friend"
                    className="rounded border border-[#252936] p-1 text-[#5E667B] hover:border-[#FF4D6D]/40 hover:text-[#FF4D6D] disabled:opacity-40 transition"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outgoing Requests */}
      {outgoing.length > 0 && (
        <div className="rounded-xl border border-[#252936] bg-[#11131A] p-5 space-y-4">
          <h3 className="text-xs font-semibold text-[#8B93A7] uppercase tracking-wider">Sent Requests</h3>
          <div className="space-y-2">
            {outgoing.map((req) => {
              const receiver = req.receiver;
              if (!receiver) return null;
              return (
                <div
                  key={req.requestId}
                  className="flex items-center justify-between rounded-lg border border-[#252936] bg-[#181B24] px-3.5 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#252936] bg-[#090A0F] text-xs font-bold text-[#8B93A7]">
                      {receiver.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-[#F5F7FA]">{receiver.displayName}</span>
                      <p className="font-mono text-[10px] text-[#8B93A7]">@{receiver.username}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#5E667B]">Awaiting response</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
