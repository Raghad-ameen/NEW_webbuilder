from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.urls import reverse
from .models import Site, Page, FormSubmission

class WebsiteBuilderTests(TestCase):
    def setUp(self):
        # Create normal and admin users
        self.user = User.objects.create_user(username='testuser', password='password123', email='user@test.com')
        self.admin = User.objects.create_superuser(username='testadmin', password='password123', email='admin@test.com')
        
        # Create a test site
        self.site = Site.objects.create(
            name="Test Portfolio",
            subdomain="testsite",
            owner=self.user,
            is_published=True
        )
        
        # Create a test page
        self.page = Page.objects.create(
            site=self.site,
            title="Home",
            slug="home",
            layout=[
                {
                    "id": "sec1",
                    "type": "section",
                    "rows": [
                        {
                            "id": "row1",
                            "columns": [
                                {
                                    "id": "col1",
                                    "settings": {"width": "12"},
                                    "elements": [
                                        {
                                            "id": "el1",
                                            "type": "heading",
                                            "content": {"tag": "h1", "text": "Hello World"}
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        )

    def test_live_site_rendering(self):
        c = Client()
        # Verify published site resolves and displays title
        url = reverse('live_site_home', kwargs={'subdomain': 'testsite'})
        response = c.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Hello World")
        self.assertContains(response, "Test Portfolio")

    def test_deactivated_site_blocked(self):
        # Deactivate the site
        self.site.is_active = False
        self.site.save()
        
        c = Client()
        url = reverse('live_site_home', kwargs={'subdomain': 'testsite'})
        response = c.get(url)
        self.assertEqual(response.status_code, 403)
        self.assertContains(response, "Website Suspended", status_code=403)

    def test_contact_form_submission(self):
        c = Client()
        url = reverse('public_submit_form')
        payload = {
            "site": self.site.id,
            "name": "Jane Doe",
            "email": "jane@example.com",
            "message": "Interested in your design services."
        }
        response = c.post(url, payload, content_type='application/json')
        self.assertEqual(response.status_code, 201)
        
        # Verify db submission
        self.assertEqual(FormSubmission.objects.filter(site=self.site).count(), 1)
        sub = FormSubmission.objects.first()
        self.assertEqual(sub.name, "Jane Doe")
        self.assertEqual(sub.message, "Interested in your design services.")
