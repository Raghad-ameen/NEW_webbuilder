export const TEMPLATES = [
  {
    id: 'saas',
    name: 'SaaS Landing Page',
    description: 'A modern, high-converting startup landing page layout with sections for features, pricing, and contact.',
    thumbnail: '🚀',
    theme: {
      backgroundColor: '#0b0f19',
      textColor: '#f3f4f6',
      primaryColor: '#6366f1',
      fontFamily: 'Outfit, sans-serif'
    },
    pages: [
      {
        title: 'Home',
        slug: 'home',
        layout: [
          {
            id: 'sec_hero',
            type: 'section',
            settings: {
              backgroundColor: '#0b0f19',
              textColor: '#f3f4f6',
              paddingTop: '100px',
              paddingBottom: '100px',
              containerWidth: '1100px'
            },
            rows: [
              {
                id: 'row_hero',
                settings: {},
                columns: [
                  {
                    id: 'col_hero_content',
                    settings: { width: '12', textAlign: 'center' },
                    elements: [
                      {
                        id: 'el_hero_tag',
                        type: 'text',
                        content: { text: 'LAUNCHING SOON' },
                        styles: { fontSize: '14', color: '#6366f1', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '16px' }
                      },
                      {
                        id: 'el_hero_title',
                        type: 'heading',
                        content: { tag: 'h1', text: 'Build Websites Faster Than Ever' },
                        styles: { fontSize: '56', color: '#ffffff', fontWeight: '800', marginBottom: '24px', lineHeight: '1.2' }
                      },
                      {
                        id: 'el_hero_desc',
                        type: 'text',
                        content: { text: 'Create high-performance, responsive, and stunning websites visually. No code required. Deploy with one click.' },
                        styles: { fontSize: '18', color: '#9ca3af', marginBottom: '36px', maxWidth: '650px', marginLeft: 'auto', marginRight: 'auto' }
                      },
                      {
                        id: 'el_hero_btn',
                        type: 'button',
                        content: { text: 'Start Building Free', link: '#features' },
                        styles: { backgroundColor: '#6366f1', color: '#ffffff', padding: '14px 28px', borderRadius: '8px', fontSize: '16', fontWeight: 'bold' }
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            id: 'sec_features',
            type: 'section',
            settings: {
              backgroundColor: '#111827',
              textColor: '#f3f4f6',
              paddingTop: '80px',
              paddingBottom: '80px',
              containerWidth: '1200px'
            },
            rows: [
              {
                id: 'row_feat_header',
                settings: { marginBottom: '50px' },
                columns: [
                  {
                    id: 'col_feat_header',
                    settings: { width: '12', textAlign: 'center' },
                    elements: [
                      {
                        id: 'el_feat_title',
                        type: 'heading',
                        content: { tag: 'h2', text: 'Stunning Features' },
                        styles: { fontSize: '36', color: '#ffffff', marginBottom: '16px' }
                      },
                      {
                        id: 'el_feat_subtitle',
                        type: 'text',
                        content: { text: 'Everything you need to design, optimize, and launch your online presence.' },
                        styles: { fontSize: '16', color: '#9ca3af' }
                      }
                    ]
                  }
                ]
              },
              {
                id: 'row_feat_grid',
                settings: {},
                columns: [
                  {
                    id: 'col_feat_1',
                    settings: { width: '4', padding: '24px', backgroundColor: '#1f2937', borderRadius: '8px' },
                    elements: [
                      {
                        id: 'el_feat1_h',
                        type: 'heading',
                        content: { tag: 'h3', text: '⚡ Drag & Drop' },
                        styles: { fontSize: '20', color: '#ffffff', marginBottom: '12px' }
                      },
                      {
                        id: 'el_feat1_p',
                        type: 'text',
                        content: { text: 'Move elements, customize spacing, and align layouts on our responsive visual grid canvas.' },
                        styles: { fontSize: '14', color: '#9ca3af' }
                      }
                    ]
                  },
                  {
                    id: 'col_feat_2',
                    settings: { width: '4', padding: '24px', backgroundColor: '#1f2937', borderRadius: '8px' },
                    elements: [
                      {
                        id: 'el_feat2_h',
                        type: 'heading',
                        content: { tag: 'h3', text: '🎨 Real-time Styling' },
                        styles: { fontSize: '20', color: '#ffffff', marginBottom: '12px' }
                      },
                      {
                        id: 'el_feat2_p',
                        type: 'text',
                        content: { text: 'Adjust colors, background images, shadows, borders, fonts, and responsiveness instantly.' },
                        styles: { fontSize: '14', color: '#9ca3af' }
                      }
                    ]
                  },
                  {
                    id: 'col_feat_3',
                    settings: { width: '4', padding: '24px', backgroundColor: '#1f2937', borderRadius: '8px' },
                    elements: [
                      {
                        id: 'el_feat3_h',
                        type: 'heading',
                        content: { tag: 'h3', text: '📈 Built-in SEO & Forms' },
                        styles: { fontSize: '20', color: '#ffffff', marginBottom: '12px' }
                      },
                      {
                        id: 'el_feat3_p',
                        type: 'text',
                        content: { text: 'Optimize meta headers, capture customer requests with functional forms, and view submissions.' },
                        styles: { fontSize: '14', color: '#9ca3af' }
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            id: 'sec_contact',
            type: 'section',
            settings: {
              backgroundColor: '#0b0f19',
              textColor: '#f3f4f6',
              paddingTop: '80px',
              paddingBottom: '80px',
              containerWidth: '800px'
            },
            rows: [
              {
                id: 'row_contact_h',
                settings: { marginBottom: '30px' },
                columns: [
                  {
                    id: 'col_contact_h',
                    settings: { width: '12', textAlign: 'center' },
                    elements: [
                      {
                        id: 'el_contact_title',
                        type: 'heading',
                        content: { tag: 'h2', text: 'Get In Touch' },
                        styles: { fontSize: '32', color: '#ffffff', marginBottom: '12px' }
                      },
                      {
                        id: 'el_contact_desc',
                        type: 'text',
                        content: { text: 'Have questions? Drop us a line below and we will get back to you.' },
                        styles: { fontSize: '16', color: '#9ca3af' }
                      }
                    ]
                  }
                ]
              },
              {
                id: 'row_contact_form',
                settings: {},
                columns: [
                  {
                    id: 'col_contact_form',
                    settings: { width: '12' },
                    elements: [
                      {
                        id: 'el_contact_f',
                        type: 'form',
                        content: {},
                        styles: { padding: '30px', backgroundColor: '#111827', borderRadius: '12px', border: '1px solid #1f2937' }
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'portfolio',
    name: 'Creative Portfolio',
    description: 'A dark, stylish layout for photographers, designers, and creatives to showcase their visual projects.',
    thumbnail: '🎨',
    theme: {
      backgroundColor: '#09090b',
      textColor: '#fafafa',
      primaryColor: '#10b981',
      fontFamily: 'Outfit, sans-serif'
    },
    pages: [
      {
        title: 'Home',
        slug: 'home',
        layout: [
          {
            id: 'sec_p_hero',
            type: 'section',
            settings: {
              backgroundColor: '#09090b',
              textColor: '#fafafa',
              paddingTop: '120px',
              paddingBottom: '80px',
              containerWidth: '1000px'
            },
            rows: [
              {
                id: 'row_p_hero',
                settings: {},
                columns: [
                  {
                    id: 'col_p_hero',
                    settings: { width: '12' },
                    elements: [
                      {
                        id: 'el_p_tag',
                        type: 'text',
                        content: { text: 'CREATIVE DIRECTOR & DESIGNER' },
                        styles: { fontSize: '12', color: '#10b981', fontWeight: 'bold', letterSpacing: '3px', marginBottom: '20px' }
                      },
                      {
                        id: 'el_p_title',
                        type: 'heading',
                        content: { tag: 'h1', text: 'I build memorable digital experiences.' },
                        styles: { fontSize: '64', color: '#ffffff', fontWeight: 'bold', marginBottom: '24px', lineHeight: '1.1' }
                      },
                      {
                        id: 'el_p_desc',
                        type: 'text',
                        content: { text: 'Hello! I am a visual designer focusing on interactive websites, product interfaces, and premium brand identities.' },
                        styles: { fontSize: '20', color: '#a1a1aa', marginBottom: '40px', maxWidth: '700px' }
                      },
                      {
                        id: 'el_p_btn',
                        type: 'button',
                        content: { text: 'View Projects', link: '#work' },
                        styles: { backgroundColor: '#10b981', color: '#ffffff', padding: '12px 26px', borderRadius: '4px', fontSize: '15', fontWeight: 'bold' }
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            id: 'sec_work',
            type: 'section',
            settings: {
              backgroundColor: '#09090b',
              textColor: '#fafafa',
              paddingTop: '60px',
              paddingBottom: '80px',
              containerWidth: '1200px'
            },
            rows: [
              {
                id: 'row_work_h',
                settings: { marginBottom: '40px' },
                columns: [
                  {
                    id: 'col_work_h',
                    settings: { width: '12' },
                    elements: [
                      {
                        id: 'el_work_title',
                        type: 'heading',
                        content: { tag: 'h2', text: 'Selected Work' },
                        styles: { fontSize: '32', color: '#ffffff', borderBottom: '1px solid #27272a', paddingBottom: '15px' }
                      }
                    ]
                  }
                ]
              },
              {
                id: 'row_work_grid1',
                settings: { marginBottom: '30px' },
                columns: [
                  {
                    id: 'col_w1',
                    settings: { width: '6' },
                    elements: [
                      {
                        id: 'el_w1_img',
                        type: 'image',
                        content: { src: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80', alt: 'Web Project' },
                        styles: { borderRadius: '6px', marginBottom: '15px' }
                      },
                      {
                        id: 'el_w1_title',
                        type: 'heading',
                        content: { tag: 'h3', text: 'Dynamic Interfaces' },
                        styles: { fontSize: '20', color: '#ffffff', marginBottom: '5px' }
                      },
                      {
                        id: 'el_w1_desc',
                        type: 'text',
                        content: { text: 'Interactive Design, Web Development' },
                        styles: { fontSize: '14', color: '#71717a' }
                      }
                    ]
                  },
                  {
                    id: 'col_w2',
                    settings: { width: '6' },
                    elements: [
                      {
                        id: 'el_w2_img',
                        type: 'image',
                        content: { src: 'https://images.unsplash.com/photo-1481487196290-c152efe083f5?auto=format&fit=crop&w=800&q=80', alt: 'Branding Project' },
                        styles: { borderRadius: '6px', marginBottom: '15px' }
                      },
                      {
                        id: 'el_w2_title',
                        type: 'heading',
                        content: { tag: 'h3', text: 'Minimalist Branding' },
                        styles: { fontSize: '20', color: '#ffffff', marginBottom: '5px' }
                      },
                      {
                        id: 'el_w2_desc',
                        type: 'text',
                        content: { text: 'Brand Identity, Creative Guidelines' },
                        styles: { fontSize: '14', color: '#71717a' }
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'restaurant',
    name: 'Cozy Restaurant',
    description: 'A warm, elegant layout featuring custom content grids for restaurant menus and booking inquiry contact forms.',
    thumbnail: '🍔',
    theme: {
      backgroundColor: '#fdfcf7',
      textColor: '#2d2a26',
      primaryColor: '#c2410c',
      fontFamily: 'Playfair Display, Georgia, serif'
    },
    pages: [
      {
        title: 'Home',
        slug: 'home',
        layout: [
          {
            id: 'sec_r_hero',
            type: 'section',
            settings: {
              backgroundColor: '#2d2a26',
              textColor: '#fdfcf7',
              paddingTop: '140px',
              paddingBottom: '140px',
              containerWidth: '1000px'
            },
            rows: [
              {
                id: 'row_r_hero',
                settings: {},
                columns: [
                  {
                    id: 'col_r_hero',
                    settings: { width: '12', textAlign: 'center' },
                    elements: [
                      {
                        id: 'el_r_subtitle',
                        type: 'text',
                        content: { text: 'ESTABLISHED 2026' },
                        styles: { fontSize: '13', color: '#fb923c', letterSpacing: '3px', fontWeight: 'bold', marginBottom: '15px' }
                      },
                      {
                        id: 'el_r_title',
                        type: 'heading',
                        content: { tag: 'h1', text: 'The Craft Kitchen' },
                        styles: { fontSize: '60', color: '#ffffff', marginBottom: '20px', fontFamily: 'Playfair Display, serif' }
                      },
                      {
                        id: 'el_r_desc',
                        type: 'text',
                        content: { text: 'Artisanal recipes prepared with organic, farm-fresh local ingredients.' },
                        styles: { fontSize: '18', color: '#d6d3d1', marginBottom: '35px', fontStyle: 'italic' }
                      },
                      {
                        id: 'el_r_btn',
                        type: 'button',
                        content: { text: 'Reserve a Table', link: '#reserve' },
                        styles: { backgroundColor: '#c2410c', color: '#ffffff', padding: '12px 28px', borderRadius: '0px', fontSize: '15', fontWeight: 'bold' }
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            id: 'sec_menu',
            type: 'section',
            settings: {
              backgroundColor: '#fdfcf7',
              textColor: '#2d2a26',
              paddingTop: '80px',
              paddingBottom: '80px',
              containerWidth: '1000px'
            },
            rows: [
              {
                id: 'row_menu_h',
                settings: { marginBottom: '40px' },
                columns: [
                  {
                    id: 'col_menu_h',
                    settings: { width: '12', textAlign: 'center' },
                    elements: [
                      {
                        id: 'el_menu_title',
                        type: 'heading',
                        content: { tag: 'h2', text: 'Our Menu Favorites' },
                        styles: { fontSize: '36', color: '#2d2a26', marginBottom: '10px' }
                      },
                      {
                        id: 'el_menu_div',
                        type: 'divider',
                        content: {},
                        styles: { maxWidth: '100px', marginLeft: 'auto', marginRight: 'auto', borderTop: '2px solid #c2410c' }
                      }
                    ]
                  }
                ]
              },
              {
                id: 'row_menu_items',
                settings: {},
                columns: [
                  {
                    id: 'col_item1',
                    settings: { width: '6', padding: '15px' },
                    elements: [
                      {
                        id: 'el_item1_h',
                        type: 'heading',
                        content: { tag: 'h3', text: 'Truffle Tagliatelle — $26' },
                        styles: { fontSize: '18', color: '#2d2a26', marginBottom: '8px' }
                      },
                      {
                        id: 'el_item1_d',
                        type: 'text',
                        content: { text: 'Fresh house-made pasta, wild mushrooms, shaved black winter truffles, parmigiano-reggiano.' },
                        styles: { fontSize: '14', color: '#57534e', fontStyle: 'italic' }
                      }
                    ]
                  },
                  {
                    id: 'col_item2',
                    settings: { width: '6', padding: '15px' },
                    elements: [
                      {
                        id: 'el_item2_h',
                        type: 'heading',
                        content: { tag: 'h3', text: 'Organic Roasted Salmon — $32' },
                        styles: { fontSize: '18', color: '#2d2a26', marginBottom: '8px' }
                      },
                      {
                        id: 'el_item2_d',
                        type: 'text',
                        content: { text: 'Crispy skin salmon, asparagus, heirloom cherry tomatoes, lemon dill butter sauce.' },
                        styles: { fontSize: '14', color: '#57534e', fontStyle: 'italic' }
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];
