# Dependency updates

Use `npm ci` to install the versions in the lockfile. Run `npm run check` after updates. Native package updates also need a new phone build.

## Latest check

On 16 November 2026, `npm audit` reported **10 moderate advisories, no high advisories, and no critical advisories**. This includes packages affected through other dependencies, so it is not a count of separate app flaws.

The reported chains include minimatch, uuid, Expo tooling, and TypeScript ESLint tooling. Some affected packages are direct dependencies; many are tools used to develop or build the app. These findings remain open.

Run `npm audit` again before a release. The result can change when new advisories are published.

Do not run `npm audit fix --force` without reviewing the changes. It can downgrade Expo to a version that does not fit this app. Prefer compatible upstream updates and test them in a branch. CI rejects high and critical advisories.
