from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework import filters
from rest_framework import viewsets
from rest_framework import permissions
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import serializers
from rest_framework import generics
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.core.mail import send_mail
from django.contrib.auth import get_user_model, authenticate, login, logout
from django.contrib.auth.hashers import make_password
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
from django.db import transaction, IntegrityError
import math
from typing import List, Dict
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from django.middleware.csrf import get_token
from .models import (
    User, Vehicle, FuelCompany, PetrolStation, StationAmenity,
    FuelType, FuelPrice, StationTraffic, UserVisit, Review,
    ReviewImage, Favorite, PriceAlert, FuelTransaction,
    TripPlan, RefuelStop, StationReport, Notification,
    PromotionCampaign, StationPromotion, UserSubscription,
    UserProfile, Trip
)
from .serializers import (
    UserSerializer, VehicleSerializer, FuelCompanySerializer,
    PetrolStationListSerializer,
    StationAmenitySerializer, FuelTypeSerializer, FuelPriceSerializer,
    StationTrafficSerializer, ReviewSerializer, ReviewImageSerializer,
    FavoriteSerializer, PriceAlertSerializer, FuelTransactionSerializer,
    TripPlanSerializer, RefuelStopSerializer, StationReportSerializer,
    NotificationSerializer, PromotionCampaignSerializer,
    StationPromotionSerializer, UserSubscriptionSerializer,
    UserProfileSerializer, TripSerializer, FavoriteStationSerializer, ProfileSerializer
)

import logging
import time
from collections import defaultdict
import numpy as np
import calendar

logger = logging.getLogger(__name__)

# Add this import or definition for GooglePlacesService
from .services.google_places_service import GooglePlacesService  # Make sure this path is correct and the service exists
from .services.fuel_price_service import FuelPriceService

User = get_user_model()

@api_view(['GET'])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def get_csrf_token(request):
    """
    Get CSRF token for frontend authentication
    """
    csrf_token = get_token(request)
    return JsonResponse({
        'csrfToken': csrf_token,
        'success': True
    })

from django.core.mail import EmailMultiAlternatives

