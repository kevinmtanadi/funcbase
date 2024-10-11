import http from 'k6/http';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';

export let options = {
    insecureSkipTLSVerify: true,
    noConnectionReuse: false,
    vus: 100,
    iterations: 10000
};
const url = "http://localhost:8090/api";

const statusList = ["shipped", "completed", "canceled", "refunded"];
const paymentMethodList = ["cash", "credit_card", "debit_card", "paypal"];
const notes = ["Taroh depan pintu", "titip lobby", "jangan dibuka", ""];
const mainStreet = ["Antara", "MT. Haryono", "Ahmad Yani", "Pahlawan", "DI Pandjaitan", "R. Suprapto", "Tj. Duren", "Mangga Besar", "Mangga", "Kebon Jati", "Bina Karya", "Buaran Raya", "Ganggeng Raya", "Tj Morawa", "Raya Mastrip Kebraon", "Jend. Sudirman", "Gergaji", "Tanjung Selor", "Madrasah", "Gayam", "Bintaro Jaya", "Sunan Giri", "Rawamangun", "Budi", "Antara", "Kebon Jeruk"]       
const randomAddress = () => {
    const streetNumber = Math.floor(Math.random() * 999);

    return `Jl. ${mainStreet[Math.floor(Math.random() * mainStreet.length)]} ${streetNumber}`
}

export default () => {
    const data = {
        user_id: parseInt(Math.floor(Math.random() * 2000)),
        product_id: parseInt(Math.floor(Math.random() * 2000)),
        amount: (Math.floor(Math.random() * 50) + 50) * 100,
        status: statusList[Math.floor(Math.random() * statusList.length)],
        payment_method: paymentMethodList[Math.floor(Math.random() * paymentMethodList.length)],
        shipping_address: randomAddress(),
        notes: notes[Math.floor(Math.random() * notes.length)],
    }
    
    const response = http.post(`${url}/collections/transactions/records`, JSON.stringify(data), { headers: {
        'Content-Type': `application/json`,
    } })
}

/*

<----- TEST ----->
Insert 10,000 rows with 7 columns

<----- RESULT ----->

response time
=============
avg=119.72 ms
min=506.2 µs
max=2.5 s

data exchange
=============
receive=463kB/s
sent=271kB/s

=============
throughput=832.565424 requests/s


*/