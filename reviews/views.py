from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q, Avg, Count
from .models import Review
from .serializers import ReviewSerializer, ReviewCreateSerializer
from accounts.models import CustomerProfile, ServiceProviderProfile
from bookings.models import Booking
from services.models import Service

# Create your views here.

class ReviewListView(generics.ListAPIView):
    """List reviews based on user role"""
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Filter parameters
        service_id = self.request.query_params.get('service', None)
        provider_id = self.request.query_params.get('provider', None)
        rating = self.request.query_params.get('rating', None)
        
        if user.user_type == 'customer':
            customer_profile = CustomerProfile.objects.get(user=user)
            queryset = Review.objects.filter(customer=customer_profile)
        elif user.user_type == 'provider':
            provider_profile = ServiceProviderProfile.objects.get(user=user)
            queryset = Review.objects.filter(provider=provider_profile)
        else:
            # Admin can see all reviews
            queryset = Review.objects.all()
        
        # Apply filters
        if service_id:
            queryset = queryset.filter(service_id=service_id)
        if provider_id:
            queryset = queryset.filter(provider_id=provider_id)
        if rating:
            queryset = queryset.filter(rating=rating)
        
        return queryset.order_by('-created_at')

class ReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete a specific review"""
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.user_type == 'customer':
            customer_profile = CustomerProfile.objects.get(user=user)
            return Review.objects.filter(customer=customer_profile)
        elif user.user_type == 'provider':
            provider_profile = ServiceProviderProfile.objects.get(user=user)
            return Review.objects.filter(provider=provider_profile)
        else:
            return Review.objects.all()

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_review(request):
    """Create a review for a completed booking"""
    try:
        if request.user.user_type != 'customer':
            return Response({'error': 'Only customers can create reviews'}, status=403)
        
        booking_id = request.data.get('booking_id')
        rating = request.data.get('rating')
        comment = request.data.get('comment', '')
        is_anonymous = request.data.get('is_anonymous', False)
        
        if not booking_id or not rating:
            return Response({'error': 'Booking ID and rating are required'}, status=400)
        
        booking = Booking.objects.get(id=booking_id)
        customer_profile = CustomerProfile.objects.get(user=request.user)
        
        # Check if user is the customer of this booking
        if booking.customer != customer_profile:
            return Response({'error': 'You can only review your own bookings'}, status=403)
        
        # Check if booking is completed
        if booking.status != 'completed':
            return Response({'error': 'You can only review completed bookings'}, status=400)
        
        # Check if review already exists
        if hasattr(booking, 'review'):
            return Response({'error': 'Review already exists for this booking'}, status=400)
        
        # Create review
        review = Review.objects.create(
            booking=booking,
            customer=customer_profile,
            provider=booking.provider,
            service=booking.service,
            rating=rating,
            comment=comment,
            is_anonymous=is_anonymous
        )
        
        # Update provider's average rating
        update_provider_rating(booking.provider)
        
        return Response({
            'message': 'Review created successfully',
            'review': ReviewSerializer(review).data
        })
        
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def public_reviews(request):
    """Get public reviews (for service browsing)"""
    service_id = request.query_params.get('service', None)
    provider_id = request.query_params.get('provider', None)
    
    queryset = Review.objects.all()
    
    if service_id:
        queryset = queryset.filter(service_id=service_id)
    if provider_id:
        queryset = queryset.filter(provider_id=provider_id)
    
    reviews = queryset.order_by('-created_at')[:20]  # Limit to 20 recent reviews
    serializer = ReviewSerializer(reviews, many=True)
    
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def review_stats(request):
    """Get review statistics"""
    user = request.user
    
    if user.user_type == 'customer':
        customer_profile = CustomerProfile.objects.get(user=user)
        reviews = Review.objects.filter(customer=customer_profile)
        
        stats = {
            'total_reviews': reviews.count(),
            'average_rating_given': reviews.aggregate(Avg('rating'))['rating__avg'] or 0,
            'rating_distribution': {
                '5_star': reviews.filter(rating=5).count(),
                '4_star': reviews.filter(rating=4).count(),
                '3_star': reviews.filter(rating=3).count(),
                '2_star': reviews.filter(rating=2).count(),
                '1_star': reviews.filter(rating=1).count(),
            }
        }
    elif user.user_type == 'provider':
        provider_profile = ServiceProviderProfile.objects.get(user=user)
        reviews = Review.objects.filter(provider=provider_profile)
        
        stats = {
            'total_reviews': reviews.count(),
            'average_rating': reviews.aggregate(Avg('rating'))['rating__avg'] or 0,
            'rating_distribution': {
                '5_star': reviews.filter(rating=5).count(),
                '4_star': reviews.filter(rating=4).count(),
                '3_star': reviews.filter(rating=3).count(),
                '2_star': reviews.filter(rating=2).count(),
                '1_star': reviews.filter(rating=1).count(),
            },
            'recent_reviews': ReviewSerializer(reviews.order_by('-created_at')[:5], many=True).data
        }
    else:
        # Admin stats
        reviews = Review.objects.all()
        
        stats = {
            'total_reviews': reviews.count(),
            'average_system_rating': reviews.aggregate(Avg('rating'))['rating__avg'] or 0,
            'rating_distribution': {
                '5_star': reviews.filter(rating=5).count(),
                '4_star': reviews.filter(rating=4).count(),
                '3_star': reviews.filter(rating=3).count(),
                '2_star': reviews.filter(rating=2).count(),
                '1_star': reviews.filter(rating=1).count(),
            },
            'top_rated_services': get_top_rated_services(),
            'top_rated_providers': get_top_rated_providers(),
        }
    
    return Response(stats)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_review(request, review_id):
    """Delete a review (customer or admin only)"""
    try:
        review = Review.objects.get(id=review_id)
        user = request.user
        
        # Check permissions
        if user.user_type == 'customer':
            customer_profile = CustomerProfile.objects.get(user=user)
            if review.customer != customer_profile:
                return Response({'error': 'You can only delete your own reviews'}, status=403)
        elif user.user_type != 'admin':
            return Response({'error': 'Permission denied'}, status=403)
        
        provider = review.provider
        review.delete()
        
        # Update provider's average rating
        update_provider_rating(provider)
        
        return Response({'message': 'Review deleted successfully'})
        
    except Review.DoesNotExist:
        return Response({'error': 'Review not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def report_review(request, review_id):
    """Report a review (admin will review reported content)"""
    try:
        review = Review.objects.get(id=review_id)
        reason = request.data.get('reason', '')
        
        # Create a notification for admin or implement reporting system
        # For now, we'll just return success
        
        return Response({'message': 'Review reported successfully'})
        
    except Review.DoesNotExist:
        return Response({'error': 'Review not found'}, status=404)

def update_provider_rating(provider):
    """Update provider's average rating"""
    reviews = Review.objects.filter(provider=provider)
    avg_rating = reviews.aggregate(Avg('rating'))['rating__avg'] or 0
    total_reviews = reviews.count()
    
    provider.average_rating = round(avg_rating, 2)
    provider.total_reviews = total_reviews
    provider.save()

def get_top_rated_services():
    """Get top rated services"""
    return Service.objects.annotate(
        avg_rating=Avg('reviews__rating'),
        review_count=Count('reviews')
    ).filter(
        review_count__gte=3  # At least 3 reviews
    ).order_by('-avg_rating')[:10]

def get_top_rated_providers():
    """Get top rated providers"""
    return ServiceProviderProfile.objects.annotate(
        avg_rating=Avg('reviews_received__rating'),
        review_count=Count('reviews_received')
    ).filter(
        review_count__gte=5  # At least 5 reviews
    ).order_by('-avg_rating')[:10]
