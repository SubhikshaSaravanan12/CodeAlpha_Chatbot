{ useState, useEffect, useRef } from "react";

const STOP_WORDS = new Set([
  "a","an","the","is","it","in","on","at","to","for","of","and","or","but",
  "are","was","were","be","been","being","have","has","had","do","does","did",
  "will","would","could","should","may","might","can","i","my","me","we","our",
  "you","your","they","their","this","that","these","those","what","how","when",
  "where","why","which","who","with","from","about","into","by","as","so","if",
  "not","no","yes","just","also","more","than","then","there","here","up","out",
  "get","got","need","want","help","please","hi","hello","hey",
]);

function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

function buildTF(tokens) {
  const tf = {};
  tokens.forEach((t) => (tf[t] = (tf[t] || 0) + 1));
  const len = tokens.length || 1;import
  Object.keys(tf).forEach((k) => (tf[k] /= len));
  return tf;
}

function cosineSimilarity(vecA, vecB) {
  const keys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  let dot = 0, magA = 0, magB = 0;
  keys.forEach((k) => {
    const a = vecA[k] || 0;
    const b = vecB[k] || 0;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  });
  return magA && magB ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}

const FAQS = [
  {
    category: "Orders & Delivery",
    question: "How do I track my Amazon order?",
    keywords: ["track","tracking","order","status","where","shipment","delivery"],
    answer: "You can track your order in real-time:\n\n1. Go to **Your Orders**\n2. Click **Track order**\n3. View live location & delivery date\n\nYou'll receive SMS/email updates.",
  },
  {
    category: "Orders & Delivery",
    question: "Can I cancel my Amazon order?",
    keywords: ["cancel","cancellation","stop"],
    answer: "Cancel within limited time:\n\n• **Not shipped:** Cancel anytime\n• **Already shipped:** Return instead\n\nRefund: 3-5 business days",
  },
  {
    category: "Orders & Delivery",
    question: "Why is my order delayed?",
    keywords: ["delayed","late","slow"],
    answer: "Delays due to:\n\n✓ High demand\n✓ Weather disruptions\n✓ Address issues\n\nCheck tracking for updates.",
  },
  {
    category: "Returns & Refunds",
    question: "What is Amazon's return policy?",
    keywords: ["return","policy","refund"],
    answer: "**30-day return policy**:\n\n✓ Unused items\n✓ Original packaging\n✓ Full refund for damaged items\n\nGo to: **Your Orders → Return**",
  },
  {
    category: "Returns & Refunds",
    question: "How long does a refund take?",
    keywords: ["refund","money back","time"],
    answer: "Refund timelines:\n\n💳 **Card:** 5-10 days\n🅿️ **UPI:** 2-3 days\n📱 **Amazon Pay:** Instant",
  },
  {
    category: "Payments",
    question: "What payment methods are accepted?",
    keywords: ["payment","method","card","upi"],
    answer: "Accept all payment methods:\n\n💳 Debit/Credit Cards\n📱 Google Pay, Apple Pay\n🏦 UPI, Net Banking\n💰 Amazon Pay, EMI",
  },
  {
    category: "Payments",
    question: "Is my payment information safe?",
    keywords: ["secure","safe","security"],
    answer: "Your payment is secure:\n\n🔐 256-bit SSL encryption\n✓ PCI-DSS Level 1 compliance\n✓ Fraud protection\n✓ Money-back guarantee",
  },
  {
    category: "Prime Membership",
    question: "What are Amazon Prime benefits?",
    keywords: ["prime","membership","benefits"],
    answer: "**Amazon Prime** (₹999/year):\n\n⚡ Free 1-2 day delivery\n📺 Prime Video\n🎵 Prime Music\n📖 Prime Reading\n🎁 Exclusive deals",
  },
  {
    category: "Account & Login",
    question: "How do I create an account?",
    keywords: ["create","account","register"],
    answer: "Quick account creation:\n\n1. Go to **Amazon.in**\n2. Enter **email/phone**\n3. Create **password**\n4. Verify **OTP**\n\nTakes 2 minutes!",
  },
  {
    category: "Account & Login",
    question: "How do I reset my password?",
    keywords: ["forgot","password","reset"],
    answer: "Reset in seconds:\n\n1. Click **Forgot password?**\n2. Enter **email/phone**\n3. Get **OTP**\n4. Create **new password**",
  },
  {
    category: "Products & Shopping",
    question: "How do I know if a product is in stock?",
    keywords: ["available","stock"],
    answer: "Check availability:\n\n✓ **In Stock:** Cart button visible\n✓ **Out:** \"Notify Me\" option\n✓ **Pre-order:** Delivery date shown",
  },
  {
    category: "Products & Shopping",
    question: "How do I use a discount code?",
    keywords: ["discount","coupon","code"],
    answer: "Apply discount codes:\n\n1. Go to **Shopping Cart**\n2. Enter **promo code**\n3. Click **Apply**\n4. Complete checkout",
  },
];

