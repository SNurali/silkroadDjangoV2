from celery import shared_task
import logging

logger = logging.getLogger(__name__)

@shared_task
def generate_ticket_pdf_task(ticket_id):
    """
    Async task to generate PDF ticket.
    """
    from .models import TicketSale
    from hotels.pdf_generator import TicketPDFGenerator
    
    logger.info(f"Generating PDF for ticket {ticket_id}...")
    try:
        ticket = TicketSale.objects.get(id=ticket_id)
        generator = TicketPDFGenerator(ticket)
        pdf_buffer = generator.generate()
        
        # Save placeholder for QR if empty
        if not ticket.qr_code:
            ticket.qr_code = f"TCKT-{ticket.id}-{ticket.purchase_date.strftime('%Y%m%d')}"
            ticket.save(update_fields=['qr_code'])
            
        return f"PDF generated for {ticket_id}"
    except TicketSale.DoesNotExist:
        return f"Ticket {ticket_id} not found"
    except Exception as e:
        logger.error(f"Failed to generate ticket PDF: {e}")
        return str(e)
