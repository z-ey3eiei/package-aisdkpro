"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useMemo, useRef, useState, type FormEvent } from "react";

const MAX_KEY_LENGTH = 512;
const printableKey = /^[\x21-\x7e]+$/;

export default function Chat() {
  const [apiKey, setApiKey] = useState("");
  const [connected, setConnected] = useState(false);
  const [connectionNote, setConnectionNote] = useState(
    "Add a key, then connect. Connecting does not call OpenAI."
  );
  const [input, setInput] = useState("");
  const activeKey = useRef<string | null>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages }) => ({
          body: {
            messages,
            byok: activeKey.current ? { apiKey: activeKey.current } : undefined,
          },
        }),
      }),
    []
  );

  const {
    messages,
    sendMessage,
    status: chatStatus,
    stop,
    error,
    regenerate,
    setMessages,
    clearError,
  } = useChat({ transport });
  const busy = chatStatus === "submitted" || chatStatus === "streaming";

  function changeKey(value: string) {
    setApiKey(value);
    if (connected) {
      activeKey.current = null;
      setConnected(false);
      setConnectionNote("Key changed. Connect again before sending.");
      stop();
    }
  }

  function connect() {
    const candidate = apiKey.trim();
    if (
      candidate.length < 16 ||
      candidate.length > MAX_KEY_LENGTH ||
      !printableKey.test(candidate)
    ) {
      setConnectionNote("Enter a valid-looking OpenAI key. No provider was contacted.");
      setConnected(false);
      activeKey.current = null;
      return;
    }
    activeKey.current = candidate;
    setConnected(true);
    setConnectionNote("Ready. The key stays in this page and request memory only.");
    clearError();
  }

  function forget() {
    stop();
    activeKey.current = null;
    setConnected(false);
    setApiKey("");
    setConnectionNote("Key forgotten. Nothing was saved or verified.");
    clearError();
  }

  async function send(text: string) {
    const value = text.trim();
    if (!value || !connected || busy) return;
    setInput("");
    clearError();
    await sendMessage({ text: value });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(input);
  }

  return (
    <main className="shell">
      <div className="eyebrow">AI SDK 6 / runnable starter</div>
      <h1>Streaming Chat</h1>
      <p className="lede">
        A real UI message stream using an official OpenAI provider, one safe time
        tool, and a bounded ToolLoopAgent. Bring your own key to try it.
      </p>

      <section className="panel" aria-labelledby="key-heading">
        <h2 id="key-heading">OpenAI BYOK</h2>
        <p className="note">
          The masked key is kept in React memory only. This starter never stores
          it in cookies, local storage, URLs, logs, or message parts.
        </p>
        <div className="key-row">
          <input
            className="key-input"
            type="password"
            value={apiKey}
            onChange={(event) => changeKey(event.target.value)}
            placeholder="sk-..."
            autoComplete="off"
            spellCheck={false}
            aria-label="OpenAI API key"
          />
          <button className="primary" type="button" onClick={connect}>
            Connect in memory
          </button>
          <button className="secondary" type="button" onClick={forget}>
            Forget
          </button>
        </div>
        <p className={`status${connected ? " ready" : ""}`} role="status">
          {connectionNote}
        </p>
      </section>

      <section className="panel" aria-label="Conversation">
        <div className="chat" aria-live="polite">
          {messages.length === 0 && (
            <p className="note">
              Try: “What time is it in Asia/Bangkok, and explain the tool result?”
            </p>
          )}
          {messages.map((message) => (
            <article className={`message ${message.role}`} key={message.id}>
              <div className="message-meta">{message.role}</div>
              {message.parts.map((part, index) =>
                part.type === "text" ? (
                  <span key={index}>{part.text}</span>
                ) : (
                  <div className="tool" key={index}>
                    Tool activity: {part.type}
                  </div>
                )
              )}
            </article>
          ))}
        </div>
        {error && (
          <div className="error" role="alert">
            The request could not be completed. Check the key and try again.
            <button className="secondary" type="button" onClick={() => void regenerate()}>
              Retry
            </button>
          </div>
        )}
        <form className="composer" onSubmit={submit}>
          <div className="composer-row">
            <textarea
              className="composer-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={connected ? "Ask the agent something..." : "Connect a key to start"}
              rows={2}
              maxLength={12000}
              disabled={!connected || busy}
              aria-label="Message"
            />
            {busy ? (
              <button className="stop" type="button" onClick={stop}>
                Stop
              </button>
            ) : (
              <button className="primary" type="submit" disabled={!connected || !input.trim()}>
                Send
              </button>
            )}
          </div>
        </form>
      </section>

      <p className="note">
        Fixed model: <code>gpt-5-mini</code>. Tool time zones: UTC, Asia/Bangkok,
        or America/New_York. OpenAI usage is billed to the key owner.
      </p>
      <button className="secondary" type="button" onClick={() => setMessages([])}>
        New chat
      </button>
    </main>
  );
}
