import http from 'k6/http';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';

export let options = {
    insecureSkipTLSVerify: true,
    noConnectionReuse: false,
    stages: [
        { duration: '1m', target: 100},
        { duration: '2m', target: 100},
        { duration: '1m', target: 200},
        { duration: '2m', target: 200},
        { duration: '1m', target: 300},
        { duration: '2m', target: 300},
        { duration: '1m', target: 500},
        { duration: '2m', target: 500},
        { duration: '3m', target: 0},
        
    ]
};

const url = "http://localhost:8080/api";
const headers = {
    'Content-Type': 'multipart/form-data; boundary=',
    'X-API-KEY': '019039ff-f5be-7520-8ab8-bbcf248a6585', // Replace with your actual token
};

const statusList = ["shipped", "completed", "canceled", "refunded"];
const paymentMethodList = ["cash", "credit_card", "debit_card", "paypal"];
const notes = ["Taroh depan pintu", "titip lobby", "jangan dibuka", ""];
const mainStreet = ["Antara", "MT. Haryono", "Ahmad Yani", "Pahlawan", "DI Pandjaitan", "R. Suprapto", "Tj. Duren", "Mangga Besar", "Mangga", "Kebon Jati", "Bina Karya", "Buaran Raya", "Ganggeng Raya", "Tj Morawa", "Raya Mastrip Kebraon", "Jend. Sudirman", "Gergaji", "Tanjung Selor", "Madrasah", "Gayam", "Bintaro Jaya", "Sunan Giri", "Rawamangun", "Budi", "Antara", "Kebon Jeruk"]       
const randomAddress = () => {
    const streetNumber = Math.floor(Math.random() * 999);

    return `Jl. ${mainStreet[Math.floor(Math.random() * mainStreet.length)]} ${streetNumber}`
}

export default () => {
    const form = new FormData();
    form.append("user_id", Math.floor(Math.random() * 2000));
    form.append("product_id", Math.floor(Math.random() * 2000));
    form.append("amount", Math.floor(Math.random() * 50) * 100);
    form.append("status", statusList[Math.floor(Math.random() * statusList.length)]);
    form.append("payment_method", paymentMethodList[Math.floor(Math.random() * paymentMethodList.length)]);
    form.append("shipping_address", randomAddress());
    form.append("notes", notes[Math.floor(Math.random() * notes.length)]);
    
    const response = http.post(`${url}/main/transactions/insert`, form.body(), { headers: {
        'Content-Type': `multipart/form-data; boundary=${form.boundary}`,
        'X-API-KEY': '019039ff-f5be-7520-8ab8-bbcf248a6585',
    } })
}