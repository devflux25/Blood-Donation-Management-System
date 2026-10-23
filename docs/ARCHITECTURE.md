# Technical Architecture & API Documentation — BDMS

## 1. Overview
The **Blood Donation Management System (BDMS)** is an enterprise healthcare management system connecting voluntary donors, cold storage inventory logistics, and emergency hospital surgical demands.

## 2. Technology Architecture
- **Frontend**: Single Page Application built with React 18, Vite, TypeScript, Tailwind CSS, Recharts, and Lucide React. Centralized Axios client handles JWT token injection and automatic 401 redirection.
- **Backend**: High-performance RESTful API built with Python, FastAPI, and SQLAlchemy ORM.
- **Database**: Relational database running on MySQL Community Server 8.0, maintaining strict ACID transactional consistency during blood allocations.

## 3. Database Integrity & Constraints
1. **FIFO / Earliest Expiry Allocation**: When blood is requested, MySQL locks available inventory units (`FOR UPDATE`) and prioritizes batches with the closest expiration date to eliminate wastage.
2. **Double-Issue Prevention**: Blood issue allocations map each individual batch to `blood_issue_items` under a unique constraint. A single physical blood unit cannot be double-issued to two hospitals.
3. **Safe Deferral Calculations**: Donors who have donated within the minimum gap period (default 90 days) are flagged by software rule as deferred.
4. **Non-Negative Constraints**: Check constraints (`chk_units_requested_positive`, `chk_units_fulfilled_valid`) prevent negative stock or over-issuing.

## 4. RESTful API Endpoints Summary

| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `GET` | `/api/health` | Service uptime health check | Public |
| `GET` | `/api/health/db` | Live MySQL connection ping | Public |
| `POST` | `/api/auth/login` | Staff / Admin JWT login | Public |
| `GET` | `/api/auth/me` | Current authenticated profile | Staff / Admin |
| `GET` | `/api/dashboard/stats` | KPI counters, chart series & recent activity | Staff / Admin |
| `GET` | `/api/donors` | Paginated and filtered donor list | Staff / Admin |
| `POST` | `/api/donors` | Voluntary donor registration | Staff / Admin |
| `GET` | `/api/donations` | Donation history | Staff / Admin |
| `POST` | `/api/donations` | Log donation with vitals & screening | Staff / Admin |
| `GET` | `/api/inventory` | Real-time cold storage inventory | Staff / Admin |
| `GET` | `/api/inventory/summary` | Low stock alerts grouped by blood group | Staff / Admin |
| `GET` | `/api/requests` | Hospital emergency/scheduled orders | Staff / Admin |
| `POST` | `/api/requests` | Create hospital blood request | Staff / Admin |
| `POST` | `/api/issues` | ACID transactional blood issuing | Staff / Admin |
| `GET` | `/api/events` | Mobilization drives and venues | Staff / Admin |
| `POST` | `/api/events` | Schedule new donation drive | Staff / Admin |
| `POST` | `/api/events/register` | Pre-register donor for an event | Staff / Admin |
| `GET` | `/api/hospitals` | Partner medical institutions list | Staff / Admin |
| `POST` | `/api/hospitals` | Register new hospital | Staff / Admin |
| `GET` | `/api/reports/*` | Statistical breakdowns and CSV data | Staff / Admin |
| `GET` | `/api/users` | List system users | Admin Only |
| `POST` | `/api/users` | Provision new user account | Admin Only |
| `GET` | `/api/settings` | Operational system settings | Staff / Admin |
| `PUT` | `/api/settings/{key}` | Update configuration threshold | Admin Only |
