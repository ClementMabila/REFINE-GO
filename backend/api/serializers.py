from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from .models import (
    User, Vehicle, FuelCompany, PetrolStation, StationAmenity,
    FuelType, FuelPrice, StationTraffic, UserVisit, Review,
    ReviewImage, Favorite, PriceAlert, FuelTransaction,
    TripPlan, RefuelStop, StationReport, Notification,
    PromotionCampaign, StationPromotion, UserSubscription
)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 
                 'phone_number', 'profile_picture', 'preferred_fuel_type', 'date_joined']


class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = '__all__'


class FuelCompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = FuelCompany
        fields = '__all__'


class StationAmenitySerializer(serializers.ModelSerializer):
    amenity_type_display = serializers.CharField(source='get_amenity_type_display', read_only=True)
    
    class Meta:
        model = StationAmenity
        fields = ['id', 'station', 'amenity_type', 'amenity_type_display', 'is_operational', 'details']

class PetrolStationListSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    company_logo = serializers.ImageField(source='company.logo', read_only=True)
    rating = serializers.SerializerMethodField()
    distance = serializers.FloatField(required=False)
    regularPrice = serializers.SerializerMethodField()
    premiumPrice = serializers.SerializerMethodField()
    dieselPrice = serializers.SerializerMethodField()
    isOpen = serializers.SerializerMethodField()
    hasATM = serializers.SerializerMethodField()
    hasShop = serializers.SerializerMethodField()
    hasCoffee = serializers.SerializerMethodField()
    hasEVCharging = serializers.SerializerMethodField()
    busyLevel = serializers.SerializerMethodField()
    waitTime = serializers.SerializerMethodField()
    coordinates = serializers.SerializerMethodField()

    class Meta:
        model = PetrolStation
        fields = [
            'id', 'name', 'address', 'rating', 'distance',
            'regularPrice', 'premiumPrice', 'dieselPrice',
            'isOpen', 'hasATM', 'hasShop', 'hasCoffee', 'hasEVCharging',
            'busyLevel', 'waitTime', 'coordinates'
        ]

    def get_rating(self, obj):
        reviews = obj.reviews.all()
        if not reviews:
            return None
        return round(sum(r.rating for r in reviews) / reviews.count(), 1)

    def get_fuel_price(self, obj, fuel_type_name):
        latest_price = obj.fuel_prices.filter(fuel_type__name__iexact=fuel_type_name).order_by('-reported_at').first()
        return round(latest_price.price, 2) if latest_price else None

    def get_regularPrice(self, obj):
        return self.get_fuel_price(obj, 'Regular')

    def get_premiumPrice(self, obj):
        return self.get_fuel_price(obj, 'Premium')

    def get_dieselPrice(self, obj):
        return self.get_fuel_price(obj, 'Diesel')

    def get_isOpen(self, obj):
        if not obj.is_24h:
            now = timezone.now().time()
            return obj.opening_time <= now <= obj.closing_time
        return True

    def get_hasATM(self, obj):
        return obj.amenities.filter(type='ATM').exists()

    def get_hasShop(self, obj):
        return obj.amenities.filter(type='Shop').exists()

    def get_hasCoffee(self, obj):
        return obj.amenities.filter(type='Coffee').exists()

    def get_hasEVCharging(self, obj):
        return obj.amenities.filter(type='EV Charging').exists()

    def get_busyLevel(self, obj):
        traffic = obj.traffic_records.order_by('-timestamp').first()
        if not traffic:
            return None
        if traffic.queue_length <= 3:
            return "low"
        elif traffic.queue_length <= 7:
            return "medium"
        return "high"

    def get_waitTime(self, obj):
        traffic = obj.traffic_records.order_by('-timestamp').first()
        return traffic.estimated_wait_time if traffic else None

    def get_coordinates(self, obj):
        return {
            'lat': obj.latitude,
            'lng': obj.longitude
        }


  
