const canvas = document.getElementById('galaxy-canvas');
const ctx = canvas.getContext('2d');

// --- NEW CONFIG: DEFINING THE SLEEPING STARS ---
const SECTOR_MAP = {
    // 1. BIO (Top Right)
    'bio': { x: 450, y: -180, color: '#FFD700', icon: 'assets/icons/tech/c.png' }, 
    
    // 2. PROJECTS (Left Center)
    'projects': { x: -450, y: 0, color: '#00FF41', icon: 'assets/icons/tech/json.png' }, 
    
    // 3. MINI PROJECTS (Bottom Right)
    'mini-projects': { x: 450, y: 150, color: '#FF00FF', icon: 'assets/icons/tech/r.png' }, 
    
    // 4. CERTIFICATIONS (Top Left)
    'certifications': { x: -450, y: -150, color: '#00BFFF', icon: 'assets/icons/tech/tensorflow.png' }, 
    
    // 5. EXTRA CURRICULAR (Right Center) - NEW
    'extra': { x: 450, y: 0, color: '#FF69B4', icon: 'assets/icons/tech/numpy.png' },

    // 6. MISC / CLASSIFIED (Bottom Left) - NEW
    'misc': { x: -450, y: 200, color: '#00FFFF', icon: 'assets/icons/tech/r.png' },

    // 7. CONTACT (Bottom Center)
    'contact': { x: 0, y: 280, color: '#FF4500', icon: 'assets/icons/tech/bootstrap.png' }  
};

// ==========================================
// 1. ASSETS CONFIGURATION
// ==========================================
let assets = [
    // GREETINGS
    { type: 'greeting', src: 'assets/icons/greetings/arabic.svg' },
    { type: 'greeting', src: 'assets/icons/greetings/chinese.svg' },
    { type: 'greeting', src: 'assets/icons/greetings/czech.svg' },
    { type: 'greeting', src: 'assets/icons/greetings/french.svg' },
    { type: 'greeting', src: 'assets/icons/greetings/greek.svg' },
    { type: 'greeting', src: 'assets/icons/greetings/hindi.svg' },
    { type: 'greeting', src: 'assets/icons/greetings/japanese.svg' },
    { type: 'greeting', src: 'assets/icons/greetings/kannada.svg' },
    { type: 'greeting', src: 'assets/icons/greetings/korean.svg' },
    { type: 'greeting', src: 'assets/icons/greetings/malayalam.svg' },
    { type: 'greeting', src: 'assets/icons/greetings/namaskaram.svg' },
    { type: 'greeting', src: 'assets/icons/greetings/persian.svg' },
    { type: 'greeting', src: 'assets/icons/greetings/spanish.svg' },
    { type: 'greeting', src: 'assets/icons/greetings/telugu.svg' },
    { type: 'greeting', src: 'assets/icons/greetings/vietnamese.svg' },
    // TECH
    { type: 'tech', src: 'assets/icons/tech/bootstrap.png' },
    { type: 'tech', src: 'assets/icons/tech/c.png' },
    { type: 'tech', src: 'assets/icons/tech/cplusplus.png' },
    { type: 'tech', src: 'assets/icons/tech/css.png' },
    { type: 'tech', src: 'assets/icons/tech/gitextensions.png' },
    { type: 'tech', src: 'assets/icons/tech/github.png' },
    { type: 'tech', src: 'assets/icons/tech/html5.png' },
    // { type: 'tech', src: 'assets/icons/tech/javascript.png' },
    // { type: 'tech', src: 'assets/icons/tech/json.png' },
    // { type: 'tech', src: 'assets/icons/tech/linux.png' },
    // { type: 'tech', src: 'assets/icons/tech/macos.png' },
    // { type: 'tech', src: 'assets/icons/tech/numpy.png' },
    // { type: 'tech', src: 'assets/icons/tech/nvidia.png' },
    // { type: 'tech', src: 'assets/icons/tech/pandas.png' },
    // { type: 'tech', src: 'assets/icons/tech/python.png' },
    // { type: 'tech', src: 'assets/icons/tech/r.png' },
    // { type: 'tech', src: 'assets/icons/tech/react.png' },
    // { type: 'tech', src: 'assets/icons/tech/tensorflow.png' },
];

// PRELOADER
const starObjects = [];
assets.forEach(item => {
    const img = new Image();
    if(item.src) img.src = item.src;
    starObjects.push({ img: img, type: item.type, loaded: false });
    img.onload = () => { item.loaded = true; };
});

