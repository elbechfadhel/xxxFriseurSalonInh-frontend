import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-gray-800 text-gray-200 py-8 mt-20">
            <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                {/* Shop Info */}
                <div>
                    <h4 className="text-lg font-semibold mb-2">Nejib’s Barber Shop</h4>
                    <p>Classic cuts. Modern style. Premium service.</p>
                </div>

                {/* Contact Info */}
                <div>
                    <h4 className="text-lg font-semibold mb-2">Contact</h4>
                    <div className="flex items-center gap-2 mb-1">
                        <Mail className="w-4 h-4" />
                        <a href="mailto:info@nejibbarbershop.com" className="hover:underline">
                            info@nejibbarbershop.com
                        </a>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                        <Phone className="w-4 h-4" />
                        <span>+49 176 12345678</span>
                    </div>
                </div>

                {/* Location */}
                <div>
                    <h4 className="text-lg font-semibold mb-2">Location</h4>
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>123 Barber Street, Berlin, Germany</span>
                    </div>
                </div>
            </div>

            <div className="text-center text-xs text-gray-400 mt-6">
                © {new Date().getFullYear()} Nejib’s Barber Shop. All rights reserved.
            </div>
        </footer>
    );
};

export default Footer;
