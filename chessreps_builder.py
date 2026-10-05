import argparse
import re
import hashlib
import io
import zipfile
from pathlib import Path
from datetime import datetime

import requests
import chess.pgn

try:
    import zstandard as zstd
except ImportError:
    zstd = None

try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None

ROOT = Path(__file__).resolve().parent
RAW_TWIC = ROOT / "raw" / "twic"
RAW_BROADCAST = ROOT / "raw" / "broadcast"
OUTPUT = ROOT / "output"
RAW_TWIC.mkdir(parents=True, exist_ok=True)
RAW_BROADCAST.mkdir(parents=True, exist_ok=True)
OUTPUT.mkdir(parents=True, exist_ok=True)

TWIC_URL = "https://theweekinchess.com/twic"
BROADCAST_URL = "https://database.lichess.org/broadcast/"
HEADERS = {"User-Agent": "Chessreps-PGN-Builder/1.0"}

def get(url):
    r = requests.get(url, headers=HEADERS, timeout=120)
    r.raise_for_status()
    return r

def twic_links():
    if BeautifulSoup is None:
        raise RuntimeError("Install beautifulsoup4 first.")
    soup = BeautifulSoup(get(TWIC_URL).text, "html.parser")
    result = {}
    for a in soup.find_all("a", href=True):
        text = a.get_text(" ", strip=True).lower()
        href = a["href"]
        m = re.search(r"(?:twic|week).*?(\d{3,4}).*?pgn|(\d{3,4}).*?pgn", text + " " + href.lower())
        if not m:
            continue
        n = int(m.group(1) or m.group(2))
        if "pgn" in text or "pgn" in href.lower():
            if href.startswith("/"):
                href = "https://theweekinchess.com" + href
            elif href.startswith("http://"):
                href = "https://" + href[7:]
            result[n] = href
    return result

def download_twic(numbers):
    links = twic_links()
    for n in numbers:
        if n not in links:
            print(f"[WARN] TWIC {n}: PGN link tidak ditemukan otomatis.")
            continue
        target = RAW_TWIC / f"twic{n}.pgn"
        if target.exists():
            print(f"[SKIP] {target.name}")
            continue
        print(f"[DOWNLOAD] TWIC {n}")
        data = get(links[n]).content
        # TWIC download biasanya ZIP; kadang server memberi PGN langsung.
        if data[:2] == b"PK":
            with zipfile.ZipFile(io.BytesIO(data)) as z:
                pgns = [x for x in z.namelist() if x.lower().endswith(".pgn")]
                if not pgns:
                    raise RuntimeError(f"Tidak ada PGN dalam TWIC {n}")
                with z.open(pgns[0]) as f:
                    target.write_bytes(f.read())
        else:
            target.write_bytes(data)
        print(f"[OK] {target}")

def broadcast_url(month):
    return f"{BROADCAST_URL}lichess_db_broadcast_{month}.pgn.zst"

def download_broadcast(months):
    if zstd is None:
        raise RuntimeError("Install zstandard: pip install zstandard")
    for month in months:
        target = RAW_BROADCAST / f"broadcast_{month}.pgn"
        if target.exists():
            print(f"[SKIP] {target.name}")
            continue
        print(f"[DOWNLOAD] Lichess Broadcast {month}")
        r = get(broadcast_url(month))
        dctx = zstd.ZstdDecompressor()
        with dctx.stream_reader(io.BytesIO(r.content)) as reader:
            data = reader.read()
        target.write_bytes(data)
        print(f"[OK] {target}")

def month_range(start, end):
    y1, m1 = map(int, start.split("-"))
    y2, m2 = map(int, end.split("-"))
    out = []
    y, m = y1, m1
    while (y, m) <= (y2, m2):
        out.append(f"{y:04d}-{m:02d}")
        m += 1
        if m == 13:
            m = 1
            y += 1
    return out

def twic_range(a, b):
    return list(range(a, b + 1))

