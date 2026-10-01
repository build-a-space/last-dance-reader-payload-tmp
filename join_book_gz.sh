#!/bin/bash
set -euo pipefail
DIR="${1:-.}"
OUT="${2:-book.json.gz}"
N=$(cat "$DIR/book.gz.parts.txt")
rm -f /tmp/book_join.b64
i=0
while [ $i -lt $N ]; do
  printf -v f 'book.gz.part%02d.b64' "$i"
  cat "$DIR/$f" >> /tmp/book_join.b64
  i=$((i+1))
done
base64 -d /tmp/book_join.b64 > "$OUT"
echo "wrote $OUT $(wc -c < "$OUT") bytes"
