# API Integration Guide - Sprint 1 (Auth & Foundation)

Chào team Frontend (đặc biệt là Hậu và Duy), Backend đã sẵn sàng các API cốt lõi của Sprint 1 (Xác thực & Nền tảng).

Tài liệu này là đặc tả API chi tiết để team tích hợp vào ứng dụng Flutter. Team có thể dùng tài liệu này để cấu hình Base Client (`Dio` hoặc `http`) trước khi ráp vào giao diện.

## 1. Thông Tin Chung (Global Configuration)

- Base URL (Dev): `http://localhost:3000/api/v1`
- Standard Response: Tất cả API trả về cùng cấu trúc JSON thống nhất để Frontend parse lỗi tập trung.

### Success Response (200 OK / 201 Created)

```json
{
  "status": "success",
  "message": "Thông điệp thành công",
  "data": { }
}
```

### Error Response (400, 401, 404, 500)

```json
{
  "status": "error",
  "message": "Chi tiết lỗi để hiển thị lên UI"
}
```

## 2. Auth Module APIs

### 2.1 Đăng ký tài khoản (Register)

Dùng cho màn hình Đăng ký. Không yêu cầu token.

- URL: `/auth/register`
- Method: `POST`
- Headers: `Content-Type: application/json`

#### Request Body

```json
{
  "username": "hauduy",
  "password": "password123",
  "email": "dev@example.com"
}
```

#### Success Response (201 Created)

```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid-string-...",
      "username": "hauduy",
      "email": "dev@example.com",
      "createdAt": "2026-03-27T10:00:00.000Z"
    }
  }
}
```

### 2.2 Đăng nhập (Login)

Dùng cho màn hình Đăng nhập (Task UI-104). API trả về `token` để lưu vào local storage của app.

- URL: `/auth/login`
- Method: `POST`
- Headers: `Content-Type: application/json`

#### Request Body

```json
{
  "username": "hauduy",
  "password": "password123"
}
```

#### Success Response (200 OK)

```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid-string-...",
      "username": "hauduy",
      "email": "dev@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6Ik..."
  }
}
```

Lưu ý cho Frontend:
- Nếu sai tài khoản hoặc mật khẩu, API trả về HTTP `401` với message: `Invalid username or password`.
- Token cần được lưu lại để dùng cho các API yêu cầu xác thực.

### 2.3 Lấy thông tin User hiện tại (Get Profile)

Dùng để lấy thông tin hiển thị lên App Shell hoặc màn hình Profile (UI-304). Yêu cầu token hợp lệ.

- URL: `/auth/profile`
- Method: `GET`
- Headers:
  - `Authorization: Bearer <access_token>`

#### Success Response (200 OK)

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid-string-...",
      "username": "hauduy",
      "email": "dev@example.com",
      "createdAt": "2026-03-27T10:00:00.000Z"
    }
  }
}
```

Lưu ý cho Frontend:
- Nếu token hết hạn hoặc không hợp lệ, API trả về HTTP `401` (ví dụ: `Unauthorized: Token has expired`).
- Khi nhận lỗi `401`, Frontend nên trigger luồng logout và điều hướng về màn hình Đăng nhập.

## 3. Gợi Ý Tích Hợp Flutter

Để tránh truyền header thủ công cho từng request, team nên cấu hình một interceptor trong `Dio`:

- Tự động lấy `token` từ local storage.
- Tự động thêm header `Authorization: Bearer <token>` cho các API cần auth.
- Bỏ qua interceptor cho `POST /auth/login` và `POST /auth/register`.
- Nếu response `401`, xử lý global logout + điều hướng về màn hình login.

## 4. Hỗ Trợ Thêm

Nếu team cần, Backend có thể xuất bộ API này thành **Postman Collection (JSON)** để import và test nhanh.