const QUICK_FAQS = [
  "How do I track my Amazon order?",
  "What is Amazon's return policy?",
  "What payment methods are accepted?",
  "How do I create an account?",
];

const FAQ_VECTORS = FAQS.map((faq) => {
  const combined = [...faq.keywords, ...tokenize(faq.question)].join(" ");
  return buildTF(tokenize(combined));
});

function findBestMatch(userQuery) {
  const queryTokens = tokenize(userQuery);
  if (!queryTokens.length) return null;
  const queryVec = buildTF(queryTokens);
  let best = { score: 0, faq: null };
  FAQS.forEach((faq, i) => {
    const score = cosineSimilarity(queryVec, FAQ_VECTORS[i]);
    if (score > best.score) best = { score, faq };
  });
  return best.score > 0.08 ? best : null;
}

function renderText(text) {
  return text.split("\n").map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
      part.startsWith("**") && part.endsWith("**")
        ? <strong key={j} style={{ fontWeight: 700, color: "#0066cc" }}>{part.slice(2, -2)}</strong>
        : part
    );
    return (
      <div key={i} style={{ marginBottom: "4px", lineHeight: 1.5 }}>
        {parts}
      </div>
    );
  });
}

const BOT_GREETING = {
  id: 0,
  role: "bot",
  text: "Namaste! 🙏🏻\n\nWelcome to **Amazon Assistant**. I'm here to help with orders, returns, payments, and more.\n\nHow can I assist you?",
  time: new Date(),
};

