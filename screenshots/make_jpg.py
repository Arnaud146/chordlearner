from PIL import Image, ImageDraw, ImageFont
import os, textwrap

SCREENSHOTS_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(SCREENSHOTS_DIR, "export_jpg")
os.makedirs(OUTPUT_DIR, exist_ok=True)

CANVAS_W = 1400
MARGIN = 40
IMG_W = CANVAS_W - 2 * MARGIN
BG = (248, 244, 234)        # beige clair
DARK = (45, 42, 36)         # brun foncé
MUTED = (90, 82, 70)        # brun moyen
ACCENT = (142, 128, 104)    # beige foncé
SEP = (217, 204, 178)       # séparateur

def load_font(size, bold=False):
    try:
        name = "arialbd.ttf" if bold else "arial.ttf"
        return ImageFont.truetype(name, size)
    except:
        return ImageFont.load_default()

font_big   = load_font(32, bold=True)
font_med   = load_font(20, bold=True)
font_small = load_font(16)
font_cap   = load_font(14)
font_num   = load_font(12)

sections = [
    {
        "id": "01_non-connecte",
        "title": "Pages publiques — Non connecté",
        "subtitle": "Vues accessibles sans compte",
        "pages": [
            ("non-connecte_01_accueil.png",           "Accueil (Hero + Fonctionnalités)"),
            ("non-connecte_02_connexion.png",          "Page Connexion"),
            ("non-connecte_03_inscription.png",        "Page Inscription"),
            ("non-connecte_08_songs-sans-auth.png",    "Bibliothèque /songs (sans compte)"),
            ("non-connecte_09_profil-redirection.png", "Profil → Redirection vers Connexion"),
            ("non-connecte_04_cgu.png",                "Conditions Générales d'Utilisation"),
            ("non-connecte_05_confidentialite.png",    "Politique de Confidentialité"),
            ("non-connecte_06_mentions-legales.png",   "Mentions Légales"),
            ("non-connecte_07_status.png",             "Page Status / Health check"),
        ],
    },
    {
        "id": "02_connecte",
        "title": "Pages connectées",
        "subtitle": "Compte : arnaud.schmidt@outlook.fr",
        "pages": [
            ("connecte_01_accueil.png",             "Accueil (navbar connectée)"),
            ("connecte_08_songs-liste.png",         "Bibliothèque — Liste des morceaux"),
            ("connecte_09_songs-nouveau.png",       "Nouveau morceau — Formulaire"),
            ("connecte_09a_songs-nouveau-ocr.png",  "Nouveau morceau — Onglet OCR"),
            ("connecte_09b_songs-nouveau-url.png",  "Nouveau morceau — Onglet URL web"),
            ("connecte_11_song-detail.png",         "Détail d'un morceau"),
            ("connecte_12_song-chords.png",         "Accords & Piano — Vue principale"),
            ("connecte_12b_song-chords-scroll.png", "Accords & Piano — Suite (scroll)"),
            ("connecte_13_song-ocr-review.png",     "Revue OCR d'un morceau"),
            ("connecte_10_profil.png",              "Page Profil"),
        ],
    },
]

def measure_text(draw, text, font):
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]

def build_section_image(section):
    pages = section["pages"]

    # ── Mesure la hauteur totale nécessaire ─────────────────────────
    # header
    total_h = MARGIN + 10 + 36 + 8 + 22 + 20 + 2 + MARGIN

    thumb_entries = []
    for filename, caption in pages:
        path = os.path.join(SCREENSHOTS_DIR, filename)
        if not os.path.exists(path):
            continue
        with Image.open(path) as img:
            iw, ih = img.size
        scale = IMG_W / iw
        th = int(ih * scale)
        thumb_entries.append((path, caption, IMG_W, th))
        # label + image + gap + caption + gap
        total_h += 28 + th + 6 + 18 + MARGIN

    # ── Crée le canvas ──────────────────────────────────────────────
    canvas = Image.new("RGB", (CANVAS_W, total_h), BG)
    draw = ImageDraw.Draw(canvas)

    y = MARGIN

    # En-tête section
    draw.text((MARGIN, y), "ChordLearner", font=font_small, fill=ACCENT)
    y += 36
    draw.text((MARGIN, y), section["title"], font=font_big, fill=DARK)
    y += 8
    _, th_sub = measure_text(draw, section["subtitle"], font_small)
    draw.text((MARGIN, y), section["subtitle"], font=font_small, fill=MUTED)
    y += th_sub + 20
    draw.line([(MARGIN, y), (CANVAS_W - MARGIN, y)], fill=SEP, width=2)
    y += MARGIN

    # ── Captures ────────────────────────────────────────────────────
    for i, (path, caption, tw, th) in enumerate(thumb_entries):
        # Numéro + label
        label = f"{i + 1:02d}  {caption}"
        draw.text((MARGIN, y), label, font=font_med, fill=DARK)
        y += 28

        # Image (redimensionnée)
        with Image.open(path) as img:
            img_resized = img.convert("RGB").resize((tw, th), Image.LANCZOS)
        canvas.paste(img_resized, (MARGIN, y))

        # Ombre légère sous l'image
        y += th + 6

        # Caption petit texte
        draw.text((MARGIN, y), path.replace(SCREENSHOTS_DIR + os.sep, ""), font=font_num, fill=ACCENT)
        y += 18 + MARGIN

    return canvas

# ── Export ───────────────────────────────────────────────────────────
for section in sections:
    print(f"Building {section['id']}…")
    img = build_section_image(section)
    out_path = os.path.join(OUTPUT_DIR, f"{section['id']}.jpg")
    img.save(out_path, "JPEG", quality=92)
    print(f"  -> {out_path}  ({img.width}x{img.height}px, {os.path.getsize(out_path)//1024} KB)")

print("\nDone! Fichiers dans:", OUTPUT_DIR)
