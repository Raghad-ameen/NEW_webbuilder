import re

def camel_to_kebab(styles_dict):
    if not styles_dict:
        return ""
    css = []
    for k, v in styles_dict.items():
        if v is None or v == "":
            continue
        # Convert camelCase to kebab-case
        kebab_k = re.sub(r'(?<!^)(?=[A-Z])', '-', k).lower()
        val = str(v)
        # Add px to numeric values for spacing/sizing if they are digits only
        if k in [
            'fontSize', 'padding', 'margin', 'borderRadius', 'borderWidth',
            'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
            'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
            'gap', 'height', 'width', 'maxWidth'
        ] and val.isdigit():
            val += "px"
        css.append(f"{kebab_k}: {val};")
    return " ".join(css)

def render_element(element, site_id):
    el_type = element.get('type', '')
    content = element.get('content', {})
    styles = element.get('styles', {})
    
    style_str = camel_to_kebab(styles)
    
    if el_type == 'heading':
        tag = content.get('tag', 'h2')
        text = content.get('text', 'Heading')
        return f'<{tag} style="{style_str}">{text}</{tag}>'
        
    elif el_type == 'text':
        text = content.get('text', 'Paragraph text goes here.')
        # Convert newlines to breaks
        text = text.replace('\n', '<br>')
        return f'<div style="{style_str}">{text}</div>'
        
    elif el_type == 'button':
        text = content.get('text', 'Click Here')
        link = content.get('link', '#')
        return f'<a href="{link}" class="site-builder-btn" style="display: inline-block; text-align: center; text-decoration: none; {style_str}">{text}</a>'
        
    elif el_type == 'image':
        src = content.get('src', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80')
        alt = content.get('alt', 'Image')
        return f'<img src="{src}" alt="{alt}" style="max-width: 100%; height: auto; display: block; {style_str}" />'
        
    elif el_type == 'video':
        src = content.get('src', '')
        if 'youtube.com' in src or 'youtu.be' in src:
            # Simple conversion of youtube watch links to embed links
            embed_url = src
            if 'watch?v=' in src:
                embed_url = src.replace('watch?v=', 'embed/')
            elif 'youtu.be/' in src:
                embed_url = src.replace('youtu.be/', 'youtube.com/embed/')
            return f'''
            <div class="video-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; {style_str}">
                <iframe src="{embed_url}" frameborder="0" allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe>
            </div>
            '''
        elif src:
            return f'<video src="{src}" controls style="width: 100%; max-height: 500px; display: block; {style_str}"></video>'
        else:
            return f'<div style="background-color: #eee; padding: 20px; text-align: center; color: #666; {style_str}">No video URL provided</div>'
            
    elif el_type == 'divider':
        return f'<hr style="border: 0; border-top: 1px solid #ccc; margin: 15px 0; width: 100%; {style_str}" />'
        
    elif el_type == 'spacer':
        height = styles.get('height', '30')
        if str(height).isdigit():
            height = f"{height}px"
        return f'<div style="height: {height}; {style_str}"></div>'
        
    elif el_type == 'form':
        # Contact form elements
        btn_bg = styles.get('backgroundColor', '#007bff')
        btn_color = styles.get('color', '#ffffff')
        btn_radius = styles.get('borderRadius', '4px')
        
        btn_style = f"background-color: {btn_bg}; color: {btn_color}; border-radius: {btn_radius}; border: none; padding: 10px 20px; font-weight: bold; cursor: pointer;"
        
        return f'''
        <form class="platform-contact-form" data-site-id="{site_id}" style="max-width: 500px; width: 100%; margin: 0 auto; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 8px; {style_str}">
            <div style="margin-bottom: 15px; display: flex; flex-direction: column;">
                <label style="margin-bottom: 5px; font-weight: 500; font-size: 14px;">Name</label>
                <input type="text" name="name" required placeholder="Your Name" style="padding: 10px; border: 1px solid rgba(0,0,0,0.15); border-radius: 4px; font-size: 14px; background: rgba(255,255,255,0.8); color: #000;" />
            </div>
            <div style="margin-bottom: 15px; display: flex; flex-direction: column;">
                <label style="margin-bottom: 5px; font-weight: 500; font-size: 14px;">Email</label>
                <input type="email" name="email" required placeholder="Your Email" style="padding: 10px; border: 1px solid rgba(0,0,0,0.15); border-radius: 4px; font-size: 14px; background: rgba(255,255,255,0.8); color: #000;" />
            </div>
            <div style="margin-bottom: 15px; display: flex; flex-direction: column;">
                <label style="margin-bottom: 5px; font-weight: 500; font-size: 14px;">Message</label>
                <textarea name="message" rows="4" required placeholder="Your message..." style="padding: 10px; border: 1px solid rgba(0,0,0,0.15); border-radius: 4px; font-size: 14px; background: rgba(255,255,255,0.8); color: #000; resize: vertical;"></textarea>
            </div>
            <button type="submit" style="{btn_style}">Send Message</button>
            <div class="form-feedback-message" style="margin-top: 15px; padding: 10px; border-radius: 4px; display: none; font-size: 14px;"></div>
        </form>
        '''
    return ''

def compile_layout_to_html(site, page, pages_list):
    """
    Compiles a JSON page layout into static HTML.
    Includes global site styling, custom CSS, navbar for multi-page sites, and contact form handlers.
    """
    layout = page.layout
    theme = site.theme or {}
    
    # Global styles from Theme
    bg_color = theme.get('backgroundColor', '#ffffff')
    text_color = theme.get('textColor', '#333333')
    primary_color = theme.get('primaryColor', '#007bff')
    font_family = theme.get('fontFamily', 'Inter, sans-serif')
    
    # Generate Page Title
    page_title = page.meta_title or f"{page.title} | {site.name}"
    meta_desc = page.meta_description or site.description
    
    # Generate Navigation menu if there are multiple pages
    nav_html = ""
    if len(pages_list) > 1:
        links = []
        for p in pages_list:
            active_class = "active" if p.slug == page.slug else ""
            # Link structure: /live/<subdomain>/<slug> (or /live/<subdomain>/ for home page)
            url_path = f"/live/{site.subdomain}/" if p.slug == "home" else f"/live/{site.subdomain}/{p.slug}/"
            links.append(f'<a href="{url_path}" class="nav-link {active_class}" style="color: {text_color}; text-decoration: none; margin: 0 15px; font-weight: 500; font-size: 15px;">{p.title}</a>')
        
        links_str = "\n".join(links)
        nav_html = f'''
        <nav style="display: flex; justify-content: space-between; align-items: center; padding: 20px 40px; background-color: rgba(0,0,0,0.02); border-bottom: 1px solid rgba(0,0,0,0.05);">
            <a href="/live/{site.subdomain}/" style="font-weight: 700; font-size: 20px; text-decoration: none; color: {primary_color};">{site.name}</a>
            <div style="display: flex; align-items: center;">
                {links_str}
            </div>
        </nav>
        '''
        
    # Generate Canvas body
    canvas_html = []
    
    for section in layout:
        sec_styles = section.get('settings', {})
        sec_style_str = camel_to_kebab(sec_styles)
        
        # Section HTML
        canvas_html.append(f'<section style="position: relative; width: 100%; {sec_style_str}">')
        # We wrap in a container if containerWidth is set or limit is wanted
        container_width = sec_styles.get('containerWidth', '1200px')
        canvas_html.append(f'<div class="section-container" style="max-width: {container_width}; margin: 0 auto; padding: 0 20px; box-sizing: border-box;">')
        
        # Rows
        for row in section.get('rows', []):
            row_styles = row.get('settings', {})
            row_style_str = camel_to_kebab(row_styles)
            canvas_html.append(f'<div class="row" style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: flex-start; margin-bottom: 20px; {row_style_str}">')
            
            # Columns
            columns = row.get('columns', [])
            total_cols = len(columns)
            for col in columns:
                col_styles = col.get('settings', {})
                col_width = col_styles.get('width', '12')
                col_style_str = camel_to_kebab(col_styles)
                
                # Base layout widths (approximate flex bases)
                width_map = {
                    '12': '100%',
                    '6': 'calc(50% - 10px)',
                    '4': 'calc(33.33% - 13.33px)',
                    '3': 'calc(25% - 15px)',
                    '8': 'calc(66.66% - 6.66px)',
                    '9': 'calc(75% - 5px)',
                }
                computed_width = width_map.get(str(col_width), '100%')
                
                canvas_html.append(f'''
                <div class="col" style="flex: 0 0 {computed_width}; width: {computed_width}; min-width: 280px; box-sizing: border-box; display: flex; flex-direction: column; gap: 15px; {col_style_str}">
                ''')
                
                # Elements
                for element in col.get('elements', []):
                    canvas_html.append(render_element(element, site.id))
                    
                canvas_html.append('</div>') # end col
                
            canvas_html.append('</div>') # end row
            
        canvas_html.append('</div>') # end section-container
        canvas_html.append('</section>') # end section
        
    compiled_body = "\n".join(canvas_html)
    
    # Full HTML Template
    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{page_title}</title>
    <meta name="description" content="{meta_desc}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
        /* Base Reset */
        body, h1, h2, h3, h4, h5, h6, p, ul, ol, li, figure, figcaption, blockquote, dl, dd, hr {{
            margin: 0;
            padding: 0;
        }}
        body {{
            font-family: {font_family};
            background-color: {bg_color};
            color: {text_color};
            line-height: 1.5;
            -webkit-font-smoothing: antialiased;
            box-sizing: border-box;
        }}
        *, *::before, *::after {{
            box-sizing: inherit;
        }}
        img, iframe, video {{
            max-width: 100%;
            height: auto;
        }}
        
        /* Helper button styles */
        .site-builder-btn {{
            transition: all 0.2s ease-in-out;
        }}
        .site-builder-btn:hover {{
            filter: brightness(0.9);
            transform: translateY(-1px);
        }}
        .site-builder-btn:active {{
            transform: translateY(0);
        }}
        
        /* Navigation active indicator */
        .nav-link.active {{
            border-bottom: 2px solid {primary_color};
            padding-bottom: 4px;
            font-weight: bold;
        }}
        
        /* Responsive adjustments */
        @media (max-width: 768px) {{
            .row {{
                flex-direction: column !important;
                gap: 20px !important;
            }}
            .col {{
                flex: 0 0 100% !important;
                width: 100% !important;
            }}
        }}

        /* Custom Custom CSS injected by the creator */
        {site.custom_css}
    </style>
</head>
<body>
    {nav_html}
    <main>
        {compiled_body}
    </main>
    
    <script>
        // Form submission interceptor
        document.querySelectorAll('.platform-contact-form').forEach(form => {{
            form.addEventListener('submit', function(e) {{
                e.preventDefault();
                
                const siteId = this.getAttribute('data-site-id');
                const name = this.querySelector('input[name="name"]').value;
                const email = this.querySelector('input[name="email"]').value;
                const message = this.querySelector('textarea[name="message"]').value;
                const feedbackEl = this.querySelector('.form-feedback-message');
                const submitBtn = this.querySelector('button[type="submit"]');
                
                feedbackEl.style.display = 'block';
                feedbackEl.style.backgroundColor = 'rgba(255,255,255,0.1)';
                feedbackEl.style.color = '{text_color}';
                feedbackEl.innerText = 'Submitting form...';
                submitBtn.disabled = true;
                
                fetch('/api/public/submit-form/', {{
                    method: 'POST',
                    headers: {{
                        'Content-Type': 'application/json',
                    }},
                    body: JSON.stringify({{
                        site: siteId,
                        name: name,
                        email: email,
                        message: message
                    }})
                }})
                .then(response => {{
                    if (response.ok) {{
                        return response.json();
                    }}
                    throw new Error('Failed to submit form');
                }})
                .then(data => {{
                    feedbackEl.style.backgroundColor = 'rgba(46, 204, 113, 0.15)';
                    feedbackEl.style.color = '#2ecc71';
                    feedbackEl.innerText = 'Thank you! Your message has been sent successfully.';
                    form.reset();
                }})
                .catch(error => {{
                    console.error('Error:', error);
                    feedbackEl.style.backgroundColor = 'rgba(231, 76, 60, 0.15)';
                    feedbackEl.style.color = '#e74c3c';
                    feedbackEl.innerText = 'An error occurred. Please try again later.';
                }})
                .finally(() => {{
                    submitBtn.disabled = false;
                }});
            }});
        }});
    </script>
</body>
</html>
'''
    return html
