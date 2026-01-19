import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {X, Send, MessageCircleQuestion, User, Sparkles, ShoppingBag, Truck, CreditCard, HelpCircle, Phone, MessagesSquareIcon, MessageSquareIcon } from 'lucide-react';

interface Message {
    id: string;
    text: string;
    isBot: boolean;
    timestamp: Date;
}

interface QuickAction {
    icon: React.ReactNode;
    label: string;
    query: string;
}

// Pre-defined responses for common queries
const botResponses: Record<string, string> = {
    'hello': `Hello! 👋 Welcome to Decorizz! I'm your personal shopping assistant. How can I help you today?`,
    'hi': `Hi there! 👋 I'm the Decorizz assistant. I'm here to help you find the perfect home decor. What are you looking for?`,
    'products': `We have a beautiful collection of:\n\n🖼️ **Wall Art & Frames** - [Browse All](/shop)\n🎨 **Custom Canvas** - [Create Yours](/product/custom/custom-print-round-canvas-wall-art)\n💡 **Neon Signs** - [Explore Neon](/lighting)\n🙏 **Spiritual Art** - [View Collection](/spiritual-art-gallery)\n✨ **Acrylic Art** - [Shop Acrylic](/acrylic-art-gallery)\n\nWould you like me to help you find something specific?`,
    'shipping': `📦 **Shipping Information:**\n\n• Free shipping on orders above ₹999\n• Standard delivery: 5-7 business days\n• Express delivery: 2-3 business days\n• We ship across India!\n• Safe packaging guaranteed\n\n[Track Your Order](/account)`,
    'payment': `💳 **Payment Options:**\n\n• Credit/Debit Cards\n• UPI (GPay, PhonePe, Paytm)\n• Net Banking\n• Cash on Delivery (COD)\n• EMI options available\n\nAll payments are 100% secure! 🔒\n\n[Start Shopping](/shop)`,
    'returns': `🔄 **Return & Exchange Policy:**\n\n• 7-day easy returns\n• Free returns on damaged items\n• Exchange available for different sizes\n• Refund processed within 5-7 days\n\n[Contact Support](/contact) for returns`,
    'custom': `🎨 **Custom Photo Canvas:**\n\nWe create personalized canvas art!\n\n• [Round Canvas](/product/custom/custom-print-round-canvas-wall-art)\n• [Square Canvas](/product/custom/custom-print-square-canvas-wall-art)\n• [Portrait Canvas](/product/custom/custom-print-portrait-canvas-wall-art)\n• [Landscape Canvas](/product/custom/custom-print-landscape-canvas-wall-art)\n• [Custom Neon Sign](/product/custom/custom-name-neon-signs-lights)\n\nPrices start from ₹679!`,
    'discount': `🎉 **Current Offers:**\n\n• New customers: Use code **NEW10** for 10% off\n• Free shipping on orders above ₹999\n• Bulk order discounts available\n\n[Shop Now](/shop) to avail offers!`,
    'contact': `📞 **Contact Us:**\n\n📧 Email: info@decorizz.com\n📱 WhatsApp: Available on website\n⏰ Support: 10 AM - 7 PM (Mon-Sat)\n\n[Visit Contact Page](/contact)`,
    'order': `📋 **Order Related Queries:**\n\nTo track or manage your order:\n\n[Go to My Account](/account) → My Orders\n\nNeed help? Share your order ID!`,
    'size': `📐 **Available Sizes:**\n\n**Portrait/Landscape:**\n• 8×12, 12×18, 18×24, 20×30\n• 24×36, 30×40, 36×48, 48×66\n\n**Square:**\n• 18×18, 20×20, 24×24, 30×30, 36×36\n\n[Browse All Products](/shop)`,
    'neon': `💡 **Neon Signs:**\n\n[Browse All Neon Signs](/lighting)\n\n• [Gods Neon](/lighting?category=Gods)\n• [Café Neon](/lighting?category=Cafe)\n• [Gaming Neon](/lighting?category=Gaming)\n• [Custom Neon](/product/custom/custom-name-neon-signs-lights)\n\nPerfect for bedrooms, restaurants & offices!`,
    'spiritual': `🙏 **Spiritual Art Collection:**\n\n[View All Spiritual Art](/spiritual-art-gallery)\n\n• [Ganesh Wall Art](/spiritual-art-gallery?category=Ganesh%20Wall%20Art)\n• [Radha Krishna Art](/spiritual-art-gallery?category=Radha%20Krishna%20Art)\n• [Buddha Paintings](/spiritual-art-gallery?category=Buddha%20Painting)\n• [Shiva Mahdev Art](/spiritual-art-gallery?category=Shiva%20Mahdev%20Art)\n\nBring positive energy to your space!`,
    'material': `🎨 **Materials & Formats:**\n\n**Rolled Canvas:** Premium, ready to frame\n**Stretched Canvas:** Gallery-wrapped\n**Framed:** White, Black & Brown frames\n\n• 100% Cotton Canvas\n• Fade-resistant inks\n• Museum-grade quality\n\n[Shop by Format](/shop)`,
    'install': `🔧 **Installation Tips:**\n\n1. Use appropriate wall hooks\n2. Ensure wall surface is clean\n3. Measure before drilling\n4. Use spirit level for alignment\n5. Hang at eye level\n\n[Contact Us](/contact) for help!`,
    'gift': `🎁 **Gift Options:**\n\n• **Housewarming:** [Wall Art](/shop)\n• **Wedding:** [Custom Portraits](/product/custom/custom-print-portrait-canvas-wall-art)\n• **Birthday:** [Personalized Canvas](/product/custom/custom-print-round-canvas-wall-art)\n• **Festival:** [Spiritual Art](/spiritual-art-gallery)\n\nGift wrapping available on request!`,
    'bulk': `📦 **Bulk Orders:**\n\nSpecial rates for:\n• Hotels & Restaurants\n• Offices & Corporates\n• Interior Designers\n\n**Minimum:** 10 pieces\n**Discount:** Up to 30% off\n\n[Contact for Quotes](/contact)`,
    'warranty': `✅ **Quality Guarantee:**\n\n• Premium materials\n• Fade-resistant inks (5+ years)\n• 7-day return policy\n• Free replacement for damages\n\n[View Return Policy](/contact)`,
    'decor': `🏠 **Decorative Art Categories:**\n\n[View All Decorative Art](/decor-by-room)\n\n• [Animals Art](/decor-by-room?category=Animals%20Art)\n• [Birds Art](/decor-by-room?category=Birds%20Art)\n• [Natural Art](/decor-by-room?category=Natural%20Art)\n• [Abstract Art](/new-art-gallery?category=Abstract%20Art)\n\nFind the perfect piece!`,
    'room': `🏡 **Decor by Room:**\n\n[Browse by Room](/decor-by-room)\n\n• Living Room\n• Bedroom\n• Kitchen\n• Office/Study\n• Kids Room\n\nTell me which room you're decorating!`,
    'price': `💰 **Price Range:**\n\n**Rolled Canvas:** Starting ₹679\n**Framed Art:** Starting ₹999\n**Neon Signs:** Starting ₹1,499\n\n[Shop All Products](/shop)\n\nFree shipping on orders above ₹999!`,
    'acrylic': `✨ **Acrylic Art:**\n\n[Browse Acrylic Collection](/acrylic-art-gallery)\n\n• [Animal Acrylic Art](/acrylic-art-gallery?category=Animal%20Acrylic%20Art)\n• [Spiritual Acrylic Art](/acrylic-art-gallery?category=Spiritual%20Acrylic%20Art)\n• [Gen Z Acrylic Art](/acrylic-art-gallery?category=Gen%20Z%20Acrylic%20Art)\n\nPerfect for contemporary spaces!`,
    'default': `I'm here to help! Ask me about:\n\n• 🛍️ [Products](/shop)\n• 🎨 [Custom Canvas](/product/custom/custom-print-round-canvas-wall-art)\n• 💡 [Neon Signs](/lighting)\n• 🙏 [Spiritual Art](/spiritual-art-gallery)\n• 📞 [Contact Us](/contact)\n\nOr type your question!`
};

