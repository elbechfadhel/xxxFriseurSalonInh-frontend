// pages/ServicesPage.tsx
import React from "react";
import ServicesGrid from "./ServicesGrid";




const ServicesPage: React.FC = () => {


    return (
        <main style={{ maxWidth: 1100, margin: "0 auto", padding: "1rem" }}>
            <ServicesGrid />
        </main>
    );
};

export default ServicesPage;