// ==========================================
// 2. SYSTEM STATE
// ==========================================
let width, height, centerX, centerY;
let cameraZoom = 5;       
let targetZoom = 5;       
let sunPulse = 0;         
let isExploding = false;  
let maxOrbit = 1000; 
let cameraY = 0;          // Where we are in the universe
let targetCameraY = 0;    // Where we want to go

// ==========================================
// 3. THE DUST CLASS (The Milky Way Ring)
// ==========================================
class Dust {
    constructor() {
        this.reset();
        this.angle = Math.random() * Math.PI * 2;
    }

    reset() {
        this.orbitRadius = 160 + Math.random() * 800; 
        this.speed = (0.00005 + Math.random() * 0.0001) * (500 / this.orbitRadius);
        this.yOffset = (Math.random() - 0.5) * 80; 
        this.size = 0.5 + Math.random() * 1.5; 
        this.opacity = 0.4 + Math.random() * 0.6; 
    }

    update() {
        this.angle += this.speed;
    }

    draw() {
        if (cameraZoom > 3) return; 

        // Apply CameraY to dust as well
        let dustY = centerY - cameraY * 0.2; // Move slower (Parallax)

        const x = centerX + Math.cos(this.angle) * this.orbitRadius * (1/cameraZoom);
        const y = dustY + (Math.sin(this.angle) * this.orbitRadius * 0.4 + this.yOffset) * (1/cameraZoom);

        ctx.save();
        ctx.fillStyle = "white";
        ctx.shadowColor = "white";
        ctx.shadowBlur = 2; 
        ctx.globalAlpha = this.opacity;
        ctx.beginPath();
        ctx.arc(x, y, this.size * (1/cameraZoom), 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
    }
}

//4. Star

class Star {
    constructor(index, total) {
        // 1. Assign Asset
        if(starObjects.length > 0) {
            this.obj = starObjects[index % starObjects.length];
        } else {
            this.obj = { type: 'greeting', label: '?', img: null };
        }
        
        this.index = index;

        // 2. Setup Type & Position
        if (this.obj.type === 'greeting') {
            // Greetings Orbit Sun closely
            let angleStep = (Math.PI * 2) / 15; 
            this.angle = index * angleStep;
            this.orbitRadius = 1800;
        } else {
            // Tech Stars: Assigned to Sectors based on the Map
            let keys = Object.keys(SECTOR_MAP);
            this.sectorName = keys[index % keys.length]; 
            
            let config = SECTOR_MAP[this.sectorName];
            this.baseX = config.x;
            this.baseY = config.y;
            this.color = config.color;
        }
    }

    draw() {
        let size = 0;
        let opacity = 0;
        let x = 0;
        let y = 0;

        // === STATE LOGIC ===
        if (cameraZoom > 2) {
            // SCENARIO A: INTRO (Zoomed In)
            if(this.obj.type === 'greeting') {
                size = 200;
                opacity = (cameraZoom - 2) / 2;
                // Rotate Greetings
                this.angle += 0.002;
                x = centerX + Math.cos(this.angle) * this.orbitRadius * (1/cameraZoom);
                y = centerY + Math.sin(this.angle) * this.orbitRadius * 0.4 * (1/cameraZoom);
            }
        } else {
            // SCENARIO B: SLIDESHOW (Zoomed Out)
            if(this.obj.type === 'greeting') {
                opacity = 0; // Hide greetings
            } else {
                // Determine Size based on Active Sector
                if (currentSector === this.sectorName) {
                    size = 80; // WAKE UP: Big Planet
                    opacity = 1;
                } else {
                    size = 8;   // SLEEP: Tiny blinking star
                    // Subtle blink effect
                    opacity = 0.5 + Math.sin(Date.now() * 0.005 + this.index) * 0.2;
                }
                
                // Fixed Position (No scrolling physics!)
                x = centerX + this.baseX * (1/cameraZoom);
                y = centerY + this.baseY * (1/cameraZoom);
            }
        }

        if (opacity <= 0.01) return;

        // === DRAWING ===
        ctx.save();
        ctx.globalAlpha = opacity;

        // Sun Silhouette (Only for greetings)
        let isOverSun = false;
        if(this.obj.type === 'greeting') {
            let isInFront = Math.sin(this.angle) > 0;
            let dist = Math.abs(x - centerX);
            isOverSun = isInFront && dist < 160;
        }

        if(isOverSun) {
            ctx.filter = "brightness(0)"; 
        } else {
            ctx.filter = "none";
            // Custom Glow
            ctx.shadowColor = (this.obj.type !== 'greeting') ? this.color : '#FFD700';
            ctx.shadowBlur = (size > 50) ? 50 : 10;
        }

        if (this.obj.img && this.obj.img.complete && size > 10) {
            ctx.drawImage(this.obj.img, x - size/2, y - size/2, size, size);
        } else {
            // Draw Dot if image not ready or sleeping
            ctx.fillStyle = this.color || '#FFD700';
            ctx.beginPath(); 
            ctx.arc(x, y, size/2, 0, Math.PI*2); 
            ctx.fill();
        }
        ctx.restore();
    }
    
