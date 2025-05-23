from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Sync gas station data with external sources'
    
    def add_arguments(self, parser):
        parser.add_argument('--source', choices=['google', 'prices', 'all'], default='all')
        parser.add_argument('--bounds', type=str, help='JSON bounds for area sync')
    
    def handle(self, *args, **options):
        if options['source'] in ['google', 'all']:
            self.stdout.write('Syncing with Google Places...')
            # Implement Google Places sync
        
        if options['source'] in ['prices', 'all']:
            self.stdout.write('Updating fuel prices...')
            # Implement price updates