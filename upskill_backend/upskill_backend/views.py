from django.http import HttpResponse

def home(request):
    return HttpResponse("Welcome to the Upskill Backend API. Use `/api/` for API access.")