class EnhancedPetrolStationSerializer(serializers.ModelSerializer):
    current_prices = serializers.SerializerMethodField()
    distance = serializers.FloatField(read_only=True)
    reliability_score = serializers.FloatField(read_only=True)
    price_trend = serializers.SerializerMethodField()
    
    class Meta:
        model = PetrolStation
        fields = [
            'id', 'name', 'company', 'address', 'city', 'state',
            'latitude', 'longitude', 'phone_number', 'website',
            'is_24h', 'has_atm', 'has_shop', 'has_coffee', 'has_ev_charging',
            'google_rating', 'google_user_ratings_total', 'data_quality_score',
            'current_prices', 'distance', 'reliability_score', 'price_trend'
        ]
    
    def get_current_prices(self, obj):
        """Get latest prices for each fuel type"""
        latest_prices = []
        
        for fuel_type in FuelType.objects.all():
            latest_price = FuelPrice.objects.filter(
                station=obj,
                fuel_type=fuel_type
            ).order_by('-reported_at').first()
            
            if latest_price:
                latest_prices.append({
                    'fuel_type': fuel_type.name,
                    'price': float(latest_price.price),
                    'reported_at': latest_price.reported_at,
                    'source': latest_price.source,
                    'confidence_score': latest_price.confidence_score,
                    'price_change': float(latest_price.price_change) if latest_price.price_change else None
                })
        
        return latest_prices
    
    def get_price_trend(self, obj):
        """Calculate price trend over the last week"""
        week_ago = timezone.now() - timedelta(days=7)
        
        trends = {}
        for fuel_type in FuelType.objects.all():
            prices = FuelPrice.objects.filter(
                station=obj,
                fuel_type=fuel_type,
                reported_at__gte=week_ago
            ).order_by('reported_at')
            
            if prices.count() >= 2:
                first_price = float(prices.first().price)
                last_price = float(prices.last().price)
                change = last_price - first_price
                
                if abs(change) > 0.01:  # Only report significant changes
                    trends[fuel_type.name] = {
                        'change': round(change, 3),
                        'direction': 'up' if change > 0 else 'down',
                        'percentage': round((change / first_price) * 100, 2)
                    }
        
        return trends
        
class PetrolStationSerializer(serializers.ModelSerializer):
    company = FuelCompanySerializer(read_only=True)
    amenities = StationAmenitySerializer(many=True, read_only=True)
    current_prices = serializers.SerializerMethodField()
    distance = serializers.FloatField(read_only=True)
    reliability_score = serializers.FloatField(read_only=True)
    price_trend = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()
    current_traffic = serializers.SerializerMethodField()
    
    class Meta:
        model = PetrolStation
        fields = [
            'id', 'name', 'company', 'address', 'city', 'state',
            'latitude', 'longitude', 'phone_number', 'website',
            'is_24h', 'has_atm', 'has_shop', 'has_coffee', 'has_ev_charging',
            'google_rating', 'google_user_ratings_total', 'data_quality_score',
            'current_prices', 'distance', 'reliability_score', 'price_trend',
            'amenities', 'average_rating', 'reviews_count', 'current_traffic',
            # Add any other fields you need
        ]
        read_only_fields = ['google_rating', 'google_user_ratings_total']
    
    def get_current_prices(self, obj):
        """Combined approach for getting current prices"""
        latest_prices = []
        price_map = {}  # For efficient lookup
        
        # First get all fuel types
        fuel_types = FuelType.objects.all()
        
        # Pre-fetch prices for this station
        prices = obj.fuel_prices.order_by('fuel_type', '-reported_at')
        
        for fuel_type in fuel_types:
            # Try to find price in pre-fetched queryset first
            price = next((p for p in prices if p.fuel_type_id == fuel_type.id), None)
            
            if not price:
                # Fall back to query if not found in pre-fetch
                price = FuelPrice.objects.filter(
                    station=obj,
                    fuel_type=fuel_type
                ).order_by('-reported_at').first()
            
            if price:
                latest_prices.append({
                    'fuel_type_id': fuel_type.id,
                    'fuel_type': fuel_type.name,
                    'price': float(price.price),
                    'reported_at': price.reported_at,
                    'source': price.source,
                    'confidence_score': price.confidence_score,
                    'price_change': float(price.price_change) if price.price_change else None
                })
        
        return latest_prices
    
    def get_price_trend(self, obj):
        """Calculate price trend over the last week"""
        week_ago = timezone.now() - timedelta(days=7)
        
        trends = {}
        for fuel_type in FuelType.objects.all():
            prices = FuelPrice.objects.filter(
                station=obj,
                fuel_type=fuel_type,
                reported_at__gte=week_ago
            ).order_by('reported_at')
            
            if prices.count() >= 2:
                first_price = float(prices.first().price)
                last_price = float(prices.last().price)
                change = last_price - first_price
                
                if abs(change) > 0.01:  # Only report significant changes
                    trends[fuel_type.name] = {
                        'change': round(change, 3),
                        'direction': 'up' if change > 0 else 'down',
                        'percentage': round((change / first_price) * 100, 2),
                        'data_points': prices.count()
                    }
        
        return trends
    
    def get_average_rating(self, obj):
        """Calculate average from local reviews"""
        reviews = obj.reviews.all()
        if not reviews:
            return None
        return round(sum(review.rating for review in reviews) / reviews.count(), 1)
    
    def get_reviews_count(self, obj):
        """Count of local reviews"""
        return obj.reviews.count()
    
    def get_current_traffic(self, obj):
        """Get latest traffic data"""
        latest_traffic = obj.traffic_records.order_by('-timestamp').first()
        if not latest_traffic:
            return None
        return {
            'current_visitors': latest_traffic.current_visitors,
            'queue_length': latest_traffic.queue_length,
            'estimated_wait_time': latest_traffic.estimated_wait_time,
            'timestamp': latest_traffic.timestamp
        }

class FuelTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FuelType
        fields = '__all__'


