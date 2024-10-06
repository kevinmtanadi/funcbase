

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
    const randomId = Math.floor(Math.random() * 88239);
    const url = 'http://localhost:8090/api/collections/transactions/records/' + randomId;

    const response = http.get(url);
}