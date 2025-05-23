import requests
import time
from django.core.management.base import BaseCommand
from api.models import PetrolStation, FuelCompany
from django.contrib.gis.geos import Point

class Command(BaseCommand):
    help = 'Import petrol stations from OpenStreetMap using Overpass API'

    OVERPASS_URL = "http://overpass-api.de/api/interpreter"
    NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse"

    def add_arguments(self, parser):
        parser.add_argument('--lat', type=float, help='Latitude of center')
        parser.add_argument('--lng', type=float, help='Longitude of center')
        parser.add_argument('--radius', type=float, default=5000, help='Radius in meters')

    def handle(self, *args, **options):
        lat = options['lat']
        lng = options['lng']
        radius = options['radius']

        if not lat or not lng:
            self.stderr.write("Latitude and longitude are required.")
            return

        self.stdout.write(f"Querying OSM for petrol stations around ({lat}, {lng}) within {radius}m radius...")

        query = f"""
        [out:json][timeout:25];
        (
          node["amenity"="fuel"](around:{radius},{lat},{lng});
        );
        out body;
        >;
        out skel qt;
        """

        response = requests.post(self.OVERPASS_URL, data={"data": query})
        data = response.json()

        for element in data.get('elements', []):
            tags = element.get('tags', {})
            lat = element.get('lat')
            lon = element.get('lon')
            name = tags.get('name') or tags.get('brand') or 'Unnamed Station'

            address_data = self.reverse_geocode(lat, lon)

            company_name = tags.get('brand') or tags.get('operator') or "Unknown"
            company, _ = FuelCompany.objects.get_or_create(name=company_name)

            station, created = PetrolStation.objects.update_or_create(
                name=name,
                latitude=lat,
                longitude=lon,
                defaults={
                    'company': company,
                    'address': address_data.get('road', ''),
                    'city': address_data.get('city', ''),
                    'state': address_data.get('state', ''),
                    'postal_code': address_data.get('postcode', ''),
                    'country': address_data.get('country', ''),
                    'phone_number': tags.get('contact:phone', ''),
                    'website': tags.get('website', ''),
                    'opening_hours': {"raw": tags.get('opening_hours', '')},
                    'is_24h': tags.get('opening_hours', '') == "24/7",
                    'has_atm': tags.get('fuel:atm', '') == "yes",
                    'has_shop': tags.get('shop', '') == "yes" or tags.get('fuel:shop', '') == "yes",
                    'has_coffee': tags.get('fuel:coffee', '') == "yes",
                    'has_ev_charging': tags.get('fuel:electricity', '') == "yes",
                    'busy_level': 'low',
                    'wait_time': 0,
                    'is_active': True
                }
            )

            self.stdout.write(f"{'Created' if created else 'Updated'}: {station.name} at ({lat}, {lon})")
            time.sleep(1)  # Be kind to Nominatim

    def reverse_geocode(self, lat, lon):
        params = {
            'format': 'json',
            'lat': lat,
            'lon': lon,
            'zoom': 18,
            'addressdetails': 1,
        }
        headers = {'User-Agent': 'Django PetrolStation Importer'}
        try:
            res = requests.get(self.NOMINATIM_URL, params=params, headers=headers)
            return res.json().get('address', {})
        except:
            return {}