class FuelPriceSerializer(serializers.ModelSerializer):
    fuel_type_name = serializers.CharField(source='fuel_type.name', read_only=True)
    station_name = serializers.CharField(source='station.name', read_only=True)
    
    class Meta:
        model = FuelPrice
        fields = ['id', 'station', 'station_name', 'fuel_type', 'fuel_type_name', 
                 'price', 'reported_by', 'is_verified', 'reported_at']


class StationTrafficSerializer(serializers.ModelSerializer):
    station_name = serializers.CharField(source='station.name', read_only=True)
    
    class Meta:
        model = StationTraffic
        fields = ['id', 'station', 'station_name', 'current_visitors', 
                 'queue_length', 'estimated_wait_time', 'timestamp']


class ReviewImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewImage
        fields = ['id', 'image', 'caption', 'created_at']


class ReviewSerializer(serializers.ModelSerializer):
    images = ReviewImageSerializer(many=True, read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    station_name = serializers.CharField(source='station.name', read_only=True)
    
    class Meta:
        model = Review
        fields = ['id', 'user', 'user_username', 'station', 'station_name', 
                 'rating', 'comment', 'service_rating', 'cleanliness_rating', 
                 'price_rating', 'created_at', 'updated_at', 'images']


class FavoriteSerializer(serializers.ModelSerializer):
    station_detail = PetrolStationListSerializer(source='station', read_only=True)
    
    class Meta:
        model = Favorite
        fields = ['id', 'user', 'station', 'station_detail', 'notes', 'created_at']


class PriceAlertSerializer(serializers.ModelSerializer):
    fuel_type_name = serializers.CharField(source='fuel_type.name', read_only=True)
    
    class Meta:
        model = PriceAlert
        fields = ['id', 'user', 'fuel_type', 'fuel_type_name', 'target_price', 
                 'location_radius', 'location_lat', 'location_lng', 
                 'is_active', 'created_at']


class FuelTransactionSerializer(serializers.ModelSerializer):
    station_name = serializers.CharField(source='station.name', read_only=True)
    fuel_type_name = serializers.CharField(source='fuel_type.name', read_only=True)
    vehicle_name = serializers.CharField(source='vehicle.name', read_only=True)
    
    class Meta:
        model = FuelTransaction
        fields = ['id', 'user', 'vehicle', 'vehicle_name', 'station', 'station_name', 
                 'fuel_type', 'fuel_type_name', 'quantity', 'price_per_unit', 
                 'total_amount', 'odometer_reading', 'transaction_date']


class RefuelStopSerializer(serializers.ModelSerializer):
    station_detail = PetrolStationListSerializer(source='station', read_only=True)
    
    class Meta:
        model = RefuelStop
        fields = ['id', 'trip_plan', 'station', 'station_detail', 
                 'distance_from_start', 'estimated_fuel_level', 'order']


class TripPlanSerializer(serializers.ModelSerializer):
    refuel_stops = RefuelStopSerializer(many=True, read_only=True)
    vehicle_name = serializers.CharField(source='vehicle.name', read_only=True)
    
    class Meta:
        model = TripPlan
        fields = ['id', 'user', 'vehicle', 'vehicle_name', 'start_address', 
                 'start_latitude', 'start_longitude', 'destination_address', 
                 'destination_latitude', 'destination_longitude', 
                 'total_distance', 'created_at', 'refuel_stops']


class StationReportSerializer(serializers.ModelSerializer):
    station_name = serializers.CharField(source='station.name', read_only=True)
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = StationReport
        fields = ['id', 'user', 'station', 'station_name', 'report_type', 
                 'report_type_display', 'description', 'status', 'status_display', 
                 'created_at', 'updated_at']


class NotificationSerializer(serializers.ModelSerializer):
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    
    class Meta:
        model = Notification
        fields = ['id', 'user', 'notification_type', 'notification_type_display', 
                 'title', 'message', 'related_object_id', 'related_object_type', 
                 'is_read', 'created_at']


class PromotionCampaignSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    
    class Meta:
        model = PromotionCampaign
        fields = ['id', 'company', 'company_name', 'title', 'description', 
                 'start_date', 'end_date', 'is_active', 'banner_image', 
                 'terms_conditions', 'created_at']


class StationPromotionSerializer(serializers.ModelSerializer):
    promotion_details = PromotionCampaignSerializer(source='promotion', read_only=True)
    station_name = serializers.CharField(source='station.name', read_only=True)
    
    class Meta:
        model = StationPromotion
        fields = ['id', 'promotion', 'promotion_details', 'station', 'station_name']


class UserSubscriptionSerializer(serializers.ModelSerializer):
    subscription_type_display = serializers.CharField(source='get_subscription_type_display', read_only=True)
    
    class Meta:
        model = UserSubscription
        fields = ['id', 'user', 'subscription_type', 'subscription_type_display', 
                 'start_date', 'end_date', 'is_active', 'auto_renew']