import re
import urllib.parse

def camel_to_kebab(styles_dict):
    if not styles_dict:
        return ""
    css = []
    
    # Process compound properties first and keep track of keys to ignore in standard loop
    ignore_keys = set()
    
    # Background Gradients
    if 'gradientColor1' in styles_dict and 'gradientColor2' in styles_dict:
        color1 = styles_dict['gradientColor1']
        color2 = styles_dict['gradientColor2']
        angle = styles_dict.get('gradientAngle', '135')
        if color1 and color2:
            css.append(f"background: linear-gradient({angle}deg, {color1}, {color2});")
            ignore_keys.update(['gradientColor1', 'gradientColor2', 'gradientAngle'])
            
    # Text Shadows
    if 'textShadowOffsetX' in styles_dict or 'textShadowOffsetY' in styles_dict:
        ox = str(styles_dict.get('textShadowOffsetX', '0'))
        oy = str(styles_dict.get('textShadowOffsetY', '0'))
        blur = str(styles_dict.get('textShadowBlur', '0'))
        color = styles_dict.get('textShadowColor', '#000000')
        if ox.isdigit(): ox += "px"
        if oy.isdigit(): oy += "px"
        if blur.isdigit(): blur += "px"
        css.append(f"text-shadow: {ox} {oy} {blur} {color};")
        ignore_keys.update(['textShadowOffsetX', 'textShadowOffsetY', 'textShadowBlur', 'textShadowColor'])
        
    # Box Shadows
    if 'boxShadowOffsetX' in styles_dict or 'boxShadowOffsetY' in styles_dict:
        ox = str(styles_dict.get('boxShadowOffsetX', '0'))
        oy = str(styles_dict.get('boxShadowOffsetY', '0'))
        blur = str(styles_dict.get('boxShadowBlur', '0'))
        spread = str(styles_dict.get('boxShadowSpread', '0'))
        color = styles_dict.get('boxShadowColor', 'rgba(0,0,0,0.3)')
        if ox.isdigit(): ox += "px"
        if oy.isdigit(): oy += "px"
        if blur.isdigit(): blur += "px"
        if spread.isdigit(): spread += "px"
        css.append(f"box-shadow: {ox} {oy} {blur} {spread} {color};")
        ignore_keys.update(['boxShadowOffsetX', 'boxShadowOffsetY', 'boxShadowBlur', 'boxShadowSpread', 'boxShadowColor'])

    for k, v in styles_dict.items():
        if k in ignore_keys or v is None or v == "":
            continue
        # Convert camelCase to kebab-case
        kebab_k = re.sub(r'(?<!^)(?=[A-Z])', '-', k).lower()
        val = str(v)
        
        # Add px to numeric values for spacing/sizing if they are digits only
        px_properties = [
            'fontSize', 'padding', 'margin', 'borderRadius', 'borderWidth',
            'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
            'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
            'gap', 'height', 'width', 'maxWidth', 'letterSpacing', 'borderWidth',
            'borderTopWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderRightWidth',
            'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius'
        ]
        
        if k in px_properties and val.isdigit():
            val += "px"
            
        css.append(f"{kebab_k}: {val};")
    return " ".join(css)

def migrate_layout(layout):
    if not isinstance(layout, list):
        return []
    migrated = []
    for sec in layout:
        if not isinstance(sec, dict):
            continue
        if 'elements' in sec and 'rows' not in sec:
            migrated.append(sec)
            continue
            
        elements = []
        for row in sec.get('rows', []):
            col_offset_left = 0
            for col in row.get('columns', []):
                col_width_val = col.get('settings', {}).get('width', '12')
                try:
                    col_width_percent = int(col_width_val) / 12.0
                except (ValueError, TypeError):
                    col_width_percent = 1.0
                col_width_px = 1200 * col_width_percent
                
                for el in col.get('elements', []):
                    el_copy = dict(el)
                    el_copy['x'] = el.get('x', 0) + col_offset_left
                    el_copy['y'] = el.get('y', 0)
                    elements.append(el_copy)
                    
                col_offset_left += col_width_px
                
        sec_copy = {k: v for k, v in sec.items() if k != 'rows'}
        sec_copy['elements'] = elements
        migrated.append(sec_copy)
        
    return migrated

