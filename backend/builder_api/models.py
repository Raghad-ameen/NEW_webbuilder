from django.db import models
from django.contrib.auth.models import User

class Site(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    subdomain = models.CharField(max_length=100, unique=True)
    custom_css = models.TextField(blank=True, default='')
    theme = models.JSONField(default=dict, blank=True)
    is_published = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)  # Admin toggle
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sites')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.subdomain})"

    class Meta:
        ordering = ['-updated_at']

class Page(models.Model):
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='pages')
    title = models.CharField(max_length=255)
    slug = models.CharField(max_length=100)  # e.g., 'home', 'about-us'
    layout = models.JSONField(default=list, blank=True)  # Canvas layout: list of sections, rows, columns, elements
    meta_title = models.CharField(max_length=255, blank=True, default='')
    meta_description = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('site', 'slug')
        ordering = ['created_at']

    def __str__(self):
        return f"{self.title} - {self.site.name} (/{self.slug})"

class Asset(models.Model):
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='assets', null=True, blank=True)
    file = models.FileField(upload_to='assets/')
    file_name = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.file_name

class FormSubmission(models.Model):
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='submissions')
    name = models.CharField(max_length=255)
    email = models.EmailField()
    message = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Submission from {self.name} for {self.site.name}"

    class Meta:
        ordering = ['-submitted_at']
