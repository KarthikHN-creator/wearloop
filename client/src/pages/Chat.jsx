import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";

function Chat() {
  const { swapRequestId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const storedUser = localStorage.getItem("user");

  let currentUser = null;

  try {
    currentUser = storedUser
      ? JSON.parse(storedUser)
      : null;
  } catch {
    currentUser = null;
  }

  const currentUserId =
    currentUser?._id || currentUser?.id;

  useEffect(() => {
    fetchMessages();
  }, [swapRequestId]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await API.get(
        `/messages/${swapRequestId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessages(response.data);
      setError("");
    } catch (error) {
      console.error(
        "Failed to fetch messages:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load chat"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      setSending(true);
      setError("");

      const response = await API.post(
        "/messages",
        {
          swapRequest: swapRequestId,
          message: message.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessages((previousMessages) => [
        ...previousMessages,
        response.data.chatMessage,
      ]);

      setMessage("");
    } catch (error) {
      console.error(
        "Failed to send message:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to send message"
      );
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <p className="form-message">
          Loading chat...
        </p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <button
        onClick={() => navigate("/swaps")}
        style={{
          marginBottom: "20px",
          padding: "10px 16px",
          border: "none",
          borderRadius: "7px",
          cursor: "pointer",
        }}
      >
        ← Back to My Swaps
      </button>

      <div className="chat-container">
        <div className="chat-header">
          <h1>Swap Negotiation</h1>
          <p>
            Discuss the swap details with the other
            user.
          </p>
        </div>

        {error && (
          <p className="form-message">
            {error}
          </p>
        )}

        <div className="chat-messages">
          {messages.length === 0 ? (
            <p className="chat-empty">
              No messages yet. Start the conversation!
            </p>
          ) : (
            messages.map((item) => {
              const senderId =
                item.sender?._id ||
                item.sender?.id;

              const isMine =
                senderId === currentUserId;

              return (
                <div
                  key={item._id}
                  className={
                    isMine
                      ? "chat-message my-message"
                      : "chat-message other-message"
                  }
                >
                  <div className="message-sender">
                    {isMine
                      ? "You"
                      : item.sender?.name ||
                        "User"}
                  </div>

                  <div className="message-text">
                    {item.message}
                  </div>

                  <div className="message-time">
                    {new Date(
                      item.createdAt
                    ).toLocaleString()}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form
          className="chat-input-form"
          onSubmit={handleSendMessage}
        >
          <input
            type="text"
            placeholder="Type your message..."
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
            maxLength={1000}
          />

          <button
            type="submit"
            disabled={
              sending || !message.trim()
            }
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chat;