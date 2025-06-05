from django.urls import path
from . import views

urlpatterns = [
    # Payment endpoints
    path('', views.PaymentListView.as_view(), name='payment-list'),
    path('<int:pk>/', views.PaymentDetailView.as_view(), name='payment-detail'),
    path('create/', views.create_payment, name='create-payment'),
    path('<int:payment_id>/process/', views.process_payment, name='process-payment'),
    path('stats/', views.payment_stats, name='payment-stats'),
    
    # Refund endpoints
    path('refunds/', views.RefundListView.as_view(), name='refund-list'),
    path('<int:payment_id>/refund/', views.request_refund, name='request-refund'),
    path('refunds/<int:refund_id>/process/', views.process_refund, name='process-refund'),
] 