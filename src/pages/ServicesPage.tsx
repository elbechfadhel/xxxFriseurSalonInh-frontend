// pages/ServicesPage.tsx
import React from "react";
import ServicesGrid, { Service } from "./ServicesGrid";




const ServicesPage: React.FC = () => {
    const handleSelect = (service: Service) => {
        // Example: route to booking with preselected service
        // navigate(`/booking?service=${service.id}`);
        console.log("Selected:", service);
    };

    return (
        <main style={{ maxWidth: 1100, margin: "0 auto", padding: "1rem" }}>
            <ServicesGrid onSelect={handleSelect} />
        </main>
    );
};

export default ServicesPage;
