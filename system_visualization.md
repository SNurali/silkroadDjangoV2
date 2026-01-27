# SilkRoad System Visualization

This document provides a comprehensive visual guide to the SilkRoad platform's architecture, navigation, and logic.

## 1. Entity-Relationship Diagram (Database)

The following diagram shows how the core enterprise entities interact within the system.

```mermaid
erDiagram
    USER ||--o| PROFILE : "has"
    PROFILE ||--o| FOREIGN-DATA : "contains if foreigner"
    USER ||--o{ BOOKING : "places"
    USER ||--o{ TICKET-SALE : "purchases"
    VENDOR ||--o{ VENDOR-SERVICE : "offers"
    VENDOR-SERVICE ||--o{ SERVICE-TICKET : "defines"
    SERVICE-TICKET ||--o{ TICKET-SALE : "item in"
    BOOKING ||--o{ BOOKING-HISTORY : "tracks"
    HOTEL ||--o{ BOOKING : "receives"
    HOTEL ||--o{ ROOM-TYPE : "has"
    ROOM-TYPE ||--o{ BOOKING : "scoped to"
    SYSTEM-CONFIG ||--o{ CURRENCY-RATE : "references"
    BOOKING }|..|| CURRENCY-RATE : "priced in"
    TICKET-SALE }|..|| CURRENCY-RATE : "priced in"

    USER {
        string email
        string role
        bool is_phone_verified
    }
    FOREIGN-DATA {
        date entry_date
        int days_left
        date visa_expiry
    }
    BOOKING {
        date check_in
        date check_out
        string status
        string emehmon_id
    }
    VENDOR {
        string inn
        string company_name
        json bank_details
    }
```

## 2. Platform Site Map (Navigation Hierarchy)

```mermaid
graph TD
    Home[<b>Home Page</b><br/>Search, Events, Highlights] --> Search[<b>Search Results</b><br/>Hotels, Tours, Activities]
    Search --> HotelDetail[<b>Hotel Details</b><br/>Rooms, Gallery, Map]
    Search --> ServiceDetail[<b>Service Details</b><br/>Description, Tickets]
    
    Home --> UserProfile[<b>User Profile</b>]
    UserProfile --> MyBookings[<b>My Bookings</b><br/>Status, Vouchers, e-mehmon]
    UserProfile --> ForeignWidget[<b>Stay Info</b><br/>Foreigner Dashboard]
    
    Home --> VendorPortal[<b>Vendor Portal</b>]
    VendorPortal --> VendorDash[<b>Dashboard</b><br/>Sales, Analytics]
    VendorDash --> MyServices[<b>My Services</b><br/>Management, Pricing]
    VendorDash --> VendorSettings[<b>Company Settings</b><br/>Bank, Legal]
    
    Home --> Content[<b>Content Hub</b>]
    Content --> News[News & Updates]
    Content --> Events[Events Calendar]
    
    Admin[<b>Admin Panel</b>] --> SystemConfig[Global Config & Maintenance]
    Admin --> Moderation[Vendor/Service Moderation]
```

## 3. Core Business Logic (Booking Workflow)

```mermaid
sequenceDiagram
    participant U as User
    participant SR as SilkRoad Platform
    participant EM as e-mehmon (Gov)
    participant V as Hotel/Vendor

    U->>SR: Search & Select Dates
    SR->>EM: Check Real-time Availability
    EM-->>SR: Valid Rooms/Prices
    U->>SR: Click Book (Auth Check)
    SR->>SR: Create 'NEW' Booking Entry
    SR->>EM: Notify e-mehmon System
    EM->>V: Push notification to Admin Portal
    V-->>EM: Confirm/Reject
    EM-->>SR: Status Update (Webhook)
    SR->>U: Notify via Dashboard/Push
    SR->>SR: Log Status History
    U->>SR: Proceed to Payment (if needed)
```

## 4. Currency Logic (Enterprise Config)

```mermaid
flowchart LR
    API[Central Bank API] --> CR[CurrencyRates Table]
    CR --> Logic{Price Calculation}
    Logic -->|Local User| UZS[Display in UZS]
    Logic -->|Foreign User| USD[Display in USD Ref]
    UZS --- USD
    Config[SystemConfig] -->|Maintenance ON| Block[Show Maintenance Screen]
```
