# tasks.py - Celery background tasks
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

@shared_task
def sync_fuel_prices():
    """Background task to sync fuel prices from external sources"""
    from .services.fuel_price_service import FuelPriceService
    from .models import PetrolStation, FuelType, FuelPrice
    
    price_service = FuelPriceService()
    updated_count = 0
    
    # Get stations that need price updates (prioritize high-traffic stations)
    stations_to_update = PetrolStation.objects.filter(
        is_active=True,
        last_price_update__lt=timezone.now() - timedelta(hours=2)
    ).order_by('-google_user_ratings_total', 'last_price_update')[:100]
    
    for station in stations_to_update:
        try:
            prices = price_service.get_station_prices(station)
            if prices:
                for price_data in prices:
                    # Create or update price records
                    fuel_type = FuelType.objects.get(name=price_data['fuel_type'])
                    
                    # Get previous price for change tracking
                    previous_price_obj = FuelPrice.objects.filter(
                        station=station,
                        fuel_type=fuel_type
                    ).order_by('-reported_at').first()
                    
                    previous_price = previous_price_obj.price if previous_price_obj else None
                    price_change = None
                    if previous_price:
                        price_change = price_data['price'] - float(previous_price)
                    
                    FuelPrice.objects.create(
                        station=station,
                        fuel_type=fuel_type,
                        price=price_data['price'],
                        source=price_data.get('source', 'api_scrape'),
                        confidence_score=price_data.get('reliability_score', 0.5),
                        previous_price=previous_price,
                        price_change=price_change
                    )
                
                station.last_price_update = timezone.now()
                station.save()
                updated_count += 1
                
        except Exception as e:
            logger.error(f"Error updating prices for station {station.id}: {e}")
            continue
    
    logger.info(f"Updated prices for {updated_count} stations")
    return updated_count


@shared_task
def sync_google_places_data():
    """Background task to sync station data with Google Places"""
    from .services.google_places_service import GooglePlacesService
    from .models import PetrolStation
    
    places_service = GooglePlacesService()
    updated_count = 0
    
    # Get stations that need Google Places updates
    cutoff_date = timezone.now() - timedelta(days=7)
    stations_to_update = PetrolStation.objects.filter(
        is_active=True,
        google_place_id__isnull=False,
        last_google_sync__lt=cutoff_date
    ).order_by('last_google_sync')[:50]
    
    for station in stations_to_update:
        try:
            place_details = places_service.get_place_details(station.google_place_id)
            if place_details:
                # Update station with fresh Google data
                station.google_rating = place_details.get('rating')
                station.google_user_ratings_total = place_details.get('user_ratings_total')
                station.website = place_details.get('website', station.website)
                station.phone_number = place_details.get('formatted_phone_number', station.phone_number)
                
                # Update opening hours if available
                opening_hours = place_details.get('opening_hours', {})
                if opening_hours:
                    station.opening_hours = opening_hours.get('periods', station.opening_hours)
                    station.is_24h = opening_hours.get('open_now', False) and 'periods' not in opening_hours
                
                station.last_google_sync = timezone.now()
                station.data_quality_score = min(1.0, station.data_quality_score + 0.1)
                station.save()
                updated_count += 1
                
        except Exception as e:
            logger.error(f"Error syncing Google data for station {station.id}: {e}")
            continue
    
    logger.info(f"Synced Google Places data for {updated_count} stations")
    return updated_count


@shared_task
def cleanup_old_price_data():
    """Clean up old price data to maintain database performance"""
    from .models import FuelPrice, PetrolStation, FuelType
    
    # Keep only last 30 days of price data per station/fuel type combination
    cutoff_date = timezone.now() - timedelta(days=30)
    
    # For each station/fuel_type combination, keep only the most recent prices
    deleted_count = 0
    
    for station in PetrolStation.objects.filter(is_active=True):
        for fuel_type in FuelType.objects.all():
            old_prices = FuelPrice.objects.filter(
                station=station,
                fuel_type=fuel_type,
                reported_at__lt=cutoff_date
            ).order_by('-reported_at')[10:]  # Keep 10 historical records
            
            if old_prices:
                old_price_ids = [price.id for price in old_prices]
                deleted_count += FuelPrice.objects.filter(id__in=old_price_ids).delete()[0]
    
    logger.info(f"Cleaned up {deleted_count} old price records")
    return deleted_count


@shared_task
def calculate_data_quality_scores():
    """Calculate and update data quality scores for all stations"""
    from .models import PetrolStation, FuelPrice
    
    updated_count = 0
    
    for station in PetrolStation.objects.filter(is_active=True):
        score = 0.0
        
        # Base score for having basic information
        if station.name and station.address:
            score += 0.2
        
        # Google Places integration
        if station.google_place_id:
            score += 0.2
            if station.google_rating and station.google_rating >= 3.0:
                score += 0.1
        
        # Recent price data
        recent_prices = FuelPrice.objects.filter(
            station=station,
            reported_at__gte=timezone.now() - timedelta(days=7)
        ).count()
        
        if recent_prices > 0:
            score += 0.2
            if recent_prices >= 3:  # Multiple fuel types
                score += 0.1
        
        # Data freshness
        if station.last_google_sync and station.last_google_sync >= timezone.now() - timedelta(days=7):
            score += 0.1
        
        # User verification
        if station.is_verified:
            score += 0.1
        
        station.data_quality_score = min(1.0, score)
        station.save()
        updated_count += 1
    
    logger.info(f"Updated data quality scores for {updated_count} stations")
    return updated_count


# API rate limiting decorators
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator

# Enhanced ViewSet with rate limiting
from .views import EnhancedPetrolStationViewSet  # Make sure this import path is correct
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

@method_decorator(ratelimit(key='ip', rate='100/h', method='GET'), name='nearby_with_real_data')
@method_decorator(ratelimit(key='user', rate='50/h', method='GET'), name='nearby_with_real_data')
class RateLimitedPetrolStationViewSet(EnhancedPetrolStationViewSet):
    """ViewSet with rate limiting for production use"""
    
    @action(detail=False, methods=['get'])
    @ratelimit(key='ip', rate='20/h', method='GET')
    def premium_nearby_search(self, request):
        """Premium search with enhanced data and higher rate limits for authenticated users"""
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required for premium search"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Enhanced search with more comprehensive data
        return self.nearby_with_real_data(request)
