#!/usr/bin/env bash
#
# Remove Next.js build output so the next `dev` or `build` starts from nothing.
#
# ── WHY THIS IS A SCRIPT AND NOT `rm -rf .next` ─────────────────────────────
# This working tree lives on /media/bakul/258GB, which is an NTFS volume mounted
# through ntfs-3g — a FUSE filesystem. FUSE does not implement unlink the way
# ext4 does: removing a file that some process still holds open does not delete
# it, it *renames* it to `.fuse_hidden<hex>` in the same directory and defers the
# real removal until the last handle closes. So `rm -rf .next` while a dev server
# is running walks the tree, deletes what it can, and then fails on the directory
# itself:
#
#     rm: cannot remove '.next': Directory not empty
#
# …because the FUSE stub it just created is sitting inside it. The exit status is
# non-zero, any `&&` after it never runs, and `.next` is left half-emptied — the
# worst of the three possible outcomes.
#
# That half-emptied state is what produces the error this script exists to clear:
#
#     Error: ENOENT: no such file or directory, open '.next/server/pages/_document.js'
#
# The stack for that reads renderErrorToResponseImpl → findPageComponents →
# requirePage, which is Next's *error* path, not its render path. Even in a pure
# App Router project with no `src/pages` directory at all, dev-mode error pages
# are rendered through the Pages Router — `/_error` inside `/_document` — and
# those two entries are compiled on demand rather than up front. So when the real
# compile fails against a damaged cache, Next tries to render an error page,
# reaches for a `_document` chunk that was never written, and throws a second
# ENOENT that buries the first. The ENOENT is never the bug. It is the bug's
# error page failing to load.
#
# Hence: stop the servers first, then clear, then verify — and fail loudly with
# the reason if the directory survives, instead of pretending it worked.
#
# Invoked as `bash scripts/clean.sh` rather than executed directly, because NTFS
# does not carry a Unix executable bit and `chmod +x` on this volume depends on
# mount options that are not this repository's to guarantee.

set -uo pipefail

cd "$(dirname "$0")/.." || exit 1

# Anything holding a handle inside .next has to go first, or the unlink above
# turns into a rename and we clear nothing. Matched on the actual dev entry
# points rather than a bare `node`, so this cannot take out an unrelated process.
if pgrep -f 'next-server|next dev|next/dist/bin/next dev' >/dev/null 2>&1; then
  echo "clean: stopping running Next processes"
  pkill -f 'next-server' 2>/dev/null
  pkill -f 'next dev' 2>/dev/null
  # FUSE releases the deferred unlinks when the last descriptor closes, which is
  # after the process is reaped, not when the signal is delivered.
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    pgrep -f 'next-server|next dev' >/dev/null 2>&1 || break
    sleep 0.3
  done
fi

for target in .next node_modules/.cache; do
  [ -e "$target" ] || continue
  rm -rf "$target" 2>/dev/null

  # Second pass for the FUSE case: the stubs only became removable once the
  # handles closed, which may have happened during the first pass.
  if [ -e "$target" ]; then
    find "$target" -name '.fuse_hidden*' -delete 2>/dev/null
    rm -rf "$target" 2>/dev/null
  fi

  if [ -e "$target" ]; then
    echo "clean: could not remove $target — something still holds a file open in it." >&2
    echo "clean: find the holder with:  fuser -v $target  (or)  lsof +D $target" >&2
    exit 1
  fi

  echo "clean: removed $target"
done

echo "clean: build output cleared"
