from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from bookings.models import Booking
from accounts.models import CustomerProfile, ServiceProviderProfile
from services.models import Service

class Review(models.Model):
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='review')
    customer = models.ForeignKey(CustomerProfile, on_delete=models.CASCADE, related_name='reviews_given')
    provider = models.ForeignKey(ServiceProviderProfile, on_delete=models.CASCADE, related_name='reviews_received')
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='reviews')
    
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField()
    is_anonymous = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('booking', 'customer')

    def __str__(self):
        return f"Review by {self.customer.user.username} - {self.rating}/5 stars"