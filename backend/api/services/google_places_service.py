import googlemaps
import requests
import time
from datetime import datetime, timedelta
from django.conf import settings
from django.core.cache import cache
from django.db import transaction
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

class GooglePlacesService:
    def __init__(self):
        self.gmaps = googlemaps.Client('AIzaSyBaAEWhPar9iLI0xkMjL3uIvJ81Z9y8FAA')
        self.session = requests.Session()
    
    def find_nearby_stations(self, lat: float, lng: float, radius: int = 25000) -> List[Dict]:
        """Find gas stations using Google Places API"""
        try:
            places_result = self.gmaps.places_nearby(
                location=(lat, lng),
                radius=radius,
                type='gas_station',
                language='en'
            )
            
            stations = []
            for place in places_result.get('results', []):
                if place.get('business_status') == 'OPERATIONAL':
                    stations.append(self._process_place_data(place))
            
            # Handle pagination
            while 'next_page_token' in places_result:
                time.sleep(2)  # Required delay for next_page_token
                places_result = self.gmaps.places_nearby(
                    page_token=places_result['next_page_token']
                )
                for place in places_result.get('results', []):
                    if place.get('business_status') == 'OPERATIONAL':
                        stations.append(self._process_place_data(place))
            
            return stations
        except Exception as e:
            logger.error(f"Error fetching places data: {e}")
            return []
    
    def get_place_details(self, place_id: str) -> Dict:
        """Get detailed information about a specific place"""
        try:
            fields = [
                'name', 'formatted_address', 'geometry', 'formatted_phone_number',
                'website', 'opening_hours', 'photos', 'rating', 'reviews',
                'business_status', 'price_level'
            ]
            
            result = self.gmaps.place(
                place_id=place_id,
                fields=fields,
                language='en'
            )
            return result.get('result', {})
        except Exception as e:
            logger.error(f"Error fetching place details for {place_id}: {e}")
            return {}
    
    def _process_place_data(self, place: Dict) -> Dict:
        """Process raw Google Places data into our format"""
        location = place.get('geometry', {}).get('location', {})
        
        return {
            'google_place_id': place.get('place_id'),
            'name': place.get('name', 'Unknown Station'),
            'address': place.get('vicinity', ''),
            'latitude': location.get('lat'),
            'longitude': location.get('lng'),
            'rating': place.get('rating'),
            'price_level': place.get('price_level'),
            'is_open': place.get('opening_hours', {}).get('open_now', False),
            'photos': [photo.get('photo_reference') for photo in place.get('photos', [])[:3]]
        }
