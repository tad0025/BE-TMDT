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

Dưới đây là danh sách các biến môi trường cần thiết trong file `.env`:

| Biến | Ý nghĩa |
| :--- | :--- |
| `PORT` | Cổng chạy server (VD: 3000) |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME` | Thông tin kết nối cơ sở dữ liệu MySQL |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Khóa bí mật dùng để mã hóa Access/Refresh Token |
| `JWT_ACCESS_EXPIRES_IN` | Thời gian sống của Access Token |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Cấu hình dịch vụ lưu trữ ảnh Cloudinary |
| `CLOUDINARY_FOLDER` | Thư mục lưu ảnh trên Cloudinary |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM` | Cấu hình máy chủ gửi Email SMTP |
| `ADMIN_MAIL`, `ADMIN_PASSWORD`, `ADMIN_FULL_NAME` | Cấu hình tài khoản Admin mặc định |
| `FRONTEND_URL` | URL của Frontend (Dùng cho cấu hình CORS) |
| `MOMO_*`, `VNP_*`, `PAYPAL_*` | Cấu hình các API Key, Endpoint, URL của cổng thanh toán |
| `OPENSEARCH_NODE`, `OPENSEARCH_USERNAME`, `OPENSEARCH_PASSWORD` | Cấu hình kết nối hệ thống tìm kiếm OpenSearch |
| `CMD_NGROK` | Lệnh chạy Ngrok (hỗ trợ test Webhook thanh toán ở Local) |

---

## ▶️ Chạy dự án

### 🔥 Development (Môi trường phát triển)
Lệnh này sẽ khởi động server và tự động reload mỗi khi có thay đổi trong source code.
```bash
npm run start:dev
```

### 🚀 Production (Môi trường thực tế)
Lệnh này dùng để build và chạy ứng dụng ở chế độ tối ưu nhất.
```bash
npm run build
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

## 📌 Ghi chú

> ⚠️ Đây là dự án được xây dựng phục vụ mục đích học tập, nghiên cứu và thực hành phát triển phần mềm.
>
> 🚫 Không được thiết kế cho môi trường thương mại thực tế.
>
> 🎓 Dự án được phát triển nhằm nâng cao kỹ năng thiết kế hệ thống, lập trình Fullstack, xây dựng API và triển khai ứng dụng web.
