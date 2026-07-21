f = open('frontend/src/components/Builder.jsx', 'r', encoding='utf-8')
content = f.read()
f.close()

# Fix 1: Add data-slider-config attribute to slider container
old_container = '''<div id="${baseId}_container" style="width: 100%; height: ${sliderHeight}px; position: relative; overflow: hidden; border-radius: inherit;">'''
new_container = '''<div id="${baseId}_container" data-slider-config='${JSON.stringify({ slides, autoPlayInterval: el.content?.autoPlayInterval || 3000, transition, transitionDuration })}' style="width: 100%; height: ${sliderHeight}px; position: relative; overflow: hidden; border-radius: inherit;">'''
content = content.replace(old_container, new_container)

# Fix 2: Update preview script to read from data attribute instead of window.sliderData
old_script = '''        <script>
          // Media Slider Interaction Logic for Preview
          (function() {
            window.sliderData = window.sliderData || {};
            window.sliderControllers = window.sliderControllers || {};
            
            const initSliders = () => {
              const arrowLeft = document.querySelector('[id$="_arrow_left"]');
              if (!arrowLeft) return;
              
              const baseId = arrowLeft.id.replace('_arrow_left', '');
              const sliderInfo = window.sliderData[baseId];
              if (!sliderInfo) return;'''

new_script = '''        <script>
          // Media Slider Interaction Logic for Preview
          (function() {
            window.sliderControllers = window.sliderControllers || {};
            
            const initSliders = () => {
              const container = document.querySelector('[id$="_container"][data-slider-config]');
              if (!container) return;
              
              const baseId = container.id.replace('_container', '');
              let sliderInfo;
              try {
                sliderInfo = JSON.parse(container.getAttribute('data-slider-config'));
              } catch (e) {
                return;
              }'''

content = content.replace(old_script, new_script)

f = open('frontend/src/components/Builder.jsx', 'w', encoding='utf-8')
f.write(content)
f.close()

print("Fixed slider preview interaction")