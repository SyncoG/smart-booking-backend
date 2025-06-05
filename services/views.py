from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.db.models import Q
from .models import Service, ServiceCategory
from .serializers import (
    ServiceListSerializer, 
    ServiceDetailSerializer, 
    ServiceCreateUpdateSerializer,
    ServiceCategorySerializer
)
from accounts.models import ServiceProviderProfile

# Create your views here.

class ServiceCategoryListView(generics.ListAPIView):
    """List all active service categories"""
    serializer_class = ServiceCategorySerializer
    permission_classes = [AllowAny]  # Public access for browsing categories
    
    def get_queryset(self):
        return ServiceCategory.objects.filter(is_active=True).order_by('name')

class ServiceListView(generics.ListAPIView):
    """List all active services with filtering"""
    serializer_class = ServiceListSerializer
    permission_classes = [AllowAny]  # Public access for browsing services
    
    def get_queryset(self):
        queryset = Service.objects.filter(is_active=True).select_related('provider', 'category')
        
        # Filter by category
        category_id = self.request.query_params.get('category', None)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        # Filter by provider
        provider_id = self.request.query_params.get('provider', None)
        if provider_id:
            queryset = queryset.filter(provider_id=provider_id)
        
        # Search by name or description
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(description__icontains=search)
            )
        
        # Filter by price range
        min_price = self.request.query_params.get('min_price', None)
        max_price = self.request.query_params.get('max_price', None)
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        
        # Order by
        order_by = self.request.query_params.get('order_by', 'name')
        if order_by in ['name', 'price', 'duration', 'created_at']:
            queryset = queryset.order_by(order_by)
        elif order_by == '-price':
            queryset = queryset.order_by('-price')
        elif order_by == '-created_at':
            queryset = queryset.order_by('-created_at')
        else:
            queryset = queryset.order_by('name')
        
        return queryset

class ServiceDetailView(generics.RetrieveAPIView):
    """Get detailed information about a specific service"""
    serializer_class = ServiceDetailSerializer
    permission_classes = [AllowAny]  # Public access for viewing service details
    
    def get_queryset(self):
        return Service.objects.filter(is_active=True).select_related('provider', 'category')

class MyServicesView(generics.ListCreateAPIView):
    """List and create services for the authenticated provider"""
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ServiceCreateUpdateSerializer
        return ServiceListSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        if user.user_type != 'provider':
            return Service.objects.none()
        
        try:
            provider_profile = ServiceProviderProfile.objects.get(user=user)
            return Service.objects.filter(provider=provider_profile).order_by('-created_at')
        except ServiceProviderProfile.DoesNotExist:
            return Service.objects.none()
    
    def perform_create(self, serializer):
        # Only providers can create services
        if self.request.user.user_type != 'provider':
            raise PermissionError("Only service providers can create services")
        
        try:
            provider_profile = ServiceProviderProfile.objects.get(user=self.request.user)
            serializer.save(provider=provider_profile)
        except ServiceProviderProfile.DoesNotExist:
            raise PermissionError("Provider profile not found")

class MyServiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Manage specific service for the authenticated provider"""
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ServiceCreateUpdateSerializer
        return ServiceDetailSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        if user.user_type != 'provider':
            return Service.objects.none()
        
        try:
            provider_profile = ServiceProviderProfile.objects.get(user=user)
            return Service.objects.filter(provider=provider_profile)
        except ServiceProviderProfile.DoesNotExist:
            return Service.objects.none()

@api_view(['GET'])
@permission_classes([AllowAny])
def service_stats(request):
    """Get general service statistics"""
    stats = {
        'total_services': Service.objects.filter(is_active=True).count(),
        'total_categories': ServiceCategory.objects.filter(is_active=True).count(),
        'total_providers': ServiceProviderProfile.objects.filter(is_verified=True).count(),
    }
    
    # Add category breakdown
    categories = ServiceCategory.objects.filter(is_active=True)
    category_stats = []
    for category in categories:
        service_count = Service.objects.filter(category=category, is_active=True).count()
        category_stats.append({
            'name': category.name,
            'service_count': service_count
        })
    
    stats['categories'] = category_stats
    return Response(stats)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_service_status(request, service_id):
    """Toggle service active/inactive status"""
    user = request.user
    
    if user.user_type != 'provider':
        return Response({'error': 'Only providers can manage services'}, status=403)
    
    try:
        provider_profile = ServiceProviderProfile.objects.get(user=user)
        service = Service.objects.get(id=service_id, provider=provider_profile)
        
        service.is_active = not service.is_active
        service.save()
        
        return Response({
            'message': f'Service {"activated" if service.is_active else "deactivated"} successfully',
            'service': ServiceListSerializer(service).data
        })
        
    except ServiceProviderProfile.DoesNotExist:
        return Response({'error': 'Provider profile not found'}, status=404)
    except Service.DoesNotExist:
        return Response({'error': 'Service not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
