from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import CustomerProfile, ServiceProviderProfile
from django.db import transaction

User = get_user_model()

class Command(BaseCommand):
    help = 'Create dummy users and superuser for testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--skip-if-exists',
            action='store_true',
            help='Skip creation if users already exist',
        )

    def handle(self, *args, **options):
        skip_if_exists = options['skip_if_exists']

        # Check if users already exist
        if skip_if_exists and User.objects.filter(username__in=[
            'admin', 'customer1', 'provider1'
        ]).exists():
            self.stdout.write(
                self.style.WARNING('Some users already exist. Skipping creation.')
            )
            return

        try:
            with transaction.atomic():
                # Create superuser
                superuser, created = User.objects.get_or_create(
                    username='admin',
                    defaults={
                        'email': 'admin@smartbooking.com',
                        'first_name': 'Super',
                        'last_name': 'Admin',
                        'user_type': 'admin',
                        'phone': '+1234567890',
                        'is_staff': True,
                        'is_superuser': True,
                        'is_verified': True,
                    }
                )
                if created:
                    superuser.set_password('admin123')
                    superuser.save()
                    self.stdout.write(
                        self.style.SUCCESS(f'Created superuser: {superuser.username}')
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(f'Superuser already exists: {superuser.username}')
                    )

                # Create dummy customer
                customer, created = User.objects.get_or_create(
                    username='customer1',
                    defaults={
                        'email': 'customer@example.com',
                        'first_name': 'John',
                        'last_name': 'Doe',
                        'user_type': 'customer',
                        'phone': '+1234567891',
                        'is_verified': True,
                    }
                )
                if created:
                    customer.set_password('customer123')
                    customer.save()
                    
                    # Create customer profile
                    CustomerProfile.objects.get_or_create(
                        user=customer,
                        defaults={
                            'emergency_contact': '+1234567892',
                            'preferences': {
                                'notifications': True,
                                'newsletter': True,
                                'preferred_categories': ['fitness', 'wellness']
                            }
                        }
                    )
                    self.stdout.write(
                        self.style.SUCCESS(f'Created customer: {customer.username}')
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(f'Customer already exists: {customer.username}')
                    )

                # Create dummy service provider
                provider, created = User.objects.get_or_create(
                    username='provider1',
                    defaults={
                        'email': 'provider@example.com',
                        'first_name': 'Jane',
                        'last_name': 'Smith',
                        'user_type': 'provider',
                        'phone': '+1234567893',
                        'is_verified': True,
                    }
                )
                if created:
                    provider.set_password('provider123')
                    provider.save()
                    
                    # Create service provider profile
                    ServiceProviderProfile.objects.get_or_create(
                        user=provider,
                        defaults={
                            'business_name': 'Premium Wellness Services',
                            'description': 'Professional wellness and fitness services provider with 5+ years of experience.',
                            'location': 'New York, NY',
                            'rating': 4.75,
                            'total_reviews': 25,
                            'is_verified': True,
                        }
                    )
                    self.stdout.write(
                        self.style.SUCCESS(f'Created service provider: {provider.username}')
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(f'Service provider already exists: {provider.username}')
                    )

                # Create additional customer for testing
                customer2, created = User.objects.get_or_create(
                    username='customer2',
                    defaults={
                        'email': 'customer2@example.com',
                        'first_name': 'Alice',
                        'last_name': 'Johnson',
                        'user_type': 'customer',
                        'phone': '+1234567894',
                        'is_verified': False,  # Unverified user for testing
                    }
                )
                if created:
                    customer2.set_password('customer123')
                    customer2.save()
                    
                    CustomerProfile.objects.get_or_create(
                        user=customer2,
                        defaults={
                            'emergency_contact': '+1234567895',
                            'preferences': {
                                'notifications': False,
                                'newsletter': False,
                                'preferred_categories': ['beauty', 'relaxation']
                            }
                        }
                    )
                    self.stdout.write(
                        self.style.SUCCESS(f'Created customer: {customer2.username}')
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(f'Customer already exists: {customer2.username}')
                    )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating users: {str(e)}')
            )
            return

        self.stdout.write(
            self.style.SUCCESS('\n=== Dummy Users Created Successfully ===')
        )
        self.stdout.write('Login credentials:')
        self.stdout.write('1. Superuser - Username: admin, Password: admin123')
        self.stdout.write('2. Customer 1 - Username: customer1, Password: customer123')
        self.stdout.write('3. Customer 2 - Username: customer2, Password: customer123 (unverified)')
        self.stdout.write('4. Provider - Username: provider1, Password: provider123')
        self.stdout.write('\nAll users can be used for testing the application.') 