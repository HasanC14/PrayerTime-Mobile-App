# Make the repository public

The repository keeps app code, tests, native modules, artwork, and setup guides. Local keys, generated builds, marketing exports, and review images stay out of Git.

## Prepared on 16 November 2026

- The README uses simple English and includes the Google Play link.
- Backup instructions and font credits match the current app.
- `.gitignore` and `.easignore` exclude local reports, Python caches, credentials, and marketing archives.
- Old `dist-test`, `dist-test-ios`, and `dist-test-sdk55` exports were removed. The app source and review evidence were kept.
- Source and test files that were already being edited were preserved.
- A scan of files intended for Git found no common private-key or token patterns. A separate scan of all three local commits also found no such patterns or copies of the current local API key values. This is a useful check, not a full security audit.

The Play Store update pack is saved locally under `google-play-assets/update-2026-11-16/`. It is ignored by Git. It includes a preview sheet, images, listing text and its own upload guide.

## Checks passed

After the Expo patch updates:

- TypeScript and lint passed.
- All 230 tests passed.
- All 21 Expo Doctor checks passed.
- Android, iOS and web JavaScript exports passed.
- npm audit found 10 moderate advisories and no high or critical advisories. See [dependency notes](dependencies.md).
- All 14 store pack images passed the pack validator. The main preview sheet and all three alternate screenshots were visually reviewed.

JavaScript exports do not replace native builds or phone testing. Hosted GitHub workflows and a signed release build still need to run.

## Your final steps

1. Review `git status` and `git diff`. Keep the new source files, native widget resources, scripts, and tests: they are used by the app and CI.
2. Run `npm run check` and review the results.
3. Commit and push the changes. Run the GitHub workflows on that commit.
4. Enable private vulnerability reports in GitHub if you want to accept them there.
5. Make the repository public when you are ready.
6. Test and publish a signed app update separately. Follow [release readiness](release-readiness.md) for phone checks and other remaining release tasks.

No repository visibility, GitHub release, store listing, signing setup or production deployment was changed during this preparation.
