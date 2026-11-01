# Dependency maintenance

Use `npm ci` with the committed lockfile. Keep Expo packages aligned with the installed SDK using Expo Doctor and review changes in a branch before updating the lockfile. Native dependency changes require a new build and device checks.

## Audit follow-up

During repository preparation on 2 November 2026, compatible patch updates and `npm audit fix` reduced the reported audit total from 31 to 29 (2 low, 24 moderate, 3 high). These totals include parent packages affected by the same underlying advisory; they are not 29 independent app vulnerabilities. Re-run `npm audit` for current results.

Remaining findings include Expo CLI's Zod 3 dependency, deepmerge, glob/minimatch, and uuid in the build/development dependency graph. npm's proposed forced fix would downgrade Expo to SDK 51, while some findings have no compatible automatic fix. Do not apply `npm audit fix --force` without reviewing the SDK and native implications. A major Zod override would also bypass Expo CLI's declared dependency contract.

These findings remain open. Track upstream compatible fixes, review whether affected code paths accept untrusted input, and test updates before release. Do not describe a passing CI run as a clean security audit. Dependabot checks npm packages and GitHub Actions monthly; Expo updates still need SDK compatibility review.