def send_login_verification_email(email, otp):
    subject = 'RefineGo - Login Verification Code'

    html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{ 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; 
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); 
                    margin: 0; 
                    padding: 24px; 
                    line-height: 1.6;
                }}
                .container {{ 
                    max-width: 640px; 
                    margin: 0 auto; 
                    background: white; 
                    border-radius: 20px; 
                    overflow: hidden; 
                    box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08);
                    border: 1px solid rgba(0,0,0,0.06);
                }}
                .header {{ 
                    background: linear-gradient(135deg, #2edda2 0%, #22c55e 50%, #16a34a 100%); 
                    padding: 48px 40px 40px; 
                    text-align: center; 
                    position: relative;
                    overflow: hidden;
                }}
                .header::before {{
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
                    animation: shimmer 3s ease-in-out infinite;
                }}
                @keyframes shimmer {{
                    0%, 100% {{ opacity: 0; }}
                    50% {{ opacity: 1; }}
                }}
                .logo-container {{
                    text-align: center;
                    margin-bottom: 12px;
                    position: relative;
                    z-index: 2;
                }}
                .app-name {{ 
                    color: white; 
                    font-size: 36px; 
                    font-weight: 800; 
                    letter-spacing: -0.8px;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    margin-bottom: 8px;
                }}
                .tagline {{ 
                    color: rgba(255,255,255,0.85); 
                    font-size: 14px; 
                    font-weight: 400;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                    position: relative;
                    z-index: 2;
                }}
                .subtitle {{ 
                    color: rgba(255,255,255,0.9); 
                    font-size: 16px; 
                    font-weight: 500;
                    position: relative;
                    z-index: 2;
                    margin-top: 16px;
                }}
                .content {{ 
                    padding: 56px 48px; 
                    text-align: center; 
                }}
                .title {{ 
                    font-size: 28px; 
                    font-weight: 700; 
                    color: #0f172a; 
                    margin-bottom: 16px;
                    letter-spacing: -0.3px;
                }}
                .text {{ 
                    font-size: 18px; 
                    color: #64748b; 
                    margin-bottom: 40px; 
                    max-width: 480px;
                    margin-left: auto;
                    margin-right: auto;
                }}
                .code-container {{
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    border: 2px solid #e2e8f0;
                    border-radius: 20px;
                    padding: 40px 32px;
                    margin: 44px 0;
                    position: relative;
                    overflow: hidden;
                }}
                .code-container::before {{
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, #2edda2, #22c55e, #16a34a);
                }}
                .code-label {{ 
                    font-size: 14px; 
                    color: #64748b; 
                    font-weight: 600; 
                    margin-bottom: 16px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }}
                .code {{ 
                    font-size: 48px; 
                    font-weight: 800; 
                    color: #2edda2; 
                    letter-spacing: 12px; 
                    font-family: 'SF Mono', 'Monaco', 'Menlo', 'Consolas', monospace;
                    text-shadow: 0 2px 4px rgba(46,221,162,0.2);
                }}
                .security-note {{ 
                    background: linear-gradient(135deg, rgba(46,221,162,0.1) 0%, rgba(34,197,94,0.1) 100%); 
                    border: 1px solid rgba(46,221,162,0.3); 
                    border-radius: 16px; 
                    padding: 24px 28px; 
                    margin: 36px 0; 
                    color: #059669; 
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }}
                .security-note::before {{
                    content: '🔒';
                    font-size: 20px;
                }}
                .footer {{ 
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); 
                    padding: 32px 48px; 
                    text-align: center; 
                    font-size: 14px; 
                    color: #64748b;
                    border-top: 1px solid #e2e8f0;
                }}
                .footer-links {{
                    margin-bottom: 16px;
                }}
                .footer-link {{
                    color: #2edda2;
                    text-decoration: none;
                    font-weight: 500;
                    margin: 0 12px;
                }}
                .footer-link:hover {{
                    text-decoration: underline;
                }}
                .copyright {{
                    font-size: 13px;
                    color: #94a3b8;
                }}
                
                @media (max-width: 600px) {{
                    body {{ padding: 16px; }}
                    .content {{ padding: 40px 24px; }}
                    .header {{ padding: 40px 24px 32px; }}
                    .app-name {{ font-size: 28px; }}
                    .title {{ font-size: 24px; }}
                    .text {{ font-size: 16px; }}
                    .code {{ font-size: 40px; letter-spacing: 8px; }}
                    .footer {{ padding: 24px; }}
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo-container">
                        <div class="app-name">RefineGo</div>
                        <div class="tagline">Excellence in Digital Solutions</div>
                    </div>
                    <div class="subtitle">Intelligent Authentication Platform</div>
                </div>
                <div class="content">
                    <div class="title">Your Secure Access Code</div>
                    <div class="text">
                        We've generated a secure verification code for your RefineGo account login. 
                        Enter this code to complete your authentication process.
                    </div>
                    <div class="code-container">
                        <div class="code-label">Verification Code</div>
                        <div class="code">{otp}</div>
                    </div>
                    <div class="security-note">
                        This code will expire in 10 minutes for your security.
                    </div>
                </div>
                <div class="footer">
                    <div class="footer-links">
                        <a href="#" class="footer-link">Security Center</a>
                        <a href="#" class="footer-link">Support</a>
                        <a href="#" class="footer-link">Account Settings</a>
                    </div>
                    <div class="copyright">
                        If you didn't request this code, please secure your account immediately.<br/>
                        &copy; 2024 RefineGo Technologies. All rights reserved.
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
    text_content = f"""
    RefineGo Login Code

    Use the code below to complete your login:

    {otp}

    This code will expire in 10 minutes.

    Didn't request this? Please ignore this message or secure your account.
    """

    msg = EmailMultiAlternatives(subject, text_content, 'RefineGo <noreply@refinego.com>', [email])
    msg.attach_alternative(html_content, "text/html")
    msg.send(fail_silently=False)

def send_forgotpass_email(email, otp):
    subject = 'RefineGo - Your Password Reset Code'

    html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>RefineGo - Password Reset</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    margin: 0; 
                    padding: 0; 
                    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }}
                .container {{
                    max-width: 520px; 
                    margin: 20px; 
                    background-color: #ffffff;
                    border-radius: 24px; 
                    overflow: hidden;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08);
                    border: 1px solid rgba(0, 0, 0, 0.05);
                }}
                .header {{
                    background: linear-gradient(135deg, #2edda2 0%, #22c55e 50%, #16a34a 100%);
                    padding: 40px 30px 36px; 
                    text-align: center; 
                    color: #ffffff;
                    position: relative;
                    overflow: hidden;
                }}
                .header::before {{
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
                    animation: shimmer 4s ease-in-out infinite;
                }}
                @keyframes shimmer {{
                    0%, 100% {{ opacity: 0; transform: rotate(0deg); }}
                    50% {{ opacity: 1; transform: rotate(180deg); }}
                }}
                .icon {{
                    width: 64px; 
                    height: 64px;
                    margin: 0 auto 20px;
                    background: rgba(255, 255, 255, 0.2);
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-radius: 20px;
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                    font-size: 28px;
                    backdrop-filter: blur(10px);
                    position: relative;
                    z-index: 2;
                }}
                .brand-container {{
                    position: relative;
                    z-index: 2;
                }}
                .title {{
                    font-size: 32px; 
                    font-weight: 800; 
                    margin: 0 0 8px;
                    letter-spacing: -0.5px;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }}
                .tagline {{
                    font-size: 14px; 
                    opacity: 0.9;
                    font-weight: 500;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                }}
                .content {{
                    padding: 48px 40px; 
                    text-align: center;
                }}
                .content-title {{
                    font-size: 26px; 
                    font-weight: 700; 
                    margin-bottom: 16px;
                    color: #0f172a;
                    letter-spacing: -0.3px;
                }}
                .content-text {{
                    font-size: 17px; 
                    color: #64748b; 
                    margin-bottom: 36px;
                    line-height: 1.6;
                    max-width: 420px;
                    margin-left: auto;
                    margin-right: auto;
                }}
                .reset-button {{
                    display: inline-block;
                    background: linear-gradient(135deg, #2edda2 0%, #22c55e 100%);
                    color: white;
                    text-decoration: none;
                    font-weight: 700;
                    font-size: 16px;
                    padding: 18px 40px;
                    border-radius: 16px;
                    margin: 20px 0 32px;
                    box-shadow: 0 8px 24px rgba(46, 221, 162, 0.3);
                    transition: all 0.3s ease;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                }}
                .reset-button:hover {{
                    transform: translateY(-2px);
                    box-shadow: 0 12px 32px rgba(46, 221, 162, 0.4);
                }}
                .or-divider {{
                    display: flex;
                    align-items: center;
                    margin: 32px 0;
                    color: #94a3b8;
                    font-size: 14px;
                    font-weight: 500;
                }}
                .or-divider::before,
                .or-divider::after {{
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: #e2e8f0;
                }}
                .or-divider span {{
                    padding: 0 16px;
                }}
                .code-container {{
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    border: 2px solid #e2e8f0;
                    padding: 32px 24px;
                    border-radius: 20px;
                    margin: 24px 0;
                    position: relative;
                    overflow: hidden;
                }}
                .code-container::before {{
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, #2edda2, #22c55e, #16a34a);
                }}
                .code-label {{
                    font-size: 13px; 
                    color: #64748b; 
                    margin-bottom: 16px; 
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }}
                .code {{
                    font-family: 'SF Mono', 'Monaco', 'Menlo', 'Consolas', monospace;
                    font-size: 40px; 
                    letter-spacing: 8px;
                    font-weight: 800;
                    color: #2edda2;
                    text-shadow: 0 2px 4px rgba(46, 221, 162, 0.2);
                    line-height: 1;
                }}
                .security-info {{
                    font-size: 15px;
                    color: #dc2626;
                    background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%);
                    border: 1px solid rgba(239, 68, 68, 0.25);
                    border-radius: 16px;
                    padding: 20px 24px;
                    margin-top: 32px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }}
                .security-info::before {{
                    content: '⚠️';
                    font-size: 18px;
                }}
                .help-section {{
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%);
                    border: 1px solid rgba(59, 130, 246, 0.2);
                    border-radius: 16px;
                    padding: 24px;
                    margin-top: 32px;
                }}
                .help-title {{
                    font-size: 16px;
                    font-weight: 600;
                    color: #1e40af;
                    margin-bottom: 8px;
                }}
                .help-text {{
                    font-size: 14px;
                    color: #3730a3;
                    line-height: 1.5;
                }}
                .footer {{
                    font-size: 14px;
                    color: #64748b;
                    text-align: center;
                    padding: 32px 40px;
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    border-top: 1px solid #e2e8f0;
                }}
                .footer-note {{
                    margin-bottom: 12px;
                    font-weight: 500;
                }}
                .copyright {{
                    font-size: 13px;
                    color: #94a3b8;
                    font-weight: 400;
                }}
                
                @media (max-width: 600px) {{
                    .container {{ 
                        margin: 10px; 
                        max-width: calc(100vw - 20px);
                    }}
                    .header {{ padding: 32px 24px 28px; }}
                    .content {{ padding: 36px 24px; }}
                    .footer {{ padding: 24px; }}
                    .title {{ font-size: 28px; }}
                    .content-title {{ font-size: 22px; }}
                    .content-text {{ font-size: 16px; }}
                    .code {{ font-size: 32px; letter-spacing: 6px; }}
                    .code-container {{ padding: 24px 20px; }}
                    .reset-button {{ padding: 16px 32px; font-size: 15px; }}
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="brand-container">
                        <div class="title">RefineGo</div>
                        <div class="tagline">Excellence in Digital Solutions</div>
                    </div>
                </div>
                <div class="content">
                    <h2 class="content-title">Password Reset Request</h2>
                    <p class="content-text">
                        We received a request to reset your RefineGo account password, Please use the otp code to proceed with your password reset.
                    </p>
                    
                    <div class="or-divider">
                        <span>Or use verification code</span>
                    </div>
                    
                    <div class="code-container">
                        <div class="code-label">Password Reset Code</div>
                        <div class="code">{otp}</div>
                    </div>

                    <div class="security-info">
                        This reset request expires in 15 minutes for security
                    </div>
                    
                    <div class="help-section">
                        <div class="help-title">Need Help?</div>
                        <div class="help-text">
                            If you're having trouble resetting your password or didn't request this change, 
                            please contact our support team immediately for assistance.
                        </div>
                    </div>
                </div>
                <div class="footer">
                    <div class="footer-note">
                        If you didn't request a password reset, please ignore this email and your password will remain unchanged.
                    </div>
                    <div class="copyright">
                        © 2024 RefineGo Technologies. All rights reserved.
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
    
    text_content = f'''
        Welcome to RefineGo!

        Your verification code is: {otp}

        This code will expire in 10 minutes.

        If you didn’t create an account, you can safely ignore this email.
    '''

    msg = EmailMultiAlternatives(
        subject,
        text_content,
        'RefineGo <noreply@refinego.com>',
        [email]
    )
    msg.attach_alternative(html_content, "text/html")
    msg.send(fail_silently=False)

def send_verification_email(email, otp):
    subject = 'RefineGo - Your Verification Code'

    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RefineGo - Email Verification</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                margin: 0; 
                padding: 0; 
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }}
            .container {{
                max-width: 480px; 
                margin: 20px; 
                background-color: #ffffff;
                border-radius: 24px; 
                overflow: hidden;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08);
                border: 1px solid rgba(0, 0, 0, 0.05);
            }}
            .header {{
                background: linear-gradient(135deg, #2edda2 0%, #22c55e 50%, #16a34a 100%);
                padding: 40px 30px 36px; 
                text-align: center; 
                color: #ffffff;
                position: relative;
                overflow: hidden;
            }}
            .header::before {{
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
                animation: shimmer 4s ease-in-out infinite;
            }}
            @keyframes shimmer {{
                0%, 100% {{ opacity: 0; transform: rotate(0deg); }}
                50% {{ opacity: 1; transform: rotate(180deg); }}
            }}
            .icon {{
                width: 64px; 
                height: 64px;
                margin: 0 auto 20px;
                background: rgba(255, 255, 255, 0.2);
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 20px;
                display: flex; 
                align-items: center; 
                justify-content: center;
                font-size: 28px;
                backdrop-filter: blur(10px);
                position: relative;
                z-index: 2;
            }}
            .brand-container {{
                position: relative;
                z-index: 2;
            }}
            .title {{
                font-size: 32px; 
                font-weight: 800; 
                margin: 0 0 8px;
                letter-spacing: -0.5px;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }}
            .tagline {{
                font-size: 14px; 
                opacity: 0.9;
                font-weight: 500;
                letter-spacing: 0.5px;
                text-transform: uppercase;
            }}
            .content {{
                padding: 48px 36px; 
                text-align: center;
            }}
            .content-title {{
                font-size: 26px; 
                font-weight: 700; 
                margin-bottom: 16px;
                color: #0f172a;
                letter-spacing: -0.3px;
            }}
            .content-text {{
                font-size: 17px; 
                color: #64748b; 
                margin-bottom: 36px;
                line-height: 1.6;
            }}
            .code-container {{
                background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                border: 2px solid #e2e8f0;
                padding: 36px 24px;
                border-radius: 20px;
                margin: 32px 0;
                position: relative;
                overflow: hidden;
            }}
            .code-container::before {{
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(90deg, #2edda2, #22c55e, #16a34a);
            }}
            .code-label {{
                font-size: 13px; 
                color: #64748b; 
                margin-bottom: 16px; 
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1px;
            }}
            .code {{
                font-family: 'SF Mono', 'Monaco', 'Menlo', 'Consolas', monospace;
                font-size: 44px; 
                letter-spacing: 10px;
                font-weight: 800;
                color: #2edda2;
                text-shadow: 0 2px 4px rgba(46, 221, 162, 0.2);
                line-height: 1;
            }}
            .security-info {{
                font-size: 15px;
                color: #059669;
                background: linear-gradient(135deg, rgba(46, 221, 162, 0.1) 0%, rgba(34, 197, 94, 0.1) 100%);
                border: 1px solid rgba(46, 221, 162, 0.25);
                border-radius: 16px;
                padding: 20px 24px;
                margin-top: 32px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 10px;
            }}
            .security-info::before {{
                content: '⏱️';
                font-size: 18px;
            }}
            .footer {{
                font-size: 14px;
                color: #64748b;
                text-align: center;
                padding: 32px 36px;
                background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                border-top: 1px solid #e2e8f0;
            }}
            .footer-note {{
                margin-bottom: 12px;
                font-weight: 500;
            }}
            .copyright {{
                font-size: 13px;
                color: #94a3b8;
                font-weight: 400;
            }}
            
            @media (max-width: 600px) {{
                .container {{ 
                    margin: 10px; 
                    max-width: calc(100vw - 20px);
                }}
                .header {{ padding: 32px 24px 28px; }}
                .content {{ padding: 36px 24px; }}
                .footer {{ padding: 24px; }}
                .title {{ font-size: 28px; }}
                .content-title {{ font-size: 22px; }}
                .content-text {{ font-size: 16px; }}
                .code {{ font-size: 36px; letter-spacing: 6px; }}
                .code-container {{ padding: 28px 20px; }}
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="brand-container">
                    <div class="title">RefineGo</div>
                    <div class="tagline">Excellence in Digital Solutions</div>
                </div>
            </div>
            <div class="content">
                <h2 class="content-title">Email Verification Required</h2>
                <p class="content-text">Welcome to RefineGo! Please verify your email address using the secure code below to complete your account setup.</p>
                
                <div class="code-container">
                    <div class="code-label">Verification Code</div>
                    <div class="code">{otp}</div>
                </div>

                <div class="security-info">
                    This verification code expires in 10 minutes for security
                </div>
            </div>
            <div class="footer">
                <div class="footer-note">
                    Didn't create an account? You can safely ignore this email.
                </div>
                <div class="copyright">
                    © 2024 RefineGo Technologies. All rights reserved.
                </div>
            </div>
        </div>
    </body>
    </html>
    """

    text_content = f'''
        Welcome to RefineGo!

        Your verification code is: {otp}

        This code will expire in 10 minutes.

        If you didn’t create an account, you can safely ignore this email.
    '''

    msg = EmailMultiAlternatives(
        subject,
        text_content,
        'RefineGo <noreply@refinego.com>',
        [email]
    )
    msg.attach_alternative(html_content, "text/html")
    msg.send(fail_silently=False)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """Register a new user with OTP verification"""
    try:
        data = request.data
        email = data.get('email')
        username = data.get('username')
        password = data.get('password')
        phone_number = data.get('phone_number')
        
        # Validate required fields
        if not email or not username or not password:
            return Response({
                "success": False,
                "error": "Missing required fields"
            }, status=400)
        
        # Check if username already exists
        if User.objects.filter(username=username).exists():
            return Response({
                "success": False,
                "error": "Username already exists"
            }, status=400)
        
        # Check if email already exists
        if User.objects.filter(email=email).exists():
            return Response({
                "success": False,
                "error": "Email already registered"
            }, status=400)
        
        # Validate phone number length
        if phone_number and len(phone_number) < 10:
            return Response({
                "success": False,
                "error": "Phone number must be at least 10 digits"
            }, status=400)
        
        # Create user with is_active=False
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            is_active=False
        )
        
        # Add phone number if your User model supports it
        if phone_number:
            user.phone_number = phone_number
            user.save()
        
        # Generate and send OTP
        otp = str(random.randint(100000, 999999))
        EmailOTP.objects.update_or_create(
            email=email, 
            defaults={'otp': otp}
        )
        
        # Send OTP email with modern template
        try:
            send_verification_email(email, otp)
        except Exception as e:
            user.delete()
            return Response({
                "success": False,
                "error": "Failed to send verification email. Please try again."
            }, status=500)
        
        return Response({
            "success": True,
            "message": "Account created successfully. Please check your email for the verification code.",
            "email": email
        }, status=201)
        
    except Exception as e:
        return Response({
            "success": False,
            "error": "Registration failed. Please try again."
        }, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])  # Add this line
def verify_otp(request):
    """Verify OTP and activate user account"""
    try:
        email = request.data.get('email')
        otp = request.data.get('otp')
        
        if not email or not otp:
            return Response({
                "success": False,
                "error": "Email and OTP are required"
            }, status=400)
        
        # Get OTP record
        try:
            otp_record = EmailOTP.objects.get(email=email)
        except EmailOTP.DoesNotExist:
            return Response({
                "success": False,
                "error": "No verification code found for this email"
            }, status=400)
        
        # Check if OTP matches
        if otp_record.otp != otp:
            return Response({
                "success": False,
                "error": "Invalid verification code"
            }, status=400)
        
        # Check if OTP is expired (10 minutes)
        if otp_record.created_at + timedelta(minutes=10) < timezone.now():
            otp_record.delete()  # Clean up expired OTP
            return Response({
                "success": False,
                "error": "Verification code has expired. Please register again."
            }, status=400)
        
        # Get and activate the user
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({
                "success": False,
                "error": "User account not found"
            }, status=400)
        
        # Activate user
        user.is_active = True
        user.save()
        
        # Clean up OTP record
        otp_record.delete()
        
        # Log the user in and create session
        login(request, user)
        
        return Response({
            "success": True,
            "message": "Email verified successfully! Your account is now active.",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "phone_number": getattr(user, 'phone_number', None)
            }
        }, status=200)
        
    except Exception as e:
        return Response({
            "success": False,
            "error": "Verification failed. Please try again."
        }, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])  # Add this line
@csrf_exempt  # Add this line
def resend_otp(request):
    """Resend OTP to user's email"""
    try:
        email = request.data.get('email')
        
        if not email:
            return Response({
                "success": False,
                "error": "Email is required"
            }, status=400)
        
        # Check if user exists and is not active
        try:
            user = User.objects.get(email=email, is_active=False)
        except User.DoesNotExist:
            return Response({
                "success": False,
                "error": "No pending verification found for this email"
            }, status=400)
        
        # Generate new OTP
        otp = str(random.randint(100000, 999999))
        EmailOTP.objects.update_or_create(
            email=email, 
            defaults={'otp': otp}
        )
        
        # Send OTP email
        try:
            send_verification_email(email, otp)
        except Exception as e:
            return Response({
                "success": False,
                "error": "Failed to send verification email"
            }, status=500)
        
        return Response({
            "success": True,
            "message": "New verification code sent to your email"
        }, status=200)
        
    except Exception as e:
        return Response({
            "success": False,
            "error": "Failed to resend verification code"
        }, status=500)
    
@api_view(['POST'])
@permission_classes([AllowAny])  # Add this line
def login_user(request):
    """
    Step 1: Authenticate user credentials and send OTP
    """
    try:
        data = request.data
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        # Validate required fields
        if not email or not password:
            return Response({
                "success": False,
                "error": "Email and password are required"
            }, status=400)
        
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({
                "success": False,
                "error": "Invalid email or password from start"
            }, status=401)
        
        # Check if user account is active
        if not user.is_active:
            return Response({
                "success": False,
                "error": "Account is not activated. Please verify your email first."
            }, status=401)
        
        # Authenticate user
        # Note: authenticate() expects username, but we'll use email
        # You might need to create a custom authentication backend or use email as username
        user_auth = authenticate(request, username=user.username, password=password)
        
        if not user_auth:
            return Response({
                "success": False,
                "error": "Invalid email or password"
            }, status=401)
        
        # Generate and send OTP for login verification
        otp = str(random.randint(100000, 999999))
        EmailOTP.objects.update_or_create(
            email=email, 
            defaults={'otp': otp}
        )
        
        # Send OTP email
        try:
            send_login_verification_email(email, otp)
            
            logger.info(f"Login OTP sent to {email}")
            
        except Exception as e:
            logger.error(f"Failed to send login OTP to {email}: {str(e)}")
            return Response({
                "success": False,
                "error": "Failed to send verification code. Please try again."
            }, status=500)
        
        return Response({
            "success": True,
            "message": "Verification code sent to your email. Please check your inbox.",
            "email": email,
            "step": "otp_verification"
        }, status=200)
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return Response({
            "success": False,
            "error": "Login failed. Please try again."
        }, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])  # Add this line
def verify_login_otp(request):
    """
    Step 2: Verify OTP and complete login
    """
    try:
        email = request.data.get('email', '').strip().lower()
        otp = request.data.get('otp', '').strip()
        
        if not email or not otp:
            return Response({
                "success": False,
                "error": "Email and verification code are required"
            }, status=400)
        
        # Get OTP record
        try:
            otp_record = EmailOTP.objects.get(email__iexact=email)

        except EmailOTP.DoesNotExist:
            return Response({
                "success": False,
                "error": "No verification code found. Please try logging in again."
            }, status=400)
        
        # Check if OTP matches
        if otp_record.otp != otp:
            return Response({
                "success": False,
                "error": "Invalid verification code"
            }, status=400)
        
        # Check if OTP is expired (10 minutes)
        if otp_record.created_at + timedelta(minutes=10) < timezone.now():
            otp_record.delete()  # Clean up expired OTP
            return Response({
                "success": False,
                "error": "Verification code has expired. Please try logging in again."
            }, status=400)
        
        # Get the user
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({
                "success": False,
                "error": "User account not found"
            }, status=400)
        
        # Double-check user is active
        if not user.is_active:
            return Response({
                "success": False,
                "error": "Account is not activated"
            }, status=401)
        
        # Log the user in
        login(request, user)
        
        # Clean up OTP record
        otp_record.delete()
        
        # Update last login
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])
        
        logger.info(f"User {user.email} logged in successfully")
        
        return Response({
            "success": True,
            "message": "Login successful! Welcome back.",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "phone_number": getattr(user, 'phone_number', None),
                "last_login": user.last_login.isoformat() if user.last_login else None
            }
        }, status=200)
        
    except Exception as e:
        logger.error(f"OTP verification error: {str(e)}")
        return Response({
            "success": False,
            "error": "Verification failed. Please try again."
        }, status=500)
    
