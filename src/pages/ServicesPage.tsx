import React from 'react';

interface Service {
    name: string;
    description: string;
    price: string;
}

const ServicesPage: React.FC = () => {
    const services: Service[] = [
        { name: "Classic Haircut", description: "A traditional men’s haircut.", price: "20€" },
        { name: "Beard Trim", description: "Shape and trim your beard.", price: "15€" },
        { name: "Shaving", description: "Classic shaving with a razor.", price: "10€" },
    ];

    return (
        <div>
            <h1>Our Services</h1>
            <ul>
                {services.map((service, index) => (
                    <li key={index}>
                        <h3>{service.name}</h3>
                        <p>{service.description}</p>
                        <p>Price: {service.price}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ServicesPage;
