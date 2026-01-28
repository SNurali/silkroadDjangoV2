"""
PDF Generation Service for Hotel Bookings and Sight Tickets.
Uses ReportLab for professional PDF documents.
"""

from io import BytesIO
from datetime import datetime
import qrcode
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, mm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
from reportlab.pdfgen import canvas
from django.conf import settings


class BookingPDFGenerator:
    """
    Generates professional booking confirmation PDF.
    Based on Laravel's booking-confirm-pdf.blade.php layout.
    """
    
    def __init__(self, booking):
        self.booking = booking
        self.buffer = BytesIO()
        self.width, self.height = A4
        
    def generate(self):
        """Main generation method"""
        doc = SimpleDocTemplate(
            self.buffer,
            pagesize=A4,
            rightMargin=30*mm,
            leftMargin=30*mm,
            topMargin=20*mm,
            bottomMargin=20*mm,
        )
        
        # Build content
        story = []
        styles = self._get_styles()
        
        # Header
        story.extend(self._build_header(styles))
        story.append(Spacer(1, 15*mm))
        
        # Booking Info
        story.extend(self._build_booking_info(styles))
        story.append(Spacer(1, 10*mm))
        
        # Hotel Details
        story.extend(self._build_hotel_details(styles))
        story.append(Spacer(1, 10*mm))
        
        # Guest Details
        story.extend(self._build_guest_details(styles))
        story.append(Spacer(1, 10*mm))
        
        # Rooms & Pricing
        story.extend(self._build_pricing_table(styles))
        story.append(Spacer(1, 10*mm))
        
        # Footer
        story.extend(self._build_footer(styles))
        
        # Build PDF
        doc.build(story, onFirstPage=self._add_watermark, onLaterPages=self._add_watermark)
        
        self.buffer.seek(0)
        return self.buffer
    
    def _get_styles(self):
        """Custom styles for the document"""
        styles = getSampleStyleSheet()
        
        # Custom styles
        styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=6*mm,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=3*mm,
            spaceBefore=2*mm,
            fontName='Helvetica-Bold'
        ))
        
        styles.add(ParagraphStyle(
            name='InfoText',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#374151'),
            spaceAfter=2*mm,
        ))
        
        styles.add(ParagraphStyle(
            name='SmallGray',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.HexColor('#6b7280'),
            alignment=TA_CENTER,
        ))
        
        return styles
    
    def _build_header(self, styles):
        """Build PDF header with logo and title"""
        elements = []
        
        # Title
        title = Paragraph("<b>BOOKING CONFIRMATION</b>", styles['CustomTitle'])
        elements.append(title)
        
        # Booking ID
        booking_id = Paragraph(
            f"<b>Booking ID:</b> #{self.booking.id} | <b>Status:</b> {self.booking.status.upper()}",
            styles['InfoText']
        )
        elements.append(booking_id)
        
        # Date
        date_text = Paragraph(
            f"<b>Issued:</b> {datetime.now().strftime('%d %B %Y, %H:%M')}",
            styles['SmallGray']
        )
        elements.append(date_text)
        
        return elements
    
    def _build_booking_info(self, styles):
        """Build booking information section"""
        elements = []
        
        header = Paragraph("<b>Booking Information</b>", styles['SectionHeader'])
        elements.append(header)
        
        # Calculate nights
        nights = (self.booking.check_out - self.booking.check_in).days
        
        data = [
            ['Check-in:', self.booking.check_in.strftime('%d %B %Y')],
            ['Check-out:', self.booking.check_out.strftime('%d %B %Y')],
            ['Nights:', f"{nights} night(s)"],
            ['Guests:', f"{self.booking.adults} Adult(s), {self.booking.children} Child(ren)"],
        ]
        
        table = Table(data, colWidths=[40*mm, 100*mm])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1f2937')),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 3*mm),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3*mm),
            ('LEFTPADDING', (0, 0), (-1, -1), 3*mm),
            ('RIGHTPADDING', (0, 0), (-1, -1), 3*mm),
        ]))
        
        elements.append(table)
        return elements
    
    def _build_hotel_details(self, styles):
        """Build hotel details section"""
        elements = []
        
        header = Paragraph("<b>Hotel Details</b>", styles['SectionHeader'])
        elements.append(header)
        
        data = [
            ['Hotel Name:', self.booking.hotel.name],
            ['Address:', self.booking.hotel.address or 'N/A'],
            ['Region:', self.booking.hotel.region.name if self.booking.hotel.region else 'N/A'],
            ['Stars:', '⭐' * self.booking.hotel.stars if self.booking.hotel.stars else 'Unrated'],
        ]
        
        table = Table(data, colWidths=[40*mm, 100*mm])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1f2937')),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 3*mm),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3*mm),
            ('LEFTPADDING', (0, 0), (-1, -1), 3*mm),
            ('RIGHTPADDING', (0, 0), (-1, -1), 3*mm),
        ]))
        
        elements.append(table)
        return elements
    
    def _build_guest_details(self, styles):
        """Build guest details section"""
        elements = []
        
        header = Paragraph("<b>Guest Information</b>", styles['SectionHeader'])
        elements.append(header)
        
        data = [
            ['Name:', self.booking.guest_name],
            ['Email:', self.booking.guest_email],
            ['Phone:', self.booking.guest_phone],
        ]
        
        if self.booking.special_requests:
            data.append(['Special Requests:', self.booking.special_requests])
        
        table = Table(data, colWidths=[40*mm, 100*mm])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1f2937')),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 3*mm),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3*mm),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        
        elements.append(table)
        return elements
    
    def _build_pricing_table(self, styles):
        """Build pricing breakdown"""
        elements = []
        
        header = Paragraph("<b>Pricing Summary</b>", styles['SectionHeader'])
        elements.append(header)
        
        # Parse selected rooms
        rooms_data = [['Room Type', 'Quantity', 'Price/Night', 'Nights', 'Subtotal']]
        
        try:
            import json
            selected_rooms = self.booking.selected_rooms_json if isinstance(self.booking.selected_rooms_json, list) else json.loads(self.booking.selected_rooms_json or '[]')
            
            nights = (self.booking.check_out - self.booking.check_in).days
            
            for room in selected_rooms:
                room_type = room.get('roomType', 'Room')
                qty = room.get('quantity', room.get('count', 1))
                price = float(room.get('price_per_night', room.get('price', 0)))
                subtotal = price * qty * nights
                
                rooms_data.append([
                    room_type,
                    str(qty),
                    f"${price:.2f}",
                    str(nights),
                    f"${subtotal:.2f}"
                ])
        except:
            rooms_data.append(['Standard Room', '1', f"${float(self.booking.total_price):.2f}", '1', f"${float(self.booking.total_price):.2f}"])
        
        # Total row
        rooms_data.append(['', '', '', 'TOTAL:', f"${float(self.booking.total_price):.2f}"])
        
        table = Table(rooms_data, colWidths=[50*mm, 20*mm, 25*mm, 20*mm, 30*mm])
        table.setStyle(TableStyle([
            # Header row
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            
            # Data rows
            ('TEXTCOLOR', (0, 1), (-1, -2), colors.HexColor('#1f2937')),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -2), 0.5, colors.HexColor('#e5e7eb')),
            
            # Total row
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#f3f4f6')),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, -1), (-1, -1), 12),
            ('ALIGN', (0, -1), (-1, -1), 'RIGHT'),
            ('LINEABOVE', (0, -1), (-1, -1), 2, colors.HexColor('#1e40af')),
            
            # Padding
            ('TOPPADDING', (0, 0), (-1, -1), 3*mm),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3*mm),
        ]))
        
        elements.append(table)
        
        # Payment status
        payment_status = Paragraph(
            f"<b>Payment Status:</b> {self.booking.status.upper()}",
            styles['InfoText']
        )
        elements.append(Spacer(1, 3*mm))
        elements.append(payment_status)
        
        return elements
    
    def _build_footer(self, styles):
        """Build footer with terms and contact"""
        elements = []
        
        footer_text = Paragraph(
            """
            <b>Important Information:</b><br/>
            • Please bring a valid ID for check-in<br/>
            • Check-in time: 14:00 | Check-out time: 12:00<br/>
            • Cancellation policy applies as per hotel terms<br/>
            • For inquiries, contact: support@silkroad.uz
            """,
            styles['SmallGray']
        )
        elements.append(footer_text)
        
        elements.append(Spacer(1, 5*mm))
        
        thank_you = Paragraph(
            "<b>Thank you for choosing SilkRoad!</b><br/>Have a wonderful stay in Uzbekistan 🇺🇿",
            styles['SmallGray']
        )
        elements.append(thank_you)
        
        return elements
    
    def _add_watermark(self, canvas, doc):
        """Add watermark/background elements"""
        canvas.saveState()
        
        # Add subtle watermark if pending payment
        if self.booking.status.lower() == 'new':
            canvas.setFont('Helvetica-Bold', 60)
            canvas.setFillColorRGB(0.9, 0.9, 0.9, alpha=0.3)
            canvas.translate(self.width/2, self.height/2)
            canvas.rotate(45)
            canvas.drawCentredString(0, 0, "PENDING")
        
        canvas.restoreState()


