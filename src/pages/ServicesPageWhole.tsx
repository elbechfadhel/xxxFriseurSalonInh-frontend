import React, { useEffect, useRef } from "react";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import {
    Scissors,
    Sparkles,
    BadgeEuro,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { useTranslation } from 'react-i18next'; // Import useTranslation

interface Service {
    name: string;
    description: string;
    price: string;
    icon: JSX.Element;
}

const services: Service[] = [
    {
        name: "Classic Haircut",
        description: "A traditional men’s haircut.",
        price: "20€",
        icon: <Scissors className="w-6 h-6 text-blue-600" />,
    },
    {
        name: "Beard Trim",
        description: "Shape and trim your beard.",
        price: "15€",
        icon: <Sparkles className="w-6 h-6 text-green-600" />,
    },
    {
        name: "Shaving",
        description: "Classic shaving with a razor.",
        price: "10€",
        icon: <BadgeEuro className="w-6 h-6 text-yellow-500" />,
    },
];

const ServicesPage: React.FC = () => {
    const { t } = useTranslation(); // Get the translation function
    const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
        loop: true,
        slides: { perView: 1, spacing: 15 },
        breakpoints: {
            "(min-width: 768px)": {
                slides: { perView: 2, spacing: 20 },
            },
        },
    });

    const sliderContainerRef = useRef<HTMLDivElement>(null);
    const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const sliderEl = sliderContainerRef.current;

        const startAutoplay = () => {
            autoplayRef.current = setInterval(() => {
                instanceRef.current?.next();
            }, 3000);
        };

        const stopAutoplay = () => {
            if (autoplayRef.current) clearInterval(autoplayRef.current);
        };

        if (sliderEl) {
            sliderEl.addEventListener("mouseenter", stopAutoplay);
            sliderEl.addEventListener("mouseleave", startAutoplay);
        }

        startAutoplay();

        return () => {
            stopAutoplay();
            sliderEl?.removeEventListener("mouseenter", stopAutoplay);
            sliderEl?.removeEventListener("mouseleave", startAutoplay);
        };
    }, [instanceRef]);

    return (
        <div className="max-w-5xl mx-auto px-4 py-12">
            <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
                {t('ourServices')} {/* Translate the title */}
            </h1>

            <div ref={sliderContainerRef} className="relative">
                <div ref={sliderRef} className="keen-slider">
                    {services.map((service, index) => (
                        <div
                            key={index}
                            className="keen-slider__slide bg-white border shadow rounded-lg p-6"
                        >
                            <div className="flex items-center gap-4 mb-3">
                                {service.icon}
                                <h3 className="text-xl font-semibold text-gray-800">
                                    {t(service.name)} {/* Translate service names */}
                                </h3>
                            </div>
                            <p className="text-gray-600 mb-2">
                                {t(service.description)} {/* Translate descriptions */}
                            </p>
                            <p className="text-gray-800 font-bold">
                                {t('price')}: {service.price} {/* Translate price label */}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Navigation Arrows */}
                <button
                    onClick={() => instanceRef.current?.prev()}
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white shadow rounded-full p-2 hover:bg-gray-100 z-10"
                >
                    <ChevronLeft className="w-5 h-5"/>
                </button>
                <button
                    onClick={() => instanceRef.current?.next()}
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white shadow rounded-full p-2 hover:bg-gray-100 z-10"
                >
                    <ChevronRight className="w-5 h-5"/>
                </button>
            </div>
        </div>
    );
};

export default ServicesPage;
