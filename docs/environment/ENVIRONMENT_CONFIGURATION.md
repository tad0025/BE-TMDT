# Kiến trúc Environment Configuration

Tài liệu này giải thích chi tiết về kiến trúc cấu hình môi trường mới của dự án MarketNest, giúp tách bạch trách nhiệm của các biến URL, loại bỏ các lỗi bảo mật khi sử dụng `Origin` header và đơn giản hóa quá trình chuyển đổi qua lại giữa các môi trường phát triển (Local, LAN, Preview).

## 1. Các biến Environment Cốt Lõi

Thay vì sử dụng các biến URL ngẫu nhiên lặp đi lặp lại hoặc tự cố gắng "đoán" URL đang dùng, hệ thống hiện tại sử dụng **4 biến quan trọng nhất**:

### Backend

- **`APP_PUBLIC_URL`**: 
  - **Ý nghĩa**: Đường dẫn công khai tới Frontend đang phục vụ người dùng.
  - **Sử dụng**: Làm URL trả về (`ReturnUrl`) cho các dịch vụ Thanh toán (VNPay, MoMo, PayPal) sau khi User thanh toán xong. Ngoài ra có thể dùng để render link nhúng trong Email xác nhận.

- **`BACKEND_PUBLIC_URL`**:
  - **Ý nghĩa**: Đường dẫn công khai tới Backend API.
  - **Sử dụng**: Làm URL cho Swagger, OpenAPI, các đường dẫn tĩnh (Static Files, Uploads). KHÔNG dùng cho Payment Callback.

- **`PAYMENT_CALLBACK_BASE_URL`**:
  - **Ý nghĩa**: Đường dẫn công khai độc lập để các Payment Gateway (VNPay, MoMo, PayPal) gọi IPN / Callback về Backend.
  - **Sử dụng**: Làm Webhook / IPN URL (`IpnUrl` hoặc `CaptureUrl`).
  - **Lý do tách biệt**: Trong giai đoạn phát triển đồ án, biến này được cấu hình tĩnh bằng **Ngrok URL** (VD: `https://xxxxxxxx.ngrok-free.app`) nhằm giúp các cổng thanh toán có thể chọc thủng NAT router để gọi về máy cá nhân của bạn, trong khi Frontend thì lại gọi API trực tiếp qua LAN/Localhost (biến `BACKEND_PUBLIC_URL`). Sau này khi deploy Production, hai biến này có thể sẽ giống hệt nhau (`https://api.marketnest.com`).

- **`CORS_ALLOWED_ORIGINS`**:
  - **Ý nghĩa**: Danh sách tĩnh cấu hình nguồn gốc được gọi API.
  - **Sử dụng**: Dùng riêng cho `app.enableCors()`.
  - **Lưu ý**: Ở môi trường Development, biến này đã được khai báo bao hàm toàn bộ (localhost, IP LAN, port 5173, port 4173) để không bao giờ bị lỗi CORS khi đổi máy test.

### Frontend

- **`VITE_API_BASE_URL`**:
  - **Ý nghĩa**: Đường dẫn tuyệt đối tới Backend Server. (Đã loại bỏ `VITE_API_URL`).
  - **Sử dụng**: Mọi Axios Request đều gọi về URL này. Không tự suy luận URL, không dùng `window.location.origin`.

## 2. Ý nghĩa của từng Profile (`APP_ENV`)

Hệ thống tuân thủ nghiêm ngặt nguyên tắc **`NODE_ENV` chỉ có 2 trạng thái: `development` và `production`**.
Để quản lý việc chạy LAN hay Preview, chúng ta sử dụng biến **`APP_ENV`** kết hợp với nhiều file `.env`:

- **`.env.local`**: Dùng khi Code và Test trên cùng 1 máy tính bằng `localhost`.
- **`.env.lan`**: Dùng khi Code trên máy tính nhưng test Frontend trên điện thoại kết nối cùng mạng WiFi (Truy cập bằng IP tĩnh 192.168.x.x).
- **`.env.preview`**: Dùng khi Test bản Build của Frontend (Thường chạy ở port 4173).
- **`.env.production`**: Dùng cho môi trường triển khai thực tế.

## 3. Luồng Payment Redirect 100% Độc Lập

Quá trình chuyển hướng sau thanh toán được diễn ra như sau:
1. **Khởi tạo thanh toán**: Backend nhận request từ Frontend, tự động đọc biến `APP_PUBLIC_URL` để gán vào `ReturnUrl` (Nơi user bị redirect về sau khi thanh toán) và biến `PAYMENT_CALLBACK_BASE_URL` vào `IpnUrl` (Nơi server thứ 3 sẽ gọi API báo kết quả).
2. **User thanh toán**: Sau khi hoàn tất trên cổng VNPay/MoMo, cổng thanh toán redirect thiết bị của User về `ReturnUrl`.
3. **Riêng PayPal**: Do luồng của PayPal yêu cầu Capture ở Backend, Backend gán `ReturnUrl` trỏ về chính Controller của Backend qua `PAYMENT_CALLBACK_BASE_URL`. Sau khi Capture xong, Backend dùng `APP_PUBLIC_URL` gọi `res.redirect()` để đá User về Frontend một cách hoàn hảo.

Cơ chế này hoàn toàn không phụ thuộc vào `request.headers.origin`, do đó bảo mật hơn và hoạt động đúng trên mọi IP.

## 4. Bảng Tổng Hợp Cấu Hình (Configuration Matrix)

Dưới đây là sơ đồ cấu hình URL trên mọi môi trường:

| APP_ENV / Chế độ | Frontend URL (APP_PUBLIC_URL) | Backend URL (BACKEND_PUBLIC_URL) | Callback URL (PAYMENT_CALLBACK_BASE_URL) | API Gọi (VITE_API_BASE_URL) | Payment Return URL (VNPay/MoMo) |
| :--- | :--- | :--- | :--- | :--- |
| **Local** (`.local`) | `http://localhost:5173` | `http://localhost:3000` | `https://*.ngrok-free.dev` | `http://localhost:3000` | `http://localhost:5173/order/...` |
| **LAN** (`.lan`) | `http://<YOUR_LOCAL_IP>:5173` | `http://<YOUR_LOCAL_IP>:3000` | `https://*.ngrok-free.dev` | `http://<YOUR_LOCAL_IP>:3000` | `http://<YOUR_LOCAL_IP>:5173/order/...` |
| **Preview** (`.preview`) | `http://localhost:4173` | `http://localhost:3000` | `https://*.ngrok-free.dev` | `http://localhost:3000` | `http://localhost:4173/order/...` |
| **Production** | `https://marketnest.com` | `https://api.marketnest.com` | `https://api.marketnest.com` | `https://api.marketnest.com` | `https://marketnest.com/order/...` |
