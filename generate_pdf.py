import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Ensure we have a font that supports Cyrillic
# Standard PDF fonts do NOT support Cyrillic well.
# We'll try to find a system font or use a generic approach.
# For this environment, we might need to rely on what's available or use a basic layout.

def generate_pdf():
    doc = SimpleDocTemplate("system_documentation.pdf", pagesize=A4)
    styles = getSampleStyleSheet()
    
    # Try to register a font if available, else use a fallback
    # Note: ReportLab needs external TTF for Russian. 
    # If no TTF is found, let's just make sure the content is clear.
    try:
        # Common linux path for DejaVuSans
        font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
        if os.path.exists(font_path):
            pdfmetrics.registerFont(TTFont('Cyrillic', font_path))
            font_name = 'Cyrillic'
        else:
            font_name = 'Helvetica' # Might fail for Russian if no glyphs
    except:
        font_name = 'Helvetica'

    custom_style = ParagraphStyle(
        'RussianStyle',
        parent=styles['Normal'],
        fontName=font_name,
        fontSize=10,
        leading=12
    )
    
    title_style = ParagraphStyle(
        'RussianTitle',
        parent=styles['Heading1'],
        fontName=font_name,
        fontSize=18,
        leading=22,
        spaceAfter=12
    )

    h2_style = ParagraphStyle(
        'RussianH2',
        parent=styles['Heading2'],
        fontName=font_name,
        fontSize=14,
        leading=18,
        spaceBefore=10,
        spaceAfter=6
    )

    elements = []

    content = [
        ("Система Silk Road: Техническое описание", title_style),
        ("1. Обзор архитектуры", h2_style),
        ("Система Silk Road построена на современном технологическом стеке:", custom_style),
        ("- Backend: Django + Django REST Framework.", custom_style),
        ("- БД: PostgreSQL (транзакции) и ClickHouse (аналитика).", custom_style),
        ("- Кэш: Redis + Celery.", custom_style),
        ("2. Интеграция с e-mehmon", h2_style),
        ("Автоматизация регистрации иностранных граждан через API.", custom_style),
        ("- Отправка данных гостя сразу после бронирования.", custom_style),
        ("- Синхронизация статусов через Webhooks.", custom_style),
        ("- Автоматическая проверка паспортов.", custom_style),
        ("3. Требования e-mehmon", h2_style),
        ("Для работы требуется API Key, Secret и доступ к эндпоинтам e-mehmon.", custom_style),
        ("- Обязательно наличие SSL сертификата.", custom_style),
        ("- Необходима регистрация Callback URL в e-mehmon.", custom_style),
        ("4. Безопасность и Масштабируемость", h2_style),
        ("Система поддерживает RBAC (Owner, Operator) и аудит-лог (SecurityLog).", custom_style),
        ("- Все действия вендоров записываются для повышения прозрачности.", custom_style),
        ("- Используется Redis для кэширования валют и популярных отелей.", custom_style),
    ]

    for text, style in content:
        elements.append(Paragraph(text, style))
        elements.append(Spacer(1, 6))

    doc.build(elements)
    print("PDF generated successfully.")

if __name__ == "__main__":
    generate_pdf()
