// Dán đoạn code này vào Console (F12) của trang https://tinhthanhpho.com
const apiKey = 'hvn_xKcP7mBw807pD8og4mDnsoreWoqK5hDK';
const apiUrl = 'https://tinhthanhpho.com/api/v1/provinces'; // API đơn giản để test

fetch(apiUrl, {
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${apiKey}`
    }
})
.then(response => {
    console.log('Trạng thái HTTP:', response.status);
    if(response.ok) {
        return response.json();
    } else {
        throw new Error(`Lỗi: ${response.status}`);
    }
})
.then(data => console.log('Dữ liệu trả về:', data))
.catch(error => console.error('Có lỗi:', error));
