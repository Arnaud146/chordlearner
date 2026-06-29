from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Image, Paragraph, Spacer, PageBreak, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from PIL import Image as PILImage
import os

SCREENSHOTS_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_PDF = os.path.join(SCREENSHOTS_DIR, "ChordLearner_screens.pdf")

# ── Définition des sections ─────────────────────────────────────────────────
sections = [
    {
        "title": "Pages publiques — Non connecté",
        "color": "#5a5246",
        "pages": [
            ("non-connecte_01_accueil.png",              "Accueil (Hero + Fonctionnalités)"),
            ("non-connecte_02_connexion.png",            "Page Connexion"),
            ("non-connecte_03_inscription.png",          "Page Inscription"),
            ("non-connecte_08_songs-sans-auth.png",      "Bibliothèque /songs (sans compte)"),
            ("non-connecte_09_profil-redirection.png",   "Profil → Redirection vers Connexion"),
            ("non-connecte_04_cgu.png",                  "Conditions Générales d'Utilisation"),
            ("non-connecte_05_confidentialite.png",      "Politique de Confidentialité"),
            ("non-connecte_06_mentions-legales.png",     "Mentions Légales"),
            ("non-connecte_07_status.png",               "Page Status / Health check"),
        ]
    },
    {
        "title": "Pages connectées — Compte arnaud.schmidt@outlook.fr",
        "color": "#2d2a24",
        "pages": [
            ("connecte_01_accueil.png",          "Accueil (connecté — navbar complète)"),
            ("connecte_08_songs-liste.png",      "Bibliothèque — Liste des morceaux"),
            ("connecte_09_songs-nouveau.png",    "Nouveau morceau — Formulaire général"),
            ("connecte_09a_songs-nouveau-ocr.png",  "Nouveau morceau — Onglet OCR (image/PDF)"),
            ("connecte_09b_songs-nouveau-url.png",  "Nouveau morceau — Onglet URL web"),
            ("connecte_11_song-detail.png",      "Détail d'un morceau"),
            ("connecte_12_song-chords.png",      "Accords & Piano — Vue principale"),
            ("connecte_12b_song-chords-scroll.png", "Accords & Piano — Suite (scroll)"),
            ("connecte_13_song-ocr-review.png",  "Revue OCR d'un morceau"),
            ("connecte_10_profil.png",           "Page Profil"),
        ]
    },
]

# ── Styles ──────────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

style_cover_title = ParagraphStyle(
    "CoverTitle",
    fontSize=28,
    fontName="Helvetica-Bold",
    textColor=colors.HexColor("#2d2a24"),
    alignment=TA_CENTER,
    spaceAfter=8,
)
style_cover_sub = ParagraphStyle(
    "CoverSub",
    fontSize=13,
    fontName="Helvetica",
    textColor=colors.HexColor("#8e8068"),
    alignment=TA_CENTER,
    spaceAfter=4,
)
style_section = ParagraphStyle(
    "SectionTitle",
    fontSize=16,
    fontName="Helvetica-Bold",
    textColor=colors.HexColor("#2d2a24"),
    spaceBefore=6,
    spaceAfter=10,
)
style_caption = ParagraphStyle(
    "Caption",
    fontSize=9,
    fontName="Helvetica",
    textColor=colors.HexColor("#5a5246"),
    alignment=TA_CENTER,
    spaceBefore=4,
    spaceAfter=16,
)
style_page_label = ParagraphStyle(
    "PageLabel",
    fontSize=8,
    fontName="Helvetica",
    textColor=colors.HexColor("#b0a896"),
    alignment=TA_LEFT,
)

# ── Helpers ─────────────────────────────────────────────────────────────────
PAGE_W, PAGE_H = A4
MARGIN = 18 * mm
USABLE_W = PAGE_W - 2 * MARGIN
USABLE_H = PAGE_H - 2 * MARGIN

def fit_image(path, max_w, max_h):
    """Resize image proportionally to fit within max_w x max_h."""
    with PILImage.open(path) as img:
        iw, ih = img.size
    ratio = min(max_w / iw, max_h / ih, 1.0)
    return iw * ratio, ih * ratio

def section_header(title, color):
    return [
        HRFlowable(width="100%", thickness=1, color=colors.HexColor(color), spaceAfter=6),
        Paragraph(title, style_section),
        Spacer(1, 4 * mm),
    ]

# ── Build ────────────────────────────────────────────────────────────────────
doc = SimpleDocTemplate(
    OUTPUT_PDF,
    pagesize=A4,
    leftMargin=MARGIN,
    rightMargin=MARGIN,
    topMargin=MARGIN,
    bottomMargin=MARGIN,
)

story = []

# Cover
story.append(Spacer(1, 40 * mm))
story.append(Paragraph("ChordLearner", style_cover_title))
story.append(Paragraph("Captures d'écran — Toutes les pages du site", style_cover_sub))
story.append(Paragraph("Connecté &amp; Non connecté", style_cover_sub))
story.append(Spacer(1, 8 * mm))
story.append(HRFlowable(width="60%", thickness=1, color=colors.HexColor("#d9ccb2")))
story.append(Spacer(1, 6 * mm))

total = sum(len(s["pages"]) for s in sections)
story.append(Paragraph(f"{total} captures d'écran • {len(sections)} sections", style_cover_sub))
story.append(PageBreak())

# Sections
for section in sections:
    story += section_header(section["title"], section["color"])

    for filename, caption in section["pages"]:
        path = os.path.join(SCREENSHOTS_DIR, filename)
        if not os.path.exists(path):
            print(f"  MANQUANT : {filename}")
            continue

        img_w, img_h = fit_image(path, USABLE_W, USABLE_H * 0.82)
        story.append(Image(path, width=img_w, height=img_h))
        story.append(Paragraph(caption, style_caption))
        story.append(PageBreak())

    # Remove last PageBreak before new section
    # (already added above, keep it clean)

print(f"Building PDF with {len(story)} elements…")
doc.build(story)
print(f"\n✓ PDF généré : {OUTPUT_PDF}")
