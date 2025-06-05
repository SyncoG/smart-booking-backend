from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q, Sum
from .models import Payment, Refund
from .serializers import PaymentSerializer, RefundSerializer, PaymentCreateSerializer
from accounts.models import CustomerProfile, ServiceProviderProfile
from bookings.models import Booking

# Create your views here.

class PaymentListView(generics.ListAPIView):
    """List payments based on user role"""
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.user_type == 'customer':
            customer_profile = CustomerProfile.objects.get(user=user)
            return Payment.objects.filter(
                booking__customer=customer_profile
            ).order_by('-created_at')
        elif user.user_type == 'provider':
            provider_profile = ServiceProviderProfile.objects.get(user=user)
            return Payment.objects.filter(
                booking__provider=provider_profile
            ).order_by('-created_at')
        else:
            # Admin can see all payments
            return Payment.objects.all().order_by('-created_at')

class PaymentDetailView(generics.RetrieveAPIView):
    """Get detailed payment information"""
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.user_type == 'customer':
            customer_profile = CustomerProfile.objects.get(user=user)
            return Payment.objects.filter(booking__customer=customer_profile)
        elif user.user_type == 'provider':
            provider_profile = ServiceProviderProfile.objects.get(user=user)
            return Payment.objects.filter(booking__provider=provider_profile)
        else:
            return Payment.objects.all()

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_payment(request):
    """Create a payment for a booking"""
    try:
        booking_id = request.data.get('booking_id')
        payment_method = request.data.get('payment_method')
        
        if not booking_id or not payment_method:
            return Response({'error': 'Booking ID and payment method are required'}, status=400)
        
        booking = Booking.objects.get(id=booking_id)
        
        # Check if user is the customer of this booking
        if request.user.user_type != 'customer':
            return Response({'error': 'Only customers can create payments'}, status=403)
        
        customer_profile = CustomerProfile.objects.get(user=request.user)
        if booking.customer != customer_profile:
            return Response({'error': 'You can only pay for your own bookings'}, status=403)
        
        # Check if payment already exists
        if hasattr(booking, 'payment'):
            return Response({'error': 'Payment already exists for this booking'}, status=400)
        
        # Create payment
        payment = Payment.objects.create(
            booking=booking,
            amount=booking.total_price,
            payment_method=payment_method,
            status='pending'
        )
        
        # Here you would integrate with actual payment processor
        # For demo purposes, we'll simulate payment processing
        if payment_method in ['credit_card', 'debit_card']:
            payment.status = 'processing'
            payment.transaction_id = f"txn_{payment.id}_{booking.id}"
        else:
            payment.status = 'completed'
        
        payment.save()
        
        return Response({
            'message': 'Payment created successfully',
            'payment': PaymentSerializer(payment).data
        })
        
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_payment(request, payment_id):
    """Process a pending payment"""
    try:
        payment = Payment.objects.get(id=payment_id)
        
        # Check permissions
        user = request.user
        if user.user_type == 'customer':
            customer_profile = CustomerProfile.objects.get(user=user)
            if payment.booking.customer != customer_profile:
                return Response({'error': 'Permission denied'}, status=403)
        elif user.user_type == 'provider':
            provider_profile = ServiceProviderProfile.objects.get(user=user)
            if payment.booking.provider != provider_profile:
                return Response({'error': 'Permission denied'}, status=403)
        
        if payment.status != 'pending':
            return Response({'error': 'Payment is not in pending status'}, status=400)
        
        # Simulate payment processing
        payment.status = 'completed'
        payment.save()
        
        # Update booking status if payment is successful
        if payment.status == 'completed':
            booking = payment.booking
            if booking.status == 'pending':
                booking.status = 'confirmed'
                booking.save()
        
        return Response({
            'message': 'Payment processed successfully',
            'payment': PaymentSerializer(payment).data
        })
        
    except Payment.DoesNotExist:
        return Response({'error': 'Payment not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_refund(request, payment_id):
    """Request a refund for a payment"""
    try:
        payment = Payment.objects.get(id=payment_id)
        reason = request.data.get('reason', '')
        refund_amount = request.data.get('amount', payment.amount)
        
        # Check permissions
        user = request.user
        if user.user_type == 'customer':
            customer_profile = CustomerProfile.objects.get(user=user)
            if payment.booking.customer != customer_profile:
                return Response({'error': 'Permission denied'}, status=403)
        elif user.user_type != 'admin':
            return Response({'error': 'Only customers or admins can request refunds'}, status=403)
        
        if payment.status != 'completed':
            return Response({'error': 'Can only refund completed payments'}, status=400)
        
        # Check if refund amount is valid
        if float(refund_amount) > float(payment.amount):
            return Response({'error': 'Refund amount cannot exceed payment amount'}, status=400)
        
        # Create refund request
        refund = Refund.objects.create(
            payment=payment,
            amount=refund_amount,
            reason=reason,
            requested_by=user,
            status='pending'
        )
        
        return Response({
            'message': 'Refund request submitted successfully',
            'refund': RefundSerializer(refund).data
        })
        
    except Payment.DoesNotExist:
        return Response({'error': 'Payment not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_refund(request, refund_id):
    """Process a refund request (Admin only)"""
    try:
        if request.user.user_type != 'admin':
            return Response({'error': 'Only admins can process refunds'}, status=403)
        
        refund = Refund.objects.get(id=refund_id)
        action = request.data.get('action')  # 'approve' or 'reject'
        
        if action not in ['approve', 'reject']:
            return Response({'error': 'Action must be approve or reject'}, status=400)
        
        if refund.status != 'pending':
            return Response({'error': 'Refund is not in pending status'}, status=400)
        
        if action == 'approve':
            refund.status = 'completed'
            refund.refund_id = f"ref_{refund.id}_{refund.payment.id}"
            
            # Update payment status if fully refunded
            if refund.amount == refund.payment.amount:
                refund.payment.status = 'refunded'
                refund.payment.save()
        else:
            refund.status = 'failed'
        
        refund.save()
        
        return Response({
            'message': f'Refund {action}d successfully',
            'refund': RefundSerializer(refund).data
        })
        
    except Refund.DoesNotExist:
        return Response({'error': 'Refund not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_stats(request):
    """Get payment statistics"""
    user = request.user
    
    if user.user_type == 'customer':
        customer_profile = CustomerProfile.objects.get(user=user)
        payments = Payment.objects.filter(booking__customer=customer_profile)
        
        stats = {
            'total_payments': payments.count(),
            'total_spent': payments.filter(status='completed').aggregate(Sum('amount'))['amount__sum'] or 0,
            'pending_payments': payments.filter(status='pending').count(),
            'completed_payments': payments.filter(status='completed').count(),
            'failed_payments': payments.filter(status='failed').count(),
        }
    elif user.user_type == 'provider':
        provider_profile = ServiceProviderProfile.objects.get(user=user)
        payments = Payment.objects.filter(booking__provider=provider_profile)
        
        stats = {
            'total_payments': payments.count(),
            'total_revenue': payments.filter(status='completed').aggregate(Sum('amount'))['amount__sum'] or 0,
            'pending_payments': payments.filter(status='pending').count(),
            'completed_payments': payments.filter(status='completed').count(),
            'refunded_payments': payments.filter(status='refunded').count(),
        }
    else:
        # Admin stats
        payments = Payment.objects.all()
        refunds = Refund.objects.all()
        
        stats = {
            'total_payments': payments.count(),
            'total_revenue': payments.filter(status='completed').aggregate(Sum('amount'))['amount__sum'] or 0,
            'pending_payments': payments.filter(status='pending').count(),
            'completed_payments': payments.filter(status='completed').count(),
            'failed_payments': payments.filter(status='failed').count(),
            'refunded_payments': payments.filter(status='refunded').count(),
            'total_refunds': refunds.count(),
            'pending_refunds': refunds.filter(status='pending').count(),
            'completed_refunds': refunds.filter(status='completed').count(),
        }
    
    return Response(stats)

class RefundListView(generics.ListAPIView):
    """List refunds based on user role"""
    serializer_class = RefundSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.user_type == 'customer':
            customer_profile = CustomerProfile.objects.get(user=user)
            return Refund.objects.filter(
                payment__booking__customer=customer_profile
            ).order_by('-created_at')
        elif user.user_type == 'provider':
            provider_profile = ServiceProviderProfile.objects.get(user=user)
            return Refund.objects.filter(
                payment__booking__provider=provider_profile
            ).order_by('-created_at')
        else:
            # Admin can see all refunds
            return Refund.objects.all().order_by('-created_at')
