from rest_framework import serializers
from .models import Service, ServiceCategory
from accounts.models import ServiceProviderProfile

class ServiceCategorySerializer(serializers.ModelSerializer):
    service_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ServiceCategory
        fields = ['id', 'name', 'description', 'is_active', 'created_at', 'service_count']
        read_only_fields = ['created_at']
    
    def get_service_count(self, obj):
        return obj.service_set.filter(is_active=True).count()

class ServiceListSerializer(serializers.ModelSerializer):
    provider_name = serializers.CharField(source='provider.business_name', read_only=True)
    provider_id = serializers.IntegerField(source='provider.id', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    provider_location = serializers.CharField(source='provider.location', read_only=True)
    provider_rating = serializers.DecimalField(source='provider.average_rating', max_digits=3, decimal_places=2, read_only=True)
    
    class Meta:
        model = Service
        fields = ['id', 'name', 'description', 'duration', 'price', 'member_price', 
                 'is_active', 'requirements', 'created_at', 'provider_name', 'provider_id',
                 'category_name', 'provider_location', 'provider_rating']
        read_only_fields = ['created_at']

class ServiceDetailSerializer(serializers.ModelSerializer):
    provider_name = serializers.CharField(source='provider.business_name', read_only=True)
    provider_email = serializers.CharField(source='provider.user.email', read_only=True)
    provider_phone = serializers.CharField(source='provider.user.phone', read_only=True)
    provider_location = serializers.CharField(source='provider.location', read_only=True)
    provider_rating = serializers.DecimalField(source='provider.average_rating', max_digits=3, decimal_places=2, read_only=True)
    provider_reviews = serializers.IntegerField(source='provider.total_reviews', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Service
        fields = ['id', 'name', 'description', 'duration', 'price', 'member_price', 
                 'is_active', 'requirements', 'created_at', 'provider_name', 'provider_email',
                 'provider_phone', 'provider_location', 'provider_rating', 'provider_reviews',
                 'category_name', 'category']
        read_only_fields = ['created_at']

class ServiceCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ['name', 'description', 'duration', 'price', 'member_price', 
                 'is_active', 'requirements', 'category']
    
    def validate_duration(self, value):
        if value <= 0:
            raise serializers.ValidationError("Duration must be greater than 0 minutes")
        if value > 480:  # 8 hours
            raise serializers.ValidationError("Duration cannot exceed 8 hours")
        return value
    
    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than 0")
        return value
    
    def validate_member_price(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError("Member price must be greater than 0")
        return value 