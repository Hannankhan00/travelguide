"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { getPusherClient } from "@/lib/pusher";
import { X, Send, Loader2, MessageCircle, CheckCheck } from "lucide-react";
import {
  getOrCreateConversation,
  sendCustomerMessage,
  markConversationRead,
} from "@/app/(public)/bookings/chat-actions";

interface Message {
  id:         string;
  senderName: string;
  senderRole: string;
  content:    string;
  createdAt:  string;
  isRead:     boolean;
}

interface Props {
  bookingId: string;
  tourTitle: string;
  onClose:   () => void;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function ChatPopup({ bookingId, tourTitle, onClose }: Props) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages,       setMessages]       = useState<Message[]>([]);
  const [input,          setInput]          = useState("");
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [sending,        startSend]         = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  function mergeMessages(prev: Message[], incoming: Message[]) {
    const ids = new Set(prev.map((m) => m.id));
    const fresh = incoming.filter((m) => !ids.has(m.id));
    return fresh.length ? [...prev, ...fresh] : prev;
  }

  // Load conversation + set up socket
  useEffect(() => {
    let channelName: string | null = null;

    getOrCreateConversation(bookingId).then((res) => {
      if ("error" in res && res.error) { setError(res.error); setLoading(false); return; }
      if (!("conversation" in res) || !res.conversation) { setLoading(false); return; }

      const convo = res.conversation;
      setConversationId(convo.id);
      setMessages(convo.messages);
      markConversationRead(convo.id, "CUSTOMER");
      setLoading(false);

      channelName = `conversation-${convo.id}`;
      const channel = getPusherClient().subscribe(channelName);

      channel.bind("new_message", (msg: Message) => {
        setMessages((prev) => mergeMessages(prev, [msg]));
        if (msg.senderRole !== "CUSTOMER") markConversationRead(convo.id, "CUSTOMER");
      });
    });

    return () => { if (channelName) getPusherClient().unsubscribe(channelName); };
  }, [bookingId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    if (!input.trim() || !conversationId) return;
    const text = input.trim();
    setInput("");
    startSend(async () => {
      const res = await sendCustomerMessage(conversationId, text);
      if ("message" in res && res.message) {
        setMessages((prev) => mergeMessages(prev, [res.message]));
      }
    });
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-90 max-w-[calc(100vw-24px)] flex flex-col bg-white rounded-2xl shadow-2xl border border-[#E4E0D9] overflow-hidden">

      {/* Header */}
      <div className="bg-[#1B2847] px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#C41230] flex items-center justify-center">
            <MessageCircle className="size-4 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Chat with your guide</p>
            <p className="text-white/50 text-[11px] truncate max-w-48">{tourTitle}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
          <X className="size-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="overflow-y-auto px-4 py-4 space-y-3 bg-[#F8F7F5]" style={{ minHeight: 300, maxHeight: 380 }}>
        {loading && (
          <div className="flex justify-center pt-8">
            <Loader2 className="size-5 text-[#A8A29E] animate-spin" />
          </div>
        )}
        {error && <p className="text-xs text-[#DC2626] text-center">{error}</p>}

        {!loading && messages.length === 0 && (
          <div className="text-center pt-8 space-y-2">
            <MessageCircle className="size-8 text-[#D4CFCA] mx-auto" />
            <p className="text-sm text-[#A8A29E]">No messages yet.</p>
            <p className="text-xs text-[#B0AAA3]">Send a message and your guide will reply shortly.</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.senderRole === "CUSTOMER";
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] flex flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}>
                {!isMe && (
                  <p className="text-[10px] font-semibold text-[#7A746D] px-1">{msg.senderName}</p>
                )}
                <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed
                  ${isMe
                    ? "bg-[#C41230] text-white rounded-br-sm"
                    : "bg-white text-[#111] border border-[#E4E0D9] rounded-bl-sm shadow-sm"
                  }`}
                >
                  {msg.content}
                </div>
                <div className={`flex items-center gap-1 px-1 ${isMe ? "justify-end" : ""}`}>
                  <p className="text-[10px] text-[#A8A29E]">{fmtTime(msg.createdAt)}</p>
                  {isMe && msg.isRead && <CheckCheck className="size-3 text-[#A8A29E]" />}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-[#E4E0D9] bg-white flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Type a message…"
          rows={1}
          disabled={!conversationId || sending}
          className="flex-1 resize-none text-sm text-[#111] bg-[#F8F7F5] border border-[#E4E0D9] rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#C41230]/30 focus:border-[#C41230] transition placeholder-[#B0AAA3] disabled:opacity-50"
          style={{ maxHeight: 100 }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || !conversationId || sending}
          className="w-9 h-9 rounded-xl bg-[#C41230] hover:bg-[#a50f28] disabled:opacity-40 flex items-center justify-center transition-colors shrink-0"
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
