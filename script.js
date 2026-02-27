const canvas = document.getElementById('galaxy-canvas');
const ctx = canvas.getContext('2d');

console.log("SYSTEM: Galaxy Engine (Zero-G Edition) Loaded."); 

// ==========================================
// 1. MAIN NAVIGATION (The 7 Clickable Sectors)
// ==========================================
const SECTOR_MAP = {
    'bio': { x: 450, y: -180, color: '#FFD700', icon: 'assets/icons/tech/python.png' }, 
    'projects': { x: -450, y: 0, color: '#00FF41', icon: 'assets/icons/tech/react.png' }, 
    'mini-projects': { x: 450, y: 150, color: '#FF00FF', icon: 'assets/icons/tech/javascript.png' }, 
    'certifications': { x: -450, y: -150, color: '#00BFFF', icon: 'assets/icons/tech/json.png' }, 
    'extra': { x: 450, y: 0, color: '#FF69B4', icon: 'assets/icons/tech/gitextensions.png' },
    'misc': { x: -450, y: 200, color: '#00FFFF', icon: 'assets/icons/tech/linux.png' },
    'contact': { x: 0, y: 280, color: '#FF4500', icon: 'assets/icons/tech/java.png' }  
};

// ==========================================
// 2. ASSET MANIFEST
// ==========================================
const starObjects = { greetings: [], tech: [], ambient: [] };

const greetingPaths = [
    'assets/icons/greetings/arabic.svg', 'assets/icons/greetings/chinese.svg',
    'assets/icons/greetings/hindi.svg', 'assets/icons/greetings/namaskaram.svg',
    'assets/icons/greetings/spanish.svg', 'assets/icons/greetings/telugu.svg',
    'assets/icons/greetings/french.svg', 'assets/icons/greetings/japanese.svg'
];

const ambientPaths = [
    'assets/icons/tech/c.png', 'assets/icons/tech/cplusplus.png',
    'assets/icons/tech/css.png', 'assets/icons/tech/html5.png',
    'assets/icons/tech/github.png', 'assets/icons/tech/bootstrap.png'
];

// --- LOADERS ---
greetingPaths.forEach(src => { const img = new Image(); img.src = src; starObjects.greetings.push(img); });
Object.keys(SECTOR_MAP).forEach(key => { const img = new Image(); img.src = SECTOR_MAP[key].icon; starObjects.tech[key] = img; });
ambientPaths.forEach(src => { const img = new Image(); img.src = src; starObjects.ambient.push(img); });

// ==========================================
// 3. SYSTEM STATE
// ==========================================
let width, height, centerX, centerY;
let cameraZoom = 5, targetZoom = 5, sunPulse = 0, isExploding = false, currentSector = 'intro'; 
let globalTime = 0;

// ==========================================
// 4. VISUAL CLASSES
// ==========================================

