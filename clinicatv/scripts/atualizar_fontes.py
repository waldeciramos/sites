#!/usr/bin/env python3
"""Lê as fontes do config.json e grava data/fontes.json (rodado pelo GitHub Actions).
kind "auto"  -> manchetes de um site (RSS se existir, senão títulos com link da página)
kind "motiva"-> trânsito da rodovia Motiva, sentido BH e sentido SP (navegador headless)"""
import json, re, pathlib, datetime
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "fontes.json"
UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36", "Accept-Language": "pt-BR,pt;q=0.9"}
clean = lambda t: re.sub(r"\s+", " ", t or "").strip()

def parse_html(html, base, n):
    soup, out, seen = BeautifulSoup(html, "html.parser"), [], set()
    sels = ["article h1 a", "article h2 a", "article h3 a", "h1 a", "h2 a", "h3 a", "[class*=titulo] a", "[class*=title] a", "[class*=noticia] a", "[class*=manchete] a"]
    for sel in sels:
        for a in soup.select(sel):
            t, h = clean(a.get_text()), a.get("href") or ""
            if 25 <= len(t) <= 220 and t.lower() not in seen and h and not h.startswith(("#", "javascript", "mailto")):
                seen.add(t.lower()); out.append({"text": t, "detail": "", "link": urljoin(base, h), "status": ""})
        if len(out) >= n: break
    return out[:n]

def parse_rss(xml, n):
    out = []
    for it in BeautifulSoup(xml, "xml").find_all(["item", "entry"])[:n]:
        t = it.find("title"); l = it.find("link")
        if t and clean(t.get_text()):
            out.append({"text": clean(t.get_text()), "detail": "", "link": (l.get("href") or l.get_text()).strip() if l else "", "status": ""})
    return out

def headlines(url, n):
    r = requests.get(url, headers=UA, timeout=25); r.raise_for_status()
    if (r.encoding or "").lower() in ("", "iso-8859-1"): r.encoding = r.apparent_encoding
    soup = BeautifulSoup(r.text, "html.parser")
    feeds = [urljoin(url, l["href"]) for l in soup.find_all("link", href=True) if re.search(r"rss|atom", l.get("type") or "")]
    for f in feeds[:2]:
        try:
            x = parse_rss(requests.get(f, headers=UA, timeout=20).content, n)
            if x: return x
        except Exception: pass
    return parse_html(r.text, url, n)

def level(s):
    s = s.lower()
    if re.search(r"normal|livre|fluid", s): return "ok"
    if re.search(r"parad|interdi|bloque|congestion|acident", s): return "alerta"
    return "atencao"

def motiva(url):
    from playwright.sync_api import sync_playwright
    items, dbg = [], []
    skip = re.compile(r"^(bases de apoio|ped[aá]gios|postos policiais|resumo|trecho|tr[aá]fego)$", re.I)
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_context(viewport={"width": 1400, "height": 900}, locale="pt-BR", user_agent=UA["User-Agent"]).new_page()
        for nome, rot in (("Belo Horizonte", "BH"), ("São Paulo", "SP")):
            pg.goto(url, wait_until="networkidle", timeout=60000)
            pg.get_by_text(re.compile(r"Sentido\s+" + nome, re.I)).first.click(timeout=20000)
            pg.wait_for_timeout(4000)
            txt = pg.locator("body").inner_text(); dbg.append("=== " + nome + "\n" + txt)
            st = next((clean(m) for m in re.findall(r"Tr[aá]fego\s*\n+\s*([^\n]+)", txt) if not skip.match(clean(m))), "")
            km = re.search(r"Trecho\s*\n+\s*([\d.,]+)\s*km", txt)
            detail = ""
            if st and level(st) != "ok":
                try:
                    pg.get_by_role("button", name=re.compile(r"^\s*Tr[aá]fego\s*$")).first.click(timeout=5000); pg.wait_for_timeout(2500)
                    novo = [l for l in map(clean, pg.locator("body").inner_text().split("\n")) if l and l not in txt]
                    detail = " · ".join(novo)[:300]
                except Exception: pass
            if not st: raise RuntimeError("não achei o status do tráfego (veja data/debug_motiva.txt)")
            items.append({"text": f"Sentido {rot}: trânsito {st.lower()}" + (f" ({km.group(1)} km)" if km else ""), "detail": detail, "link": url, "status": level(st)})
        b.close()
    return items, "\n".join(dbg)

def main():
    cfg = json.loads((ROOT / "config.json").read_text(encoding="utf-8"))
    old = {}
    try: old = {s["id"]: s for s in json.loads(OUT.read_text(encoding="utf-8")).get("sources", [])}
    except Exception: pass
    res = []
    for s in cfg.get("sources", []):
        if s.get("active") is False or not s.get("url"): continue
        e = {"id": s["id"], "name": s.get("name", ""), "ok": True, "error": "", "items": []}
        try:
            if s.get("kind") == "motiva": e["items"], _ = motiva(s["url"])
            else: e["items"] = headlines(s["url"], int(s.get("max") or 5))
            if not e["items"]: raise RuntimeError("nenhuma manchete encontrada")
        except Exception as ex:
            e.update(ok=False, error=str(ex)[:140], items=old.get(s["id"], {}).get("items", []))
            print("ERRO", s.get("name"), ex)
        res.append(e)
    prev = None
    try: prev = json.loads(OUT.read_text(encoding="utf-8"))
    except Exception: pass
    if not prev or prev.get("sources") != res:
        OUT.write_text(json.dumps({"updated": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"), "sources": res}, ensure_ascii=False, indent=1), encoding="utf-8")
        print("fontes.json atualizado")

if __name__ == "__main__": main()
