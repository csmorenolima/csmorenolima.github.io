// B-Blob Character System
(function(){
    const btn = document.getElementById('activePlayBtn');
    if(!btn) return;

    // --- Tiny Character Setup (Cute Animal Inspired) ---
    let characterEl = null;
    let animationFrame = null;
    let wanderTimer = 0;
    let targetX = null;
    let targetY = null;
    let direction = 1; // 1 = right, -1 = left
    const wanderAreaPadding = 60; // keep inside viewport
    const speed = 0.8; // base movement speed
    
    // Burst/collection system
    let miniBlobs = [];
    let isCollecting = false;
    let collectionProgress = 0;
    let isFrustrated = false; // Track if B-Blob is frustrated
    const maxMiniBlobs = 8;

    // --- Character Creation with Dizzy Intro ---
    function createCharacterWithDizzyIntro() {
        createCharacter();
        
        // Show dizzy face for 2 seconds, then return to normal
        if(characterEl) {
            characterEl.innerHTML = createCharacterSVG(1.0, true); // Dizzy face
            
            setTimeout(() => {
                if(characterEl) {
                    characterEl.innerHTML = createCharacterSVG(1.0, false); // Normal face
                }
            }, 2000);
        }
    }

    function createCharacter(){
        if(characterEl) return characterEl;
        characterEl = document.createElement('div');
        characterEl.id = 'tinyCharacter';
        characterEl.setAttribute('aria-hidden','true');
        
        // Start character near the About section or middle of page
        const aboutSection = document.querySelector('#about') || document.querySelector('.about');
        let startY = window.innerHeight / 2 + window.scrollY;
        if(aboutSection) {
            const aboutRect = aboutSection.getBoundingClientRect();
            startY = aboutRect.top + window.scrollY + aboutRect.height / 2;
        }
        
        characterEl.style.cssText = `
            position: absolute;
            top: ${startY - 36}px;
            left: ${(window.innerWidth/2) - 36}px;
            width: 72px;
            height: 72px;
            pointer-events: auto;
            z-index: 8800;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            transition: filter .4s ease;
            animation: tc-breathe 3s ease-in-out infinite;
            cursor: pointer;
        `;
        
        characterEl.innerHTML = createCharacterSVG(1.0); // Full size
        
        // Add click handler for burst effect
        characterEl.addEventListener('click', handleCharacterClick);
        
        document.body.appendChild(characterEl);
        injectCharacterStyles();
        targetX = window.innerWidth/2;
        targetY = startY;
        wanderTimer = 0;
        animate();
    }

    function injectCharacterStyles(){
        if(document.getElementById('tinyCharacterStyles')) return;
        const style = document.createElement('style');
        style.id = 'tinyCharacterStyles';
        style.textContent = `
            @keyframes tc-breathe {0%,100%{transform:scale(1);}50%{transform:scale(1.02);} }
            #tinyCharacter.walking svg { animation: tc-walk-bob .45s ease-in-out infinite; }
            @keyframes tc-walk-bob {0%,100%{transform:translateY(0);}50%{transform:translateY(-4px);} }
            #tinyCharacter.idle svg { animation: tc-idle 3.5s ease-in-out infinite; }
            @keyframes tc-idle {0%,100%{transform:translateY(0);}40%{transform:translateY(-3px);} }
            #tinyCharacter.flip { transform: scaleX(-1); }
            .mini-blob { pointer-events: auto; cursor: pointer; transition: transform .2s ease; }
            .mini-blob:hover { transform: scale(1.1); }
            .mini-blob.collected { animation: tc-collect .4s ease-out forwards; }
            @keyframes tc-collect { 0%{transform:scale(1);opacity:1;} 100%{transform:scale(0);opacity:0;} }
            @keyframes tc-burst { 0%{transform:scale(1);} 50%{transform:scale(1.3);} 100%{transform:scale(1);} }
            .burst-effect { animation: tc-burst .6s ease-out; }
        `;
        document.head.appendChild(style);
    }

    function createCharacterSVG(sizeMultiplier = 1.0, isDizzy = false, isFrustrated = false) {
        const size = 72 * sizeMultiplier;
        const gradientId = `tcGrad${Math.random().toString(36).substr(2,9)}`;
        
        // Different colors, eyes and mouth based on state
        let bodyColors, eyesHTML, mouthHTML;
        
        if(isFrustrated) {
            // Red frustrated colors
            bodyColors = `
                  <stop offset="0%" stop-color="#ef4444"/>
                  <stop offset="50%" stop-color="#dc2626"/>
                  <stop offset="100%" stop-color="#b91c1c"/>`;
            // Angry squinted eyes
            eyesHTML = `
              <path d="M26 32 L34 36 L26 36 Z" fill="#111"/>
              <path d="M40 36 L48 32 L48 36 Z" fill="#111"/>`;
            // Frustrated frown
            mouthHTML = `<path d="M34 48 Q37 45 40 48" stroke="#111" stroke-width="2.5" stroke-linecap="round" fill="none"/>`;
        } else if(isDizzy) {
            // Normal colors but dizzy face
            bodyColors = `
                  <stop offset="0%" stop-color="#8b5cf6"/>
                  <stop offset="50%" stop-color="#6366f1"/>
                  <stop offset="100%" stop-color="#06b6d4"/>`;
            // Dizzy spiral eyes
            eyesHTML = `
              <path d="M30 32 Q28 30 26 32 Q28 34 30 32 Q32 30 30 32" stroke="#111" stroke-width="2" fill="none"/>
              <path d="M44 32 Q42 30 40 32 Q42 34 44 32 Q46 30 44 32" stroke="#111" stroke-width="2" fill="none"/>`;
            // Wavy dizzy mouth  
            mouthHTML = `<path d="M32 44 Q35 42 38 44 Q35 46 32 44" stroke="#111" stroke-width="2.5" stroke-linecap="round" fill="none"/>`;
        } else {
            // Normal happy colors
            bodyColors = `
                  <stop offset="0%" stop-color="#8b5cf6"/>
                  <stop offset="50%" stop-color="#6366f1"/>
                  <stop offset="100%" stop-color="#06b6d4"/>`;
            // Normal round eyes
            eyesHTML = `
              <circle cx="30" cy="34" r="3.2" fill="#111"/>
              <circle cx="44" cy="34" r="3.2" fill="#111"/>`;
            // Normal smile
            mouthHTML = `<path d="M34 44 Q37 47 40 44" stroke="#111" stroke-width="2.5" stroke-linecap="round" fill="none"/>`;
        }
        
        return `
            <svg width="${size}" height="${size}" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="${gradientId}" x1="0" y1="0" x2="72" y2="72" gradientUnits="userSpaceOnUse">
                  ${bodyColors}
                </linearGradient>
              </defs>
              <!-- Body -->
              <path d="M18 30 Q14 10 28 14 Q35 2 44 14 Q60 10 56 30 Q66 34 64 46 Q62 60 48 64 Q40 70 32 64 Q14 60 12 46 Q10 34 18 30Z" fill="url(#${gradientId})" stroke="#1f1f29" stroke-width="3" stroke-linejoin="round"/>
              <!-- Blush -->
              <circle cx="30" cy="38" r="4" fill="#f9a8d4" opacity="0.85"/>
              <circle cx="44" cy="38" r="4" fill="#f9a8d4" opacity="0.85"/>
              <!-- Eyes -->
              ${eyesHTML}
              <!-- Mouth -->
              ${mouthHTML}
            </svg>`;
    }

    function handleCharacterClick(e) {
        e.stopPropagation();
        if(isCollecting || miniBlobs.length > 0) return; // Already burst
        
        // Immediately become frustrated when exploding
        isFrustrated = true;
        
        // Add burst effect to main character
        characterEl.classList.add('burst-effect');
        setTimeout(() => characterEl.classList.remove('burst-effect'), 600);
        
        createMiniBlobs();
        setTimeout(() => startCollection(), 1500); // Brief delay before collection starts
    }

    function createMiniBlobs() {
        const rect = characterEl.getBoundingClientRect();
        const centerX = rect.left + rect.width/2;
        const centerY = rect.top + window.scrollY + rect.height/2;
        
        for(let i = 0; i < maxMiniBlobs; i++) {
            const miniBlob = document.createElement('div');
            miniBlob.className = 'mini-blob';
            miniBlob.style.cssText = `
                position: absolute;
                width: 24px;
                height: 24px;
                top: ${centerY - 12}px;
                left: ${centerX - 12}px;
                z-index: 8799;
                pointer-events: auto;
                cursor: pointer;
            `;
            
            miniBlob.innerHTML = createCharacterSVG(0.33);
            
            // Random burst direction with wider dispersion
            const angle = (Math.PI * 2 * i) / maxMiniBlobs + (Math.random() - 0.5) * 0.8;
            const distance = 200 + Math.random() * 400; // Increased from 100-250 to 200-600
            const targetX = centerX + Math.cos(angle) * distance;
            const targetY = centerY + Math.sin(angle) * distance;
            
            // Store movement data with increased velocity
            miniBlob.targetX = Math.max(50, Math.min(window.innerWidth - 50, targetX));
            miniBlob.targetY = Math.max(50, Math.min(document.body.scrollHeight - 50, targetY));
            miniBlob.vx = (miniBlob.targetX - centerX) * 0.035; // Increased from 0.02 to 0.035
            miniBlob.vy = (miniBlob.targetY - centerY) * 0.035;
            miniBlob.collected = false;
            
            document.body.appendChild(miniBlob);
            miniBlobs.push(miniBlob);
            
            // Animate to burst position
            requestAnimationFrame(() => animateMiniBlob(miniBlob));
        }
        
        // Make main character smaller and start hunting (frustrated/red)
        characterEl.style.transform = 'scale(0.8)';
        characterEl.innerHTML = createCharacterSVG(0.8, false, true); // Show frustrated state
    }

    function animateMiniBlob(blob) {
        if(blob.collected) return;
        
        const rect = blob.getBoundingClientRect();
        const currentX = rect.left + 12;
        const currentY = rect.top + window.scrollY + 12;
        
        const diffX = blob.targetX - currentX;
        const diffY = blob.targetY - currentY;
        
        if(Math.abs(diffX) > 2 || Math.abs(diffY) > 2) {
            blob.style.left = (currentX + blob.vx - 12) + 'px';
            blob.style.top = (currentY + blob.vy - 12) + 'px';
            blob.vx *= 0.95; // Friction
            blob.vy *= 0.95;
            requestAnimationFrame(() => animateMiniBlob(blob));
        } else {
            // Start wandering
            blob.wanderTimer = Math.random() * 120;
            blob.wanderVx = (Math.random() - 0.5) * 0.3;
            blob.wanderVy = (Math.random() - 0.5) * 0.3;
            wanderMiniBlob(blob);
        }
    }

    function wanderMiniBlob(blob) {
        if(blob.collected) return;
        
        blob.wanderTimer--;
        if(blob.wanderTimer <= 0) {
            blob.wanderVx = (Math.random() - 0.5) * 0.4;
            blob.wanderVy = (Math.random() - 0.5) * 0.4;
            blob.wanderTimer = 60 + Math.random() * 120;
        }
        
        const rect = blob.getBoundingClientRect();
        let newX = rect.left + blob.wanderVx;
        let newY = rect.top + window.scrollY + blob.wanderVy;
        
        // Keep in bounds
        newX = Math.max(20, Math.min(window.innerWidth - 44, newX));
        newY = Math.max(20, Math.min(document.body.scrollHeight - 44, newY));
        
        blob.style.left = newX + 'px';
        blob.style.top = newY + 'px';
        
        requestAnimationFrame(() => wanderMiniBlob(blob));
    }

    function startCollection() {
        isCollecting = true;
        collectionProgress = 0;
        
        // Speed up main character for collection
        wanderTimer = 0; // Immediate new target
    }

    function collectMiniBlob(blob) {
        if(blob.collected) return;
        
        blob.collected = true;
        blob.classList.add('collected');
        collectionProgress++;
        
        // Grow main character back gradually
        const newScale = 0.8 + (collectionProgress / maxMiniBlobs) * 0.2;
        characterEl.style.transform = `scale(${newScale})`;
        characterEl.innerHTML = createCharacterSVG(newScale);
        
        setTimeout(() => {
            if(blob.parentNode) blob.parentNode.removeChild(blob);
            const index = miniBlobs.indexOf(blob);
            if(index > -1) miniBlobs.splice(index, 1);
            
            if(collectionProgress >= maxMiniBlobs) {
                // Fully restored!
                characterEl.style.transform = 'scale(1)';
                characterEl.innerHTML = createCharacterSVG(1.0);
                isCollecting = false;
                isFrustrated = false; // Reset frustration state
                collectionProgress = 0;
            }
        }, 400);
    }

    function pickNewTarget(){
        const minX = wanderAreaPadding;
        const maxX = window.innerWidth - wanderAreaPadding;
        const minY = wanderAreaPadding;
        const maxY = document.body.scrollHeight - wanderAreaPadding;
        targetX = Math.random() * (maxX - minX) + minX;
        targetY = Math.random() * (maxY - minY) + minY;
    }

    function animate(){
        if(!characterEl) return;
        
        if(isCollecting && miniBlobs.length > 0) {
            // Collection mode: hunt the nearest mini blob
            const rect = characterEl.getBoundingClientRect();
            const charX = rect.left + rect.width/2;
            const charY = rect.top + window.scrollY + rect.height/2;
            
            let nearestBlob = null;
            let nearestDistance = Infinity;
            let nearestReachableBlob = null;
            let nearestReachableDistance = Infinity;
            let uncollectedBlobs = 0;
            let unreachableBlobs = 0;
            
            miniBlobs.forEach(blob => {
                if(blob.collected) return;
                uncollectedBlobs++;
                
                const blobRect = blob.getBoundingClientRect();
                const blobX = blobRect.left + 12;
                const blobY = blobRect.top + window.scrollY + 12;
                const distance = Math.sqrt((charX - blobX)**2 + (charY - blobY)**2);
                
                // Check if blob is outside viewport (unreachable)
                const isOutsideViewport = (
                    blobRect.left < -24 || 
                    blobRect.right > window.innerWidth + 24 ||
                    blobRect.top < -24 || 
                    blobRect.bottom > window.innerHeight + 24
                );
                
                if(isOutsideViewport) {
                    unreachableBlobs++;
                } else {
                    // This blob is reachable, consider it for targeting
                    if(distance < nearestReachableDistance) {
                        nearestReachableDistance = distance;
                        nearestReachableBlob = blob;
                    }
                }
                
                // Track overall nearest regardless of reachability
                if(distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestBlob = blob;
                }
            });
            
            // B-Blob stays frustrated until ALL blobs are collected
            // Only becomes neutral when fully restored
            const hasUnreachableBlobs = unreachableBlobs > 0;
            const hasAnyUncollectedBlobs = uncollectedBlobs > 0;
            
            // Update frustration state and appearance
            const wasFrustrated = isFrustrated;
            
            // B-Blob is frustrated if there are ANY uncollected blobs OR unreachable blobs
            // Only becomes calm when collection is complete
            if(hasAnyUncollectedBlobs) {
                isFrustrated = true; // Stay frustrated during collection phase
            }
            // Note: isFrustrated will be reset to false only in collectMiniBlob when fully restored
            
            if(isFrustrated !== wasFrustrated) {
                // State changed, update appearance
                const currentScale = characterEl.style.transform.includes('scale') ? 
                    parseFloat(characterEl.style.transform.match(/scale\(([^)]+)\)/)?.[1] || 1) : 1;
                characterEl.innerHTML = createCharacterSVG(currentScale, false, isFrustrated);
            }
            
            // Smart targeting: prioritize reachable blobs over unreachable ones
            const targetBlob = nearestReachableBlob || nearestBlob;
            
            if(targetBlob) {
                const blobRect = targetBlob.getBoundingClientRect();
                targetX = blobRect.left + 12;
                targetY = blobRect.top + window.scrollY + 12;
                
                // Check if close enough to collect (only if it's reachable)
                if(nearestReachableBlob && nearestReachableDistance < 40) {
                    collectMiniBlob(nearestReachableBlob);
                }
            }
        } else {
            // Normal wandering mode
            wanderTimer--;
            if(wanderTimer <= 0){
                pickNewTarget();
                wanderTimer = Math.floor(Math.random()*300) + 180; // 3–8s
            }
        }
        
        const rect = characterEl.getBoundingClientRect();
        let currentX = rect.left + rect.width/2;
        let currentY = rect.top + window.scrollY + rect.height/2;
        
        const diffX = targetX - currentX;
        const diffY = targetY - currentY;
        const distance = Math.sqrt(diffX*diffX + diffY*diffY);
        
        if(distance > 2) {
            const moveSpeed = isCollecting ? speed * 1.5 : speed; // Faster when collecting
            const moveX = (diffX / distance) * moveSpeed;
            const moveY = (diffY / distance) * moveSpeed;
            currentX += moveX;
            currentY += moveY;
            
            // Clamp position to page bounds
            const minX = wanderAreaPadding + 36;
            const maxX = window.innerWidth - wanderAreaPadding - 36;
            const minY = wanderAreaPadding + 36;
            const maxY = document.body.scrollHeight - wanderAreaPadding - 36;
            
            currentX = Math.max(minX, Math.min(maxX, currentX));
            currentY = Math.max(minY, Math.min(maxY, currentY));
            
            direction = moveX < 0 ? -1 : 1;
        }

        // Apply position (convert back to left/top edge)
        characterEl.style.left = (currentX - 36) + 'px';
        characterEl.style.top = (currentY - 36) + 'px';
        
        // Flip based on direction
        if(direction < 0){
            characterEl.firstElementChild.style.transform = 'scaleX(-1)';
        } else {
            characterEl.firstElementChild.style.transform = 'scaleX(1)';
        }
        // State class
        if(distance > 4){
            characterEl.classList.add('walking');
            characterEl.classList.remove('idle');
        } else {
            characterEl.classList.add('idle');
            characterEl.classList.remove('walking');
        }
        animationFrame = requestAnimationFrame(animate);
    }

    function destroyCharacter(){
        // Cancel animation
        if(animationFrame) cancelAnimationFrame(animationFrame);
        
        // Remove main character
        if(characterEl && characterEl.parentNode) characterEl.parentNode.removeChild(characterEl);
        characterEl = null;
        
        // Clean up all mini blobs
        miniBlobs.forEach(blob => {
            if(blob && blob.parentNode) {
                blob.parentNode.removeChild(blob);
            }
        });
        
        // Reset all collection state
        miniBlobs = [];
        isCollecting = false;
        isFrustrated = false;
        collectionProgress = 0;
    }

    // --- Button interactions ---
    btn.addEventListener('mouseenter',()=>{
        btn.style.transform='translateY(-3px)';
        btn.style.boxShadow='0 10px 24px rgba(99,102,241,0.35)';
    });
    btn.addEventListener('mouseleave',()=>{
        btn.style.transform='translateY(0)';
        btn.style.boxShadow='0 6px 18px rgba(0,0,0,0.18)';
    });
    btn.addEventListener('focus',()=>btn.style.outline='2px solid #06b6d4');
    btn.addEventListener('blur',()=>btn.style.outline='none');
    btn.addEventListener('click',()=>{
        btn.classList.toggle('active');
        const active = btn.classList.contains('active');
        if(active){
            btn.textContent='Hide B-Blob';
            btn.style.background='linear-gradient(45deg,#06b6d4,#6366f1)';
            createCharacterWithDizzyIntro();
        } else {
            btn.textContent='Activate B-Blob';
            btn.style.background='linear-gradient(45deg,#6366f1,#8b5cf6)';
            destroyCharacter();
        }
    });

    // Accessibility: toggle with Enter/Space when focused
    btn.addEventListener('keydown', (e)=>{
        if(e.code==='Enter' || e.code==='Space'){
            e.preventDefault();
            btn.click();
        }
    });

    // Handle window resize to keep character and target inside bounds
    window.addEventListener('resize', ()=>{
        if(!characterEl) return;
        const rect = characterEl.getBoundingClientRect();
        let currentX = rect.left + 36;
        let currentY = rect.top + window.scrollY + 36;
        const minX = wanderAreaPadding + 36;
        const maxX = window.innerWidth - wanderAreaPadding - 36;
        const minY = wanderAreaPadding + 36;
        const maxY = document.body.scrollHeight - wanderAreaPadding - 36;
        
        currentX = Math.max(minX, Math.min(maxX, currentX));
        currentY = Math.max(minY, Math.min(maxY, currentY));
        
        characterEl.style.left = (currentX - 36) + 'px';
        characterEl.style.top = (currentY - 36) + 'px';
        
        // Update target if it's now out of bounds
        if(targetX < minX || targetX > maxX || targetY < minY || targetY > maxY) {
            pickNewTarget();
        }
    });
})();