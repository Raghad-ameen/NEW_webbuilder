from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Site, Page, Asset, FormSubmission

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'is_staff')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user

class PageSerializer(serializers.ModelSerializer):

    class Meta:
        model = Page
        fields = ('id', 'site', 'title', 'slug', 'layout', 'meta_title', 'meta_description', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')        
        
        
class SiteSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    pages = PageSerializer(many=True, read_only=True)

    class Meta:
        model = Site
        fields = ('id', 'name', 'description', 'subdomain', 'custom_css', 'theme', 'is_published', 'is_active', 'owner', 'pages', 'created_at', 'updated_at')
        read_only_fields = ('id', 'is_active', 'owner', 'created_at', 'updated_at')

# Admin-specific serializer to protect site content
class AdminSiteSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source='owner.username', read_only=True)

    class Meta:
        model = Site
        fields = ('id', 'name', 'subdomain', 'is_active', 'owner_username', 'created_at')
        read_only_fields = ('id', 'name', 'subdomain', 'owner_username', 'created_at')

class AssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asset
        fields = ('id', 'site', 'file', 'file_name', 'uploaded_at')
        read_only_fields = ('id', 'uploaded_at')

class FormSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormSubmission
        fields = ('id', 'site', 'name', 'email', 'message', 'submitted_at')
        read_only_fields = ('id', 'submitted_at')
