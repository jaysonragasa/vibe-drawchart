// Properties Panel Management
function updatePropertiesPanel(selectedItems, selectedConnectors, shapes, draw) {
    const propertiesContent = document.getElementById('properties-content');
    
    if (selectedItems.length === 1) {
        const shape = selectedItems[0];
        let content = `<div class="grid grid-cols-2 gap-2">
            <button id="prop-bring-forward" class="p-2 w-full bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 text-sm">Bring Forward</button>
            <button id="prop-bring-front" class="p-2 w-full bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 text-sm">Bring to Front</button>
            <button id="prop-send-backward" class="p-2 w-full bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 text-sm">Send Backward</button>
            <button id="prop-send-back" class="p-2 w-full bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 text-sm">Send to Back</button>
        </div><hr class="border-gray-300 dark:border-gray-600 my-2">`;

        if (shape.type === 'image') {
            content += `<div class="space-y-2"><label class="block text-sm font-medium">Image Source</label><input type="file" id="prop-image-upload" accept="image/*" class="w-full text-sm"></div>
            <div class="space-y-2"><label class="block text-sm font-medium">Image Fit</label><select id="prop-image-fit" class="w-full p-1 border rounded-md bg-white dark:bg-gray-700"><option value="fill">Fill</option><option value="aspectFit">Aspect Fit</option><option value="aspectFill">Aspect Fill</option><option value="center">Center</option></select></div>
            <div class="space-y-2"><label class="block text-sm font-medium">Opacity (${Math.round((shape.opacity || 1) * 100)}%)</label><input type="range" id="prop-opacity" min="0" max="1" step="0.05" class="w-full" value="${shape.opacity || 1}"></div>`;
        } else {
            content += `<div class="space-y-2"><label class="block text-sm font-medium">Text</label><textarea id="prop-text" class="w-full p-1 border rounded-md bg-white dark:bg-gray-700">${shape.text}</textarea></div>
            <div class="space-y-2"><label class="block text-sm font-medium">Font Size</label><input type="number" id="prop-font-size" class="w-full p-1 border rounded-md bg-white dark:bg-gray-700" value="${shape.fontSize}"></div>
            <div class="space-y-2"><label class="block text-sm font-medium">Text Color</label><input type="color" id="prop-text-color" class="w-full h-8 p-1 border rounded-md" value="${shape.textColor}"></div>`;
        }

        if (shape.type !== 'text' && shape.type !== 'image') {
            content += `<div class="space-y-2"><label class="block text-sm font-medium">Fill Color</label><div class="flex items-center space-x-2"><input type="checkbox" id="prop-fill-toggle" ${shape.fill ? 'checked' : ''}><input type="color" id="prop-fill-color" class="w-full h-8 p-1 border rounded-md" value="${shape.fillColor}"></div></div>
            <div class="space-y-2"><label class="block text-sm font-medium">Border Color</label><div class="flex items-center space-x-2"><input type="checkbox" id="prop-border-toggle" ${shape.border ? 'checked' : ''}><input type="color" id="prop-border-color" class="w-full h-8 p-1 border rounded-md" value="${shape.borderColor}"></div></div>
            <div class="space-y-2"><label class="block text-sm font-medium">Border Width</label><input type="number" id="prop-border-width" class="w-full p-1 border rounded-md bg-white dark:bg-gray-700" value="${shape.borderWidth}"></div>`;
            if (shape.type === 'rectangle') content += `<div class="space-y-2"><label class="block text-sm font-medium">Roundness</label><input type="number" id="prop-border-radius" class="w-full p-1 border rounded-md bg-white dark:bg-gray-700" value="${shape.borderRadius || 0}" min="0"></div>`;
            content += `<div class="space-y-2"><label class="block text-sm font-medium">Opacity (${Math.round((shape.opacity || 1) * 100)}%)</label><input type="range" id="prop-opacity" min="0" max="1" step="0.05" class="w-full" value="${shape.opacity || 1}"></div>`;
        }
        if (shape.type === 'pie') content += `<div class="space-y-2"><label class="block text-sm font-medium">Angle (${shape.angle}°)</label><input type="range" id="prop-angle" min="0" max="360" class="w-full" value="${shape.angle}"></div>`;
        content += `<div class="space-y-2"><label class="flex items-center space-x-2"><input type="checkbox" id="prop-allow-connections" ${shape.allowConnections !== false ? 'checked' : ''}><span class="text-sm font-medium">Allow Connections</span></label></div>`;
        
        propertiesContent.innerHTML = content;

        document.getElementById('prop-bring-forward')?.addEventListener('click', () => { const i = shapes.findIndex(s => s.id === shape.id); if (i > -1 && i < shapes.length - 1) [shapes[i], shapes[i + 1]] = [shapes[i + 1], shapes[i]]; draw(); });
        document.getElementById('prop-send-backward')?.addEventListener('click', () => { const i = shapes.findIndex(s => s.id === shape.id); if (i > 0) [shapes[i], shapes[i - 1]] = [shapes[i - 1], shapes[i]]; draw(); });
        document.getElementById('prop-bring-front')?.addEventListener('click', () => { const i = shapes.findIndex(s => s.id === shape.id); if (i > -1) { shapes.splice(i, 1); shapes.push(shape); draw(); } });
        document.getElementById('prop-send-back')?.addEventListener('click', () => { const i = shapes.findIndex(s => s.id === shape.id); if (i > 0) { shapes.splice(i, 1); shapes.unshift(shape); draw(); } });

        if (shape.type === 'image') {
            document.getElementById('prop-image-upload')?.addEventListener('change', e => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onload = ev => { shape.imageSrc = ev.target.result; shape.imageElem = null; draw(); }; reader.readAsDataURL(file); } });
            document.getElementById('prop-image-fit')?.addEventListener('change', e => { shape.imageFit = e.target.value; draw(); });
            document.getElementById('prop-opacity')?.addEventListener('input', e => { shape.opacity = parseFloat(e.target.value); e.target.previousElementSibling.innerText = `Opacity (${Math.round(shape.opacity * 100)}%)`; draw(); });
        } else {
            document.getElementById('prop-text')?.addEventListener('input', e => { shape.text = e.target.value; draw(); });
            document.getElementById('prop-font-size')?.addEventListener('input', e => { shape.fontSize = parseInt(e.target.value); draw(); });
            document.getElementById('prop-text-color')?.addEventListener('input', e => { shape.textColor = e.target.value; draw(); });
        }

        if (shape.type !== 'text' && shape.type !== 'image') {
            document.getElementById('prop-fill-color')?.addEventListener('input', e => { shape.fillColor = e.target.value; draw(); });
            document.getElementById('prop-fill-toggle')?.addEventListener('change', e => { shape.fill = e.target.checked; draw(); });
            document.getElementById('prop-border-color')?.addEventListener('input', e => { shape.borderColor = e.target.value; draw(); });
            document.getElementById('prop-border-toggle')?.addEventListener('change', e => { shape.border = e.target.checked; draw(); });
            document.getElementById('prop-border-width')?.addEventListener('input', e => { shape.borderWidth = parseInt(e.target.value); draw(); });
            document.getElementById('prop-opacity')?.addEventListener('input', e => { shape.opacity = parseFloat(e.target.value); e.target.previousElementSibling.innerText = `Opacity (${Math.round(shape.opacity * 100)}%)`; draw(); });
            document.getElementById('prop-border-radius')?.addEventListener('input', e => { shape.borderRadius = parseInt(e.target.value) || 0; draw(); });
        }
        if (shape.type === 'pie') document.getElementById('prop-angle')?.addEventListener('input', e => { shape.angle = parseInt(e.target.value); e.target.previousElementSibling.innerText = `Angle (${shape.angle}°)`; draw(); });
        document.getElementById('prop-allow-connections')?.addEventListener('change', e => { shape.allowConnections = e.target.checked; draw(); });
    } else if (selectedConnectors.length === 1) {
        const connector = selectedConnectors[0];
        propertiesContent.innerHTML = `<div class="space-y-2"><label class="block text-sm font-medium">Connector Color</label><input type="color" id="prop-connector-color" class="w-full h-8 p-1 border rounded-md" value="${connector.color || '#dddddd'}"></div>
        <div class="space-y-2"><label class="block text-sm font-medium">Thickness</label><input type="number" id="prop-connector-thickness" class="w-full p-1 border rounded-md bg-white dark:bg-gray-700" value="${connector.thickness || 2}" min="1"></div>
        <div class="space-y-2"><label class="block text-sm font-medium">Line Style</label><select id="prop-connector-style" class="w-full p-1 border rounded-md bg-white dark:bg-gray-700"><option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option></select></div>
        <div class="space-y-2"><label class="block text-sm font-medium">Line Type</label><select id="prop-connector-type" class="w-full p-1 border rounded-md bg-white dark:bg-gray-700"><option value="line">Line</option><option value="curve">Curve</option></select></div>`;
        document.getElementById('prop-connector-color')?.addEventListener('input', e => { connector.color = e.target.value; draw(); });
        document.getElementById('prop-connector-thickness')?.addEventListener('input', e => { connector.thickness = parseInt(e.target.value) || 1; draw(); });
        document.getElementById('prop-connector-style')?.addEventListener('change', e => { connector.lineStyle = e.target.value; draw(); });
        document.getElementById('prop-connector-type')?.addEventListener('change', e => { connector.lineType = e.target.value; draw(); });
    } else {
        propertiesContent.innerHTML = `<p class="text-gray-600 dark:text-gray-400">${selectedItems.length > 1 ? selectedItems.length + ' items selected.' : 'Select an object.'}</p>`;
    }
}
