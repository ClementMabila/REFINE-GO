from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework import status
from rest_framework import filters
from rest_framework import viewsets
from rest_framework import permissions
from rest_framework import serializers
from django_filters.rest_framework import DjangoFilterBackend
from django.core.mail import send_mail
from django.contrib.auth import get_user_model, authenticate
from .models import EmailOTP
import random
from django.utils import timezone
from datetime import timedelta
import datetime
from django.conf import settings
from django.db.models import Sum
from django.core.cache import cache
import requests
import logging
from bs4 import BeautifulSoup
from django.core.cache import cache
from django.conf import settings
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import json
import re
import traceback
from django.db import transaction
import math
from typing import List, Dict
from .models import (
    User, Vehicle, FuelCompany, PetrolStation, StationAmenity,
    FuelType, FuelPrice, StationTraffic, UserVisit, Review,
    ReviewImage, Favorite, PriceAlert, FuelTransaction,
    TripPlan, RefuelStop, StationReport, Notification,
    PromotionCampaign, StationPromotion, UserSubscription
)
from .serializers import (
    UserSerializer, VehicleSerializer, FuelCompanySerializer,
    PetrolStationListSerializer,
    StationAmenitySerializer, FuelTypeSerializer, FuelPriceSerializer,
    StationTrafficSerializer, ReviewSerializer, ReviewImageSerializer,
    FavoriteSerializer, PriceAlertSerializer, FuelTransactionSerializer,
    TripPlanSerializer, RefuelStopSerializer, StationReportSerializer,
    NotificationSerializer, PromotionCampaignSerializer,
    StationPromotionSerializer, UserSubscriptionSerializer
)

import logging
import time
from collections import defaultdict
import numpy as np
logger = logging.getLogger(__name__)

# Add this import or definition for GooglePlacesService
from .services.google_places_service import GooglePlacesService  # Make sure this path is correct and the service exists
from .services.fuel_price_service import FuelPriceService

User = get_user_model()

@api_view(['POST'])
def register_user(request):
    data = request.data
    email = data.get('email')  
    username = data.get('username')

    if not email or not username or not data.get('password'):
        return Response({"error": "Missing required fields"}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already exists"}, status=400)

    if User.objects.filter(email=email).exists():
        return Response({"error": "Email already registered"}, status=400)

    # Create user with is_active=False
    user = User.objects.create_user(
        username=username,
        email=email,
        password=data['password'],
        phone_number=data.get('phone_number'),
        preferred_fuel_type=data.get('preferred_fuel_type', ''),
        is_active=False  # not active until OTP is verified
    )

    # Generate and send OTP
    otp = str(random.randint(100000, 999999))
    EmailOTP.objects.update_or_create(email=email, defaults={'otp': otp})

    send_mail(
        subject='Your Verification OTP',
        message=f'Your code is: {otp}',
        from_email='noreply@yourapp.com',
        recipient_list=[email],
        fail_silently=False,
    )

    return Response({"message": "Account created. Verify OTP sent to email."}, status=201)

@api_view(['POST'])
def verify_otp(request):
    email = request.data.get('email')
    otp = request.data.get('otp')

    try:
        otp_record = EmailOTP.objects.get(email=email)
        if otp_record.otp != otp:
            return Response({"error": "Invalid OTP"}, status=400)
        if otp_record.created_at + timedelta(minutes=10) < timezone.now():
            return Response({"error": "OTP expired"}, status=400)

        # Activate the user
        user = User.objects.get(email=email)
        user.is_active = True
        user.save()

        otp_record.delete()  # remove OTP after successful use
        return Response({"message": "OTP verified. Account activated."}, status=200)

    except EmailOTP.DoesNotExist:
        return Response({"error": "No OTP found for email"}, status=400)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=400)
    
