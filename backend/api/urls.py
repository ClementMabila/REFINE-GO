from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from . import views
from .views import (
    PetrolStationViewSet, 
    FuelTypeViewSet, 
    FuelPriceViewSet
)

router = DefaultRouter()
router.register(r'users', views.UserViewSet, basename='user')
router.register(r'vehicles', views.VehicleViewSet, basename='vehicle')
router.register(r'fuel-companies', views.FuelCompanyViewSet, basename='fuel-company')
router.register(r'petrol-stations', PetrolStationViewSet, basename='petrol-station')  # Using 'petrol-stations'
router.register(r'fuel-types', FuelTypeViewSet, basename='fuel-type')
router.register(r'fuel-prices', FuelPriceViewSet, basename='fuel-price')
router.register(r'reviews', views.ReviewViewSet, basename='review')
router.register(r'favorites', views.FavoriteViewSet, basename='favorite')
router.register(r'price-alerts', views.PriceAlertViewSet, basename='price-alert')
router.register(r'fuel-transactions', views.FuelTransactionViewSet, basename='fuel-transaction')
router.register(r'trip-plans', views.TripPlanViewSet, basename='trip-plan')
router.register(r'notifications', views.NotificationViewSet, basename='notification')
router.register(r'promotions', views.PromotionViewSet, basename='promotion')

urlpatterns = [
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', views.register_user),
    path('verify-otp/', views.verify_otp),
    path('login/', views.login_user, name='login_user'),
    path('login-verify-otp/', views.login_verify_otp, name='login_verify_otp'),
    path('api/', include(router.urls)),
    path(
        'api/v1/stations/nearby/',
        PetrolStationViewSet.as_view({'get': 'nearby_with_real_data'}),
        name='nearby-stations'
    ),
    path(
        'api/v1/stations/premium-search/',
        PetrolStationViewSet.as_view({'get': 'sync_google_places'}),
        name='premium-search'
    ),
]
