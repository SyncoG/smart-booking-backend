from django.urls import path
from . import views

urlpatterns = [
    # Review endpoints
    path('', views.ReviewListView.as_view(), name='review-list'),
    path('<int:pk>/', views.ReviewDetailView.as_view(), name='review-detail'),
    path('create/', views.create_review, name='create-review'),
    path('public/', views.public_reviews, name='public-reviews'),
    path('stats/', views.review_stats, name='review-stats'),
    path('<int:review_id>/delete/', views.delete_review, name='delete-review'),
    path('<int:review_id>/report/', views.report_review, name='report-review'),
] 