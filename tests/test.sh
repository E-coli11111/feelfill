curl -sS -X POST "https://auth.openai.com/api/accounts/deviceauth/usercode" \
  -H "Content-Type: application/json" \
  -d '{"client_id":"openai-codex-feelfill"}'