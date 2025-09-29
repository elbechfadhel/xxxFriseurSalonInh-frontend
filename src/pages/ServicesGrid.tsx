import React from "react";
import { useTranslation } from "react-i18next";
import styles from "./ServicesGrid.module.css";

export type Service = {
    id: string;      // i18n key suffix
    name: string;    // fallback text
    price: number;
    description?: string;
    image?: string;  // path in /public
};

type ServicesGridProps = {
    services?: Service[];
    showHeader?: boolean;
};

const defaultServices: Service[] = [
    { id: "trocken-schnitt",      name: "Trocken Schnitt",          price: 15, image: "/images/services/Trocken Schnitt.png" },
    { id: "waschen-schneiden",    name: "Waschen & Schneiden",      price: 20, image: "/images/services/Waschen & Schneiden.png" },
    { id: "schneiden-bart-rasur", name: "Schneiden mit Bart-Rasur", price: 25, image: "/images/services/Schneiden mit Bart-Rasur.png" },
    { id: "augenbrauen-zupfen",   name: "Augenbrauen zupfen",       price: 7,  image: "/images/services/Augenbrauen zupfen.png" },
    { id: "bart-rasur",           name: "Bart-Rasur",               price: 10, image: "/images/services/Bart.png" },
    { id: "nasen-ohrenhaare",     name: "Nasen- & Ohrenhaare",      price: 5,  image: "/images/services/Nasen- & Ohrenhaare.png" },
];

const ServicesGrid: React.FC<ServicesGridProps> = ({
                                                       services = defaultServices,

                                                   }) => {
    const { t, i18n } = useTranslation();

    const fmt = new Intl.NumberFormat(i18n.language, {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
    });

    return (
        <section
            className={styles.wrapper}
            aria-labelledby="services-heading"
            dir={i18n.dir()}
        >


            <ul className={styles.grid} role="list">
                {services.map((s) => {
                    const name = t(`serviceNames.${s.id}`, s.name);
                    const desc = s.description
                        ? t(`serviceDescriptions.${s.id}`, s.description)
                        : t(`serviceDescriptions.${s.id}`, "");

                    return (
                        <li key={s.id} className={styles.card} tabIndex={0}>
                            {s.image && (
                                <div className={styles.imageWrap} aria-hidden="true">
                                    <img
                                        src={s.image}
                                        alt=""
                                        className={styles.image}
                                        loading="lazy"
                                        onError={(e) => {
                                            (e.currentTarget as HTMLImageElement).src = "/images/fallback-barber.jpg";
                                        }}
                                    />
                                    <span className={styles.badge}>{fmt.format(s.price)}</span>
                                </div>
                            )}

                            <div className={styles.content}>
                                <h3 className={styles.name}>{name}</h3>
                                {desc && <p className={styles.desc}>{desc}</p>}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
};

export default ServicesGrid;
