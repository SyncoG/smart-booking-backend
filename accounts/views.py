from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import login
from .models import User, CustomerProfile, ServiceProviderProfile
from .serializers import (
    UserSerializer, CustomerProfileSerializer, 
    ServiceProviderProfileSerializer, UserRegistrationSerializer
)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Create profile based on user type
        if user.user_type == 'customer':
            CustomerProfile.objects.create(user=user)
        elif user.user_type == 'provider':
            ServiceProviderProfile.objects.create(
                user=user,
                business_name=request.data.get('business_name', ''),
                description=request.data.get('description', ''),
                location=request.data.get('location', '')
            )
        
        # Create token
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key
        }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    from django.contrib.auth import authenticate
    user = authenticate(username=username, password=password)
    
    if user:
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key
        })
    else:
        return Response({'error': 'Invalid credentials'}, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    user = request.user
    user_data = UserSerializer(user).data
    
    if user.user_type == 'customer' and hasattr(user, 'customer_profile'):
        profile_data = CustomerProfileSerializer(user.customer_profile).data
    elif user.user_type == 'provider' and hasattr(user, 'provider_profile'):
        profile_data = ServiceProviderProfileSerializer(user.provider_profile).data
    else:
        profile_data = None
    
    return Response({
        'user': user_data,
        'profile': profile_data
    })