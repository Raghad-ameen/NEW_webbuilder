/**
 * Smart Component Templates
 * These are pre-built layout blocks that expand into multiple coordinated elements
 */

export const SMART_COMPONENTS = {
  hero: {
    type: 'smart-component',
    componentType: 'hero',
    label: 'Hero Section',
    icon: '🚀',
    description: 'Full-width hero with heading, text, and CTA button',
    defaultStyles: {
      paddingTop: '80',
      paddingBottom: '80',
      backgroundColor: '#0f172a'
    },
    generateElements: (sectionId) => {
      const baseId = `el_${Date.now()}`;
      return [
        {
          id: `${baseId}_heading`,
          type: 'heading',
          content: { tag: 'h1', text: 'Build Something Amazing' },
          styles: {
            fontSize: '48',
            fontWeight: '800',
            color: '#ffffff',
            textAlign: 'center',
            marginBottom: '20',
            width: '800',
            left: '50%',
            transform: 'translateX(-50%)'
          },
          x: 200,
          y: 60,
          width: 800,
          height: 60
        },
        {
          id: `${baseId}_text`,
          type: 'text',
          content: { text: 'Create stunning websites with our intuitive drag-and-drop builder. No coding required.' },
          styles: {
            fontSize: '18',
            color: '#cbd5e1',
            textAlign: 'center',
            lineHeight: '1.6',
            marginBottom: '30',
            width: '600',
            left: '50%',
            transform: 'translateX(-50%)'
          },
          x: 300,
          y: 140,
          width: 600,
          height: 80
        },
        {
          id: `${baseId}_button`,
          type: 'button',
          content: { text: 'Get Started' },
          styles: {
            backgroundColor: '#6366f1',
            color: '#ffffff',
            padding: '14 32',
            borderRadius: '8',
            fontWeight: '600',
            fontSize: '16',
            width: '200',
            left: '50%',
            transform: 'translateX(-50%)'
          },
          x: 500,
          y: 240,
          width: 200,
          height: 50,
          action: { type: 'url', value: '#', openInNewTab: false }
        }
      ];
    }
  },

  featureGrid: {
    type: 'smart-component',
    componentType: 'featureGrid',
    label: 'Feature Grid',
    icon: '📊',
    description: '3-column feature showcase with icons and descriptions',
    defaultStyles: {
      paddingTop: '60',
      paddingBottom: '60',
      backgroundColor: 'transparent'
    },
    generateElements: (sectionId) => {
      const baseId = `el_${Date.now()}`;
      const features = [
        { icon: '⚡', title: 'Lightning Fast', desc: 'Optimized performance for the best user experience.' },
        { icon: '🎨', title: 'Beautiful Design', desc: 'Professional templates that look great on any device.' },
        { icon: '🔒', title: 'Secure & Reliable', desc: 'Enterprise-grade security to keep your data safe.' }
      ];

      return features.flatMap((feature, idx) => {
        const colX = 100 + idx * 350;
        return [
          {
            id: `${baseId}_feature_${idx}`,
            type: 'heading',
            content: { tag: 'h3', text: `${feature.icon} ${feature.title}` },
            styles: {
              fontSize: '22',
              fontWeight: '700',
              color: '#ffffff',
              textAlign: 'center',
              marginBottom: '10',
              width: '300'
            },
            x: colX,
            y: 40,
            width: 300,
            height: 35
          },
          {
            id: `${baseId}_feature_${idx}_desc`,
            type: 'text',
            content: { text: feature.desc },
            styles: {
              fontSize: '15',
              color: '#94a3b8',
              textAlign: 'center',
              lineHeight: '1.6',
              width: '300'
            },
            x: colX,
            y: 85,
            width: 300,
            height: 60
          }
        ];
      });
    }
  },

  navbar: {
    type: 'smart-component',
    componentType: 'navbar',
    label: 'Navigation Bar',
    icon: '🧭',
    description: 'Fixed top navigation with logo and menu links',
    defaultStyles: {
      paddingTop: '0',
      paddingBottom: '0',
      backgroundColor: '#ffffff',
      containerWidth: '1200px'
    },
    isGlobal: true,
    generateElements: (sectionId, allPages) => {
      const baseId = `el_${Date.now()}`;
      const pages = allPages || [];
      
      return [
        {
          id: `${baseId}_logo`,
          type: 'heading',
          content: { tag: 'span', text: 'Your Brand' },
          styles: {
            fontSize: '20',
            fontWeight: '700',
            color: '#6366f1',
            marginBottom: '0'
          },
          x: 0,
          y: 20,
          width: 150,
          height: 30
        },
        {
          id: `${baseId}_nav_links`,
          type: 'text',
          content: { 
            text: pages.map((p, i) => p.title).join('  ·  ') || 'Home  ·  About  ·  Services  ·  Contact'
          },
          styles: {
            fontSize: '14',
            color: '#334155',
            textAlign: 'right',
            width: '600',
            left: '50%'
          },
          x: 600,
          y: 25,
          width: 600,
          height: 25
        }
      ];
    }
  },

  footer: {
    type: 'smart-component',
    componentType: 'footer',
    label: 'Footer',
    icon: '📍',
    description: 'Professional footer with copyright and links',
    defaultStyles: {
      paddingTop: '40',
      paddingBottom: '40',
      backgroundColor: '#0f172a'
    },
    generateElements: (sectionId) => {
      const baseId = `el_${Date.now()}`;
      return [
        {
          id: `${baseId}_text`,
          type: 'text',
          content: { text: '© 2024 Your Company. All rights reserved.' },
          styles: {
            fontSize: '14',
            color: '#94a3b8',
            textAlign: 'center',
            width: '400',
            left: '50%',
            transform: 'translateX(-50%)'
          },
          x: 400,
          y: 30,
          width: 400,
          height: 25
        },
        {
          id: `${baseId}_links`,
          type: 'text',
          content: { text: 'Privacy Policy  ·  Terms of Service  ·  Contact Us' },
          styles: {
            fontSize: '13',
            color: '#64748b',
            textAlign: 'center',
            marginTop: '10',
            width: '400',
            left: '50%',
            transform: 'translateX(-50%)'
          },
          x: 400,
          y: 65,
          width: 400,
          height: 25
        }
      ];
    }
  },

  cta: {
    type: 'smart-component',
    componentType: 'cta',
    label: 'Call to Action',
    icon: '📢',
    description: 'Bold CTA section with headline and button',
    defaultStyles: {
      paddingTop: '60',
      paddingBottom: '60',
      backgroundColor: '#6366f1'
    },
    generateElements: (sectionId) => {
      const baseId = `el_${Date.now()}`;
      return [
        {
          id: `${baseId}_heading`,
          type: 'heading',
          content: { tag: 'h2', text: 'Ready to Get Started?' },
          styles: {
            fontSize: '36',
            fontWeight: '700',
            color: '#ffffff',
            textAlign: 'center',
            marginBottom: '15',
            width: '600',
            left: '50%',
            transform: 'translateX(-50%)'
          },
          x: 300,
          y: 40,
          width: 600,
          height: 45
        },
        {
          id: `${baseId}_text`,
          type: 'text',
          content: { text: 'Join thousands of satisfied customers building amazing websites.' },
          styles: {
            fontSize: '16',
            color: '#e0e7ff',
            textAlign: 'center',
            marginBottom: '25',
            width: '500',
            left: '50%',
            transform: 'translateX(-50%)'
          },
          x: 350,
          y: 100,
          width: 500,
          height: 50
        },
        {
          id: `${baseId}_button`,
          type: 'button',
          content: { text: 'Start Free Trial' },
          styles: {
            backgroundColor: '#ffffff',
            color: '#6366f1',
            padding: '12 28',
            borderRadius: '6',
            fontWeight: '600',
            fontSize: '15',
            width: '180',
            left: '50%',
            transform: 'translateX(-50%)'
          },
          x: 510,
          y: 170,
          width: 180,
          height: 45,
          action: { type: 'url', value: '#', openInNewTab: false }
        }
      ];
    }
  }
};

export const getSmartComponent = (componentType) => {
  return SMART_COMPONENTS[componentType] || null;
};

export const getSmartComponentTypes = () => {
  return Object.entries(SMART_COMPONENTS).map(([key, comp]) => ({
    type: key,
    label: comp.label,
    icon: comp.icon,
    description: comp.description,
    isSmartComponent: true
  }));
};

// Helper to calculate bounding box for a group of elements
export const calculateGroupBounds = (elements) => {
  if (!elements || elements.length === 0) return { x: 0, y: 0, width: 800, height: 400 };
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  elements.forEach(el => {
    const x = el.x || 0;
    const y = el.y || 0;
    const w = el.width || 200;
    const h = el.height || 50;
    
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + w);
    maxY = Math.max(maxY, y + h);
  });
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
};

// Helper to move all elements in a group by delta
export const moveElementGroup = (elements, deltaX, deltaY) => {
  return elements.map(el => ({
    ...el,
    x: (el.x || 0) + deltaX,
    y: (el.y || 0) + deltaY
  }));
};