@api_view(['POST'])
@permission_classes([AllowAny])
def verify_reset_otp(request):
    """Verify password reset OTP - Debug Version"""
    print("=" * 50)
    print("VERIFY_RESET_OTP DEBUG START")
    print("=" * 50)
    
    try:
        # Debug: Print raw request data
        print(f"Raw request.data: {request.data}")
        print(f"Request method: {request.method}")
        print(f"Request headers: {dict(request.headers)}")
        
        # Extract and clean data
        email = request.data.get('email', '').strip().lower()
        otp = request.data.get('otp', '').strip()
        
        print(f"Extracted email: '{email}'")
        print(f"Extracted OTP: '{otp}'")
        print(f"Email type: {type(email)}")
        print(f"OTP type: {type(otp)}")
        print(f"Email length: {len(email)}")
        print(f"OTP length: {len(otp)}")

        # Validation
        if not email or not otp:
            print("ERROR: Email or OTP is empty")
            print(f"Email empty: {not email}")
            print(f"OTP empty: {not otp}")
            return Response({
                "success": False,
                "error": "Email and OTP are required"
            }, status=400)

        print("✓ Basic validation passed")

        # Check all OTP records for debugging
        all_otps = EmailOTP.objects.all()
        print(f"Total OTP records in database: {all_otps.count()}")
        
        for otp_record in all_otps:
            print(f"  - Email: '{otp_record.email}', OTP: '{otp_record.otp}', Created: {otp_record.created_at}")

        # Get OTP record
        try:
            otp_record = EmailOTP.objects.get(email__iexact=email)
            print(f"✓ Found OTP record for email: {email}")
            print(f"  - Stored email: '{otp_record.email}'")
            print(f"  - Stored OTP: '{otp_record.otp}'")
            print(f"  - Created at: {otp_record.created_at}")
            print(f"  - Current time: {timezone.now()}")
            
            # Check exact match
            print(f"Email match: '{email}' == '{otp_record.email}' -> {email == otp_record.email}")
            print(f"OTP match: '{otp}' == '{otp_record.otp}' -> {otp == otp_record.otp}")
            
        except EmailOTP.DoesNotExist:
            print(f"ERROR: No OTP record found for email: {email}")
            print("Available emails in OTP table:")
            for otp_rec in EmailOTP.objects.all():
                print(f"  - '{otp_rec.email}'")
            return Response({
                "success": False,
                "error": "No verification code found for this email"
            }, status=400)

        # Check if OTP matches
        if otp_record.otp != otp:
            print(f"ERROR: OTP mismatch")
            print(f"  - Expected: '{otp_record.otp}' (length: {len(otp_record.otp)})")
            print(f"  - Received: '{otp}' (length: {len(otp)})")
            print(f"  - Expected type: {type(otp_record.otp)}")
            print(f"  - Received type: {type(otp)}")
            
            # Character by character comparison
            for i, (expected_char, received_char) in enumerate(zip(otp_record.otp, otp)):
                match = expected_char == received_char
                print(f"    Position {i}: '{expected_char}' vs '{received_char}' -> {match}")
            
            return Response({
                "success": False,
                "error": "Invalid verification code"
            }, status=400)

        print("✓ OTP matches")

        # Check expiration
        expiry_time = otp_record.created_at + timedelta(minutes=10)
        current_time = timezone.now()
        
        print(f"OTP created at: {otp_record.created_at}")
        print(f"Current time: {current_time}")
        print(f"Expiry time: {expiry_time}")
        print(f"Time difference: {current_time - otp_record.created_at}")
        print(f"Is expired: {expiry_time < current_time}")
        
        if expiry_time < current_time:
            print("ERROR: OTP has expired")
            otp_record.delete()
            print("✓ Expired OTP record deleted")
            return Response({
                "success": False,
                "error": "Verification code has expired. Please request again."
            }, status=400)

        print("✓ OTP is not expired")

        # Get the user
        try:
            user = User.objects.get(email__iexact=email)
            print(f"✓ Found user: {user.email} (ID: {user.id})")
            print(f"  - User active: {user.is_active}")
            print(f"  - User staff: {user.is_staff}")
            print(f"  - User superuser: {user.is_superuser}")
        except User.DoesNotExist:
            print(f"ERROR: No user found with email: {email}")
            print("Available users:")
            for u in User.objects.all():
                print(f"  - {u.email} (ID: {u.id})")
            return Response({
                "success": False,
                "error": "User account not found"
            }, status=400)

        # Generate reset token (you might want to use a proper token generation)
        import secrets
        reset_token = secrets.token_urlsafe(32)
        print(f"Generated reset token: {reset_token}")

        # Clean up OTP record
        otp_record.delete()
        print("✓ OTP record deleted after successful verification")

        # Prepare response
        response_data = {
            "success": True,
            "message": "OTP verified successfully. You can now reset your password.",
            "user_id": user.id,
            "reset_token": reset_token
        }
        
        print("✓ Preparing success response:")
        print(f"  Response data: {response_data}")

        print("=" * 50)
        print("VERIFY_RESET_OTP DEBUG END - SUCCESS")
        print("=" * 50)

        return Response(response_data, status=200)

    except Exception as e:
        print("=" * 50)
        print("VERIFY_RESET_OTP DEBUG - EXCEPTION OCCURRED")
        print("=" * 50)
        print(f"Exception type: {type(e).__name__}")
        print(f"Exception message: {str(e)}")
        print(f"Exception args: {e.args}")
        
        import traceback
        print("Full traceback:")
        print(traceback.format_exc())
        
        print("=" * 50)
        print("VERIFY_RESET_OTP DEBUG END - ERROR")
        print("=" * 50)
        
        return Response({
            "success": False,
            "error": "OTP verification failed. Please try again."
        }, status=500)
    
