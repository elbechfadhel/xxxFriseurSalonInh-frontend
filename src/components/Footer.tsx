import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-[#636A6D] text-gray-200 py-8 mt-10">
            <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                {/* Shop Info */}
                <div>
                    <h4 className="text-lg font-semibold mb-2 text-white">Nejib’s Barber Shop</h4>
                    <p>Classic cuts. Modern style. Premium service.</p>
                </div>

                {/* Contact Info */}
                <div>
                    <h4 className="text-lg font-semibold mb-2 text-white">Contact</h4>
                    <div className="flex items-center gap-2 mb-1">
                        <Mail className="w-4 h-4 text-orange-400" />
                        <a
                            href="mailto:info@nejibbarbershop.com"
                            className="hover:underline hover:text-orange-400"
                        >
                            info@nejibbarbershop.com
                        </a>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                        <Phone className="w-4 h-4 text-orange-400" />
                        <span>+49 176 12345678</span>
                    </div>
                </div>

                {/* Location */}
                <div>
                    <h4 className="text-lg font-semibold mb-0 text-white">Location</h4>
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-orange-400" />
                        <span>123 Barber Street, Berlin, Germany</span>
                    </div>
                </div>
            </div>

        </footer>
    );
};

export default Footer;
