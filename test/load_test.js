import http from 'k6/http';

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

export default () => {
    const url = 'http://localhost:8080/api/main/transactions/rows';
    const headers = {
        'X-API-KEY': '019039ff-f5be-7520-8ab8-bbcf248a6585', // Replace with your actual token
    };

    const response = http.get(url, { headers: headers, params: {
        pageSize: 1
    } });
}