export default function AmazonChatbot() {
  const [messages, setMessages] = useState([BOT_GREETING]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickFaqs, setShowQuickFaqs] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingError, setRecordingError] = useState("");
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const recordingIntervalRef = useRef(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      setTimeout(() => {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: "smooth"
        });
      }, 200);
    }
  }, [messages, isTyping]);

  function formatTime(date) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function sendMessage(text) {
    setShowQuickFaqs(false);
    setRecordingError("");
    const userMsg = { id: Date.now(), role: "user", text, time: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const match = findBestMatch(text);
      let botText;

      if (match) {
        botText = match.faq.answer;
      } else {
        botText = "I couldn't find an answer to that. 😔\n\nPlease contact:\n📞 1860-2000-100\n📧 support@amazon.in";
      }

      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "bot", text: botText, time: new Date() },
      ]);
    }, 500);
  }

  async function startRecording() {
    try {
      setRecordingError("");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true } 
      });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.onstop = () => {
        const duration = recordingTime;
        sendMessage(`🎤 Voice message (${duration}s)`);
        setRecordingTime(0);
      };

      mediaRecorder.onerror = (event) => {
        setRecordingError("Recording error. Please try again.");
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      setRecordingError("Please enable microphone access in your browser settings");
      setIsRecording(false);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      clearInterval(recordingIntervalRef.current);
      setIsRecording(false);
    }
  }

  function handleSubmit() {
    if (input.trim()) sendMessage(input.trim());
  }

  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      background: "#ffffff",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      display: "flex",
      flexDirection: "column",
      padding: "0",
      margin: "0",
      overflow: "hidden",
    }}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #f0f0f0; }
        ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #bbb; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
        @keyframes recordPulse { 0%{box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7)} 70%{box-shadow: 0 0 0 10px rgba(220, 38, 38, 0)} 100%{box-shadow: 0 0 0 0 rgba(220, 38, 38, 0)} }
      `}</style>

      {/* HEADER */}
      <div style={{
        background: "#fff",
        borderBottom: "2px solid #f0f0f0",
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        flexShrink: 0,
        height: "60px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}>
        <div style={{
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #ff9900 0%, #ff8800 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "24px",
          flexShrink: 0,
          boxShadow: "0 4px 12px rgba(255, 153, 0, 0.25)",
        }}>🛍️</div>
        <div style={{ flex: 1 }}>
          <h1 style={{
            margin: "0",
            fontSize: "19px",
            fontWeight: 700,
            color: "#1a1a1a",
            letterSpacing: "-0.3px",
          }}>Amazon Assistant</h1>
          <p style={{
            margin: "0",
            fontSize: "12px",
            color: "#ff9900",
            fontWeight: 600,
          }}>Online</p>
        </div>
      </div>

      {/* CHAT AREA */}
      <div
        ref={messagesContainerRef}
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "16px 14px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          minHeight: "0",
          width: "100%",
          background: "#ffffff",
        }}
      >
        {/* Quick FAQs */}
        {showQuickFaqs && messages.length === 1 && (
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            marginBottom: "8px",
            animation: "slideIn 0.4s ease",
          }}>
            <div style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#999",
              paddingLeft: "6px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}>Popular Questions</div>
            {QUICK_FAQS.map((faq, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(faq)}
                style={{
                  background: "#f9f9f9",
                  border: "1.5px solid #e8e8e8",
                  borderRadius: "12px",
                  padding: "12px 14px",
                  cursor: "pointer",
                  fontSize: "13px",
                  color: "#1a1a1a",
                  textAlign: "left",
                  transition: "all 0.25s ease",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#fff9f0";
                  e.currentTarget.style.borderColor = "#ff9900";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(255, 153, 0, 0.15)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f9f9f9";
                  e.currentTarget.style.borderColor = "#e8e8e8";
                  e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.04)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                ❓ {faq}
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: "flex",
              flexDirection: msg.role === "user" ? "row-reverse" : "row",
              alignItems: "flex-end",
              gap: "10px",
              animation: "fadeUp 0.3s ease",
            }}
          >
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: msg.role === "bot" 
                ? "linear-gradient(135deg, #ff9900, #ff8800)" 
                : "#e8e8e8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              flexShrink: 0,
              boxShadow: msg.role === "bot" ? "0 2px 8px rgba(255, 153, 0, 0.2)" : "none",
            }}>
              {msg.role === "bot" ? "🛍️" : "👤"}
            </div>

            <div style={{
              maxWidth: "72%",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              alignItems: msg.role === "user" ? "flex-end" : "flex-start",
              minWidth: "0",
            }}>
              <div style={{
                background: msg.role === "user" 
                  ? "linear-gradient(135deg, #5BA3D0, #4A8FC7)"
                  : "#f3f3f3",
                color: msg.role === "user" ? "#fff" : "#1a1a1a",
                padding: "12px 14px",
                borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                fontSize: "13.5px",
                lineHeight: 1.5,
                wordWrap: "break-word",
                overflowWrap: "break-word",
                whiteSpace: "pre-wrap",
                minWidth: "0",
                boxShadow: msg.role === "user" 
                  ? "0 3px 10px rgba(90, 163, 208, 0.25)"
                  : "0 1px 3px rgba(0,0,0,0.06)",
              }}>
                {renderText(msg.text)}
              </div>
              <div style={{
                fontSize: "11px",
                color: "#bbb",
                paddingX: "14px",
              }}>{formatTime(msg.time)}</div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "10px",
            animation: "fadeUp 0.3s ease",
          }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #ff9900, #ff8800)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              flexShrink: 0,
              boxShadow: "0 2px 8px rgba(255, 153, 0, 0.2)",
            }}>🛍️</div>
            <div style={{
              background: "#f3f3f3",
              padding: "12px 14px",
              borderRadius: "18px 18px 18px 4px",
              display: "flex",
              gap: "5px",
              alignItems: "center",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#ff9900",
                  animation: `pulse 1.2s ease infinite`,
                  animationDelay: `${i * 0.2}s`,
                }}></div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {recordingError && (
        <div style={{
          padding: "10px 16px",
          background: "#fef2f2",
          borderTop: "1px solid #fee2e2",
          color: "#991b1b",
          fontSize: "12px",
          textAlign: "center",
          fontWeight: 500,
        }}>
          {recordingError}
        </div>
      )}

      {/* INPUT AREA */}
      <div style={{
        padding: "12px 14px 16px",
        background: "#ffffff",
        borderTop: "2px solid #f0f0f0",
        display: "flex",
        gap: "10px",
        flexShrink: 0,
        minHeight: "60px",
        alignItems: "center",
      }}>
        {/* Voice Button */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            background: isRecording ? "#dc2626" : "#fff",
            border: isRecording ? "none" : "2px solid #f0f0f0",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
            flexShrink: 0,
            boxShadow: isRecording 
              ? "0 0 0 0 rgba(220, 38, 38, 0.7)"
              : "0 2px 6px rgba(0,0,0,0.08)",
            animation: isRecording ? "recordPulse 1.5s infinite" : "none",
          }}
          onMouseEnter={(e) => {
            if (!isRecording) {
              e.currentTarget.style.background = "#fff9f0";
              e.currentTarget.style.borderColor = "#ff9900";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(255, 153, 0, 0.2)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isRecording) {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.borderColor = "#f0f0f0";
              e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.08)";
            }
          }}
          title={isRecording ? "Stop recording" : "Record voice message"}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C10.34 2 9 3.34 9 5v7c0 1.66 1.34 3 3 3s3-1.34 3-3V5c0-1.66-1.34-3-3-3z" fill={isRecording ? "#fff" : "#ff9900"} strokeWidth="1.5"/>
            <path d="M18.8 11c-.5 0-.9.4-.9.9 0 2.6-2.1 4.9-4.9 5.2v2.3h1.5c.4 0 .7.3.7.7s-.3.7-.7.7h-5c-.4 0-.7-.3-.7-.7s.3-.7.7-.7h1.5v-2.3c-2.8-.3-4.9-2.6-4.9-5.2 0-.5-.4-.9-.9-.9s-.9.4-.9.9c0 3 2.2 5.6 5 6v2.3H5.3c-.4 0-.7.3-.7.7s.3.7.7.7h13.4c.4 0 .7-.3.7-.7s-.3-.7-.7-.7h-1.5v-2.3c2.8-.4 5-2.9 5-6 0-.5-.4-.9-.9-.9z" fill={isRecording ? "#fff" : "#ff9900"} strokeWidth="1.5"/>
          </svg>
        </button>

        {/* Recording Timer */}
        {isRecording && (
          <div style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "#dc2626",
            minWidth: "60px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}>
            🔴 {recordingTime}s
          </div>
        )}

        {/* Input Field */}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !isRecording && handleSubmit()}
          placeholder={isRecording ? "Recording..." : "Type your question..."}
          disabled={isRecording}
          style={{
            flex: 1,
            border: "2px solid #e8e8e8",
            outline: "none",
            background: isRecording ? "#f9f9f9" : "#fff",
            fontFamily: "'Segoe UI', sans-serif",
            fontSize: "14px",
            color: "#1a1a1a",
            padding: "12px 16px",
            borderRadius: "26px",
            transition: "all 0.2s ease",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            cursor: isRecording ? "not-allowed" : "text",
          }}
          onFocus={(e) => {
            if (!isRecording) {
              e.currentTarget.style.borderColor = "#ff9900";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(255, 153, 0, 0.2)";
            }
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#e8e8e8";
            e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.05)";
          }}
        />

        {/* Send Button */}
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isTyping || isRecording}
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            background: (input.trim() && !isTyping && !isRecording)
              ? "linear-gradient(135deg, #ff9900, #ff8800)" 
              : "#e8e8e8",
            border: "none",
            cursor: (input.trim() && !isTyping && !isRecording) ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            transition: "all 0.2s ease",
            flexShrink: 0,
            color: "#fff",
            fontWeight: 700,
            boxShadow: (input.trim() && !isTyping && !isRecording)
              ? "0 4px 12px rgba(255, 153, 0, 0.25)"
              : "0 2px 6px rgba(0,0,0,0.05)",
          }}
          onMouseEnter={(e) => {
            if (input.trim() && !isTyping && !isRecording) {
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(255, 153, 0, 0.35)";
              e.currentTarget.style.transform = "scale(1.06)";
            }
          }}
          onMouseLeave={(e) => {
            if (input.trim() && !isTyping && !isRecording) {
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(255, 153, 0, 0.25)";
              e.currentTarget.style.transform = "scale(1)";
            }
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}
