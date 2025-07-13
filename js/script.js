// Mobile Navigation Toggle
console.log('Script.js loaded successfully!');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded event fired');
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Form submission handling
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        console.log('Order form found, attaching event listener');
        orderForm.addEventListener('submit', handleFormSubmission);
        
        // Add debugging for button click
        const submitBtn = orderForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            console.log('Submit button found:', submitBtn);
        } else {
            console.error('Submit button not found!');
        }
    } else {
        console.error('Order form not found!');
    }

    // Navbar background change on scroll
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(20, 20, 20, 0.98)';
        } else {
            navbar.style.background = 'rgba(20, 20, 20, 0.95)';
        }
    });
});

// Form submission handler
async function handleFormSubmission(e) {
    console.log('=== FORM SUBMISSION STARTED ===');
    console.log('Event:', e);
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    console.log('Form data collected:', {
        name: formData.get('name'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        address: formData.get('address'),
        items: formData.get('items'),
        special: formData.get('special')
    });
    
    // Get form values
    const orderData = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        address: formData.get('address'),
        items: formData.get('items'),
        special: formData.get('special') || 'None'
    };

    // Validate required fields
    if (!orderData.name || !orderData.phone || !orderData.email || !orderData.address) {
        showMessage('Please fill in all required fields (Name, Phone, Email, Address).', 'error');
        return;
    }
    
    // Check if items are specified (either through cart or manual entry)
    if (!orderData.items || orderData.items.trim().length === 0) {
        showMessage('Please add items to your cart first, or contact us via WhatsApp to place an order.', 'error');
        // Scroll to menu section to help user add items
        document.getElementById('menu').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
        return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(orderData.email)) {
        showMessage('Please enter a valid email address.', 'error');
        return;
    }

    // Validate phone number (basic validation for Bangladesh numbers)
    const phoneRegex = /^(\+?880|0)?1[3-9]\d{8}$/;
    if (!phoneRegex.test(orderData.phone.replace(/\s+/g, ''))) {
        showMessage('Please enter a valid Bangladeshi phone number.', 'error');
        return;
    }

    // Disable submit button and show loading
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Placing Order...';

    try {
        // Log order to console for debugging
        console.log('=== NEW ORDER RECEIVED ===');
        console.log('Order Data:', orderData);
        console.log('Timestamp:', new Date().toISOString());
        
        // Send notifications
        console.log('About to send notifications...');
        
        try {
            console.log('Sending WhatsApp notification...');
            await sendWhatsAppNotification(orderData);
            console.log('WhatsApp notification sent successfully');
        } catch (error) {
            console.error('WhatsApp notification failed:', error);
        }
        
        try {
            console.log('Sending email notification...');
            await sendEmailNotification(orderData);
            console.log('Email notification sent successfully');
        } catch (error) {
            console.error('Email notification failed:', error);
        }

        console.log('All notifications processed');

        // Clear cart after successful order
        console.log('Clearing cart...');
        clearCart();
        
        // Show success message
        console.log('Showing success message...');
        showMessage('Order placed successfully! We will contact you soon to confirm your order.', 'success');
        
        // Reset form
        console.log('Resetting form...');
        form.reset();
        
        console.log('Order process completed successfully!');
        
    } catch (error) {
        console.error('Error submitting order:', error);
        showMessage('There was an error placing your order. Please try contacting us directly via WhatsApp.', 'error');
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Send WhatsApp notification
async function sendWhatsAppNotification(orderData) {
    console.log('Creating WhatsApp message...');
    const orderId = generateOrderId();
    console.log('Generated Order ID:', orderId);
    
    const message = createWhatsAppMessage(orderData, orderId);
    console.log('WhatsApp message created:', message);
    
    const whatsappUrl = `https://wa.me/8801721779304?text=${encodeURIComponent(message)}`;
    console.log('WhatsApp URL:', whatsappUrl);
    
    // Open WhatsApp in a new tab
    console.log('Opening WhatsApp...');
    window.open(whatsappUrl, '_blank');
    console.log('WhatsApp window opened');
    
    return Promise.resolve();
}

// Send email notification using EmailJS
async function sendEmailNotification(orderData) {
    // EmailJS Configuration
    const SERVICE_ID = 'service_faeao5a'; // Correct working service ID
    const TEMPLATE_ID = 'template_q1b8u3a'; // Your template ID  
    const PUBLIC_KEY = 'kdvoVvR5vvAE1Pomx'; // Your public key
    
    try {
        console.log('Checking EmailJS availability...');
        // If EmailJS is configured, send automatic email
        if (typeof emailjs !== 'undefined') {
            console.log('EmailJS is available, sending email...');
            
            // Generate order ID
            const orderId = generateOrderId();
            
            // Template parameters - matching EmailJS template exactly
            const orders = parseOrderItems(orderData.items);
            const subtotal = orders.reduce((sum, order) => sum + (order.price * order.units), 0);
            const shipping = 60;
            const total = subtotal + shipping;
            
            const templateParams = {
                order_id: orderId,
                orders: orders,
                cost: {
                    total: total.toFixed(2)
                },
                email: orderData.email
            };
            
            console.log('=== EMAILJS DEBUG INFO ===');
            console.log('Service ID:', SERVICE_ID);
            console.log('Template ID:', TEMPLATE_ID);
            console.log('Public Key:', PUBLIC_KEY);
            console.log('Template params:', JSON.stringify(templateParams, null, 2));
            console.log('=========================');
            
            const result = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
            console.log('EmailJS send result:', result);
            console.log('Email sent successfully - Status:', result.status, 'Text:', result.text);
        } else {
            console.log('EmailJS not available, logging email details...');
            // Fallback: Log email content for manual processing
            const subject = `New Order from ${orderData.name}`;
            const body = createEmailBody(orderData);
            
            console.log('=== EMAIL NOTIFICATION ===');
            console.log('To: sales@bishojo.store');
            console.log('Subject:', subject);
            console.log('Body:', body);
            console.log('========================');
        }
    } catch (error) {
        console.error('Email sending failed:', error);
        // Still continue with order process even if email fails
    }
    
    return Promise.resolve();
}

// Generate unique order ID
function generateOrderId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `BSH${timestamp.toString().slice(-6)}${random.toString().padStart(3, '0')}`;
}

// Parse order items from text input into structured format
function parseOrderItems(itemsText) {
    if (!itemsText || itemsText.trim() === '') {
        // If no items text, use cart data
        return cart.map(item => ({
            name: item.name,
            units: item.quantity,
            price: item.price,
            image_url: getItemImageUrl(item.name)
        }));
    }
    
    // Parse existing text format (for backward compatibility)
    const lines = itemsText.split('\n').filter(line => line.trim());
    const orders = [];
    
    lines.forEach((line) => {
        const trimmedLine = line.trim();
        if (trimmedLine) {
            let name = trimmedLine;
            let units = 1;
            let price = 329; // Default price
            
            // Extract quantity from format "2x Item Name"
            const qtyMatch = trimmedLine.match(/(\d+)x\s*(.+)/i);
            if (qtyMatch) {
                units = parseInt(qtyMatch[1]);
                name = qtyMatch[2];
                
                // Extract price from format "Item Name - BDT 329"
                const priceMatch = name.match(/(.+?)\s*(?:\(.*?\))?\s*-\s*BDT\s*(\d+)/i);
                if (priceMatch) {
                    name = priceMatch[1].trim();
                    price = parseInt(priceMatch[2]);
                }
            }
            
            orders.push({
                name: name,
                units: units,
                price: price,
                image_url: getItemImageUrl(name)
            });
        }
    });
    
    return orders.length > 0 ? orders : [{
        name: 'Custom Order',
        units: 1,
        price: 329,
        image_url: getItemImageUrl('default')
    }];
}

// Get image URL for menu items
function getItemImageUrl(itemName) {
    const imageName = itemName.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    return `https://bishojo-4zr.pages.dev/images/${imageName}.jpg`;
}

// Shopping Cart System
let cart = [];
const DELIVERY_CHARGE = 60;

// Add item to cart
function addToCart(itemName, price, pieces) {
    // Check if item already exists in cart
    const existingItem = cart.find(item => item.name === itemName);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            name: itemName,
            price: price,
            pieces: pieces,
            quantity: 1
        });
    }
    
    updateCartDisplay();
    showCartMessage(`Added ${itemName} to your cart!`);
}

