#!/usr/bin/env python
"""
Script to create sample data for testing the Smart Booking frontend
"""
import os
import django
from datetime import datetime, timedelta
from decimal import Decimal
import random

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smart_booking.settings')
django.setup()

from accounts.models import User, CustomerProfile, ServiceProviderProfile
from services.models import ServiceCategory, Service
from bookings.models import Booking, BookingHistory
from notifications.models import Notification
from notifications.views import create_notification

def create_sample_categories():
    """Create sample service categories"""
    categories = [
        {
            'name': 'Healthcare',
            'description': 'Medical and health-related services'
        },
        {
            'name': 'Fitness & Wellness',
            'description': 'Physical fitness and wellness services'
        },
        {
            'name': 'Beauty & Spa',
            'description': 'Beauty treatments and spa services'
        },
        {
            'name': 'Education & Training',
            'description': 'Educational and training services'
        },
        {
            'name': 'Consulting',
            'description': 'Professional consulting services'
        }
    ]
    
    created_categories = []
    for cat_data in categories:
        category, created = ServiceCategory.objects.get_or_create(
            name=cat_data['name'],
            defaults=cat_data
        )
        created_categories.append(category)
        print(f"{'Created' if created else 'Found'} category: {category.name}")
    
    return created_categories

def create_sample_services():
    """Create sample services"""
    categories = ServiceCategory.objects.all()
    providers = ServiceProviderProfile.objects.all()
    
    if not providers.exists():
        print("No service providers found. Please create dummy users first.")
        return []
    
    services_data = [
        {
            'name': 'General Health Checkup',
            'description': 'Comprehensive health examination and consultation',
            'duration': 60,
            'price': Decimal('150.00'),
            'member_price': Decimal('120.00'),
            'requirements': 'Please bring your medical history and ID',
            'category': 'Healthcare'
        },
        {
            'name': 'Personal Training Session',
            'description': 'One-on-one fitness training with certified trainer',
            'duration': 90,
            'price': Decimal('80.00'),
            'member_price': Decimal('65.00'),
            'requirements': 'Bring workout clothes and water bottle',
            'category': 'Fitness & Wellness'
        },
        {
            'name': 'Deep Tissue Massage',
            'description': 'Therapeutic massage for muscle tension relief',
            'duration': 60,
            'price': Decimal('120.00'),
            'member_price': Decimal('100.00'),
            'requirements': 'Arrive 15 minutes early for consultation',
            'category': 'Beauty & Spa'
        },
        {
            'name': 'Python Programming Tutoring',
            'description': 'One-on-one Python programming lessons for beginners',
            'duration': 120,
            'price': Decimal('100.00'),
            'member_price': Decimal('85.00'),
            'requirements': 'Laptop with Python installed',
            'category': 'Education & Training'
        },
        {
            'name': 'Business Strategy Consultation',
            'description': 'Professional business strategy and planning consultation',
            'duration': 90,
            'price': Decimal('200.00'),
            'member_price': Decimal('175.00'),
            'requirements': 'Bring business documents and financial statements',
            'category': 'Consulting'
        },
        {
            'name': 'Dental Cleaning',
            'description': 'Professional dental cleaning and oral health checkup',
            'duration': 45,
            'price': Decimal('90.00'),
            'member_price': Decimal('75.00'),
            'requirements': 'No eating 2 hours before appointment',
            'category': 'Healthcare'
        },
        {
            'name': 'Yoga Class',
            'description': 'Beginner-friendly yoga session for flexibility and mindfulness',
            'duration': 75,
            'price': Decimal('50.00'),
            'member_price': Decimal('40.00'),
            'requirements': 'Bring yoga mat and comfortable clothes',
            'category': 'Fitness & Wellness'
        }
    ]
    
    created_services = []
    for service_data in services_data:
        category = categories.filter(name=service_data['category']).first()
        if not category:
            print(f"Category {service_data['category']} not found, skipping service {service_data['name']}")
            continue
        
        # Assign to a random provider
        provider = random.choice(providers)
        
        service, created = Service.objects.get_or_create(
            name=service_data['name'],
            provider=provider,
            defaults={
                'category': category,
                'description': service_data['description'],
                'duration': service_data['duration'],
                'price': service_data['price'],
                'member_price': service_data['member_price'],
                'requirements': service_data['requirements']
            }
        )
        created_services.append(service)
        print(f"{'Created' if created else 'Found'} service: {service.name} by {provider.business_name}")
    
    return created_services

