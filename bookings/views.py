from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from .models import Booking, BookingHistory
from .serializers import BookingSerializer, BookingCreateSerializer, BookingHistorySerializer
from accounts.models import CustomerProfile, ServiceProviderProfile
from services.models import Service

class BookingListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return BookingCreateSerializer
        return BookingSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        if user.user_type == 'customer':
            customer_profile = CustomerProfile.objects.get(user=user)
            return Booking.objects.filter(customer=customer_profile).order_by('-created_at')
        elif user.user_type == 'provider':
            provider_profile = ServiceProviderProfile.objects.get(user=user)
            return Booking.objects.filter(provider=provider_profile).order_by('-created_at')
        else:
            # Admin can see all bookings
            return Booking.objects.all().order_by('-created_at')
    
    def perform_create(self, serializer):
        # Only customers can create bookings
        if self.request.user.user_type != 'customer':
            raise PermissionError("Only customers can create bookings")
        
        customer_profile = CustomerProfile.objects.get(user=self.request.user)
        service = serializer.validated_data['service']
        
        booking = serializer.save(
            customer=customer_profile,
            provider=service.provider,
            total_price=service.price
        )
        
        # Create history entry
        BookingHistory.objects.create(
            booking=booking,
            status_changed_from='',
            status_changed_to='pending',
            changed_by=self.request.user,
            change_reason='Booking created'
        )

class BookingDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.user_type == 'customer':
            customer_profile = CustomerProfile.objects.get(user=user)
            return Booking.objects.filter(customer=customer_profile)
        elif user.user_type == 'provider':
            provider_profile = ServiceProviderProfile.objects.get(user=user)
            return Booking.objects.filter(provider=provider_profile)
        else:
            return Booking.objects.all()
    
    def perform_update(self, serializer):
        booking = self.get_object()
        old_status = booking.status
        new_status = serializer.validated_data.get('status', old_status)
        
        updated_booking = serializer.save()
        
        # Create history entry if status changed
        if old_status != new_status:
            BookingHistory.objects.create(
                booking=updated_booking,
                status_changed_from=old_status,
                status_changed_to=new_status,
                changed_by=self.request.user,
                change_reason=f'Status updated by {self.request.user.user_type}'
            )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_booking_status(request, booking_id):
    try:
        user = request.user
        booking = Booking.objects.get(id=booking_id)
        
        # Check permissions
        if user.user_type == 'customer' and booking.customer.user != user:
            return Response({'error': 'Permission denied'}, status=403)
        elif user.user_type == 'provider' and booking.provider.user != user:
            return Response({'error': 'Permission denied'}, status=403)
        
        old_status = booking.status
        new_status = request.data.get('status')
        reason = request.data.get('reason', '')
        
        if new_status not in dict(Booking.STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, status=400)
        
        booking.status = new_status
        booking.save()
        
        # Create history entry
        BookingHistory.objects.create(
            booking=booking,
            status_changed_from=old_status,
            status_changed_to=new_status,
            changed_by=user,
            change_reason=reason
        )
        
        return Response({
            'message': 'Status updated successfully',
            'booking': BookingSerializer(booking).data
        })
        
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def booking_history(request, booking_id):
    try:
        user = request.user
        booking = Booking.objects.get(id=booking_id)
        
        # Check permissions
        if user.user_type == 'customer' and booking.customer.user != user:
            return Response({'error': 'Permission denied'}, status=403)
        elif user.user_type == 'provider' and booking.provider.user != user:
            return Response({'error': 'Permission denied'}, status=403)
        
        history = BookingHistory.objects.filter(booking=booking).order_by('-changed_at')
        serializer = BookingHistorySerializer(history, many=True)
        
        return Response(serializer.data)
        
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    user = request.user
    
    if user.user_type == 'customer':
        customer_profile = CustomerProfile.objects.get(user=user)
        bookings = Booking.objects.filter(customer=customer_profile)
        
        stats = {
            'total_bookings': bookings.count(),
            'pending_bookings': bookings.filter(status='pending').count(),
            'confirmed_bookings': bookings.filter(status='confirmed').count(),
            'completed_bookings': bookings.filter(status='completed').count(),
            'cancelled_bookings': bookings.filter(status='cancelled').count(),
        }
    elif user.user_type == 'provider':
        provider_profile = ServiceProviderProfile.objects.get(user=user)
        bookings = Booking.objects.filter(provider=provider_profile)
        
        stats = {
            'total_bookings': bookings.count(),
            'pending_bookings': bookings.filter(status='pending').count(),
            'confirmed_bookings': bookings.filter(status='confirmed').count(),
            'in_progress_bookings': bookings.filter(status='in_progress').count(),
            'completed_bookings': bookings.filter(status='completed').count(),
            'total_revenue': sum(booking.total_price for booking in bookings.filter(status='completed')),
        }
    else:
        # Admin stats
        stats = {
            'total_bookings': Booking.objects.count(),
            'total_customers': CustomerProfile.objects.count(),
            'total_providers': ServiceProviderProfile.objects.count(),
            'total_revenue': sum(booking.total_price for booking in Booking.objects.filter(status='completed')),
        }
    
    return Response(stats)
