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
    FuelPriceViewSet,
    TripViewSet
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
router.register(r'trips', views.TripViewSet, basename='trip')
router.register(r'profile', views.UserProfileViewSet, basename='profile')

urlpatterns = [
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('csrf-token/', views.get_csrf_token, name='csrf_token'),
    path('register/', views.register_user, name='register'),
    path('verify-otp/', views.verify_otp, name='verify_otp'),
    path('resend-otp/', views.resend_otp, name='resend_otp'),
    path('auth/login/', views.login_user, name='login_user'),
    path('auth/verify-login-otp/', views.verify_login_otp, name='verify_login_otp'),
    path('auth/resend-login-otp/', views.resend_login_otp, name='resend_login_otp'),
    path('auth/logout/', views.logout_user, name='logout_user'),
    path('logged_user/', views.check_auth_status, name='check_auth_status'),
    path('auth/status/', views.check_auth_status, name='check_auth_status'),
    path('auth/user-forgot-password/', views.user_forgot_password, name='forgot_password'),
    path('auth/verify-reset-otp/', views.verify_reset_otp),
    path('auth/reset-password/', views.reset_password, name='reset_user_password'),
    path('api/', include(router.urls)),
    path('api/v1/stations/nearby/',PetrolStationViewSet.as_view({'get': 'nearby_with_real_data'}),name='nearby-stations'),
    path('api/v1/stations/premium-search/',PetrolStationViewSet.as_view({'get': 'sync_google_places'}),name='premium-search'),
    path('notifications/', views.user_notifications, name='user_notifications'),
    path('favorites/toggle/', views.toggle_favorite, name='toggle_favorite'),
    path('favorites/', views.user_favorites, name='user_favorites'),
    path('history/', views.TripHistoryView.as_view(), name='trip_history'),
    path('upcoming/', views.UpcomingTripsView.as_view(), name='upcoming_trips'),
    path('stats/', views.trip_stats, name='trip_stats'),
    path('api/get-profile/', views.get_profile, name='get_profile'),
    path('api/user-update/', views.update_profile_data, name='update_profile'),
    path('api/profile/delete-picture/', views.delete_profile_picture, name='delete_profile_picture'),
    # Trip actions
    path('start/', views.start_trip, name='start_trip'),
    path('<uuid:trip_id>/complete/', views.complete_trip, name='complete_trip'),
    path('<uuid:trip_id>/cancel/', views.cancel_trip, name='cancel_trip'),
    path('user_favorites/', views.UserFavoriteStationsView.as_view(), name='user-favorites'),
]