@api_view(['POST'])
def login_verify_otp(request):
    email = request.data.get('email')
    otp = request.data.get('otp')

    if not email or not otp:
        return Response({"error": "Email and OTP are required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        otp_record = EmailOTP.objects.get(email=email)
    except EmailOTP.DoesNotExist:
        return Response({"error": "OTP not found. Please request a new one."}, status=status.HTTP_404_NOT_FOUND)

    if otp_record.otp != otp:
        return Response({"error": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

    # Optionally, delete or invalidate the OTP after successful verification
    otp_record.delete()

    # You can return user info or token here if you have token authentication
    user = User.objects.get(email=email)
    return Response({"message": "OTP verified successfully.", "username": user.username})


@api_view(['POST'])
def login_user(request):
    data = request.data
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return Response({"error": "Email and password required"}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(request, username=email, password=password)
    if user is None:
        return Response({"error": "Invalid email or password"}, status=status.HTTP_401_UNAUTHORIZED)

    # Generate OTP and save/update in EmailOTP table
    otp = str(random.randint(100000, 999999))
    EmailOTP.objects.update_or_create(email=email, defaults={'otp': otp})

    # Send OTP email
    send_mail(
        'Your login OTP',
        f'Your OTP is {otp}',
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=False,
    )
    return Response({"message": "OTP sent to your email. Please verify to login."})


#DASHBOARD MAIN FUNCTIONS

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


class VehicleViewSet(viewsets.ModelViewSet):
    serializer_class = VehicleSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Vehicle.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class FuelCompanyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = FuelCompany.objects.all()
    serializer_class = FuelCompanySerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

class PetrolStationViewSet(viewsets.ModelViewSet):
    queryset = PetrolStation.objects.filter(is_active=True)
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    serializer_class = PetrolStationListSerializer
    filterset_fields = ['city', 'state', 'company', 'is_24h']
    search_fields = ['name', 'address', 'city']
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.places_service = GooglePlacesService()
        self.price_service = FuelPriceService()
        self.price_methods = PetrolStationEnhancedMethods() 

        self.cache_timeout = 3600  # 1 hour cache
        self.price_sources = [
            'https://www.fuelprices.co.za/',
            'https://www.aa.co.za/fuel-price',
            'https://www.automobil.co.za/fuel-prices/',
        ]
            # Base prices for South Africa (updated monthly by government)
        self.sa_base_prices = {
            'petrol_93': 23.50,  # R per liter
            'petrol_95': 24.20,
            'diesel_0005': 22.80,
            'diesel_005': 22.90,
        } 
    
    @action(detail=False, methods=['get'])
    def nearby_with_real_data(self, request):
        """Enhanced nearby search with real Google Places data and prices"""
        try:
            # Add debug logging
            logger.info(f"Request params: {dict(request.query_params)}")
            
            lat_param = request.query_params.get('lat')
            lng_param = request.query_params.get('lng')

            # More detailed logging
            logger.info(f"lat_param: {lat_param} (type: {type(lat_param)})")
            logger.info(f"lng_param: {lng_param} (type: {type(lng_param)})")

            if lat_param is None or lng_param is None:
                logger.error("Missing lat or lng parameters")
                return Response(
                    {"error": "Missing required query parameters: 'lat' and 'lng'"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                lat = float(lat_param)
                lng = float(lng_param)
                logger.info(f"Converted coordinates: lat={lat}, lng={lng}")
            except (ValueError, TypeError) as e:
                logger.error(f"Coordinate conversion error: {e}")
                return Response(
                    {"error": f"Latitude and Longitude must be valid float numbers. Got lat='{lat_param}', lng='{lng_param}'"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate coordinate ranges
            if not (-90 <= lat <= 90):
                logger.error(f"Invalid latitude: {lat}")
                return Response(
                    {"error": f"Latitude must be between -90 and 90. Got: {lat}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            if not (-180 <= lng <= 180):
                logger.error(f"Invalid longitude: {lng}")
                return Response(
                    {"error": f"Longitude must be between -180 and 180. Got: {lng}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                radius = float(request.query_params.get('radius', 5.0))
                if radius <= 0 or radius > 100:  # Reasonable limits
                    logger.error(f"Invalid radius: {radius}")
                    return Response(
                        {"error": f"Radius must be between 0 and 100 km. Got: {radius}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except (ValueError, TypeError) as e:
                logger.error(f"Radius conversion error: {e}")
                return Response(
                    {"error": f"Radius must be a valid number. Got: '{request.query_params.get('radius')}'"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            force_refresh = request.query_params.get('refresh', 'false').lower() == 'true'
            
            # Cache key for this location
            cache_key = f"nearby_stations_{lat}_{lng}_{radius}"
            
            if not force_refresh:
                cached_result = cache.get(cache_key)
                if cached_result:
                    logger.info("Returning cached result")
                    return Response(cached_result)
            
            # Get stations from database first
            logger.info("Starting database query...")
            try:
                db_stations = self._get_nearby_db_stations(lat, lng, radius)
                logger.info("DB stations count: %d", len(db_stations))
            except Exception as e:
                logger.error(f"Error getting DB stations: {e}")
                logger.error(traceback.format_exc())
                db_stations = []

            # Get Google stations
            logger.info("Starting Google Places query...")
            try:
                google_stations = self.places_service.find_nearby_stations(lat, lng, radius * 1000)
                logger.info("Google stations count: %d", len(google_stations))
            except Exception as e:
                logger.error(f"Error getting Google stations: {e}")
                logger.error(traceback.format_exc())
                google_stations = []

            # Merge and process stations
            try:
                all_stations = self._merge_station_data(db_stations, google_stations, lat, lng)
                logger.info("Merged station count: %d", len(all_stations))

                enhanced_stations = self._enhance_with_prices(all_stations[:20])
                logger.info("Enhanced station count: %d", len(enhanced_stations))

                # Format for frontend compatibility
                frontend_formatted = self._format_for_frontend(enhanced_stations)
                logger.info("Frontend formatted station count: %d", len(frontend_formatted))

                # Sort by distance and reliability with safe handling
                result = sorted(
                    frontend_formatted,
                    key=lambda x: (
                        float(x.get('distance') or 0) if x.get('distance') is not None else float('inf'),
                        -(float(x.get('reliability_score') or 0))
                    )
                )
                
                # Cache for 15 minutes
                cache.set(cache_key, result, 900)
                
                logger.info(f"Returning {len(result)} stations")
                return Response(result)
                
            except Exception as e:
                logger.error(f"Error processing stations: {e}")
                logger.error(traceback.format_exc())
                return Response(
                    {"error": "Error processing station data"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except (ValueError, TypeError) as e:
            logger.error(f"Parameter validation error: {str(e)}")
            logger.error(traceback.format_exc())
            return Response(
                {"error": f"Invalid parameters: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Unhandled exception in nearby_with_real_data: {str(e)}")
            logger.error(traceback.format_exc())
            return Response(
                {"error": "Internal server error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _get_nearby_db_stations(self, lat: float, lng: float, radius: float) -> List[Dict]:
        """Get nearby stations from database with proper null handling"""
        try:
            # Calculate latitude/longitude ranges with validation
            if radius <= 0:
                return []
                
            lat_range = radius * 0.009
            lng_range = radius * 0.009
            
            # Validate coordinate ranges
            if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
                return []
            
            # Get stations with safe float conversion
            stations = PetrolStation.objects.filter(
                latitude__range=(lat - lat_range, lat + lat_range),
                longitude__range=(lng - lng_range, lng + lng_range),
                is_active=True
            ).select_related('company')
            
            result = []
            for station in stations:
                try:
                    # Safely convert coordinates to float
                    station_lat = float(station.latitude) if station.latitude is not None else None
                    station_lng = float(station.longitude) if station.longitude is not None else None
                    
                    # Skip if coordinates are invalid
                    if station_lat is None or station_lng is None:
                        continue
                    
                    distance = self._calculate_distance(lat, lng, station_lat, station_lng)
                    
                    # Skip if distance calculation failed or exceeds radius
                    if distance is None or distance > radius:
                        continue
                    
                    # Serialize station data with null checks
                    station_data = PetrolStationListSerializer(station).data
                    station_data['distance'] = round(distance, 2)
                    station_data['source'] = 'database'
                    
                    # Add database-specific fields with null checks
                    additional_data = {
                        'has_atm': bool(station.has_atm) if station.has_atm is not None else None,
                        'has_shop': bool(station.has_shop) if station.has_shop is not None else None,
                        'has_coffee': bool(station.has_coffee) if station.has_coffee is not None else None,
                        'has_ev_charging': bool(station.has_ev_charging) if station.has_ev_charging is not None else None,
                        'busy_level': int(station.busy_level) if station.busy_level is not None else None,
                        'wait_time': int(station.wait_time) if station.wait_time is not None else None,
                        'is_24h': bool(station.is_24h) if station.is_24h is not None else None,
                        'google_rating': float(station.google_rating) if station.google_rating is not None else None,
                        'opening_hours': station.opening_hours if station.opening_hours else None,
                    }
                    
                    station_data.update(additional_data)
                    result.append(station_data)
                    
                except (TypeError, ValueError) as e:
                    logger.warning(f"Skipping station {station.id} due to processing error: {str(e)}")
                    continue
            
            return result
            
        except Exception as e:
            logger.error(f"Error in _get_nearby_db_stations: {str(e)}")
            logger.error(traceback.format_exc())
            return []
        
    def _merge_station_data(self, db_stations: List[Dict], google_stations: List[Dict], lat: float, lng: float) -> List[Dict]:
        """Merge database stations with Google Places data, avoiding duplicates"""
        result = list(db_stations)  # Start with database stations
        
        for google_station in google_stations:
            # Check if this station already exists in our database
            is_duplicate = False
            google_lat = google_station.get('latitude')
            google_lng = google_station.get('longitude')
            
            if google_lat is not None and google_lng is not None:
                for db_station in db_stations:
                    db_lat = db_station.get('latitude')
                    db_lng = db_station.get('longitude')
                    
                    if db_lat is not None and db_lng is not None:
                        db_distance = self._calculate_distance(
                            google_lat, google_lng, db_lat, db_lng
                        )
                        
                        # If within 100 meters and similar name, consider it a duplicate
                        if (db_distance is not None and db_distance < 0.1 and 
                            self._name_similarity(google_station.get('name', ''), db_station.get('name', '')) > 0.7):
                            is_duplicate = True
                            # Update database station with Google data
                            db_station.update({
                                'google_place_id': google_station.get('google_place_id'),
                                'rating': google_station.get('rating', db_station.get('google_rating')),
                                'is_open': google_station.get('is_open'),
                                'photos': google_station.get('photos', [])
                            })
                            break
                
                if not is_duplicate:
                    # Add new station from Google with intelligent defaults
                    distance = self._calculate_distance(lat, lng, google_lat, google_lng)
                    if distance is not None:
                        google_station['distance'] = round(distance, 2)
                        google_station['source'] = 'google_places'
                        
                        # Add intelligent defaults for missing amenities
                        google_station.update(self._add_intelligent_defaults(google_station))
                        
                        result.append(google_station)
        
        return result

    def _enhance_with_prices(self, stations: List[Dict]) -> List[Dict]:
       return self.price_methods._enhance_with_prices_implementation(stations)
    
    def _format_for_frontend(self, stations: List[Dict]) -> List[Dict]:
        """Format station data to match frontend expectations"""
        formatted_stations = []
        
        for station in stations:
            # Safe coordinate conversion
            try:
                lat = float(station.get('latitude', 0)) if station.get('latitude') is not None else 0.0
                lng = float(station.get('longitude', 0)) if station.get('longitude') is not None else 0.0
            except (ValueError, TypeError):
                lat, lng = 0.0, 0.0
            
            # Safe distance conversion
            try:
                distance = float(station.get('distance', 0)) if station.get('distance') is not None else 0.0
            except (ValueError, TypeError):
                distance = 0.0
            
            # Safe rating conversion
            rating = station.get('rating') or station.get('google_rating')
            if rating is not None:
                try:
                    rating = float(rating)
                except (ValueError, TypeError):
                    rating = None
            
            # Create frontend-compatible format
            formatted_station = {
                'id': station.get('id') or station.get('google_place_id'),
                'name': station.get('name', 'Unknown Station'),
                'address': station.get('address', ''),
                'distance': distance,
                'rating': rating,
                'coordinates': {
                    'lat': lat,
                    'lng': lng
                },
                
                # Fuel prices (extracted from current_prices)
                'regularPrice': station.get('regular_price'),
                'premiumPrice': station.get('premium_price'),
                'dieselPrice': station.get('diesel_price'),
                
                # Operating status
                'isOpen': self._calculate_is_open(station),
                
                # Amenities with safe boolean conversion
                'hasATM': bool(station.get('has_atm', False)),
                'hasShop': bool(station.get('has_shop', False)),
                'hasCoffee': bool(station.get('has_coffee', False)),
                'hasEVCharging': bool(station.get('has_ev_charging', False)),
                
                # Traffic and wait info with safe conversion
                'busyLevel': station.get('busy_level', 'low'),
                'waitTime': int(station.get('wait_time', 0)) if station.get('wait_time') is not None else 0,
                
                # Additional metadata
                'source': station.get('source', 'unknown'),
                'has_price_data': bool(station.get('has_price_data', False)),
                'reliability_score': float(station.get('reliability_score', 0.5)) if station.get('reliability_score') is not None else 0.5,
                'photos': station.get('photos', []),
            }
            
            formatted_stations.append(formatted_station)
        
        return formatted_stations
    
    def _extract_individual_prices(self, prices: List[Dict]) -> Dict:
        """Extract individual fuel prices from prices array"""
        price_map = {
            'regular_price': None,
            'premium_price': None,
            'diesel_price': None,
        }
        
        for price_data in prices:
            fuel_type = price_data.get('fuel_type', '').lower()
            price_value = price_data.get('price')
            
            if fuel_type == 'regular' or fuel_type == 'petrol':
                price_map['regular_price'] = price_value
            elif fuel_type == 'premium' or fuel_type == 'premium_petrol':
                price_map['premium_price'] = price_value
            elif fuel_type == 'diesel':
                price_map['diesel_price'] = price_value
        
        return price_map
    
    def _calculate_is_open(self, station_data: Dict) -> bool:
        """Calculate if station is currently open"""
        # If we have real-time data from Google Places
        if 'is_open' in station_data:
            return station_data['is_open']
        
        # If it's 24/7
        if station_data.get('is_24h'):
            return True
        
        # Try to calculate from opening_hours JSON
        opening_hours = station_data.get('opening_hours')
        if opening_hours and isinstance(opening_hours, dict):
            return self._is_open_from_hours(opening_hours)
        
        # Default assumption (most stations are open during day)
        from datetime import datetime
        current_hour = datetime.now().hour
        return 6 <= current_hour <= 22  # Assume open 6am-10pm if no data
    
    def _is_open_from_hours(self, opening_hours: Dict) -> bool:
        """Check if station is open based on opening hours JSON"""
        try:
            from datetime import datetime
            now = datetime.now()
            current_day = now.strftime('%A').lower()
            current_time = now.strftime('%H:%M')
            
            day_hours = opening_hours.get(current_day)
            if not day_hours:
                return False
            
            if day_hours == '24h' or day_hours == 'open':
                return True
            
            # Parse hours like "06:00-22:00"
            if '-' in day_hours:
                open_time, close_time = day_hours.split('-')
                return open_time <= current_time <= close_time
            
        except Exception as e:
            logger.error(f"Error parsing opening hours: {e}")
        
        return True  # Default to open if can't parse
    
    def _add_intelligent_defaults(self, google_station: Dict) -> Dict:
        """Add intelligent defaults for Google Places stations based on name/type"""
        defaults = {
            'has_atm': False,
            'has_shop': False,
            'has_coffee': False,
            'has_ev_charging': False,
            'busy_level': 'medium',
            'wait_time': 3,  # Default 3 minutes
            'is_24h': False,
        }
        
        station_name = google_station.get('name', '').lower()
        
        # Brand-based intelligence
        if any(brand in station_name for brand in ['shell', 'bp', 'total', 'engen']):
            defaults.update({
                'has_atm': True,
                'has_shop': True,
                'has_coffee': True,
            })
        
        # Rating-based intelligence
        rating = google_station.get('rating', 0)
        # Handle None rating safely
        if rating is not None and rating >= 4.0:
            defaults['has_atm'] = True
            defaults['has_shop'] = True
            defaults['wait_time'] = 2  # Better stations = faster service
        elif rating is not None and rating >= 3.5:
            defaults['wait_time'] = 3
        else:
            defaults['wait_time'] = 5
        
        # Price level based intelligence (Google Places price_level 0-4)
        price_level = google_station.get('price_level')
        # Handle None price_level safely
        if price_level is not None and price_level >= 3:  # More expensive = better amenities
            defaults.update({
                'has_coffee': True,
                'has_shop': True,
                'has_ev_charging': True,
            })
        
        return defaults
    
    def _get_prices_for_google_station(self, station_data: Dict) -> List[Dict]:
        """Try to get prices for Google Places stations"""
        # This is a placeholder - you might want to implement:
        # 1. Price lookup by location
        # 2. Price estimation based on area averages
        # 3. Integration with fuel price APIs
        
        # For now, return empty array (no price data available)
        return []
    
    def _calculate_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Calculate distance using Haversine formula"""
        import math
        
        R = 6371  # Earth radius in km
        dlat = math.radians(lat2 - lat1)
        dlng = math.radians(lng2 - lng1)
        a = (math.sin(dlat/2) * math.sin(dlat/2) + 
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dlng/2) * math.sin(dlng/2))
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        return R * c
    
    def _name_similarity(self, name1: str, name2: str) -> float:
        """Calculate similarity between two station names"""
        from difflib import SequenceMatcher
        return SequenceMatcher(None, name1.lower(), name2.lower()).ratio()
    
    def _calculate_reliability_score(self, station_data: Dict, prices: List[Dict]) -> float:
        """Calculate reliability score based on data freshness and source quality"""
        score = 0.5  # Base score
        
        # Boost for database stations (verified)
        if station_data.get('source') == 'database':
            score += 0.2
        
        # Boost for Google Places data
        if station_data.get('google_place_id'):
            score += 0.15
        
        # Boost for having price data
        if prices:
            avg_price_reliability = sum(p.get('reliability_score', 0.5) for p in prices) / len(prices)
            score += avg_price_reliability * 0.3
        
        # Boost for having rating
        if station_data.get('rating') or station_data.get('google_rating'):
            score += 0.1
        
        return min(1.0, score)
    
    @action(detail=False, methods=['post'])
    def sync_google_places(self, request):
        """Admin endpoint to sync stations with Google Places"""
        try:
            bounds = request.data.get('bounds')  # {'north': lat, 'south': lat, 'east': lng, 'west': lng}
            
            if not bounds:
                return Response({"error": "Bounds required"}, status=400)
            
            # Sync stations in the specified area
            synced_count = self._sync_area_with_google(bounds)
            
            return Response({
                "message": f"Successfully synced {synced_count} stations",
                "synced_count": synced_count
            })
            
        except Exception as e:
            logger.error(f"Error syncing with Google Places: {e}")
            return Response({"error": str(e)}, status=500)
    
    def _sync_area_with_google(self, bounds: Dict) -> int:
        """Sync a geographic area with Google Places data"""
        synced_count = 0
        
        # Create a grid of points to search
        lat_step = 0.05  # ~5.5km
        lng_step = 0.05
        
        lat = bounds['south']
        while lat <= bounds['north']:
            lng = bounds['west']
            while lng <= bounds['east']:
                try:
                    stations = self.places_service.find_nearby_stations(lat, lng, 10000)
                    
                    for station_data in stations:
                        synced_count += self._create_or_update_station(station_data)
                    
                    time.sleep(1)  # Rate limiting
                    
                except Exception as e:
                    logger.error(f"Error syncing area {lat},{lng}: {e}")
                    continue
                
                lng += lng_step
            lat += lat_step
        
        return synced_count
    
    def _get_official_price_baselines(self) -> Dict:
        """Get the latest official fuel prices for South Africa"""
        # This would scrape or read from a stored official price file
        return {
            '93_unleaded': 23.96,  # Inland price
            '95_unleaded': 24.30,
            'diesel_0.05': 21.20,
            'diesel_0.005': 21.35,
            'last_updated': datetime.date(2024, 6, 5)
        }

    def _calculate_regional_adjustments(self, stations: List[Dict]) -> Dict:
        """Calculate regional price differences (coastal vs inland)"""
        adjustments = defaultdict(float)
        
        # Group stations by region
        coastal_stations = [s for s in stations if self._is_coastal(s)]
        inland_stations = [s for s in stations if not self._is_coastal(s)]
        
        # Calculate average differences
        if coastal_stations and inland_stations:
            for fuel_type in ['93_unleaded', '95_unleaded', 'diesel']:
                coastal_avg = np.mean([s.get(fuel_type, 0) for s in coastal_stations])
                inland_avg = np.mean([s.get(fuel_type, 0) for s in inland_stations])
                adjustments[fuel_type] = inland_avg - coastal_avg
        
        return adjustments

    def _get_db_station_prices(self, station_data: Dict, official_prices: Dict) -> List[Dict]:
        """Get precise prices for database stations"""
        station = PetrolStation.objects.get(id=station_data['id'])
        
        # Try to get recent user-reported prices first
        user_prices = FuelPrice.objects.filter(
            station=station,
            reported_at__gte=timezone.now() - timedelta(hours=6)
        ).order_by('-reported_at')
        
        if user_prices.exists():
            return self._format_price_objects(user_prices)
        
        # Fallback to station-specific adjustments
        return [{
            'fuel_type': '93_unleaded',
            'price': official_prices['93_unleaded'] * station.price_adjustment,
            'source': 'station_profile',
            'confidence': 0.7
        }, {
            'fuel_type': '95_unleaded',
            'price': official_prices['95_unleaded'] * station.price_adjustment,
            'source': 'station_profile',
            'confidence': 0.7
        }]

    def _estimate_prices_for_station(self, station_data: Dict, 
                                official_prices: Dict,
                                regional_adjustments: Dict) -> List[Dict]:
        """Estimate prices for non-database stations"""
        base_prices = official_prices.copy()
        
        # Adjust for coastal regions
        if self._is_coastal(station_data):
            for fuel_type, adjustment in regional_adjustments.items():
                base_prices[fuel_type] -= adjustment
        
        # Brand-based adjustments
        brand = station_data.get('brand', '').lower()
        if 'shell' in brand:
            base_prices = {k: v * 1.02 for k, v in base_prices.items()}  # 2% premium
        elif 'engen' in brand:
            base_prices = {k: v * 1.01 for k, v in base_prices.items()}
        
        return [{
            'fuel_type': k,
            'price': round(v, 2),
            'source': 'estimated',
            'confidence': 0.6
        } for k, v in base_prices.items()]

    def _extract_individual_prices(self, prices: List[Dict]) -> Dict:
        """Extract simplified price fields"""
        result = {
            'regular_price': None,
            'premium_price': None,
            'diesel_price': None
        }
        
        for price in prices:
            if price['fuel_type'] in ['93_unleaded', 'regular']:
                result['regular_price'] = price['price']
            elif price['fuel_type'] in ['95_unleaded', 'premium']:
                result['premium_price'] = price['price']
            elif 'diesel' in price['fuel_type']:
                result['diesel_price'] = price['price']
        
        return result

    def _create_fallback_prices(self, station_data: Dict) -> Dict:
        """Create station data with fallback prices"""
        station_data.update({
            'current_prices': [],
            'has_price_data': False,
            'reliability_score': 0.3,
            'regular_price': None,
            'premium_price': None,
            'diesel_price': None
        })
        return station_data

    def _is_coastal(self, station_data: Dict) -> bool:
        """Determine if station is in coastal region"""
        coastal_cities = ['cape town', 'durban', 'port elizabeth', 'east london']
        return any(city in station_data.get('city', '').lower() 
                for city in coastal_cities)
    
    def _create_or_update_station(self, google_data: Dict) -> int:
        """Create or update a station from Google Places data"""
        try:
            with transaction.atomic():
                defaults = {
                    'name': google_data.get('name', 'Unknown Station'),
                    'address': google_data.get('address', ''),
                    'latitude': google_data.get('latitude'),
                    'longitude': google_data.get('longitude'),
                    'google_place_id': google_data.get('google_place_id'),
                    'is_active': True
                }
                
                # Try to find existing station by Google Place ID or location
                existing = None
                if google_data.get('google_place_id'):
                    existing = PetrolStation.objects.filter(
                        google_place_id=google_data['google_place_id']
                    ).first()
                
                if not existing and google_data.get('latitude') and google_data.get('longitude'):
                    # Look for nearby stations (within 100m)
                    lat_range = 0.001  # ~111m
                    lng_range = 0.001
                    existing = PetrolStation.objects.filter(
                        latitude__range=(google_data['latitude'] - lat_range, google_data['latitude'] + lat_range),
                        longitude__range=(google_data['longitude'] - lng_range, google_data['longitude'] + lng_range)
                    ).first()
                
                if existing:
                    # Update existing station
                    for key, value in defaults.items():
                        if value is not None:
                            setattr(existing, key, value)
                    existing.save()
                    return 0  # Updated, not created
                else:
                    # Create new station
                    PetrolStation.objects.create(**defaults)
                    return 1  # Created
                    
        except Exception as e:
            logger.error(f"Error creating/updating station: {e}")
            return 0

class FuelTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = FuelType.objects.all()
    serializer_class = FuelTypeSerializer


class FuelPriceViewSet(viewsets.ModelViewSet):
    queryset = FuelPrice.objects.all().order_by('-reported_at')
    serializer_class = FuelPriceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ['station', 'fuel_type', 'is_verified']
    
    def perform_create(self, serializer):
        serializer.save(reported_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def latest_by_station(self, request):
        """Get latest prices for each fuel type at each station"""
        station_id = request.query_params.get('station_id')
        if not station_id:
            return Response(
                {"error": "station_id parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Get the latest price for each fuel type at this station
        latest_prices = []
        
        for fuel_type in FuelType.objects.all():
            latest_price = FuelPrice.objects.filter(
                station_id=station_id,
                fuel_type=fuel_type
            ).order_by('-reported_at').first()
            
            if latest_price:
                latest_prices.append(FuelPriceSerializer(latest_price).data)
                
        return Response(latest_prices)


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ['station', 'user', 'rating']
    
    def get_queryset(self):
        return Review.objects.all().order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class FavoriteViewSet(viewsets.ModelViewSet):
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class PriceAlertViewSet(viewsets.ModelViewSet):
    serializer_class = PriceAlertSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return PriceAlert.objects.filter(user=self.request.user, is_active=True)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class FuelTransactionViewSet(viewsets.ModelViewSet):
    serializer_class = FuelTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['vehicle', 'fuel_type']
    
    def get_queryset(self):
        return FuelTransaction.objects.filter(user=self.request.user).order_by('-transaction_date')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get fuel consumption statistics"""
        vehicle_id = request.query_params.get('vehicle_id')
        if not vehicle_id:
            return Response(
                {"error": "vehicle_id parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        transactions = FuelTransaction.objects.filter(
            user=request.user,
            vehicle_id=vehicle_id
        ).order_by('transaction_date')
        
        if not transactions:
            return Response({"error": "No transactions found for this vehicle"})
        
        # Calculate monthly totals
        monthly_data = {}
        for transaction in transactions:
            month_key = transaction.transaction_date.strftime('%Y-%m')
            
            if month_key not in monthly_data:
                monthly_data[month_key] = {
                    'month': month_key,
                    'total_quantity': 0,
                    'total_amount': 0,
                    'avg_price': 0
                }
            
            monthly_data[month_key]['total_quantity'] += float(transaction.quantity)
            monthly_data[month_key]['total_amount'] += float(transaction.total_amount)
        
        # Calculate average prices
        for month, data in monthly_data.items():
            if data['total_quantity'] > 0:
                data['avg_price'] = round(data['total_amount'] / data['total_quantity'], 2)
                
        return Response({
            'monthly_data': list(monthly_data.values()),
            'total_transactions': transactions.count(),
            'total_spent': sum(float(t.total_amount) for t in transactions),
            'total_liters': sum(float(t.quantity) for t in transactions),
        })


class TripPlanViewSet(viewsets.ModelViewSet):
    serializer_class = TripPlanSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return TripPlan.objects.filter(user=self.request.user).order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def calculate_stops(self, request, pk=None):
        """Calculate optimal refueling stops for a trip"""
        trip_plan = self.get_object()
        vehicle = trip_plan.vehicle
        
        # This is a placeholder implementation - in a real app, you'd have
        # a more sophisticated algorithm that considers:
        # - Current fuel level
        # - Vehicle range
        # - Gas station locations along the route
        # - Price differences between stations
        # - User preferences
        
        # For now, we'll create a simple implementation assuming stops every 200km
        total_distance = float(trip_plan.total_distance)
        tank_capacity = float(vehicle.tank_capacity)
        avg_consumption = float(vehicle.avg_consumption)
        
        # Vehicle range in km per tank
        range_per_tank = (tank_capacity / avg_consumption) * 100
        
        # Delete existing stops for this trip
        RefuelStop.objects.filter(trip_plan=trip_plan).delete()
        
        # Calculate number of stops needed
        num_stops = math.ceil(total_distance / (range_per_tank * 0.8))  # Using 80% of max range
        
        if num_stops <= 0:
            return Response({"message": "No refueling stops needed for this trip"})
        
        # Calculate distance between stops
        distance_between_stops = total_distance / (num_stops + 1)
        
        created_stops = []
        
        # For each stop, find the nearest station
        for i in range(1, num_stops + 1):
            distance_from_start = i * distance_between_stops
            
            # Simple implementation: calculate a point along the straight line
            # between start and destination
            start_lat = float(trip_plan.start_latitude)
            start_lng = float(trip_plan.start_longitude)
            dest_lat = float(trip_plan.destination_latitude)
            dest_lng = float(trip_plan.destination_longitude)
            
            # Linear interpolation
            ratio = distance_from_start / total_distance
            point_lat = start_lat + ratio * (dest_lat - start_lat)
            point_lng = start_lng + ratio * (dest_lng - start_lng)
            
            # Find nearest station to this point (within 5km)
            # In a real app, this would use a route-based approach rather than straight line
            stations = PetrolStation.objects.filter(
                is_active=True,
                latitude__range=(point_lat - 0.045, point_lat + 0.045),
                longitude__range=(point_lng - 0.045, point_lng + 0.045)
            )
            
            nearest_station = None
            min_distance = float('inf')
            
            for station in stations:
                # Calculate distance from station to point using Haversine
                R = 6371  # Earth radius in km
                dlat = math.radians(float(station.latitude) - point_lat)
                dlng = math.radians(float(station.longitude) - point_lng)
                a = (math.sin(dlat/2) * math.sin(dlat/2) + 
                     math.cos(math.radians(point_lat)) * math.cos(math.radians(float(station.latitude))) *
                     math.sin(dlng/2) * math.sin(dlng/2))
                c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
                distance = R * c
                
                if distance < min_distance:
                    min_distance = distance
                    nearest_station = station
            
            # If no station found within radius, create a note but continue
            if not nearest_station:
                continue
            
            # Calculate estimated fuel level on arrival
            # Assuming linear fuel consumption for simplicity
            fuel_used = (distance_from_start / 100) * avg_consumption
            remaining_fuel = tank_capacity - (fuel_used % tank_capacity)
            
            # Create the refuel stop
            refuel_stop = RefuelStop.objects.create(
                trip_plan=trip_plan,
                station=nearest_station,
                distance_from_start=distance_from_start,
                estimated_fuel_level=remaining_fuel,
                order=i
            )
            
            created_stops.append(RefuelStopSerializer(refuel_stop).data)
        
        return Response({
            "message": f"Created {len(created_stops)} refueling stops",
            "stops": created_stops
        })


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({"status": "notification marked as read"})
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"status": "all notifications marked as read"})


class PromotionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PromotionCampaign.objects.filter(
        is_active=True,
        start_date__lte=timezone.now(),
        end_date__gte=timezone.now()
    )
    serializer_class = PromotionCampaignSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['company']


class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get dashboard summary data"""
        user = request.user
        
        # Get user vehicles
        vehicles = Vehicle.objects.filter(user=user)
        
        # Get favorite stations
        favorites = Favorite.objects.filter(user=user).select_related('station')
        
        # Get recent transactions
        recent_transactions = FuelTransaction.objects.filter(
            user=user
        ).order_by('-transaction_date')[:5]
        
        # Get recent price alerts
        active_alerts = PriceAlert.objects.filter(user=user, is_active=True).count()
        
        # Get unread notifications
        unread_notifications = Notification.objects.filter(
            user=user, is_read=False
        ).count()
        
        # Calculate fuel spending this month
        today = timezone.now()
        month_start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        month_spending = FuelTransaction.objects.filter(
            user=user,
            transaction_date__gte=month_start
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        return Response({
            "vehicles_count": vehicles.count(),
            "favorites_count": favorites.count(),
            "recent_transactions": FuelTransactionSerializer(recent_transactions, many=True).data,
            "active_alerts": active_alerts,
            "unread_notifications": unread_notifications,
            "month_spending": month_spending
        })
    
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
    
    #WEB SCRAPPING

    logger = logging.getLogger(__name__)

class FuelPriceEnhancer:
    """Enhanced fuel price service with web scraping and intelligent fallbacks"""
    
    def __init__(self):
        self.cache_timeout = 3600  # 1 hour cache
        self.price_sources = [
            'https://www.fuelprices.co.za/',
            'https://www.aa.co.za/fuel-price',
            'https://www.automobil.co.za/fuel-prices/',
        ]
        
        # Base prices for South Africa (updated monthly by government)
        self.sa_base_prices = {
            'petrol_93': 23.50,  # R per liter
            'petrol_95': 24.20,
            'diesel_0005': 22.80,
            'diesel_005': 22.90,
        }
    
    def get_current_fuel_prices(self, location: Dict = None) -> Dict:
        """Get current fuel prices with multiple sources and caching"""
        cache_key = f"fuel_prices_{location.get('province', 'national') if location else 'national'}"
        
        # Try cache first
        cached_prices = cache.get(cache_key)
        if cached_prices:
            logger.info("Returning cached fuel prices")
            return cached_prices
        
        # Try web scraping
        scraped_prices = self._scrape_fuel_prices()
        if scraped_prices:
            cache.set(cache_key, scraped_prices, self.cache_timeout)
            return scraped_prices
        
        # Fallback to base prices with regional adjustments
        fallback_prices = self._get_fallback_prices(location)
        cache.set(cache_key, fallback_prices, 1800)  # Cache for 30 minutes
        return fallback_prices
    
    def _scrape_fuel_prices(self) -> Optional[Dict]:
        """Scrape fuel prices from South African websites"""
        for source_url in self.price_sources:
            try:
                logger.info(f"Scraping fuel prices from {source_url}")
                
                if 'fuelprices.co.za' in source_url:
                    prices = self._scrape_fuelprices_co_za()
                elif 'aa.co.za' in source_url:
                    prices = self._scrape_aa_co_za()
                elif 'automobil.co.za' in source_url:
                    prices = self._scrape_automobil_co_za()
                else:
                    continue
                
                if prices and self._validate_prices(prices):
                    logger.info(f"Successfully scraped prices from {source_url}")
                    return prices
                    
            except Exception as e:
                logger.error(f"Error scraping {source_url}: {str(e)}")
                continue
        
        logger.warning("All scraping attempts failed")
        return None
    
    def _scrape_fuelprices_co_za(self) -> Optional[Dict]:
        """Scrape from fuelprices.co.za"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = requests.get('https://www.fuelprices.co.za/', headers=headers, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            prices = {}
            
            # Look for price tables or divs
            price_elements = soup.find_all(['div', 'td', 'span'], class_=re.compile(r'price|fuel', re.I))
            
            for element in price_elements:
                text = element.get_text().strip()
                
                # Extract prices using regex
                price_match = re.search(r'R?(\d+\.?\d*)', text)
                if price_match:
                    price = float(price_match.group(1))
                    
                    if 'petrol' in text.lower() or '93' in text:
                        prices['regular'] = price
                    elif '95' in text or 'premium' in text.lower():
                        prices['premium'] = price
                    elif 'diesel' in text.lower():
                        prices['diesel'] = price
            
            return self._format_prices(prices) if prices else None
            
        except Exception as e:
            logger.error(f"Error scraping fuelprices.co.za: {str(e)}")
            return None
    
    def _scrape_aa_co_za(self) -> Optional[Dict]:
        """Scrape from AA South Africa"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = requests.get('https://www.aa.co.za/fuel-price', headers=headers, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            prices = {}
            
            # Look for fuel price sections
            fuel_sections = soup.find_all(['div', 'table'], class_=re.compile(r'fuel|price', re.I))
            
            for section in fuel_sections:
                text = section.get_text()
                
                # Extract petrol prices
                petrol_match = re.search(r'Petrol.*?R(\d+\.?\d*)', text, re.I)
                if petrol_match:
                    prices['regular'] = float(petrol_match.group(1))
                
                # Extract diesel prices
                diesel_match = re.search(r'Diesel.*?R(\d+\.?\d*)', text, re.I)
                if diesel_match:
                    prices['diesel'] = float(diesel_match.group(1))
            
            return self._format_prices(prices) if prices else None
            
        except Exception as e:
            logger.error(f"Error scraping AA: {str(e)}")
            return None
    
    def _scrape_automobil_co_za(self) -> Optional[Dict]:
        """Scrape from automobil.co.za"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = requests.get('https://www.automobil.co.za/fuel-prices/', headers=headers, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            prices = {}
            
            # Look for price tables
            tables = soup.find_all('table')
            for table in tables:
                rows = table.find_all('tr')
                for row in rows:
                    cells = row.find_all(['td', 'th'])
                    if len(cells) >= 2:
                        fuel_type = cells[0].get_text().strip().lower()
                        price_text = cells[1].get_text().strip()
                        
                        price_match = re.search(r'R?(\d+\.?\d*)', price_text)
                        if price_match:
                            price = float(price_match.group(1))
                            
                            if 'petrol' in fuel_type or '93' in fuel_type:
                                prices['regular'] = price
                            elif '95' in fuel_type or 'premium' in fuel_type:
                                prices['premium'] = price
                            elif 'diesel' in fuel_type:
                                prices['diesel'] = price
            
            return self._format_prices(prices) if prices else None
            
        except Exception as e:
            logger.error(f"Error scraping automobil.co.za: {str(e)}")
            return None
    
    def _format_prices(self, raw_prices: Dict) -> Dict:
        """Format scraped prices into standard structure"""
        return {
            'regular': raw_prices.get('regular', self.sa_base_prices['petrol_93']),
            'premium': raw_prices.get('premium', self.sa_base_prices['petrol_95']),
            'diesel': raw_prices.get('diesel', self.sa_base_prices['diesel_0005']),
            'last_updated': datetime.now().isoformat(),
            'source': 'scraped'
        }
    
    def _validate_prices(self, prices: Dict) -> bool:
        """Validate that scraped prices are reasonable"""
        if not prices:
            return False
        
        # Check if prices are within reasonable range for SA (R15-R35 per liter)
        for fuel_type, price in prices.items():
            if fuel_type in ['regular', 'premium', 'diesel']:
                if not isinstance(price, (int, float)) or price < 15 or price > 35:
                    logger.warning(f"Invalid price for {fuel_type}: {price}")
                    return False
        
        return True
    
    def _get_fallback_prices(self, location: Dict = None) -> Dict:
        """Get fallback prices based on base prices and regional adjustments"""
        base_prices = self.sa_base_prices.copy()
        
        # Apply regional adjustments
        if location:
            province = location.get('province', '').lower()
            city = location.get('city', '').lower()
            
            # Regional price adjustments (cents per liter)
            regional_adjustments = {
                'western cape': {'regular': -0.10, 'premium': -0.10, 'diesel': -0.05},
                'gauteng': {'regular': 0.05, 'premium': 0.05, 'diesel': 0.03},
                'kwazulu-natal': {'regular': 0.02, 'premium': 0.02, 'diesel': 0.01},
                'eastern cape': {'regular': 0.08, 'premium': 0.08, 'diesel': 0.05},
                'northern cape': {'regular': 0.15, 'premium': 0.15, 'diesel': 0.10},
                'free state': {'regular': 0.03, 'premium': 0.03, 'diesel': 0.02},
                'mpumalanga': {'regular': 0.05, 'premium': 0.05, 'diesel': 0.03},
                'limpopo': {'regular': 0.12, 'premium': 0.12, 'diesel': 0.08},
                'north west': {'regular': 0.07, 'premium': 0.07, 'diesel': 0.04},
            }
            
            adjustment = regional_adjustments.get(province, {'regular': 0, 'premium': 0, 'diesel': 0})
            
            return {
                'regular': base_prices['petrol_93'] + adjustment['regular'],
                'premium': base_prices['petrol_95'] + adjustment['premium'],
                'diesel': base_prices['diesel_0005'] + adjustment['diesel'],
                'last_updated': datetime.now().isoformat(),
                'source': 'fallback_regional'
            }
        
        return {
            'regular': base_prices['petrol_93'],
            'premium': base_prices['petrol_95'],
            'diesel': base_prices['diesel_0005'],
            'last_updated': datetime.now().isoformat(),
            'source': 'fallback_base'
        }


# Enhanced methods for your PetrolStationViewSet class
class PetrolStationEnhancedMethods:
    """Enhanced methods to be integrated into your PetrolStationViewSet"""
    
    def __init__(self):
        self.price_enhancer = FuelPriceEnhancer()
    
    def _get_official_price_baselines(self) -> Dict:
        """Get official fuel price baselines"""
        return self.price_enhancer.get_current_fuel_prices()
    
    def _calculate_regional_adjustments(self, stations: List[Dict]) -> Dict:
        """Calculate regional price adjustments based on station locations"""
        regional_data = {}
        
        for station in stations:
            try:
                # Extract location info from address or coordinates
                address = station.get('address', '').lower()
                
                # Determine province/region from address
                province = self._extract_province_from_address(address)
                if province:
                    if province not in regional_data:
                        regional_data[province] = []
                    regional_data[province].append(station)
            except Exception as e:
                logger.error(f"Error processing station for regional adjustment: {e}")
                continue
        
        return regional_data
    
    def _enhance_with_prices_implementation(self, stations: List[Dict]) -> List[Dict]:
        """Enhanced price logic with web scraping and intelligent fallbacks"""
        enhanced = []
        
        try:
            # 1. Get official price baselines
            official_prices = self._get_official_price_baselines()
            
            # 2. Get regional price adjustments
            regional_adjustments = self._calculate_regional_adjustments(stations)
            
            for station_data in stations:
                try:
                    prices = []
                    
                    # Database stations get precise pricing
                    if station_data.get('source') == 'database' and station_data.get('id'):
                        prices = self._get_db_station_prices(station_data, official_prices)
                    
                    # Google/other stations get estimated pricing
                    else:
                        prices = self._estimate_prices_for_station(station_data, official_prices, regional_adjustments)
                    
                    # Enhance station data
                    station_data.update({
                        'current_prices': prices,
                        'has_price_data': len(prices) > 0,
                        'reliability_score': self._calculate_reliability_score(station_data, prices)
                    })
                    
                    # Add individual price fields
                    station_data.update(self._extract_individual_prices(prices))
                    
                    enhanced.append(station_data)
                    
                except Exception as e:
                    logger.error(f"Price enhancement error for station {station_data.get('id')}: {str(e)}")
                    enhanced.append(self._create_fallback_prices(station_data))
            
            return enhanced
            
        except Exception as e:
            logger.error(f"Critical error in _enhance_with_prices: {str(e)}")
            # Return stations with fallback prices
            return [self._create_fallback_prices(station) for station in stations]
        
    def _extract_individual_prices(self, prices: List[Dict]) -> Dict:
        """Extract individual fuel prices from prices array"""
        price_map = {
            'regular_price': None,
            'premium_price': None,
            'diesel_price': None,
        }
        
        for price_data in prices:
            fuel_type = price_data.get('fuel_type', '').lower()
            price_value = price_data.get('price')
            
            if fuel_type == 'regular' or fuel_type == 'petrol':
                price_map['regular_price'] = price_value
            elif fuel_type == 'premium' or fuel_type == 'premium_petrol':
                price_map['premium_price'] = price_value
            elif fuel_type == 'diesel':
                price_map['diesel_price'] = price_value
        
        return price_map
    
    def _calculate_reliability_score(self, station_data: Dict, prices: List[Dict]) -> float:
        """Calculate reliability score based on data freshness and source quality"""
        score = 0.5  # Base score
        
        # Boost for database stations (verified)
        if station_data.get('source') == 'database':
            score += 0.2
        
        # Boost for Google Places data
        if station_data.get('google_place_id'):
            score += 0.15
        
        # Boost for having price data
        if prices:
            avg_price_reliability = sum(p.get('reliability_score', 0.5) for p in prices) / len(prices)
            score += avg_price_reliability * 0.3
        
        # Boost for having rating
        if station_data.get('rating') or station_data.get('google_rating'):
            score += 0.1
        
        return min(1.0, score)
    
    def _extract_province_from_address(self, address: str) -> Optional[str]:
        """Extract province from address string"""
        province_keywords = {
            'western cape': ['cape town', 'stellenbosch', 'paarl', 'george', 'mossel bay'],
            'gauteng': ['johannesburg', 'pretoria', 'soweto', 'sandton', 'roodepoort'],
            'kwazulu-natal': ['durban', 'pietermaritzburg', 'newcastle', 'richards bay'],
            'eastern cape': ['port elizabeth', 'east london', 'grahamstown', 'uitenhage'],
            'free state': ['bloemfontein', 'welkom', 'kroonstad', 'bethlehem'],
            'northern cape': ['kimberley', 'upington', 'springbok', 'kathu'],
            'mpumalanga': ['nelspruit', 'witbank', 'secunda', 'middelburg'],
            'limpopo': ['polokwane', 'tzaneen', 'thohoyandou', 'mokopane'],
            'north west': ['mahikeng', 'potchefstroom', 'klerksdorp', 'mmabatho']
        }
        
        for province, cities in province_keywords.items():
            if any(city in address for city in cities):
                return province
        
        return None
    
    def _get_db_station_prices(self, station_data: Dict, official_prices: Dict) -> List[Dict]:
        """Get prices for database stations with recent price records"""
        try:
            station_id = station_data.get('id')
            if not station_id:
                return self._create_estimated_prices(official_prices, station_data)
            
            # Try to get recent price records from database
            from .models import FuelPrice  # Adjust import as needed
            recent_prices = FuelPrice.objects.filter(
                station_id=station_id,
                created_at__gte=datetime.now() - timedelta(days=7)
            ).order_by('-created_at')
            
            if recent_prices.exists():
                # Convert database prices to API format
                prices = []
                for price_record in recent_prices[:3]:  # Latest 3 records
                    prices.append({
                        'fuel_type': price_record.fuel_type,
                        'price': float(price_record.price),
                        'last_updated': price_record.created_at.isoformat(),
                        'reliability_score': 0.9,  # High reliability for DB data
                        'source': 'database'
                    })
                return prices
            else:
                # No recent data, return estimated prices
                return self._create_estimated_prices(official_prices, station_data)
                
        except Exception as e:
            logger.error(f"Error getting DB station prices: {e}")
            return self._create_estimated_prices(official_prices, station_data)
    
    def _estimate_prices_for_station(self, station_data: Dict, official_prices: Dict, regional_adjustments: Dict) -> List[Dict]:
        """Estimate prices for stations without database records"""
        try:
            base_prices = official_prices
            
            # Apply brand-based adjustments
            brand_adjustments = self._get_brand_price_adjustments(station_data.get('name', ''))
            
            # Apply location-based adjustments
            location_adjustments = self._get_location_price_adjustments(station_data)
            
            # Apply quality-based adjustments
            quality_adjustments = self._get_quality_price_adjustments(station_data)
            
            estimated_prices = []
            
            for fuel_type in ['regular', 'premium', 'diesel']:
                base_price = base_prices.get(fuel_type, 23.0)
                
                # Apply all adjustments
                final_price = base_price
                final_price += brand_adjustments.get(fuel_type, 0)
                final_price += location_adjustments.get(fuel_type, 0)
                final_price += quality_adjustments.get(fuel_type, 0)
                
                # Add some randomness for realism (±0.10)
                import random
                final_price += random.uniform(-0.10, 0.10)
                
                estimated_prices.append({
                    'fuel_type': fuel_type,
                    'price': round(final_price, 2),
                    'last_updated': datetime.now().isoformat(),
                    'reliability_score': 0.6,  # Medium reliability for estimates
                    'source': 'estimated'
                })
            
            return estimated_prices
            
        except Exception as e:
            logger.error(f"Error estimating prices: {e}")
            return self._create_fallback_prices_list(official_prices)
    
    def _get_brand_price_adjustments(self, station_name: str) -> Dict:
        """Get price adjustments based on fuel station brand"""
        name_lower = station_name.lower()
        
        brand_adjustments = {
            'shell': {'regular': 0.15, 'premium': 0.20, 'diesel': 0.10},
            'bp': {'regular': 0.12, 'premium': 0.18, 'diesel': 0.08},
            'total': {'regular': 0.10, 'premium': 0.15, 'diesel': 0.05},
            'engen': {'regular': 0.08, 'premium': 0.12, 'diesel': 0.03},
            'sasol': {'regular': 0.05, 'premium': 0.08, 'diesel': 0.02},
            'caltex': {'regular': 0.07, 'premium': 0.10, 'diesel': 0.04},
        }
        
        for brand, adjustments in brand_adjustments.items():
            if brand in name_lower:
                return adjustments
        
        # Default for unknown brands
        return {'regular': 0, 'premium': 0, 'diesel': 0}
    
    def _get_location_price_adjustments(self, station_data: Dict) -> Dict:
        """Get price adjustments based on location (highway, city center, etc.)"""
        address = station_data.get('address', '').lower()
        
        # Highway stations typically charge more
        if any(keyword in address for keyword in ['highway', 'n1', 'n2', 'n3', 'n4', 'freeway']):
            return {'regular': 0.20, 'premium': 0.25, 'diesel': 0.15}
        
        # City center stations
        if any(keyword in address for keyword in ['cbd', 'city', 'center', 'central']):
            return {'regular': 0.10, 'premium': 0.12, 'diesel': 0.08}
        
        # Township/rural areas might be cheaper
        if any(keyword in address for keyword in ['township', 'rural', 'village']):
            return {'regular': -0.05, 'premium': -0.08, 'diesel': -0.03}
        
        return {'regular': 0, 'premium': 0, 'diesel': 0}
    
    def _get_quality_price_adjustments(self, station_data: Dict) -> Dict:
        """Get price adjustments based on station quality/rating"""
        rating = station_data.get('rating') or station_data.get('google_rating')
        
        if rating is None:
            return {'regular': 0, 'premium': 0, 'diesel': 0}
        
        try:
            rating = float(rating)
            
            if rating >= 4.5:
                return {'regular': 0.08, 'premium': 0.10, 'diesel': 0.05}
            elif rating >= 4.0:
                return {'regular': 0.05, 'premium': 0.07, 'diesel': 0.03}
            elif rating >= 3.5:
                return {'regular': 0.02, 'premium': 0.03, 'diesel': 0.01}
            elif rating < 3.0:
                return {'regular': -0.03, 'premium': -0.05, 'diesel': -0.02}
            
        except (ValueError, TypeError):
            pass
        
        return {'regular': 0, 'premium': 0, 'diesel': 0}
    
    def _create_estimated_prices(self, official_prices: Dict, station_data: Dict) -> List[Dict]:
        """Create estimated prices based on official prices and station characteristics"""
        prices = []
        
        for fuel_type in ['regular', 'premium', 'diesel']:
            base_price = official_prices.get(fuel_type, 23.0)
            
            # Apply station-specific adjustments
            brand_adj = self._get_brand_price_adjustments(station_data.get('name', ''))
            location_adj = self._get_location_price_adjustments(station_data)
            quality_adj = self._get_quality_price_adjustments(station_data)
            
            final_price = base_price
            final_price += brand_adj.get(fuel_type, 0)
            final_price += location_adj.get(fuel_type, 0)
            final_price += quality_adj.get(fuel_type, 0)
            
            prices.append({
                'fuel_type': fuel_type,
                'price': round(final_price, 2),
                'last_updated': datetime.now().isoformat(),
                'reliability_score': 0.7,
                'source': 'estimated'
            })
        
        return prices
    
    def _create_fallback_prices_list(self, official_prices: Dict) -> List[Dict]:
        """Create fallback price list when all else fails"""
        return [
            {
                'fuel_type': 'regular',
                'price': official_prices.get('regular', 23.50),
                'last_updated': datetime.now().isoformat(),
                'reliability_score': 0.5,
                'source': 'fallback'
            },
            {
                'fuel_type': 'premium',
                'price': official_prices.get('premium', 24.20),
                'last_updated': datetime.now().isoformat(),
                'reliability_score': 0.5,
                'source': 'fallback'
            },
            {
                'fuel_type': 'diesel',
                'price': official_prices.get('diesel', 22.80),
                'last_updated': datetime.now().isoformat(),
                'reliability_score': 0.5,
                'source': 'fallback'
            }
        ]
    
    def _create_fallback_prices(self, station_data: Dict) -> Dict:
        """Create fallback station data when price enhancement fails"""
        station_data.update({
            'current_prices': self._create_fallback_prices_list(self.price_enhancer.sa_base_prices),
            'has_price_data': True,
            'reliability_score': 0.4,
            'regular_price': 23.50,
            'premium_price': 24.20,
            'diesel_price': 22.80
        })
        return station_data