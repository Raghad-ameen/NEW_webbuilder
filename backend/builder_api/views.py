from django.http import HttpResponse, HttpResponseForbidden, Http404
from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from rest_framework import viewsets, permissions, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.authentication import SessionAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import PermissionDenied



class CsrfExemptSessionAuthentication(SessionAuthentication):
    def enforce_csrf(self, request):
        return

from .models import Site, Page, Asset, FormSubmission
from .serializers import (
    UserSerializer, RegisterSerializer, SiteSerializer, 
    PageSerializer, AssetSerializer, FormSubmissionSerializer, AdminSiteSerializer
)
from .compiler import compile_layout_to_html

class SignupView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = [CsrfExemptSessionAuthentication] 

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            user.is_active = True
            user.save()
            
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data,
                'is_staff': user.is_staff
            }, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    
class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = [CsrfExemptSessionAuthentication]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data,
                'is_staff': user.is_staff
            }, status=status.HTTP_200_OK)
            
        return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response({'detail': 'Successfully logged out'})

class UserInfoView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

# Site API Views
class SiteViewSet(viewsets.ModelViewSet):
    serializer_class = SiteSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        # يرى المستخدم مواقعه كلها في الداشبورد (حتى المعطلة ليراها بشارة Suspended)
        return Site.objects.filter(owner=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        """منع قراءة بيانات الموقع داخل البيلدر إذا كان معطلاً"""
        instance = self.get_object()
        if not instance.is_active:
            raise PermissionDenied("This website has been suspended by the administrator.")
        return super().retrieve(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        """منع أي عمليات تعديل (PATCH/PUT) إذا كان الموقع معطلاً"""
        instance = self.get_object()
        if not instance.is_active:
            raise PermissionDenied("Cannot update a suspended website.")
        return super().update(request, *args, **kwargs)

    def perform_create(self, serializer):
        subdomain = self.request.data.get('subdomain')
        if not subdomain:
            name = self.request.data.get('name', 'mysite')
            base_sub = "".join(c for c in name.lower() if c.isalnum())
            subdomain = base_sub
            
            counter = 1
            while Site.objects.filter(subdomain=subdomain).exists():
                subdomain = f"{base_sub}-{counter}"
                counter += 1
                
        site = serializer.save(owner=self.request.user, subdomain=subdomain)
        
        # تلقائياً إنشاء صفحة هوم
        Page.objects.create(
            site=site,
            title="Home",
            slug="home",
            layout=[
                {
                    "id": "sec_hero",
                    "type": "section",
                    "settings": {
                        "backgroundColor": "#111827",
                        "textColor": "#ffffff",
                        "paddingTop": "80px",
                        "paddingBottom": "80px",
                        "containerWidth": "1200px"
                    },
                    "rows": [
                        {
                            "id": "row_hero",
                            "settings": {},
                            "columns": [
                                {
                                    "id": "col_hero",
                                    "settings": {"width": "12", "textAlign": "center"},
                                    "elements": [
                                        {
                                            "id": "el_hero_h",
                                            "type": "heading",
                                            "content": {"tag": "h1", "text": f"Welcome to {site.name}"},
                                            "styles": {"fontSize": "48", "marginBottom": "20px", "fontFamily": "Outfit, sans-serif"}
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ],
            meta_title=f"Home | {site.name}",
            meta_description=f"Welcome to the homepage of {site.name}."
        )
        
        
# Page API Views
class PageViewSet(viewsets.ModelViewSet):
    serializer_class = PageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Page.objects.filter(site__owner=self.request.user)

# Asset API Views
class AssetViewSet(viewsets.ModelViewSet):
    serializer_class = AssetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Asset.objects.filter(site__owner=self.request.user)

    def perform_create(self, serializer):
        file = self.request.FILES.get('file')
        file_name = file.name if file else 'uploaded_file'
        serializer.save(file_name=file_name)

# Form Submissions View (Site Owners checking their submissions)
class FormSubmissionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = FormSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        site_id = self.request.query_params.get('site_id')
        if site_id:
            return FormSubmission.objects.filter(site__id=site_id, site__owner=self.request.user)
        return FormSubmission.objects.filter(site__owner=self.request.user)

# Public Form Submission endpoint (Contact form inside live websites)
class PublicFormSubmissionView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        site_id = request.data.get('site')
        site = get_object_or_404(Site, id=site_id)
        
        # Check if the site is active and published
        if not site.is_active or not site.is_published:
            return Response({'detail': 'Site is not accepting submissions.'}, status=status.HTTP_400_BAD_REQUEST)
            
        serializer = FormSubmissionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(site=site)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Platform Admin Dashboard Views
class AdminSiteListView(generics.ListAPIView):
    serializer_class = AdminSiteSerializer
    permission_classes = [permissions.IsAdminUser]  # Staff only (is_staff=True)
    # التعديل هنا:
    queryset = Site.objects.all().select_related('owner').order_by('-created_at') 

    def get_queryset(self):
        return Site.objects.all().select_related('owner').order_by('-created_at')
class AdminToggleSiteStatusView(APIView):
    permission_classes = [permissions.IsAdminUser]  # Staff only

    def post(self, request):
        site_id = request.data.get('site_id')
        site = get_object_or_404(Site, id=site_id)
        site.is_active = not site.is_active
        site.save()
        return Response({
            'site_id': site.id,
            'name': site.name,
            'is_active': site.is_active
        })

# Live Rendering View
def live_site_view(request, subdomain, page_slug=None):
    # Retrieve the site
    site = get_object_or_404(Site, subdomain=subdomain)
    
    # Check if the site is active
    if not site.is_active:
        return HttpResponseForbidden('''
        <html>
        <head>
            <title>Site Deactivated</title>
            <style>
                body { font-family: 'Inter', sans-serif; background: #0f172a; color: #f8fafc; text-align: center; padding: 100px 20px; }
                h1 { color: #f43f5e; font-size: 36px; margin-bottom: 20px; }
                p { font-size: 18px; color: #94a3b8; max-width: 600px; margin: 0 auto; line-height: 1.6; }
                .logo { font-size: 60px; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <div class="logo">⚠️</div>
            <h1>Website Suspended</h1>
            <p>This website has been deactivated by the platform administrator. If you are the owner, please contact support.</p>
        </body>
        </html>
        ''')
        
    # Check if the site is published (only published sites are live)
    if not site.is_published:
        raise Http404("This website is not published yet.")
        
    # Find the page
    if not page_slug:
        page_slug = "home"
        
    page = get_object_or_404(Page, site=site, slug=page_slug)
    
    # Get all pages of this site to construct the navbar
    pages_list = site.pages.all()
    
    # Compile layout to HTML
    html_content = compile_layout_to_html(site, page, pages_list)
    return HttpResponse(html_content)
