from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
from django.utils import timezone
from datetime import timedelta
import uuid
from decimal import Decimal

class User(AbstractUser):
    """Extended user model with additional profile information"""
    phone_number = models.CharField(
        max_length=15, 
        blank=True, 
        validators=[RegexValidator(r'^\+?1?\d{9,15}$', 'Enter a valid phone number.')]
    )
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    preferred_fuel_type = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.username

class EmailOTP(models.Model):
    email = models.EmailField(unique=True)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(minutes=10)

    def __str__(self):
        return f"{self.email} - {self.otp}"

class Vehicle(models.Model):
    """User's vehicle information for personalized recommendations"""
    FUEL_TYPES = [
        ('PETROL_95', 'Petrol 95'),
        ('PETROL_98', 'Petrol 98'),
        ('DIESEL', 'Diesel'),
        ('ELECTRIC', 'Electric'),
        ('HYBRID', 'Hybrid'),
        ('LPG', 'LPG'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='vehicles')
    name = models.CharField(max_length=100)
    make = models.CharField(max_length=50)
    model = models.CharField(max_length=50)
    year = models.PositiveIntegerField()
    fuel_type = models.CharField(max_length=20, choices=FUEL_TYPES)
    tank_capacity = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        help_text="Capacity in liters",
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    avg_consumption = models.DecimalField(
        max_digits=4, 
        decimal_places=2, 
        help_text="Average consumption in liters per 100km",
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    license_plate = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username}'s {self.year} {self.make} {self.model}"
    
    class Meta:
        ordering = ['-created_at']


class FuelCompany(models.Model):
    """Represents petrol station brands/companies"""
    name = models.CharField(max_length=100)
    logo = models.ImageField(upload_to='company_logos/', blank=True, null=True)
    website = models.URLField(blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = "Fuel Companies"
        ordering = ['name']


class PetrolStation(models.Model):
    """Main model for petrol stations with location and basic information"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    company = models.ForeignKey(FuelCompany, on_delete=models.SET_NULL, null=True, related_name='stations')
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    phone_number = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True)
    opening_hours = models.JSONField(default=dict, help_text="JSON format of opening hours")
    is_24h = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    has_atm = models.BooleanField(default=False)
    has_shop = models.BooleanField(default=False)
    has_coffee = models.BooleanField(default=False)
    has_ev_charging = models.BooleanField(default=False)
    google_place_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    google_rating = models.FloatField(null=True, blank=True)
    google_user_ratings_total = models.IntegerField(null=True, blank=True)
    last_google_sync = models.DateTimeField(null=True, blank=True)
    busy_level = models.CharField(max_length=20, default='low')  # Optional
    wait_time = models.PositiveIntegerField(default=0)  # Optional
    
    def __str__(self):
        return f"{self.name} ({self.city})"
    
    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['latitude', 'longitude']),
            models.Index(fields=['city', 'state']),
        ]
    
    price_update_frequency = models.CharField(
        max_length=20, 
        choices=[
            ('high', 'High (Multiple times per day)'),
            ('medium', 'Medium (Daily)'),
            ('low', 'Low (Weekly or less)')
        ], 
        default='low'
    )
    last_price_update = models.DateTimeField(null=True, blank=True)
    
    # Data quality indicators
    data_quality_score = models.FloatField(default=0.5)
    is_verified = models.BooleanField(default=False)
    verification_source = models.CharField(max_length=50, blank=True)
    
    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['latitude', 'longitude']),
            models.Index(fields=['city', 'state']),
            models.Index(fields=['google_place_id']),
            models.Index(fields=['last_google_sync']),
            models.Index(fields=['data_quality_score']),
        ]


class StationAmenity(models.Model):
    """Represents amenities available at petrol stations"""
    AMENITY_TYPES = [
        ('ATM', 'ATM'),
        ('BATHROOM', 'Bathroom'),
        ('SHOP', 'Convenience Store'),
        ('RESTAURANT', 'Restaurant'),
        ('CAR_WASH', 'Car Wash'),
        ('TIRE_PRESSURE', 'Tire Pressure'),
        ('VACUUM', 'Vacuum Cleaner'),
        ('WATER', 'Water Service'),
        ('WIFI', 'Wi-Fi'),
        ('EV_CHARGING', 'EV Charging'),
        ('AIR_CONDITIONING', 'Air Conditioning'),
        ('DISABLED_ACCESS', 'Disabled Access'),
        ('BABY_CHANGE', 'Baby Changing Facilities'),
        ('COFFEE', 'Coffee Shop'),
    ]
    
    station = models.ForeignKey(PetrolStation, on_delete=models.CASCADE, related_name='amenities')
    amenity_type = models.CharField(max_length=50, choices=AMENITY_TYPES)
    is_operational = models.BooleanField(default=True)
    details = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.get_amenity_type_display()} at {self.station.name}"
    
    class Meta:
        verbose_name_plural = "Station Amenities"
        unique_together = ['station', 'amenity_type']


class FuelType(models.Model):
    """Different types of fuel available"""
    name = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name


class FuelPrice(models.Model):
    """Records of fuel prices at specific stations"""
    station = models.ForeignKey(PetrolStation, on_delete=models.CASCADE, related_name='fuel_prices')
    fuel_type = models.ForeignKey(FuelType, on_delete=models.CASCADE, related_name='prices')
    price = models.DecimalField(max_digits=6, decimal_places=3)
    reported_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='reported_prices'
    )
    is_verified = models.BooleanField(default=False)
    reported_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    
    source = models.CharField(
        max_length=50,
        choices=[
            ('user_report', 'User Report'),
            ('google_places', 'Google Places'),
            ('gasbuddy', 'GasBuddy'),
            ('aaa', 'AAA'),
            ('eia', 'Energy Information Administration'),
            ('api_scrape', 'API/Web Scraping'),
        ],
        default='user_report'
    )
    confidence_score = models.FloatField(default=0.5)
    is_verified = models.BooleanField(default=False)
    verification_method = models.CharField(max_length=50, blank=True)
    
    # Price change tracking
    previous_price = models.DecimalField(max_digits=6, decimal_places=3, null=True, blank=True)
    price_change = models.DecimalField(max_digits=5, decimal_places=3, null=True, blank=True)
    
    class Meta:
        ordering = ['-reported_at']
        indexes = [
            models.Index(fields=['station', 'fuel_type', '-reported_at']),
            models.Index(fields=['source', '-reported_at']),
            models.Index(fields=['confidence_score']),
        ]



class StationTraffic(models.Model):
    """Real-time and historical traffic data for stations"""
    station = models.ForeignKey(PetrolStation, on_delete=models.CASCADE, related_name='traffic_records')
    current_visitors = models.PositiveIntegerField(default=0)
    queue_length = models.PositiveIntegerField(default=0)
    estimated_wait_time = models.PositiveIntegerField(default=0, help_text="Wait time in minutes")
    timestamp = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return f"{self.station.name} - {self.current_visitors} visitors"
    
    class Meta:
        ordering = ['-timestamp']
        get_latest_by = 'timestamp'


class UserVisit(models.Model):
    """Records when users visit a petrol station"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='station_visits')
    station = models.ForeignKey(PetrolStation, on_delete=models.CASCADE, related_name='user_visits')
    check_in_time = models.DateTimeField(default=timezone.now)
    check_out_time = models.DateTimeField(null=True, blank=True)
    visit_duration = models.DurationField(null=True, blank=True)
    
    def save(self, *args, **kwargs):
        if self.check_in_time and self.check_out_time:
            self.visit_duration = self.check_out_time - self.check_in_time
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.user.username} at {self.station.name} on {self.check_in_time.date()}"


class Review(models.Model):
    """User reviews and ratings for petrol stations"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    station = models.ForeignKey(PetrolStation, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField()
    service_rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True
    )
    cleanliness_rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True
    )
    price_rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username}'s review for {self.station.name}"
    
    class Meta:
        unique_together = ['user', 'station']
        ordering = ['-created_at']


class ReviewImage(models.Model):
    """Images attached to user reviews"""
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='review_images/')
    caption = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Image for {self.review}"


class Favorite(models.Model):
    """User's favorite petrol stations"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites')
    station = models.ForeignKey(PetrolStation, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.user.username}'s favorite: {self.station.name}"
    
    class Meta:
        unique_together = ['user', 'station']