class TicketPDFGenerator:
    """
    Generates ticket PDF with QR code.
    Based on Laravel's ticket download logic.
    """
    
    def __init__(self, ticket):
        self.ticket = ticket
        self.buffer = BytesIO()
        self.width, self.height = A4
        
    def generate(self):
        """Main generation method"""
        doc = SimpleDocTemplate(
            self.buffer,
            pagesize=A4,
            rightMargin=30*mm,
            leftMargin=30*mm,
            topMargin=20*mm,
            bottomMargin=20*mm,
        )
        
        story = []
        styles = self._get_styles()
        
        # Header
        story.extend(self._build_header(styles))
        story.append(Spacer(1, 10*mm))
        
        # Ticket Details
        story.extend(self._build_ticket_details(styles))
        story.append(Spacer(1, 10*mm))
        
        # QR Code
        story.extend(self._build_qr_code())
        story.append(Spacer(1, 10*mm))
        
        # Footer
        story.extend(self._build_footer(styles))
        
        doc.build(story)
        
        self.buffer.seek(0)
        return self.buffer
    
    def _get_styles(self):
        """Custom styles"""
        styles = getSampleStyleSheet()
        
        styles.add(ParagraphStyle(
            name='TicketTitle',
            parent=styles['Heading1'],
            fontSize=28,
            textColor=colors.HexColor('#059669'),
            spaceAfter=8*mm,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#059669'),
            spaceAfter=3*mm,
            fontName='Helvetica-Bold'
        ))
        
        styles.add(ParagraphStyle(
            name='InfoText',
            fontSize=11,
            textColor=colors.HexColor('#1f2937'),
            spaceAfter=2*mm,
        ))
        
        styles.add(ParagraphStyle(
            name='SmallGray',
            fontSize=8,
            textColor=colors.HexColor('#6b7280'),
            alignment=TA_CENTER,
        ))
        
        return styles
    
    def _build_header(self, styles):
        """Build ticket header"""
        elements = []
        
        title = Paragraph("🎫 <b>ENTRY TICKET</b>", styles['TicketTitle'])
        elements.append(title)
        
        ticket_id = Paragraph(
            f"<b>Ticket ID:</b> #{self.ticket.id} | <b>Status:</b> {'VALID' if self.ticket.is_valid else 'INVALID'}",
            styles['InfoText']
        )
        elements.append(ticket_id)
        
        return elements
    
    def _build_ticket_details(self, styles):
        """Build ticket information"""
        elements = []
        
        header = Paragraph("<b>Attraction Details</b>", styles['SectionHeader'])
        elements.append(header)
        
        data = [
            ['Service:', self.ticket.ticket_type.service.name],
            ['Type:', self.ticket.ticket_type.service.type],
            ['Tickets:', f"{self.ticket.total_qty} person(s)"],
            ['Total Amount:', f"${float(self.ticket.price_paid):.2f}"],
            ['Valid:', 'YES' if self.ticket.is_valid else 'NO - Payment Required'],
            ['Issued:', self.ticket.purchase_date.strftime('%d %B %Y, %H:%M')],
        ]
        
        table = Table(data, colWidths=[50*mm, 100*mm])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0fdf4')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1f2937')),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 3*mm),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3*mm),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1fae5')),
        ]))
        
        elements.append(table)
        return elements
    
    def _build_qr_code(self):
        """Generate and add QR code"""
        elements = []
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=4,
        )
        
        # QR data: ticket verification URL
        qr_data = f"https://silkroad.uz/verify-ticket/{self.ticket.id}"
        qr.add_data(qr_data)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Save to buffer
        img_buffer = BytesIO()
        img.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        
        # Add to PDF
        qr_image = Image(img_buffer, width=60*mm, height=60*mm)
        qr_image.hAlign = 'CENTER'
        elements.append(qr_image)
        
        # QR instruction
        styles = self._get_styles()
        instruction = Paragraph(
            "Scan this QR code at the entrance",
            styles['SmallGray']
        )
        elements.append(Spacer(1, 3*mm))
        elements.append(instruction)
        
        return elements
    
    def _build_footer(self, styles):
        """Build footer"""
        elements = []
        
        footer = Paragraph(
            """
            <b>Important Notes:</b><br/>
            • Present this ticket and a valid ID at the entrance<br/>
            • Ticket is non-refundable and non-transferable<br/>
            • Opening hours may vary - check official website<br/>
            • Support: tickets@silkroad.uz
            """,
            styles['SmallGray']
        )
        elements.append(footer)
        
        elements.append(Spacer(1, 5*mm))
        
        thank_you = Paragraph(
            "<b>Enjoy your visit! 🏛️</b>",
            styles['SmallGray']
        )
        elements.append(thank_you)
        
        return elements