const quickActions: QuickAction[] = [
    { icon: <ShoppingBag className="w-4 h-4" />, label: 'Products', query: 'products' },
    { icon: <Truck className="w-4 h-4" />, label: 'Shipping', query: 'shipping' },
    { icon: <CreditCard className="w-4 h-4" />, label: 'Payment', query: 'payment' },
    { icon: <Sparkles className="w-4 h-4" />, label: 'Custom Frames', query: 'custom' },
    { icon: <HelpCircle className="w-4 h-4" />, label: 'Returns', query: 'returns' },
    { icon: <Phone className="w-4 h-4" />, label: 'Contact', query: 'contact' },
];

// Function to render message text with clickable links
const renderMessageWithLinks = (text: string, onLinkClick?: () => void): React.ReactNode => {
    // Regex to match markdown-style links: [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
        // Add text before the link
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }

        // Add the link
        const linkText = match[1];
        const linkUrl = match[2];
        parts.push(
            <Link
                key={`${linkUrl}-${match.index}`}
                to={linkUrl}
                className="text-teal-600 hover:text-teal-700 underline font-medium"
                onClick={(e) => e.stopPropagation()}
            >
                {linkText}
            </Link>
        );

        lastIndex = match.index + match[0].length;
    }

    // Add remaining text after last link
    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
};