@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """
    Reset user password using verified email
    """
    try:
        email = request.data.get('email', '').strip().lower()
        new_password = request.data.get('password', '')

        if not email or not new_password:
            return Response({
                "success": False,
                "error": "Email and new password are required."
            }, status=400)

        try:
            user = get_user_model().objects.get(email__iexact=email, is_active=True)
        except get_user_model().DoesNotExist:
            return Response({
                "success": False,
                "error": "User not found."
            }, status=404)

        user.password = make_password(new_password)
        user.save()

        # Optional: Invalidate OTP
        EmailOTP.objects.filter(email__iexact=email).delete()

        return Response({
            "success": True,
            "message": "Password reset successful."
        })

    except Exception as e:
        return Response({
            "success": False,
            "error": "Failed to reset password."
        }, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])  # Add this line
def resend_login_otp(request):
    """
    Resend OTP for login verification
    """
    try:
        email = request.data.get('email', '').strip().lower()
        
        if not email:
            return Response({
                "success": False,
                "error": "Email is required"
            }, status=400)
        
        # Check if user exists and is active
        try:
            user = User.objects.get(email__iexact=email, is_active=True)
        except User.DoesNotExist:
            return Response({
                "success": False,
                "error": "User not found or account not activated"
            }, status=400)
        
        # Check if there's a recent OTP request (rate limiting)
        recent_otp = EmailOTP.objects.filter(
            email__iexact=email,
            created_at__gte=timezone.now() - timedelta(minutes=1)
        ).first()
        
        if recent_otp:
            return Response({
                "success": False,
                "error": "Please wait before requesting another code"
            }, status=429)
        
        # Generate new OTP
        otp = str(random.randint(100000, 999999))
        EmailOTP.objects.update_or_create(
            email__iexact=email, 
            defaults={'otp': otp}
        )
        
        # Send OTP email
        try:
            send_login_verification_email(email, otp)
            
            logger.info(f"Login OTP resent to {email}")
            
        except Exception as e:
            logger.error(f"Failed to resend login OTP to {email}: {str(e)}")
            return Response({
                "success": False,
                "error": "Failed to send verification code. Please try again."
            }, status=500)
        
        return Response({
            "success": True,
            "message": "New verification code sent to your email"
        }, status=200)
        
    except Exception as e:
        logger.error(f"Resend OTP error: {str(e)}")
        return Response({
            "success": False,
            "error": "Failed to resend code. Please try again."
        }, status=500)


