import React from 'react';
import { Scissors, BadgeEuro, Sparkles } from 'lucide-react';

interface Service {
    name: string;
    description: string;
    price: string;
    icon: JSX.Element;
}

const ServicesPage: React.FC = () => {
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

    return (
        <div className="max-w-4xl mx-auto px-4 py-10">
            <h1 className="text-3xl font-extrabold text-center text-gray-800 mb-10">
                💈 Our Services
            </h1>

            <div className="grid gap-6 md:grid-cols-2">
                {services.map((service, index) => (
                    <div
                        key={index}
                        className="bg-white border border-gray-200 shadow rounded-lg p-6 hover:shadow-lg transition"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            {service.icon}
                            <h3 className="text-xl font-semibold text-gray-800">
                                {service.name}
                            </h3>
                        </div>
                        <p className="text-gray-600 mb-2">{service.description}</p>
                        <p className="text-gray-800 font-bold">Price: {service.price}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ServicesPage;
