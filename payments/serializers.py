from rest_framework import serializers
from .models import Payment, Refund
from bookings.models import Booking

class PaymentSerializer(serializers.ModelSerializer):
    booking_id = serializers.IntegerField(source='booking.id', read_only=True)
    service_name = serializers.CharField(source='booking.service.name', read_only=True)
    customer_name = serializers.CharField(source='booking.customer.user.get_full_name', read_only=True)
    customer_email = serializers.CharField(source='booking.customer.user.email', read_only=True)
    provider_name = serializers.CharField(source='booking.provider.business_name', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Payment
        fields = ['id', 'booking_id', 'amount', 'payment_method', 'payment_method_display',
                 'status', 'status_display', 'transaction_id', 'payment_intent_id',
                 'created_at', 'updated_at', 'processed_at', 'service_name',
                 'customer_name', 'customer_email', 'provider_name']
        read_only_fields = ['created_at', 'updated_at', 'processed_at']

class PaymentCreateSerializer(serializers.ModelSerializer):
    booking_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Payment
        fields = ['booking_id', 'payment_method']
    
    def validate_booking_id(self, value):
        try:
            booking = Booking.objects.get(id=value)
            if hasattr(booking, 'payment'):
                raise serializers.ValidationError("Payment already exists for this booking")
            return value
        except Booking.DoesNotExist:
            raise serializers.ValidationError("Booking not found")
    
    def validate_payment_method(self, value):
        valid_methods = [choice[0] for choice in Payment.PAYMENT_METHOD_CHOICES]
        if value not in valid_methods:
            raise serializers.ValidationError("Invalid payment method")
        return value

class RefundSerializer(serializers.ModelSerializer):
    payment_id = serializers.IntegerField(source='payment.id', read_only=True)
    booking_id = serializers.IntegerField(source='payment.booking.id', read_only=True)
    service_name = serializers.CharField(source='payment.booking.service.name', read_only=True)
    customer_name = serializers.CharField(source='payment.booking.customer.user.get_full_name', read_only=True)
    requested_by_name = serializers.CharField(source='requested_by.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    original_amount = serializers.DecimalField(source='payment.amount', max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Refund
        fields = ['id', 'payment_id', 'booking_id', 'amount', 'original_amount',
                 'reason', 'status', 'status_display', 'refund_id',
                 'requested_by_name', 'service_name', 'customer_name',
                 'created_at', 'processed_at']
        read_only_fields = ['created_at', 'processed_at'] 