@api_view(['POST'])
def logout_user(request):
    """
    Logout user and clear session
    """
    try:
        if request.user.is_authenticated:
            user_email = request.user.email
            logout(request)
            logger.info(f"User {user_email} logged out")
            
            return Response({
                "success": True,
                "message": "Logged out successfully"
            }, status=200)
        else:
            return Response({
                "success": False,
                "error": "No active session found"
            }, status=400)
            
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return Response({
            "success": False,
            "error": "Logout failed"
        }, status=500)

@api_view(['GET'])
def check_auth_status(request):
    """
    Check if user is authenticated
    """
    try:
        if request.user.is_authenticated:
            return Response({
                "success": True,
                "authenticated": True,
                "user": {
                    "id": request.user.id,
                    "username": request.user.username,
                    "email": request.user.email,
                    "phone_number": getattr(request.user, 'phone_number', None)
                }
            }, status=200)
        else:
            return Response({
                "success": True,
                "authenticated": False
            }, status=200)

    except Exception as e:
        logger.error(f"Auth status check error: {str(e)}")
        return Response({
            "success": False,
            "error": "Failed to check authentication status"
        }, status=500)


# Additional helper view for password reset (optional)
@api_view(['POST'])
@permission_classes([AllowAny])  # Allow anyone to access this endpoint
def user_forgot_password(request):
    """
    Send password reset OTP
    """
    try:
        email = request.data.get('email', '').strip().lower()
        
        if not email:
            return Response({
                "success": False,
                "error": "Email is required"
            }, status=400)
        
        # Check if user exists
        try:
            user = User.objects.get(email__iexact=email, is_active=True)
        except User.DoesNotExist:
            # Don't reveal if email exists or not for security
            return Response({
                "success": True,
                "message": "If this email is registered, you will receive a password reset code."
            }, status=200)
        
        # Generate reset OTP
        otp = str(random.randint(100000, 999999))
        EmailOTP.objects.update_or_create(
            email=email, 
            defaults={'otp': otp}
        )

        print(f"Generated OTP for {email}: {otp}")  # Debugging line
        
        # Send password reset email
        try:
            send_forgotpass_email(email, otp)
            
            logger.info(f"Password reset OTP sent to {email}")
            
        except Exception as e:
            logger.error(f"Failed to send password reset OTP to {email}: {str(e)}")
        
        return Response({
            "success": True,
            "message": "If this email is registered, you will receive a password reset code."
        }, status=200)
        
    except Exception as e:
        logger.error(f"Forgot password error: {str(e)}")
        return Response({
            "success": False,
            "error": "Request failed. Please try again."
        }, status=500)


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
            'https://www.petrol-price.co.za/',
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
                db_stations = []  # TODO: Replace with actual DB station query if needed
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
            response = requests.get('https://www.petrol-price.co.za/', headers=headers, timeout=10)
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
        """Scrape from riseupwv.org - working source with current SA fuel prices"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            response = requests.get('https://www.riseupwv.org/fuel-price-drop/', headers=headers, timeout=15)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            prices = {}
            
            # Look for the fuel price table - this site has a structured table with province data
            tables = soup.find_all('table')
            for table in tables:
                rows = table.find_all('tr')
                
                # Find header row to identify columns
                header_row = None
                for row in rows:
                    if 'Petrol 93' in row.get_text() or 'Petrol 95' in row.get_text():
                        header_row = row
                        break
                
                if header_row:
                    headers = [th.get_text().strip() for th in header_row.find_all(['th', 'td'])]
                    
                    # Find Gauteng row (most common reference point)
                    for row in rows:
                        cells = row.find_all(['td', 'th'])
                        if len(cells) >= 4 and 'Gauteng' in cells[0].get_text():
                            try:
                                # Extract prices for Gauteng (index 0 = Province name)
                                petrol_93_text = cells[1].get_text().strip()  # Petrol 93 column
                                petrol_95_text = cells[2].get_text().strip()  # Petrol 95 column
                                diesel_text = cells[3].get_text().strip()     # Diesel column
                                
                                # Extract numeric values
                                petrol_93_match = re.search(r'R?(\d+\.?\d*)', petrol_93_text)
                                petrol_95_match = re.search(r'R?(\d+\.?\d*)', petrol_95_text)
                                diesel_match = re.search(r'R?(\d+\.?\d*)', diesel_text)
                                
                                if petrol_93_match:
                                    prices['regular'] = float(petrol_93_match.group(1))
                                if petrol_95_match:
                                    prices['premium'] = float(petrol_95_match.group(1))
                                if diesel_match:
                                    prices['diesel'] = float(diesel_match.group(1))
                                
                                break
                            except (IndexError, ValueError) as e:
                                logger.warning(f"Error parsing Gauteng row: {e}")
                                continue
            
            # Fallback: Look for any price mentions in the text
            if not prices:
                text_content = soup.get_text()
                
                # Look for price patterns in text
                petrol_93_pattern = r'Petrol 93.*?R(\d+\.?\d*)'
                petrol_95_pattern = r'Petrol 95.*?R(\d+\.?\d*)'
                diesel_pattern = r'Diesel.*?R(\d+\.?\d*)'
                
                petrol_93_match = re.search(petrol_93_pattern, text_content, re.IGNORECASE)
                petrol_95_match = re.search(petrol_95_pattern, text_content, re.IGNORECASE)
                diesel_match = re.search(diesel_pattern, text_content, re.IGNORECASE)
                
                if petrol_93_match:
                    prices['regular'] = float(petrol_93_match.group(1))
                if petrol_95_match:
                    prices['premium'] = float(petrol_95_match.group(1))
                if diesel_match:
                    prices['diesel'] = float(diesel_match.group(1))
            
            return self._format_prices(prices) if prices else None
            
        except Exception as e:
            logger.error(f"Error scraping riseupwv.org: {str(e)}")
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
    
@api_view(['GET'])
def user_notifications(request):
    notifications = Notification.objects.filter(notification_type='PRICE_ALERT')[:5]
    serializer = NotificationSerializer(notifications, many=True)
    return Response(serializer.data)


#TRIP RELATED FUNCTIONALITIES

class TripViewSet(viewsets.ModelViewSet):
    serializer_class = TripSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Trip.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def create_and_start_trip(self, request):
        """Create and start a trip directly without a trip plan"""
        required_fields = ['destination_address', 'destination_latitude', 
                        'destination_longitude', 'planned_distance', 'planned_duration']
        
        # Check for required fields (removed 'vehicle' from required)
        missing_fields = [field for field in required_fields if not request.data.get(field)]
        if missing_fields:
            return Response(
                {'error': f'Missing required fields: {", ".join(missing_fields)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Get vehicle if provided, otherwise None
            vehicle_id = request.data.get('vehicle')
            
            # Create trip directly
            trip_data = {
                'user': request.user,
                'vehicle_id': vehicle_id,  # This can be None now
                'start_address': request.data.get('start_address', ''),
                'start_latitude': request.data.get('start_latitude'),
                'start_longitude': request.data.get('start_longitude'),
                'destination_address': request.data.get('destination_address'),
                'destination_latitude': request.data.get('destination_latitude'),
                'destination_longitude': request.data.get('destination_longitude'),
                'planned_distance': request.data.get('planned_distance'),
                'planned_duration': request.data.get('planned_duration'),
                'status': 'active',
                'started_at': timezone.now()
            }
            
            trip = Trip.objects.create(**trip_data)
            serializer = self.get_serializer(trip)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])  # Note: These need to be indented as part of the class
    def complete_trip(self, request, pk=None):
        """Complete an active trip and award points"""
        trip = self.get_object()

        if trip.status != 'active':
            return Response({'error': 'Trip is not active'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            trip.status = 'completed'
            trip.completed_at = timezone.now()
            trip.actual_distance = request.data.get('actual_distance', trip.planned_distance)
            trip.actual_duration = request.data.get('actual_duration')

            if trip.actual_duration is None and trip.started_at:
                duration_delta = timezone.now() - trip.started_at
                trip.actual_duration = int(duration_delta.total_seconds() / 60)

            trip.save()

            points_awarded = trip.award_points()

            profile, _ = UserProfile.objects.get_or_create(user=request.user)

            response_data = {
                'trip': self.get_serializer(trip).data,
                'points_awarded': points_awarded,
                'points_breakdown': {
                    'base_points': trip.points_earned,
                    'bonus_points': trip.bonus_points,
                    'reasons': trip.points_reason.split('; ') if trip.points_reason else []
                },
                'user_profile': UserProfileSerializer(profile).data,
                'achievements': self._check_achievements(profile, trip)
            }

            return Response(response_data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])  # This also needs to be indented as part of the class
    def cancel_trip(self, request, pk=None):
        """Cancel an active trip"""
        trip = self.get_object()

        if trip.status != 'active':
            return Response({'error': 'Trip is not active'}, status=status.HTTP_400_BAD_REQUEST)

        trip.status = 'cancelled'
        trip.cancelled_at = timezone.now()
        trip.cancellation_reason = request.data.get('reason', 'user_cancelled')
        trip.save()

        serializer = self.get_serializer(trip)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def _check_achievements(self, profile, trip):
        """Check for new achievements"""
        achievements = []

        # First trip
        if Trip.objects.filter(user=profile.user, status='completed').count() == 1:
            achievements.append({
                'title': 'First Journey',
                'description': 'Completed your first trip!',
                'icon': '🚗'
            })

        total_distance = sum(
            t.actual_distance or 0
            for t in Trip.objects.filter(user=profile.user, status='completed')
        )

        distance_milestones = [100, 500, 1000, 5000, 10000]
        for milestone in distance_milestones:
            if total_distance >= milestone and (total_distance - (trip.actual_distance or 0)) < milestone:
                achievements.append({
                    'title': f'{milestone}km Explorer',
                    'description': f'Traveled {milestone}km in total!',
                    'icon': '🏆'
                })

        if hasattr(profile, '_previous_tier') and profile.loyalty_tier != profile._previous_tier:
            tier_names = {
                'silver': 'Silver',
                'gold': 'Gold',
                'platinum': 'Platinum',
                'diamond': 'Diamond'
            }
            achievements.append({
                'title': f'{tier_names.get(profile.loyalty_tier, "New Tier")} Status',
                'description': f'Upgraded to {tier_names.get(profile.loyalty_tier)} tier!',
                'icon': '⭐'
            })

        return achievements


class UserProfileViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return UserProfile.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_profile(self, request):
        """Get current user's profile"""
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(profile)
        return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_favorite(request):
    data = request.data
    place_id = data.get('station_id')
    name = data.get('name')
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    address = data.get('address', '')
    city = data.get('city', '')
    state = data.get('state', '')
    postal_code = data.get('postal_code', '')
    country = data.get('country', '')

    if not place_id or not name or latitude is None or longitude is None:
        return Response({'error': 'Missing required station data.'}, status=400)

    # Get or create the PetrolStation
    station, _ = PetrolStation.objects.get_or_create(
        google_place_id=place_id,
        defaults={
            'name': name,
            'latitude': latitude,
            'longitude': longitude,
            'address': address,
            'city': city,
            'state': state,
            'postal_code': postal_code,
            'country': country,
        }
    )

    try:
        favorite, created = Favorite.objects.get_or_create(user=request.user, station=station)
        if not created:
            # Already favorited: remove favorite
            favorite.delete()
            return Response({'favorited': False, 'station_id': place_id})
        else:
            return Response({'favorited': True, 'station_id': place_id})
    except IntegrityError:
        # This should be rare if unique constraint exists
        return Response({'error': 'Could not toggle favorite due to a conflict.'}, status=409)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_favorites(request):
    favorites = Favorite.objects.filter(user=request.user).values('google_place_id')
    
    result = list(favorites)
    return Response({'favorites': result})


