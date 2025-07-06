// react-frontend/src/App.tsx
import React, { useEffect, useState } from 'react';

function App() {
  const [sessions, setSessions] = useState<string[]>([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [text, setText] = useState("");
  const [message, setMessage] = useState<{ color: string; text: string } | null>(null);

  useEffect(() => {
    fetch("sessions.json")
      .then(res => res.json())
      .then(setSessions)
      .catch(() => setMessage({ text: "セッション情報の読み込みに失敗しました", color: "red" }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("https://vwad4gy0t2.execute-api.us-east-1.amazonaws.com/prod/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, sessionId: selectedSession }),
      });

      if (res.ok) {
        setMessage({ text: "投稿されました！", color: "green" });
        setText("");
        setSelectedSession("");
      } else {
        setMessage({ text: "送信に失敗しました", color: "red" });
      }
    } catch {
      setMessage({ text: "ネットワークエラー", color: "red" });
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>質問フォーム</h1>
      <form onSubmit={handleSubmit}>
        <label>講座を選択:</label><br />
        <select
          value={selectedSession}
          onChange={(e) => setSelectedSession(e.target.value)}
          required
        >
          <option value="" disabled>講座を選んでください</option>
          {sessions.map((s, i) => (
            <option key={i} value={s}>{s}</option>
          ))}
        </select>
        <br /><br />
        <input
          type="text"
          placeholder="質問を入力してください..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
        />
        <br /><br />
        <button type="submit">投稿</button>
      </form>
      {message && (
        <div style={{ color: message.color, marginTop: "10px" }}>{message.text}</div>
      )}
    </div>
  );
}

export default App;
