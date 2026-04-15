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
  "email": "hauduy@example.com",
  "password": "password123"
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
      "email": "hauduy@example.com",
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
  "email": "hauduy@example.com",
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
      "email": "hauduy@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6Ik..."
  }
}
```

Lưu ý cho Frontend:
- Nếu sai email hoặc mật khẩu, API trả về HTTP `401` với message: `Invalid email or password`.
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
      "email": "hauduy@example.com",
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

## Note
- Từ phiên bản này, auth sử dụng **email** thay vì username để đăng nhập.

## 4. Wallets Module APIs

Tài liệu ngắn để Frontend tích hợp module `wallets`.

- Prefix: `/wallets`
- Auth: Bắt buộc token cho tất cả endpoint
- Header chuẩn:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 4.1 Lấy danh sách ví (Get All Wallets)

- Method: `GET`
- URL: `/wallets`

#### Success Response (200 OK)

```json
{
  "status": "success",
  "message": "Wallets fetched successfully",
  "data": {
    "wallets": [
      {
        "id": "uuid",
        "userId": "uuid",
        "name": "Cash",
        "walletType": "CASH",
        "icon": "wallet",
        "balance": "0",
        "creditLimit": "0",
        "createdAt": "2026-03-27T10:00:00.000Z",
        "updatedAt": "2026-03-27T10:00:00.000Z"
      }
    ]
  }
}
```

### 4.2 Tạo ví (Create Wallet)

- Method: `POST`
- URL: `/wallets`

#### Request Body

```json
{
  "name": "Techcombank",
  "walletType": "BANK",
  "icon": "bank",
  "creditLimit": 0
}
```

Lưu ý:
- `name` là bắt buộc.
- `walletType` mặc định là `CASH` nếu không truyền.
- `balance` luôn mặc định `0` khi tạo.
- `creditLimit` chỉ có ý nghĩa khi `walletType = CREDIT`.

#### Success Response (201 Created)

```json
{
  "status": "success",
  "message": "Wallet created successfully",
  "data": {
    "wallet": {
      "id": "uuid",
      "name": "Techcombank",
      "walletType": "BANK"
    }
  }
}
```

### 4.3 Lấy chi tiết ví (Get Wallet By Id)

- Method: `GET`
- URL: `/wallets/:id`

#### Success Response (200 OK)

```json
{
  "status": "success",
  "data": {
    "wallet": {
      "id": "uuid",
      "name": "Cash",
      "walletType": "CASH"
    }
  }
}
```

### 4.4 Cập nhật ví (Update Wallet)

- Method: `PATCH`
- URL: `/wallets/:id`

#### Request Body

```json
{
  "name": "Ví tiền mặt",
  "walletType": "CREDIT",
  "icon": "credit-card",
  "creditLimit": 5000000
}
```

Rule quan trọng:
- Không được update `balance` qua API này.
- Nếu gửi `balance`, API trả về HTTP `400` với message:
  - `Wallet balance cannot be updated directly`

#### Success Response (200 OK)

```json
{
  "status": "success",
  "message": "Wallet updated successfully",
  "data": {
    "wallet": {
      "id": "uuid",
      "name": "Ví tiền mặt"
    }
  }
}
```

### 4.5 Xóa ví (Delete Wallet)

- Method: `DELETE`
- URL: `/wallets/:id`

Rule quan trọng:
- Chỉ được xóa wallet của user đang login.
- Nếu wallet đã có transactions, API trả về HTTP `400` với message:
  - `Cannot delete wallet with existing transactions`

#### Success Response (200 OK)

```json
{
  "status": "success",
  "message": "Wallet deleted successfully"
}
```

### 4.6 Wallet Security Notes

- User chỉ được Read/Update/Delete wallet của chính mình.
- Truy cập wallet của user khác trả về `404 Wallet not found`.

## 5. Transactions Module APIs

Module quản lý các giao dịch thu chi.

- Prefix: `/transactions`
- Auth: Bắt buộc

### 5.1 Lấy các giao dịch gần đây (Get Recent)

Dùng cho trang chủ Flutter (Dashboard).

- Method: `GET`
- URL: `/transactions/recent`

#### Success Response (200 OK)

```json
{
  "status": "success",
  "data": {
    "transactions": [
      {
        "id": "uuid",
        "amount": "50000",
        "type": "EXPENSE",
        "note": "Ăn sáng",
        "transactionDate": "2026-03-27T08:00:00.000Z",
        "wallet": { "name": "Cash" },
        "category": { "name": "Food", "icon": "food" }
      }
    ]
  }
}
```

### 5.2 Danh sách giao dịch (List Transactions)

Hỗ trợ phân trang và lọc theo thời gian.

- Method: `GET`
- URL: `/transactions`
- Query Params:
  - `page`: Trang hiện tại (mặc định 1)
  - `limit`: Số lượng item mỗi trang (mặc định 20)
  - `month`: Lọc theo tháng (1-12)
  - `year`: Lọc theo năm

#### Success Response (200 OK)

```json
{
  "status": "success",
  "data": {
    "transactions": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 20,
      "totalPages": 5
    }
  }
}
```

### 5.3 Tạo giao dịch (Create Transaction)

- Method: `POST`
- URL: `/transactions`

#### Request Body

```json
{
  "walletId": "uuid-cua-vi",
  "categoryId": "uuid-cua-hang-muc",
  "amount": 50000,
  "type": "EXPENSE",
  "note": "Mua cafe",
  "transactionDate": "2026-03-27T08:30:00.000Z"
}
```

### 5.4 Cập nhật/Xóa giao dịch

- `PATCH /transactions/:id`: Cập nhật thông tin giao dịch (body giống POST).
- `DELETE /transactions/:id`: Xóa giao dịch.

---

## 6. Categories Module APIs

- Prefix: `/categories`

### 6.1 Lấy danh sách hạng mục

- Method: `GET`
- URL: `/categories`

Trả về danh sách các hạng mục (bao gồm hạng mục hệ thống và hạng mục do user tự tạo).

### 6.2 Tạo hạng mục mới

- Method: `POST`
- URL: `/categories`

#### Request Body

```json
{
  "name": "Shopping",
  "type": "EXPENSE",
  "icon": "shopping_cart"
}
```

---

## 7. Budgets Module APIs (Ngân sách)

- Prefix: `/budgets`

### 7.1 Lấy tiến độ ngân sách (Budget Progress)

Dùng để hiển thị thanh progress bar trên UI.

- Method: `GET`
- URL: `/budgets/progress`
- Query Params: `month`, `year`

#### Success Response (200 OK)

```json
{
  "status": "success",
  "data": {
    "budgets": [
      {
        "id": "uuid",
        "categoryId": "uuid",
        "categoryName": "Food",
        "amountLimit": "5000000",
        "amountSpent": "1200000",
        "percentage": 24.0
      }
    ]
  }
}
```

### 7.2 Thiết lập ngân sách (Set Budget)

Dùng để tạo mới hoặc cập nhật giới hạn chi tiêu.

- Method: `POST`
- URL: `/budgets`

#### Request Body

```json
{
  "categoryId": "uuid",
  "amountLimit": 2000000,
  "month": 4,
  "year": 2026
}
```

---

## 8. Dashboard & Analytics APIs

- Prefix: `/dashboard`

### 8.1 Thống kê tổng quan (Statistics)

- Method: `GET`
- URL: `/dashboard/statistics`
- Query Params: `month`, `year`

#### Success Response

```json
{
  "status": "success",
  "data": {
    "totalIncome": "15000000",
    "totalExpense": "8000000",
    "balance": "7000000"
  }
}
```

### 8.2 Dữ liệu biểu đồ (Chart Data)

- Method: `GET`
- URL: `/dashboard/chart`
- Query Params:
  - `type`: `expense_by_category` hoặc `income_vs_expense`
  - `month`, `year`

---

## 9. Assistant (AI) APIs

### 9.1 AI Roast

AI phân tích tình hình chi tiêu và đưa ra nhận xét (Roast).

- Method: `GET`
- URL: `/assistant/roast`

---

## 10. Hỗ Trợ Thêm

Nếu team cần, Backend có thể xuất bộ API này thành **Postman Collection (JSON)** để import và test nhanh.