export function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: `Hello! 👋 I'm Deco, your Decorizz assistant. How can I help you today?`,
            isBot: true,
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const getBotResponse = (query: string): string => {
        const lowerQuery = query.toLowerCase().trim();

        // Check for keywords in the query
        if (lowerQuery.includes('hello') || lowerQuery.includes('hi') || lowerQuery.includes('hey')) {
            return botResponses['hello'];
        }
        if (lowerQuery.includes('neon') || lowerQuery.includes('light') || lowerQuery.includes('led')) {
            return botResponses['neon'];
        }
        if (lowerQuery.includes('spiritual') || lowerQuery.includes('god') || lowerQuery.includes('religious') || lowerQuery.includes('ganesh') || lowerQuery.includes('krishna') || lowerQuery.includes('buddha') || lowerQuery.includes('shiva') || lowerQuery.includes('durga') || lowerQuery.includes('jesus') || lowerQuery.includes('islamic') || lowerQuery.includes('pooja')) {
            return botResponses['spiritual'];
        }
        if (lowerQuery.includes('acrylic')) {
            return botResponses['acrylic'];
        }
        if (lowerQuery.includes('size') || lowerQuery.includes('dimension') || lowerQuery.includes('inch') || lowerQuery.includes('measurement')) {
            return botResponses['size'];
        }
        if (lowerQuery.includes('price') || lowerQuery.includes('cost') || lowerQuery.includes('rate') || lowerQuery.includes('how much') || lowerQuery.includes('kitna')) {
            return botResponses['price'];
        }
        if (lowerQuery.includes('material') || lowerQuery.includes('canvas') || lowerQuery.includes('cotton') || lowerQuery.includes('quality') || lowerQuery.includes('format')) {
            return botResponses['material'];
        }
        if (lowerQuery.includes('install') || lowerQuery.includes('hang') || lowerQuery.includes('mount') || lowerQuery.includes('wall')) {
            return botResponses['install'];
        }
        if (lowerQuery.includes('gift') || lowerQuery.includes('wedding') || lowerQuery.includes('birthday') || lowerQuery.includes('anniversary') || lowerQuery.includes('housewarming')) {
            return botResponses['gift'];
        }
        if (lowerQuery.includes('bulk') || lowerQuery.includes('wholesale') || lowerQuery.includes('corporate') || lowerQuery.includes('reseller') || lowerQuery.includes('hotel') || lowerQuery.includes('restaurant')) {
            return botResponses['bulk'];
        }
        if (lowerQuery.includes('warranty') || lowerQuery.includes('guarantee') || lowerQuery.includes('damage')) {
            return botResponses['warranty'];
        }
        if (lowerQuery.includes('room') || lowerQuery.includes('bedroom') || lowerQuery.includes('living') || lowerQuery.includes('kitchen') || lowerQuery.includes('office') || lowerQuery.includes('study')) {
            return botResponses['room'];
        }
        if (lowerQuery.includes('decor') || lowerQuery.includes('animal') || lowerQuery.includes('bird') || lowerQuery.includes('nature') || lowerQuery.includes('boho') || lowerQuery.includes('abstract') || lowerQuery.includes('pop art') || lowerQuery.includes('graffiti')) {
            return botResponses['decor'];
        }
        if (lowerQuery.includes('product') || lowerQuery.includes('frame') || lowerQuery.includes('art') || lowerQuery.includes('collection')) {
            return botResponses['products'];
        }
        if (lowerQuery.includes('ship') || lowerQuery.includes('delivery') || lowerQuery.includes('deliver')) {
            return botResponses['shipping'];
        }
        if (lowerQuery.includes('pay') || lowerQuery.includes('cod') || lowerQuery.includes('upi') || lowerQuery.includes('emi')) {
            return botResponses['payment'];
        }
        if (lowerQuery.includes('return') || lowerQuery.includes('refund') || lowerQuery.includes('exchange')) {
            return botResponses['returns'];
        }
        if (lowerQuery.includes('custom') || lowerQuery.includes('personali') || lowerQuery.includes('upload') || lowerQuery.includes('photo')) {
            return botResponses['custom'];
        }
        if (lowerQuery.includes('discount') || lowerQuery.includes('offer') || lowerQuery.includes('coupon') || lowerQuery.includes('code') || lowerQuery.includes('sale')) {
            return botResponses['discount'];
        }
        if (lowerQuery.includes('contact') || lowerQuery.includes('call') || lowerQuery.includes('email') || lowerQuery.includes('support') || lowerQuery.includes('whatsapp')) {
            return botResponses['contact'];
        }
        if (lowerQuery.includes('order') || lowerQuery.includes('track') || lowerQuery.includes('status')) {
            return botResponses['order'];
        }

        return botResponses['default'];
    };

    const handleSendMessage = (text: string) => {
        if (!text.trim()) return;

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            text: text.trim(),
            isBot: false,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');

        // Show typing indicator
        setIsTyping(true);

        // Simulate bot response delay
        setTimeout(() => {
            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: getBotResponse(text),
                isBot: true,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMessage]);
            setIsTyping(false);
        }, 800 + Math.random() * 500);
    };

    const handleQuickAction = (query: string) => {
        handleSendMessage(query);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(inputValue);
        }
    };

    const [showGreeting, setShowGreeting] = useState(false);

    useEffect(() => {
        // Show greeting after 2 seconds
        const timer = setTimeout(() => {
            const hasSeenGreeting = sessionStorage.getItem('chat_greeting_seen');
            if (!hasSeenGreeting && !isOpen) {
                setShowGreeting(true);
            }
        }, 2000);
        return () => clearTimeout(timer);
    }, [isOpen]);

    const handleCloseGreeting = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowGreeting(false);
        sessionStorage.setItem('chat_greeting_seen', 'true');
    };

    return (
        <>
            {/* Greeting Bubble */}
            <div
                className={`fixed left-6 bottom-24 z-0 max-w-62.5 bg-white p-4 rounded-xl shadow-xl transition-all duration-500 transform origin-bottom-left border border-gray-100 ${showGreeting && !isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'}`}
            >
                <button
                    aria-label='close'
                    onClick={handleCloseGreeting}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 shadow-sm transition-colors cursor-pointer"
                >
                    <X className="w-3 h-3" />
                </button>
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center shrink-0 coursor-pointer">
                        <span className="text-xl">👋</span>
                    </div>
                    <div>
                        <p className="text-gray-900 font-semibold text-sm mb-1">Hi there!</p>
                        <p className="text-gray-600 text-xs leading-relaxed">Need help finding the perfect frame? I'm here to assist!</p>
                    </div>
                </div>
                {/* Arrow pointing down */}
                <div className="absolute -bottom-2 left-6 w-4 h-4 bg-white transform rotate-45 border-b border-r border-gray-100"></div>
            </div>

            {/* Chat Button */}
            <button
                onClick={() => {
                    setIsOpen(true);
                    setShowGreeting(false);
                }}
                className={`fixed w-14 h-14 rounded-full bg-teal flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
                style={{ zIndex: 9999, cursor: 'pointer', bottom: '16px', left: '16px' }}
                aria-label="Open chat"
            >
                <MessagesSquareIcon className="w-8 h-8 text-white" />
            </button>

            {/* Chat Window */}
            <div
                className={`fixed rounded-xl overflow-hidden shadow-2xl transition-all duration-300 bg-white flex flex-col ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-[120%] opacity-0 pointer-events-none'}`}
                style={{
                    height: '550px',
                    maxHeight: 'calc(100vh - 100px)',
                    width: 'calc(100vw - 32px)',
                    maxWidth: '384px',
                    bottom: '16px',
                    left: '16px',
                    zIndex: isOpen ? 9999 : -1,
                    pointerEvents: isOpen ? 'auto' : 'none'
                }}
            >
                {/* Header */}
                <div
                    className="p-4 flex items-center justify-between
             bg-linear-to-br from-teal-600 to-emerald-500
             text-white rounded-t-2xl shadow-md"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full
                    bg-white/20 backdrop-blur
                    flex items-center justify-center
                    shadow-sm">
                            <MessageSquareIcon className="w-5.5 h-5.5 text-white" />
                        </div>

                        <div className="leading-tight">
                            <h3 className="font-semibold text-base">Deco</h3>
                            <p className="text-xs text-white/80 font-medium">
                                Decorizz Assistant
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsOpen(false)}
                        className="group p-2 rounded-full bg-white/15 backdrop-blur transition-all duration-200 hover:bg-red-500 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/40 cursor-pointer"
                        aria-label="Close chat">
                        <X className="w-5 h-5 text-white group-hover:rotate-90 transition-transform" />
                    </button>
                </div>


                {/* Messages */}
                <div
                    className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
                    data-lenis-prevent
                >
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex items-end gap-2 ${message.isBot ? 'justify-start' : 'justify-end'}`}
                        >
                            {message.isBot && (
                                <div className="w-8 h-8 rounded-full bg-teal flex items-center justify-center shrink-0 shadow-sm">
                                    <MessageSquareIcon className="w-4 h-4 text-white" />
                                </div>
                            )}
                            <div
                                className={`max-w-[75%] p-3 rounded-xl text-sm leading-relaxed shadow-sm ${message.isBot
                                    ? 'bg-white text-gray-900 rounded-bl-none'
                                    : 'bg-teal text-white rounded-br-none'
                                    }`}
                                style={{
                                    whiteSpace: 'pre-line'
                                }}
                            >
                                {message.isBot ? renderMessageWithLinks(message.text) : message.text}
                            </div>
                            {!message.isBot && (
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                                    <User className="w-4 h-4 text-gray-600" />
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Typing Indicator */}
                    {isTyping && (
                        <div className="flex items-end gap-2">
                            <div className="w-8 h-8 rounded-full bg-teal flex items-center justify-center shadow-sm">
                                <MessageCircleQuestion className="w-4 h-4 text-white" />
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm">
                                <div className="flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Quick Actions */}
                <div className="px-4 py-3 bg-white border border-gray-200">
                    <div className="flex flex-wrap gap-2">
                        {quickActions.map((action, index) => (
                            <button
                                key={index}
                                onClick={() => handleQuickAction(action.query)}
                                className="group flex items-center gap-2 px-3.5 py-2 rounded-full
                               bg-white border border-gray-200 text-xs font-medium text-gray-700 shadow-sm transition-all duration-200 hover:bg-linear-to-r hover:from-teal-600 hover:to-emerald-500 hover:text-white hover:border-transparent hover:shadow-md focus:outline-none focus:ring-2
              focus:ring-teal-500/40 cursor-pointer">
                                <span className="text-gray-500 group-hover:text-white transition">
                                    {action.icon}
                                </span>
                                <span>{action.label}</span>
                            </button>

                        ))}
                    </div>
                </div>

                {/* Input */}
                <div className="p-4 bg-white border-t border-gray-200">
                    <div className="flex items-center gap-3">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type your message..."
                            className="flex-1 px-4 py-3 rounded-xl bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:bg-white transition-all duration-200 border border-transparent focus:border-teal"
                        />
                        <button
                            aria-label="Send message"
                            onClick={() => handleSendMessage(inputValue)}
                            disabled={!inputValue.trim()}
                            className={`w-14 h-10 rounded-xl flex items-center justify-center
              text-white transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-teal-500/40
              ${inputValue.trim()
                                    ? "bg-linear-to-r from-emerald-600 to-teal-500 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
                                    : "bg-teal-400/40 cursor-not-allowed"
                                }`}
                        >
                            <Send className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                        </button>


                    </div>
                </div>
            </div>
        </>
    );
}