// A. DEEP SPACE STARS
class BackgroundStar {
    constructor() { this.reset(); }
    reset() {
        this.x = (Math.random() - 0.5) * 3000;
        this.y = (Math.random() - 0.5) * 3000;
        this.z = 0.5 + Math.random(); 
        this.size = Math.random() * 1.5;
        this.opacity = Math.random();
        this.twinkleSpeed = 0.02 + Math.random() * 0.05;
    }
    draw() {
        let parallax = 1 / (cameraZoom * 0.5); 
        let sx = centerX + this.x * parallax * this.z;
        let sy = centerY + this.y * parallax * this.z;
        this.opacity += Math.sin(globalTime * this.twinkleSpeed) * 0.01;
        ctx.fillStyle = "white"; ctx.globalAlpha = Math.max(0.2, Math.min(1, this.opacity * 0.6));
        ctx.beginPath(); ctx.arc(sx, sy, this.size, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

// B. ORBITING DUST
class Dust {
    constructor() {
        this.angle = Math.random() * Math.PI * 2;
        this.orbitRadius = 160 + Math.random() * 800; 
        this.speed = (0.00005 + Math.random() * 0.0001) * (500 / this.orbitRadius);
        this.yOffset = (Math.random() - 0.5) * 80; 
        this.size = 0.5 + Math.random() * 1.5; 
        this.opacity = 0.4 + Math.random() * 0.6; 
    }
    update() { this.angle += this.speed; }
    draw() {
        if (cameraZoom > 3) return; 
        const x = centerX + Math.cos(this.angle) * this.orbitRadius * (1/cameraZoom);
        const y = centerY + (Math.sin(this.angle) * this.orbitRadius * 0.4 + this.yOffset) * (1/cameraZoom);
        ctx.save(); ctx.fillStyle = "white"; ctx.globalAlpha = this.opacity;
        ctx.beginPath(); ctx.arc(x, y, this.size * (1/cameraZoom), 0, Math.PI*2); ctx.fill(); ctx.restore();
    }
}

// C. SHOOTING STARS
let shootingStar = null;
function updateShootingStar() {
    if (!shootingStar && Math.random() < 0.01) {
        shootingStar = { x: Math.random() * width, y: Math.random() * height * 0.5, vx: -10 - Math.random() * 10, vy: 2 + Math.random() * 5, life: 1.0 };
    }
    if (shootingStar) {
        shootingStar.x += shootingStar.vx; shootingStar.y += shootingStar.vy; shootingStar.life -= 0.02;
        ctx.save(); ctx.strokeStyle = `rgba(255, 255, 255, ${shootingStar.life})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(shootingStar.x, shootingStar.y);
        ctx.lineTo(shootingStar.x - shootingStar.vx * 3, shootingStar.y - shootingStar.vy * 3); ctx.stroke(); ctx.restore();
        if (shootingStar.life <= 0) shootingStar = null;
    }
}

// D. MAIN STARS (The Core Logic)
// D. MAIN STARS (The Core Logic)
class Star {
    constructor(index, type, sectorKey = null) {
        this.type = type; this.index = index;
        
        // 1. GREETINGS
        if (this.type === 'greeting') {
            this.angle = index * ((Math.PI * 2) / 8); 
            this.orbitRadius = 1920; 
            this.obj = starObjects.greetings[index % starObjects.greetings.length];
        } 
        // 2. AMBIENT
        else if (this.type === 'ambient') {
            this.angle = Math.random() * Math.PI * 2;
            this.orbitRadius = 600 + Math.random() * 1000; 
            this.orbitSpeed = 0.0002 + Math.random() * 0.0005;
            this.obj = starObjects.ambient[index % starObjects.ambient.length];
        }
        // 3. SECTOR PINS
        else {
            this.sectorName = sectorKey;
            let config = SECTOR_MAP[this.sectorName];
            this.baseX = config.x; this.baseY = config.y; this.color = config.color;
            this.obj = starObjects.tech[this.sectorName];
            
            // ZERO-G DRIFT SETUP
            this.driftSpeedX = 0.002 + Math.random() * 0.002;
            this.driftSpeedY = 0.003 + Math.random() * 0.002;
            this.driftRange = 10; 
        }
    }

    update() { 
        if (this.type === 'greeting') this.angle += 0.002; 
        if (this.type === 'ambient') this.angle += this.orbitSpeed;
    }

    // Helper: Is this star behind the sun?
    isBehindSun() {
        if(this.type !== 'greeting') return false;
        return Math.sin(this.angle) < 0; // Negative sine = Back of orbit
    }

    draw() {
        let size = 0, opacity = 0, x = 0, y = 0;
        
        if (cameraZoom > 2) { // INTRO MODE
            if(this.type === 'greeting') {
                size = 240; opacity = (cameraZoom - 2) / 2;
                x = centerX + Math.cos(this.angle) * this.orbitRadius * (1/cameraZoom);
                y = centerY + Math.sin(this.angle) * this.orbitRadius * 0.4 * (1/cameraZoom);
            }
        } else { // GALAXY MODE
            if(this.type === 'sector') {
                if (currentSector === this.sectorName) { size = 80; opacity = 1; } 
                else { size = 12; opacity = 0.6; }
                
                let driftX = Math.cos(globalTime * this.driftSpeedX) * this.driftRange;
                let driftY = Math.sin(globalTime * this.driftSpeedY) * this.driftRange;
                
                x = centerX + (this.baseX + driftX) * (1/cameraZoom); 
                y = centerY + (this.baseY + driftY) * (1/cameraZoom);
            }
            else if(this.type === 'ambient' && starObjects.ambient.length > 0) {
                size = 30; opacity = 0.4;
                x = centerX + Math.cos(this.angle) * this.orbitRadius * (1/cameraZoom);
                y = centerY + Math.sin(this.angle) * this.orbitRadius * 0.6 * (1/cameraZoom);
            }
        }

        if (opacity <= 0.01) return;

        ctx.save(); 
        ctx.globalAlpha = opacity;
        
        // --- FIXED SILHOUETTE LOGIC ---
        // If it's a greeting, AND it's NOT behind the sun, AND it's physically overlapping the sun center...
        if(this.type === 'greeting' && !this.isBehindSun()) {
            let distFromCenter = Math.abs(x - centerX);
            // 150px is roughly the visual width of the sun's core + glare
            if(distFromCenter < 150) {
                ctx.filter = "brightness(0)"; // Turn black
            } else {
                ctx.filter = "none";
            }
        } else {
            ctx.filter = "none";
        }
        // -----------------------------
        
        // Draw Image
        if (this.obj && this.obj.complete && this.obj.naturalWidth > 0 && size > 10) {
             ctx.shadowColor = this.color || '#FFD700'; ctx.shadowBlur = (size > 50) ? 40 : 15;
            try { ctx.drawImage(this.obj, x - size/2, y - size/2, size, size); } catch(e) {}
        } else {
             ctx.fillStyle = this.color || "white"; ctx.beginPath(); ctx.arc(x,y,size/4,0,Math.PI*2); ctx.fill();
        }
        ctx.restore();
    }
}

// ==========================================
// 5. SUN (Enhanced Code)
// ==========================================
function drawSun() {
    let baseRadius = 130 * (cameraZoom > 1 ? cameraZoom * 0.5 : 1);
    sunPulse += 0.005; 
    let sunY = centerY; 

    ctx.save();
    ctx.globalCompositeOperation = 'screen'; 
    
    // LAYER 1: CORONA
    for(let i = 1; i <= 3; i++) {
        let flareSize = baseRadius * (1.5 + Math.sin(sunPulse * i) * 0.1);
        let flareAngle = sunPulse * (i % 2 === 0 ? 1 : -1) * 0.5; 
        ctx.translate(centerX, sunY);
        ctx.rotate(flareAngle);
        const grad = ctx.createRadialGradient(0, 0, baseRadius * 0.5, 0, 0, flareSize);
        grad.addColorStop(0, 'rgba(255, 69, 0, 0.4)'); 
        grad.addColorStop(0.6, 'rgba(255, 140, 0, 0.2)'); 
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.ellipse(0, 0, flareSize, flareSize * 0.8, 0, 0, Math.PI*2); ctx.fill();
        ctx.rotate(-flareAngle); ctx.translate(-centerX, -sunY);
    }
    ctx.restore();

    // LAYER 2: SURFACE
    ctx.save();
    ctx.translate(centerX, sunY);
    const surfaceGradient = ctx.createRadialGradient(0, 0, baseRadius * 0.2, 0, 0, baseRadius * 1.1);
    surfaceGradient.addColorStop(0, '#FFFFFF');     
    surfaceGradient.addColorStop(0.3, '#FFD700');    
    surfaceGradient.addColorStop(0.7, '#FF4500');    
    surfaceGradient.addColorStop(1, 'rgba(255,69,0,0)'); 
    ctx.fillStyle = surfaceGradient;
    ctx.beginPath();
    let points = 100;
    for (let i = 0; i <= points; i++) {
        let angle = (Math.PI * 2 * i) / points;
        let noise = Math.sin(angle * 10 + sunPulse * 2) * 2 
                  + Math.sin(angle * 25 - sunPulse * 5) * 1.5 
                  + Math.sin(angle * 5 + sunPulse) * 3;
        let r = baseRadius + noise; 
        let x = Math.cos(angle) * r;
        let y = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.fill();
    
    // LAYER 3: ATMOSPHERE
    ctx.shadowColor = "#FF8C00"; ctx.shadowBlur = baseRadius * 0.5;
    ctx.fillStyle = "rgba(255, 215, 0, 0.1)"; ctx.fill();
    ctx.restore();

    // TEXT
    if (cameraZoom > 3) {
        ctx.save();
        ctx.globalAlpha = (cameraZoom - 3) / 2; 
        ctx.fillStyle = "white";
        ctx.font = "bold 28px 'Courier New', serif"; 
        ctx.textAlign = "center";
        ctx.shadowColor = "black";
        ctx.shadowBlur = 8;
        ctx.fillText("CLICK TO ENTER", centerX, sunY + 10);
        ctx.restore();
    }
}

// ==========================================
// 6. ANIMATION LOOP (Layered Rendering)
// ==========================================
const stars = [];
const dustParticles = [];
const backStars = []; 

// Init Visuals
for(let i=0; i<8; i++) stars.push(new Star(i, 'greeting')); // 8 Greetings
Object.keys(SECTOR_MAP).forEach((key, i) => stars.push(new Star(i, 'sector', key))); // 7 Sector Pins
if(starObjects.ambient.length > 0) { for(let i=0; i<15; i++) stars.push(new Star(i, 'ambient')); }

for(let i=0; i<400; i++) dustParticles.push(new Dust());
for(let i=0; i<500; i++) backStars.push(new BackgroundStar());

function animate() {
    globalTime += 1;
    if (Math.abs(targetZoom - cameraZoom) > 0.01) cameraZoom += (targetZoom - cameraZoom) * 0.02;
    ctx.clearRect(0,0, canvas.width, canvas.height);
    
    // 1. Deep Space
    backStars.forEach(b => b.draw());
    updateShootingStar();
    dustParticles.forEach(d => { d.update(); d.draw(); });

    // 2. Ambient & Sectors (Pins)
    stars.forEach(s => s.update()); // Update math for everyone
    stars.filter(s => s.type === 'ambient').forEach(s => s.draw());
    stars.filter(s => s.type === 'sector').forEach(s => s.draw()); 

    // 3. BACKGROUND Greetings (Behind Sun)
    // We filter for stars that are 'greeting' AND have a negative Sine (meaning they are 'up/back' in 3D space)
    stars.filter(s => s.type === 'greeting' && s.isBehindSun()).forEach(s => s.draw());

    // 4. Sun (The Core)
    drawSun();
    
    // 5. FOREGROUND Greetings (In Front of Sun)
    // We filter for stars that are 'greeting' AND have a positive Sine
    stars.filter(s => s.type === 'greeting' && !s.isBehindSun()).forEach(s => s.draw());

    requestAnimationFrame(animate);
}

// ==========================================
// 7. EVENTS & MODULE LOADING
// ==========================================
window.addEventListener('resize', () => { 
    canvas.width = window.innerWidth; canvas.height = window.innerHeight; 
    centerX = canvas.width/2; centerY = canvas.height/2; 
}); 
window.dispatchEvent(new Event('resize')); 
animate();

document.addEventListener('click', () => {
    if(!isExploding) {
        isExploding = true; targetZoom = 1;
        document.getElementById('transition-flash').classList.add('flash-bang');
        setTimeout(() => {
            document.body.style.overflowY = 'auto';
            document.getElementById('main-interface').classList.remove('hidden'); 
            document.getElementById('main-interface').classList.add('visible');
            document.getElementById('intro-layer').style.pointerEvents = 'none';
        }, 1000);
    }
});

const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if(e.isIntersecting) currentSector = e.target.id; });
}, { threshold: 0.5 });

// ==========================================
// 8. MODULE SYSTEM & INTERACTION LOGIC
// ==========================================

// A. Module Loader
async function loadModule(containerId, filePath) {
    const container = document.getElementById(containerId);
    if(!container) return;
    try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const html = await response.text();
        container.innerHTML = html;
        console.log(`SUCCESS: Loaded ${filePath}`);
    } catch (error) { console.error(`FAIL: ${filePath}`, error); }
}

// Function to handle Project selection and Animation
window.viewProject = function(projectId, btnElement) {
    // 1. Highlight Button
    document.querySelectorAll('.file-btn').forEach(b => b.classList.remove('active-file'));
    if(btnElement) btnElement.classList.add('active-file');

    // 2. Hide Content (Everything)
    document.querySelectorAll('.viewer-state-screen').forEach(el => el.style.display = 'none'); // Hide loader/locked
    document.querySelectorAll('.proj-details').forEach(d => d.style.display = 'none');

    // 3. CHECK: Is this a locked file?
    if(projectId.includes('locked')) {
        // Show Locked Screen
        const lockedScreen = document.getElementById('proj-locked-msg');
        if(lockedScreen) lockedScreen.style.display = 'flex';
        return; // Stop here
    }

    // 4. Show Loader
    const loader = document.getElementById('proj-loader');
    if(loader) {
        loader.style.display = 'flex';
        const bar = loader.querySelector('.bar-fill');
        if(bar) {
            bar.style.animation = 'none';
            bar.offsetHeight; // Reflow
            bar.style.animation = 'fillBar 0.8s ease-in-out forwards';
        }
    }

    // 5. Reveal Content
    setTimeout(() => {
        if(loader) loader.style.display = 'none';

        const target = document.getElementById(projectId);
        if(target) target.style.display = 'flex';
    }, 800);
};

// C. Experience Animation Trigger (The Prank)
const experienceObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if(entry.isIntersecting) {
            // Add a class that un-pauses the CSS animations
            const scanner = document.getElementById('scanner-ui');
            if(scanner) scanner.classList.add('start-sequence');
        }
    });
}, { threshold: 0.5 });

// D. Init
document.addEventListener('DOMContentLoaded', () => {
    // 1. Load All Modules
    loadModule('bio-container', 'modules/02_profile_bio/view.html');
    loadModule('experience-container', 'modules/02b_experience/view.html'); // NEW
    loadModule('projects-container', 'modules/03_projects_main/view.html'); 
    loadModule('mini-container', 'modules/04_mini_scripts/view.html');
    loadModule('certs-container', 'modules/05_certifications/view.html');
    loadModule('holo-console-container', 'modules/06_holo_console/view.html');
    loadModule('recs-container', 'modules/07_recs_rail/view.html');
    loadModule('transmission-container', 'modules/08_transmission/view.html');
    // 2. Start Observers
    document.querySelectorAll('.step-section').forEach(s => observer.observe(s));
    
    // 3. Start Experience Trigger
    const expSection = document.getElementById('experience');
    if(expSection) experienceObserver.observe(expSection);
});

// C. CYBER WALL GAME LOGIC

// 1. Shuffle Function
function shuffleBricks() {
    const grid = document.querySelector('.constructs-grid');
    if (!grid) return;
    
    // Convert children to array
    const bricks = Array.from(grid.children);
    
    // Fisher-Yates Shuffle Algorithm
    for (let i = bricks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bricks[i], bricks[j]] = [bricks[j], bricks[i]];
    }
    
    // Re-append in new order
    grid.innerHTML = '';
    bricks.forEach(brick => grid.appendChild(brick));
    console.log("SYSTEM: Bricks Shuffled.");
}

// Call shuffle when module is loaded (Hook this into your module loader if possible, or trigger via scroll)
// For now, we'll try to trigger it via an Observer or Timeout
setTimeout(shuffleBricks, 1000); // Safely try to shuffle bricks, waiting for the HTML to load
const attemptShuffle = setInterval(() => {
    const grid = document.querySelector('.constructs-grid');
    if (grid) {
        shuffleBricks();
        clearInterval(attemptShuffle); // Stop checking once found
    }
}, 500); // Check every 0.5 seconds

// 2. Hide Inspector Content (Helper)
function hideInspectorContent() {
    document.getElementById('inspector-placeholder').style.display = 'none';
    document.getElementById('inspector-trap').style.display = 'none';
    document.querySelectorAll('.script-detail').forEach(d => d.style.display = 'none');
}

// 3. REVEAL SAFE BRICK (Project)
window.revealBrick = function(scriptId, btnElement) {
    // If already revealed, just show info and stop
    if(btnElement.classList.contains('revealed-safe')) {
        hideInspectorContent();
        const target = document.getElementById('script-' + scriptId);
        if(target) target.style.display = 'flex';
        return;
    }

    // Mark Visual State (Permanent)
    btnElement.classList.add('revealed-safe');
    
    // Update Inspector
    hideInspectorContent();
    const target = document.getElementById('script-' + scriptId);
    if(target) target.style.display = 'flex';
};

// 4. REVEAL TRAP (Chain Reaction)
window.revealTrap = function(btnElement) {
    // If already revealed, ignore
    if(btnElement.classList.contains('revealed-trap')) return;

    // Mark Visual State
    btnElement.classList.add('revealed-trap');
    
    // Update Inspector (Show Trap Message)
    hideInspectorContent();
    const trapMsg = document.getElementById('inspector-trap');
    const quotes = ["DATA CORRUPTED", "EMPTY SECTOR", "NULL POINTER", "VOID SPACE"];
    trapMsg.querySelector('h2').innerText = quotes[Math.floor(Math.random() * quotes.length)];
    if(trapMsg) trapMsg.style.display = 'flex';

    // TRIGGER CASCADE (Auto-click neighbors)
    triggerCascade(btnElement);
};

// 5. CASCADE LOGIC
function triggerCascade(originBrick) {
    const grid = originBrick.parentElement;
    const allBricks = Array.from(grid.children);
    const index = allBricks.indexOf(originBrick);
    
    // Define Grid Math (Approximate columns based on CSS grid)
    // We'll just pick 2-3 RANDOM neighbors from the whole list to make it fun/chaotic
    const cascadeCount = Math.floor(Math.random() * 3) + 2; // Open 2 to 4 bricks
    
    let attempts = 0;
    let opened = 0;

    // Recursive-ish delay loop
    const cascadeInterval = setInterval(() => {
        if(opened >= cascadeCount || attempts > 20) {
            clearInterval(cascadeInterval);
            return;
        }

        // Pick a random brick nearby (simulating proximity)
        // Range: +/- 5 indexes
        let offset = Math.floor(Math.random() * 10) - 5; 
        let targetIndex = index + offset;
        
        // Bounds check
        if(targetIndex >= 0 && targetIndex < allBricks.length && targetIndex !== index) {
            const target = allBricks[targetIndex];
            
            // Only click if not already revealed
            if(!target.classList.contains('revealed-safe') && !target.classList.contains('revealed-trap')) {
                target.click(); // Simulate Click
                opened++;
            }
        }
        attempts++;
    }, 100); // 100ms delay between pops for cool visual effect
};

/* MODULE 05: DYNAMIC PREVIEW LOGIC */

// Data Map for Skills
const certSkillsData = {
    'c1': ['GCP Architecture', 'Cloud Storage', 'IAM Security', 'App Engine', 'Kubernetes'],
    'c2': ['Scripting', 'Web Scraping (BS4)', 'API Integration', 'Task Automation'],
    'c3': ['Neural Networks', 'AI Strategy', 'Machine Learning Workflow', 'Data Ethics'],
    'c4': ['Linear Algebra', 'Multivariate Calculus', 'Probability Theory', 'Optimization'],
    'c5': ['Python 3', 'Object Oriented Programming', 'Flask/Django', 'Algorithms']
};

let currentCertID = null;

window.openCert = function(id, pdfPath) {
    const layout = document.getElementById('cert-module');
    const iframe = document.getElementById('cert-frame');
    const skillsContainer = document.getElementById('dynamic-skills');
    
    // 1. Highlight Logo
    // Remove active class from all
    document.querySelectorAll('.header-right-logos i').forEach(i => i.classList.remove('active-logo'));
    // Add to current
    const btn = document.getElementById('btn-' + id);
    if(btn) btn.classList.add('active-logo');

    // 2. Expand Layout
    layout.classList.add('expanded');

    // 3. Load PDF (Only if changed)
    if (currentCertID !== id) {
        currentCertID = id;
        
        // Update PDF
        iframe.style.opacity = '0'; // Fade out slightly
        setTimeout(() => {
            iframe.src = pdfPath;
            iframe.style.opacity = '1';
        }, 200);

        // Update Skills
        skillsContainer.innerHTML = ''; // Clear old
        const skills = certSkillsData[id] || [];
        
        skills.forEach((skill, index) => {
            const tag = document.createElement('span');
            tag.className = 'skill-tag';
            tag.innerText = skill;
            tag.style.animationDelay = (index * 0.05) + 's'; // Staggered fade in
            skillsContainer.appendChild(tag);
        });
    }
};

window.closeCert = function() {
    const layout = document.getElementById('cert-module');
    
    // Collapse
    layout.classList.remove('expanded');
    
    // Remove Highlights
    document.querySelectorAll('.header-right-logos i').forEach(i => i.classList.remove('active-logo'));
    
    // Reset ID so re-hovering same logo triggers animation again if desired
    // (Optional: keep currentCertID if you want to remember state)
};

// /* MODULE 06: ACTIVITY SLIDER LOGIC */
document.addEventListener('DOMContentLoaded', () => {
    // ... other modules ...
    
    // LOAD NEW CONSOLE
    loadModule('holo-console-container', 'modules/06_holo_console/view.html');
});

/* ==========================================
   MODULE 06: AR CHRONO-DECK LOGIC (REFINED)
   ========================================== */

let slideInterval;
let railDriftInterval;

// 1. LEFT PANEL SLIDER LOGIC
function startAutoSlide() {
    stopAutoSlide(); 
    slideInterval = setInterval(() => moveSlide(1), 6000);
}

function stopAutoSlide() {
    if(slideInterval) clearInterval(slideInterval);
}

window.manualSlide = function(n) {
    stopAutoSlide();
    moveSlide(n);
    startAutoSlide();
};

window.moveSlide = function(n) {
    const slides = document.querySelectorAll('.left-panel .slide');
    if (!slides.length) return;

    let activeIndex = 0;
    slides.forEach((slide, index) => {
        if (slide.classList.contains('active')) {
            activeIndex = index;
            slide.classList.remove('active');
        }
    });

    let nextIndex = (activeIndex + n + slides.length) % slides.length;
    slides[nextIndex].classList.add('active');
};


// 2. RIGHT PANEL RAIL ENGINE
function initRailEngine() {
    console.log(">> SYSTEM: Initializing Rail Engine...");
    
    const stream = document.getElementById('stream-scroll');
    const railFill = document.getElementById('rail-progress');
    
    if (!stream || !railFill) return;

    // A. Scroll Listener (The Thermometer)
    stream.addEventListener('scroll', () => {
        // Calculate Height
        const maxScroll = stream.scrollHeight - stream.clientHeight;
        const scrollPercent = (stream.scrollTop / maxScroll) * 100;
        railFill.style.height = `${scrollPercent}%`;

        // Active Year Highlight
        const centerLine = stream.scrollTop + (stream.clientHeight / 3);
        document.querySelectorAll('.time-block').forEach(block => {
            if (centerLine >= block.offsetTop && centerLine <= (block.offsetTop + block.clientHeight)) {
                block.classList.add('active-year');
            } else {
                block.classList.remove('active-year');
            }
        });

        // Infinite Loop Glitch (Optional)
        // If you want it to snap back to top endlessly:
        /*
        if (stream.scrollTop >= maxScroll - 2) {
            stream.scrollTop = 1; // Loop
        }
        */
    });

    // B. Auto Drift (Idle Movement)
    let isHovering = false;
    stream.addEventListener('mouseenter', () => isHovering = true);
    stream.addEventListener('mouseleave', () => isHovering = false);

    if (railDriftInterval) clearInterval(railDriftInterval);
    railDriftInterval = setInterval(() => {
        if (!isHovering) {
            stream.scrollTop += 1; // Slow drift
        }
    }, 40);
}


// 3. MASTER INIT
document.addEventListener('DOMContentLoaded', () => {
    // Load the HTML Module
    loadModule('holo-console-container', 'modules/06_holo_console/view.html').then(() => {
        console.log("SYSTEM: AR Chrono-Deck Loaded.");
        
        // Start Left
        startAutoSlide();
        const deck = document.getElementById('visual-deck');
        if(deck) {
            deck.addEventListener('mouseenter', stopAutoSlide);
            deck.addEventListener('mouseleave', startAutoSlide);
        }

        // Start Right (Wait for DOM)
        setTimeout(initRailEngine, 500);
    });
});

/* ==========================================
   MODULE 07: RECS RAIL INFINITY ENGINE
   ========================================== */
function initRecsRail() {
    // const track = document.getElementById('recs-infinity-track');
    // if (!track) return;

    // // Grab the inner content wrapper we just created
    // const content = track.querySelector('.recs-content');
    // if (!content) return;

    // // Clone the entire wrapper perfectly
    // const clone = content.cloneNode(true);
    
    // // Append the clone right next to the original
    // track.appendChild(clone);
    // 2. Dynamic Speed Control (Optional)
    // You can slow down the rail when the user is scrolling slowly
    let lastScrollTop = 0;
    window.addEventListener('scroll', () => {
        const st = window.pageYOffset || document.documentElement.scrollTop;
        const speed = Math.abs(st - lastScrollTop);
        
        // Slightly tilt cards based on scroll velocity
        if (speed > 10) {
            track.style.transition = "transform 1s ease-out";
        }
        lastScrollTop = st <= 0 ? 0 : st;
    }, false);
}

// Ensure this is called in your main loader
// Example: initRecsRail();
