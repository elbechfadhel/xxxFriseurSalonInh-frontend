import { useEffect } from "react";

const BookingPage = () => {

    useEffect(() => {
        window.location.replace("https://www.xxxfriseursalon.de/booking");
    }, []);

    return (
        <div style={{textAlign:"center", marginTop:"100px"}}>
            <h2>Die Buchungsseite wurde verschoben.</h2>
            <p>
                Falls Sie nicht automatisch weitergeleitet werden,
                klicken Sie bitte auf den Link unten.
            </p>

            <a
                href="https://www.xxxfriseursalon.de/booking"
                style={{
                    fontSize:"20px",
                    color:"#4e9f66",
                    fontWeight:"bold"
                }}
            >
                👉 Zur neuen Buchungsseite
            </a>
        </div>
    );
};

export default BookingPage;
