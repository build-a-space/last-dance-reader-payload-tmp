#!/usr/bin/env python3
import json, pathlib, sys
root = pathlib.Path(sys.argv[1] if len(sys.argv)>1 else ".")
meta = json.loads((root/"meta.json").read_text(encoding="utf-8"))
chapters = []
for i in range(1, meta["chapterCount"]+1):
    chapters.append(json.loads((root/f"ch{i:02d}.json").read_text(encoding="utf-8")))
book = {"title": meta["title"], "subtitle": meta.get("subtitle"), "author": meta.get("author"), "chapters": chapters}
out = pathlib.Path(sys.argv[2] if len(sys.argv)>2 else "book.json")
out.write_text(json.dumps(book, ensure_ascii=False), encoding="utf-8")
print("wrote", out, "bytes", out.stat().st_size, "chapters", len(chapters))
