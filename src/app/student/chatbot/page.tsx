"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./index.module.css";

import { postJson, getJson, patchJson, deleteJson } from "@/src/lib/api/http";
import { PUBLIC_API_BASE_URL } from "@/src/lib/api/config";

import {
  Send,
  Bot,
  User,
  Settings,
  Loader2,
  Plus,
  MessageSquare,
  Pencil,
  Trash2,
  Check,
  X as XIcon,
} from "lucide-react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/* =========================
   TYPES
========================= */

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  confidence_score?: number;
  sources?: string[];
}

interface ChatSession {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface ChatReply {
  reply: string;
  confidence_score?: number;
  sources?: string[];
  session_id?: string;
}

/* =========================
   HELPERS
========================= */

function formatSources(sources?: string[]): string {
  const list = (sources || []).filter(Boolean);

  if (!list.length) return "";

  const compact = list.map((s) => {
    const parts = s
      .split("›")
      .map((p) => p.trim())
      .filter(Boolean);

    if (parts.length >= 2) {
      return `${parts[parts.length - 2]}, ${parts[parts.length - 1]
        }`;
    }

    return parts[0] || s;
  });

  return [...new Set(compact)].slice(0, 2).join(" | ");
}

/* =========================
   COMPONENT
========================= */

export default function ChatbotPage() {
  const [input, setInput] = useState<string>("");

  const [messages, setMessages] = useState<Message[]>([]);

  const [loading, setLoading] = useState<boolean>(false);

  const [sessions, setSessions] = useState<ChatSession[]>([]);

  const [currentSession, setCurrentSession] =
    useState<string | null>(null);

  const [creatingSession, setCreatingSession] =
    useState<boolean>(false);

  const [mutatingSession, setMutatingSession] =
    useState<boolean>(false);

  const [editingSessionId, setEditingSessionId] =
    useState<string | null>(null);

  const [editingTitle, setEditingTitle] =
    useState<string>("");

  const scrollRef = useRef<HTMLDivElement>(null);

  /* =========================
     EFFECTS
  ========================= */

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (sessions.length > 0 && !currentSession) {
      setCurrentSession(sessions[0].id);
    }
  }, [sessions, currentSession]);

  useEffect(() => {
    if (currentSession) {
      loadMessages(currentSession);
    } else {
      setMessages([]);
    }
  }, [currentSession]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  /* =========================
     SCROLL
  ========================= */

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    });
  };

  /* =========================
     API
  ========================= */

  const loadSessions = async () => {
    try {
      const apiUrl = `${PUBLIC_API_BASE_URL}chat/sessions`;

      const res = await getJson<
        ApiResponse<{
          sessions: ChatSession[];
        }>
      >(apiUrl);

      if (res.success && res.data?.sessions) {
        setSessions(res.data.sessions);
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const apiUrl = `${PUBLIC_API_BASE_URL}chat/sessions/${sessionId}/messages`;

      const res = await getJson<
        ApiResponse<{ messages: Message[] }>
      >(apiUrl);

      if (res.success && res.data?.messages) {
        setMessages(res.data.messages);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const createNewSession = async () => {
    if (creatingSession) return;

    setCreatingSession(true);

    try {
      const apiUrl = `${PUBLIC_API_BASE_URL}chat/sessions`;

      const res = await postJson<
        ApiResponse<{
          session_id: string;
        }>
      >(apiUrl, {});

      if (res.success && res.data?.session_id) {
        setCurrentSession(res.data.session_id);

        setMessages([
          {
            role: "assistant",
            content: `# Xin chào

Tôi là **Uni AI Assistant**.

Tôi có thể hỗ trợ bạn:

- Lộ trình học tập
- Cảnh báo học vụ
- Quy chế đào tạo
- Tư vấn môn học

Hãy đặt câu hỏi để bắt đầu.`,
          },
        ]);

        loadSessions();
      }
    } catch (error) {
      console.error("Failed to create session:", error);
    } finally {
      setCreatingSession(false);
    }
  };

  const renameSession = async (session: ChatSession) => {
    if (mutatingSession) return;
    setMutatingSession(true);
    try {
      const apiUrl = `${PUBLIC_API_BASE_URL}chat/sessions/${session.id}`;
      await patchJson<ApiResponse<{ session_id: string; title: string | null }>>(apiUrl, {
        title: editingTitle.trim() || null,
      });
      await loadSessions();
    } catch (error) {
      console.error("Failed to rename session:", error);
    } finally {
      setMutatingSession(false);
      setEditingSessionId(null);
    }
  };

  const deleteSession = async (session: ChatSession) => {
    if (mutatingSession) return;
    setMutatingSession(true);
    try {
      const apiUrl = `${PUBLIC_API_BASE_URL}chat/sessions/${session.id}`;
      await deleteJson<ApiResponse<{ deleted: boolean }>>(apiUrl);
      if (currentSession === session.id) {
        setCurrentSession(null);
        setMessages([]);
      }
      await loadSessions();
    } catch (error) {
      console.error("Failed to delete session:", error);
    } finally {
      setMutatingSession(false);
    }
  };

  const deleteMessage = async (sessionId: string, messageId: string) => {
    try {
      const apiUrl = `${PUBLIC_API_BASE_URL}chat/sessions/${sessionId}/messages/${messageId}`;
      await deleteJson<ApiResponse<{ deleted: boolean }>>(apiUrl);
      await loadMessages(sessionId);
      await loadSessions();
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  const handleSend = async (
    text: string = input
  ) => {
    if (!text.trim() || loading) return;

    const userMsg = text.trim();

    setInput("");

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMsg,
      },
    ]);

    setLoading(true);

    try {
      const apiUrl = `${PUBLIC_API_BASE_URL}chat`;

      const history = messages
        .slice(-6)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await postJson<
        ApiResponse<ChatReply>
      >(apiUrl, {
        message: userMsg,
        history,
        session_id: currentSession,
      });

      if (res.success && res.data) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: res.data.reply,
            confidence_score:
              res.data.confidence_score,
            sources: res.data.sources,
          },
        ]);

        if (
          res.data.session_id &&
          !currentSession
        ) {
          setCurrentSession(
            res.data.session_id
          );

          loadSessions();
        }
      }
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : "Không thể kết nối AI server";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: msg,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     RENDER
  ========================= */

  return (
    <div className={styles.chatContainer}>
      {/* SIDEBAR */}

      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <button
            className={styles.newChatBtn}
            onClick={createNewSession}
            disabled={creatingSession}
          >
            <Plus size={16} />

            {creatingSession
              ? "Đang tạo..."
              : "Hội thoại mới"}
          </button>
        </div>

        <div className={styles.historyScroll}>
          <p className={styles.groupLabel}>
            Lịch sử hội thoại
          </p>

          {sessions.map((session) => (
            <div
              key={session.id}
              className={
                currentSession === session.id
                  ? styles.historyCardActive
                  : styles.historyCard
              }
              onClick={() =>
                setCurrentSession(session.id)
              }
            >
              <MessageSquare size={14} />

              {editingSessionId === session.id ? (
                <div style={{ flex: 1, display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") renameSession(session);
                      if (e.key === "Escape") setEditingSessionId(null);
                    }}
                    style={{
                      flex: 1,
                      height: 34,
                      borderRadius: 10,
                      border: "1px solid rgba(226, 232, 240, 0.9)",
                      padding: "0 10px",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      outline: "none",
                    }}
                    placeholder="Tên phiên..."
                  />
                  <button
                    className={styles.sessionActionBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      renameSession(session);
                    }}
                    title="Lưu"
                    disabled={mutatingSession}
                  >
                    <Check size={14} />
                  </button>
                  <button
                    className={styles.sessionActionBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingSessionId(null);
                    }}
                    title="Hủy"
                    disabled={mutatingSession}
                  >
                    <XIcon size={14} />
                  </button>
                </div>
              ) : (
                <span style={{ flex: 1 }}>
                  {session.title ||
                    `Chat ${new Date(
                      session.created_at
                    ).toLocaleDateString()}`}
                </span>
              )}

              <div className={styles.sessionActions}>
                <button
                  className={styles.sessionActionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingSessionId(session.id);
                    setEditingTitle(session.title || "");
                  }}
                  title="Đổi tên"
                  disabled={mutatingSession}
                >
                  <Pencil size={14} />
                </button>
                <button
                  className={styles.sessionActionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session);
                  }}
                  title="Xóa phiên"
                  disabled={mutatingSession}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* MAIN */}

      <main className={styles.mainChat}>
        <header className={styles.chatHeader}>
          <div className={styles.aiInfo}>
            <div className={styles.aiAvatar}>
              <Bot size={18} />
            </div>

            <div>
              <h3>Uni AI Assistant</h3>

              <span className={styles.status}>
                {loading
                  ? "Đang trả lời..."
                  : "Trực tuyến"}
              </span>
            </div>
          </div>

          {/*  */}
        </header>

        {/* MESSAGES */}

        <div
          className={styles.messageArea}
          ref={scrollRef}
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              className={
                msg.role === "assistant"
                  ? styles.botRow
                  : styles.userRow
              }
            >
              <div className={styles.avatarPill}>
                {msg.role === "assistant" ? (
                  <Bot size={15} />
                ) : (
                  <User size={15} />
                )}
              </div>

              <div>
                <div className={styles.bubble}>
                  {currentSession && msg.id ? (
                    <div className={styles.messageActions}>
                      <button
                        className={styles.messageActionBtn}
                        onClick={() => deleteMessage(currentSession, msg.id!)}
                        title="Xóa tin nhắn"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : null}
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {msg.role === "assistant" &&
                  typeof msg.confidence_score ===
                  "number" &&
                  msg.sources?.length ? (
                  <div className={styles.metaInfo}>
                    Độ tin cậy{" "}
                    {msg.confidence_score}% •{" "}
                    {formatSources(
                      msg.sources
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          ))}

          {loading && (
            <div className={styles.botRow}>
              <div className={styles.avatarPill}>
                <Loader2
                  size={15}
                  className={styles.spinner}
                />
              </div>

              <div className={styles.loadingBubble}>
                AI đang phân tích dữ liệu...
              </div>
            </div>
          )}
        </div>

        {/* INPUT */}

        <div className={styles.inputArea}>
          <div className={styles.suggestGrid}>
            <button
              className={styles.chip}
              onClick={() =>
                handleSend("Lộ trình học")
              }
            >
              Lộ trình học
            </button>

            <button
              className={styles.chip}
              onClick={() =>
                handleSend("Quy chế cấm thi")
              }
            >
              Quy chế cấm thi
            </button>

            <button
              className={styles.chip}
              onClick={() =>
                handleSend(
                  "Quy chế vắng mặt"
                )
              }
            >
              Quy chế vắng mặt
            </button>
          </div>

          <div className={styles.inputWrapper}>
            <input
              type="text"
              value={input}
              placeholder="Nhập câu hỏi..."
              onChange={(e) =>
                setInput(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSend();
                }
              }}
            />

            <button
              className={styles.sendBtn}
              onClick={() => handleSend()}
              disabled={
                loading || !input.trim()
              }
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
