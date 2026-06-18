fetch('http://localhost:3000/orders/prepare-cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
}).then(res => {
    console.log(res.status);
    return res.text();
}).then(console.log).catch(console.error);
