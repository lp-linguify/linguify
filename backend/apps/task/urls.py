from rest_framework import routers
from .views import ItemViewSet

app_name = 'task'

router = routers.DefaultRouter()
router.register(r'items', ItemViewSet, basename='item')

urlpatterns = []

urlpatterns += router.urls