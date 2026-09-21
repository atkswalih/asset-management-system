import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Check,
  Edit3,
  MessageSquare,
  Pencil,
  Plus,
  Send,
  Sparkles,
  Trash2,
  User,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

import api from "../services/api";

function AIAssistant() {
  const [conversations, setConversations] =
    useState([]);

  const [activeConversation, setActiveConversation] =
    useState(null);

  const [messages, setMessages] = useState([]);

  const [input, setInput] = useState("");

  const [loadingChats, setLoadingChats] =
    useState(true);

  /*
   * Object instead of one global loading boolean.
   *
   * Example:
   *
   * {
   *   5: true,
   *   8: true
   * }
   *
   * This allows each conversation to have
   * its own loading state.
   */
  const [loadingConversations, setLoadingConversations] =
    useState({});

  const [editingTitle, setEditingTitle] =
    useState(false);

  const [titleInput, setTitleInput] =
    useState("");

  const [editingMessageId, setEditingMessageId] =
    useState(null);

  const [editingMessageText, setEditingMessageText] =
    useState("");

  const chatRef = useRef(null);

  const inputRef = useRef(null);

  // =========================================
  // LOADING STATE HELPERS
  // =========================================

  const setConversationLoading = (
    conversationId,
    value,
  ) => {
    setLoadingConversations((current) => {
      const next = {
        ...current,
      };

      if (value) {
        next[conversationId] = true;
      } else {
        delete next[conversationId];
      }

      return next;
    });
  };

  const isConversationLoading = (
    conversationId,
  ) => {
    return Boolean(
      loadingConversations[conversationId],
    );
  };

  const isCurrentConversationLoading =
    activeConversation
      ? isConversationLoading(
          activeConversation.id,
        )
      : false;

  // =========================================
  // LOAD CONVERSATIONS
  // =========================================

  const loadConversations = async () => {
    try {
      setLoadingChats(true);

      const response = await api.get(
        "ai/conversations/",
      );

      const conversationList =
        response.data || [];

      setConversations(
        conversationList,
      );

      if (conversationList.length > 0) {
        await loadConversation(
          conversationList[0].id,
        );
      } else {
        await createConversation();
      }
    } catch (error) {
      console.error(
        "Conversation loading error:",
        error,
      );
    } finally {
      setLoadingChats(false);
    }
  };

  // =========================================
  // LOAD SINGLE CONVERSATION
  // =========================================

  const loadConversation = async (
    conversationId,
  ) => {
    try {
      const response = await api.get(
        `ai/conversations/${conversationId}/`,
      );

      setActiveConversation(
        response.data,
      );

      setMessages(
        response.data.messages || [],
      );

      setEditingMessageId(null);
      setEditingMessageText("");
      setEditingTitle(false);
    } catch (error) {
      console.error(
        "Conversation error:",
        error,
      );
    }
  };

  // =========================================
  // CREATE CONVERSATION
  // =========================================

  const createConversation = async () => {
    try {
      const response = await api.post(
        "ai/conversations/",
        {
          title: "New conversation",
        },
      );

      const conversation =
        response.data;

      setConversations((current) => [
        conversation,
        ...current,
      ]);

      setActiveConversation(
        conversation,
      );

      setMessages([]);

      setEditingMessageId(null);
      setEditingMessageText("");
      setEditingTitle(false);
    } catch (error) {
      console.error(
        "Create conversation error:",
        error,
      );
    }
  };

  // =========================================
  // DELETE CONVERSATION
  // =========================================

  const deleteConversation = async (
    conversationId,
  ) => {
    try {
      await api.delete(
        `ai/conversations/${conversationId}/`,
      );

      const remaining =
        conversations.filter(
          (conversation) =>
            conversation.id !==
            conversationId,
        );

      setConversations(remaining);

      if (
        activeConversation?.id ===
        conversationId
      ) {
        if (remaining.length > 0) {
          await loadConversation(
            remaining[0].id,
          );
        } else {
          await createConversation();
        }
      }
    } catch (error) {
      console.error(
        "Delete conversation error:",
        error,
      );
    }
  };

  // =========================================
  // START RENAME
  // =========================================

  const startRenameConversation = () => {
    if (!activeConversation) {
      return;
    }

    setTitleInput(
      activeConversation.title || "",
    );

    setEditingTitle(true);
  };

  // =========================================
  // CANCEL RENAME
  // =========================================

  const cancelRenameConversation = () => {
    setEditingTitle(false);
    setTitleInput("");
  };

  // =========================================
  // SAVE RENAME
  // =========================================

  const saveConversationTitle =
    async () => {
      if (!activeConversation) {
        return;
      }

      const title =
        titleInput.trim();

      if (!title) {
        return;
      }

      try {
        const response =
          await api.patch(
            `ai/conversations/${activeConversation.id}/`,
            {
              title,
            },
          );

        setActiveConversation(
          response.data,
        );

        setConversations(
          (current) =>
            current.map(
              (conversation) =>
                conversation.id ===
                activeConversation.id
                  ? response.data
                  : conversation,
            ),
        );

        setEditingTitle(false);
        setTitleInput("");
      } catch (error) {
        console.error(
          "Rename conversation error:",
          error,
        );
      }
    };

  // =========================================
  // SEND MESSAGE
  // =========================================

  const sendMessage = async (
    event,
  ) => {
    event.preventDefault();

    const question =
      input.trim();

    if (
      !question ||
      !activeConversation
    ) {
      return;
    }

    const conversationId =
      activeConversation.id;

    const temporaryMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: question,
    };

    /*
     * Show user message immediately.
     */
    setMessages((current) => [
      ...current,
      temporaryMessage,
    ]);

    setInput("");

    /*
     * Only THIS conversation gets
     * the loading state.
     */
    setConversationLoading(
      conversationId,
      true,
    );

    try {
      const response =
        await api.post(
          "ai/chat/",
          {
            conversation_id:
              conversationId,
            message: question,
          },
        );

      const assistantMessage =
        response.data.message;

      /*
       * Only update the visible chat if
       * the user is still looking at the
       * same conversation.
       *
       * This prevents Conversation A's
       * response from appearing in B.
       */
      if (
        activeConversation?.id ===
        conversationId
      ) {
        setMessages((current) => [
          ...current.filter(
            (message) =>
              message.id !==
              temporaryMessage.id,
          ),
          {
            ...temporaryMessage,
            id:
              response.data
                .user_message_id,
          },
          assistantMessage,
        ]);
      }

      /*
       * Refresh conversation so the
       * automatic title is updated.
       */
      const updatedConversation =
        await api.get(
          `ai/conversations/${conversationId}/`,
        );

      setConversations(
        (current) =>
          current.map(
            (conversation) =>
              conversation.id ===
              conversationId
                ? updatedConversation.data
                : conversation,
          ),
      );

      /*
       * Only replace the active conversation
       * if we're still viewing it.
       */
      if (
        activeConversation?.id ===
        conversationId
      ) {
        setActiveConversation(
          updatedConversation.data,
        );
      }
    } catch (error) {
      console.error(
        "Send message error:",
        error,
      );

      /*
       * Only show the error in the
       * conversation that generated it.
       */
      if (
        activeConversation?.id ===
        conversationId
      ) {
        setMessages((current) => [
          ...current,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content:
              error.response?.data
                ?.detail ||
              "The AI assistant is temporarily unavailable. Please try again.",
            error: true,
          },
        ]);
      }
    } finally {
      setConversationLoading(
        conversationId,
        false,
      );

      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  // =========================================
  // START MESSAGE EDIT
  // =========================================

  const startEditMessage = (
    message,
  ) => {
    if (
      isCurrentConversationLoading ||
      message.role !== "user"
    ) {
      return;
    }

    setEditingMessageId(
      message.id,
    );

    setEditingMessageText(
      message.content,
    );
  };

  // =========================================
  // CANCEL MESSAGE EDIT
  // =========================================

  const cancelEditMessage = () => {
    setEditingMessageId(null);
    setEditingMessageText("");
  };

  // =========================================
  // SAVE + RESEND MESSAGE
  // =========================================

  const saveEditedMessage =
    async () => {
      const editedText =
        editingMessageText.trim();

      if (
        !editedText ||
        !activeConversation ||
        !editingMessageId
      ) {
        return;
      }

      const conversationId =
        activeConversation.id;

      const messageId =
        editingMessageId;

      setConversationLoading(
        conversationId,
        true,
      );

      try {
        await api.post(
          "ai/chat/",
          {
            conversation_id:
              conversationId,
            message: editedText,
            edit_message_id:
              messageId,
          },
        );

        /*
         * Reload the conversation because
         * the backend removes the old
         * message + messages after it,
         * then generates a new response.
         */
        const updatedConversation =
          await api.get(
            `ai/conversations/${conversationId}/`,
          );

        /*
         * Only update the visible chat
         * if we're still on this conversation.
         */
        if (
          activeConversation?.id ===
          conversationId
        ) {
          setActiveConversation(
            updatedConversation.data,
          );

          setMessages(
            updatedConversation
              .data.messages || [],
          );
        }

        setConversations(
          (current) =>
            current.map(
              (conversation) =>
                conversation.id ===
                conversationId
                  ? updatedConversation.data
                  : conversation,
            ),
        );

        setEditingMessageId(null);
        setEditingMessageText("");
      } catch (error) {
        console.error(
          "Edit message error:",
          error,
        );

        if (
          activeConversation?.id ===
          conversationId
        ) {
          setMessages((current) => [
            ...current,
            {
              id: `error-${Date.now()}`,
              role: "assistant",
              content:
                error.response?.data
                  ?.detail ||
                "The edited message could not be sent. Please try again.",
              error: true,
            },
          ]);
        }
      } finally {
        setConversationLoading(
          conversationId,
          false,
        );
      }
    };

  // =========================================
  // INITIAL LOAD
  // =========================================

  useEffect(() => {
    loadConversations();
  }, []);

  // =========================================
  // AUTO SCROLL
  // =========================================

  useEffect(() => {
    const chat =
      chatRef.current;

    if (!chat) {
      return;
    }

    chat.scrollTo({
      top: chat.scrollHeight,
      behavior: "smooth",
    });
  }, [
    messages,
    isCurrentConversationLoading,
  ]);

  // =========================================
  // TITLE KEYBOARD
  // =========================================

  const handleTitleKeyDown = (
    event,
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();

      saveConversationTitle();
    }

    if (event.key === "Escape") {
      event.preventDefault();

      cancelRenameConversation();
    }
  };

  // =========================================
  // EDIT KEYBOARD
  // =========================================

  const handleEditKeyDown = (
    event,
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      saveEditedMessage();
    }

    if (event.key === "Escape") {
      event.preventDefault();

      cancelEditMessage();
    }
  };

  // =========================================
  // LOADING PAGE
  // =========================================

  if (loadingChats) {
    return (
      <div className="page-content ai-page">
        <div className="ai-loading-page">
          Loading conversations...
        </div>
      </div>
    );
  }

  // =========================================
  // PAGE
  // =========================================

  return (
    <div className="page-content ai-page">
      {/* =====================================
          PAGE HEADER
      ===================================== */}

      <div className="page-header">
        <div>
          <div className="page-title-row">
            <div className="ai-title-icon">
              <Sparkles size={20} />
            </div>

            <div>
              <h1>
                AI Assistant
              </h1>

              <p>
                Ask questions about your
                asset management data.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================
          WORKSPACE
      ===================================== */}

      <div className="ai-workspace">
        {/* ===================================
            CONVERSATION SIDEBAR
        =================================== */}

        <aside className="ai-history">
          <div className="ai-history-header">
            <span>
              Conversations
            </span>

            <button
              type="button"
              onClick={
                createConversation
              }
              title="New conversation"
            >
              <Plus size={17} />
            </button>
          </div>

          <div className="ai-history-list">
            {conversations.map(
              (conversation) => (
                <div
                  key={
                    conversation.id
                  }
                  className={`ai-history-item ${
                    activeConversation?.id ===
                    conversation.id
                      ? "active"
                      : ""
                  }`}
                >
                  <button
                    type="button"
                    className="ai-history-select"
                    onClick={() =>
                      loadConversation(
                        conversation.id,
                      )
                    }
                  >
                    <MessageSquare
                      size={16}
                    />

                    <span>
                      {
                        conversation.title
                      }
                    </span>
                  </button>

                  <button
                    type="button"
                    className="ai-history-delete"
                    onClick={() =>
                      deleteConversation(
                        conversation.id,
                      )
                    }
                    title="Delete conversation"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ),
            )}
          </div>
        </aside>

        {/* ===================================
            CHAT
        =================================== */}

        <section className="ai-card">
          {/* CHAT TITLE */}

          <div className="ai-chat-header">
            <div className="ai-chat-title">
              {editingTitle ? (
                <div className="ai-title-edit">
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(
                      event,
                    ) =>
                      setTitleInput(
                        event.target
                          .value,
                      )
                    }
                    onKeyDown={
                      handleTitleKeyDown
                    }
                    maxLength={200}
                    autoFocus
                  />

                  <button
                    type="button"
                    onClick={
                      saveConversationTitle
                    }
                    title="Save name"
                  >
                    <Check size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={
                      cancelRenameConversation
                    }
                    title="Cancel"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <span>
                    {activeConversation?.title ||
                      "New conversation"}
                  </span>

                  <button
                    type="button"
                    onClick={
                      startRenameConversation
                    }
                    title="Rename conversation"
                  >
                    <Pencil size={14} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* =================================
              CHAT AREA
          ================================= */}

          <div
            className="ai-chat"
            ref={chatRef}
          >
            {messages.length === 0 && (
              <div className="ai-empty-state">
                <div className="ai-empty-icon">
                  <Sparkles size={24} />
                </div>

                <h2>
                  How can I help?
                </h2>

                <p>
                  Ask me about your assets,
                  inventory, assignments,
                  or repair tickets.
                </p>
              </div>
            )}

            {messages.map(
              (
                message,
                index,
              ) => {
                const isEditing =
                  editingMessageId ===
                  message.id;

                return (
                  <div
                    key={
                      message.id ||
                      `message-${index}`
                    }
                    className={`ai-message ${
                      message.role ===
                      "user"
                        ? "user-message"
                        : "assistant-message"
                    }`}
                  >
                    {/* AVATAR */}

                    <div className="ai-message-avatar">
                      {message.role ===
                      "user" ? (
                        <User size={16} />
                      ) : (
                        <Bot size={16} />
                      )}
                    </div>

                    {/* MESSAGE */}

                    <div className="ai-message-body">
                      {isEditing ? (
                        <div className="ai-edit-box">
                          <textarea
                            value={
                              editingMessageText
                            }
                            onChange={(
                              event,
                            ) =>
                              setEditingMessageText(
                                event
                                  .target
                                  .value,
                              )
                            }
                            onKeyDown={
                              handleEditKeyDown
                            }
                            maxLength={2000}
                            autoFocus
                          />

                          <div className="ai-edit-actions">
                            <button
                              type="button"
                              onClick={
                                cancelEditMessage
                              }
                            >
                              Cancel
                            </button>

                            <button
                              type="button"
                              onClick={
                                saveEditedMessage
                              }
                              disabled={
                                !editingMessageText.trim() ||
                                isCurrentConversationLoading
                              }
                            >
                              <Send size={14} />

                              Resend
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div
                            className={`ai-message-content ${
                              message.error
                                ? "ai-message-error"
                                : ""
                            }`}
                          >
                            {message.role ===
                              "assistant" &&
                            !message.error ? (
                              <ReactMarkdown>
                                {
                                  message.content
                                }
                              </ReactMarkdown>
                            ) : (
                              message.content
                            )}
                          </div>

                          {message.role ===
                            "user" &&
                            !message.error && (
                              <button
                                type="button"
                                className="ai-edit-message"
                                onClick={() =>
                                  startEditMessage(
                                    message,
                                  )
                                }
                                title="Edit message"
                              >
                                <Edit3
                                  size={13}
                                />
                              </button>
                            )}
                        </>
                      )}
                    </div>
                  </div>
                );
              },
            )}

            {/* =================================
                CONVERSATION-SPECIFIC TYPING
            ================================= */}

            {isCurrentConversationLoading && (
              <div className="ai-message assistant-message">
                <div className="ai-message-avatar">
                  <Bot size={16} />
                </div>

                <div className="ai-message-content ai-loading">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
          </div>

          {/* =================================
              INPUT
          ================================= */}

          <form
            className="ai-input-form"
            onSubmit={sendMessage}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(event) =>
                setInput(
                  event.target.value,
                )
              }
              placeholder="Ask about your assets..."
              maxLength={2000}
              disabled={
                isCurrentConversationLoading ||
                !activeConversation
              }
            />

            <button
              type="submit"
              disabled={
                isCurrentConversationLoading ||
                !input.trim() ||
                !activeConversation
              }
              aria-label="Send message"
            >
              <Send size={17} />
            </button>
          </form>

          <div className="ai-disclaimer">
            AI can make mistakes. Check
            important information.
          </div>
        </section>
      </div>
    </div>
  );
}

export default AIAssistant;