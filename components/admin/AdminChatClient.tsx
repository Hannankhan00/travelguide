"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { getPusherClient } from "@/lib/pusher";
import {
  MessageCircle, Send, Loader2, CheckCheck, CheckCircle2, Circle, User,
} from "lucide-react";
import {
  getConversationMessages,
  sendAdminMessage,
  resolveConversation,
  adminMarkRead,
} from "@/app/(admin)/admin/chat/actions";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ConversationSummary {
  id:            string;
  status:        string;
  lastMessageAt: string;
  createdAt:     string;
  bookingRef:    string | null;
  tourTitle:     string;
  customerName:  string;
  customerEmail: string | null;
  lastMessage:   { content: string; senderRole: string; createdAt: string; isRead: boolean } | null;
  unreadCount:   number;
}

interface Message {
  id:         string;
  senderName: string;
  senderRole: string;
  content:    string;
  createdAt:  string;
  isRead:     boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  return isToday
    ? d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtFull(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// ── Thread view ───────────────────────────────────────────────────────────────

function ThreadPanel({ convo }: { convo: ConversationSummary }) {
  const [messages,  setMessages]  = useState<Message[]>([]);
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(true);
  const [sending,   startSend]    = useTransition();
  const [resolving, startResolve] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  function mergeMessages(prev: Message[], incoming: Message[]) {
    const ids = new Set(prev.map((m) => m.id));
    const fresh = incoming.filter((m) => !ids.has(m.id));
    return fresh.length ? [...prev, ...fresh] : prev;
  }

  useEffect(() => {
    setLoading(true);
    setMessages([]);

    getConversationMessages(convo.id).then((msgs) => {
      setMessages(msgs as unknown as Message[]);
      setLoading(false);
      adminMarkRead(convo.id);
    });

    const channelName = `conversation-${convo.id}`;
    const channel = getPusherClient().subscribe(channelName);

    channel.bind("new_message", (msg: Message) => {
      setMessages((prev) => mergeMessages(prev, [msg]));
      if (msg.senderRole !== "ADMIN") adminMarkRead(convo.id);
    });

    return () => { getPusherClient().unsubscribe(channelName); };
  }, [convo.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    startSend(async () => {
      const res = await sendAdminMessage(convo.id, text);
      if ("message" in res && res.message) {
        const m = res.message as unknown as Message;
        setMessages((prev) => mergeMessages(prev, [m]));
      }
    });
  }

  function handleResolve() {
    startResolve(async () => { await resolveConversation(convo.id); });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="px-5 py-3.5 border-b border-[#E4E0D9] bg-white flex items-center justify-between shrink-0">
        <div>
          <p className="font-bold text-[#111] text-sm">{convo.customerName}</p>
          <p className="text-xs text-[#7A746D] truncate max-w-72">{convo.tourTitle}</p>
          {convo.bookingRef && (
            <p className="text-[10px] font-mono text-[#A8A29E]">{convo.bookingRef}</p>
          )}
        </div>
        {convo.status === "OPEN" && (
          <button
            onClick={handleResolve}
            disabled={resolving}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#15803D] border border-[#DCFCE7] bg-[#F0FDF4] hover:bg-[#DCFCE7] px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
          >
            <CheckCircle2 className="size-3.5" />
            Mark resolved
          </button>
        )}
        {convo.status === "RESOLVED" && (
          <span className="text-xs font-semibold text-[#15803D] bg-[#DCFCE7] px-2.5 py-1 rounded-full">Resolved</span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-[#F8F7F5]">
        {loading && (
          <div className="flex justify-center pt-10">
            <Loader2 className="size-5 text-[#A8A29E] animate-spin" />
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div className="text-center pt-10">
            <MessageCircle className="size-8 text-[#D4CFCA] mx-auto mb-2" />
            <p className="text-sm text-[#A8A29E]">No messages yet. Say hello!</p>
          </div>
        )}
        {messages.map((msg) => {
          const isAdmin = msg.senderRole === "ADMIN";
          return (
            <div key={msg.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[72%] flex flex-col gap-0.5 ${isAdmin ? "items-end" : "items-start"}`}>
                {!isAdmin && (
                  <p className="text-[10px] font-semibold text-[#7A746D] px-1">{msg.senderName}</p>
                )}
                <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed
                  ${isAdmin
                    ? "bg-[#1B2847] text-white rounded-br-sm"
                    : "bg-white text-[#111] border border-[#E4E0D9] rounded-bl-sm shadow-sm"
                  }`}
                >
                  {msg.content}
                </div>
                <div className={`flex items-center gap-1 px-1 ${isAdmin ? "justify-end" : ""}`}>
                  <p className="text-[10px] text-[#A8A29E]">{fmtFull(msg.createdAt)}</p>
                  {isAdmin && msg.isRead && <CheckCheck className="size-3 text-[#A8A29E]" />}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-[#E4E0D9] bg-white flex items-end gap-2 shrink-0">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Reply to customer…"
          rows={1}
          disabled={sending}
          className="flex-1 resize-none text-sm text-[#111] bg-[#F8F7F5] border border-[#E4E0D9] rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1B2847]/30 focus:border-[#1B2847] transition placeholder-[#B0AAA3] disabled:opacity-50"
          style={{ maxHeight: 120 }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="w-9 h-9 rounded-xl bg-[#1B2847] hover:bg-[#141f38] disabled:opacity-40 flex items-center justify-center transition-colors shrink-0"
        >
          {sending
            ? <Loader2 className="size-4 text-white animate-spin" />
            : <Send className="size-4 text-white" />
          }
        </button>
      </div>
    </div>
  );
}

// ── Main client component ─────────────────────────────────────────────────────

export function AdminChatClient({ conversations }: { conversations: ConversationSummary[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(
    conversations.length > 0 ? conversations[0].id : null
  );

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="flex h-full bg-white rounded-xl border border-[#E4E0D9] overflow-hidden">

      {/* ── Conversation list ── */}
      <div className="w-72 shrink-0 border-r border-[#E4E0D9] flex flex-col">
        <div className="px-4 py-3 border-b border-[#E4E0D9] shrink-0">
          <p className="text-xs font-bold uppercase tracking-widest text-[#7A746D]">
            Conversations ({conversations.length})
          </p>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-[#E4E0D9]">
          {conversations.length === 0 && (
            <div className="py-12 text-center text-sm text-[#A8A29E]">No conversations yet.</div>
          )}
          {conversations.map((c) => {
            const isSelected = selectedId === c.id;
            const hasUnread  = c.unreadCount > 0;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full text-left px-4 py-3.5 transition-colors
                  ${isSelected ? "bg-[#F0F3FA] border-l-2 border-[#1B2847]" : "hover:bg-[#F8F7F5]"}`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-[#E4E0D9] flex items-center justify-center shrink-0">
                      <User className="size-3.5 text-[#7A746D]" />
                    </div>
                    <p className="text-sm font-semibold text-[#111] truncate">{c.customerName}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {hasUnread && (
                      <span className="w-4 h-4 rounded-full bg-[#C41230] text-white text-[10px] font-bold flex items-center justify-center">
                        {c.unreadCount}
                      </span>
                    )}
                    <p className="text-[10px] text-[#A8A29E]">{fmtTime(c.lastMessageAt)}</p>
                  </div>
                </div>
                <p className="text-xs text-[#7A746D] truncate pl-9">{c.tourTitle}</p>
                {c.lastMessage && (
                  <p className={`text-xs truncate pl-9 mt-0.5 ${hasUnread ? "text-[#111] font-medium" : "text-[#A8A29E]"}`}>
                    {c.lastMessage.senderRole === "ADMIN" ? "You: " : ""}{c.lastMessage.content}
                  </p>
                )}
                <div className="pl-9 mt-1.5">
                  {c.status === "RESOLVED" ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-[#15803D]">
                      <Circle className="size-2 fill-[#15803D]" /> Resolved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] text-[#C41230]">
                      <Circle className="size-2 fill-[#C41230]" /> Open
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Thread panel ── */}
      <div className="flex-1 min-w-0">
        {selected ? (
          <ThreadPanel key={selected.id} convo={selected} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <MessageCircle className="size-10 text-[#D4CFCA]" />
            <p className="text-sm text-[#A8A29E]">Select a conversation to view messages.</p>
          </div>
        )}
      </div>

    </div>
  );
}