#Trip history section

class TripHistoryView(generics.ListAPIView):
    """Get user's completed/cancelled trip history grouped by month"""
    serializer_class = TripSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Trip.objects.filter(
            user=self.request.user,
            status__in=['completed', 'cancelled']
        ).order_by('-started_at')
    
    def list(self, request, *args, **kwargs):
        trips = self.get_queryset()
        
        # Group trips by month/year
        trips_by_month = defaultdict(list)
        
        for trip in trips:
            # Use completed_at for completed trips, cancelled_at for cancelled, or started_at as fallback
            date_to_use = trip.completed_at or trip.cancelled_at or trip.started_at
            if date_to_use:
                month_year = f"{calendar.month_name[date_to_use.month]} {date_to_use.year}"
                trips_by_month[month_year].append(trip)
        
        # Format response - sort by year/month (most recent first)
        response_data = []
        
        # Sort the months by date (most recent first)
        sorted_months = sorted(trips_by_month.items(), 
                             key=lambda x: (int(x[0].split()[1]), 
                                          list(calendar.month_name).index(x[0].split()[0])), 
                             reverse=True)
        
        for month_year, month_trips in sorted_months:
            month_name, year = month_year.split(' ')
            response_data.append({
                'month': month_name,
                'year': int(year),
                'rides': TripSerializer(month_trips, many=True).data
            })
        
        return Response(response_data)

