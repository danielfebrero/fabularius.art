#!/bin/bash

# repo_to_markdown_maclinux.sh
OUTPUT="repository_dump.md"
MAXSIZE=$((200*1024))
REPOROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [ ! -d "$REPOROOT" ]; then
  echo "Not inside a git repository!"
  exit 1
fi
cd "$REPOROOT"

# macOS vs Linux stat
if stat --version >/dev/null 2>&1; then
  # GNU
  getsize() { stat -c%s "$1"; }
else
  # BSD (macOS)
  getsize() { stat -f%z "$1"; }
fi

echo "# Repository: $(basename "$REPOROOT")" > "$OUTPUT"
echo "" >> "$OUTPUT"
echo "_Generated on $(date)_" >> "$OUTPUT"
echo "" >> "$OUTPUT"

# Excludes
EXCLUDES=(
  ".git"
  "node_modules"
  "venv"
  "__pycache__"
  ".pytest_cache"
  "dist"
  "build"
  ".next"
  ".cache"
  ".DS_Store"
)

# Use git to get tracked and untracked, unique
FILES=$( (git ls-files; git ls-files --others --exclude-standard) | sort -u)

COUNT=0

echo "$FILES" | while IFS= read -r file; do
  [ -d "$file" ] && continue
  [ ! -f "$file" ] && continue
  skip=0
  for d in "${EXCLUDES[@]}"; do
    [[ "$file" == "$d"* ]] && skip=1
    [[ "$file" == */"$d"* ]] && skip=1
  done
  ((skip)) && continue

  # MIME type (skip binary)
  mimetype=$(file -b --mime "$file")
  if [[ "$mimetype" == *"charset=binary"* ]] || [[ "$mimetype" == "application/octet-stream"* ]]; then
    continue
  fi

  # File size
  FSIZE=$(getsize "$file")
  [ "$FSIZE" -gt "$MAXSIZE" ] && continue

  echo "## $file" >> "$OUTPUT"
  ext="${file##*.}"
  [ "$ext" = "$file" ] && ext="txt"
  echo "" >> "$OUTPUT"
  echo "\`\`\`$ext" >> "$OUTPUT"
  cat "$file" >> "$OUTPUT"
  echo -e "\n\`\`\`\n" >> "$OUTPUT"
  COUNT=$((COUNT+1))
done

echo "" >> "$OUTPUT"
echo "_Total files included: $COUNT_" >> "$OUTPUT"
echo "✅ Repository exported to $OUTPUT (files: $COUNT)"
