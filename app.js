const FlowChartApp = (function() {
    const GRID_SIZE = 20;
    const MIN_NODE_SIZE = 20;
    const DEFAULT_NODE_WIDTH = 100;
    const DEFAULT_NODE_HEIGHT = 100;
    const ARROW_SIZE = 10;

    let canvas, ctx;
    let canvasWidth, canvasHeight;
    let nodes = [];
    let edges = [];
    let curves = [];
    let selectedNode = null;
    let selectedEdge = null;
    let selectedCurve = null;
    let hoveredNode = null;
    let hoveredEdge = null;
    let isDragging = false;
    let isConnecting = false;
    let isDrawing = false;
    let connectStartNode = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let currentTool = 'select';
    let currentShape = null;
    let zoom = 1;
    let panX = 0;
    let panY = 0;
    let isPanning = false;
    let lastPanX = 0;
    let lastPanY = 0;
    let history = [];
    let historyIndex = -1;
    let nodeIdCounter = 0;
    let edgeIdCounter = 0;
    let curveIdCounter = 0;
    let drawPoints = [];
    let documentContent = null;
    let diagramBackground = '#0D0D0D';
    let diagramTheme = 'modern';

    let settings = {
        aiMode: 'builtin',
        apiEndpoint: '',
        apiKey: '',
        modelName: '',
        showGrid: true,
        snapToGrid: true
    };

    const nodeStyles = {
        start: { fillColor: '#444444', strokeColor: '#666666', textColor: '#FFFFFF', borderRadius: 30 },
        process: { fillColor: '#333333', strokeColor: '#555555', textColor: '#FFFFFF', borderRadius: 8 },
        decision: { fillColor: '#3A3A3A', strokeColor: '#5A5A5A', textColor: '#FFFFFF', borderRadius: 0 },
        data: { fillColor: '#4A4A4A', strokeColor: '#6A6A6A', textColor: '#FFFFFF', borderRadius: 8, skew: true },
        circle: { fillColor: '#2A2A2A', strokeColor: '#4A4A4A', textColor: '#FFFFFF', borderRadius: 50 },
        rectangle: { fillColor: '#222222', strokeColor: '#444444', textColor: '#FFFFFF', borderRadius: 4 },
        triangle: { fillColor: '#3A3A3A', strokeColor: '#5A5A5A', textColor: '#FFFFFF', borderRadius: 0 },
        star: { fillColor: '#444444', strokeColor: '#666666', textColor: '#FFFFFF', borderRadius: 0 },
        sun: { fillColor: '#FFFFFF', strokeColor: '#CCCCCC', textColor: '#1A1A1A', borderRadius: 50 },
        cloud: { fillColor: '#F5F5F5', strokeColor: '#DDDDDD', textColor: '#333333', borderRadius: 20 },
        leaf: { fillColor: '#333333', strokeColor: '#555555', textColor: '#FFFFFF', borderRadius: 0 },
        drop: { fillColor: '#2A2A2A', strokeColor: '#4A4A4A', textColor: '#FFFFFF', borderRadius: 0 },
        cell: { fillColor: '#3A3A3A', strokeColor: '#5A5A5A', textColor: '#FFFFFF', borderRadius: 50 },
        bacteria: { fillColor: '#2A2A2A', strokeColor: '#4A4A4A', textColor: '#FFFFFF', borderRadius: 0 },
        dna: { fillColor: '#333333', strokeColor: '#555555', textColor: '#FFFFFF', borderRadius: 8 },
        heart: { fillColor: '#444444', strokeColor: '#666666', textColor: '#FFFFFF', borderRadius: 0 },
        arrow: { fillColor: '#333333', strokeColor: '#555555', textColor: '#FFFFFF', borderRadius: 0 },
        line: { fillColor: 'transparent', strokeColor: '#666666', textColor: '#FFFFFF', borderRadius: 0 },
        text: { fillColor: '#1A1A1A', strokeColor: '#333333', textColor: '#FFFFFF', borderRadius: 8 }
    };

    function init() {
        canvas = document.getElementById('mainCanvas');
        ctx = canvas.getContext('2d');
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        loadSettings();
        bindEvents();
        render();
        saveHistory();
        
        setStatus('就绪 - 输入描述或上传文档，点击发送按钮生成图表');
    }

    function resizeCanvas() {
        const wrapper = document.getElementById('canvasWrapper');
        canvasWidth = wrapper.clientWidth;
        canvasHeight = wrapper.clientHeight;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        render();
    }

    function bindEvents() {
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('dblclick', handleDoubleClick);
        canvas.addEventListener('wheel', handleWheel);
        canvas.addEventListener('contextmenu', handleContextMenu);

        document.addEventListener('keydown', handleKeyDown);

        document.querySelectorAll('.shape-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentShape = btn.dataset.shape;
                currentTool = 'shape';
                updateToolButtons();
            });
        });

        document.getElementById('btnSelect').addEventListener('click', () => setTool('select'));
        document.getElementById('btnConnect').addEventListener('click', () => setTool('connect'));
        document.getElementById('btnDraw').addEventListener('click', () => setTool('draw'));

        document.getElementById('btnZoomIn').addEventListener('click', () => setZoom(zoom * 1.2));
        document.getElementById('btnZoomOut').addEventListener('click', () => setZoom(zoom / 1.2));
        document.getElementById('btnZoomReset').addEventListener('click', () => {
            zoom = 1;
            panX = 0;
            panY = 0;
            updateZoomDisplay();
            render();
        });

        document.getElementById('btnUndo').addEventListener('click', undo);
        document.getElementById('btnRedo').addEventListener('click', redo);
        document.getElementById('btnClear').addEventListener('click', clearCanvas);

        document.getElementById('btnGenerate').addEventListener('click', generateFromAI);

        document.getElementById('btnExportPNG').addEventListener('click', exportPNG);
        document.getElementById('btnExportJSON').addEventListener('click', exportJSON);
        document.getElementById('btnImportJSON').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });
        document.getElementById('importFile').addEventListener('change', importJSON);

        document.getElementById('btnSettings').addEventListener('click', () => {
            document.getElementById('settingsModal').classList.add('active');
        });

        document.getElementById('btnHelp').addEventListener('click', () => {
            document.getElementById('helpModal').classList.add('active');
        });

        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.modal').classList.remove('active');
            });
        });

        document.querySelectorAll('input[name="aiMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const customConfig = document.getElementById('customApiConfig');
                customConfig.style.display = e.target.value === 'custom' ? 'block' : 'none';
            });
        });

        document.getElementById('btnSaveSettings').addEventListener('click', saveSettings);

        document.getElementById('fillColor').addEventListener('input', updateSelectedNodeStyle);
        document.getElementById('strokeColor').addEventListener('input', updateSelectedNodeStyle);
        document.getElementById('textColor').addEventListener('input', updateSelectedNodeStyle);
        document.getElementById('strokeWidth').addEventListener('input', updateSelectedNodeStyle);

        document.getElementById('nodeText').addEventListener('input', updateSelectedNodeText);
        document.getElementById('nodeType').addEventListener('change', updateSelectedNodeType);
        document.getElementById('nodeWidth').addEventListener('input', updateSelectedNodeSize);
        document.getElementById('nodeHeight').addEventListener('input', updateSelectedNodeSize);
        document.getElementById('nodeRotation').addEventListener('input', updateSelectedNodeRotation);
        document.getElementById('btnDeleteNode').addEventListener('click', deleteSelectedNode);

        document.getElementById('showGrid').addEventListener('change', (e) => {
            settings.showGrid = e.target.checked;
            document.getElementById('canvasGrid').style.display = e.target.checked ? 'block' : 'none';
        });

        document.getElementById('snapToGrid').addEventListener('change', (e) => {
            settings.snapToGrid = e.target.checked;
        });

        document.querySelectorAll('.ai-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.ai-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.ai-tab-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById('tab' + tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1)).classList.add('active');
            });
        });

        const dropZone = document.getElementById('documentDropZone');
        const fileInput = document.getElementById('documentFile');

        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--primary-color)';
            dropZone.style.background = 'rgba(74, 144, 217, 0.1)';
        });
        dropZone.addEventListener('dragleave', () => {
            dropZone.style.borderColor = '';
            dropZone.style.background = '';
        });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '';
            dropZone.style.background = '';
            handleFileUpload(e.dataTransfer.files[0]);
        });
        fileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
            }
        });

        document.getElementById('btnRemoveDocument').addEventListener('click', () => {
            documentContent = null;
            document.getElementById('documentPreview').style.display = 'none';
            document.getElementById('documentDropZone').style.display = 'block';
        });
    }

    async function handleFileUpload(file) {
        if (!file) return;

        const validTypes = ['.txt', '.md', '.docx'];
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        
        if (!validTypes.includes(ext)) {
            showToast('请上传 .txt, .md 或 .docx 文件', 'error');
            return;
        }

        try {
            let content = '';
            
            if (ext === '.docx') {
                content = await readDocxFile(file);
            } else {
                content = await file.text();
            }

            documentContent = content;
            document.getElementById('documentName').textContent = file.name;
            document.getElementById('documentContent').value = content.substring(0, 500) + (content.length > 500 ? '...' : '');
            document.getElementById('documentDropZone').style.display = 'none';
            document.getElementById('documentPreview').style.display = 'block';
            
            showToast('文档已加载', 'success');
        } catch (error) {
            showToast('文件读取失败: ' + error.message, 'error');
        }
    }

    async function readDocxFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const JSZip = window.JSZip || (await import('https://cdn.jsdelivr.net/npm/jszip@3/+esm')).default;
                    const zip = await JSZip.loadAsync(e.target.result);
                    const docXml = await zip.file('word/document.xml').async('text');
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(docXml, 'text/xml');
                    const textNodes = doc.querySelectorAll('w\\:t, t');
                    const text = Array.from(textNodes).map(n => n.textContent).join('');
                    resolve(text);
                } catch (err) {
                    reject(new Error('无法解析 docx 文件'));
                }
            };
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsArrayBuffer(file);
        });
    }

    function setTool(tool) {
        currentTool = tool;
        currentShape = null;
        document.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('active'));
        updateToolButtons();
        
        if (tool === 'connect') {
            canvas.style.cursor = 'crosshair';
        } else if (tool === 'draw') {
            canvas.style.cursor = 'crosshair';
        } else {
            canvas.style.cursor = 'default';
        }
    }

    function updateToolButtons() {
        document.getElementById('btnSelect').classList.toggle('active', currentTool === 'select');
        document.getElementById('btnConnect').classList.toggle('active', currentTool === 'connect');
        document.getElementById('btnDraw').classList.toggle('active', currentTool === 'draw');
        
        if (currentTool === 'shape') {
            canvas.style.cursor = 'crosshair';
        }
    }

    function handleMouseDown(e) {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - panX) / zoom;
        const y = (e.clientY - rect.top - panY) / zoom;

        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            isPanning = true;
            lastPanX = e.clientX;
            lastPanY = e.clientY;
            canvas.style.cursor = 'grabbing';
            return;
        }

        if (currentTool === 'draw') {
            isDrawing = true;
            drawPoints = [{ x, y }];
            return;
        }

        if (currentTool === 'select' || currentTool === 'shape') {
            const clickedNode = getNodeAtPosition(x, y);
            
            if (clickedNode) {
                selectNode(clickedNode);
                isDragging = true;
                dragOffsetX = x - clickedNode.x;
                dragOffsetY = y - clickedNode.y;
            } else {
                const clickedEdge = getEdgeAtPosition(x, y);
                if (clickedEdge) {
                    selectEdge(clickedEdge);
                } else {
                    deselectAll();
                }
            }
        } else if (currentTool === 'connect') {
            const clickedNode = getNodeAtPosition(x, y);
            if (clickedNode) {
                if (!connectStartNode) {
                    connectStartNode = clickedNode;
                    setStatus('选择目标节点完成连线');
                } else if (connectStartNode !== clickedNode) {
                    const existingEdge = edges.find(e => 
                        (e.from === connectStartNode.id && e.to === clickedNode.id) ||
                        (e.from === clickedNode.id && e.to === connectStartNode.id)
                    );
                    
                    if (!existingEdge) {
                        createEdge(connectStartNode.id, clickedNode.id);
                        saveHistory();
                    }
                    connectStartNode = null;
                    setStatus('连线已创建');
                }
            }
        }

        render();
    }

    function handleMouseMove(e) {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - panX) / zoom;
        const y = (e.clientY - rect.top - panY) / zoom;

        if (isPanning) {
            panX += e.clientX - lastPanX;
            panY += e.clientY - lastPanY;
            lastPanX = e.clientX;
            lastPanY = e.clientY;
            render();
            return;
        }

        if (isDrawing) {
            drawPoints.push({ x, y });
            render();
            return;
        }

        if (isDragging && selectedNode) {
            let newX = x - dragOffsetX;
            let newY = y - dragOffsetY;
            
            if (settings.snapToGrid) {
                newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
                newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
            }
            
            selectedNode.x = newX;
            selectedNode.y = newY;
            render();
            return;
        }

        const node = getNodeAtPosition(x, y);
        const edge = !node ? getEdgeAtPosition(x, y) : null;
        
        if (node !== hoveredNode || edge !== hoveredEdge) {
            hoveredNode = node;
            hoveredEdge = edge;
            render();
        }

        if (node) {
            canvas.style.cursor = currentTool === 'select' ? 'move' : 'pointer';
        } else if (edge) {
            canvas.style.cursor = 'pointer';
        } else {
            canvas.style.cursor = currentTool === 'connect' || currentTool === 'draw' || currentTool === 'shape' ? 'crosshair' : 'default';
        }
    }

    function handleMouseUp(e) {
        if (isPanning) {
            isPanning = false;
            canvas.style.cursor = 'default';
            return;
        }

        if (isDrawing && drawPoints.length > 1) {
            createCurve(drawPoints);
            saveHistory();
            isDrawing = false;
            drawPoints = [];
            render();
            return;
        }
        
        isDrawing = false;
        drawPoints = [];

        if (isDragging && selectedNode) {
            saveHistory();
        }
        
        isDragging = false;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - panX) / zoom;
        const y = (e.clientY - rect.top - panY) / zoom;

        if (currentTool === 'shape' && currentShape && !isDragging) {
            const clickedNode = getNodeAtPosition(x, y);
            if (!clickedNode) {
                let newX = x;
                let newY = y;
                
                if (settings.snapToGrid) {
                    newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
                    newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
                }
                
                createNode(currentShape, newX, newY);
                saveHistory();
            }
        }
    }

    function handleDoubleClick(e) {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - panX) / zoom;
        const y = (e.clientY - rect.top - panY) / zoom;

        const node = getNodeAtPosition(x, y);
        if (node) {
            editTextNode(node);
        }
    }

    function handleWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.25, Math.min(3, zoom * delta));
        
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        panX = mouseX - (mouseX - panX) * (newZoom / zoom);
        panY = mouseY - (mouseY - panY) * (newZoom / zoom);
        
        zoom = newZoom;
        updateZoomDisplay();
        render();
    }

    function handleContextMenu(e) {
        e.preventDefault();
        
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - panX) / zoom;
        const y = (e.clientY - rect.top - panY) / zoom;

        const node = getNodeAtPosition(x, y);
        const edge = !node ? getEdgeAtPosition(x, y) : null;

        showContextMenu(e.clientX, e.clientY, node, edge);
    }

    function handleKeyDown(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) {
                        redo();
                    } else {
                        undo();
                    }
                    break;
                case 'y':
                    e.preventDefault();
                    redo();
                    break;
                case 's':
                    e.preventDefault();
                    exportJSON();
                    break;
            }
        } else {
            switch (e.key) {
                case 'Delete':
                case 'Backspace':
                    if (selectedNode) {
                        deleteSelectedNode();
                    } else if (selectedEdge) {
                        deleteSelectedEdge();
                    }
                    break;
                case 'Escape':
                    deselectAll();
                    connectStartNode = null;
                    render();
                    break;
            }
        }
    }

    function getNodeAtPosition(x, y) {
        for (let i = nodes.length - 1; i >= 0; i--) {
            const node = nodes[i];
            if (isPointInNode(x, y, node)) {
                return node;
            }
        }
        return null;
    }

    function isPointInNode(x, y, node) {
        const hw = node.width / 2;
        const hh = node.height / 2;
        
        if (node.type === 'decision' || node.type === 'triangle') {
            const dx = Math.abs(x - node.x);
            const dy = Math.abs(y - node.y);
            return (dx / hw + dy / hh) <= 1;
        }
        
        if (node.type === 'circle' || node.type === 'sun' || node.type === 'cell') {
            const dx = x - node.x;
            const dy = y - node.y;
            const r = Math.min(hw, hh);
            return (dx * dx + dy * dy) <= r * r;
        }
        
        return x >= node.x - hw && x <= node.x + hw &&
               y >= node.y - hh && y <= node.y + hh;
    }

    function getEdgeAtPosition(x, y) {
        for (const edge of edges) {
            const fromNode = nodes.find(n => n.id === edge.from);
            const toNode = nodes.find(n => n.id === edge.to);
            
            if (fromNode && toNode) {
                const dist = pointToLineDistance(x, y, fromNode.x, fromNode.y, toNode.x, toNode.y);
                if (dist < 10) {
                    return edge;
                }
            }
        }
        return null;
    }

    function pointToLineDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) param = dot / lenSq;
        
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function createNode(type, x, y, text = '', options = {}) {
        const style = nodeStyles[type] || nodeStyles.process;
        const node = {
            id: ++nodeIdCounter,
            type: type,
            x: x,
            y: y,
            width: options.width || DEFAULT_NODE_WIDTH,
            height: options.height || DEFAULT_NODE_HEIGHT,
            text: text || getDefaultText(type),
            fillColor: options.fillColor || style.fillColor,
            strokeColor: options.strokeColor || style.strokeColor,
            textColor: options.textColor || style.textColor,
            rotation: options.rotation || 0,
            strokeWidth: options.strokeWidth || 2,
            gradient: options.gradient,
            shadow: options.shadow !== undefined ? options.shadow : true,
            icon: options.icon,
            importance: options.importance || 3
        };
        nodes.push(node);
        selectNode(node);
        render();
        return node;
    }

    function getDefaultText(type) {
        const defaults = {
            start: '开始',
            process: '处理',
            decision: '判断',
            data: '数据',
            circle: '',
            rectangle: '',
            triangle: '',
            star: '',
            sun: '太阳',
            cloud: '云',
            leaf: '叶子',
            drop: '水',
            cell: '细胞',
            bacteria: '细菌',
            dna: 'DNA',
            heart: '心脏',
            arrow: '',
            line: '',
            text: '文本'
        };
        return defaults[type] || '';
    }

    function createEdge(fromId, toId, label = '', style = 'solid') {
        const edge = {
            id: ++edgeIdCounter,
            from: fromId,
            to: toId,
            label: label,
            style: style
        };
        edges.push(edge);
        render();
        return edge;
    }

    function createCurve(points) {
        if (points.length < 2) return;
        
        const curve = {
            id: ++curveIdCounter,
            points: [...points],
            strokeColor: document.getElementById('strokeColor').value,
            strokeWidth: parseInt(document.getElementById('strokeWidth').value) || 2
        };
        curves.push(curve);
        render();
        return curve;
    }

    function selectNode(node) {
        selectedNode = node;
        selectedEdge = null;
        selectedCurve = null;
        updatePropertiesPanel();
        document.getElementById('propertiesPanel').classList.add('active');
    }

    function selectEdge(edge) {
        selectedEdge = edge;
        selectedNode = null;
        selectedCurve = null;
        document.getElementById('propertiesPanel').classList.remove('active');
    }

    function deselectAll() {
        selectedNode = null;
        selectedEdge = null;
        selectedCurve = null;
        document.getElementById('propertiesPanel').classList.remove('active');
    }

    function updatePropertiesPanel() {
        if (selectedNode) {
            document.getElementById('nodeText').value = selectedNode.text;
            document.getElementById('nodeType').value = selectedNode.type;
            document.getElementById('nodeWidth').value = selectedNode.width;
            document.getElementById('nodeHeight').value = selectedNode.height;
            document.getElementById('fillColor').value = selectedNode.fillColor;
            document.getElementById('strokeColor').value = selectedNode.strokeColor;
            document.getElementById('textColor').value = selectedNode.textColor;
            document.getElementById('nodeRotation').value = selectedNode.rotation || 0;
        }
    }

    function updateSelectedNodeText() {
        if (selectedNode) {
            selectedNode.text = document.getElementById('nodeText').value;
            render();
        }
    }

    function updateSelectedNodeType() {
        if (selectedNode) {
            const newType = document.getElementById('nodeType').value;
            selectedNode.type = newType;
            const style = nodeStyles[newType];
            selectedNode.fillColor = style.fillColor;
            selectedNode.strokeColor = style.strokeColor;
            selectedNode.textColor = style.textColor;
            updatePropertiesPanel();
            saveHistory();
            render();
        }
    }

    function updateSelectedNodeSize() {
        if (selectedNode) {
            selectedNode.width = Math.max(MIN_NODE_SIZE, parseInt(document.getElementById('nodeWidth').value) || DEFAULT_NODE_WIDTH);
            selectedNode.height = Math.max(MIN_NODE_SIZE, parseInt(document.getElementById('nodeHeight').value) || DEFAULT_NODE_HEIGHT);
            render();
        }
    }

    function updateSelectedNodeRotation() {
        if (selectedNode) {
            selectedNode.rotation = parseInt(document.getElementById('nodeRotation').value) || 0;
            render();
        }
    }

    function updateSelectedNodeStyle() {
        if (selectedNode) {
            selectedNode.fillColor = document.getElementById('fillColor').value;
            selectedNode.strokeColor = document.getElementById('strokeColor').value;
            selectedNode.textColor = document.getElementById('textColor').value;
            selectedNode.strokeWidth = parseInt(document.getElementById('strokeWidth').value) || 2;
            render();
        }
    }

    function deleteSelectedNode() {
        if (selectedNode) {
            edges = edges.filter(e => e.from !== selectedNode.id && e.to !== selectedNode.id);
            nodes = nodes.filter(n => n.id !== selectedNode.id);
            deselectAll();
            saveHistory();
            render();
            setStatus('节点已删除');
        }
    }

    function deleteSelectedEdge() {
        if (selectedEdge) {
            edges = edges.filter(e => e.id !== selectedEdge.id);
            selectedEdge = null;
            saveHistory();
            render();
            setStatus('连线已删除');
        }
    }

    function editTextNode(node) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'node-text-edit';
        input.value = node.text;
        
        const rect = canvas.getBoundingClientRect();
        const screenX = node.x * zoom + panX + rect.left - node.width * zoom / 2;
        const screenY = node.y * zoom + panY + rect.top - node.height * zoom / 2;
        
        input.style.left = screenX + 'px';
        input.style.top = screenY + 'px';
        input.style.width = (node.width * zoom) + 'px';
        input.style.height = (node.height * zoom) + 'px';
        
        document.body.appendChild(input);
        input.focus();
        input.select();
        
        const finishEdit = () => {
            node.text = input.value;
            document.body.removeChild(input);
            saveHistory();
            render();
        };
        
        input.addEventListener('blur', finishEdit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur();
            } else if (e.key === 'Escape') {
                input.value = node.text;
                input.blur();
            }
        });
    }

    function showContextMenu(x, y, node, edge) {
        let existingMenu = document.querySelector('.context-menu');
        if (existingMenu) existingMenu.remove();

        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';

        if (node) {
            menu.innerHTML = `
                <div class="context-menu-item" data-action="edit">
                    <i class="fas fa-edit"></i> 编辑文本
                </div>
                <div class="context-menu-item" data-action="duplicate">
                    <i class="fas fa-copy"></i> 复制节点
                </div>
                <div class="context-menu-divider"></div>
                <div class="context-menu-item" data-action="delete" style="color: var(--danger-color);">
                    <i class="fas fa-trash"></i> 删除节点
                </div>
            `;
        } else if (edge) {
            menu.innerHTML = `
                <div class="context-menu-item" data-action="edit-label">
                    <i class="fas fa-edit"></i> 编辑标签
                </div>
                <div class="context-menu-divider"></div>
                <div class="context-menu-item" data-action="delete" style="color: var(--danger-color);">
                    <i class="fas fa-trash"></i> 删除连线
                </div>
            `;
        } else {
            menu.innerHTML = `
                <div class="context-menu-item" data-action="paste">
                    <i class="fas fa-paste"></i> 粘贴
                </div>
            `;
        }

        document.body.appendChild(menu);
        menu.classList.add('active');

        const handleClick = (e) => {
            const item = e.target.closest('.context-menu-item');
            if (item) {
                const action = item.dataset.action;
                if (node) {
                    switch (action) {
                        case 'edit':
                            editTextNode(node);
                            break;
                        case 'duplicate':
                            const newNode = createNode(node.type, node.x + 20, node.y + 20, node.text);
                            newNode.width = node.width;
                            newNode.height = node.height;
                            newNode.fillColor = node.fillColor;
                            newNode.strokeColor = node.strokeColor;
                            newNode.textColor = node.textColor;
                            newNode.rotation = node.rotation;
                            saveHistory();
                            break;
                        case 'delete':
                            selectNode(node);
                            deleteSelectedNode();
                            break;
                    }
                } else if (edge) {
                    switch (action) {
                        case 'edit-label':
                            const label = prompt('输入连线标签:', edge.label || '');
                            if (label !== null) {
                                edge.label = label;
                                saveHistory();
                                render();
                            }
                            break;
                        case 'delete':
                            selectEdge(edge);
                            deleteSelectedEdge();
                            break;
                    }
                }
            }
            menu.remove();
            document.removeEventListener('click', handleClick);
        };

        setTimeout(() => document.addEventListener('click', handleClick), 0);
    }

    function setZoom(newZoom) {
        zoom = Math.max(0.25, Math.min(3, newZoom));
        updateZoomDisplay();
        render();
    }

    function updateZoomDisplay() {
        document.getElementById('zoomLevel').textContent = Math.round(zoom * 100) + '%';
    }

    function render() {
        ctx.save();
        ctx.fillStyle = diagramBackground;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.restore();
        
        ctx.save();
        ctx.translate(panX, panY);
        ctx.scale(zoom, zoom);

        for (const curve of curves) {
            drawCurve(curve);
        }

        for (const edge of edges) {
            drawEdge(edge);
        }

        for (const node of nodes) {
            drawNode(node);
        }

        if (isDrawing && drawPoints.length > 1) {
            ctx.strokeStyle = document.getElementById('strokeColor').value;
            ctx.lineWidth = parseInt(document.getElementById('strokeWidth').value) || 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(drawPoints[0].x, drawPoints[0].y);
            for (let i = 1; i < drawPoints.length; i++) {
                ctx.lineTo(drawPoints[i].x, drawPoints[i].y);
            }
            ctx.stroke();
        }

        ctx.restore();
    }

    function drawNode(node) {
        const x = node.x;
        const y = node.y;
        const w = node.width;
        const h = node.height;
        const isSelected = selectedNode && selectedNode.id === node.id;
        const isHovered = hoveredNode && hoveredNode.id === node.id;

        ctx.save();

        if (node.rotation) {
            ctx.translate(x, y);
            ctx.rotate(node.rotation * Math.PI / 180);
            ctx.translate(-x, -y);
        }

        if (node.shadow || isSelected || isHovered) {
            ctx.shadowColor = isSelected ? '#4A90D9' : (isHovered ? '#63B3ED' : 'rgba(0,0,0,0.4)');
            ctx.shadowBlur = isSelected ? 15 : (isHovered ? 10 : 8);
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 3;
        }

        let fillStyle = node.fillColor;
        if (node.gradient) {
            const gradientEndColor = lightenColor(node.fillColor, 40);
            let gradient;
            if (node.gradient === 'vertical') {
                gradient = ctx.createLinearGradient(x, y - h/2, x, y + h/2);
            } else if (node.gradient === 'horizontal') {
                gradient = ctx.createLinearGradient(x - w/2, y, x + w/2, y);
            } else {
                gradient = ctx.createLinearGradient(x - w/2, y - h/2, x + w/2, y + h/2);
            }
            gradient.addColorStop(0, node.fillColor);
            gradient.addColorStop(1, gradientEndColor);
            fillStyle = gradient;
        }

        ctx.fillStyle = fillStyle;
        ctx.strokeStyle = isSelected ? '#FFFFFF' : node.strokeColor;
        ctx.lineWidth = isSelected ? 3 : (node.strokeWidth || 2);

        ctx.beginPath();
        
        switch (node.type) {
            case 'start':
                drawRoundedRect(x - w/2, y - h/2, w, h, Math.min(h/2, 30));
                break;
            case 'process':
            case 'database':
            case 'server':
            case 'person':
            case 'gear':
                drawRoundedRect(x - w/2, y - h/2, w, h, 8);
                break;
            case 'decision':
                drawDiamond(x, y, w, h);
                break;
            case 'data':
                drawParallelogram(x, y, w, h);
                break;
            case 'circle':
            case 'cell':
                ctx.arc(x, y, Math.min(w, h) / 2, 0, Math.PI * 2);
                break;
            case 'rectangle':
                drawRoundedRect(x - w/2, y - h/2, w, h, 4);
                break;
            case 'triangle':
                drawTriangle(x, y, w, h);
                break;
            case 'star':
                drawStar(x, y, Math.min(w, h) / 2);
                break;
            case 'sun':
                drawSun(x, y, Math.min(w, h) / 2);
                break;
            case 'cloud':
                drawCloud(x, y, w, h);
                break;
            case 'leaf':
                drawLeaf(x, y, w, h);
                break;
            case 'drop':
                drawDrop(x, y, w, h);
                break;
            case 'bacteria':
                drawBacteria(x, y, w, h);
                break;
            case 'dna':
                drawDNA(x, y, w, h);
                break;
            case 'heart':
                drawHeart(x, y, w, h);
                break;
            case 'arrow':
                drawArrowShape(x, y, w, h);
                break;
            case 'line':
                ctx.moveTo(x - w/2, y);
                ctx.lineTo(x + w/2, y);
                break;
            case 'text':
                drawRoundedRect(x - w/2, y - h/2, w, h, 8);
                break;
            default:
                drawRoundedRect(x - w/2, y - h/2, w, h, 8);
        }

        if (node.type !== 'line') {
            ctx.fill();
        }
        ctx.stroke();
        ctx.restore();

        if (node.icon) {
            drawIcon(node.icon, x, y, w, h, node.textColor);
        }

        if (node.text) {
            ctx.fillStyle = node.textColor;
            const fontSize = Math.min(14, Math.min(w, h) / 4);
            ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const lines = node.text.split('\\n');
            const lineHeight = Math.min(18, h / (lines.length + 1));
            const iconOffset = node.icon ? 15 : 0;
            const startY = y - (lines.length - 1) * lineHeight / 2 + iconOffset;
            
            lines.forEach((line, i) => {
                ctx.fillText(line, x, startY + i * lineHeight, w - 10);
            });
        }

        if (isSelected) {
            drawResizeHandles(node);
        }
    }

    function lightenColor(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (
            0x1000000 +
            (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
            (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
            (B < 255 ? (B < 1 ? 0 : B) : 255)
        ).toString(16).slice(1);
    }

    function drawIcon(iconName, x, y, w, h, color) {
        const iconSize = Math.min(20, Math.min(w, h) / 4);
        const iconY = y - h/4;
        ctx.save();
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        switch (iconName) {
            case 'database':
                ctx.beginPath();
                ctx.ellipse(x, iconY, iconSize * 0.8, iconSize * 0.4, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x - iconSize * 0.8, iconY);
                ctx.lineTo(x - iconSize * 0.8, iconY + iconSize * 0.6);
                ctx.ellipse(x, iconY + iconSize * 0.6, iconSize * 0.8, iconSize * 0.4, 0, Math.PI, 0);
                ctx.lineTo(x + iconSize * 0.8, iconY);
                ctx.stroke();
                break;
            case 'server':
                ctx.beginPath();
                ctx.rect(x - iconSize * 0.7, iconY - iconSize * 0.5, iconSize * 1.4, iconSize);
                ctx.stroke();
                ctx.fillRect(x - iconSize * 0.5, iconY - iconSize * 0.3, iconSize * 0.3, iconSize * 0.15);
                ctx.fillRect(x + iconSize * 0.1, iconY - iconSize * 0.3, iconSize * 0.3, iconSize * 0.15);
                break;
            case 'cloud':
                ctx.beginPath();
                ctx.arc(x - iconSize * 0.5, iconY, iconSize * 0.4, 0, Math.PI * 2);
                ctx.arc(x, iconY - iconSize * 0.2, iconSize * 0.5, 0, Math.PI * 2);
                ctx.arc(x + iconSize * 0.5, iconY, iconSize * 0.4, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'user':
            case 'person':
                ctx.beginPath();
                ctx.arc(x, iconY - iconSize * 0.2, iconSize * 0.35, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x - iconSize * 0.5, iconY + iconSize * 0.6);
                ctx.quadraticCurveTo(x - iconSize * 0.5, iconY + iconSize * 0.1, x, iconY + iconSize * 0.1);
                ctx.quadraticCurveTo(x + iconSize * 0.5, iconY + iconSize * 0.1, x + iconSize * 0.5, iconY + iconSize * 0.6);
                ctx.stroke();
                break;
            case 'file':
                ctx.beginPath();
                ctx.moveTo(x - iconSize * 0.5, iconY - iconSize * 0.5);
                ctx.lineTo(x + iconSize * 0.2, iconY - iconSize * 0.5);
                ctx.lineTo(x + iconSize * 0.5, iconY - iconSize * 0.2);
                ctx.lineTo(x + iconSize * 0.5, iconY + iconSize * 0.5);
                ctx.lineTo(x - iconSize * 0.5, iconY + iconSize * 0.5);
                ctx.closePath();
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x + iconSize * 0.2, iconY - iconSize * 0.5);
                ctx.lineTo(x + iconSize * 0.2, iconY - iconSize * 0.2);
                ctx.lineTo(x + iconSize * 0.5, iconY - iconSize * 0.2);
                ctx.stroke();
                break;
            case 'gear':
            case 'settings':
                const teeth = 8;
                const outerR = iconSize * 0.5;
                const innerR = iconSize * 0.35;
                const holeR = iconSize * 0.15;
                ctx.beginPath();
                for (let i = 0; i < teeth * 2; i++) {
                    const r = i % 2 === 0 ? outerR : innerR;
                    const angle = (i * Math.PI) / teeth - Math.PI / 2;
                    const px = x + r * Math.cos(angle);
                    const py = iconY + r * Math.sin(angle);
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(x, iconY, holeR, 0, Math.PI * 2);
                ctx.stroke();
                break;
            case 'globe':
                ctx.beginPath();
                ctx.arc(x, iconY, iconSize * 0.5, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.ellipse(x, iconY, iconSize * 0.5, iconSize * 0.2, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x, iconY - iconSize * 0.5);
                ctx.lineTo(x, iconY + iconSize * 0.5);
                ctx.stroke();
                break;
            case 'lock':
                ctx.beginPath();
                ctx.rect(x - iconSize * 0.5, iconY - iconSize * 0.1, iconSize, iconSize * 0.6);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(x, iconY - iconSize * 0.1, iconSize * 0.35, Math.PI, 0);
                ctx.stroke();
                break;
            case 'mail':
                ctx.beginPath();
                ctx.rect(x - iconSize * 0.6, iconY - iconSize * 0.35, iconSize * 1.2, iconSize * 0.7);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x - iconSize * 0.6, iconY - iconSize * 0.35);
                ctx.lineTo(x, iconY);
                ctx.lineTo(x + iconSize * 0.6, iconY - iconSize * 0.35);
                ctx.stroke();
                break;
            case 'phone':
                ctx.beginPath();
                ctx.roundRect(x - iconSize * 0.4, iconY - iconSize * 0.6, iconSize * 0.8, iconSize * 1.2, 3);
                ctx.stroke();
                break;
            case 'home':
                ctx.beginPath();
                ctx.moveTo(x, iconY - iconSize * 0.5);
                ctx.lineTo(x + iconSize * 0.5, iconY);
                ctx.lineTo(x + iconSize * 0.4, iconY);
                ctx.lineTo(x + iconSize * 0.4, iconY + iconSize * 0.4);
                ctx.lineTo(x - iconSize * 0.4, iconY + iconSize * 0.4);
                ctx.lineTo(x - iconSize * 0.4, iconY);
                ctx.lineTo(x - iconSize * 0.5, iconY);
                ctx.closePath();
                ctx.stroke();
                break;
        }
        ctx.restore();
    }

    function drawRoundedRect(x, y, w, h, r) {
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    function drawDiamond(cx, cy, w, h) {
        ctx.moveTo(cx, cy - h/2);
        ctx.lineTo(cx + w/2, cy);
        ctx.lineTo(cx, cy + h/2);
        ctx.lineTo(cx - w/2, cy);
        ctx.closePath();
    }

    function drawTriangle(cx, cy, w, h) {
        ctx.moveTo(cx, cy - h/2);
        ctx.lineTo(cx + w/2, cy + h/2);
        ctx.lineTo(cx - w/2, cy + h/2);
        ctx.closePath();
    }

    function drawParallelogram(cx, cy, w, h) {
        const skew = w * 0.15;
        ctx.moveTo(cx - w/2 + skew, cy - h/2);
        ctx.lineTo(cx + w/2 + skew, cy - h/2);
        ctx.lineTo(cx + w/2 - skew, cy + h/2);
        ctx.lineTo(cx - w/2 - skew, cy + h/2);
        ctx.closePath();
    }

    function drawStar(cx, cy, r) {
        const spikes = 5;
        const outerRadius = r;
        const innerRadius = r * 0.5;
        let rot = Math.PI / 2 * 3;
        const step = Math.PI / spikes;

        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
            rot += step;
            ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
            rot += step;
        }
        ctx.closePath();
    }

    function drawSun(cx, cy, r) {
        ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        const rays = 8;
        for (let i = 0; i < rays; i++) {
            const angle = (i / rays) * Math.PI * 2;
            const x1 = cx + Math.cos(angle) * r * 0.7;
            const y1 = cy + Math.sin(angle) * r * 0.7;
            const x2 = cx + Math.cos(angle) * r;
            const y2 = cy + Math.sin(angle) * r;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
    }

    function drawCloud(cx, cy, w, h) {
        const r = Math.min(w, h) * 0.25;
        ctx.arc(cx - w * 0.2, cy, r, 0, Math.PI * 2);
        ctx.arc(cx + w * 0.1, cy - h * 0.15, r * 1.2, 0, Math.PI * 2);
        ctx.arc(cx + w * 0.25, cy + h * 0.1, r * 0.9, 0, Math.PI * 2);
        ctx.arc(cx - w * 0.05, cy + h * 0.15, r * 0.8, 0, Math.PI * 2);
    }

    function drawLeaf(cx, cy, w, h) {
        ctx.moveTo(cx, cy - h/2);
        ctx.bezierCurveTo(cx + w/2, cy - h/4, cx + w/2, cy + h/4, cx, cy + h/2);
        ctx.bezierCurveTo(cx - w/2, cy + h/4, cx - w/2, cy - h/4, cx, cy - h/2);
        ctx.closePath();
    }

    function drawDrop(cx, cy, w, h) {
        ctx.moveTo(cx, cy - h/2);
        ctx.bezierCurveTo(cx + w/2, cy, cx + w/2, cy + h/3, cx, cy + h/2);
        ctx.bezierCurveTo(cx - w/2, cy + h/3, cx - w/2, cy, cx, cy - h/2);
        ctx.closePath();
    }

    function drawBacteria(cx, cy, w, h) {
        ctx.ellipse(cx, cy, w/2, h/2, 0, 0, Math.PI * 2);
    }

    function drawDNA(cx, cy, w, h) {
        const hw = w / 2;
        ctx.moveTo(cx - hw, cy - h/2);
        ctx.bezierCurveTo(cx + hw, cy - h/3, cx - hw, cy - h/6, cx + hw, cy);
        ctx.bezierCurveTo(cx - hw, cy + h/6, cx + hw, cy + h/3, cx - hw, cy + h/2);
    }

    function drawHeart(cx, cy, w, h) {
        const hw = w / 2;
        const hh = h / 2;
        ctx.moveTo(cx, cy + hh * 0.7);
        ctx.bezierCurveTo(cx - hw * 1.2, cy, cx - hw * 1.2, cy - hh * 0.7, cx, cy - hh * 0.3);
        ctx.bezierCurveTo(cx + hw * 1.2, cy - hh * 0.7, cx + hw * 1.2, cy, cx, cy + hh * 0.7);
        ctx.closePath();
    }

    function drawArrowShape(cx, cy, w, h) {
        const hw = w / 2;
        const hh = h / 2;
        ctx.moveTo(cx - hw, cy - hh * 0.4);
        ctx.lineTo(cx, cy - hh);
        ctx.lineTo(cx + hw, cy);
        ctx.lineTo(cx, cy + hh);
        ctx.lineTo(cx - hw, cy + hh * 0.4);
        ctx.closePath();
    }

    function drawCurve(curve) {
        if (curve.points.length < 2) return;
        
        ctx.strokeStyle = curve.strokeColor;
        ctx.lineWidth = curve.strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(curve.points[0].x, curve.points[0].y);
        
        for (let i = 1; i < curve.points.length - 1; i++) {
            const xc = (curve.points[i].x + curve.points[i + 1].x) / 2;
            const yc = (curve.points[i].y + curve.points[i + 1].y) / 2;
            ctx.quadraticCurveTo(curve.points[i].x, curve.points[i].y, xc, yc);
        }
        
        const last = curve.points[curve.points.length - 1];
        ctx.lineTo(last.x, last.y);
        ctx.stroke();
    }

    function drawResizeHandles(node) {
        const handles = [
            { x: node.x - node.width/2, y: node.y - node.height/2 },
            { x: node.x + node.width/2, y: node.y - node.height/2 },
            { x: node.x - node.width/2, y: node.y + node.height/2 },
            { x: node.x + node.width/2, y: node.y + node.height/2 }
        ];

        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#4A90D9';
        ctx.lineWidth = 2;

        for (const handle of handles) {
            ctx.beginPath();
            ctx.rect(handle.x - 4, handle.y - 4, 8, 8);
            ctx.fill();
            ctx.stroke();
        }
    }

    function drawEdge(edge) {
        const fromNode = nodes.find(n => n.id === edge.from);
        const toNode = nodes.find(n => n.id === edge.to);
        
        if (!fromNode || !toNode) return;

        const isSelected = selectedEdge && selectedEdge.id === edge.id;
        const isHovered = hoveredEdge && hoveredEdge.id === edge.id;

        const edgeColor = edge.color || '#A0AEC0';

        ctx.strokeStyle = isSelected ? '#FFFFFF' : (isHovered ? lightenColor(edgeColor, 30) : edgeColor);
        ctx.lineWidth = isSelected ? 3 : (edge.width || 2);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (edge.style === 'dashed') {
            ctx.setLineDash([8, 5]);
        } else if (edge.style === 'dotted') {
            ctx.setLineDash([3, 4]);
        } else {
            ctx.setLineDash([]);
        }

        const points = calculateEdgePoints(fromNode, toNode);
        
        ctx.beginPath();
        if (edge.curved) {
            const midX = (points.x1 + points.x2) / 2;
            const midY = (points.y1 + points.y2) / 2;
            const dx = points.x2 - points.x1;
            const dy = points.y2 - points.y1;
            const perpX = -dy * 0.2;
            const perpY = dx * 0.2;
            const ctrlX = midX + perpX;
            const ctrlY = midY + perpY;
            
            ctx.moveTo(points.x1, points.y1);
            ctx.quadraticCurveTo(ctrlX, ctrlY, points.x2, points.y2);
        } else {
            ctx.moveTo(points.x1, points.y1);
            ctx.lineTo(points.x2, points.y2);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        const angle = Math.atan2(points.y2 - points.y1, points.x2 - points.x1);
        const arrowSize = ARROW_SIZE * (isSelected ? 1.3 : 1);
        
        ctx.fillStyle = ctx.strokeStyle;
        ctx.beginPath();
        ctx.moveTo(points.x2, points.y2);
        ctx.lineTo(
            points.x2 - arrowSize * Math.cos(angle - Math.PI/6),
            points.y2 - arrowSize * Math.sin(angle - Math.PI/6)
        );
        ctx.lineTo(
            points.x2 - arrowSize * Math.cos(angle + Math.PI/6),
            points.y2 - arrowSize * Math.sin(angle + Math.PI/6)
        );
        ctx.closePath();
        ctx.fill();

        if (edge.label) {
            let midX, midY;
            if (edge.curved) {
                const dx = points.x2 - points.x1;
                const dy = points.y2 - points.y1;
                midX = (points.x1 + points.x2) / 2 + (-dy * 0.15);
                midY = (points.y1 + points.y2) / 2 + (dx * 0.15);
            } else {
                midX = (points.x1 + points.x2) / 2;
                midY = (points.y1 + points.y2) / 2;
            }
            
            ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const padding = 6;
            const textWidth = ctx.measureText(edge.label).width;
            
            ctx.fillStyle = diagramBackground;
            ctx.beginPath();
            ctx.roundRect(midX - textWidth/2 - padding, midY - 8 - padding, textWidth + padding*2, 16 + padding*2, 4);
            ctx.fill();
            ctx.strokeStyle = edgeColor;
            ctx.lineWidth = 1;
            ctx.stroke();
            
            ctx.fillStyle = edgeColor;
            ctx.fillText(edge.label, midX, midY);
        }
    }

    function calculateEdgePoints(fromNode, toNode) {
        const dx = toNode.x - fromNode.x;
        const dy = toNode.y - fromNode.y;
        const angle = Math.atan2(dy, dx);

        const fromPoint = getNodeEdgePoint(fromNode, angle);
        const toPoint = getNodeEdgePoint(toNode, angle + Math.PI);

        return {
            x1: fromPoint.x,
            y1: fromPoint.y,
            x2: toPoint.x,
            y2: toPoint.y
        };
    }

    function getNodeEdgePoint(node, angle) {
        const hw = node.width / 2;
        const hh = node.height / 2;
        
        let x, y;
        
        if (node.type === 'decision' || node.type === 'triangle') {
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const scale = Math.min(hw / Math.abs(cos || 0.001), hh / Math.abs(sin || 0.001));
            x = node.x + cos * scale;
            y = node.y + sin * scale;
        } else if (node.type === 'circle' || node.type === 'sun' || node.type === 'cell') {
            const r = Math.min(hw, hh);
            x = node.x + Math.cos(angle) * r;
            y = node.y + Math.sin(angle) * r;
        } else {
            const tanAngle = Math.tan(angle);
            
            if (Math.abs(tanAngle) <= hh / hw) {
                if (Math.cos(angle) >= 0) {
                    x = node.x + hw;
                    y = node.y + hw * tanAngle;
                } else {
                    x = node.x - hw;
                    y = node.y - hw * tanAngle;
                }
            } else {
                if (Math.sin(angle) >= 0) {
                    x = node.x + hh / tanAngle;
                    y = node.y + hh;
                } else {
                    x = node.x - hh / tanAngle;
                    y = node.y - hh;
                }
            }
        }
        
        return { x, y };
    }

    function saveHistory() {
        history = history.slice(0, historyIndex + 1);
        history.push({
            nodes: JSON.parse(JSON.stringify(nodes)),
            edges: JSON.parse(JSON.stringify(edges)),
            curves: JSON.parse(JSON.stringify(curves))
        });
        historyIndex = history.length - 1;
        
        if (history.length > 50) {
            history.shift();
            historyIndex--;
        }
    }

    function undo() {
        if (historyIndex > 0) {
            historyIndex--;
            const state = history[historyIndex];
            nodes = JSON.parse(JSON.stringify(state.nodes));
            edges = JSON.parse(JSON.stringify(state.edges));
            curves = JSON.parse(JSON.stringify(state.curves || []));
            deselectAll();
            render();
            setStatus('已撤销');
        }
    }

    function redo() {
        if (historyIndex < history.length - 1) {
            historyIndex++;
            const state = history[historyIndex];
            nodes = JSON.parse(JSON.stringify(state.nodes));
            edges = JSON.parse(JSON.stringify(state.edges));
            curves = JSON.parse(JSON.stringify(state.curves || []));
            deselectAll();
            render();
            setStatus('已重做');
        }
    }

    function clearCanvas() {
        if (nodes.length === 0 && edges.length === 0 && curves.length === 0) return;
        
        if (confirm('确定要清空画布吗？此操作不可撤销。')) {
            nodes = [];
            edges = [];
            curves = [];
            nodeIdCounter = 0;
            edgeIdCounter = 0;
            curveIdCounter = 0;
            deselectAll();
            history = [];
            historyIndex = -1;
            saveHistory();
            render();
            setStatus('画布已清空');
        }
    }

    async function generateFromAI() {
        const prompt = document.getElementById('aiPrompt').value.trim();
        const docContent = documentContent || document.getElementById('documentContent').value.trim();
        
        if (!prompt && !docContent) {
            showToast('请输入描述或上传文档', 'error');
            return;
        }

        showLoading(true);
        setStatus('AI 正在生成图表...');

        try {
            const result = await AIGenerator.generate(prompt, settings, docContent);
            
            if (result && result.nodes && result.nodes.length > 0) {
                loadFromData(result);
                saveHistory();
                setStatus('图表生成成功');
                showToast('图表生成成功！', 'success');
            } else {
                throw new Error('AI 返回的数据格式不正确');
            }
        } catch (error) {
            console.error('AI generation error:', error);
            showToast('生成失败: ' + error.message, 'error');
            setStatus('生成失败');
        } finally {
            showLoading(false);
        }
    }

    function loadFromData(data) {
        nodes = [];
        edges = [];
        curves = [];
        nodeIdCounter = 0;
        edgeIdCounter = 0;
        curveIdCounter = 0;

        const idMap = {};
        const diagramType = data.diagramType || 'flowchart';

        if (data.background) {
            diagramBackground = data.background.color || '#0D0D0D';
        } else if (data.theme) {
            const themeBackgrounds = {
                modern: '#0F172A',
                tech: '#0F172A',
                nature: '#0F1F0F',
                gradient: '#1A1A2E',
                mono: '#1A1A1A'
            };
            diagramBackground = themeBackgrounds[data.theme] || '#0D0D0D';
        }
        diagramTheme = data.theme || 'modern';

        if (data.nodes && data.nodes.length > 0) {
            const layout = calculateLayout(data.nodes, data.edges, diagramType);
            
            data.nodes.forEach((nodeData, index) => {
                const pos = layout[index] || { 
                    x: canvasWidth / 2 / zoom - panX / zoom + (index % 5) * 150, 
                    y: canvasHeight / 2 / zoom - panY / zoom + Math.floor(index / 5) * 120 
                };
                
                const node = createNode(
                    nodeData.type || 'process',
                    nodeData.x !== undefined ? nodeData.x : pos.x,
                    nodeData.y !== undefined ? nodeData.y : pos.y,
                    nodeData.text || '',
                    {
                        width: nodeData.width,
                        height: nodeData.height,
                        fillColor: nodeData.fillColor,
                        strokeColor: nodeData.strokeColor,
                        textColor: nodeData.textColor,
                        gradient: nodeData.gradient,
                        shadow: nodeData.shadow !== undefined ? nodeData.shadow : true,
                        icon: nodeData.icon,
                        importance: nodeData.importance
                    }
                );
                idMap[nodeData.id] = node.id;
            });
        }

        if (data.edges && data.edges.length > 0) {
            data.edges.forEach(edgeData => {
                const fromId = idMap[edgeData.from] || idMap[edgeData.source];
                const toId = idMap[edgeData.to] || idMap[edgeData.target];
                
                if (fromId && toId) {
                    const edge = createEdge(fromId, toId, edgeData.label || '', edgeData.style || 'solid');
                    if (edge) {
                        edge.color = edgeData.color;
                        edge.curved = edgeData.curved;
                        edge.width = edgeData.width;
                    }
                }
            });
        }

        fitToScreen();
    }

    function calculateLayout(nodeList, edgeList, diagramType) {
        const positions = [];
        const nodeCount = nodeList.length;
        
        if (nodeCount === 0) return positions;

        if (diagramType === 'illustration') {
            const centerX = canvasWidth / 2 / zoom - panX / zoom;
            const centerY = canvasHeight / 2 / zoom - panY / zoom;
            
            nodeList.forEach((node, index) => {
                if (node.x !== undefined && node.y !== undefined) {
                    positions[index] = { x: node.x, y: node.y };
                } else if (node.type === 'sun') {
                    positions[index] = { x: centerX, y: centerY - 150 };
                } else {
                    const angle = (index / nodeCount) * Math.PI * 2;
                    const radius = 200;
                    positions[index] = {
                        x: centerX + Math.cos(angle) * radius,
                        y: centerY + Math.sin(angle) * radius
                    };
                }
            });
            return positions;
        }

        const spacingX = 180;
        const spacingY = 120;
        const startX = canvasWidth / 2 / zoom - (Math.min(nodeCount, 4) - 1) * spacingX / 2;
        const startY = canvasHeight / 2 / zoom - panY / zoom;

        const levels = {};
        const visited = new Set();
        
        const findRootNodes = () => {
            const targets = new Set(edgeList?.map(e => e.to || e.target) || []);
            return nodeList.filter(n => !targets.has(n.id)).map(n => n.id);
        };

        const rootIds = findRootNodes();
        let currentLevel = 0;
        let queue = rootIds.length > 0 ? rootIds : [nodeList[0].id];

        while (queue.length > 0 && visited.size < nodeCount) {
            const nextQueue = [];
            levels[currentLevel] = [];
            
            for (const id of queue) {
                if (visited.has(id)) continue;
                visited.add(id);
                levels[currentLevel].push(id);
                
                const outgoingEdges = edgeList?.filter(e => (e.from || e.source) === id) || [];
                for (const edge of outgoingEdges) {
                    const targetId = edge.to || edge.target;
                    if (!visited.has(targetId)) {
                        nextQueue.push(targetId);
                    }
                }
            }
            
            queue = [...new Set(nextQueue)];
            currentLevel++;
        }

        let unvisited = nodeList.filter(n => !visited.has(n.id));
        if (unvisited.length > 0) {
            levels[currentLevel] = unvisited.map(n => n.id);
        }

        const idToIndex = {};
        nodeList.forEach((n, i) => idToIndex[n.id] = i);

        for (let level = 0; level <= Math.max(...Object.keys(levels).map(Number)); level++) {
            const nodesAtLevel = levels[level] || [];
            const levelWidth = (nodesAtLevel.length - 1) * spacingX;
            const levelStartX = canvasWidth / 2 / zoom - levelWidth / 2;
            
            nodesAtLevel.forEach((id, index) => {
                const nodeIndex = idToIndex[id];
                if (nodeIndex !== undefined) {
                    positions[nodeIndex] = {
                        x: levelStartX + index * spacingX,
                        y: startY + level * spacingY
                    };
                }
            });
        }

        return positions;
    }

    function fitToScreen() {
        if (nodes.length === 0) return;

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        for (const node of nodes) {
            minX = Math.min(minX, node.x - node.width / 2);
            maxX = Math.max(maxX, node.x + node.width / 2);
            minY = Math.min(minY, node.y - node.height / 2);
            maxY = Math.max(maxY, node.y + node.height / 2);
        }

        const contentWidth = maxX - minX + 100;
        const contentHeight = maxY - minY + 100;
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        const scaleX = canvasWidth / contentWidth;
        const scaleY = canvasHeight / contentHeight;
        zoom = Math.min(scaleX, scaleY, 1);
        zoom = Math.max(0.25, Math.min(2, zoom));

        panX = canvasWidth / 2 - centerX * zoom;
        panY = canvasHeight / 2 - centerY * zoom;

        updateZoomDisplay();
        render();
    }

    function exportPNG() {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        for (const node of nodes) {
            minX = Math.min(minX, node.x - node.width / 2);
            maxX = Math.max(maxX, node.x + node.width / 2);
            minY = Math.min(minY, node.y - node.height / 2);
            maxY = Math.max(maxY, node.y + node.height / 2);
        }

        for (const curve of curves) {
            for (const point of curve.points) {
                minX = Math.min(minX, point.x);
                maxX = Math.max(maxX, point.x);
                minY = Math.min(minY, point.y);
                maxY = Math.max(maxY, point.y);
            }
        }

        const padding = 50;
        const width = (maxX - minX) + padding * 2 || 800;
        const height = (maxY - minY) + padding * 2 || 600;

        tempCanvas.width = width;
        tempCanvas.height = height;

        tempCtx.fillStyle = '#1A202C';
        tempCtx.fillRect(0, 0, width, height);

        tempCtx.translate(-minX + padding, -minY + padding);

        const originalCtx = ctx;
        ctx = tempCtx;

        for (const curve of curves) {
            drawCurve(curve);
        }
        for (const edge of edges) {
            drawEdge(edge);
        }
        for (const node of nodes) {
            drawNode(node);
        }

        ctx = originalCtx;

        const link = document.createElement('a');
        link.download = 'diagram.png';
        link.href = tempCanvas.toDataURL('image/png');
        link.click();

        showToast('PNG 导出成功', 'success');
    }

    function exportJSON() {
        const data = {
            version: '2.0',
            nodes: nodes.map(n => ({
                id: n.id,
                type: n.type,
                x: n.x,
                y: n.y,
                width: n.width,
                height: n.height,
                text: n.text,
                fillColor: n.fillColor,
                strokeColor: n.strokeColor,
                textColor: n.textColor,
                rotation: n.rotation,
                strokeWidth: n.strokeWidth
            })),
            edges: edges.map(e => ({
                id: e.id,
                from: e.from,
                to: e.to,
                label: e.label,
                style: e.style
            })),
            curves: curves.map(c => ({
                id: c.id,
                points: c.points,
                strokeColor: c.strokeColor,
                strokeWidth: c.strokeWidth
            }))
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.download = 'diagram.json';
        link.href = URL.createObjectURL(blob);
        link.click();

        showToast('JSON 导出成功', 'success');
    }

    function importJSON(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                loadFromData(data);
                if (data.curves) {
                    curves = data.curves;
                }
                saveHistory();
                showToast('JSON 导入成功', 'success');
            } catch (error) {
                showToast('导入失败: 文件格式不正确', 'error');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    function loadSettings() {
        const saved = localStorage.getItem('flowchartSettings');
        if (saved) {
            settings = { ...settings, ...JSON.parse(saved) };
        }

        document.querySelector(`input[name="aiMode"][value="${settings.aiMode}"]`).checked = true;
        document.getElementById('apiEndpoint').value = settings.apiEndpoint || '';
        document.getElementById('apiKey').value = settings.apiKey || '';
        document.getElementById('modelName').value = settings.modelName || '';
        document.getElementById('showGrid').checked = settings.showGrid;
        document.getElementById('snapToGrid').checked = settings.snapToGrid;
        document.getElementById('customApiConfig').style.display = 
            settings.aiMode === 'custom' ? 'block' : 'none';
        document.getElementById('canvasGrid').style.display = 
            settings.showGrid ? 'block' : 'none';
    }

    function saveSettings() {
        settings.aiMode = document.querySelector('input[name="aiMode"]:checked').value;
        settings.apiEndpoint = document.getElementById('apiEndpoint').value;
        settings.apiKey = document.getElementById('apiKey').value;
        settings.modelName = document.getElementById('modelName').value;
        settings.showGrid = document.getElementById('showGrid').checked;
        settings.snapToGrid = document.getElementById('snapToGrid').checked;

        localStorage.setItem('flowchartSettings', JSON.stringify(settings));
        
        document.getElementById('settingsModal').classList.remove('active');
        showToast('设置已保存', 'success');
    }

    function showLoading(show) {
        document.getElementById('loadingOverlay').classList.toggle('active', show);
    }

    function showToast(message, type = 'info') {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.remove(), 3000);
    }

    function setStatus(text) {
        document.getElementById('statusText').textContent = text;
    }

    return {
        init,
        loadFromData,
        getNodes: () => nodes,
        getEdges: () => edges
    };
})();

document.addEventListener('DOMContentLoaded', FlowChartApp.init);