def render_compiled_element(el, site_id):
    el_type = el.get('type', '')
    content = el.get('content', {})
    styles = el.get('styles', {})
    
    # Calculate wrapper styles (absolute position, dimensions, z-index, animations)
    width = el.get('width', 200)
    height = el.get('height', 50)
    x = el.get('x', 0)
    y = el.get('y', 0)
    z_index = styles.get('zIndex', 10)
    
    el_styles_list = [
        "position: absolute",
        f"width: {width}px" if width else "width: 100%",
        f"height: {height}px" if height else "height: auto",
        f"left: {x}px",
        f"top: {y}px",
        f"z-index: {z_index}"
    ]
    
    if styles:
        custom_styles = camel_to_kebab(styles)
        if custom_styles:
            el_styles_list.append(custom_styles)
            
    if el.get('animation') and el['animation'].get('type') and el['animation']['type'] != 'none':
        anim = el['animation']
        el_styles_list.append(f"animation-name: {anim['type']}")
        el_styles_list.append(f"animation-duration: {anim.get('duration', 1)}s")
        el_styles_list.append(f"animation-delay: {anim.get('delay', 0)}s")
        el_styles_list.append(f"animation-iteration-count: {anim.get('iteration', '1')}")
        el_styles_list.append("animation-fill-mode: both")
        
    el_styles_str = "; ".join(el_styles_list) + ";"
    
    inner_markup = ""
    if el_type == 'heading':
        tag = content.get('tag', 'h2')
        text = content.get('text', 'Heading')
        inner_markup = f'<{tag} style="margin: 0; font-size: inherit; color: inherit;">{text}</{tag}>'
        
    elif el_type == 'text':
        text = content.get('text', 'Paragraph text goes here.')
        text = text.replace('\n', '<br>')
        inner_markup = f'<div style="font-size: inherit; color: inherit;">{text}</div>'
        
    elif el_type == 'button':
        text = content.get('text', 'Click Here')
        action = el.get('action', {})
        if action and action.get('type') == 'submit_inputs':
            endpoint = action.get('value', '')
            inner_markup = f'<button class="site-builder-btn" onclick="submitInputs(event, \'{endpoint}\')" style="width: 100%; height: 100%; border: none; background: transparent; color: inherit; font-size: inherit; font-weight: inherit; padding: 0; border-radius: inherit;">{text}</button>'
        else:
            inner_markup = f'<button class="site-builder-btn" style="width: 100%; height: 100%; border: none; background: transparent; color: inherit; font-size: inherit; font-weight: inherit; padding: 0; border-radius: inherit;">{text}</button>'
            
    elif el_type == 'link':
        text = content.get('text', 'Link Text')
        inner_markup = f'<a href="#" style="text-decoration: inherit; color: inherit; font-size: inherit; font-weight: inherit;">{text}</a>'
        
    elif el_type == 'image':
        src = content.get('src', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80')
        alt = content.get('alt', 'Image')
        inner_markup = f'<img src="{src}" alt="{alt}" style="width: 100%; height: 100%; display: block; border-radius: inherit;" />'
        
    elif el_type == 'video':
        src = content.get('src', '')
        is_youtube = 'youtube.com' in src or 'youtu.be' in src
        embed_url = src
        if is_youtube:
            if 'watch?v=' in src:
                embed_url = src.replace('watch?v=', 'embed/')
            elif 'youtu.be/' in src:
                embed_url = src.replace('youtu.be/', 'youtube.com/embed/')
            inner_markup = f'<iframe src="{embed_url}" frameborder="0" allowfullscreen style="width: 100%; height: 100%; border-radius: inherit;"></iframe>'
        elif src:
            inner_markup = f'<video src="{src}" controls style="width: 100%; height: 100%; border-radius: inherit;"></video>'
        else:
            inner_markup = '<div style="background-color: #eee; padding: 20px; text-align: center; color: #666; width: 100%; height: 100%;">No video URL provided</div>'
            
    elif el_type == 'divider':
        h = styles.get('height', 1)
        bg = styles.get('backgroundColor', '#ccc')
        inner_markup = f'<hr style="border: none; border-top: {h}px solid {bg}; margin: 0; width: 100%;" />'
        
    elif el_type == 'spacer':
        inner_markup = '<div style="height: 100%;"></div>'
        
    elif el_type == 'shape':
        inner_markup = '<div style="width: 100%; height: 100%; border-radius: inherit; background: inherit;"></div>'
        
    elif el_type == 'icon':
        icon_name = content.get('icon', 'Star').lower()
        inner_markup = f'<i data-lucide="{icon_name}" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: inherit;"></i>'
        
    elif el_type == 'input':
        input_width = styles.get('widthPercent', '100')
        input_bg = styles.get('backgroundColor', 'rgba(0,0,0,0.02)')
        input_border = styles.get('borderColor', 'rgba(0,0,0,0.1)')
        input_text_color = styles.get('color', 'inherit')
        input_radius = styles.get('borderRadius', '4')
        if str(input_radius).isdigit():
            input_radius = f"{input_radius}px"
            
        extra_attrs = ""
        if content.get('min'): extra_attrs += f" min=\"{content['min']}\""
        if content.get('max'): extra_attrs += f" max=\"{content['max']}\""
        if content.get('minLength'): extra_attrs += f" minlength=\"{content['minLength']}\""
        if content.get('maxLength'): extra_attrs += f" maxlength=\"{content['maxLength']}\""
        if content.get('pattern'): extra_attrs += f" pattern=\"{content['pattern']}\""
        if content.get('defaultValue'): extra_attrs += f" value=\"{content['defaultValue']}\""
        if content.get('required'): extra_attrs += " required"
        if content.get('disabled'): extra_attrs += " disabled"
        
        inner_markup = f"""
        <div style="display: flex; flex-direction: column; gap: 5px; width: {input_width}%;">
            <label style="font-size: 12px; font-weight: bold; color: inherit; margin-bottom: 2px;">{content.get('label', 'Input Label')}</label>
            <input 
                type="{content.get('inputType', 'text')}" 
                placeholder="{content.get('placeholder', '')}" 
                name="{content.get('name', el.get('id', ''))}"
                {extra_attrs}
                style="padding: 8px 12px; border-radius: {input_radius}; border: 1px solid {input_border}; background: {input_bg}; color: {input_text_color}; width: 100%; font-size: 14px; box-sizing: border-box;" 
            />
        </div>
        """
        
    elif el_type == 'form':
        form_bg = styles.get('backgroundColor', '#1e293b')
        form_text_color = styles.get('color', '#ffffff')
        form_padding = styles.get('padding', '20')
        form_radius = styles.get('borderRadius', '8')
        btn_bg = styles.get('buttonBgColor', '#6366f1')
        btn_color = styles.get('buttonTextColor', '#ffffff')
        
        fields = content.get('fields', [
            { 'id': 'field_name', 'type': 'text', 'label': 'Name', 'required': True, 'placeholder': 'Sender Name' },
            { 'id': 'field_email', 'type': 'email', 'label': 'Email Address', 'required': True, 'placeholder': 'Sender Email' },
            { 'id': 'field_message', 'type': 'textarea', 'label': 'Message', 'required': True, 'placeholder': 'Message content...' }
        ])
        
        fields_html = []
        for f in fields:
            required_str = 'required' if f.get('required') else ''
            placeholder_str = f.get('placeholder', '')
            if f.get('type') == 'textarea':
                fields_html.append(f"""
                <div class="form-group">
                    <label>{f.get('label')}</label>
                    <textarea name="{f.get('id')}" {required_str} placeholder="{placeholder_str}" rows="3" style="resize: vertical;"></textarea>
                </div>
                """)
            else:
                fields_html.append(f"""
                <div class="form-group">
                    <label>{f.get('label')}</label>
                    <input type="{f.get('type')}" name="{f.get('id')}" {required_str} placeholder="{placeholder_str}" />
                </div>
                """)
        fields_str = "\n".join(fields_html)
        
        inner_markup = f"""
        <form class="platform-contact-form" data-site-id="{site_id}" style="background: {form_bg}; color: {form_text_color}; padding: {form_padding}px; border-radius: {form_radius}px; width: 100%; box-sizing: border-box;">
            {fields_str}
            <button type="submit" class="form-submit-btn" style="background-color: {btn_bg}; color: {btn_color}; border-radius: 4px; border: none; padding: 10px 18px; font-weight: bold; cursor: pointer; width: 100%;">
                {content.get('buttonText', 'Send Message')}
            </button>
            <div class="form-feedback-message" style="margin-top: 15px; padding: 10px; border-radius: 4px; display: none; font-size: 14px;"></div>
        </form>
        """
        
    elif el_type == 'group':
        children_html = []
        for child_el in el.get('elements', []):
            child_styles = f"position: absolute; left: {child_el.get('x', 0)}px; top: {child_el.get('y', 0)}px; width: {child_el.get('width', 100)}px; height: {child_el.get('height', 50)}px; "
            if child_el.get('styles'):
                child_styles += camel_to_kebab(child_el.get('styles'))
            child_inner = render_compiled_element(child_el, site_id)
            children_html.append(f'<div style="{child_styles}">{child_inner}</div>')
        
        children_str = "\n".join(children_html)
        inner_markup = f"""
        <div style="width: 100%; height: 100%; position: relative;">
            {children_str}
        </div>
        """
        
    wrap_start = ""
    wrap_end = ""
    action = el.get('action')
    if action and action.get('type') and action['type'] != 'none':
        act_type = action.get('type')
        act_val = action.get('value', '')
        subj = action.get('subject', '')
        new_tab = action.get('openInNewTab', False)
        target = '_blank' if new_tab else '_self'
        
        if act_type == 'url':
            wrap_start = f'<a href="{act_val or "#"}" target="{target}" rel="noopener noreferrer" style="text-decoration: none; color: inherit; display: block; width: 100%; height: 100%;">'
            wrap_end = '</a>'
        elif act_type == 'page':
            dest_html = 'index.html' if act_val == 'home' else f'{act_val}.html'
            wrap_start = f'<a href="{dest_html}" style="text-decoration: none; color: inherit; display: block; width: 100%; height: 100%;">'
            wrap_end = '</a>'
        elif act_type == 'anchor':
            wrap_start = f'<a href="#{act_val}" style="text-decoration: none; color: inherit; display: block; width: 100%; height: 100%;">'
            wrap_end = '</a>'
        elif act_type == 'email':
            mail_url = f"mailto:{act_val}"
            if subj:
                mail_url += f"?subject={urllib.parse.quote(subj)}"
            wrap_start = f'<a href="{mail_url}" style="text-decoration: none; color: inherit; display: block; width: 100%; height: 100%;">'
            wrap_end = '</a>'
        elif act_type == 'form':
            wrap_start = '<div onclick="openContactFormModal()" style="cursor: pointer; width: 100%; height: 100%;">'
            wrap_end = '</div>'
            
    return f"""
    <div class="element-wrapper" data-element-id="{el.get('id', '')}" style="{el_styles_str}">
        {wrap_start}
        {inner_markup}
        {wrap_end}
    </div>
    """

def render_element(element, site_id):
    return render_compiled_element(element, site_id)

def compile_layout_to_html(site, page, pages_list):
    """
    Compiles a JSON page layout into static HTML.
    Includes global site styling, custom CSS, navbar for multi-page sites, and contact form handlers.
    """
    layout = migrate_layout(page.layout)
    theme = site.theme or {}
    
    # Global styles from Theme
    bg_color = theme.get('backgroundColor', '#ffffff')
    text_color = theme.get('textColor', '#333333')
    primary_color = theme.get('primaryColor', '#007bff')
    font_family = theme.get('fontFamily', 'Inter, sans-serif')
    
    # Generate Page Title
    page_title = page.meta_title or f"{page.title} | {site.name}"
    meta_desc = page.meta_description or site.description
    
    # Parse custom page specific background if defined
    page_bg_color = bg_color
    try:
        if meta_desc and meta_desc.startswith('{'):
            import json
            settings = json.loads(meta_desc)
            if settings.get('useGlobalBackground') is False:
                page_bg_color = settings.get('backgroundColor', bg_color)
            # Revert meta_desc to description or empty
            meta_desc = site.description or ''
    except Exception:
        pass

    # Generate Navigation menu if there are multiple pages
    nav_html = ""
    if len(pages_list) > 1:
        links = []
        for p in pages_list:
            active_class = "active" if p.slug == page.slug else ""
            url_path = f"/live/{site.subdomain}/" if p.slug == "home" else f"/live/{site.subdomain}/{p.slug}/"
            links.append(f'<a href="{url_path}" class="nav-link {active_class}" style="color: {text_color}; text-decoration: none; margin: 0 15px; font-weight: 500; font-size: 15px;">{p.title}</a>')
        
        links_str = "\n".join(links)
        nav_html = f'''
        <nav style="display: flex; justify-content: space-between; align-items: center; padding: 20px 40px; background-color: rgba(0,0,0,0.02); border-bottom: 1px solid rgba(0,0,0,0.05); z-index: 1000; position: relative;">
            <a href="/live/{site.subdomain}/" style="font-weight: 700; font-size: 20px; text-decoration: none; color: {primary_color};">{site.name}</a>
            <div style="display: flex; align-items: center;">
                {links_str}
            </div>
        </nav>
        '''
        
    # Generate Canvas body
    canvas_html = []
    hover_styles_css = ""
    
    for section in layout:
        sec_styles = section.get('settings', {})
        sec_style_str = camel_to_kebab(sec_styles)
        
        # Gathering hover styles for this section
        for el in section.get('elements', []):
            hover = el.get('hoverStyles')
            if hover:
                hover_rules = []
                if hover.get('backgroundColor'):
                    hover_rules.append(f"background-color: {hover['backgroundColor']} !important;")
                if hover.get('color'):
                    hover_rules.append(f"color: {hover['color']} !important;")
                if hover.get('opacity'):
                    hover_rules.append(f"opacity: {hover['opacity']} !important;")
                if hover.get('transform'):
                    hover_rules.append(f"transform: {hover['transform']} !important;")
                if hover_rules:
                    hover_rules_str = " ".join(hover_rules)
                    hover_styles_css += f"""
                    [data-element-id="{el['id']}"] {{
                        transition: all {hover.get('transitionSpeed', 0.2)}s ease-in-out !important;
                    }}
                    [data-element-id="{el['id']}"]:hover {{
                        {hover_rules_str}
                    }}
                    """

        # Section HTML
        canvas_html.append(f'<section id="{section.get("id", "")}" style="position: relative; width: 100%; {sec_style_str}">')
        container_width = sec_styles.get('containerWidth', '1200px')
        canvas_html.append(f'<div class="container" style="max-width: {container_width}; position: relative; min-height: 550px; margin: 0 auto; box-sizing: border-box;">')
        
        # Flat Elements
        for element in section.get('elements', []):
            canvas_html.append(render_compiled_element(element, site.id))
            
        canvas_html.append('</div>') # end container
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
        :root {{
            --primary: {primary_color};
            --bg-color: {page_bg_color};
            --text-color: {text_color};
            --font-family: {font_family};
        }}
        body {{
            font-family: var(--font-family);
            background-color: var(--bg-color);
            color: var(--text-color);
            line-height: 1.5;
            -webkit-font-smoothing: antialiased;
            box-sizing: border-box;
            overflow-x: hidden;
        }}
        *, *::before, *::after {{
            box-sizing: inherit;
        }}
        img, iframe, video {{
            max-width: 100%;
            height: auto;
        }}
        
        .container {{
            width: 100%;
            margin: 0 auto;
            padding: 0 20px;
        }}

        .element-wrapper {{
            position: absolute;
            display: inline-block;
        }}

        /* Helper button styles */
        .site-builder-btn {{
            transition: all 0.2s ease-in-out;
            border: none;
            cursor: pointer;
            display: inline-block;
        }}
        .site-builder-btn:hover {{
            opacity: 0.9;
        }}
        .site-builder-btn:active {{
            transform: translateY(0);
        }}
        
        /* Navigation active indicator */
        .nav-link.active {{
            border-bottom: 2px solid var(--primary);
            padding-bottom: 4px;
            font-weight: bold;
        }}
        
        /* Forms styling */
        .platform-contact-form {{
            width: 100%;
            padding: 20px;
            background: rgba(255,255,255,0.02);
            border: 1px solid rgba(255,255,255,0.05);
            border-radius: 8px;
        }}
        .form-group {{
            margin-bottom: 12px;
            display: flex;
            flex-direction: column;
            text-align: left;
        }}
        .form-group label {{
            display: block;
            font-size: 12px;
            margin-bottom: 4px;
            font-weight: 600;
        }}
        .form-group input, .form-group textarea {{
            width: 100%;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 6px;
            color: inherit;
            padding: 10px;
            font-family: inherit;
            font-size: 14px;
            box-sizing: border-box;
        }}
        .form-submit-btn {{
            width: 100%;
            padding: 10px 18px;
            font-weight: bold;
            cursor: pointer;
            border: none;
            transition: opacity 0.2s;
        }}
        .form-submit-btn:hover {{
            opacity: 0.9;
        }}

        /* Modal Contact Form Styling */
        .modal-overlay {{
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(15, 23, 42, 0.85);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }}
        .modal-overlay.active {{
            opacity: 1;
            pointer-events: auto;
        }}
        .modal-content {{
            background: #1e293b;
            color: #ffffff;
            width: 100%;
            max-width: 450px;
            padding: 30px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
            position: relative;
        }}
        .modal-close {{
            position: absolute;
            top: 15px;
            right: 15px;
            background: none;
            border: none;
            color: inherit;
            font-size: 18px;
            cursor: pointer;
            opacity: 0.7;
        }}
        .modal-close:hover {{
            opacity: 1;
        }}

        /* Keyframes */
        @keyframes fadeIn {{
            from {{ opacity: 0; }}
            to {{ opacity: 1; }}
        }}
        @keyframes slideUp {{
            from {{ transform: translateY(30px); opacity: 0; }}
            to {{ transform: translateY(0); opacity: 1; }}
        }}
        @keyframes slideDown {{
            from {{ transform: translateY(-30px); opacity: 0; }}
            to {{ transform: translateY(0); opacity: 1; }}
        }}
        @keyframes bounce {{
            0%, 100% {{ transform: translateY(0); }}
            50% {{ transform: translateY(-15px); }}
        }}
        @keyframes spin {{
            from {{ transform: rotate(0deg); }}
            to {{ transform: rotate(360deg); }}
        }}
        @keyframes zoomIn {{
            from {{ transform: scale(0.9); opacity: 0; }}
            to {{ transform: scale(1); opacity: 1; }}
        }}
        @keyframes pulse {{
            0%, 100% {{ transform: scale(1); }}
            50% {{ transform: scale(1.05); }}
        }}

        {hover_styles_css}
        {site.custom_css or ''}
    </style>
    <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body>
    {nav_html}
    <main>
        {compiled_body}
    </main>

    <div id="contact-modal" class="modal-overlay">
        <div class="modal-content">
            <button class="modal-close" onclick="closeContactFormModal()">✕</button>
            <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">Contact Us</h3>
            <p style="font-size: 13px; margin-bottom: 20px; opacity: 0.7;">Please fill out the form below. We will get back to you shortly.</p>
            <form onsubmit="submitContactForm(event)">
                <div class="form-group">
                    <label>Name</label>
                    <input type="text" name="name" required />
                </div>
                <div class="form-group">
                    <label>Email Address</label>
                    <input type="email" name="email" required />
                </div>
                <div class="form-group">
                    <label>Message</label>
                    <textarea name="message" required rows="4" style="resize: none;"></textarea>
                </div>
                <button type="submit" class="form-submit-btn" style="background-color: var(--primary); color: #ffffff; border-radius: 6px;">
                    Submit Message
                </button>
            </form>
        </div>
    </div>
    
    <script>
        // Initialize Lucide Icons
        if (window.lucide) {{
            lucide.createIcons();
        }}

        function openContactFormModal() {{
            document.getElementById('contact-modal').classList.add('active');
        }}
        function closeContactFormModal() {{
            document.getElementById('contact-modal').classList.remove('active');
        }}
        
        // Form submission interceptor
        document.querySelectorAll('.platform-contact-form').forEach(form => {{
            form.addEventListener('submit', function(e) {{
                e.preventDefault();
                
                const siteId = this.getAttribute('data-site-id');
                const name = this.querySelector('input[name="name"]') || this.querySelector('[name*="name"]');
                const email = this.querySelector('input[type="email"]') || this.querySelector('[name*="email"]');
                const message = this.querySelector('textarea') || this.querySelector('[name*="message"]');
                
                const feedbackEl = this.querySelector('.form-feedback-message');
                const submitBtn = this.querySelector('button[type="submit"]');
                
                if (feedbackEl) {{
                    feedbackEl.style.display = 'block';
                    feedbackEl.style.backgroundColor = 'rgba(255,255,255,0.1)';
                    feedbackEl.style.color = '#fff';
                    feedbackEl.innerText = 'Submitting form...';
                }}
                submitBtn.disabled = true;
                
                fetch('/api/public/submit-form/', {{
                    method: 'POST',
                    headers: {{
                        'Content-Type': 'application/json',
                    }},
                    body: JSON.stringify({{
                        site: siteId,
                        name: name ? name.value : '',
                        email: email ? email.value : '',
                        message: message ? message.value : ''
                    }})
                }})
                .then(response => {{
                    if (response.ok) {{
                        return response.json();
                    }}
                    throw new Error('Failed to submit form');
                }})
                .then(data => {{
                    if (feedbackEl) {{
                        feedbackEl.style.backgroundColor = 'rgba(46, 204, 113, 0.15)';
                        feedbackEl.style.color = '#2ecc71';
                        feedbackEl.innerText = 'Thank you! Your message has been sent successfully.';
                    }} else {{
                        alert('Thank you! Your message has been sent successfully.');
                    }}
                    form.reset();
                }})
                .catch(error => {{
                    console.error('Error:', error);
                    if (feedbackEl) {{
                        feedbackEl.style.backgroundColor = 'rgba(231, 76, 60, 0.15)';
                        feedbackEl.style.color = '#e74c3c';
                        feedbackEl.innerText = 'An error occurred. Please try again later.';
                    }} else {{
                        alert('An error occurred. Please try again later.');
                    }}
                }})
                .finally(() => {{
                    submitBtn.disabled = false;
                }});
            }});
        }});

        async function submitContactForm(event) {{
            event.preventDefault();
            const form = event.target;
            const data = {{
                site: {site.id},
                name: form.name.value,
                email: form.email.value,
                message: form.message.value
            }};
            try {{
                const response = await fetch('/api/public/submit-form/', {{
                    method: 'POST',
                    headers: {{
                        'Content-Type': 'application/json'
                    }},
                    body: JSON.stringify(data)
                }});
                if (response.ok) {{
                    alert('Thank you! Your message has been sent successfully.');
                    form.reset();
                    closeContactFormModal();
                }} else {{
                    alert('Oops, something went wrong. Please try again.');
                }}
            }} catch (error) {{
                console.error('Error submitting form:', error);
                alert('Network error. Please try again.');
            }}
        }}

        async function submitInputs(event, endpointUrl) {{
            event.preventDefault();
            const data = {{}};
            const inputs = document.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {{
                if (input.name) {{
                    if (input.type === 'checkbox') {{
                        data[input.name] = input.checked;
                    }} else {{
                        data[input.name] = input.value;
                    }}
                }}
            }});
            const targetUrl = endpointUrl || '/api/public/submit-form/';
            try {{
                const response = await fetch(targetUrl, {{
                    method: 'POST',
                    headers: {{
                        'Content-Type': 'application/json'
                    }},
                    body: JSON.stringify(data)
                }});
                if (response.ok) {{
                    alert('Data submitted successfully!');
                    inputs.forEach(input => {{
                        if (input.type === 'checkbox') input.checked = false;
                        else input.value = '';
                    }});
                }} else {{
                    alert('Failed to submit form.');
                }}
            }} catch (error) {{
                console.error(error);
                alert('Network error.');
            }}
        }}
    </script>
</body>
</html>
'''
    return html
