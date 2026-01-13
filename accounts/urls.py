from django.urls import path
from .views import (
    LoginView,
    AdminOnlyView,
    VendorOnlyView,
    AgentOnlyView,
)

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),

    path("admin-only/", AdminOnlyView.as_view()),
    path("vendor-only/", VendorOnlyView.as_view()),
    path("agent-only/", AgentOnlyView.as_view()),
]
