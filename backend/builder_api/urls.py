from django.urls import path, include
from rest_framework.routers import SimpleRouter  # 🌟 استخدمنا SimpleRouter لأنه لا يبتلع الروابط الفارغة
from .views import (
    SignupView, LoginView, LogoutView, UserInfoView,
    SiteViewSet, PageViewSet, AssetViewSet, FormSubmissionViewSet,
    PublicFormSubmissionView, AdminSiteListView, AdminToggleSiteStatusView
)
from rest_framework.authtoken.views import obtain_auth_token

router = SimpleRouter()  # 🌟 تعديل هنا
router.register('sites', SiteViewSet, basename='site')
router.register('pages', PageViewSet, basename='page')
router.register('assets', AssetViewSet, basename='asset')
router.register('submissions', FormSubmissionViewSet, basename='submission')

urlpatterns = [
    # 1️⃣ وضع الـ Auth في القمة تماماً ليكون لها الأولوية القصوى
    path('auth/signup/', SignupView.as_view(), name='auth_signup'),
    path('auth/login/', LoginView.as_view(), name='auth_login'),
    path('auth/logout/', LogoutView.as_view(), name='auth_logout'),
    path('auth/user/', UserInfoView.as_view(), name='auth_user'),
    
    # 2️⃣ الأكواد العامة والإدارية
    path('public/submit-form/', PublicFormSubmissionView.as_view(), name='public_submit_form'),
    path('admin/sites/', AdminSiteListView.as_view(), name='admin_site_list'),
    path('admin/toggle-site-status/', AdminToggleSiteStatusView.as_view(), name='admin_toggle_site_status'),
    
    # 3️⃣ الـ Router في النهاية تماماً كملجأ أخير للروابط
    path('', include(router.urls)),
]