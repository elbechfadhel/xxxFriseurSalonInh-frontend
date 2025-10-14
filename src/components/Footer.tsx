import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {Link} from "react-router-dom"; // Import useTranslation

const Footer: React.FC = () => {
    const { t } = useTranslation(); // Get the translation function

    return (
        <footer className="bg-[#636A6D] text-gray-200 py-8 mt-10">
            <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                {/* Shop Info */}
                <div>
                    <h4 className="text-lg font-semibold mb-2 text-white">
                        {t('footerShopName')}
                    </h4>
                    <p>{t('footerShopDescription')}</p>
                </div>

                {/* Contact Info */}
                <div>
                    <h4 className="text-lg font-semibold mb-2 text-white">{t('contact')}</h4>
                    <div className="flex items-center gap-2 mb-1">
                        <Mail className="w-4 h-4 text-[#8bc99e]" />
                        <a
                            href="mailto:info@nejibbarbershop.com"
                            className="hover:underline hover:text-[#8bc99e]"
                        >
                            info@nejibbarbershop.com
                        </a>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                        <Phone className="w-4 h-4 text-[#8bc99e]" />
                        <span>01634363101</span>
                    </div>
                </div>

                {/* Location */}
                <div>
                    <h4 className="text-lg font-semibold mb-0 text-white">{t('location')}</h4>
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#8bc99e]" />
                        <span>{t('address')}</span>
                    </div>
                </div>
            </div>
            {/* Bottom Links */}
            <div className="mt-6 border-t border-gray-500 pt-4 text-center text-xs text-gray-300">
                <Link
                    to="/privacy-policy"
                    className="hover:underline hover:text-[#8bc99e] mx-2"
                >
                    {t('privacyPolicy.title')}
                </Link>


            </div>
        </footer>
    );
};

export default Footer;
