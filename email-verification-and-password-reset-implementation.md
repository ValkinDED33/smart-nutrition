# Email Verification and Password Reset Implementation

## Overview
This document outlines the API endpoints and database schema required for implementing email verification and password reset functionalities in the Smart Nutrition application.

## API Endpoints

### 1. Email Verification
- **Endpoint:** `POST /api/auth/verify-email`
- **Description:** Sends a verification email to the user with a verification link.
- **Request Body:**
    - `email` (string): The email of the user to verify.
- **Response:**
    - `status` (string): Success or error message.
    - `message` (string): Additional information.

### 2. Verify Email Link
- **Endpoint:** `GET /api/auth/confirm-email?token=verification_token`
- **Description:** Confirms the user's email using the token received in the email.
- **Query Parameters:**
    - `token` (string): The verification token.
- **Response:**
    - `status` (string): Success or error message.
    - `message` (string): Additional information.

### 3. Request Password Reset
- **Endpoint:** `POST /api/auth/request-password-reset`
- **Description:** Sends a password reset email to the user.
- **Request Body:**
    - `email` (string): The email of the user who requested the password reset.
- **Response:**
    - `status` (string): Success or error message.
    - `message` (string): Additional information.

### 4. Reset Password
- **Endpoint:** `POST /api/auth/reset-password`
- **Description:** Resets the user's password.
- **Request Body:**
    - `token` (string): The token received in the reset password email.
    - `newPassword` (string): The new password for the user.
- **Response:**
    - `status` (string): Success or error message.
    - `message` (string): Additional information.

## Database Schema

### Users Table
| Column Name      | Data Type      | Description                          |
|------------------|----------------|--------------------------------------|
| id               | SERIAL         | Primary key                          |
| email            | VARCHAR(255)   | User's email address                 |
| password_hash    | VARCHAR(255)   | Hashed user password                 |
| is_verified      | BOOLEAN        | Email verification status            |
| verification_token | VARCHAR(255) | Token sent for email verification    |
| created_at       | TIMESTAMP      | Record creation timestamp            |
| updated_at       | TIMESTAMP      | Record last update timestamp         |

### Password Resets Table
| Column Name      | Data Type      | Description                          |
|------------------|----------------|--------------------------------------|
| id               | SERIAL         | Primary key                          |
| user_id          | INTEGER        | Foreign key referencing Users table  |
| reset_token      | VARCHAR(255)   | Token sent for password reset        |
| created_at       | TIMESTAMP      | Record creation timestamp            |
| expires_at       | TIMESTAMP      | Expiration time of the reset token   |  

## Conclusion
Implementing the above API endpoints and database schema can facilitate email verification and password reset functionalities within the Smart Nutrition application.