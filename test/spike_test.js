import http from 'k6/http';

export let options = {
    insecureSkipTLSVerify: true,
    noConnectionReuse: false,
    stages: [
        { duration: '10s', target: 100},
        { duration: '1m', target: 100},
        { duration: '10s', target: 1400},
        { duration: '3m', target: 1400},
        { duration: '10s', target: 100},
        { duration: '3m', target: 100},
        { duration: '10s', target: 0},
    ]
};

export default () => {
    const randomId = Math.floor(Math.random() * 1439876);
    const url = 'http://localhost:8080/api/main/transactions/' + randomId;
    const headers = {
        'X-API-KEY': '019039ff-f5be-7520-8ab8-bbcf248a6585', // Replace with your actual token
    };

    const response = http.get(url, { headers: headers});
}