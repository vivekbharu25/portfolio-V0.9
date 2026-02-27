// ==========================================
// 8. ISOLATED TAB LOGIC (Crash Proof)
// ==========================================
window.switchTab = function(projectId, btnElement) {
    console.log("Switching to:", projectId); // Debug log

    // 1. Hide all project cards
    const allCards = document.querySelectorAll('.project-card');
    allCards.forEach(card => {
        card.classList.remove('active-card');
        card.style.display = 'none'; // Force hide
    });

    // 2. Deactivate all buttons
    const allBtns = document.querySelectorAll('.tab-btn');
    allBtns.forEach(btn => {
        btn.classList.remove('active');
    });

    // 3. Show the selected card
    const target = document.getElementById(projectId);
    if(target) {
        target.classList.add('active-card');
        target.style.display = 'flex'; // Force show
    } else {
        console.error("Target card not found:", projectId);
    }

    // 4. Activate the clicked button
    if(btnElement) {
        btnElement.classList.add('active');
    }
};