    update() {} // Logic is handled inside draw() for this pattern
}

// ==========================================
// 5. THE PROCEDURAL SUN (FIXED POSITIONING)
// ==========================================
function drawSun() {
    let baseRadius = 130 * (cameraZoom > 1 ? cameraZoom * 0.5 : 1);
    sunPulse += 0.005; 
    
    // FIX: Removed "- cameraY". The Sun is now anchored to the center.
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
        ctx.beginPath();
        ctx.ellipse(0, 0, flareSize, flareSize * 0.8, 0, 0, Math.PI*2);
        ctx.fill();
        
        ctx.rotate(-flareAngle); 
        ctx.translate(-centerX, -sunY);
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
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    
    // LAYER 3: ATMOSPHERE
    ctx.shadowColor = "#FF8C00";
    ctx.shadowBlur = baseRadius * 0.5;
    ctx.fillStyle = "rgba(255, 215, 0, 0.1)"; 
    ctx.fill();
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
// 6. ANIMATION LOOP
// ==========================================
const stars = [];

// Create exactly as many stars as we have assets
for(let i=0; i<assets.length; i++) {
    stars.push(new Star(i, assets.length)); 
}

const dustParticles = [];
for(let i=0; i<400; i++) dustParticles.push(new Dust());

function animate() {
    // Zoom Logic
    if (Math.abs(targetZoom - cameraZoom) > 0.01) {
        cameraZoom += (targetZoom - cameraZoom) * 0.02; 
    }

    // REMOVED: cameraY += ... (We don't need this anymore!)

    ctx.clearRect(0,0, canvas.width, canvas.height);

    // 1. Back Layer
    dustParticles.forEach(d => { d.update(); d.draw(); });
    
    // 2. Stars (Background & Active Planets)
    stars.filter(s => s.obj.type !== 'greeting').forEach(s => s.draw());

    // 3. Sun (Always Center)
    drawSun();

    // 4. Greetings (Foreground, Intro only)
    stars.filter(s => s.obj.type === 'greeting').forEach(s => s.draw());

    requestAnimationFrame(animate);
}

// // SCROLL LISTENER
// window.addEventListener('scroll', () => {
//     targetCameraY = window.scrollY;
// });

// NEW: OBSERVER - Detects which slide is on screen
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            currentSector = entry.target.id; // Updates global state
            console.log("Active Sector:", currentSector);
        }
    });
}, { threshold: 0.5 }); // Trigger when 50% of the section is visible

// Start observing after DOM load
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.step-section').forEach(section => {
        observer.observe(section);
    });
});

// RESIZE
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    centerX = canvas.width / 2;
    centerY = canvas.height / 2;
    maxOrbit = Math.sqrt(canvas.width**2 + canvas.height**2) * 0.8;
}
window.addEventListener('resize', resize);
resize();
animate();

// CLICK
document.addEventListener('click', () => {
    if(!isExploding) {
        isExploding = true;
        targetZoom = 1;
        document.getElementById('transition-flash').classList.add('flash-bang');
        setTimeout(() => {
            document.body.style.overflowY = "auto"; 
            const ui = document.getElementById('main-interface');
            ui.classList.remove('hidden');
            ui.classList.add('visible');
            document.getElementById('intro-layer').style.pointerEvents = "none";
        }, 1000);
    }
});

// BRIDGE
window.galaxyControl = {
    unlock: () => { targetZoom = 1; isExploding = true; },
    setFocus: (sectionName) => { window.currentSection = sectionName; }
};