def pgn_files():
    return sorted(list(RAW_TWIC.glob("*.pgn")) + list(RAW_BROADCAST.glob("*.pgn")))

def game_key(game):
    h = game.headers
    # Moves are included so the same players/date with different games are retained.
    moves = []
    board = game.board()
    for move in game.mainline_moves():
        moves.append(board.san(move))
        board.push(move)
    raw = "\x1f".join([
        h.get("White", "").strip().lower(),
        h.get("Black", "").strip().lower(),
        h.get("Date", ""),
        h.get("Round", ""),
        h.get("Event", "").strip().lower(),
        h.get("Result", ""),
        " ".join(moves),
    ])
    return hashlib.sha256(raw.encode("utf-8", errors="replace")).hexdigest()

def merge(dedup=True):
    files = pgn_files()
    if not files:
        print("[ERROR] Tidak ada file PGN di raw/. Download dulu.")
        return

    out = OUTPUT / ("master_games_clean.pgn" if dedup else "master_games.pgn")
    seen = set()
    total = unique = duplicates = bad = 0

    with out.open("w", encoding="utf-8") as dst:
        for path in files:
            print(f"[READ] {path}")
            with path.open("r", encoding="utf-8", errors="replace") as src:
                while True:
                    try:
                        game = chess.pgn.read_game(src)
                    except Exception:
                        bad += 1
                        continue
                    if game is None:
                        break
                    total += 1
                    if dedup:
                        key = game_key(game)
                        if key in seen:
                            duplicates += 1
                            continue
                        seen.add(key)
                    print(game, file=dst)
                    dst.write("\n")
                    unique += 1

    print("\n=== MERGE RESULT ===")
    print("Input games :", total)
    print("Output games:", unique)
    print("Duplicates  :", duplicates)
    print("Bad games   :", bad)
    print("Output      :", out)

def elo(game, side):
    try:
        return int(game.headers.get(side + "Elo", "0"))
    except ValueError:
        return 0

def game_year(game):
    try:
        return int(game.headers.get("Date", "0")[:4])
    except ValueError:
        return 0

def make_gm(min_elo=2500, since=0, limit=0):
    src_path = OUTPUT / "master_games_clean.pgn"
    if not src_path.exists():
        src_path = OUTPUT / "master_games.pgn"
    if not src_path.exists():
        print("[ERROR] Jalankan --merge terlebih dahulu.")
        return

    out = OUTPUT / "gm_games.pgn"
    total = kept = 0

    with src_path.open("r", encoding="utf-8", errors="replace") as src, \
         out.open("w", encoding="utf-8") as dst:
        while True:
            game = chess.pgn.read_game(src)
            if game is None:
                break
            total += 1
            if limit and kept >= limit:
                break
            if since and game_year(game) < since:
                continue
            if max(elo(game, "White"), elo(game, "Black")) >= min_elo:
                print(game, file=dst)
                dst.write("\n")
                kept += 1

    print("\n=== GM FILTER ===")
    print("Input games :", total)
    print(f"Elo >= {min_elo}:", kept)
    print("Output      :", out)

def fnv(text, seed):
    h = seed
    for ch in text:
        h ^= ord(ch)
        h = (h * 16777619) & 0xFFFFFFFF
    return format(h, "08x")

def pos_key(board):
    """Kunci posisi yang sama persis dengan fungsi key() di Si BIDAK (4 field FEN pertama)."""
    f = " ".join(board.fen(en_passant="fen").split(" ")[:4])
    return fnv(f, 0x811C9DC5) + fnv(f, 0x050C5D1F)

