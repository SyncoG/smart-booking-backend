from rest_framework import serializers
from .models import Review
from bookings.models import Booking

class ReviewSerializer(serializers.ModelSerializer):
    booking_id = serializers.IntegerField(source='booking.id', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    service_id = serializers.IntegerField(source='service.id', read_only=True)
    customer_name = serializers.SerializerMethodField()
    provider_name = serializers.CharField(source='provider.business_name', read_only=True)
    provider_id = serializers.IntegerField(source='provider.id', read_only=True)
    booking_date = serializers.DateTimeField(source='booking.booking_date', read_only=True)
    
    class Meta:
        model = Review
        fields = ['id', 'booking_id', 'service_id', 'service_name', 'customer_name',
                 'provider_name', 'provider_id', 'rating', 'comment', 'is_anonymous',
                 'booking_date', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
    
    def get_customer_name(self, obj):
        if obj.is_anonymous:
            return "Anonymous"
        return obj.customer.user.get_full_name() or obj.customer.user.username

class ReviewCreateSerializer(serializers.ModelSerializer):
    booking_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Review
        fields = ['booking_id', 'rating', 'comment', 'is_anonymous']
    
    def validate_booking_id(self, value):
        try:
            booking = Booking.objects.get(id=value)
            if booking.status != 'completed':
                raise serializers.ValidationError("You can only review completed bookings")
            if hasattr(booking, 'review'):
                raise serializers.ValidationError("Review already exists for this booking")
            return value
        except Booking.DoesNotExist:
            raise serializers.ValidationError("Booking not found")
    
    def validate_rating(self, value):
        if value not in [1, 2, 3, 4, 5]:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value 