# Legacy vs New SilkRoad Audit

## Overview
Comparing legacy **Laravel/PHP** project (`SilkRoadPHP`) with **Django/React** project (`silkroadDjangoV2`).

## Feature Matrix

| Feature | Legacy (Laravel) | New (Django) | Status |
| :--- | :--- | :--- | :--- |
| **Authentication** | `UserController`, `LoginRequest` | `accounts` app | ✅ **Integrated** |
| **Hotels** | `HotelsController` (Implied) | `hotels` app | ✅ **Integrated** |
| **Flights** | `WelcomeController`, `StoreTicketRequest` | `flights` app | ✅ **Integrated** |
| **Taxis/Cabs** | *Not found in file list but requested by user* | `cabs` app | ✅ **New (Just Added)** |
| **Vendors/Agents** | `Agent/*` Controllers | `vendors` app | ✅ **Integrated** |
| **Locations/Sights** | `ServicesController`? | `locations` app | ✅ **Integrated** |
| **Blog** | `resources/views/blog/` | **Creating Now** | ❌ **Missing** |
| **Audit/Logs** | `AuditController` | N/A | ⚠️ **Low Priority** |
| **Notifications** | `NotificationsController` | `notifications` app | ✅ **Integrated** |

## Missing Files & Integration Plan
The primary missing user-facing feature is the **Blog**. The legacy site had `blog/detail.blade.php`, implying a content section.

### Next Steps
1. Create `blog` app in Django.
2. Define `Post` model.
3. Expose API.
4. Connect Frontend `Blog` page.
