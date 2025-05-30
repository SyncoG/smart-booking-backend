from django.contrib import admin
from .models import User, CustomerProfile, ServiceProviderProfile

# Simple registration
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'user_type', 'is_verified', 'date_joined')
    list_filter = ('user_type', 'is_verified')

@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'date_of_birth', 'emergency_contact')

@admin.register(ServiceProviderProfile)
class ServiceProviderProfileAdmin(admin.ModelAdmin):
    list_display = ('business_name', 'user', 'location', 'rating', 'is_verified')
    list_filter = ('is_verified', 'rating')