# Security policy

Security fixes target the current main branch. Older releases may need an update to receive fixes.

Please do not post credentials, personal journal records, exact location history, or exploit details in public issues. If GitHub's **Report a vulnerability** option is enabled under the repository's Security tab, use it. Otherwise, contact the maintainer through [hasanbuilds.com](https://hasanbuilds.com) to arrange a private report before sharing sensitive details.

Include the affected version, platform, reproduction steps, and likely impact. Use sample data. No response-time guarantee or bounty program is offered.

Environment variables starting with `EXPO_PUBLIC_` are embedded in client builds and are not secrets. Configure service-side restrictions and quotas for client API keys. Signing keys, server credentials, and local `.env` files must never be committed.
