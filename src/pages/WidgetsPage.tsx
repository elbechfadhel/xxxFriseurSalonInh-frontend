// src/pages/WidgetsPage.tsx
import React from "react";
import RathausWidget from "./RathausWidget.tsx";
import WeatherWidget from "./WeatherWidget.tsx";

const WidgetsPage: React.FC = () => (
    <main className="min-h-screen bg-slate-100 p-6">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">
            Infos für unsere Gäste
        </h1>

        {/* Grid of widgets */}
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            <RathausWidget />
            <WeatherWidget />
        </div>
    </main>
);

export default WidgetsPage;