class PriceAlert(models.Model):
    """Price alerts for users based on their preferences"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='price_alerts')
    fuel_type = models.ForeignKey(FuelType, on_delete=models.CASCADE)
    target_price = models.DecimalField(max_digits=6, decimal_places=3)
    location_radius = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        help_text="Radius in kilometers"
    )
    location_lat = models.DecimalField(max_digits=9, decimal_places=6)
    location_lng = models.DecimalField(max_digits=9, decimal_places=6)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username}'s alert for {self.fuel_type} below {self.target_price}"


class FuelTransaction(models.Model):
    """Records user fuel purchases for consumption tracking"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='fuel_transactions')
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='fuel_transactions')
    station = models.ForeignKey(
        PetrolStation, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='transactions'
    )
    fuel_type = models.ForeignKey(FuelType, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=6, decimal_places=2, help_text="Liters/gallons of fuel")
    price_per_unit = models.DecimalField(max_digits=6, decimal_places=3)
    total_amount = models.DecimalField(max_digits=8, decimal_places=2)
    odometer_reading = models.PositiveIntegerField(null=True, blank=True)
    transaction_date = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def save(self, *args, **kwargs):
        if not self.total_amount:
            self.total_amount = self.quantity * self.price_per_unit
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.user.username} - {self.quantity}L on {self.transaction_date.date()}"
    
    class Meta:
        ordering = ['-transaction_date']