def make_stats(ply=30, min_n=3):
    """gm_games.pgn -> output/stats.json (statistik per posisi, tanpa PGN mentah)."""
    import json
    src = OUTPUT / "gm_games.pgn"
    if not src.exists():
        print("[ERROR] Jalankan --merge --gm terlebih dahulu.")
        return
    res_idx = {"1-0": 0, "1/2-1/2": 1, "0-1": 2}
    pos = {}
    total = 0
    with src.open("r", encoding="utf-8", errors="replace") as f:
        while True:
            game = chess.pgn.read_game(f)
            if game is None:
                break
            r = res_idx.get(game.headers.get("Result"))
            if r is None:
                continue
            total += 1
            board = game.board()
            moves = list(game.mainline_moves())
            n = min(len(moves), ply)
            for i in range(n + 1):
                e = pos.setdefault(pos_key(board), [0, [0, 0, 0], {}])
                e[0] += 1
                e[1][r] += 1
                if i == n:
                    break
                san = board.san(moves[i])
                x = e[2].setdefault(san, [0, 0, 0, 0])
                x[0] += 1
                x[r + 1] += 1
                board.push(moves[i])
    out = {}
    for k, (n, rr, mv) in pos.items():
        if n < min_n:
            continue
        top = sorted(mv.items(), key=lambda kv: -kv[1][0])[:8]
        out[k] = [n, rr[0], rr[1], rr[2], [[s] + v for s, v in top]]
    target = OUTPUT / "stats.json"
    target.write_text(json.dumps({"v": 1, "games": total, "pos": out}, separators=(",", ":")), encoding="utf-8")
    print(f"\n=== STATS ===\nPartai: {total}\nPosisi: {len(out)}\nOutput: {target}")

def embed_stats(html_path):
    """Menanamkan stats.json ke salinan HTML -> output/<nama>_offline.html."""
    src = Path(html_path)
    stats = (OUTPUT / "stats.json").read_text(encoding="utf-8")
    html = src.read_text(encoding="utf-8")
    pat = re.compile(r'(<script id="offstats" type="application/json">)(.*?)(</script>)', re.S)
    if not pat.search(html):
        print("[ERROR] Slot offstats tidak ditemukan di HTML.")
        return
    html = pat.sub(lambda m: m.group(1) + stats + m.group(3), html, count=1)
    target = OUTPUT / (src.stem + "_offline.html")
    target.write_text(html, encoding="utf-8")
    print("[OK]", target)

def main():
    p = argparse.ArgumentParser(description="Chessreps PGN Builder")
    p.add_argument("--twic", nargs="*", type=int)
    p.add_argument("--twic-range", nargs=2, type=int)
    p.add_argument("--broadcast", nargs="*")
    p.add_argument("--broadcast-range", nargs=2)
    p.add_argument("--merge", action="store_true")
    p.add_argument("--no-dedup", action="store_true")
    p.add_argument("--gm", action="store_true")
    p.add_argument("--min-elo", type=int, default=2500)
    p.add_argument("--since", type=int, default=0, help="hanya partai dari tahun ini ke atas")
    p.add_argument("--stats", action="store_true", help="buat output/stats.json dari gm_games.pgn")
    p.add_argument("--ply", type=int, default=30)
    p.add_argument("--min-n", type=int, default=3)
    p.add_argument("--embed", help="tanam stats.json ke file HTML (Si BIDAK)")
    p.add_argument("--max-games", type=int, default=0, help="batas jumlah partai di gm_games.pgn (0 = tanpa batas)")
    args = p.parse_args()

    if args.twic:
        download_twic(args.twic)
    if args.twic_range:
        download_twic(twic_range(args.twic_range[0], args.twic_range[1]))
    if args.broadcast:
        download_broadcast(args.broadcast)
    if args.broadcast_range:
        download_broadcast(month_range(args.broadcast_range[0], args.broadcast_range[1]))
    if args.merge:
        merge(dedup=not args.no_dedup)
    if args.gm:
        make_gm(args.min_elo, args.since, args.max_games)
    if args.stats:
        make_stats(args.ply, args.min_n)
    if args.embed:
        embed_stats(args.embed)

if __name__ == "__main__":
    main()
