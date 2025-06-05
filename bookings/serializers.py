from rest_framework import serializers
from .models import Booking, BookingHistory
from accounts.serializers import UserSerializer
from services.models import Service

class ServiceSerializer(serializers.ModelSerializer):
    provider_name = serializers.CharField(source='provider.business_name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Service
        fields = ['id', 'name', 'description', 'duration', 'price', 'member_price', 
                 'provider_name', 'category_name', 'requirements']

class BookingSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.user.get_full_name', read_only=True)
    customer_email = serializers.CharField(source='customer.user.email', read_only=True)
    provider_name = serializers.CharField(source='provider.business_name', read_only=True)
    provider_email = serializers.CharField(source='provider.user.email', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    service_duration = serializers.IntegerField(source='service.duration', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Booking
        fields = ['id', 'customer_name', 'customer_email', 'provider_name', 'provider_email',
                 'service_name', 'service_duration', 'booking_date', 'status', 'status_display',
                 'total_price', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at', 'total_price']

class BookingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ['service', 'booking_date', 'notes']
    
    def validate_booking_date(self, value):
        from django.utils import timezone
        if value <= timezone.now():
            raise serializers.ValidationError("Booking date must be in the future")
        return value

class BookingHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.get_full_name', read_only=True)
    changed_by_type = serializers.CharField(source='changed_by.user_type', read_only=True)
    
    class Meta:
        model = BookingHistory
        fields = ['id', 'status_changed_from', 'status_changed_to', 'changed_by_name', 
                 'changed_by_type', 'change_reason', 'changed_at'] 