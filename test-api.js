fetch('http://localhost:3000/orders/prepare-cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prepareTempId: '123' })
}).then(res => res.json()).then(console.log).catch(console.error);
