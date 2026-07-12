# Hướng dẫn Chạy Nhiều Môi trường (Developer Guide)

Tài liệu này hướng dẫn cách chuyển đổi mượt mà giữa các môi trường phát triển trên dự án MarketNest mà không cần phải chỉnh sửa file code. 

Hệ thống cung cấp 3 môi trường cơ bản (Local, LAN, Preview) và Production. Quá trình chuyển đổi chỉ dựa vào việc chạy đúng lệnh script tương ứng.

---

## 1. Khi nào dùng Local Development?

**Mục đích**: Dành cho quá trình phát triển thông thường, viết code và xem kết quả ngay trên chính máy tính của bạn thông qua trình duyệt (localhost).

**Cách chạy**:
- **Backend (Tab 1)**: Mở thư mục `BE-TMDT` và chạy:
  ```bash
  npm run start:local
  ```
  *(Backend tự động đọc file `.env.local`)*

- **Frontend (Tab 2)**: Mở thư mục `E-CommercePlatform` và chạy:
  ```bash
  npm run dev
  ```
  *(Frontend tự động đọc file `.env.local`)*

**Kết quả**: Frontend chạy ở `http://localhost:5173`, gọi API lên `http://localhost:3000`. Payment Redirect sẽ trả về `http://localhost:5173/order/checkout/result`.

---

## 2. Khi nào dùng LAN Development?

**Mục đích**: Khi bạn muốn dùng điện thoại di động (hoặc một máy tính khác cùng mạng WiFi) để kết nối vào website bạn đang chạy nhằm test giao diện Responsive, hoặc test chức năng chuyển hướng thanh toán VNPay thực tế qua Mobile.

**Điều kiện chuẩn bị**:
Hãy xem IP mạng LAN hiện tại của máy tính bạn (Ví dụ: `192.168.1.32`).
Bạn vào thư mục `BE-TMDT` mở file `.env.lan` và thư mục `E-CommercePlatform` mở file `.env.lan`. Thay thế tất cả cụm `<YOUR_LOCAL_IP>` thành IP của bạn (Ví dụ: `192.168.1.32`).

**Cách chạy**:
- **Backend (Tab 1)**: Mở thư mục `BE-TMDT` và chạy:
  ```bash
  npm run start:lan
  ```
  *(Backend tự động đọc file `.env.lan`)*

- **Frontend (Tab 2)**: Mở thư mục `E-CommercePlatform` và chạy:
  ```bash
  npm run dev:lan
  ```
  *(Frontend tự động đọc file `.env.lan`)*

**Kết quả**: Bạn dùng điện thoại truy cập vào `http://192.168.1.32:5173`. Frontend gọi API thẳng tới `http://192.168.1.32:3000`. Nếu test thanh toán, ngân hàng sẽ redirect điện thoại của bạn về đúng IP `192.168.1.32`!

---

## 3. Khi nào dùng Preview?

**Mục đích**: Preview khác Dev ở chỗ, nó không chạy mã nguồn trực tiếp (không có Hot Reload). Preview chạy trực tiếp **bản build sản phẩm cuối cùng** (đã minify, đóng gói) được cung cấp qua local web server để bạn review kết quả chính xác nhất trước khi Deploy. Bạn cũng có thể dùng Preview để test PWA / Service Worker (Service worker chỉ chạy trên file build).

**Cách chạy**:
- **Backend (Tab 1)**: Mở thư mục `BE-TMDT` và chạy:
  ```bash
  npm run start:preview
  ```
  *(Backend tự động đọc file `.env.preview`, chuyển `APP_PUBLIC_URL` về port 4173)*

- **Frontend (Tab 2)**: Mở thư mục `E-CommercePlatform` và chạy:
  ```bash
  npm run build:preview
  npm run preview
  ```
  *(Frontend tự động đọc `.env.preview`, build ra thư mục `dist` và sau đó Vite host bản build ở `http://localhost:4173`)*

**Kết quả**: Bạn truy cập vào `http://localhost:4173` trên máy tính để trải nghiệm bản build thực tế.

### Preview trên điện thoại (Mạng LAN) để test PWA

Nếu bạn muốn test bản Preview trực tiếp trên điện thoại (rất hữu ích khi test PWA Install):

1. **Xác định IP LAN của máy**. Ví dụ: `192.168.1.32`
2. **Cập nhật File**: Mở file `.env.preview` của Frontend và Backend, thay `192.168.1.32` thành IP thực tế của bạn.
3. **Build Frontend**: Chạy `npm run build:preview`
4. **Chạy Frontend**: Chạy `npm run preview`
5. **Chạy Backend**: `npm run start:preview`
6. **Mở trên điện thoại**: Truy cập `http://192.168.1.32:4173`
7. **Xác nhận**:
   - API gọi đúng Backend LAN (Không bị lỗi Network Error hay CORS).
   - Payment Redirect trả về điện thoại đúng IP.
   - Trình duyệt hiện nút "Cài đặt ứng dụng" (PWA).

---

## 4. Khi nào dùng Production?

**Mục đích**: Khởi chạy dự án thực tế trên Server (VPS, Vercel, Docker).
Trong môi trường này, bạn KHÔNG thêm `.env.production` vào Git. Cấu hình biến môi trường sẽ được thiết lập trực tiếp vào bảng điều khiển của Server (hoặc Docker env).

**Cách chạy**:
- **Backend**: 
  Set biến môi trường `APP_ENV=production` & `NODE_ENV=production`.
  Chạy lệnh: `npm run build` rồi `npm run start:prod`.
- **Frontend**: 
  Build bằng lệnh `npm run build` và deploy thư mục `dist`.

---

## 5. Troubleshooting (Khắc phục lỗi)

**Q: Chrome báo lỗi CORS đỏ lừ trên Console?**
A: Lỗi CORS xảy ra khi bạn mở Frontend bằng một domain/IP/port không khớp với bất kỳ domain nào nằm trong danh sách `CORS_ALLOWED_ORIGINS` của Backend. Đảm bảo biến này trong file `.env.local` / `.env.lan` / `.env.preview` đã bao gồm địa chỉ IP và Port bạn đang truy cập.

**Q: Thanh toán xong nhưng nó redirect trả về localhost trong khi tôi đang dùng điện thoại test LAN?**
A: Chắc chắn bạn đã quên tắt Backend đi và bật lại bằng lệnh `npm run start:lan`. Nếu bạn vẫn chạy `npm run start:local`, Backend sẽ gán ReturnUrl là `localhost`, khiến thiết bị của bạn tìm `localhost` và không ra trang web.

**Q: Preview gọi localhost nhưng bị lỗi "Network Error"?**
A: Kiểm tra bạn có đang quên chạy Backend ở cửa sổ thứ 2 không.

**Q: PWA không xuất hiện nút "Cài đặt ứng dụng"?**
A: PWA thường chỉ xuất hiện nếu bạn test qua giao thức HTTPS, HOẶC test ở `localhost`, HOẶC bạn test ở mạng LAN qua lệnh `npm run preview`. Hãy kiểm tra bạn đã chạy bản Build bằng lệnh `preview` chưa.

---

## Tổng kết "Đổi Môi Trường Thần Tốc" (Không Sửa Code)

| Môi trường chuyển đổi | Lệnh Backend | Lệnh Frontend |
| :--- | :--- | :--- |
| **Code bình thường (Local)** | `npm run start:local` | `npm run dev` |
| **Test trên Mobile (LAN)** | `npm run start:lan` | `npm run dev:lan` |
| **Xem trước PWA/Bản Build (Preview)** | `npm run start:preview` | `npm run build:preview && npm run preview` |
