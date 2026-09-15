# Identity verification

Registration requires an ID image followed by a live face capture. The server sends both images to the service configured by `FACE_VERIFICATION_URL`:

```json
{
  "id_document": "data:image/jpeg;base64,...",
  "selfie": "data:image/jpeg;base64,...",
  "expected_name": "Juan D. Cruz",
  "expected_student_number": "2026-12345"
}
```

The service must return JSON in this shape:

```json
{
  "id_valid": true,
  "institution": "TCC",
  "id_name": "Juan D. Cruz",
  "id_student_number": "2026-12345",
  "match": true,
  "confidence": 0.94
}
```

AssistDesk accepts the verification only when `id_valid` is `true`, `institution` is `TCC` or `Tomas Claudio Colleges`, `id_name` matches the registered name, `id_student_number` matches the registered student number, `match` is `true`, and `confidence` is at least `0.8`. Name comparison ignores capitalization and punctuation; student-number comparison ignores separators such as hyphens. If the provider is missing, unavailable, returns a non-TCC ID, returns different registration details, or returns a mismatch, the account does not become active and no login token is issued. Configure the URL over HTTPS in the server environment before enabling public registration.
