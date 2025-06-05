from django.urls import path
from . import views

urlpatterns = [
    # Public service browsing
    path('', views.ServiceListView.as_view(), name='service-list'),
    path('<int:pk>/', views.ServiceDetailView.as_view(), name='service-detail'),
    path('categories/', views.ServiceCategoryListView.as_view(), name='service-categories'),
    path('stats/', views.service_stats, name='service-stats'),
    
    # Provider service management
    path('my-services/', views.MyServicesView.as_view(), name='my-services'),
    path('my-services/<int:pk>/', views.MyServiceDetailView.as_view(), name='my-service-detail'),
    path('<int:service_id>/toggle-status/', views.toggle_service_status, name='toggle-service-status'),
] 