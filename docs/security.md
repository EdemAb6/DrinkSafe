# DrinkSafe production security

## Transport security

- Enforce HTTPS for the frontend, API, database connection, and future ESP32
  ingestion endpoint.
- Redirect HTTP to HTTPS at the hosting platform.
- Set `DB_SSL=true` for managed PostgreSQL when required by the provider.
- Do not send ThingSpeak keys or device tokens in query strings.
- Use TLS certificate management provided by the hosting platform.

## Secrets

Store these values only in the backend or hosting provider secret manager:

```text
TS_READ_KEY
TS_WRITE_KEY (if used by firmware)
DATABASE_URL
DB_PASSWORD
JWT_SECRET
device ingestion tokens
```

Use a cryptographically random JWT secret of at least 32 characters; a longer
value is preferable. Rotate it deliberately because existing JWT sessions are
invalidated when it changes.

Never:

- Commit `.env` files.
- Put secrets in React `VITE_*` variables.
- Put secrets in frontend source, firmware source, screenshots, or reports.
- Log request headers containing cookies or authorization tokens.

## Authentication and cookies

The implemented browser authentication uses bcrypt password hashes and JWTs in
an `httpOnly` cookie. For production, it uses `sameSite=none` with `secure=true`
so the cookie can be sent from the Vercel frontend to the Render API:

- Keep `secure` cookies enabled through `NODE_ENV=production`.
- Use a strong password policy and rate-limit login and registration.
- Add account recovery only with a verified email workflow.
- Return generic login failures so email addresses cannot be enumerated.
- Consider a short access-token lifetime and server-side refresh-token
  rotation if long-lived sessions are required.
- Add CSRF protection if authentication requests become cross-site or cookie
  settings change.

## Authorization and device ownership

Every sensor-data request must:

1. Authenticate the user.
2. Resolve the requested device.
3. Confirm that the device belongs to the user.
4. Query readings using the authorized device ID.

Never trust a `userId` or `deviceId` supplied by the browser without a
server-side ownership query. Apply the same rule to CSV exports, alerts, and
future device configuration routes.

For direct ESP32 ingestion, use separate per-device credentials. Device
credentials should be:

- Random and high entropy.
- Stored hashed if possible.
- Rotatable and revocable.
- Scoped to one device.
- Rate-limited.

## Input and API protection

- Validate email, password, device names, dates, timestamps, and sensor ranges.
- Keep request bodies small.
- Add rate limits to authentication, ingestion, and export routes.
- Set explicit CORS origins, never `*` with credentials.
- Return safe generic 500 errors while logging a server-side request ID.
- Do not expose stack traces in production.
- Add request IDs and structured logs without sensitive fields.
- Limit export ranges or paginate large exports to avoid memory exhaustion.

## Database security

- Use a dedicated application database user with only required permissions.
- Do not use the PostgreSQL superuser for the deployed application.
- Require TLS for managed database connections.
- Restrict network access to the backend where supported.
- Keep migrations reviewed and versioned.
- Add indexes for ownership and time-range queries.
- Never build SQL by concatenating user input; use parameterized queries.

## Backups and recovery

For the student project, use the managed provider's automated daily backups
and keep the retention period documented. Before a demonstration or release:

1. Confirm the latest backup completed.
2. Export a separate encrypted backup when appropriate.
3. Test restoring into a non-production database.
4. Apply migrations to the restored database.
5. Verify users, devices, readings, authentication, and CSV export.
6. Record the restore date and result.

Backups contain personal and sensor data. Restrict access, encrypt them at
rest, and define when old copies are deleted.

## Monitoring and incident response

Monitor:

- Backend health checks.
- Error rate and latency.
- Authentication failures.
- ThingSpeak request failures and timeouts.
- PostgreSQL connection and storage usage.
- Failed ingestion requests.
- Backup completion.

If a credential is exposed:

1. Revoke or rotate it immediately.
2. Rotate `JWT_SECRET` if session tokens may be affected.
3. Rotate ThingSpeak keys and device tokens as applicable.
4. Review access and deployment logs.
5. Remove the secret from the repository and history where appropriate.
6. Document the incident and corrective action.
