// ex: src/pages/WidgetsPage.tsx
import React from "react";
import RathausWidget from "./RathausWidget.tsx";

const WidgetsPage: React.FC = () => (
    <main style={{ padding: 24 }}>
        <h1>Widgets</h1>
        <RathausWidget />
    </main>
);

export default WidgetsPage;
