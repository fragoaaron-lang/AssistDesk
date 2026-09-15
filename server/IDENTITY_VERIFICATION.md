# Identity verification

Registration requires an ID image followed by a live face capture. The server sends both images to the service configured by `FACE_VERIFICATION_URL`:

```json
{
  "id_document": "data:image/jpeg;base64,...",
  "selfie": "data:image/jpeg;base64,..."
}
```

The service must return JSON in this shape:

```json
{
  "id_valid": true,
  "institution": "TCC",
  "match": true,
  "confidence": 0.94
}
```

AssistDesk accepts the verification only when `id_valid` is `true`, `institution` is `TCC` or `Tomas Claudio Colleges`, `match` is `true`, and `confidence` is at least `0.8`. If the provider is missing, unavailable, returns a non-TCC ID, or returns a mismatch, the account does not become active and no login token is issued. Configure the URL over HTTPS in the server environment before enabling public registration.
