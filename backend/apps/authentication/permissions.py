from rest_framework import permissions

class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object or admins to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Admin permissions
        if request.user.is_staff:
            return True

        # Check if object has a user attribute
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        return False

class IsCoachPermission(permissions.BasePermission):
    """
    Custom permission to only allow coaches to access certain views.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_coach

class IsActiveUser(permissions.BasePermission):
    """
    Custom permission to only allow active users.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_active