import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import bookData from "../data/book.json";

type Chapter = {
  number: number;
  title: string;
  pov: string;
  date: string;
  paragraphs: string[];
};

type Book = {
  title: string;
  subtitle: string;
  author: string;
  chapters: Chapter[];
};

const book = bookData as Book;

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const token = m[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    } else {
      nodes.push(<em key={key++}>{token.slice(1, -1)}</em>);
    }
    last = m.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

const TOTAL_PAGES = 1 + book.chapters.length;

export function NovelReader() {
  const [page, setPage] = useState(0);
  const [tocOpen, setTocOpen] = useState(false);
  const [anim, setAnim] = useState<"idle" | "next" | "prev">("idle");
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const locked = useRef(false);

  const goTo = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(TOTAL_PAGES - 1, next));
    if (clamped === page || locked.current) return;
    locked.current = true;
    setAnim(clamped > page ? "next" : "prev");
    window.setTimeout(() => {
      setPage(clamped);
      setAnim("idle");
      locked.current = false;
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }, 220);
  }, [page]);

  const next = useCallback(() => goTo(page + 1), [goTo, page]);
  const prev = useCallback(() => goTo(page - 1), [goTo, page]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (tocOpen) {
        if (e.key === "Escape") setTocOpen(false);
        return;
      }
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        prev();
      } else if (e.key === "Home") {
        e.preventDefault();
        goTo(0);
      } else if (e.key === "End") {
        e.preventDefault();
        goTo(TOTAL_PAGES - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, goTo, tocOpen]);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.changedTouches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) next();
    else prev();
  };

  const progress = useMemo(
    () => Math.round((page / (TOTAL_PAGES - 1)) * 100),
    [page],
  );

  const chapter = page === 0 ? null : book.chapters[page - 1];

  return (
    <div className="novel-shell" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <header className="novel-topbar">
        <button type="button" className="novel-icon-btn" aria-label="Table of contents" onClick={() => setTocOpen(true)}>
          <span aria-hidden>☰</span>
        </button>
        <div className="novel-topbar-meta">
          <span className="novel-topbar-title">{book.title}</span>
          <span className="novel-topbar-progress">
            {page === 0 ? "Cover" : `Chapter ${chapter!.number} of ${book.chapters.length}`}{" · "}{progress}%
          </span>
        </div>
        <div className="novel-topbar-spacer" />
      </header>
      <div className="novel-progress-track" aria-hidden>
        <div className="novel-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <main className={`novel-stage ${anim === "next" ? "is-exit-left" : ""} ${anim === "prev" ? "is-exit-right" : ""}`}>
        <button type="button" className="novel-nav novel-nav-prev" aria-label="Previous page" disabled={page === 0} onClick={prev}>‹</button>
        <article ref={scrollRef} className={`novel-page ${page === 0 ? "is-cover" : "is-chapter"}`}>
          {page === 0 ? <CoverPage onBegin={() => goTo(1)} /> : <ChapterPage chapter={chapter!} />}
        </article>
        <button type="button" className="novel-nav novel-nav-next" aria-label="Next page" disabled={page >= TOTAL_PAGES - 1} onClick={next}>›</button>
      </main>
      <footer className="novel-footer">
        <button type="button" className="novel-footer-btn" disabled={page === 0} onClick={prev}>Previous</button>
        <span className="novel-footer-page">{page + 1} / {TOTAL_PAGES}</span>
        <button type="button" className="novel-footer-btn" disabled={page >= TOTAL_PAGES - 1} onClick={next}>Next</button>
      </footer>
      {tocOpen && (
        <div className="novel-toc-backdrop" onClick={() => setTocOpen(false)}>
          <nav className="novel-toc" aria-label="Table of contents" onClick={(e) => e.stopPropagation()}>
            <div className="novel-toc-head">
              <h2>Contents</h2>
              <button type="button" className="novel-icon-btn" aria-label="Close contents" onClick={() => setTocOpen(false)}>✕</button>
            </div>
            <button type="button" className={`novel-toc-item ${page === 0 ? "is-active" : ""}`} onClick={() => { setTocOpen(false); goTo(0); }}>
              <span className="novel-toc-num">—</span>
              <span><strong>Cover</strong><em>{book.subtitle}</em></span>
            </button>
            {book.chapters.map((ch) => (
              <button key={ch.number} type="button" className={`novel-toc-item ${page === ch.number ? "is-active" : ""}`} onClick={() => { setTocOpen(false); goTo(ch.number); }}>
                <span className="novel-toc-num">{ch.number}</span>
                <span><strong>{ch.title}</strong>{ch.pov ? <em>{ch.pov}</em> : null}</span>
              </button>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}

function CoverPage({ onBegin }: { onBegin: () => void }) {
  return (
    <div className="cover">
      <div className="cover-ornament" aria-hidden />
      <p className="cover-kicker">A contemporary romance</p>
      <h1 className="cover-title">{book.title}</h1>
      <div className="cover-rule" aria-hidden />
      <p className="cover-author">by {book.author}</p>
      <p className="cover-blurb">
        Maya boarded for one last trip before the wedding. What she found on the MV <em>Aurora Lyric</em> was not a checklist — it was a choice.
      </p>
      <p className="cover-note">Open-door heat · 32 chapters</p>
      <button type="button" className="cover-cta" onClick={onBegin}>Begin reading</button>
      <p className="cover-hint">Use ← → arrows, buttons, or swipe to turn pages</p>
    </div>
  );
}

function ChapterPage({ chapter }: { chapter: Chapter }) {
  return (
    <div className="chapter">
      <header className="chapter-head">
        <p className="chapter-label">Chapter {chapter.number}</p>
        <h1 className="chapter-title">{chapter.title}</h1>
        {(chapter.pov || chapter.date) && (
          <p className="chapter-meta">{[chapter.pov, chapter.date].filter(Boolean).join(" · ")}</p>
        )}
      </header>
      <div className="chapter-body">
        {chapter.paragraphs.map((p, i) => (
          <p key={i}>{renderInline(p)}</p>
        ))}
      </div>
      <p className="chapter-end">◆</p>
    </div>
  );
}
