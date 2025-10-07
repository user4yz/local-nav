import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Input,
  Chip,
  Card,
  CardBody,
  CardHeader,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@heroui/react";
import confetti from "canvas-confetti";
import { NAV_DATA } from "./data";

/** Helpers */
const cls = (...xs) => xs.filter(Boolean).join(" ");

function useLocalStorageSet(key) {
  const [setState, setSetState] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(key) || "[]"));
    } catch {
      return new Set();
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(Array.from(setState)));
    } catch {}
  }, [key, setState]);
  return [setState, setSetState];
}

export default function App() {
  // Theme
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("nav_theme");
      if (saved) return saved;
    } catch {}
    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  });
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem("nav_theme", theme);
    } catch {}
  }, [theme]);

  // Query, category and favorites
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(() => {
    try {
      return localStorage.getItem("nav_category") || "all";
    } catch {
      return "all";
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("nav_category", category);
    } catch {}
  }, [category]);

  const [favoritesOnly, setFavoritesOnly] = useState(() => {
    try {
      return localStorage.getItem("nav_fav_only") === "1";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("nav_fav_only", favoritesOnly ? "1" : "0");
    } catch {}
  }, [favoritesOnly]);

  const [favorites, setFavorites] = useLocalStorageSet("nav_favorites");

  // Background (Bing preferred with fallbacks)
  const [bgUrl, setBgUrl] = useState(null);
  useEffect(() => {
    let disposed = false;

    function preloadAndSet(url, onFail) {
      const img = new Image();
      img.onload = () => {
        if (!disposed) setBgUrl(url);
      };
      img.onerror = () => onFail && onFail();
      img.src = url;
    }

    // Quick fallback: set a reliable background immediately while Bing loads
    preloadAndSet(
      "https://source.unsplash.com/1920x1080/?nature,landscape",
      null
    );

    function tryBing(i = 0) {
      const bingJson =
        "https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN";
      const proxyUrls = [
        "https://api.allorigins.win/raw?url=" + encodeURIComponent(bingJson),
        "https://cors.isomorphic-git.org/" + bingJson,
        "https://r.jina.ai/http://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN",
      ];
      if (i >= proxyUrls.length) {
        tryOthers();
        return;
      }
      fetch(proxyUrls[i])
        .then((r) => r.text())
        .then((txt) => {
          let data;
          try {
            data = JSON.parse(txt);
          } catch {
            data = null;
          }
          const img = data && data.images && data.images[0];
          const path =
            img && (img.url || (img.urlbase && img.urlbase + "_1920x1080.jpg"));
          const full = path
            ? path.startsWith("http")
              ? path
              : "https://www.bing.com" + path
            : null;
          if (full) {
            preloadAndSet(full, () => tryBing(i + 1));
          } else {
            tryBing(i + 1);
          }
        })
        .catch(() => tryBing(i + 1));
    }

    function tryOthers() {
      const seed = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const candidates = [
        "https://picsum.photos/seed/" + seed + "/1920/1080",
        "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1920&auto=format&fit=crop",
      ];
      let j = 0;
      function next() {
        if (j >= candidates.length) return;
        preloadAndSet(candidates[j++], next);
      }
      next();
    }

    tryBing();

    return () => {
      disposed = true;
    };
  }, []);

  // Mouse glow
  const cursorGlowRef = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      const x = e.clientX + "px";
      const y = e.clientY + "px";
      if (cursorGlowRef.current) {
        cursorGlowRef.current.style.setProperty("--x", x);
        cursorGlowRef.current.style.setProperty("--y", y);
      }
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  // Scroll UI state
  const [scrollY, setScrollY] = useState(0);
  const [progress, setProgress] = useState(0);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [showRocket, setShowRocket] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const y =
        window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      setScrollY(y);
      setHeaderScrolled(y > 12);
      setShowRocket(y > 240);
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const pct = h > 0 ? Math.min(100, Math.max(0, (y / h) * 100)) : 0;
      setProgress(pct);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Toast
  const [toast, setToast] = useState({ msg: "", show: false });
  const toastTimer = useRef(null);
  const showToast = (msg) => {
    setToast({ msg, show: true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(
      () => setToast((t) => ({ ...t, show: false })),
      1200
    );
  };

  // Derived lists
  const chips = useMemo(() => {
    const list = [{ id: "all", name: "全部", icon: "fa-solid fa-border-all" }];
    (NAV_DATA || []).forEach((c) =>
      list.push({ id: c.id, name: c.name, icon: c.icon || "fa-solid fa-tag" })
    );
    return list;
  }, []);

  const filteredItems = useMemo(() => {
    const q = (query || "").toLowerCase().trim();
    let list = [];
    (NAV_DATA || []).forEach((c) => {
      if (category !== "all" && c.id !== category) return;
      c.items.forEach((it) => {
        list.push({ category: c.id, categoryName: c.name, item: it });
      });
    });
    if (q) {
      list = list.filter((x) => {
        const t = (x.item.title || "").toLowerCase();
        const d = (x.item.desc || "").toLowerCase();
        const cn = (x.categoryName || "").toLowerCase();
        return (
          t.includes(q) || d.includes(q) || cn.includes(q)
        );
      });
    }
    if (favoritesOnly) {
      list = list.filter((x) => favorites.has(x.item.id));
    }
    return list;
  }, [category, query, favoritesOnly, favorites]);

  // Actions
  const toggleFavorite = (id, anchor) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        showToast("已取消收藏");
      } else {
        next.add(id);
        showToast("已加入收藏");
        // confetti at anchor center
        try {
          const rect = anchor?.getBoundingClientRect();
          const x = rect ? (rect.left + rect.width / 2) / window.innerWidth : 0.5;
          const y = rect ? (rect.top + rect.height / 2) / window.innerHeight : 0.5;
          confetti({
            particleCount: 120,
            spread: 100,
            startVelocity: 42,
            decay: 0.92,
            gravity: 1.05,
            origin: { x, y },
            colors: ["#22d3ee", "#a78bfa", "#f472b6", "#f59e0b", "#10b981", "#60a5fa"],
            disableForReducedMotion: true,
          });
        } catch {}
      }
      return next;
    });
  };

  const copyUrl = async (url) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
      showToast("链接已复制");
    } catch {}
  };

  // Tilt handler
  const handleTiltMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rx = ((y / rect.height) - 0.5) * -6;
    const ry = ((x / rect.width) - 0.5) * 6;
    card.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
  };
  const handleTiltLeave = (e) => {
    e.currentTarget.style.transform = "";
  };

  return (
    <>
      {/* Scroll progress */}
      <div
        id="scrollProgress"
        className="fixed top-0 left-0 h-[3px] bg-gradient-to-r from-fuchsia-500 via-cyan-400 to-indigo-500 w-0 z-50"
        style={{ width: `${progress.toFixed(2)}%` }}
      />

      {/* Backgrounds */}
      <div
        id="bingBg"
        className="fixed inset-0 -z-20 opacity-60 dark:opacity-40"
      >
        {bgUrl && (
          <img
            src={bgUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div ref={cursorGlowRef} id="cursorGlow" className="fixed inset-0 -z-5 pointer-events-none"></div>

      {/* Header */}
      <header
        id="siteHeader"
        className={cls(
          "sticky top-0 z-40 glass-header border-b border-slate-200/50 dark:border-white/10",
          headerScrolled && "scrolled"
        )}
      >
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div
            id="brand"
            className="group flex items-center gap-3 cursor-pointer"
            onClick={() => {
              // subtle wobble on click
              showToast("欢迎使用开发者网站导航");
            }}
          >
            <span className="icon-wrap inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 border border-white/20 shadow-glass transition group-hover:scale-105">
              <i className="fa-solid fa-compass text-fuchsia-400 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-125" />
            </span>
            <h1 className="text-lg sm:text-xl font-semibold tracking-wide transition-transform duration-300 group-hover:skew-x-1 group-hover:scale-105">
              开发者网站导航
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              className="glass-btn px-3 py-1.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 transition shadow-glass"
              onPress={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            >
              <i className={cls("mr-1.5", theme === "dark" ? "fa-solid fa-moon" : "fa-solid fa-sun")} />
              <span className="hidden sm:inline">{theme === "dark" ? "深色模式" : "浅色模式"}</span>
            </Button>
            <a
              href="https://dev-tools-hub.180822.xyz/"
              target="_blank"
              rel="noopener"
              className="px-3 py-1.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 transition shadow-glass"
            >
              <i className="fa-solid fa-database mr-1.5" />
              数据来源参考
            </a>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Search and stats */}
        <section className="mb-6">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-start md:items-center">
            <div className="relative flex-1 w-full">
              <Input
                aria-label="搜索"
                value={query}
                onValueChange={setQuery}
                placeholder="搜索工具、服务、平台..."
                classNames={{
                  inputWrapper:
                    "pl-9 rounded-xl bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/50",
                  input: "placeholder:text-slate-300",
                }}
                startContent={
                  <i className="fa-solid fa-magnifying-glass text-slate-300" />
                }
              />
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20">
                {filteredItems.length} 条结果
              </span>
              <Button
                className={cls(
                  "px-3 py-1.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 transition",
                  favoritesOnly && "bg-amber-300/30 border-amber-300/50"
                )}
                onPress={() => setFavoritesOnly((v) => !v)}
                startContent={<i className="fa-solid fa-star text-amber-300" />}
              >
                仅看收藏
              </Button>
            </div>
          </div>
        </section>

        {/* Categories */}
        <nav id="categoryBar" className="flex flex-wrap gap-2 mb-6">
          {chips.map((c) => {
            const active = c.id === category;
            return (
              <Chip
                key={c.id}
                variant={active ? "solid" : "flat"}
                color={active ? "primary" : "default"}
                className={cls(
                  "px-3 py-1.5 rounded-xl border text-sm transition inline-flex items-center gap-2 bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:border-white/20 dark:text-slate-200 dark:hover:bg-white/20",
                  active && "text-white bg-sky-600 hover:bg-sky-700 dark:bg-violet-500 dark:hover:bg-violet-600"
                )}
                onClick={() => setCategory(c.id)}
                startContent={<i className={c.icon} />}
              >
                {c.name}
              </Chip>
            );
          })}
        </nav>

        {/* Grid */}
        {filteredItems.length === 0 ? (
          <section id="emptyState" className="mt-10 text-center text-slate-300">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20">
              <i className="fa-regular fa-circle-xmark"></i>
              暂无匹配结果，请尝试修改搜索或切换分类。
            </div>
          </section>
        ) : (
          <section id="grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((x) => {
              const it = x.item;
              const fav = favorites.has(it.id);
              return (
                <Card
                  key={it.id}
                  className="bg-white/60 border border-slate-200/60 backdrop-blur-xl rounded-2xl p-4 shadow-glass hover:bg-white/80 transition dark:bg-white/10 dark:border-white/20 dark:hover:bg-white/20 tilt"
                  onMouseMove={handleTiltMove}
                  onMouseLeave={handleTiltLeave}
                >
                  <CardHeader className="flex items-start gap-3">
                    <div className="group icon-wrap inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 dark:bg-white/10 dark:border-white/20 shrink-0 transition hover:scale-105">
                      <i className={cls(it.icon || "fa-solid fa-link", "text-fuchsia-500 dark:text-fuchsia-300 text-lg transition-transform duration-300 group-hover:rotate-6 group-hover:scale-125")} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <a
                          className="text-base font-semibold tracking-wide text-slate-800 dark:text-white hover:underline"
                          href={it.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {it.title}
                        </a>
                        <div className="flex items-center gap-2">
                          <Button
                            className="fav-btn group px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 dark:border-white/20 dark:bg-white/10 dark:hover:bg-white/20 transition"
                            onPress={(e) => toggleFavorite(it.id, e.currentTarget)}
                            isIconOnly
                            aria-label="收藏"
                          >
                            <i
                              className={cls(
                                fav
                                  ? "fa-solid fa-star text-amber-400"
                                  : "fa-regular fa-star text-slate-700 dark:text-slate-200",
                                "transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12 group-hover:text-amber-400"
                              )}
                            />
                          </Button>
                          <Button
                            className="copy-btn group px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 dark:border-white/20 dark:bg-white/10 dark:hover:bg-white/20 transition"
                            onPress={() => copyUrl(it.url)}
                            isIconOnly
                            aria-label="复制链接"
                          >
                            <i className="fa-solid fa-copy text-slate-700 dark:text-slate-200 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-6 group-hover:text-sky-600 dark:group-hover:text-violet-400" />
                          </Button>
                        </div>
                      </div>

                      <Popover placement="top-start" showArrow backdrop="blur">
                        <PopoverTrigger>
                          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 line-clamp-2 cursor-pointer hover:text-slate-800 dark:hover:text-white">
                            {it.desc}
                          </p>
                        </PopoverTrigger>
                        <PopoverContent>
                          <div className="max-w-xs sm:max-w-sm text-sm text-slate-800 dark:text-slate-100">
                            {it.desc}
                          </div>
                        </PopoverContent>
                      </Popover>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600 dark:bg-white/10 dark:border-white/20 dark:text-slate-200">
                          <i className="fa-solid fa-tag" />
                          {x.categoryName}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardBody />
                </Card>
              );
            })}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-8 border-t border-slate-200/50 dark:border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-6 text-sm text-slate-700 dark:text-slate-300">
          <p>创建人：Jacob</p>
          <p className="mt-1">创建时间：2025-10-06</p>
        </div>
      </footer>

      {/* Toast */}
      <div
        id="toast"
        className={cls(
          "fixed bottom-4 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg bg-slate-900/80 text-white text-sm shadow-lg transition z-40 dark:bg-slate-900/80",
          toast.show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        )}
      >
        {toast.msg || "已复制链接"}
      </div>

      {/* Scroll top rocket */}
      <Button
        id="scrollTopBtn"
        aria-label="回到顶部"
        isIconOnly
        className={cls(
          "fixed bottom-6 right-6 h-11 w-11 rounded-full bg-fuchsia-600 text-white shadow-glass flex items-center justify-center transition z-40 hover:scale-105 dark:bg-fuchsia-500",
          showRocket ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-2 pointer-events-none"
        )}
        onPress={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      >
        <i className="fa-solid fa-rocket"></i>
      </Button>
    </>
  );
}