def create_sample_bookings():
    """Create sample bookings"""
    customers = CustomerProfile.objects.all()
    services = Service.objects.all()
    
    if not customers.exists() or not services.exists():
        print("No customers or services found. Please create dummy users and services first.")
        return []
    
    # Create bookings with various statuses and dates
    statuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']
    created_bookings = []
    
    for i in range(15):  # Create 15 sample bookings
        customer = random.choice(customers)
        service = random.choice(services)
        status = random.choice(statuses)
        
        # Generate booking date (some past, some future)
        days_offset = random.randint(-30, 30)
        booking_date = datetime.now() + timedelta(days=days_offset)
        
        # Create random notes for some bookings
        notes = random.choice([
            'First time booking',
            'Regular customer',
            'Special requirements discussed',
            'Rescheduled from previous date',
            '',
            '',
            ''  # Make empty notes more common
        ])
        
        booking, created = Booking.objects.get_or_create(
            customer=customer,
            service=service,
            booking_date=booking_date,
            defaults={
                'provider': service.provider,
                'status': status,
                'total_price': service.price,
                'notes': notes
            }
        )
        
        if created:
            # Create initial booking history
            BookingHistory.objects.create(
                booking=booking,
                status_changed_from='',
                status_changed_to='pending',
                changed_by=customer.user,
                change_reason='Booking created'
            )
            
            # Create additional history for non-pending bookings
            if status != 'pending':
                BookingHistory.objects.create(
                    booking=booking,
                    status_changed_from='pending',
                    status_changed_to=status,
                    changed_by=service.provider.user,
                    change_reason=f'Status updated to {status}'
                )
            
            created_bookings.append(booking)
            print(f"Created booking: #{booking.id} - {customer.user.username} booked {service.name} ({status})")
    
    return created_bookings

def create_sample_notifications():
    """Create sample notifications for all users"""
    users = User.objects.filter(user_type__in=['customer', 'provider'])
    bookings = Booking.objects.all()
    
    notification_templates = [
        {
            'title': 'Welcome to Smart Booking!',
            'message': 'Thank you for joining our platform. Explore our services and book your first appointment.',
            'notification_type': 'system_update'
        },
        {
            'title': 'Booking Confirmed',
            'message': 'Your booking has been confirmed. Please arrive 10 minutes early.',
            'notification_type': 'booking_confirmed'
        },
        {
            'title': 'Booking Reminder',
            'message': 'You have an upcoming appointment tomorrow. Please check your booking details.',
            'notification_type': 'booking_created'
        },
        {
            'title': 'Payment Received',
            'message': 'Thank you! Your payment has been successfully processed.',
            'notification_type': 'payment_received'
        },
        {
            'title': 'New Service Available',
            'message': 'Check out our new wellness services! Book now for special introductory rates.',
            'notification_type': 'general'
        },
        {
            'title': 'Booking Completed',
            'message': 'Your appointment has been completed. Please rate your experience.',
            'notification_type': 'booking_completed'
        },
        {
            'title': 'Profile Update Required',
            'message': 'Please update your profile information to continue using our services.',
            'notification_type': 'system_update'
        }
    ]
    
    created_notifications = []
    
    for user in users:
        # Create 3-7 random notifications per user
        num_notifications = random.randint(3, 7)
        
        for i in range(num_notifications):
            template = random.choice(notification_templates)
            
            # Make some notifications unread
            is_read = random.choice([True, False, False])  # 1/3 chance of being read
            
            # For booking-related notifications, try to link to actual bookings
            booking_id = None
            if template['notification_type'].startswith('booking_') and bookings.exists():
                # Try to find a booking for this user
                user_bookings = bookings.filter(
                    customer__user=user if user.user_type == 'customer' else None
                ) if user.user_type == 'customer' else bookings.filter(
                    provider__user=user
                )
                
                if user_bookings.exists():
                    booking_id = random.choice(user_bookings).id
            
            notification = create_notification(
                recipient=user,
                title=template['title'],
                message=template['message'],
                notification_type=template['notification_type'],
                booking_id=booking_id
            )
            
            # Set read status
            notification.is_read = is_read
            notification.save()
            
            created_notifications.append(notification)
    
    print(f"Created {len(created_notifications)} sample notifications")
    return created_notifications

def main():
    """Main function to create all sample data"""
    print("Creating sample data for Smart Booking...")
    
    # Create categories first
    print("\n1. Creating service categories...")
    categories = create_sample_categories()
    
    # Create services
    print("\n2. Creating sample services...")
    services = create_sample_services()
    
    # Create bookings
    print("\n3. Creating sample bookings...")
    bookings = create_sample_bookings()
    
    # Create notifications
    print("\n4. Creating sample notifications...")
    notifications = create_sample_notifications()
    
    print(f"\nSample data creation completed!")
    print(f"Created {len(categories)} categories")
    print(f"Created {len(services)} services")
    print(f"Created {len(bookings)} bookings")
    print(f"Created {len(notifications)} notifications")
    
    print("\nYou can now test the frontend with realistic data!")

if __name__ == '__main__':
    main() 