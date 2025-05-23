from typing import List, Dict
import logging
import requests
from django.core.cache import cache  # Add this import if using Django's cache framework
from django.conf import settings  # Import Django settings
logger = logging.getLogger(__name__)

class FuelPriceService:
    """Service to fetch real fuel prices from multiple sources"""
    """Service to fetch real fuel prices from multiple sources"""
    
    def __init__(self):
        self.sources = [
            self._fetch_from_gasbuddy,
            self._fetch_from_aaa,
            self._fetch_from_government_api
        ]
    
    def get_station_prices(self, station) -> List[Dict]:
        """Get fuel prices for a specific station from multiple sources"""
        prices = []
        
        for source_func in self.sources:
            try:
                source_prices = source_func(station)
                if source_prices:
                    prices.extend(source_prices)
            except Exception as e:
                logger.error(f"Error fetching prices from {source_func.__name__}: {e}")
                continue
        
        return self._consolidate_prices(prices)
    
    def _fetch_from_gasbuddy(self, station) -> List[Dict]:
        """Fetch prices from GasBuddy API (if available)"""
        # Note: GasBuddy doesn't have a public API, this would require scraping
        # or partnership. This is a placeholder for the structure.
        cache_key = f"gasbuddy_prices_{station.id}"
        cached_prices = cache.get(cache_key)
        
        if cached_prices:
            return cached_prices
        
        # Implement web scraping or API call here
        # For now, return empty to avoid actual scraping
        return []
    
    def _fetch_from_aaa(self, station) -> List[Dict]:
        """Fetch average prices from AAA API"""
        try:
            # AAA provides regional average prices
            url = "https://gasprices.aaa.com/api/prices"
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                # Process AAA data and match to station location
                return self._process_aaa_data(data, station)
        except Exception as e:
            logger.error(f"Error fetching AAA prices: {e}")
            return []
    
    def _fetch_from_government_api(self, station) -> List[Dict]:
        """Fetch prices from government sources like EIA"""
        try:
            # U.S. Energy Information Administration API
            api_key = settings.EIA_API_KEY
            url = f"https://api.eia.gov/v2/petroleum/pri/gnd/data/"
            
            params = {
                'api_key': api_key,
                'frequency': 'weekly',
                'data[0]': 'value',
                'facets[product][]': 'EPM0',  # Regular gasoline
                'sort[0][column]': 'period',
                'sort[0][direction]': 'desc',
                'offset': 0,
                'length': 1
            }
            
            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200:
                return self._process_eia_data(response.json(), station)
        except Exception as e:
            logger.error(f"Error fetching EIA prices: {e}")
            return []
    
    def _consolidate_prices(self, prices: List[Dict]) -> List[Dict]:
        """Consolidate prices from multiple sources and calculate reliability score"""
        consolidated = {}
        
        for price_data in prices:
            fuel_type = price_data['fuel_type']
            if fuel_type not in consolidated:
                consolidated[fuel_type] = []
            consolidated[fuel_type].append(price_data)
        
        result = []
        for fuel_type, price_list in consolidated.items():
            if len(price_list) == 1:
                # Single source
                price_data = price_list[0]
                price_data['reliability_score'] = 0.6
            else:
                # Multiple sources - calculate weighted average
                total_weight = sum(p.get('source_weight', 1.0) for p in price_list)
                weighted_price = sum(p['price'] * p.get('source_weight', 1.0) for p in price_list) / total_weight
                
                price_data = {
                    'fuel_type': fuel_type,
                    'price': round(weighted_price, 3),
                    'sources': [p['source'] for p in price_list],
                    'reliability_score': min(0.95, 0.5 + (len(price_list) * 0.15))
                }
            
            result.append(price_data)
        
        return result