class UpcomingTripsView(generics.ListAPIView):
    """Get user's active/upcoming trips"""
    serializer_class = TripSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Trip.objects.filter(
            user=self.request.user,
            status='active'
        ).order_by('started_at')

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_trip(request):
    """Start a new trip"""
    try:
        data = request.data
        
        # Extract route information
        start_address = data.get('start_address')
        start_lat = data.get('start_latitude')
        start_lng = data.get('start_longitude')
        dest_address = data.get('destination_address')
        dest_lat = data.get('destination_latitude')
        dest_lng = data.get('destination_longitude')
        planned_distance = data.get('planned_distance', 0) / 1000  # Convert from meters to km
        planned_duration = data.get('planned_duration', 0) / 60  # Convert from seconds to minutes
        route_data = data.get('route_data', {})
        
        # Create trip
        trip = Trip.objects.create(
            user=request.user,
            start_address=start_address,
            start_latitude=start_lat,
            start_longitude=start_lng,
            destination_address=dest_address,
            destination_latitude=dest_lat,
            destination_longitude=dest_lng,
            planned_distance=planned_distance,
            planned_duration=planned_duration,
            route_data=route_data,
            status='active'
        )
        
        return Response({
            'trip_id': trip.id,
            'message': 'Trip started successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'error': f'Failed to start trip: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_trip(request, trip_id):
    """Complete an active trip"""
    try:
        trip = Trip.objects.get(
            id=trip_id,
            user=request.user,
            status='active'
        )
        
        data = request.data
        actual_distance = data.get('actual_distance', 0) / 1000  # Convert from meters to km
        actual_duration = data.get('actual_duration', 0) / 60  # Convert from seconds to minutes
        
        # Update trip
        trip.status = 'completed'
        trip.completed_at = timezone.now()
        trip.actual_distance = actual_distance
        trip.actual_duration = actual_duration
        
        # Calculate points
        total_points = trip.calculate_points()
        trip.save()
        
        return Response({
            'message': 'Trip completed successfully',
            'points_earned': trip.points_earned,
            'bonus_points': trip.bonus_points,
            'total_points': total_points,
            'points_reason': trip.points_reason
        })
        
    except Trip.DoesNotExist:
        return Response({
            'error': 'Trip not found or not active'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Failed to complete trip: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_trip(request, trip_id):
    """Cancel an active trip"""
    try:
        trip = Trip.objects.get(
            id=trip_id,
            user=request.user,
            status='active'
        )
        
        data = request.data
        cancellation_reason = data.get('reason', 'user_cancelled')
        
        # Update trip
        trip.status = 'cancelled'
        trip.cancelled_at = timezone.now()
        trip.cancellation_reason = cancellation_reason
        trip.save()
        
        return Response({
            'message': 'Trip cancelled successfully'
        })
        
    except Trip.DoesNotExist:
        return Response({
            'error': 'Trip not found or not active'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Failed to cancel trip: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def trip_stats(request):
    """Get user's trip statistics"""
    user_trips = Trip.objects.filter(user=request.user)
    
    total_trips = user_trips.count()
    completed_trips = user_trips.filter(status='completed').count()
    cancelled_trips = user_trips.filter(status='cancelled').count()
    active_trips = user_trips.filter(status='active').count()
    
    total_distance = sum(
        trip.actual_distance or 0 
        for trip in user_trips.filter(status='completed')
    )
    
    total_points = sum(
        (trip.points_earned + trip.bonus_points) 
        for trip in user_trips.filter(status='completed')
    )
    
    return Response({
        'total_trips': total_trips,
        'completed_trips': completed_trips,
        'cancelled_trips': cancelled_trips,
        'active_trips': active_trips,
        'total_distance_km': round(total_distance, 1),
        'total_points': total_points
    })

class UserFavoriteStationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        favorites = Favorite.objects.filter(user=request.user).select_related('station')
        serializer = FavoriteStationSerializer(favorites, many=True)
        return Response(serializer.data)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request):
    """Get current user's profile data"""
    print("Fetching user profile data")
    logger.info(f"Profile fetch request from user: {request.user.username}")
    try:
        user = request.user
        serializer = ProfileSerializer(user, context={'request': request})
        return Response(serializer.data, status=200)
        
    except Exception as e:
        logger.error(f"Profile fetch error: {str(e)}")
        return Response({
            "error": "Failed to fetch profile data"
        }, status=500)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_profile_data(request):
    print("Updating user profile data")
    print(f"Request data: {request.data}")
    logger.info(f"Profile update request from user: {request.user.username}")
    """Update user profile data"""
    try:
        user = request.user
        
        # Log the incoming data for debugging
        logger.info(f"Profile update request from {user.username}: {request.data}")
        
        # Use partial update
        serializer = ProfileSerializer(user, data=request.data, partial=True)
        
        if serializer.is_valid():
            updated_user = serializer.save()
            logger.info(f"Profile updated successfully for user {user.username}")
            
            # Return updated user data
            return Response(ProfileSerializer(updated_user).data, status=200)
        else:
            logger.warning(f"Profile update validation errors: {serializer.errors}")
            return Response({
                "error": "Validation failed",
                "details": serializer.errors
            }, status=400)
            
    except Exception as e:
        logger.error(f"Profile update error: {str(e)}")
        return Response({
            "error": "Failed to update profile"
        }, status=500)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_profile_picture(request):
    """Delete user's profile picture"""
    try:
        user = request.user
        
        if user.profile_picture:
            # Delete the file from storage
            user.profile_picture.delete(save=False)
            user.profile_picture = None
            user.save(update_fields=['profile_picture'])
            
            logger.info(f"Profile picture deleted for user {user.username}")
            
            return Response({
                "success": True,
                "message": "Profile picture deleted successfully"
            }, status=200)
        else:
            return Response({
                "error": "No profile picture to delete"
            }, status=400)
            
    except Exception as e:
        logger.error(f"Profile picture deletion error: {str(e)}")
        return Response({
            "error": "Failed to delete profile picture"
        }, status=500)
