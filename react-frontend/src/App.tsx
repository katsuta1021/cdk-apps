import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  MenuItem,
  Alert,
  CircularProgress,
} from "@mui/material";

const API_ENDPOINT = "https://vwad4gy0t2.execute-api.us-east-1.amazonaws.com/prod/submit";

export default function App() {
  const [text, setText] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [sessions, setSessions] = useState<string[]>([]);
  const [status, setStatus] = useState<null | { success: boolean; message: string }>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/sessions.json")
      .then((res) => res.json())
      .then((data) => {
        setSessions(data);
        if (data.length > 0) setSessionId(data[0]);
      })
      .catch((err) => console.error("セッション一覧の取得に失敗:", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, sessionId }),
      });
      if (res.ok) {
        setStatus({ success: true, message: "投稿されました！" });
        setText("");
      } else {
        setStatus({ success: false, message: "送信に失敗しました" });
      }
    } catch (err) {
      setStatus({ success: false, message: "ネットワークエラー" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box mt={5}>
        <Typography variant="h4" gutterBottom>
          質問フォーム
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="質問を入力してください"
            variant="outlined"
            fullWidth
            margin="normal"
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <TextField
            select
            label="講座を選択"
            fullWidth
            margin="normal"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
          >
            {sessions.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>

          <Box mt={2} mb={2}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              fullWidth
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "投稿"}
            </Button>
          </Box>
        </form>

        {status && (
          <Alert severity={status.success ? "success" : "error"}>{status.message}</Alert>
        )}
      </Box>
    </Container>
  );
}