// Remove item from cart
function removeFromCart(itemName) {
    cart = cart.filter(item => item.name !== itemName);
    updateCartDisplay();
}

// Update item quantity
function updateQuantity(itemName, change) {
    const item = cart.find(item => item.name === itemName);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(itemName);
        } else {
            updateCartDisplay();
        }
    }
}

// Clear entire cart
function clearCart() {
    console.log('Clearing cart...');
    cart = [];
    updateCartDisplay();
    
    // Also hide the order summary in the form
    const orderSummaryForm = document.getElementById('orderSummaryForm');
    if (orderSummaryForm) {
        orderSummaryForm.style.display = 'none';
    }
    
    // Clear the hidden order items field
    const orderItemsInput = document.getElementById('orderItems');
    if (orderItemsInput) {
        orderItemsInput.value = '';
    }
    
    console.log('Cart cleared successfully');
}

// Update cart display
function updateCartDisplay() {
    const cartSummary = document.getElementById('cartSummary');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    if (cart.length === 0) {
        cartSummary.style.display = 'none';
        updateOrderForm();
        return;
    }
    
    cartSummary.style.display = 'block';
    
    // Clear existing items
    cartItems.innerHTML = '';
    
    // Add each item to display
    let subtotal = 0;
    cart.forEach((item) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-details">${item.pieces} pcs per box • BDT ${item.price}</div>
            </div>
            <div class="cart-item-controls">
                <button class="qty-btn" onclick="updateQuantity('${item.name}', -1)">-</button>
                <span style="margin: 0 10px; color: #fff; font-weight: bold;">${item.quantity}</span>
                <button class="qty-btn" onclick="updateQuantity('${item.name}', 1)">+</button>
                <span style="margin-left: 15px; color: #ff6b6b; font-weight: bold;">BDT ${itemTotal}</span>
            </div>
        `;
        cartItems.appendChild(cartItem);
    });
    
    // Calculate total
    const total = subtotal + DELIVERY_CHARGE;
    cartTotal.textContent = total.toFixed(2);
    
    // Update order form
    updateOrderForm();
}

// Update order form with cart items
function updateOrderForm() {
    const orderItemsInput = document.getElementById('orderItems');
    const orderSummaryForm = document.getElementById('orderSummaryForm');
    const orderItemsDisplay = document.getElementById('orderItemsDisplay');
    const orderTotalDisplay = document.getElementById('orderTotalDisplay');
    
    if (cart.length === 0) {
        orderItemsInput.value = '';
        orderSummaryForm.style.display = 'none';
        return;
    }
    
    // Create order text for backend processing
    const orderText = cart.map(item => 
        `${item.quantity}x ${item.name} (${item.pieces} pcs) - BDT ${item.price}`
    ).join('\n');
    
    orderItemsInput.value = orderText;
    
    // Show order summary in form
    orderSummaryForm.style.display = 'block';
    orderItemsDisplay.innerHTML = cart.map(item => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; color: #e0e0e0;">
            <span>${item.quantity}x ${item.name}</span>
            <span>BDT ${item.price * item.quantity}</span>
        </div>
    `).join('');
    
    // Calculate and show total
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal + DELIVERY_CHARGE;
    orderTotalDisplay.textContent = total.toFixed(2);
}

