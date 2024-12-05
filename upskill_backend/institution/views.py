# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework.parsers import MultiPartParser, FormParser
# from rest_framework import status
# from django.core.exceptions import ValidationError
# from .models import UploadedFile
# from .serializers import UploadedFileSerializer
# import logging

# # Set up logging
# logger = logging.getLogger(__name__)

# def validate_file_extension(file):
#     allowed_extensions = ['csv', 'xlsx']
#     if not file.name.split('.')[-1].lower() in allowed_extensions:
#         raise ValidationError("Unsupported file extension.")

# class FileUploadView(APIView):
#     parser_classes = [MultiPartParser, FormParser]

#     def post(self, request, format=None):
#         file = request.FILES.get('file')
#         message = request.POST.get('message', '')

#         if not file:
#             logger.error("No file uploaded")
#             return Response({"success": False, "message": "No file uploaded"}, status=400)

#         if file.size > 10 * 1024 * 1024:  # 10 MB size limit
#             logger.error("File is too large")
#             return Response({"success": False, "message": "File is too large"}, status=400)

#         try:
#             validate_file_extension(file)  # Validate file extension

#             # Save the file
#             uploaded_file = UploadedFile.objects.create(file=file, message=message)
#             serializer = UploadedFileSerializer(uploaded_file)

#             logger.info("File uploaded successfully")
#             return Response({"success": True, "data": serializer.data, "file_path": uploaded_file.file.url}, status=201)

#         except ValidationError as e:
#             logger.error(f"Validation error: {e}")
#             return Response({"success": False, "message": str(e)}, status=400)

#         except Exception as e:
#             logger.error(f"Unexpected error: {e}")
#             return Response({"success": False, "message": "An error occurred while saving the file."}, status=500)
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.conf import settings
import os

class FileUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, format=None):
        try:
            file = request.FILES.get('file')
            message = request.POST.get('message', '')

            if not file:
                return Response({"success": False, "message": "No file uploaded."}, status=400)

            if file.size > 10 * 1024 * 1024:  # File size limit: 10 MB
                return Response({"success": False, "message": "File is too large."}, status=400)

            # Validate file extension
            if file.name.split('.')[-1].lower() not in ['csv', 'xlsx']:
                return Response({"success": False, "message": "Unsupported file type."}, status=400)

            # Save file to media directory
            save_path = os.path.join(settings.MEDIA_ROOT, file.name)
            with open(save_path, 'wb+') as destination:
                for chunk in file.chunks():
                    destination.write(chunk)

            return Response({"success": True, "file_path": f"{settings.MEDIA_URL}{file.name}"}, status=201)

        except Exception as e:
            return Response({"success": False, "message": f"Error: {str(e)}"}, status=500)
