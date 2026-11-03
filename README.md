# IELTS.IDP — Candidate Results Portal

A modular Next.js application starter for securely retrieving candidate result documents.

## Stack

- Next.js App Router + React + TypeScript
- Tailwind CSS v4
- PostgreSQL + Prisma
- Private AWS S3 object storage
- Zod request validation

## Included

- Responsive public results lookup page
- Exactly four search inputs: given name, family name, identification number, date of birth
- Client-side required-field checks
- Strict four-field server-side matching
- Short-lived signed document URL generation
- Single-admin login with an HTTP-only signed session cookie
- Admin-only upload, list, update, replace-file, and delete APIs
- Admin dashboard and record management UI
- Password hashing and temporary lockout after repeated failed attempts
- Admin action audit events
- Modular controller, service, repository, storage, and database layers
- Basic security response headers

## Run locally

1. Install Node.js 20.9+ and PostgreSQL.
2. Copy `.env.example` to `.env` and configure the database and private S3 bucket.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Generate Prisma client and create the database schema:

   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open http://localhost:3000.

## Important: production readiness

This repository is a starter foundation, not a complete deployable examination authority system. This is an implementation starter and still requires independent security review, production rate limiting, MFA, automated tests, monitoring, and operational controls before real student data is used. Do not expose it publicly with real student records until those controls are completed and independently security-tested.

Before production:
- Implement Auth.js credentials or an enterprise identity provider, secure password hashing, MFA, and role checks on every admin API route.
- Implement admin-only upload/update/delete APIs with server-side MIME inspection, file size limits, random object keys, malware scanning, and audit logs.
- Add distributed rate limiting and abuse monitoring to the public search endpoint. Consider generic responses and additional verification to reduce candidate enumeration.
- Add CSRF protections where applicable, strict Content Security Policy, secure cookies, TLS, monitoring, backups, retention/deletion policies, and incident response procedures.
- Keep S3 Block Public Access enabled, use least-privilege IAM, encrypt objects, and restrict signed URL lifetime.
- Do not store uploaded result documents or production secrets in GitHub.
- Confirm legal authority, branding permissions, and applicable privacy/data-protection requirements before using an IELTS or IDP name/logo in a public service.

## Database notes

Names are matched case-insensitively; identification number and date of birth are exact matches. The date is interpreted as a UTC calendar date. Ensure your upload workflow stores dates using the same convention.

## Deployment

Deploy the Next.js app to a Node-compatible host such as Vercel. Provision PostgreSQL and a private S3 bucket separately, configure environment variables in the hosting provider, then run Prisma migrations as part of the controlled release process.

## Administrator workflow

- Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the deployment environment and run `npm run db:seed` once against the production database.
- Sign in at `/admin/login`.
- Add records and certificates at `/admin/dashboard`.
- Only the single seeded admin account is created by this seed script. Do not expose database credentials or AWS credentials to the browser.
- Keep the S3 bucket private with Block Public Access enabled and a least-privilege IAM policy.

## Security deployment checklist

- Use a strong unique `AUTH_SECRET` (32+ characters) and rotate it if exposed.
- Require HTTPS in production; cookies are Secure in production.
- Add a managed distributed rate limiter/WAF to public search and login routes. The sample lockout is an additional account-level control, not a substitute for IP/device rate limiting.
- Enable MFA through an identity provider or add a reviewed MFA implementation before production use.
- Restrict S3 IAM permissions to the application bucket/prefix, enable bucket versioning if appropriate, and configure lifecycle/retention policies.
- Review privacy obligations, consent, retention, access logs, breach response, and student identity verification requirements.
- Add automated integration tests and have the deployment independently penetration-tested.
- Do not use an official IELTS/IDP logo or imply affiliation unless authorized.