// Proceed to order form
function proceedToOrder() {
    if (cart.length === 0) {
        showCartMessage('Please add items to cart first!', 'error');
        return;
    }
    
    // Scroll to order form
    document.getElementById('order').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
    
    showCartMessage('Please fill out your delivery details below');
}

// Show cart message
function showCartMessage(message, type = 'success') {
    // Create temporary message
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#e53e3e' : '#ff6b6b'};
        color: white;
        padding: 1rem 2rem;
        border-radius: 25px;
        z-index: 1000;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        max-width: 300px;
        font-weight: bold;
    `;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    // Animate in
    setTimeout(() => {
        messageDiv.style.opacity = '1';
        messageDiv.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(messageDiv)) {
                document.body.removeChild(messageDiv);
            }
        }, 300);
    }, 3000);
}

// Show message function for user feedback
function showMessage(message, type = 'info') {
    console.log(`Showing message: "${message}" (type: ${type})`);
    
    // Remove any existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    messageDiv.textContent = message;
    
    // Set inline styles to ensure visibility
    let backgroundColor;
    if (type === 'success') {
        backgroundColor = 'linear-gradient(45deg, #28a745, #20c997)';
    } else if (type === 'error') {
        backgroundColor = 'linear-gradient(45deg, #dc3545, #fd7e14)';
    } else {
        backgroundColor = 'linear-gradient(45deg, #007bff, #6610f2)';
    }
    
    messageDiv.style.cssText = `
        position: fixed !important;
        top: 80px !important;
        right: 20px !important;
        z-index: 99999 !important;
        padding: 1rem 2rem !important;
        border-radius: 8px !important;
        color: white !important;
        font-weight: bold !important;
        max-width: 400px !important;
        min-width: 250px !important;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
        background: ${backgroundColor} !important;
        font-size: 16px !important;
        text-align: center !important;
        border: 2px solid rgba(255, 255, 255, 0.2) !important;
        transform: translateX(100%) !important;
        transition: transform 0.3s ease !important;
    `;
    
    // Add to page
    document.body.appendChild(messageDiv);
    console.log('Message element added to page');
    
    // Force animation
    setTimeout(() => {
        messageDiv.style.transform = 'translateX(0) !important';
        console.log('Message animated in');
    }, 50);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.style.transform = 'translateX(100%) !important';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                    console.log('Message removed');
                }
            }, 300);
        }
    }, 5000);
    
    return messageDiv;
}

// Add CSS animations for messages
const messageStyles = document.createElement('style');
messageStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(messageStyles);

// Update form validation to check for cart items
function validateOrderForm() {
    if (cart.length === 0) {
        showCartMessage('Please add items to your cart before placing an order!', 'error');
        return false;
    }
    return true;
}

// Add some nice animations on scroll
function animateOnScroll() {
    const elements = document.querySelectorAll('.menu-category, .contact-item, .feature');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    elements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', animateOnScroll);

// Add click tracking for WhatsApp catalog link
document.addEventListener('DOMContentLoaded', function() {
    const whatsappLinks = document.querySelectorAll('a[href*="wa.me"]');
    whatsappLinks.forEach(link => {
        link.addEventListener('click', function() {
            console.log('WhatsApp catalog link clicked');
            // You can add analytics tracking here if needed
        });
    });
});

// Simple form validation helper
function validateForm(formData) {
    const errors = [];
    
    if (!formData.get('name') || formData.get('name').trim().length < 2) {
        errors.push('Name must be at least 2 characters long');
    }
    
    if (!formData.get('phone') || !/^(\+?880|0)?1[3-9]\d{8}$/.test(formData.get('phone').replace(/\s+/g, ''))) {
        errors.push('Please enter a valid Bangladeshi phone number');
    }
    
    if (!formData.get('email') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.get('email'))) {
        errors.push('Please enter a valid email address');
    }
    
    if (!formData.get('address') || formData.get('address').trim().length < 10) {
        errors.push('Please provide a complete delivery address');
    }
    
    if (!formData.get('items') || formData.get('items').trim().length < 5) {
        errors.push('Please specify your order items');
    }
    
    return errors;
}

// Create WhatsApp message format
function createWhatsAppMessage(orderData, orderId) {
    const timestamp = new Date().toLocaleString('en-BD', { 
        timeZone: 'Asia/Dhaka',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Calculate totals from cart or parse items
    let subtotal = 0;
    let itemsList = '';
    
    if (cart && cart.length > 0) {
        // Use cart data
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            itemsList += `${item.quantity}x ${item.name} (${item.pieces} pcs) - BDT ${itemTotal}\n`;
        });
    } else {
        // Parse from items string
        const lines = orderData.items.split('\n');
        lines.forEach(line => {
            itemsList += line + '\n';
            // Try to extract price from line
            const match = line.match(/BDT\s*(\d+)/);
            if (match) {
                subtotal += parseInt(match[1]);
            }
        });
    }
    
    const shipping = 60;
    const total = subtotal + shipping;
    
    return `🍣 *NEW ORDER - Bishojo Sushi*

📋 *Order ID:* ${orderId}
📅 *Date & Time:* ${timestamp}

👤 *Customer Details:*
• Name: ${orderData.name}
• Phone: ${orderData.phone}
• Email: ${orderData.email}

📍 *Delivery Address:*
${orderData.address}

🛒 *Order Items:*
${itemsList}
💰 *Subtotal:* BDT ${subtotal}
🚚 *Delivery Charge:* BDT ${shipping}
💳 *Total Amount:* BDT ${total}

📝 *Special Instructions:* ${orderData.special || 'None'}

💰 *Payment:* Cash on Delivery
🕒 *Expected Delivery:* 45-60 minutes

Please confirm this order by replying to this message.`;
}

// Create email body format  
function createEmailBody(orderData) {
    const timestamp = new Date().toLocaleString('en-BD', { 
        timeZone: 'Asia/Dhaka' 
    });
    
    return `New Order Received - Bishojo Sushi

Order Details:
- Customer: ${orderData.name}
- Phone: ${orderData.phone}
- Email: ${orderData.email}
- Address: ${orderData.address}
- Items: ${orderData.items}
- Special Instructions: ${orderData.special || 'None'}
- Order Time: ${timestamp}

Please process this order and contact the customer for confirmation.`;
}
