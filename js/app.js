/**
 * Guarda-Roupa Digital - SPA Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // App State
  const state = {
    theme: localStorage.getItem('grd_theme') || 'dark',
    currentImageSrc: null,
    currentAnalysis: null,
    wardrobe: JSON.parse(localStorage.getItem('grd_wardrobe')) || [],
    activeFilter: 'all',
    chartInstance: null
  };

  // UI Elements
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');

  const navAnalyzerBtn = document.getElementById('navAnalyzerBtn');
  const navWardrobeBtn = document.getElementById('navWardrobeBtn');
  const analyzerView = document.getElementById('analyzerView');
  const wardrobeView = document.getElementById('wardrobeView');

  const dropZone = document.getElementById('dropZone');
  const imageInput = document.getElementById('imageInput');
  const cameraInput = document.getElementById('cameraInput');
  const openCameraBtn = document.getElementById('openCameraBtn');
  const uploadPrompt = document.getElementById('uploadPrompt');
  const previewContainer = document.getElementById('previewContainer');
  const imagePreview = document.getElementById('imagePreview');
  const removeImageBtn = document.getElementById('removeImageBtn');

  const analyzeControls = document.getElementById('analyzeControls');
  const pieceCategorySelect = document.getElementById('pieceCategorySelect');
  const analyzeBtn = document.getElementById('analyzeBtn');

  const analysisResults = document.getElementById('analysisResults');
  const dominantColorBox = document.getElementById('dominantColorBox');
  const dominantColorName = document.getElementById('dominantColorName');
  const dominantColorHex = document.getElementById('dominantColorHex');
  const harmonyPalette = document.getElementById('harmonyPalette');
  const matchPercentageScore = document.getElementById('matchPercentageScore');
  const matchPercentageLabel = document.getElementById('matchPercentageLabel');
  const combinationTips = document.getElementById('combinationTips');
  const savePieceBtn = document.getElementById('savePieceBtn');

  const wardrobeGrid = document.getElementById('wardrobeGrid');
  const emptyWardrobeState = document.getElementById('emptyWardrobeState');
  const savedCountBadge = document.getElementById('savedCountBadge');
  const categoryFilterContainer = document.getElementById('categoryFilterContainer');

  const pieceModal = document.getElementById('pieceModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalColorBox = document.getElementById('modalColorBox');
  const modalPieceTitle = document.getElementById('modalPieceTitle');
  const modalPieceColor = document.getElementById('modalPieceColor');
  const modalPieceImg = document.getElementById('modalPieceImg');
  const modalPieceTips = document.getElementById('modalPieceTips');
  const modalDeleteBtn = document.getElementById('modalDeleteBtn');
  let currentModalPieceId = null;

  const toastNotification = document.getElementById('toastNotification');
  const toastMessage = document.getElementById('toastMessage');

  // Initialize Color Thief
  const colorThief = typeof ColorThief !== 'undefined' ? new ColorThief() : null;

  // --- INITIALIZATION ---
  function init() {
    applyTheme(state.theme);
    setupEventListeners();
    renderWardrobe();
  }

  // --- THEME MANAGEMENT ---
  function applyTheme(theme) {
    state.theme = theme;
    localStorage.setItem('grd_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      themeIcon.className = 'fa-solid fa-sun text-yellow-400 text-lg';
    } else {
      document.documentElement.classList.remove('dark');
      themeIcon.className = 'fa-solid fa-moon text-gray-700 text-lg';
    }
    if (state.currentAnalysis) {
      renderMatchChart(state.currentAnalysis.score);
    }
  }

  // --- TOAST NOTIFICATION ---
  function showToast(msg) {
    toastMessage.textContent = msg;
    toastNotification.classList.remove('opacity-0');
    toastNotification.classList.add('opacity-100');
    setTimeout(() => {
      toastNotification.classList.remove('opacity-100');
      toastNotification.classList.add('opacity-0');
    }, 2500);
  }

  // --- NAVIGATION ---
  function switchTab(target) {
    if (target === 'analyzer') {
      analyzerView.classList.remove('hidden');
      wardrobeView.classList.add('hidden');
      navAnalyzerBtn.classList.add('active', 'text-brand-500');
      navAnalyzerBtn.classList.remove('text-gray-400');
      navWardrobeBtn.classList.remove('active', 'text-brand-500');
      navWardrobeBtn.classList.add('text-gray-400');
    } else {
      analyzerView.classList.add('hidden');
      wardrobeView.classList.remove('hidden');
      navWardrobeBtn.classList.add('active', 'text-brand-500');
      navWardrobeBtn.classList.remove('text-gray-400');
      navAnalyzerBtn.classList.remove('active', 'text-brand-500');
      navAnalyzerBtn.classList.add('text-gray-400');
      renderWardrobe();
    }
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    themeToggleBtn.addEventListener('click', () => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark';
      applyTheme(newTheme);
    });

    navAnalyzerBtn.addEventListener('click', () => switchTab('analyzer'));
    navWardrobeBtn.addEventListener('click', () => switchTab('wardrobe'));

    // Image Upload Handling
    dropZone.addEventListener('click', (e) => {
      if (e.target !== removeImageBtn && !removeImageBtn.contains(e.target) && e.target !== openCameraBtn && !openCameraBtn.contains(e.target)) {
        imageInput.click();
      }
    });

    if (openCameraBtn && cameraInput) {
      openCameraBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        cameraInput.click();
      });
      cameraInput.addEventListener('change', handleImageSelect);
    }

    imageInput.addEventListener('change', handleImageSelect);

    // Drag & Drop
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('border-brand-500');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('border-brand-500');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-brand-500');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    });

    removeImageBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      resetImageUpload();
    });

    analyzeBtn.addEventListener('click', analyzeSelectedImage);
    savePieceBtn.addEventListener('click', savePieceToWardrobe);

    // Filter Buttons
    categoryFilterContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (btn) {
        document.querySelectorAll('.filter-btn').forEach(b => {
          b.classList.remove('active', 'bg-brand-500', 'text-white');
          b.classList.add('bg-gray-200', 'dark:bg-gray-800', 'text-gray-700', 'dark:text-gray-300');
        });
        btn.classList.add('active', 'bg-brand-500', 'text-white');
        btn.classList.remove('bg-gray-200', 'dark:bg-gray-800', 'text-gray-700', 'dark:text-gray-300');
        state.activeFilter = btn.dataset.filter;
        renderWardrobe();
      }
    });

    // Modal listeners
    closeModalBtn.addEventListener('click', hideModal);
    pieceModal.addEventListener('click', (e) => {
      if (e.target === pieceModal) hideModal();
    });
    modalDeleteBtn.addEventListener('click', () => {
      if (currentModalPieceId) {
        deletePieceFromWardrobe(currentModalPieceId);
        hideModal();
      }
    });
  }

  function showModal(item) {
    currentModalPieceId = item.id;
    modalColorBox.style.backgroundColor = item.hex;
    modalPieceTitle.textContent = item.categoryLabel;
    modalPieceColor.textContent = `${item.colorName} (${item.hex})`;
    modalPieceImg.src = item.imageSrc;
    modalPieceTips.innerHTML = item.tips.map(t => `<li>${t}</li>`).join('');
    pieceModal.classList.remove('hidden');
  }

  function hideModal() {
    pieceModal.classList.add('hidden');
    currentModalPieceId = null;
  }

  function handleImageSelect(e) {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }

  function handleFile(file) {
    if (!file.type.startsWith('image/')) {
      showToast('Por favor selecione um arquivo de imagem válido.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      state.currentImageSrc = e.target.result;
      imagePreview.src = state.currentImageSrc;
      uploadPrompt.classList.add('hidden');
      previewContainer.classList.remove('hidden');
      analyzeControls.classList.remove('hidden');
      analysisResults.classList.add('hidden');
    };
    reader.readAsDataURL(file);
  }

  function resetImageUpload() {
    state.currentImageSrc = null;
    imageInput.value = '';
    imagePreview.src = '';
    uploadPrompt.classList.remove('hidden');
    previewContainer.classList.add('hidden');
    analyzeControls.classList.add('hidden');
    analysisResults.classList.add('hidden');
  }

  // --- COLOR THEORY & CONVERSION HELPERS ---
  function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  }

  function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  function getColorName(h, s, l) {
    if (l < 15) return 'Preto';
    if (l > 88 && s < 20) return 'Branco';
    if (s < 15) return 'Cinza';

    if (h >= 0 && h < 15) return l < 35 ? 'Vinho' : 'Vermelho';
    if (h >= 15 && h < 45) return s < 40 ? 'Bege / Caramelo' : 'Laranja';
    if (h >= 45 && h < 70) return 'Amarelo';
    if (h >= 70 && h < 160) return 'Verde';
    if (h >= 160 && h < 260) return h > 200 && l < 35 ? 'Azul-Marinho' : 'Azul';
    if (h >= 260 && h < 315) return 'Roxo / Lilás';
    if (h >= 315 && h < 355) return 'Rosa';
    return 'Vermelho';
  }

  function getHarmonicColors(h, s, l) {
    const compHue = (h + 180) % 360;
    const triadic1 = (h + 120) % 360;
    const triadic2 = (h + 240) % 360;
    const analog1 = (h + 30) % 360;
    const analog2 = (h + 330) % 360;

    return [
      { name: 'Complementar', hex: hslToHex(compHue, Math.max(s, 50), Math.min(l, 60)) },
      { name: 'Tríade 1', hex: hslToHex(triadic1, Math.max(s, 50), Math.min(l, 60)) },
      { name: 'Tríade 2', hex: hslToHex(triadic2, Math.max(s, 50), Math.min(l, 60)) },
      { name: 'Análoga 1', hex: hslToHex(analog1, Math.max(s, 50), Math.min(l, 60)) },
      { name: 'Análoga 2', hex: hslToHex(analog2, Math.max(s, 50), Math.min(l, 60)) }
    ];
  }

  // --- CLOTHING MATCH RULES & TIPS ---
  function generateTipsAndScore(category, colorName, rgb) {
    const tips = [];
    let baseScore = 85;

    const categoryNames = {
      camiseta: 'Camiseta',
      camisa: 'Camisa',
      calca: 'Calça',
      bermuda: 'Bermuda',
      jaqueta: 'Jaqueta',
      vestido: 'Vestido',
      sapato: 'Calçado',
      acessorio: 'Acessório'
    };

    const catName = categoryNames[category] || 'Peça';

    // Universal neutrals check
    const isNeutral = ['Preto', 'Branco', 'Cinza', 'Bege / Caramelo', 'Azul-Marinho'].includes(colorName);

    if (isNeutral) {
      baseScore = 95;
      tips.push(`${catName} em tom neutro (${colorName}): Altamente versátil! Combina perfeitamente com quase qualquer cor viva ou outros neutros.`);
    } else {
      baseScore = 82;
      tips.push(`${catName} em destaque (${colorName}): Fica excelente com peças em tons neutros (como Branco, Preto, Jeans ou Bege) para equilibrar o look.`);
    }

    // Category specific advice
    switch (category) {
      case 'camiseta':
      case 'camisa':
        tips.push('Dica de Estilo: Combine com calças jeans escuras para um look casual, ou alfaiataria em tons contrastantes para um visual moderno.');
        tips.push('Acessórios: Relógios, cintos ou correntes prateadas/douradas elevam a composição.');
        break;
      case 'calca':
      case 'bermuda':
        tips.push('Dica de Estilo: Para peças inferiores, combine com calçados brancos ou em tons terrosos para alongar a silhueta.');
        tips.push('Parte Superior: Escolha blusas de cor complementar ou um tom acima/abaixo do tom da calça (tom sobre tom).');
        break;
      case 'jaqueta':
        tips.push('Dica de Estilo: Jaquetas funcionam como terceira peça e criam profundidade. Use abertas com camisetas básicas por baixo.');
        break;
      case 'vestido':
        tips.push('Dica de Estilo: Por ser peça única, aposte em calçados em tons de pele ou contraste no calçado/bolsa.');
        break;
      case 'sapato':
        tips.push('Dica de Estilo: Calçados nesta tonalidade podem combinar diretamente com o cinto ou bolsa, mantendo coerência na paleta.');
        break;
      case 'acessorio':
        tips.push('Dica de Estilo: Use como ponto de cor em looks predominantemente neutros.');
        break;
    }

    // Check compatibility with existing wardrobe items if available
    if (state.wardrobe.length > 0) {
      const matchCandidates = state.wardrobe.filter(item => item.category !== category);
      if (matchCandidates.length > 0) {
        const bestMatch = matchCandidates[0];
        tips.push(`Combinação Interna: Esta peça harmoniza ${baseScore > 90 ? 'super bem' : 'corretamente'} com a sua peça guardada "${bestMatch.colorName} (${bestMatch.categoryLabel})"!`);
      }
    } else {
      tips.push('Sugestão: Guarde esta peça no seu Guarda-Roupa Digital para receber sugestões diretas de combinações com seus outros itens.');
    }

    return { score: baseScore, tips };
  }

  // --- CHART RENDERING ---
  function renderMatchChart(percentage) {
    const ctx = document.getElementById('matchChart').getContext('2d');

    if (state.chartInstance) {
      state.chartInstance.destroy();
    }

    state.chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [percentage, 100 - percentage],
          backgroundColor: [
            '#0ea5e9', // Brand 500
            state.theme === 'dark' ? '#374151' : '#e5e7eb' // Gray background
          ],
          borderWidth: 0,
          borderRadius: 8
        }]
      },
      options: {
        cutout: '80%',
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          tooltip: { enabled: false },
          legend: { display: false }
        },
        animation: {
          animateScale: true,
          animateRotate: true
        }
      }
    });

    matchPercentageScore.textContent = `${percentage}%`;
  }

  // --- IMAGE ANALYSIS ENGINE ---
  function analyzeSelectedImage() {
    if (!state.currentImageSrc) return;

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = state.currentImageSrc;

    img.onload = () => {
      let rgb = [50, 100, 200]; // Fallback

      if (colorThief) {
        try {
          rgb = colorThief.getColor(img);
        } catch (e) {
          console.warn('ColorThief failed, falling back to canvas extraction', e);
          rgb = extractDominantColorCanvas(img);
        }
      } else {
        rgb = extractDominantColorCanvas(img);
      }

      const hex = rgbToHex(rgb[0], rgb[1], rgb[2]);
      const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
      const colorName = getColorName(h, s, l);
      const category = pieceCategorySelect.value;
      const categoryLabel = pieceCategorySelect.options[pieceCategorySelect.selectedIndex].text;
      const harmonies = getHarmonicColors(h, s, l);

      const { score, tips } = generateTipsAndScore(category, colorName, rgb);

      // Save analysis state
      state.currentAnalysis = {
        id: Date.now().toString(),
        imageSrc: state.currentImageSrc,
        rgb,
        hex,
        hsl: [h, s, l],
        colorName,
        category,
        categoryLabel,
        harmonies,
        score,
        tips,
        timestamp: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
      };

      // Display Results UI
      dominantColorBox.style.backgroundColor = hex;
      dominantColorName.textContent = colorName;
      dominantColorHex.textContent = hex;

      // Harmony Palette UI
      harmonyPalette.innerHTML = harmonies.map(hItem => `
        <div class="flex flex-col items-center flex-1">
          <div class="w-full h-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-1" style="background-color: ${hItem.hex}" title="${hItem.name}"></div>
          <span class="text-[9px] text-gray-400 font-mono">${hItem.hex}</span>
        </div>
      `).join('');

      // Render Chart
      renderMatchChart(score);

      // Render Tips
      combinationTips.innerHTML = tips.map(tip => `<li>${tip}</li>`).join('');

      analysisResults.classList.remove('hidden');
      analysisResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
  }

  function extractDominantColorCanvas(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 100;
    canvas.height = 100;
    ctx.drawImage(img, 0, 0, 100, 100);
    const data = ctx.getImageData(0, 0, 100, 100).data;

    let r = 0, g = 0, b = 0, count = 0;
    for (let i = 0; i < data.length; i += 16) { // Sampling
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count++;
    }
    return [Math.round(r / count), Math.round(g / count), Math.round(b / count)];
  }

  // --- WARDROBE STORAGE & UI ---
  function savePieceToWardrobe() {
    if (!state.currentAnalysis) return;

    // Check duplicate or add
    state.wardrobe.unshift(state.currentAnalysis);
    localStorage.setItem('grd_wardrobe', JSON.stringify(state.wardrobe));

    showToast('Peça guardada com sucesso no seu Guarda-Roupa!');
    renderWardrobe();
  }

  function deletePieceFromWardrobe(id) {
    state.wardrobe = state.wardrobe.filter(item => item.id !== id);
    localStorage.setItem('grd_wardrobe', JSON.stringify(state.wardrobe));
    showToast('Peça removida do guarda-roupa.');
    renderWardrobe();
  }

  function mapFilterCategory(cat) {
    if (cat === 'all') return 'all';
    if (['camiseta', 'camisa'].includes(cat)) return 'top';
    if (['calca', 'bermuda'].includes(cat)) return 'bottom';
    if (['sapato'].includes(cat)) return 'shoes';
    if (['jaqueta'].includes(cat)) return 'outerwear';
    return 'other';
  }

  function renderWardrobe() {
    savedCountBadge.textContent = `${state.wardrobe.length} ${state.wardrobe.length === 1 ? 'Peça' : 'Peças'}`;

    if (state.wardrobe.length === 0) {
      emptyWardrobeState.classList.remove('hidden');
      wardrobeGrid.innerHTML = '';
      return;
    }

    const filtered = state.wardrobe.filter(item => {
      if (state.activeFilter === 'all') return true;
      return mapFilterCategory(item.category) === state.activeFilter;
    });

    if (filtered.length === 0) {
      emptyWardrobeState.classList.remove('hidden');
      wardrobeGrid.innerHTML = '';
      return;
    }

    emptyWardrobeState.classList.add('hidden');

    wardrobeGrid.innerHTML = filtered.map(item => `
      <div data-piece-id="${item.id}" class="wardrobe-card cursor-pointer bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700/60 shadow-md flex flex-col justify-between group hover:border-brand-500/50 transition-all">
        <div class="relative h-36 bg-gray-100 dark:bg-gray-900 overflow-hidden">
          <img src="${item.imageSrc}" class="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300" alt="${item.categoryLabel}">
          <span class="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
            ${item.categoryLabel}
          </span>
          <button data-delete-id="${item.id}" class="delete-btn absolute top-2 right-2 bg-red-500/80 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors">
            <i class="fa-solid fa-trash text-[10px]"></i>
          </button>
        </div>
        <div class="p-3 space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-1.5">
              <span class="w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-gray-600" style="background-color: ${item.hex}"></span>
              <span class="font-bold text-xs text-gray-800 dark:text-gray-200">${item.colorName}</span>
            </div>
            <span class="text-[10px] font-semibold text-brand-500 bg-brand-50 dark:bg-brand-500/10 px-1.5 py-0.5 rounded">
              ${item.score}% Harmonia
            </span>
          </div>
          <div class="text-[10px] text-gray-400">
            Adicionado em: ${item.timestamp}
          </div>
        </div>
      </div>
    `).join('');

    // Attach card click and delete listeners
    document.querySelectorAll('.wardrobe-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.delete-btn')) {
          const id = card.dataset.pieceId;
          const item = state.wardrobe.find(i => i.id === id);
          if (item) showModal(item);
        }
      });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.deleteId;
        deletePieceFromWardrobe(id);
      });
    });
  }

  // Run initial setup
  init();
});
