document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const navHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = targetSection.offsetTop - navHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    const navbar = document.querySelector('.fantasy-nav');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            navbar.style.background = 'linear-gradient(135deg, rgba(60, 36, 20, 0.98) 0%, rgba(0, 0, 0, 0.95) 100%)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.8)';
        } else {
            navbar.style.background = 'linear-gradient(135deg, var(--dark-brown) 0%, rgba(60, 36, 20, 0.95) 100%)';
            navbar.style.boxShadow = '0 2px 10px var(--shadow-dark)';
        }
    });

    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value
            };
            
            if (validateForm(formData)) {
                handleFormSubmission(formData);
            }
        });
    }

    function validateForm(data) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!data.name.trim()) {
            showNotification('Please enter your name', 'error');
            return false;
        }
        
        if (!emailRegex.test(data.email)) {
            showNotification('Please enter a valid email address', 'error');
            return false;
        }
        
        if (!data.subject.trim()) {
            showNotification('Please enter a subject', 'error');
            return false;
        }
        
        if (!data.message.trim()) {
            showNotification('Please enter a message', 'error');
            return false;
        }
        
        return true;
    }

    function handleFormSubmission(data) {
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Sending...';
        submitBtn.disabled = true;
        
        setTimeout(() => {
            const mailtoLink = `mailto:your-email@example.com?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(`Name: ${data.name}\nEmail: ${data.email}\n\nMessage:\n${data.message}`)}`;
            
            const tempLink = document.createElement('a');
            tempLink.href = mailtoLink;
            tempLink.click();
            
            contactForm.reset();
            showNotification('Thank you for your message! Your email client should open with the message ready to send.', 'success');
            
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }, 2000);
    }

    function showNotification(message, type = 'info') {
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            z-index: 9999;
            background: ${type === 'error' ? 'linear-gradient(135deg, #8B0000, #CD5C5C)' : 'linear-gradient(135deg, #228B22, #32CD32)'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            animation: slideIn 0.3s ease-out;
            max-width: 400px;
        `;
        

        document.body.appendChild(notification);
        

        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .notification-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .notification-close {
            background: none;
            border: none;
            color: white;
            font-size: 14px;
            cursor: pointer;
            padding: 0;
            margin-left: 15px;
        }
        
        .notification-close:hover {
            opacity: 0.7;
        }
    `;
    document.head.appendChild(style);

    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const heroSection = document.querySelector('.hero-section');
        if (heroSection) {
            heroSection.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    });

    const images = document.querySelectorAll('img');
    images.forEach(img => {

        function showImage() {
            img.style.opacity = '1';
            img.style.transform = 'scale(1)';
        }
        
        img.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        
        if (img.complete && img.naturalHeight !== 0) {

            img.style.opacity = '1';
            img.style.transform = 'scale(1)';
        } else {

            img.style.opacity = '0';
            img.style.transform = 'scale(0.9)';
            

            img.addEventListener('load', showImage);
            img.addEventListener('error', showImage);
            

            setTimeout(showImage, 1000);
        }
    });


    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px) scale(1.05)';
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });


    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    

    const animatedElements = document.querySelectorAll('.feature-card, .gallery-item, .contact-form');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(50px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });


    const placeholderLinks = {
        '#steam-link': 'https://store.steampowered.com/app/YOUR_GAME_ID',
        '#itch-link': 'https://your-username.itch.io/lone-survivors',
        '#bluesky-link': 'https://bsky.app/profile/your-username',
        '#x-link': 'https://x.com/your-username',
        '#tiktok-link': 'https://tiktok.com/@your-username',
        '#youtube-link': 'https://youtube.com/@your-channel'
    };

    Object.keys(placeholderLinks).forEach(selector => {
        const link = document.querySelector(`a[href="${selector}"]`);
        if (link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                showNotification('Please update this link with your actual URL in the JavaScript file!', 'error');
            });
        }
    });


    function playPixelSound(type = 'click') {

        if (type === 'click') {

            const flash = document.createElement('div');
            flash.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(212, 175, 55, 0.1);
                pointer-events: none;
                z-index: 9999;
                animation: flash 0.1s ease-out;
            `;
            
            document.body.appendChild(flash);
            setTimeout(() => flash.remove(), 100);
        }
    }


    buttons.forEach(btn => {
        btn.addEventListener('click', () => playPixelSound('click'));
    });


    const flashStyle = document.createElement('style');
    flashStyle.textContent = `
        @keyframes flash {
            0% { opacity: 0; }
            50% { opacity: 1; }
            100% { opacity: 0; }
        }
    `;
    document.head.appendChild(flashStyle);

    console.log('Lone Survivors website loaded successfully! 🏰⚔️');
});


function openEmailClient() {
    const email = 'coltonmdonk@gmail.com'; 
    const subject = 'Inquiry about Lone Survivors';
    const body = 'Hello,\n\nI am interested in learning more about Lone Survivors.\n\nBest regards,';
    
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
}

function shareGame(platform) {
    const url = window.location.href;
    const title = 'Check out Lone Survivors - Epic Fantasy Adventure Game!';
    const text = 'Embark on an epic fantasy adventure in a world where survival is everything. Play Lone Survivors now!';
    
    const shareUrls = {
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        reddit: `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`
    };
    
    if (shareUrls[platform]) {
        window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
}