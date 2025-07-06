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
import sessions from "../public/sessions.json"; // ← 修正ポイント

const API_ENDPOINT = "https://vwad4gy0t2.execute-api.us-east-1.amazonaws.com/prod/submit";

export default function App() {
  const [text, setText] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [status, setStatus] = useState<null | { success: boolean; message: string }>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessions.length > 0) {
      setSessionId(sessions[0]);
    }
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
            {sessions.map((session) => (
              <MenuItem key={session} value={session}>
                {session}
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