class TripPlan(models.Model):
    """Trip planning with suggested refueling stops"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='trip_plans')
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='trip_plans')
    start_address = models.CharField(max_length=255)
    start_latitude = models.DecimalField(max_digits=9, decimal_places=6)
    start_longitude = models.DecimalField(max_digits=9, decimal_places=6)
    destination_address = models.CharField(max_length=255)
    destination_latitude = models.DecimalField(max_digits=9, decimal_places=6)
    destination_longitude = models.DecimalField(max_digits=9, decimal_places=6)
    total_distance = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        help_text="Distance in kilometers"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username}'s trip from {self.start_address} to {self.destination_address}"


class RefuelStop(models.Model):
    """Suggested refueling stops for a trip plan"""
    trip_plan = models.ForeignKey(TripPlan, on_delete=models.CASCADE, related_name='refuel_stops')
    station = models.ForeignKey(PetrolStation, on_delete=models.CASCADE, related_name='suggested_stops')
    distance_from_start = models.DecimalField(
        max_digits=8, 
        decimal_places=2, 
        help_text="Distance in kilometers from start"
    )
    estimated_fuel_level = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        help_text="Estimated fuel level on arrival (liters)"
    )
    order = models.PositiveSmallIntegerField(help_text="Order of stop in the trip")
    
    def __str__(self):
        return f"Stop {self.order} at {self.station.name} for {self.trip_plan}"
    
    class Meta:
        ordering = ['order']


class StationReport(models.Model):
    """User reports for incorrect information or issues"""
    REPORT_TYPES = [
        ('INCORRECT_PRICE', 'Incorrect Price'),
        ('INCORRECT_HOURS', 'Incorrect Hours'),
        ('CLOSED_STATION', 'Permanently Closed'),
        ('TEMP_CLOSED', 'Temporarily Closed'),
        ('MISSING_AMENITY', 'Missing Amenity'),
        ('INCORRECT_AMENITY', 'Incorrect Amenity'),
        ('OTHER', 'Other Issue'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending Review'),
        ('INVESTIGATING', 'Under Investigation'),
        ('RESOLVED', 'Resolved'),
        ('REJECTED', 'Rejected'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='station_reports')
    station = models.ForeignKey(PetrolStation, on_delete=models.CASCADE, related_name='reports')
    report_type = models.CharField(max_length=50, choices=REPORT_TYPES)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    admin_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.get_report_type_display()} report for {self.station.name}"


class Notification(models.Model):
    """User notifications for various events"""
    NOTIFICATION_TYPES = [
        ('PRICE_ALERT', 'Price Alert'),
        ('FAVORITE_UPDATE', 'Favorite Station Update'),
        ('TRIP_REMINDER', 'Trip Reminder'),
        ('REVIEW_RESPONSE', 'Review Response'),
        ('REPORT_STATUS', 'Report Status Update'),
        ('SYSTEM', 'System Notification'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=100)
    message = models.TextField()
    related_object_id = models.CharField(max_length=50, blank=True)
    related_object_type = models.CharField(max_length=50, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.notification_type} for {self.user.username}: {self.title}"
    
    class Meta:
        ordering = ['-created_at']


# Promotion and loyalty related models
class PromotionCampaign(models.Model):
    """Promotions and special offers at stations"""
    company = models.ForeignKey(FuelCompany, on_delete=models.CASCADE, related_name='promotions')
    title = models.CharField(max_length=100)
    description = models.TextField()
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    banner_image = models.ImageField(upload_to='promotion_banners/', blank=True, null=True)
    terms_conditions = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.title} ({self.company.name})"
    
    class Meta:
        ordering = ['-start_date']


class StationPromotion(models.Model):
    """Links promotions to specific stations"""
    promotion = models.ForeignKey(PromotionCampaign, on_delete=models.CASCADE, related_name='stations')
    station = models.ForeignKey(PetrolStation, on_delete=models.CASCADE, related_name='promotions')
    
    def __str__(self):
        return f"{self.promotion.title} at {self.station.name}"


class UserSubscription(models.Model):
    """Premium subscriptions for enhanced features"""
    SUBSCRIPTION_TYPES = [
        ('FREE', 'Free Tier'),
        ('BASIC', 'Basic Subscription'),
        ('PREMIUM', 'Premium Subscription'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='subscription')
    subscription_type = models.CharField(max_length=20, choices=SUBSCRIPTION_TYPES, default='FREE')
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    payment_reference = models.CharField(max_length=100, blank=True)
    auto_renew = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username}'s {self.subscription_type} subscription"