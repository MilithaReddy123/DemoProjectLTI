# Frontend Documentation - Employee Cafeteria Management System

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Configuration Files](#configuration-files)
5. [Application Architecture](#application-architecture)
6. [Routing System](#routing-system)
7. [Components](#components)
8. [Services](#services)
9. [Data Models](#data-models)
10. [Styling & UI](#styling--ui)
11. [Form Validations](#form-validations)
12. [Build & Development](#build--development)
13. [Features](#features)
14. [Code Patterns](#code-patterns)

---

## Overview

This is an **Employee Cafeteria Management System** built with **Angular 15**, designed to manage cafeteria member registrations and user profiles. The application provides a complete CRUD (Create, Read, Update, Delete) interface for managing user information with comprehensive form validations and a modern, responsive UI powered by PrimeNG.

### Application Purpose
- User authentication (Login/Register)
- Member management (Add, View, Edit, Delete)
- Comprehensive user profile information collection
- Responsive and user-friendly interface
- Real-time form validation

---

## Technology Stack

### Core Framework
- **Angular**: v15.2.0
- **TypeScript**: v4.9.4
- **RxJS**: v7.8.0
- **Zone.js**: v0.12.0

### UI Framework & Components
- **PrimeNG**: v13.3.0 - Rich UI component library
- **PrimeIcons**: v5.0.0 - Icon library
- **PrimeFlex**: v3.3.1 - CSS utility library
- **Angular CDK**: v15.2.9 - Component Development Kit

### Additional Libraries
- **@angular/animations**: v15.2.0 - Animation support
- **@angular/forms**: v15.2.0 - Reactive and Template-driven forms
- **@angular/router**: v15.2.0 - Client-side routing
- **@angular/common/http**: v15.2.0 - HTTP client for API communication

### Development Tools
- **Angular CLI**: v15.2.9
- **Jasmine**: v4.5.0 - Testing framework
- **Karma**: v6.4.0 - Test runner
- **TypeScript Compiler**: v4.9.4

---

## Project Structure

```
src/
├── app/
│   ├── models/
│   │   └── user.model.ts              # User data interface
│   ├── services/
│   │   └── user.service.ts            # HTTP service for user operations
│   ├── pages/
│   │   ├── login/
│   │   │   ├── login.component.ts     # Login page component
│   │   │   └── login.component.html   # Login page template
│   │   ├── register/
│   │   │   ├── register.component.ts  # Registration page component
│   │   │   └── register.component.html # Registration page template
│   │   └── home/
│   │       ├── home.component.ts      # Home/Dashboard component
│   │       └── home.component.html    # Home page template
│   ├── shared/
│   │   └── user-form/
│   │       ├── user-form.component.ts # Reusable user form component
│   │       └── user-form.component.html # User form template
│   ├── app-routing.module.ts          # Application routing configuration
│   ├── app.module.ts                  # Root module
│   ├── app.component.ts               # Root component
│   ├── app.component.html             # Root template
│   └── app.component.spec.ts          # Root component tests
├── assets/                            # Static assets
├── index.html                         # Main HTML file
├── main.ts                            # Application bootstrap file
└── styles.css                         # Global styles

Configuration Files (Root):
├── angular.json                       # Angular CLI configuration
├── tsconfig.json                      # TypeScript configuration
├── tsconfig.app.json                  # App-specific TypeScript config
├── tsconfig.spec.json                 # Test-specific TypeScript config
├── package.json                       # Dependencies and scripts
└── .editorconfig                      # Editor configuration
```

---

## Configuration Files

### 1. angular.json
**Purpose**: Angular CLI workspace configuration file

**Key Configurations**:
- **Project Name**: `demoProject`
- **Output Path**: `dist/demo-project`
- **Entry Point**: `src/main.ts`
- **Index File**: `src/index.html`
- **Assets**: `src/favicon.ico`, `src/assets`
- **Global Styles**: `src/styles.css`
- **Dev Server Port**: Default (4200)

**Build Configurations**:
- **Production**:
  - Output hashing enabled
  - Budget limits: Initial: 500kb (warning), 1mb (error)
  - Component styles: 2kb (warning), 4kb (error)
  
- **Development**:
  - Source maps enabled
  - No optimization
  - Vendor chunk enabled
  - Named chunks for debugging

### 2. tsconfig.json
**Purpose**: TypeScript compiler configuration

**Key Settings**:
- **Target**: ES2022
- **Module**: ES2022
- **Strict Mode**: Enabled
- **Experimental Decorators**: Enabled (for Angular decorators)
- **Module Resolution**: Node
- **Libraries**: ES2022, DOM

**Angular Compiler Options**:
- Strict injection parameters
- Strict input access modifiers
- Strict templates

### 3. package.json
**Purpose**: Project metadata and dependencies

**Available Scripts**:
```bash
npm start          # Start development server
npm run build      # Production build
npm run watch      # Watch mode for development
npm test           # Run unit tests
```

---

## Application Architecture

### Module Structure

#### AppModule (Root Module)
**Location**: `src/app/app.module.ts`

**Imported Modules**:
1. **Angular Core Modules**:
   - `BrowserModule` - Browser-specific services
   - `BrowserAnimationsModule` - Animation support
   - `HttpClientModule` - HTTP client for API calls
   - `FormsModule` - Template-driven forms
   - `ReactiveFormsModule` - Reactive forms
   - `AppRoutingModule` - Application routing

2. **PrimeNG UI Modules**:
   - `InputTextModule` - Text input fields
   - `PasswordModule` - Password input with toggle
   - `ButtonModule` - Styled buttons
   - `CardModule` - Card containers
   - `TableModule` - Data tables with sorting/filtering
   - `DialogModule` - Modal dialogs
   - `DropdownModule` - Dropdown selects
   - `RadioButtonModule` - Radio button groups
   - `CheckboxModule` - Checkbox groups
   - `MultiSelectModule` - Multi-select dropdowns
   - `InputTextareaModule` - Textarea fields
   - `ToolbarModule` - Toolbar components
   - `TooltipModule` - Hover tooltips
   - `ChipModule` - Chip/tag components
   - `TagModule` - Tag components
   - `MessageModule` - Message/alert boxes

**Declared Components**:
- `AppComponent` - Root component
- `LoginComponent` - Login page
- `RegisterComponent` - Registration page
- `HomeComponent` - Home/dashboard page
- `UserFormComponent` - Shared user form

### Bootstrap Process

**Entry Point**: `src/main.ts`

```typescript
platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
```

**Flow**:
1. `main.ts` bootstraps `AppModule`
2. `AppModule` declares and configures all components
3. Angular loads `AppComponent` (root component)
4. `AppComponent` renders `<router-outlet>` for routing
5. Router displays appropriate component based on URL

---

## Routing System

**Location**: `src/app/app-routing.module.ts`

### Route Configuration

| Path | Component | Description |
|------|-----------|-------------|
| `''` (root) | Redirects to `/login` | Default route redirects to login |
| `/login` | `LoginComponent` | User login page |
| `/register` | `RegisterComponent` | New user registration page |
| `/home` | `HomeComponent` | Dashboard with user management |
| `**` (wildcard) | Redirects to `/login` | Catch-all for undefined routes |

### Routing Module Setup
- Uses `RouterModule.forRoot(routes)` for root-level routing
- Exports `RouterModule` for use in `AppModule`
- No route guards implemented (authentication is handled at component level)

### Navigation Flow
```
Application Start → Login (/login)
                    ↓
                    ├→ Register (/register) → Success → Login
                    │
                    └→ Login Success → Home (/home)
                                       ↓
                                       User Management (CRUD)
```

---

## Components

### 1. AppComponent (Root Component)

**Location**: `src/app/app.component.ts`, `app.component.html`

**Purpose**: Root application container

**Template**:
```html
<router-outlet></router-outlet>
```

**Functionality**:
- Simple container that renders routed components
- No additional logic or state
- Acts as the application shell

---

### 2. LoginComponent

**Location**: `src/app/pages/login/`

**Purpose**: User authentication page

#### Component Class (`login.component.ts`)

**Properties**:
- `loginForm: FormGroup` - Reactive form for login
- `loading: boolean` - Loading state during authentication
- `errorMessage: string` - Error message display

**Form Structure**:
```typescript
{
  username: string,     // Required, 4-20 chars, alphanumeric with ._-
  password: string      // Required, min 8 chars, must include upper, lower, digit, special char
}
```

**Validations**:
- **Username**:
  - Required
  - Pattern: `/^[a-zA-Z0-9._-]{4,20}$/`
  - Allows letters, numbers, dot, underscore, hyphen
  - Length: 4-20 characters

- **Password**:
  - Required
  - Minimum length: 8 characters
  - Pattern: `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/`
  - Must contain:
    - At least one lowercase letter
    - At least one uppercase letter
    - At least one digit
    - At least one special character (@$!%*?&)

**Methods**:
- `onSubmit()`: Validates and submits login credentials
  - Marks all fields as touched if invalid
  - Sets loading state
  - Calls `userService.login()`
  - On success: navigates to `/home`
  - On error: displays error message

#### Template (`login.component.html`)

**UI Structure**:
- Centered card layout (420px width)
- Header with "Employee Cafeteria" title and icon
- Username input with icon
- Password input with toggle mask
- Error message display
- Submit button with loading indicator
- Link to registration page

**Styling Features**:
- Full viewport height centering
- Gray background (#f8f9fa)
- Large input fields (p-inputtext-lg)
- Inline validation error messages
- Icon-prefixed inputs
- Responsive design

---

### 3. RegisterComponent

**Location**: `src/app/pages/register/`

**Purpose**: New user registration page

#### Component Class (`register.component.ts`)

**Properties**:
- `registerForm: FormGroup` - Reactive form for registration
- `loading: boolean` - Loading state
- `errorMessage: string` - Error message
- `successMessage: string` - Success message

**Form Structure**:
```typescript
{
  name: string,
  username: string,
  email: string,
  password: string,
  confirmPassword: string
}
```

**Custom Validators**:

1. **Email Validator** (`emailValidator`):
   ```typescript
   - Checks basic email format: /^[^\s@]+@[^\s@]+$/
   - Validates TLD (Top Level Domain): /\.[a-zA-Z]{2,}$/
   - Returns: { invalidEmail: true } or { invalidTld: true } or null
   ```

2. **Password Match Validator** (`passwordsMatchValidator`):
   ```typescript
   - Compares password and confirmPassword fields
   - Returns: { mismatch: true } or null
   - Applied at form group level
   ```

**Validations**:
- **Name**:
  - Required
  - Minimum length: 2 characters
  - Pattern: `/^[a-zA-Z\s]+$/` (only letters and spaces)
  - No numbers allowed

- **Username**:
  - Required
  - Pattern: `/^[a-zA-Z0-9_@]{4,20}$/`
  - Length: 4-20 characters
  - Allows: letters, numbers, underscore, @ symbol

- **Email**:
  - Required
  - Custom email validator
  - Must have valid domain extension (e.g., .com, .org, .net)

- **Password**:
  - Required
  - Minimum length: 8 characters
  - Pattern: `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/`
  - Must include uppercase, lowercase, digit, and special character

- **Confirm Password**:
  - Required
  - Must match password field

**Methods**:
- `onSubmit()`:
  - Validates form
  - Extracts name, username, email, password
  - Calls `userService.register()`
  - On success: Shows success message, redirects to login after 2 seconds
  - On error: Displays error message

- `goToLogin()`: Navigates to login page

#### Template (`register.component.html`)

**UI Structure**:
- Centered card layout (800px width - wider than login)
- Header with "Create Account" title
- Four input fields (name, username, email, password, confirmPassword)
- Detailed validation error messages
- Success/error message display
- Submit button with loading state
- Link to login page

**Validation Message Examples**:
- Name errors: "Name is required", "Name must be at least 2 characters long", "Name can only contain letters and spaces (numbers not allowed)"
- Email errors: "Email is required", "Please enter a valid email address", "Email must have a valid domain extension (e.g., .com, .org, .net)"
- Password errors: "Password is required", "Password must be at least 8 characters long", "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)"
- Confirm password: "Confirm password is required", "Passwords do not match. Please re-enter the same password"

---

### 4. HomeComponent (Dashboard)

**Location**: `src/app/pages/home/`

**Purpose**: Main dashboard for viewing and managing cafeteria members

#### Component Class (`home.component.ts`)

**Properties**:
- `@ViewChild('dt') dt: Table` - Reference to PrimeNG table
- `users: User[]` - Array of all users
- `displayAddDialog: boolean` - Controls add user dialog visibility
- `displayEditDialog: boolean` - Controls edit user dialog visibility
- `selectedUser: User | null` - Currently selected user for editing
- `loading: boolean` - Loading state for data fetch

**Lifecycle Hooks**:
- `ngOnInit()`: Calls `loadUsers()` on component initialization

**Methods**:

1. **loadUsers()**:
   - Sets loading state
   - Calls `userService.getUsers()`
   - Populates `users` array
   - Handles errors with console logging

2. **openAddUser()**:
   - Clears `selectedUser`
   - Opens add dialog

3. **openEditUser(user: User)**:
   - Fetches complete user details by ID
   - Sets `selectedUser`
   - Opens edit dialog
   - Fetches full data to ensure all fields are available

4. **onUserSaved()**:
   - Closes both dialogs
   - Clears `selectedUser`
   - Reloads user list

5. **onDialogHide()**:
   - Closes dialogs
   - Clears selected user

6. **deleteUser(user: User)**:
   - Shows native confirm dialog
   - If confirmed, calls `userService.deleteUser()`
   - Reloads user list on success

7. **Utility Methods**:
   - `hasValue(value: any): boolean` - Checks if value is not null/undefined/empty
   - `formatDate(date): string` - Formats date with time (e.g., "Dec 23, 2025, 10:30 AM")
   - `formatDateOnly(date): string` - Formats date only (e.g., "Dec 23, 2025")
   - `formatArray(arr): string[]` - Safely returns array or empty array

#### Template (`home.component.html`)

**UI Structure**:

1. **Header Section**:
   - Title: "Cafeteria Members"
   - Subtitle: "Manage member registrations"
   - "Add Member" button (green success button)

2. **Data Table** (PrimeNG Table):
   - **Features**:
     - Pagination (5, 10, 25, 50 rows per page)
     - Global search/filter
     - Column sorting
     - Row hover effect
     - Responsive layout
     - Loading indicator

   - **Columns** (13 total):
     1. Email (12% width, sortable)
     2. Username (8% width, sortable, displayed as tag)
     3. Mobile (7% width, with phone icon)
     4. Credit Card (8% width, with credit card icon, monospace font)
     5. State (7% width, sortable)
     6. City (7% width, sortable)
     7. Gender (6% width, colored tags: Male=green, Female=orange, Other=blue)
     8. Hobbies (8% width, displayed as chips)
     9. Tech Interests (8% width, displayed as chips)
     10. Address (10% width, with map icon, shows tooltip if long)
     11. DOB (7% width, sortable, with calendar icon)
     12. Created (7% width, sortable, with clock icon)
     13. Actions (5% width, edit & delete buttons)

   - **Table Caption**:
     - "Member Directory" title
     - Search input with magnifying glass icon

   - **Empty State**:
     - Inbox icon
     - "No members found" message
     - "Add Member" button

3. **Action Buttons**:
   - **Edit Button**: 
     - Rounded, text-style, blue info color
     - Pencil icon
     - Tooltip: "Edit"
   
   - **Delete Button**:
     - Rounded, text-style, red danger color
     - Trash icon
     - Tooltip: "Delete"

4. **Dialogs**:

   **Add User Dialog**:
   - Modal overlay
   - Width: 800px
   - Maximizable
   - Header: "Add New Member"
   - Contains `<app-user-form>` with `[user]="null"`

   **Edit User Dialog**:
   - Modal overlay
   - Width: 800px
   - Maximizable
   - Header: "Edit Member"
   - Contains `<app-user-form>` with `[user]="selectedUser"`

**Table Features**:
- **Global Filter Fields**: email, username, mobile, city, state, gender, address
- **Responsive**: Horizontal scroll on smaller screens
- **Data Key**: Uses `id` field for tracking
- **Current Page Report**: "Showing {first} to {last} of {totalRecords} members"

**Styling Details**:
- Email addresses show tooltip if longer than 30 characters
- Credit card numbers in monospace font with letter spacing
- Gender displayed with colored tags
- Hobbies and tech interests shown as chip arrays
- Address shows tooltip if longer than 40 characters
- All date fields formatted with appropriate icons
- Empty/null values display as "-" with gray color

---

### 5. UserFormComponent (Shared Component)

**Location**: `src/app/shared/user-form/`

**Purpose**: Reusable form for adding and editing user profiles

#### Component Class (`user-form.component.ts`)

**Input/Output**:
- `@Input() user: User | null` - User data for edit mode
- `@Output() saved: EventEmitter<void>` - Emits when form saved successfully
- `@Output() cancelled: EventEmitter<void>` - Emits when form cancelled

**Properties**:
- `userForm: FormGroup` - Reactive form
- `submitting: boolean` - Submit state
- `states: Array` - State dropdown options (Telangana, Andhra Pradesh)
- `cities: Array` - Dynamic city options based on selected state
- `allCities: Array` - Master list of cities by state
- `hobbiesOptions: Array` - Checkbox options (Reading, Music, Sports)
- `techOptions: Array` - Multi-select options (Angular, React, Node.js, Java)

**Form Structure**:
```typescript
{
  name: string,              // Required, min 2 chars
  email: string,             // Required, valid email
  mobile: string,            // Required, 10 digits
  creditCard: string,        // Required, 16 digits
  state: string,             // Required, dropdown
  city: string,              // Required, dropdown (dependent on state)
  gender: string,            // Required, radio button (Male/Female/Other)
  hobbies: string[],         // Required, checkboxes
  techInterests: string[],   // Required, multi-select
  address: string,           // Optional, textarea
  username: string,          // Required, 4-20 chars (disabled in edit mode)
  password: string,          // Required for add, not required for edit
  confirmPassword: string,   // Required for add, not required for edit
  dob: Date                  // Required, date picker
}
```

**Dropdown/Select Options**:

1. **States**:
   - Telangana
   - Andhra Pradesh

2. **Cities** (by State):
   - **Telangana**: Hyderabad, Warangal, Nizamabad, Karimnagar
   - **Andhra Pradesh**: Vijayawada, Visakhapatnam, Guntur, Tirupati

3. **Hobbies** (Checkboxes):
   - Reading
   - Music
   - Sports

4. **Tech Interests** (Multi-select):
   - Angular
   - React
   - Node.js
   - Java

**Lifecycle Hooks**:
- `ngOnInit()`: Builds form
- `ngOnChanges(changes)`: Patches form when user input changes

**Methods**:

1. **buildForm()**:
   - Creates form group with all validators
   - Sets up state change listener to update cities
   - Calls `patchForm()`

2. **patchForm()**:
   - If editing (`user` is not null):
     - Loads cities for user's state
     - Formats DOB for date input (ISO format)
     - Patches all form values including credit card
     - Clears password validators (not required for edit)
   - If adding (`user` is null):
     - Resets form with default values (gender: 'Male', empty arrays)

3. **passwordsMatchValidator(group: FormGroup)**:
   - Custom validator at form group level
   - Compares password and confirmPassword
   - Returns `{ mismatch: true }` or `null`
   - Handles empty values (returns null)

4. **onStateChange(state: string)**:
   - Finds cities for selected state
   - Updates cities array
   - Clears city selection if current city not in new state's cities
   - Prevents data inconsistency

5. **onCancel()**:
   - Emits `cancelled` event
   - Parent component closes dialog

6. **onSubmit()**:
   - Validates form (marks all fields as touched if invalid)
   - Sets submitting state
   - Prepares userData:
     - **Edit mode**: Excludes password/username, includes all other fields
     - **Add mode**: Includes all fields including password
   - Calls appropriate service method:
     - `userService.updateUser(id, userData)` for edit
     - `userService.addUser(userData)` for add
   - On success: Emits `saved` event
   - On error: Shows alert with error message

**Computed Properties**:
- `get f()`: Returns form controls for easy template access
- `get isEditMode()`: Returns true if user ID exists

**Form Validations**:
- **Name**: Required, min 2 characters
- **Email**: Required, valid email format
- **Mobile**: Required, exactly 10 digits (pattern: `/^\d{10}$/`)
- **Credit Card**: Required, exactly 16 digits (pattern: `/^\d{16}$/`)
- **State**: Required
- **City**: Required
- **Gender**: Required (default: 'Male')
- **Hobbies**: Required (at least one)
- **Tech Interests**: Required (at least one)
- **Address**: Optional
- **Username**: Required, 4-20 chars, alphanumeric with .-_ (disabled in edit mode)
- **Password**: Required for add (8+ chars with upper, lower, digit, special), not required for edit
- **Confirm Password**: Required for add, must match password
- **DOB**: Required

#### Template (`user-form.component.html`)

**Layout**: PrimeFlex grid system (responsive columns)

**Form Fields** (in order):

1. **Name** (col-12 md-6):
   - Text input
   - Placeholder: "Full name"
   - Error: "Name is required (min 2 characters)"

2. **Email** (col-12 md-6):
   - Email input
   - Placeholder: "email@example.com"
   - Error: "Valid email is required"

3. **Mobile** (col-12 md-6):
   - Text input
   - Placeholder: "10-digit number"
   - Error: "Valid 10-digit mobile number required"

4. **Credit Card** (col-12 md-6):
   - Text input
   - Placeholder: "16-digit number"
   - Max length: 16
   - Error: "Valid 16-digit card number required"

5. **State** (col-12 md-6):
   - Dropdown
   - Placeholder: "Select state"
   - Clear button enabled
   - Error: "State is required"

6. **City** (col-12 md-6):
   - Dropdown (disabled until state selected)
   - Placeholder: "Select city"
   - Clear button enabled
   - Options populated based on state
   - Error: "City is required"

7. **Gender** (col-12):
   - Radio buttons (Male, Female, Other)
   - Inline layout
   - Error: Validation not shown (always has default value)

8. **Hobbies** (col-12):
   - Checkboxes (Reading, Music, Sports)
   - Inline layout
   - Error: "Select at least one hobby"

9. **Tech Interests** (col-12):
   - Multi-select dropdown
   - Placeholder: "Select technologies"
   - No header
   - Error: "Select at least one technology"

10. **Address** (col-12):
    - Textarea (3 rows)
    - Placeholder: "Full address"
    - Optional field

11. **Username** (col-12 md-6):
    - Text input
    - Placeholder: "4-20 characters"
    - **Disabled in edit mode** (username cannot be changed)
    - Error: "Username required (4-20 chars, alphanumeric)"

12. **Date of Birth** (col-12 md-6):
    - Date input (HTML5 date picker)
    - Error: "Date of birth is required"

13. **Password** (col-12 md-6) - **Add Mode Only**:
    - Password input with strength meter
    - Toggle mask enabled
    - Placeholder: "Min 8 characters"
    - Error: "Min 8 chars with upper, lower, number, special char"

14. **Confirm Password** (col-12 md-6) - **Add Mode Only**:
    - Password input without strength meter
    - Toggle mask enabled
    - Placeholder: "Re-enter password"
    - Error: "Passwords must match"

**Action Buttons**:
- **Cancel**: Text button, gray, closes dialog
- **Save/Update**: 
  - Label: "Save" (add mode) or "Update" (edit mode)
  - Icon: Save icon (add mode) or Check icon (edit mode)
  - Green success button
  - Shows loading spinner when submitting

**Conditional Rendering**:
- Password fields only shown in add mode (`*ngIf="!isEditMode"`)
- Username field disabled in edit mode (`[disabled]="isEditMode"`)

**Form Features**:
- Real-time validation
- Cascading dropdowns (state → city)
- Password strength indicator (add mode)
- Password visibility toggle
- Responsive grid layout
- All required fields marked with red asterisk

---

## Services

### UserService

**Location**: `src/app/services/user.service.ts`

**Purpose**: HTTP service for all user-related API operations

**Injectable**: `providedIn: 'root'` (singleton service)

**Properties**:
- `private baseUrl: string` = `'http://localhost:3000/api'` - Backend API base URL

**Constructor**:
- Injects `HttpClient` for making HTTP requests

**Methods**:

#### 1. login(credentials)
```typescript
login(credentials: { username: string; password: string }): Observable<any>
```
- **HTTP Method**: POST
- **Endpoint**: `/api/login`
- **Purpose**: Authenticate user
- **Payload**: `{ username, password }`
- **Returns**: Observable of authentication response

#### 2. register(credentials)
```typescript
register(credentials: {
  name: string;
  username: string;
  email: string;
  password: string;
}): Observable<any>
```
- **HTTP Method**: POST
- **Endpoint**: `/api/register`
- **Purpose**: Register new user
- **Payload**: `{ name, username, email, password }`
- **Returns**: Observable of registration response

#### 3. getUsers()
```typescript
getUsers(): Observable<User[]>
```
- **HTTP Method**: GET
- **Endpoint**: `/api/users`
- **Purpose**: Fetch all users
- **Returns**: Observable array of User objects

#### 4. getUserById(id)
```typescript
getUserById(id: string): Observable<User>
```
- **HTTP Method**: GET
- **Endpoint**: `/api/users/:id`
- **Purpose**: Fetch single user by ID
- **Parameters**: User ID
- **Returns**: Observable of User object

#### 5. addUser(user)
```typescript
addUser(user: any): Observable<any>
```
- **HTTP Method**: POST
- **Endpoint**: `/api/users`
- **Purpose**: Create new user profile
- **Payload**: Complete user object with all fields
- **Returns**: Observable of created user response

#### 6. updateUser(id, user)
```typescript
updateUser(id: string, user: Partial<User>): Observable<any>
```
- **HTTP Method**: PUT
- **Endpoint**: `/api/users/:id`
- **Purpose**: Update existing user
- **Parameters**: User ID, Partial user data
- **Returns**: Observable of update response

#### 7. deleteUser(id)
```typescript
deleteUser(id: string): Observable<any>
```
- **HTTP Method**: DELETE
- **Endpoint**: `/api/users/:id`
- **Purpose**: Delete user
- **Parameters**: User ID
- **Returns**: Observable of deletion response

**API Communication**:
- All methods return RxJS Observables
- Automatic JSON serialization/deserialization
- Error handling delegated to components
- Base URL configurable for different environments

**Usage Example**:
```typescript
// In component
this.userService.getUsers().subscribe({
  next: (data) => { this.users = data; },
  error: (err) => { console.error(err); }
});
```

---

## Data Models

### User Interface

**Location**: `src/app/models/user.model.ts`

**Purpose**: TypeScript interface defining user data structure

```typescript
export interface User {
  // System Fields
  id?: string;                      // Optional: User ID (generated by backend)
  created_at?: string | Date;       // Optional: Creation timestamp
  updated_at?: string | Date;       // Optional: Last update timestamp
  
  // Required Personal Information
  name: string;                     // Full name
  email: string;                    // Email address
  mobile: string;                   // 10-digit mobile number
  dob: string | Date;               // Date of birth
  
  // Optional Personal Information
  creditCard?: string;              // 16-digit credit card number
  address?: string;                 // Full address
  
  // Location Information
  state: string;                    // State (required)
  city: string;                     // City (required)
  
  // Classification
  gender: string;                   // Male/Female/Other
  hobbies: string[];                // Array of hobbies
  techInterests: string[];          // Array of technology interests
  
  // Authentication
  username: string;                 // Unique username
  password?: string;                // Password (not returned from server)
  confirmPassword?: string;         // Password confirmation (form only)
}
```

**Field Details**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | No | Unique identifier, generated by backend |
| `name` | string | Yes | User's full name (min 2 chars, letters only) |
| `email` | string | Yes | Valid email with domain extension |
| `mobile` | string | Yes | 10-digit phone number |
| `creditCard` | string | No* | 16-digit card number (*required in form) |
| `state` | string | Yes | Selected from dropdown (Telangana/Andhra Pradesh) |
| `city` | string | Yes | Selected from dropdown (dependent on state) |
| `gender` | string | Yes | Male, Female, or Other |
| `hobbies` | string[] | Yes | Array of selected hobbies |
| `techInterests` | string[] | Yes | Array of selected technologies |
| `address` | string | No | Optional full address |
| `username` | string | Yes | Unique username (4-20 chars) |
| `password` | string | No | Required for registration, optional for profile |
| `confirmPassword` | string | No | Form-only field for password verification |
| `dob` | string/Date | Yes | Date of birth |
| `created_at` | string/Date | No | Auto-generated creation timestamp |
| `updated_at` | string/Date | No | Auto-generated update timestamp |

**Usage Context**:
- **Registration**: Requires `name`, `username`, `email`, `password`, `confirmPassword`
- **Profile Creation**: Requires all fields except optional ones
- **Profile Update**: Excludes `username` and `password`
- **Display**: May include `created_at` and `updated_at` timestamps

---

## Styling & UI

### Global Styles

**Location**: `src/styles.css`

**Imports**:
```css
/* PrimeNG Theme */
@import "../node_modules/primeng/resources/themes/saga-blue/theme.css";

/* PrimeNG Core Styles */
@import "../node_modules/primeng/resources/primeng.css";

/* PrimeIcons */
@import "../node_modules/primeicons/primeicons.css";

/* PrimeFlex Utilities */
@import "../node_modules/primeflex/primeflex.css";
```

**Custom Global Styles**:
```css
body {
  margin: 0;
  font-family: var(--font-family);     /* Inherits from PrimeNG theme */
  background-color: #ffffff;
}

.w-full {
  width: 100%;
}
```

### Theme & Design System

**Primary Theme**: Saga Blue (PrimeNG)

**Color Palette**:
- **Primary**: Blue (#007bff)
- **Success**: Green (#28a745) - Used for add buttons, success messages
- **Info**: Light Blue (#17a2b8) - Used for username tags
- **Warning**: Orange (#ffc107) - Used for Female gender tags
- **Danger**: Red (#dc3545) - Used for delete buttons, error messages
- **Secondary**: Gray (#6c757d) - Used for icons, secondary text

**Typography**:
- **Font Family**: System font stack from PrimeNG theme
- **Font Sizes**:
  - Headers: 2-3rem
  - Body: 1rem (default)
  - Small: 0.9rem (timestamps, credit cards)
- **Font Weights**:
  - Normal: 400
  - Bold: 700
  - Semi-bold: 500 (DOB display)

### PrimeNG Components Styling

**Input Components**:
- `.p-inputtext-lg` - Large input fields (login, register)
- Password fields with toggle mask
- Dropdown with clear button
- Multi-select with chips
- Textarea with auto-resize

**Button Variants**:
- `.p-button-success` - Green (Add, Save buttons)
- `.p-button-text` - Text-only (Cancel, navigation links)
- `.p-button-lg` - Large buttons (Login, Register)
- `.p-button-sm` - Small buttons
- `.p-button-rounded` - Circular icon buttons (Edit, Delete)
- `.p-button-info` - Blue info buttons
- `.p-button-danger` - Red danger buttons

**Layout Utilities** (PrimeFlex):
- `.p-fluid` - Full-width form controls
- `.p-formgrid` - Form grid layout
- `.p-grid` - Grid system
- `.p-col-12` - Full width column
- `.p-col-md-6` - Half width on medium+ screens
- `.p-d-flex` - Flexbox display
- `.p-jc-between` - Justify content space-between
- `.p-ai-center` - Align items center
- `.p-mt-{n}`, `.p-mb-{n}`, `.p-mr-{n}`, `.p-ml-{n}` - Margin utilities
- `.p-p-{n}` - Padding utilities

**Card & Container Components**:
- `p-card` - Card container with header/content/footer
- `p-dialog` - Modal dialog
- `p-table` - Advanced data table
- `p-toolbar` - Toolbar component

**Data Display**:
- `p-tag` - Colored tags/badges
- `p-chip` - Chip components
- `p-message` - Message/alert boxes

### Component-Specific Styling

**Login/Register Pages**:
- Centered layout using flexbox
- Full viewport height (`min-height: 100vh`)
- Gray background (`#f8f9fa`)
- White card with shadow
- Padding: 2rem for headers
- Icon sizes: 3rem for main icons

**Home/Dashboard**:
- Padding: 1rem (`.p-p-4`)
- Table padding: 0.75rem per cell
- Icon colors: Gray (`#6c757d`) for most, Blue (`#007bff`) for dates
- Monospace font for credit cards with letter spacing
- Chip gaps: 0.25rem
- Empty state icon: 3rem, light gray (`#dee2e6`)

**Table Styling**:
- Fixed table layout
- Small table variant (`.p-datatable-sm`)
- Row hover effect enabled
- Word wrap enabled for long text
- Vertical align: top
- Column-specific widths (percentages)

**Responsive Design**:
- Mobile-first approach
- Responsive grid columns (`.p-col-12`, `.p-col-md-6`)
- Table horizontal scroll on small screens
- Dialog max-width: 100% on mobile
- Maximizable dialogs for small screens

---

## Form Validations

### Validation Patterns

#### 1. Username Validation
**Patterns**:
- **Login**: `/^[a-zA-Z0-9._-]{4,20}$/`
- **Register**: `/^[a-zA-Z0-9_@]{4,20}$/`
- **User Form**: `/^[a-zA-Z0-9._-]{4,20}$/`

**Rules**:
- Length: 4-20 characters
- Allowed characters: letters, numbers, and special characters (varies by context)
- Case-insensitive

#### 2. Password Validation
**Pattern**: `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/`

**Rules**:
- Minimum length: 8 characters
- Must contain:
  - At least one lowercase letter (a-z)
  - At least one uppercase letter (A-Z)
  - At least one digit (0-9)
  - At least one special character (@, $, !, %, *, ?, &)

**Example Valid Passwords**:
- `Password1!`
- `MyP@ssw0rd`
- `Secure123$`

#### 3. Email Validation
**Register Component - Custom Validator**:
```typescript
- Basic format: /^[^\s@]+@[^\s@]+$/
- TLD validation: /\.[a-zA-Z]{2,}$/
```

**User Form - Standard Angular Validator**:
- Uses `Validators.email`

**Rules**:
- Must have @ symbol
- Must have domain name
- Must have valid TLD (e.g., .com, .org, .net)
- No spaces allowed

#### 4. Name Validation
**Pattern**: `/^[a-zA-Z\s]+$/`

**Rules**:
- Minimum length: 2 characters
- Only letters and spaces allowed
- No numbers or special characters

#### 5. Mobile Number Validation
**Pattern**: `/^\d{10}$/`

**Rules**:
- Exactly 10 digits
- Only numeric characters
- No spaces, dashes, or special characters

#### 6. Credit Card Validation
**Pattern**: `/^\d{16}$/`

**Rules**:
- Exactly 16 digits
- Only numeric characters
- No spaces or dashes

#### 7. State & City Validation
**Rules**:
- Required field
- Must select from dropdown
- City dependent on state selection

**Cascading Logic**:
- Selecting state populates city dropdown
- Changing state clears city if not applicable

### Error Messages

**Comprehensive Error Message Matrix**:

| Field | Condition | Error Message |
|-------|-----------|---------------|
| **Name** | Required | "Name is required" |
| | Min length | "Name must be at least 2 characters long" |
| | Pattern | "Name can only contain letters and spaces (numbers not allowed)" |
| **Username** | Required | "Username is required" |
| | Pattern | "Username must be 4-20 characters (letters, numbers, underscore _ and @ only)" |
| **Email** | Required | "Email is required" |
| | Invalid format | "Please enter a valid email address" |
| | Invalid TLD | "Email must have a valid domain extension (e.g., .com, .org, .net)" |
| **Password** | Required | "Password is required" |
| | Min length | "Password must be at least 8 characters long" |
| | Pattern | "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)" |
| **Confirm Password** | Required | "Confirm password is required" |
| | Mismatch | "Passwords do not match. Please re-enter the same password" |
| **Mobile** | Required | "Mobile is required" |
| | Pattern | "Valid 10-digit mobile number required" |
| **Credit Card** | Required | "Credit card is required" |
| | Pattern | "Valid 16-digit card number required" |
| **State** | Required | "State is required" |
| **City** | Required | "City is required" |
| **Gender** | Required | (Always has default, no error shown) |
| **Hobbies** | Required | "Select at least one hobby" |
| **Tech Interests** | Required | "Select at least one technology" |
| **DOB** | Required | "Date of birth is required" |

### Validation Display Logic

**When Errors Show**:
- After field is touched (user has interacted with it)
- After form submission attempt
- Real-time for some fields (password match)

**Validation Styling**:
- Error messages in red (`.p-error` class)
- Required fields marked with red asterisk
- Invalid fields highlighted (PrimeNG default styling)
- Small font size for error text

**Form-Level Validation**:
- Password match validator applied at form group level
- All fields marked as touched on submit if invalid
- Form submission prevented if validation fails

---

## Build & Development

### NPM Scripts

```json
{
  "start": "ng serve",           // Development server
  "build": "ng build",           // Production build
  "watch": "ng build --watch --configuration development",
  "test": "ng test"              // Unit tests
}
```

### Development Server

**Start Server**:
```bash
npm start
# or
ng serve
```

**Default Configuration**:
- **URL**: `http://localhost:4200`
- **Port**: 4200
- **Auto-reload**: Enabled
- **Source maps**: Enabled
- **Optimization**: Disabled

**Backend API**:
- Expected at: `http://localhost:3000/api`
- Configured in `UserService`

### Production Build

**Build Command**:
```bash
npm run build
# or
ng build --configuration production
```

**Output**:
- **Directory**: `dist/demo-project/`
- **Output hashing**: All files
- **Optimization**: Enabled
- **Source maps**: Disabled

**Build Budgets**:
- Initial bundle: 500kb (warning), 1mb (error)
- Component styles: 2kb (warning), 4kb (error)

### Build Configurations

**Development**:
- Build optimizer: OFF
- Optimization: OFF
- Vendor chunk: Enabled
- Extract licenses: Disabled
- Source maps: Enabled
- Named chunks: Enabled

**Production**:
- Build optimizer: ON
- Optimization: ON
- Vendor chunk: Disabled
- Extract licenses: Enabled
- Source maps: Disabled
- Output hashing: All

### Testing

**Test Framework**: Jasmine + Karma

**Run Tests**:
```bash
npm test
# or
ng test
```

**Test Configuration**:
- **Browser**: Chrome (Headless available)
- **Coverage**: Enabled
- **Watch mode**: Default
- **Test files**: `*.spec.ts`

### TypeScript Compilation

**Compiler Options**:
- **Target**: ES2022
- **Module**: ES2022
- **Strict mode**: Enabled
- **Source maps**: Enabled
- **Declaration**: Disabled

**Strict Checks Enabled**:
- No implicit override
- No property access from index signature
- No implicit returns
- No fallthrough cases in switch

---

## Features

### 1. User Authentication

**Login**:
- Username and password authentication
- Form validation with detailed error messages
- Loading state during authentication
- Error message display for invalid credentials
- Automatic redirect to home page on success
- Link to registration page

**Registration**:
- New user account creation
- Comprehensive form validation
- Custom email validator with TLD check
- Password strength requirements
- Password confirmation matching
- Success message with auto-redirect
- Link to login page

### 2. User Management Dashboard

**View Users**:
- Paginated table with all user data
- 13 columns of information
- Sortable columns (email, username, state, city, dob, created_at)
- Global search across multiple fields
- Responsive table layout
- Empty state with call-to-action

**Add New User**:
- Modal dialog with comprehensive form
- 14 form fields
- Cascading state/city dropdowns
- Multiple input types (text, date, dropdown, multi-select, radio, checkbox)
- Real-time validation
- Password strength indicator
- Success/error handling

**Edit User**:
- Fetch complete user data
- Pre-populate form with existing values
- Disable username field (immutable)
- Password not required for updates
- Preserve all existing data
- Success/error handling

**Delete User**:
- Confirmation dialog
- Immediate table update on success
- Error handling

### 3. Data Display & Formatting

**Rich Table Features**:
- Icons for different data types (phone, email, map, calendar, clock)
- Colored tags for gender
- Chips for arrays (hobbies, tech interests)
- Monospace font for credit cards
- Tooltips for long text
- Formatted dates with different formats
- Null-safe rendering (displays "-" for empty values)

**Interactive Elements**:
- Sortable columns
- Global search filter
- Pagination with configurable rows per page
- Row hover effects
- Action buttons (edit, delete) with tooltips
- Clickable buttons throughout

### 4. Form Features

**Advanced Form Controls**:
- Text inputs with placeholders
- Password fields with visibility toggle
- Password strength meter (registration)
- Dropdowns with clear button
- Cascading dropdowns (state → city)
- Radio buttons for single selection
- Checkboxes for multiple selection
- Multi-select dropdowns
- Date picker
- Textarea for long text

**Validation Features**:
- Real-time validation
- Field-level error messages
- Form-level validation (password match)
- Required field indicators (red asterisk)
- Disabled states (username in edit mode, city before state)
- Custom validators (email, password match)

### 5. UI/UX Features

**Responsive Design**:
- Mobile-friendly layouts
- Responsive grid system
- Scrollable table on small screens
- Maximizable dialogs
- Adaptive column widths

**User Feedback**:
- Loading indicators
- Success messages
- Error messages
- Confirmation dialogs
- Tooltips
- Disabled button states

**Accessibility**:
- Form labels
- Required field indicators
- Error message associations
- Keyboard navigation (PrimeNG default)
- ARIA labels (PrimeNG default)

---

## Code Patterns

### 1. Component Structure

**Standard Component Pattern**:
```typescript
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-example',
  templateUrl: './example.component.html'
})
export class ExampleComponent implements OnInit {
  // Properties
  form: FormGroup;
  loading = false;
  
  // Constructor with dependency injection
  constructor(private fb: FormBuilder) {}
  
  // Lifecycle hooks
  ngOnInit(): void {
    this.buildForm();
  }
  
  // Methods
  private buildForm(): void { }
  onSubmit(): void { }
}
```

### 2. Reactive Forms Pattern

**Form Creation**:
```typescript
this.form = this.fb.group({
  fieldName: ['defaultValue', [Validators.required, Validators.pattern(/regex/)]],
  // ...more fields
}, { validators: this.customValidator });
```

**Form Access in Template**:
```typescript
get f(): any {
  return this.form.controls;
}

// Usage in template: f.fieldName.errors
```

### 3. Service Pattern

**HTTP Service Structure**:
```typescript
@Injectable({ providedIn: 'root' })
export class DataService {
  private baseUrl = 'http://localhost:3000/api';
  
  constructor(private http: HttpClient) {}
  
  getData(): Observable<Data[]> {
    return this.http.get<Data[]>(`${this.baseUrl}/endpoint`);
  }
}
```

### 4. Observable Subscription Pattern

**Subscribe with Handlers**:
```typescript
this.service.method().subscribe({
  next: (data) => {
    // Handle success
    this.data = data;
    this.loading = false;
  },
  error: (err) => {
    // Handle error
    this.errorMessage = err?.error?.message || 'Default error';
    this.loading = false;
  }
});
```

### 5. Input/Output Pattern (Shared Components)

**Component with Inputs/Outputs**:
```typescript
export class SharedComponent {
  @Input() data: Data | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  
  onSave(): void {
    this.saved.emit();
  }
}
```

**Usage in Parent**:
```html
<app-shared
  [data]="selectedData"
  (saved)="onDataSaved()"
  (cancelled)="onCancel()"
></app-shared>
```

### 6. Custom Validator Pattern

**Form-Level Validator**:
```typescript
passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pwd = group.get('password')?.value;
  const cpwd = group.get('confirmPassword')?.value;
  return pwd === cpwd ? null : { mismatch: true };
}

// Apply to form:
this.form = this.fb.group({...}, { validators: this.passwordsMatchValidator });
```

**Field-Level Validator**:
```typescript
emailValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const pattern = /regex/;
  return pattern.test(control.value) ? null : { invalidEmail: true };
}

// Apply to field:
email: ['', [Validators.required, this.emailValidator]]
```

### 7. ViewChild Pattern

**Access Component/Element**:
```typescript
@ViewChild('dt') dataTable!: Table;

// Usage:
this.dataTable.reset();
this.dataTable.filterGlobal(value, 'contains');
```

### 8. Lifecycle Hook Pattern

**ngOnChanges for Input Changes**:
```typescript
ngOnChanges(changes: SimpleChanges): void {
  if (changes['user'] && this.form) {
    this.patchForm();
  }
}
```

### 9. Conditional Rendering Pattern

**Template Conditionals**:
```html
<!-- Show/Hide based on condition -->
<div *ngIf="isVisible">Content</div>

<!-- Conditional styling -->
<element [class.active]="isActive"></element>

<!-- Conditional attributes -->
<input [disabled]="isDisabled" />
```

### 10. Error Handling Pattern

**Form Error Display**:
```html
<small class="p-error" *ngIf="f.fieldName.touched && f.fieldName.errors">
  <span *ngIf="f.fieldName.errors['required']">Field is required</span>
  <span *ngIf="f.fieldName.errors['pattern']">Invalid format</span>
</small>
```

### 11. Loading State Pattern

**Component Loading State**:
```typescript
loading = false;

loadData(): void {
  this.loading = true;
  this.service.getData().subscribe({
    next: (data) => {
      this.data = data;
      this.loading = false;
    },
    error: () => this.loading = false
  });
}
```

**Template Loading Display**:
```html
<button [loading]="loading">Submit</button>
<p-table [loading]="loading" [value]="data"></p-table>
```

### 12. Dialog Pattern

**Component State**:
```typescript
displayDialog = false;
selectedItem: Item | null = null;

openDialog(item?: Item): void {
  this.selectedItem = item || null;
  this.displayDialog = true;
}

onDialogHide(): void {
  this.displayDialog = false;
  this.selectedItem = null;
}
```

**Template Usage**:
```html
<p-dialog
  [(visible)]="displayDialog"
  [modal]="true"
  (onHide)="onDialogHide()"
>
  <app-form [data]="selectedItem"></app-form>
</p-dialog>
```

### 13. Null-Safe Rendering Pattern

**Template Safe Display**:
```html
<span *ngIf="hasValue(field)">{{ field }}</span>
<span *ngIf="!hasValue(field)" class="p-text-secondary">-</span>
```

**Component Helper**:
```typescript
hasValue(value: any): boolean {
  return value !== null && 
         value !== undefined && 
         value !== '' && 
         (typeof value !== 'string' || value.trim() !== '');
}
```

---

## Best Practices Implemented

### 1. Architecture
- ✅ Separation of concerns (components, services, models)
- ✅ Reactive forms for complex validation
- ✅ Centralized HTTP service
- ✅ Reusable shared components
- ✅ Modular component structure

### 2. Code Quality
- ✅ TypeScript strict mode enabled
- ✅ Interface-driven development
- ✅ Consistent naming conventions
- ✅ Comprehensive form validations
- ✅ Error handling throughout

### 3. User Experience
- ✅ Loading indicators
- ✅ Real-time validation feedback
- ✅ Clear error messages
- ✅ Confirmation dialogs for destructive actions
- ✅ Success messages
- ✅ Responsive design
- ✅ Tooltips for additional information

### 4. Performance
- ✅ OnPush change detection (can be added)
- ✅ Lazy loading (can be implemented)
- ✅ Production build optimization
- ✅ Tree-shakeable providers (providedIn: 'root')

### 5. Maintainability
- ✅ Clear folder structure
- ✅ Consistent code patterns
- ✅ Separation of template and logic
- ✅ Centralized styling
- ✅ Reusable components

---

## Summary

This Employee Cafeteria Management System is a modern, feature-rich Angular application that demonstrates:

- **Complete CRUD operations** for user management
- **Advanced form handling** with comprehensive validations
- **Modern UI/UX** powered by PrimeNG
- **Responsive design** for all screen sizes
- **Type-safe development** with TypeScript
- **Component-based architecture** following Angular best practices
- **Reactive programming** with RxJS observables
- **Clean separation of concerns** between presentation and business logic

The application provides an intuitive interface for managing cafeteria members with rich data collection, validation, and display capabilities. Built with Angular 15 and PrimeNG, it offers a professional, enterprise-grade solution that is both maintainable and scalable.

---

**Document Version**: 1.0  
**Last Updated**: December 2025  
**Framework Version**: Angular 15.2.0

