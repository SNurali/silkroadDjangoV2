from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
import hashlib
import datetime
from .services.emehmon import EMehmonService

class EmehmonCheckAPIView(APIView):
    """
    Integration with E-Mehmon API to check validity of Passport/Person info.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        passport = request.data.get('passport')
        birthday = request.data.get('birthday')
        citizen = request.data.get('citizen')

        if not all([passport, birthday, citizen]):
            return Response({'error': 'Passport, birthday, and citizen ID are required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Generate the client_hash that EMehmonService expects (Security Check)
        # Hash format: md5('silkroad_emehmon' + YYYYMMDDHH + 'psp')
        current_hour_str = datetime.datetime.now().strftime('%Y%m%d%H')
        expected_raw = f"silkroad_emehmon{current_hour_str}psp"
        client_hash = hashlib.md5(expected_raw.encode()).hexdigest()

        service = EMehmonService()
        result = service.check_person_info(
            passport=passport,
            birthday=birthday,
            citizen_id=citizen,
            client_hash=client_hash
        )

        if result.get('success'):
            return Response({'psp': result.get('data')}, status=status.HTTP_200_OK)
        else:
            return Response(
                {'error': result.get('message', 'Validation failed')}, 
                status=result.get('code', 400)
            )
