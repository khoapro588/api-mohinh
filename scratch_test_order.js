const fetch = require('node-fetch');

async function testOrder() {
    const orderData = {
        customerId: 1,
        totalAmount: 350000,
        status: "Pending",
        items: [
            { modelId: 1, quantity: 1, unitPrice: 320000 }
        ]
    };

    try {
        const res = await fetch('http://localhost:5271/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        console.log("Status:", res.status);
        const data = await res.json();
        console.log("Data:", data);
    } catch (e) {
        console.error("Error:", e.message);
    }
}

testOrder();
