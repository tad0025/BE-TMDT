# 🎨 MarketNest

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS"/>
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL"/>
  <img src="https://img.shields.io/badge/TypeORM-FE0902?style=for-the-badge&logo=typeorm&logoColor=white" alt="TypeORM"/>
  <img src="https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens" alt="JWT"/>
  <img src="https://img.shields.io/badge/License-MIT-success?style=for-the-badge" alt="License"/>
</p>

### 🌿 Nền tảng thương mại điện tử sản phẩm thủ công mỹ nghệ - Backend Service

> Kết nối nghệ nhân với khách hàng thông qua nền tảng mua sắm trực tuyến hiện đại, thân thiện và dễ sử dụng. Hệ thống Backend đóng vai trò cốt lõi xử lý toàn bộ logic nghiệp vụ, bảo mật, và dữ liệu cho MarketNest.

---

## 📚 Mục lục

* [Giới thiệu](#-giới-thiệu)
* [Chức năng](#-chức-năng)
* [Công nghệ sử dụng](#️-công-nghệ-sử-dụng)
* [Cấu trúc dự án](#️-cấu-trúc-dự-án)
* [Cài đặt dự án](#️-cài-đặt-dự-án)
* [Cấu hình biến môi trường](#-cấu-hình-biến-môi-trường)
* [Chạy dự án](#️-chạy-dự-án)
* [Hướng dẫn đóng góp](#-hướng-dẫn-đóng-góp)
* [Ghi chú](#-ghi-chú)

---

## 🚀 Giới thiệu

**MarketNest Backend** là xương sống của nền tảng thương mại điện tử dành riêng cho các sản phẩm thủ công mỹ nghệ. Hệ thống được xây dựng với mục tiêu:
- 🎯 **Cung cấp API mạnh mẽ, ổn định** cho nền tảng Frontend Web và Mobile.
- 🛡️ **Bảo mật tối đa** với hệ thống phân quyền chặt chẽ và xác thực JWT.
- ⚡ **Tối ưu hiệu năng** thông qua việc tích hợp OpenSearch cho khả năng tìm kiếm nhanh chóng và linh hoạt.
- 💳 **Thanh toán đa dạng** với sự hỗ trợ của các cổng thanh toán hàng đầu (MoMo, VNPay, PayPal).

Đối tượng sử dụng hệ thống API này bao gồm đội ngũ phát triển Frontend, Mobile App và hệ thống quản trị của doanh nghiệp.

---

## 💻 Chức năng

### 👤 Chức năng dành cho Khách hàng
* 📝 **Đăng ký & Xác thực**: Đăng ký, đăng nhập và bảo mật bằng JWT (Access/Refresh Token).
* 🛍️ **Duyệt sản phẩm**: Hiển thị danh sách sản phẩm, chi tiết sản phẩm.
* 🔎 **Tìm kiếm sản phẩm**: Tìm kiếm toàn văn bản nâng cao với OpenSearch.
* 🏷️ **Lọc theo danh mục**: Phân loại và lọc sản phẩm.
* 🛒 **Quản lý giỏ hàng**: Thêm, sửa, xóa sản phẩm trong giỏ hàng.
* 💳 **Thanh toán đơn hàng**: Hỗ trợ thanh toán qua MoMo, VNPay, PayPal.
* 🚚 **Theo dõi đơn hàng**: Xem lịch sử và trạng thái đơn hàng.
* ⭐ **Đánh giá sản phẩm**: Để lại nhận xét và chấm điểm cho sản phẩm đã mua.
* 🎁 **Sử dụng voucher**: Áp dụng mã giảm giá.
* 👤 **Quản lý hồ sơ cá nhân**: Cập nhật thông tin cá nhân.

### 👨‍💼 Chức năng dành cho Quản trị viên
* 📊 **Dashboard**: Tổng quan hệ thống, thống kê doanh thu và chỉ số quan trọng.
* 📦 **Quản lý sản phẩm**: Thêm mới, cập nhật, xóa sản phẩm và duyệt sản phẩm từ người bán.
* 📑 **Quản lý đơn hàng**: Theo dõi và cập nhật trạng thái đơn hàng toàn hệ thống.
* 🎟️ **Quản lý voucher**: Tạo và quản lý các chiến dịch khuyến mãi.
* 👥 **Quản lý người dùng**: Quản lý danh sách User, Staff, Seller và Admin.
* 🖼️ **Quản lý Media**: Upload hình ảnh an toàn qua Cloudinary.
* 📧 **Hệ thống Email**: Gửi email tự động thông qua Nodemailer.

---

## 🛠️ Công nghệ sử dụng

Hệ thống được phát triển dựa trên các công nghệ và thư viện hiện đại nhất:

| Công nghệ | Vai trò |
| :--- | :--- |
| <img src="https://skillicons.dev/icons?i=nestjs" width="20"/> **NestJS** | Framework chính xây dựng backend, kiến trúc module hóa |
| <img src="https://skillicons.dev/icons?i=typescript" width="20"/> **TypeScript** | Ngôn ngữ lập trình chính, đảm bảo Type Safety |
| <img src="https://skillicons.dev/icons?i=mysql" width="20"/> **MySQL** | Hệ quản trị cơ sở dữ liệu quan hệ |
| 🗄️ **TypeORM** | Object-Relational Mapper (ORM) giao tiếp với Database |
| 🔐 **JWT & Passport** | Hệ thống bảo mật, xác thực và phân quyền người dùng |
| ☁️ **Cloudinary** | Dịch vụ lưu trữ hình ảnh đám mây |
| 📧 **Nodemailer** | Gửi email thông báo tự động (đơn hàng, xác thực) |
| 💳 **MoMo/VNPay/PayPal** | Tích hợp cổng thanh toán trực tuyến |
| 🔎 **OpenSearch** | Search engine mạnh mẽ cho chức năng tìm kiếm sản phẩm |

---

## 🗂️ Cấu trúc dự án

Dự án được tổ chức theo kiến trúc module của NestJS, giúp dễ dàng mở rộng và bảo trì:

```text
src/
├── constants/         # Chứa các hằng số và enums dùng chung cho toàn hệ thống
├── core/              # Các module cốt lõi (Interceptors, Filters, Guards, Decorators)
├── log/               # Cấu hình ghi log hệ thống
├── module/            # Các tính năng chính (Feature modules) của ứng dụng
│   ├── admin-dashboard/ # API cho màn hình thống kê Admin
│   ├── admins/          # Quản lý tài khoản Admin
│   ├── auth/            # Tính năng xác thực & phân quyền
│   ├── cart/            # Logic quản lý giỏ hàng
│   ├── categories/      # Logic quản lý danh mục sản phẩm
│   ├── checkout/        # Logic xử lý thanh toán (MoMo, VNPay, PayPal)
│   ├── mails/           # Dịch vụ gửi email tự động
│   ├── media/           # Xử lý upload file lên Cloudinary
│   ├── opensearch/      # Dịch vụ tìm kiếm nâng cao
│   ├── orders/          # Quản lý đơn hàng
│   ├── products/        # Quản lý thông tin sản phẩm
│   ├── reviews/         # Tính năng đánh giá & nhận xét
│   ├── sellers/         # Chức năng cho người bán
│   ├── staffs/          # Quản lý nhân viên
│   ├── users/           # Quản lý người dùng cuối
│   └── vouchers/        # Quản lý mã giảm giá
├── template/          # Giao diện email (HTML templates)
├── utils/             # Các hàm tiện ích (Helpers) hỗ trợ
├── app.module.ts      # Module gốc tổng hợp toàn bộ các module khác
└── main.ts            # File cấu hình và khởi chạy ứng dụng
```

---

## ⚙️ Cài đặt dự án

Để chạy dự án trên môi trường local, máy tính của bạn cần cài đặt sẵn **Node.js (v18+)**, **MySQL** và **OpenSearch**.

### 1️⃣ Clone source code
```bash
git clone <repository-url>
cd BE-TMDT
```

### 2️⃣ Cài đặt thư viện
```bash
npm install
# hoặc
yarn install
```

### 3️⃣ Cấu hình môi trường
Tạo file `.env` tại thư mục gốc và cấu hình các biến cần thiết (Xem chi tiết ở mục bên dưới).

---

## 🔑 Cấu hình biến môi trường

Dự án quản lý cấu hình thông qua 3 loại môi trường (Environment) khác nhau:

### 1. Local (`.env.local`)
**Mục đích:**
- Phát triển hằng ngày.
- Chạy trên máy cá nhân.
- **Giải thích:** Cấu hình để phục vụ Frontend đang chạy trên `localhost`. Các kết nối cơ sở dữ liệu và service được sử dụng cho môi trường cục bộ.

### 2. LAN (`.env.lan`)
**Mục đích:**
- Test trên thiết bị khác trong cùng mạng LAN (ví dụ: dùng điện thoại truy cập qua WiFi).
- **Giải thích:** Các URL chuyển hướng (Payment Redirect, Return URLs) được thay bằng IP LAN thực tế (Ví dụ: `http://192.168.1.32`) thay vì `localhost`, giúp điện thoại quay lại được ứng dụng sau khi thanh toán.

### 3. Preview (`.env.preview`)
**Mục đích:**
- Hỗ trợ Frontend test bản production build ở môi trường local.
- **Quan trọng:** File preview có thể linh hoạt thay đổi:
  - **Cấu hình giống Local:** Nếu Frontend preview bằng `localhost` trên máy tính.
  - **Cấu hình giống LAN:** Nếu Frontend preview và truy cập qua thiết bị mobile (thay bằng IP LAN).
  - **Cấu hình Production:** Khi deploy, file này cũng có thể mang thiết lập của server đám mây.

---

**Danh sách các biến môi trường (Áp dụng chung theo đúng thứ tự file `.env`):**

| Biến | Ý nghĩa |
| :--- | :--- |
| **Server** | |
| `PORT` | Cổng chạy server (VD: 3000) |
| **Environment Configuration** | |
| `APP_PUBLIC_URL` | URL công khai của Frontend để Backend chuyển hướng (Redirect) |
| `BACKEND_PUBLIC_URL` | URL công khai của Backend để truy xuất tài nguyên tĩnh/Swagger |
| `PAYMENT_CALLBACK_BASE_URL` | URL (như Ngrok) để các cổng thanh toán gọi Webhook/IPN về |
| `CORS_ALLOWED_ORIGINS` | Danh sách các Origin được phép gọi API qua CORS |
| `NODE_ENV` | Chế độ chạy (VD: `development`, `production`) |
| **Database MySQL** | |
| `DB_HOST` | Host kết nối MySQL |
| `DB_PORT` | Cổng kết nối MySQL |
| `DB_USER` | Tên đăng nhập MySQL |
| `DB_PASS` | Mật khẩu MySQL |
| `DB_NAME` | Tên cơ sở dữ liệu |
| **JWT** | |
| `JWT_ACCESS_SECRET` | Khóa bí mật dùng để mã hóa Access Token |
| `JWT_REFRESH_SECRET` | Khóa bí mật dùng để mã hóa Refresh Token |
| `JWT_ACCESS_EXPIRES_IN` | Thời gian sống của Access Token (VD: `1h`, `7d`) |
| **Cloudinary** | |
| `CLOUDINARY_CLOUD_NAME` | Tên Cloud của tài khoản Cloudinary |
| `CLOUDINARY_API_KEY` | API Key của Cloudinary |
| `CLOUDINARY_API_SECRET` | Secret Key của Cloudinary |
| `CLOUDINARY_FOLDER` | Thư mục lưu ảnh mặc định trên Cloudinary |
| **Mailer** | |
| `MAIL_HOST` | Host SMTP của Email |
| `MAIL_PORT` | Cổng SMTP |
| `MAIL_USER` | Email gửi đi |
| `MAIL_PASS` | Mật khẩu ứng dụng của Email |
| `MAIL_FROM` | Tên hiển thị người gửi |
| **Admin** | |
| `ADMIN_MAIL` | Email của tài khoản Admin mặc định khởi tạo ban đầu |
| `ADMIN_PASSWORD` | Mật khẩu mặc định của Admin |
| `ADMIN_FULL_NAME` | Tên hiển thị của Admin |
| `ADMIN_AVATAR_URL` | URL ảnh đại diện của Admin |
| **MoMo Payment** | |
| `MOMO_PARTNER_CODE` | Partner Code do MoMo cấp |
| `MOMO_ACCESS_KEY` | Access Key của MoMo |
| `MOMO_SECRET_KEY` | Secret Key của MoMo |
| `MOMO_ENDPOINT` | URL gọi tạo giao dịch MoMo |
| **VNPay Payment** | |
| `VNP_TMN_CODE` | Website Code (TMN) do VNPay cấp |
| `VNP_HASH_SECRET` | Chuỗi bí mật Hash Secret của VNPay |
| `VNP_URL` | URL cổng thanh toán VNPay |
| **PayPal Payment** | |
| `PAYPAL_CLIENT_ID` | Client ID ứng dụng PayPal |
| `PAYPAL_CLIENT_SECRET` | Secret Key ứng dụng PayPal |
| `PAYPAL_ENVIRONMENT` | Môi trường PayPal (`sandbox` hoặc `live`) |
| **Open Search** | |
| `OPENSEARCH_NODE` | URL kết nối hệ thống tìm kiếm OpenSearch |
| `OPENSEARCH_USERNAME` | Tên đăng nhập OpenSearch |
| `OPENSEARCH_PASSWORD` | Mật khẩu OpenSearch |

---

## ▶️ Chạy dự án

Hệ thống hỗ trợ chuyển đổi mượt mà giữa các môi trường thông qua các script cấu hình sẵn.

### 1. Development mode (Chạy Local)

**Mục đích:**
- Viết code hằng ngày, phát triển tính năng mới.
- Tự động tải lại code (hot-reload) khi có thay đổi.
- Kết nối với Frontend đang chạy trên `localhost`.

**Thông tin:**
- Lệnh khởi chạy:
  ```bash
  npm run start:local
  ```
- URL lắng nghe: `http://localhost:3000`
- Environment tương ứng: Đọc từ file `.env.local`

---

### 2. LAN / Mobile Testing mode (Test trên Điện thoại)

**Mục đích:**
- Hỗ trợ Frontend kiểm thử trên điện thoại thật qua mạng WiFi nội bộ.
- Đảm bảo Backend trả về URL chuyển hướng (Payment Redirect / Return URLs) mang IP LAN chính xác, giúp điện thoại có thể quay lại app sau khi thanh toán xong thay vì bị lỗi tìm về `localhost`.

**Thông tin:**
- Lệnh khởi chạy:
  ```bash
  npm run start:lan
  ```
- URL lắng nghe: Server lắng nghe tại IP LAN (Ví dụ: `http://192.168.1.32:3000`)
- Environment tương ứng: Đọc từ file `.env.lan` (Lưu ý: Bạn phải mở file này và thay thế các chuỗi `<YOUR_LOCAL_IP>` thành IP LAN thực tế của máy).

---

### 3. Preview mode (Hỗ trợ Frontend Test PWA)

**Mục đích:**
- Phục vụ cho Frontend khi đang chạy thử bản build (cổng `4173`).
- Giúp Frontend test tính năng cài đặt PWA hoàn chỉnh với API thật sự trên môi trường thử nghiệm.

**Thông tin:**
- Lệnh khởi chạy:
  ```bash
  npm run start:preview
  ```
- URL lắng nghe: Hỗ trợ gọi API qua cổng `3000` (Localhost hoặc LAN IP tùy cấu hình Frontend).
- Environment tương ứng: Đọc từ file `.env.preview` (Thay đổi `<YOUR_LOCAL_IP>` nếu test bằng điện thoại).

---

### 4. Production mode (Môi trường Thực tế)

**Mục đích:**
- Chạy phiên bản đã được biên dịch tối ưu (Production Build) trên các máy chủ đám mây như VPS, Vercel, Docker.
- (Không dùng file `.env`, các biến môi trường sẽ được nạp trực tiếp qua bảng điều khiển của Server).

**Thông tin:**
- Lệnh khởi chạy:
  ```bash
  # 1. Build source code
  npm run build
  
  # 2. Khởi chạy bằng Node.js gốc (không qua ts-node)
  npm run start:prod
  ```

---

## 🤝 Hướng dẫn đóng góp

Chúng tôi luôn hoan nghênh những đóng góp từ cộng đồng. Hãy làm theo các bước sau để đóng góp vào dự án:

- [x] **Fork** repository này về tài khoản cá nhân.
- [x] **Tạo branch mới** chứa tính năng hoặc bản vá lỗi của bạn: `git checkout -b feature/ten-tinh-nang`
- [x] **Commit code** với thông điệp rõ ràng: `git commit -m 'Thêm tính năng đăng nhập bằng Google'`
- [x] **Push branch** lên GitHub: `git push origin feature/ten-tinh-nang`
- [x] **Tạo Pull Request** để chúng tôi review và merge code.

---

## 🌐 Link Deploy

- **Frontend (Vercel):** [https://marketnestplatform.vercel.app](https://marketnestplatform.vercel.app)
- **Backend (Render):** [https://marketnestplatform.onrender.com](https://marketnestplatform.onrender.com)

---

## 📌 Ghi chú

> ⚠️ Đây là dự án được xây dựng phục vụ mục đích học tập, nghiên cứu và thực hành phát triển phần mềm.
>
> 🚫 Không được thiết kế cho môi trường thương mại thực tế.
>
> 🎓 Dự án được phát triển nhằm nâng cao kỹ năng thiết kế hệ thống, lập trình Fullstack, xây dựng API và triển khai ứng dụng web.
