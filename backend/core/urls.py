# backend/core/urls.py
from django.shortcuts import redirect
from django.contrib import admin
from django.urls import path, include
from django.conf.urls.i18n import i18n_patterns
from . import utils
from . import views
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView, 
    SpectacularSwaggerView, 
    SpectacularRedocView
    )
from apps.authentication.views_terms import accept_terms, terms_status
from tests.test_settings import test_settings
from django.contrib.sitemaps.views import sitemap, index as sitemap_index
from .seo.views import serve_sitemap, serve_robots_txt, sitemap_status
from core.blog.views import comment_like_toggle, comment_report, reply_to_comment as comment_reply
from django.views.generic import RedirectView
from .favicon_views import favicon_ico, apple_touch_icon, favicon_png
from app_manager.icon_views import AppIconView


def redirect_to_admin(request):
    return redirect('admin/')

# URLs without language prefix (for compatibility)
urlpatterns = [
    # Favicon fallback redirects (temporary until views are deployed)
    path('favicon.ico', RedirectView.as_view(url='/static/favicon.ico', permanent=False)),
    path('apple-touch-icon.png', RedirectView.as_view(url='/static/images/apple-touch-icon.png', permanent=False)),
    path('apple-touch-icon-precomposed.png', RedirectView.as_view(url='/static/images/apple-touch-icon.png', permanent=False)),
    
    # Favicon views (enable after deployment)
    # path('favicon.ico', favicon_ico, name='favicon_ico'),
    # path('apple-touch-icon.png', apple_touch_icon, name='apple_touch_icon'),
    # path('apple-touch-icon-precomposed.png', 
    #      lambda request: apple_touch_icon(request, precomposed=True), 
    #      name='apple_touch_icon_precomposed'),
    # path('favicon-<str:size>.png', favicon_png, name='favicon_png'),
    
    # Language switching
    path('i18n/', include('django.conf.urls.i18n')),
    
    # Blog AJAX endpoints (no language prefix for API calls)
    path('blog/comment/like/', comment_like_toggle, name='blog_comment_like_ajax'),
    path('blog/comment/report/', comment_report, name='blog_comment_report_ajax'),
    path('blog/comment/<int:comment_id>/reply/', comment_reply, name='blog_comment_reply_ajax'),
    
    # App icons - serve app/static/description/icon.png as app-icons/app/icon.png
    path('app-icons/<str:app_name>/<str:filename>', AppIconView.as_view(), name='app_icon'),
    
    # Redirects for app pages without language prefix to user's preferred language
    path('apps/', views.language_redirect_view, {'path': 'apps/'}, name='apps_no_lang_redirect'),
    path('apps/<slug:app_slug>/', views.app_language_redirect_view, name='app_detail_no_lang_redirect'),
    
    # User profile routes (must be before saas_web.urls to avoid conflicts)
    path('profile/', include('apps.authentication.urls_profile')),
    path('u/', include('apps.authentication.urls_profile')),
    
    # SaaS application (protected routes) - no language prefix
    path('', include('saas_web.urls')),
    
    # Legacy frontend web (à supprimer après migration complète)
    # path('legacy/', include('frontend_web.urls')),
    
    path('admin/', admin.site.urls),
    # Add admin dashboard
    path('admin/stats/users/', include('apps.authentication.enhanced_admin.urls')),
    path('csrf/', utils.get_csrf_token, name='get_csrf_token'),
    path('api/', include('rest_framework.urls')),
    path('api/auth/', include('apps.authentication.urls')),
    # Test settings interface
    path('test-settings/', test_settings, name='test_settings'),
    # Terms and conditions endpoints
    path('api/auth/terms/accept', accept_terms, name='accept_terms'),
    path('api/auth/terms/status', terms_status, name='terms_status'),
    path('api/v1/revision/', include('apps.revision.urls', namespace='revision')),
    path('api/v1/notebook/', include('apps.notebook.urls', namespace='notebook')),
    path('notebook/', include('apps.notebook.urls_web', namespace='notebook_web')),
    path('revision/', include('apps.revision.urls_web', namespace='revision_web')),
    path('learning/', include('apps.course.urls_web', namespace='course')),
    path('quizz/', include('apps.quizz.urls_web', namespace='quizz_web')),
    path('language_ai/', include('apps.language_ai.urls_web', namespace='language_ai_web')),
    path('community/', include('apps.community.urls', namespace='community')),
    path('api/contact/', views.contact_view, name='contact'),
    path('api/v1/notifications/', include('apps.notification.urls', namespace='notification')),
    path('api/v1/language_ai/', include('apps.language_ai.urls', namespace='language_ai')),
    path('api/v1/jobs/', include('core.jobs.urls', namespace='jobs')),
    path('api/v1/app-manager/', include('app_manager.urls', namespace='app_manager')),
    # path('api/v1/flashcard/', include('flashcard.urls', namespace='flashcard')),
    # path('api/v1/task/', include('task.urls', namespace='task')),
    # path('api/v1/chat/', include('chat.urls', namespace='chat')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    path('api/v1/quizz/', include('apps.quizz.urls', namespace='quizz')),
    
    # SEO URLs - Organized sitemap serving
    path('robots.txt', serve_robots_txt, name='robots_txt'),
    path('sitemap.xml', serve_sitemap, {'sitemap_name': 'sitemap'}, name='sitemap_main'),
    path('sitemap-index.xml', serve_sitemap, {'sitemap_name': 'sitemap-index'}, name='sitemap_index'),
    path('sitemap-static.xml', serve_sitemap, {'sitemap_name': 'sitemap-static'}, name='sitemap_static'),
    path('sitemap-courses.xml', serve_sitemap, {'sitemap_name': 'sitemap-courses'}, name='sitemap_courses'),
    path('sitemap-learning.xml', serve_sitemap, {'sitemap_name': 'sitemap-learning'}, name='sitemap_learning'),
    path('sitemap-ugc.xml', serve_sitemap, {'sitemap_name': 'sitemap-ugc'}, name='sitemap_ugc'),
    path('sitemap-images.xml', serve_sitemap, {'sitemap_name': 'sitemap-images'}, name='sitemap_images'),
    path('sitemap-videos.xml', serve_sitemap, {'sitemap_name': 'sitemap-videos'}, name='sitemap_videos'),
    path('sitemap-en.xml', serve_sitemap, {'sitemap_name': 'sitemap-en'}, name='sitemap_en'),
    path('sitemap-fr.xml', serve_sitemap, {'sitemap_name': 'sitemap-fr'}, name='sitemap_fr'),
    path('sitemap-es.xml', serve_sitemap, {'sitemap_name': 'sitemap-es'}, name='sitemap_es'),
    path('sitemap-nl.xml', serve_sitemap, {'sitemap_name': 'sitemap-nl'}, name='sitemap_nl'),
    
    # SEO Status and Management
    path('seo/status/', sitemap_status, name='seo_status'),
]

# URLs with language prefix (for public website and authentication)
urlpatterns += i18n_patterns(
    # Authentication (login/register pages) - with language prefix
    path('auth/', include('apps.authentication.urls_auth')),
    
    # Careers/Jobs pages - with language prefix (public-facing)
    path('careers/', include('core.jobs.urls_web', namespace='jobs_web')),
    
    # Blog - with language prefix (public-facing)
    path('blog/', include('core.blog.urls', namespace='blog')),
    
    # Public website (landing, marketing) - with language prefix
    path('', include('public_web.urls')),
    prefix_default_language=True,  # Add language prefix even for default language
)

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Serve static files during development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)