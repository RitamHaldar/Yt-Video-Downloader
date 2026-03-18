const API_URL = window.location.origin;

const urlInput = document.getElementById('video-url');
const fetchBtn = document.getElementById('fetch-btn');
const themeToggleBtn = document.getElementById('theme-toggle');
const loader = document.getElementById('loader');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');
const videoPreview = document.getElementById('video-preview');
const thumbnailImg = document.getElementById('thumbnail');
const videoTitle = document.getElementById('video-title');
const formatsContainer = document.getElementById('formats-container');
const progressContainer = document.getElementById('download-progress');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');

const initTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.body.removeAttribute('data-theme');
        themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
    }
};

themeToggleBtn.addEventListener('click', () => {
    const isDark = document.body.hasAttribute('data-theme');
    if (isDark) {
        document.body.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
    } else {
        document.body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }
});

initTheme();

const showError = (msg) => {
    errorText.textContent = msg;
    errorMessage.classList.remove('hidden');
    errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

const hideError = () => {
    errorMessage.classList.add('hidden');
};

const showLoader = () => {
    loader.classList.remove('hidden');
    videoPreview.classList.add('hidden');
    hideError();
};

const hideLoader = () => {
    loader.classList.add('hidden');
};

const simulateDownload = () => {
    progressContainer.classList.remove('hidden');
    progressFill.style.width = '0%';
    progressText.textContent = '0%';

    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 5) + 2;
        if (progress > 98) progress = 98; // Stay at 98% until download starts

        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${progress}%`;
    }, 150);

    return () => clearInterval(interval);
};

const fetchVideoInfo = async () => {
    const url = urlInput.value.trim();
    if (!url) {
        showError('Please enter a YouTube video URL.');
        return;
    }

    showLoader();
    formatsContainer.innerHTML = '';

    try {
        const response = await fetch(`${API_URL}/video-info?url=${encodeURIComponent(url)}`);
        const data = await response.json();

        if (data.success) {
            thumbnailImg.src = data.thumbnail;
            videoTitle.textContent = data.title;

            if (!data.formats || data.formats.length === 0) {
                showError('No high-quality mp4 formats found for this video.');
                hideLoader();
            } else {
                data.formats.forEach(format => {
                    const btn = document.createElement('button');
                    btn.className = 'format-btn';
                    btn.innerHTML = `
                        <i class="fas fa-file-video"></i>
                        <span>${format.quality}</span>
                        <span style="font-size: 0.75rem; color: var(--text-secondary)">MP4</span>
                    `;

                    btn.addEventListener('click', () => {
                        const stopSimulation = simulateDownload();

                        setTimeout(() => {
                            window.location.href = `${API_URL}/download?url=${encodeURIComponent(url)}&itag=${format.itag}`;

                            setTimeout(() => {
                                progressFill.style.width = '100%';
                                progressText.textContent = '100%';
                                setTimeout(() => {
                                    progressContainer.classList.add('hidden');
                                    stopSimulation();
                                }, 1500);
                            }, 500);
                        }, 300);
                    });

                    formatsContainer.appendChild(btn);
                });

                hideLoader();
                videoPreview.classList.remove('hidden');
                videoPreview.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } else {
            hideLoader();
            showError(data.error || 'Failed to fetch video details.');
        }
    } catch (error) {
        hideLoader();
        showError('Network error. Please ensure the server is running on port 5000.');
        console.error('Fetch Error:', error);
    }
};

fetchBtn.addEventListener('click', fetchVideoInfo);

urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        fetchVideoInfo();
    }
});

urlInput.addEventListener('paste', () => {
    setTimeout(() => {
        if (urlInput.value.includes('youtube.com') || urlInput.value.includes('youtu.be')) {
            fetchVideoInfo();
        }
    }, 100);
});
