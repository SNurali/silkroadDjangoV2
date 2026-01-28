"""
PDF Download Views for Bookings and Tickets.
"""

from django.http import FileResponse, HttpResponse, Http404
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from bookings.models import Booking
from vendors.models import TicketSale
from .pdf_generator import BookingPDFGenerator, TicketPDFGenerator


class BookingPDFDownloadView(APIView):
    """
    Download booking confirmation as PDF.
    GET /api/hotels/bookings/{id}/download/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        # Get booking (must belong to user)
        booking = get_object_or_404(
            Booking,
            pk=pk,
            user=request.user
        )
        
        try:
            # Generate PDF
            generator = BookingPDFGenerator(booking)
            pdf_buffer = generator.generate()
            
            # Return as file download
            response = FileResponse(
                pdf_buffer,
                content_type='application/pdf',
                as_attachment=True,
                filename=f'booking-{booking.id}.pdf'
            )
            
            return response
            
        except Exception as e:
            return Response(
                {"error": f"Failed to generate PDF: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TicketPDFDownloadView(APIView):
    """
    Download ticket as PDF with QR code.
    GET /api/hotels/tickets/{id}/download/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        # Get ticket (must belong to user)
        ticket = get_object_or_404(
            TicketSale,
            pk=pk,
            created_by=request.user
        )
        
        # Check if paid (optional - can allow preview)
        if ticket.payment_status != 'paid':
            return Response(
                {"error": "Ticket must be paid before downloading"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Generate PDF
            generator = TicketPDFGenerator(ticket)
            pdf_buffer = generator.generate()
            
            # Return as file download
            response = FileResponse(
                pdf_buffer,
                content_type='application/pdf',
                as_attachment=True,
                filename=f'ticket-{ticket.id}.pdf'
            )
            
            return response
            
        except Exception as e:
            return Response(
                {"error": f"Failed to generate PDF: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BookingPDFPreviewView(APIView):
    """
    Preview booking PDF in browser (not downloaded).
    GET /api/hotels/bookings/{id}/preview/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk, user=request.user)
        
        try:
            generator = BookingPDFGenerator(booking)
            pdf_buffer = generator.generate()
            
            # Return inline (browser displays)
            response = FileResponse(
                pdf_buffer,
                content_type='application/pdf',
                as_attachment=False,  # Show in browser
                filename=f'booking-{booking.id}.pdf'
            )
            
            return response
            
        except Exception as e:
            return Response(
                {"error": f"Failed to generate PDF: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
