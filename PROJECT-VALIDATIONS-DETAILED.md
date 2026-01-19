# Project Validations (Frontend + Backend + Excel) — Detailed Guide

This file explains **every validation implemented in this project**, organized by page/feature:

- **Registration page**
- **Login page**
- **Home page**
  - Inline (cell) editing + Save Changes
  - Excel download (template)
  - Excel upload (validate + upload)
- **User Form dialog** (Add / Update member)
- **File type / file name checks**

For each validation you’ll see:

- **What is validated**
- **Exact rule**
- **Where it happens** (Frontend vs Backend)
- **How it flows** (UI → API → DB → UI)
- **What error the user sees**

---

## 1) Quick Map: Where validations live

### Frontend (Angular)

- **Login form validation**: `src/app/pages/login/login.component.ts`
- **Register form validation**: `src/app/pages/register/register.component.ts`
- **Home inline editing validation**: `src/app/pages/home/home.component.ts` (`validateUser()`, `celledited()`, `savechanges()`)
- **Home bulk Excel file name validation**: `src/app/pages/home/home.component.ts` (`isValidTemplateFileName()`)
- **User Form dialog validation** (Add / Update): `src/app/shared/user-form/user-form.component.ts`

### Backend (Node/Express)

- **Register/Login API validation**: `backend/controllers/authController.js`
- **Users CRUD + Excel APIs**: `backend/controllers/userController.js`
- **Excel upload parsing & validation**: `backend/controllers/userController.js` (`bulkUpsertFromExcel()`, `validateRow()`)
- **Multer upload constraints**: `backend/routes/userRoutes.js` (file size limit)

---

## 2) Registration Page (`/register`)

### Where it is implemented

- **UI (Angular)**:
  - Component: `src/app/pages/register/register.component.ts`
  - Template: `src/app/pages/register/register.component.html`
- **API (Node/Express)**:
  - Route: `POST /api/register`
  - Controller: `backend/controllers/authController.js` (`register(pool)`)

### Validations (Frontend)

#### 2.1 Name
- **Rule**:
  - Required
  - Min length: **2**
  - Pattern: **letters and spaces only** → `^[a-zA-Z\s]+$`
- **Where**: Frontend form validators in `RegisterComponent`
- **User feedback**: error text shown under the input when touched/invalid

#### 2.2 Username
- **Rule**:
  - Required
  - Pattern: **4–20 chars**, allowed chars: letters, numbers, `_` and `@`
  - Regex: `^[a-zA-Z0-9_@]{4,20}$`
- **Where**: Frontend form validators in `RegisterComponent`
- **User feedback**: error text shown under the input when touched/invalid

#### 2.3 Email (custom validator)
- **Rule**:
  - Required
  - Must match “basic email” format: `^[^\s@]+@[^\s@]+$`
  - Must have a **TLD with at least 2 letters**: `\.[a-zA-Z]{2,}$`
  - Examples allowed: `.com`, `.org`, `.net`, etc.
- **Where**: `RegisterComponent.emailValidator()`
- **User feedback**:
  - `invalidEmail` → “Please enter a valid email address”
  - `invalidTld` → “Email must have a valid domain extension…”

#### 2.4 Password
- **Rule**:
  - Required
  - Min length: **8**
  - Must contain:
    - at least 1 lowercase letter
    - at least 1 uppercase letter
    - at least 1 digit
    - at least 1 special char from `@$!%*?&`
  - Regex: `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$`
- **Where**: Angular validators in `RegisterComponent`
- **User feedback**: error text shown under the input

#### 2.5 Confirm Password + “Passwords match” (cross-field)
- **Rule**:
  - `confirmPassword` is required
  - `confirmPassword` must match `password`
- **Where**:
  - Field validator: `confirmPassword: ['', Validators.required]`
  - Group validator: `RegisterComponent.passwordsMatchValidator`
- **User feedback**: “Passwords do not match…”

### Validations (Backend)

Backend **re-checks** the registration rules so users can’t bypass validation by calling the API directly.

#### 2.6 Required fields presence
- **Rule**: `name`, `username`, `email`, `password` must all exist
- **Where**: `authController.register()` early return 400

#### 2.7 Name format
- **Rule**:
  - string
  - trimmed length ≥ 2
  - `^[a-zA-Z\s]+$`
- **Where**: `authController.register()`

#### 2.8 Username format
- **Rule**: `^[a-zA-Z0-9_@]{4,20}$`
- **Where**: `authController.register()`

#### 2.9 Email format + TLD
- **Rule**: `^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$`
- **Where**: `authController.register()`

#### 2.10 Password strength
- **Rule**:
  - length ≥ 8
  - same strong-password regex as frontend
- **Where**: `authController.register()`

#### 2.11 Uniqueness: username/email must be new
- **Rule**: Reject if any user exists with same `username` **or** `email`
- **Where**: `authController.register()` queries MySQL

### End-to-end flow (Registration)

1. **User types** → Angular reactive form validators run in-browser.
2. **User clicks “Create Account”**:
   - If invalid → frontend calls `markAllAsTouched()` and blocks submit.
   - If valid → frontend sends `POST /api/register` with `{ name, username, email, password }`.
3. **Backend validates again**:
   - If invalid → responds `400` with `{ message }` and UI shows it via `errorMessage`.
   - If valid → hashes password using bcrypt, inserts user, returns `{ user }`.
4. **Frontend stores** `current_user` in `localStorage` and navigates to `/home`.

---

## 3) Login Page (`/login`)

### Where it is implemented

- **UI (Angular)**:
  - Component: `src/app/pages/login/login.component.ts`
  - Template: `src/app/pages/login/login.component.html`
- **API (Node/Express)**:
  - Route: `POST /api/login`
  - Controller: `backend/controllers/authController.js` (`login(pool)`)

### Validations (Frontend)

#### 3.1 Username
- **Rule**:
  - Required
  - Pattern: **4–20 chars**, allowed: letters/numbers/`.`/`_`/`-`
  - Regex: `^[a-zA-Z0-9._-]{4,20}$`
- **Where**: Angular validators in `LoginComponent`
- **User feedback**: “Username is required (4-20 characters)”

#### 3.2 Password
- **Rule**:
  - Required
  - Min length: 8
  - Strong password regex (same as register)
- **Where**: Angular validators in `LoginComponent`

### Validations (Backend)

#### 3.3 Required fields presence
- **Rule**: `username` and `password` required
- **Where**: `authController.login()`

#### 3.4 Credential check
- **Rule**:
  - Backend searches by `username OR email` (same string used for both)
  - bcrypt compare of password against `password_hash`
- **Where**: `authController.login()`
- **Failure response**:
  - Missing → `400` with message
  - Invalid credentials → `401` with message `"Invalid credentials"`

### End-to-end flow (Login)

1. User submits login form.
2. Frontend blocks if invalid.
3. Frontend calls `POST /api/login`.
4. Backend validates presence and checks credentials.
5. On success, frontend stores `current_user` in `localStorage` and navigates to `/home`.

---

## 4) Home Page (`/home`) — Inline Editing Validations

The Home page uses a PrimeNG table in **cell edit mode**, and validations happen in **component code** (not reactive forms).

### Where it is implemented

- UI:
  - `src/app/pages/home/home.component.ts`
  - `src/app/pages/home/home.component.html`
- Backend:
  - `PUT /api/users/:id` → `backend/controllers/userController.js` (`updateUser`)

### How inline validation works (mechanism)

1. When a cell changes, `celledited(event)` runs.
2. It calls `normalize(user, field)` to sanitize/normalize values.
3. It calls `validateUser(user)` to build a `{ fieldName: errorMessage }` object.
4. It stores errors under `fieldErrors[userId][field]` and the template shows inline error text under that cell.
5. The “Save Changes” button runs `savechanges()`:
   - re-validates all edited rows
   - blocks saving if any row has validation errors
   - otherwise sends parallel `PUT` requests.

### Validations (Frontend, inline editing)

All these rules are defined in `HomeComponent.validateUser(u)`.

#### 4.1 Email
- **Rule**:
  - Required
  - Must match: `^[^\s@]+@[^\s@]+\.[^\s@]+$`
  - Must end with **.com**
- **Where**: Frontend only (inline edit validation)
- **User feedback**:
  - “Email is required”
  - “Invalid email”
  - “Must end with .com”

#### 4.2 Username
- **Rule**:
  - Required
  - 4–20 chars
  - Regex: `^[a-zA-Z0-9._-]+$`
- **Where**: Frontend only (inline edit validation)
- **User feedback**: “4-20 characters” / “Letters, numbers, _, -, . only”

#### 4.3 Mobile
- **Rule**:
  - Required
  - Must become digits-only
  - Must be exactly 10 digits
- **Where**:
  - Normalization: `normalize()` strips non-digits
  - Validation: `validateUser()`
- **User feedback**: “10 digits required”

#### 4.4 Credit Card (special handling)
- **Rule**:
  - Required
  - Allowed lengths: **4 or 16 digits**
  - If editing the creditCard field, the component strips non-digits and:
    - keeps 16-digit value
    - OR keeps last 4 digits
    - otherwise falls back to last known baseline value
- **Where**:
  - Normalization: `normalize(u, 'creditCard')`
  - Validation: `validateUser()`
- **User feedback**: “4 or 16 digits”

#### 4.5 State / City dependency
- **Rule**:
  - State required
  - City required
  - If State+City are set, City must belong to selected State (based on `assets/locations.json`)
- **Where**:
  - State→City dropdown behavior: `onStateChange(user)` and `cityOptions()`
  - Validation: `validateUser()`
- **User feedback**: “State required” / “City required”

#### 4.6 Gender
- **Rule**: required (must be selected)
- **Where**: `validateUser()`

#### 4.7 Hobbies + Tech Interests
- **Rule**: at least one must be selected in each list
- **Where**: `validateUser()`

#### 4.8 DOB
- **Rule**:
  - Required
  - Must parse to a valid date (JS `Date`)
- **Where**: `validateUser()`

#### 4.9 Address
- **Rule**:
  - Optional
  - If present, must match: `^[a-zA-Z0-9\s,._-]*$`
- **Where**: `validateUser()`

### Validations (Backend for inline updates)

The inline edit flow saves by calling `PUT /api/users/:id` (see `HomeComponent.savechanges()` and `UserService.updateUser()`).

#### 4.10 What the backend validates on update
- **Current behavior**: `updateUser` does **not** enforce the same field-level rules (regex/required/etc.) as the frontend.
- **Where**: `backend/controllers/userController.js` (`updateUser`)
- **What it *does* do**:
  - Writes `name`, `username`, `email` into `users`
  - Upserts `user_interests` with sanitized string fields and last4 of credit card
  - Uses `sanitizeValue()` on many fields (turns empty/whitespace-only strings into `null`)
- **What it does *not* do** (important):
  - No required-field enforcement (you could send empty values via API and they would be stored as `NULL`)
  - No regex checks for email/username/mobile/creditCard/address
  - No check that `city` belongs to `state`
  - No “must end with .com” check
  - No uniqueness check for updated `email` or `username` (except in Excel bulk flow)

### End-to-end flow (Home inline edit)

1. User edits cell → frontend normalizes and validates in `validateUser()`.
2. If any errors exist, they show inline and “Save Changes” blocks with “Fix errors before saving.”
3. If all edited rows are valid:
   - frontend sends one `PUT /api/users/:id` per edited row (parallel).
4. Backend updates DB and responds success/failure per row.
5. Frontend:
   - On full success: clears local edit state and reloads users
   - On partial failure: rolls failed rows back to baseline data and shows “Partial save”

---

## 5) User Form Dialog (Add / Update Member)

This is the dialog used by Home page “Add Member” (`<app-user-form>`).

### Where it is implemented

- UI:
  - Component: `src/app/shared/user-form/user-form.component.ts`
  - Template: `src/app/shared/user-form/user-form.component.html`
- Backend:
  - `POST /api/users` → `backend/controllers/userController.js` (`createUser`)
  - `PUT /api/users/:id` → `backend/controllers/userController.js` (`updateUser`)

### Frontend validation rules (Reactive Form)

The shared form uses Angular reactive form validators.

#### 5.1 Name
- **Rule**:
  - Required
  - Min length: 2
  - Custom rule: **cannot contain digits**
- **Where**:
  - Validators: `Validators.required`, `Validators.minLength(2)`, plus custom `{ hasNumbers: true }` if any digit exists
- **User feedback**:
  - “Name is required”
  - “Name must be at least 2 characters”
  - “Name cannot contain numbers”

#### 5.2 Email
- **Rule**:
  - Required
  - Angular `Validators.email`
  - Custom rule: **must end with `.com`**
- **Where**: validators in `UserFormComponent.buildForm()`
- **User feedback**:
  - “Please enter a valid email address”
  - “Email must end with .com”

#### 5.3 Mobile
- **Rule**:
  - Required
  - Exactly 10 digits
  - Regex: `^\d{10}$`
- **Where**: validators in `UserFormComponent.buildForm()`

#### 5.4 Credit Card
- **Rule**:
  - Required
  - Exactly 16 digits
  - Regex: `^\d{16}$`
- **Where**: validators in `UserFormComponent.buildForm()`

#### 5.5 State + City
- **Rule**:
  - Both required
  - City dropdown depends on state
- **Where**:
  - State/city required: validators
  - Dependency: `onStateChange()` updates available city list and clears invalid city
  - Location source: `src/assets/locations.json` loaded by `loadLocations()`

#### 5.6 Gender
- **Rule**: required, default is `'Male'`
- **Where**: validators + default values in `buildForm()` / `patchForm()`

#### 5.7 Hobbies + Tech Interests
- **Rule**: at least one item must be selected in each
- **Where**:
  - Uses a custom `arrValidator` that returns `{ required: true }` when empty

#### 5.8 Address
- **Rule**:
  - Optional
  - Allowed chars only: `^[a-zA-Z0-9\s,._-]*$`
- **Where**: validators in `UserFormComponent.buildForm()`

#### 5.9 Username
- **Rule**:
  - Required
  - Regex: `^[a-zA-Z0-9._-]{4,20}$`
- **Special behavior**:
  - In **Edit mode**, username input is **disabled** in the template (`[disabled]="isEditMode"`)
- **Where**: validators + template binding

#### 5.10 Password + Confirm Password + “match”

**Add mode**
- **Rule**:
  - password required
  - min length 8
  - strong password regex
  - confirmPassword required
  - password must match confirmPassword (group validator)
- **Where**: validators + group validator in `buildForm()`

**Edit mode**
- **Rule**:
  - password fields are not shown in the template (`*ngIf="!isEditMode"`)
  - and validators for password/confirmPassword are cleared in `patchForm()`
- **Reason**: update API does not expect password updates in this UI flow.

#### 5.11 DOB
- **Rule**:
  - Required
  - Date input max is today (prevents future DOB selection in browser UI)
- **Where**:
  - Validator: `Validators.required`
  - UI constraint: `[attr.max]="todayDateStr"`

### Backend validation rules (User create / update)

#### 5.12 Create member (`POST /api/users`)
- **Required fields enforced by backend**:
  - `name`, `email`, `mobile`, `state`, `city`, `username`, `password`
  - plus `hobbies` must be a non-empty array
  - plus `techInterests` must be a non-empty array
- **Where**: `backend/controllers/userController.js` (`createUser`)
- **Uniqueness**:
  - rejects if username or email already exists
- **Important gap**:
  - backend create does **not** enforce the same regex rules (email format, username format, password strength, mobile digits, credit card length, `.com` requirement, etc.)

#### 5.13 Update member (`PUT /api/users/:id`)
- **Backend mostly trusts the client** (see section 4.10).
- It upserts `user_interests` and stores only the credit card last4.

### End-to-end flow (User Form)

**Add Member**
1. User opens dialog → `userForm` is initialized empty.
2. Frontend blocks submit until the form is valid.
3. Frontend submits to `POST /api/users`.
4. Backend checks presence + array checks + uniqueness and inserts.
5. Frontend closes dialog and reloads table.

**Update Member** (when `user` input is provided)
1. Form is patched with user data.
2. Password fields are hidden and password validators are cleared.
3. Submit sends `PUT /api/users/:id` with the editable subset of fields.

---

## 6) Home Page — Excel Download (Template) Validations

### Where it is implemented

- Frontend: `HomeComponent.downloadTemplate()` → `UserService.downloadUsersTemplate()`
- Backend endpoint: `GET /api/users/excel-template`
  - Controller: `backend/controllers/userController.js` (`downloadExcelTemplate`)

### What is “validated” during download

Download itself is not “validating user input”, but the generated Excel file contains **Excel-level validations** that help users enter valid data.

#### 6.1 Template mode validation (`mode`)
- **Rule**: only `blank` or `data` are accepted; anything else becomes `blank`
- **Where**: backend `downloadExcelTemplate` (query param parsing)

#### 6.2 Excel sheet validations embedded inside the downloaded template

The backend generates a workbook with these sheets:
- `Cover`
- `Application Portfolio` (this is the **main data entry sheet**)
- `Data Format`

Inside the Excel workbook:
- **Dropdown validations**:
  - `Gender` list
  - `State` list
  - `City` list that depends on selected `State` (via Excel OFFSET/MATCH/COUNTIF formula)
  - `Hobbies` list
  - `Tech Interests` list
- **DOB date validation**:
  - “DOB must be <= TODAY()” (prevents future dates in Excel)

**Where these validations happen**:
- Not in Angular and not in the API request.
- They happen inside Excel itself when the user edits cells.

### “Downloaded by” tracking

- Frontend stores `current_user` in `localStorage` at login/register.
- Home uses it to set `downloadedBy` query param.
- Backend writes that value into the Excel “Cover” sheet as metadata.

---

## 7) Home Page — Excel Upload (Validate + Upload)

There are two actions in the UI:
- **Validate** (dry run): `POST /api/users/bulk?dryRun=true`
- **Upload** (commit): `POST /api/users/bulk?dryRun=false`

Both use `multipart/form-data` with field name `file`.

### 7.1 Frontend file selection validation (file type + file name gate)

#### File type (UI constraint)
- **Rule**: `<input type="file" accept=".xlsx">`
- **Where**: `src/app/pages/home/home.component.html`
- **Note**: this is only a browser UI filter; it does not guarantee the file is truly an xlsx.

#### File name validation (strict)
- **Rule** (frontend blocks selection unless the filename matches):
  - Must end with `.xlsx`
  - Must start with `Users_Template_`
  - Allowed exact patterns:
    - `Users_Template_blank.xlsx`
    - `Users_Template_data.xlsx`
    - `Users_Template_Blank_YYYY-MM-DD.xlsx`
    - `Users_Template_With_Data_YYYY-MM-DD.xlsx`
  - Allows browser suffix like ` (2)` before `.xlsx`
- **Where**: `HomeComponent.isValidTemplateFileName()`
- **User feedback**: “Invalid file name. Please upload only the Excel template downloaded from this application…”

### 7.2 Backend upload constraints (multer)

- **Rule**: max upload size **10 MB**
- **Where**: `backend/routes/userRoutes.js` multer limits

### 7.3 Backend Excel parsing + template validation

#### File presence
- **Rule**: request must include file buffer
- **Where**: `bulkUpsertFromExcel()`
- **Error**: `400` “Excel file is required (multipart field: file)”

#### Required sheet and columns
- **Rule**:
  - backend tries to find sheet named **`Application Portfolio`**
  - otherwise it uses the first sheet
  - then it reads the first row as headers and checks that **all expected columns exist**
  - if any expected columns are missing, it rejects
- **Where**: `bulkUpsertFromExcel()`
- **Error**: `400` “Template columns mismatch. Missing: ...”

### 7.4 Backend per-row validations (core Excel validation logic)

All per-row rules are in `validateRow(row, lookups, mode)`.

#### Row mode: ADD vs EDIT
- **Mode**:
  - If `UserId` is empty → mode = **ADD**
  - If `UserId` is present → mode = **EDIT**
- **ADD required columns**:
  - Name, Email, Username, Mobile, Credit Card, State, City, Gender, Hobbies, Tech Interests, DOB, Password
- **EDIT rules**:
  - `UserId` is required
  - Password is optional (and typically ignored for edit)

#### Field-level validation rules applied per row

- **Email**: must match `^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$` (TLD required)
- **Username**: must match `^[a-zA-Z0-9._-]{4,20}$`
- **Mobile**: digits-only and must be exactly 10 digits
- **Credit Card**: must be 16 digits or last 4 digits
- **Gender**: must be one of `Male/Female/Other` (from lookups)
- **State**: must be in states list (from `src/assets/locations.json`)
- **City**: must be in cities list, and must belong to chosen state
- **Hobbies**: comma-separated (or list) values must all be in allowed list
- **Tech Interests**: same as hobbies
- **DOB**: must be a valid `YYYY-MM-DD` string (or Excel date converted into that); future constraint is primarily Excel-side, but backend still requires valid date format.
- **Password**:
  - ADD: required and must be strong (same “uppercase/lowercase/number/special” rule; min 8)
  - EDIT: if provided, must still be strong

### 7.5 Backend cross-row validations (within the same Excel file)

After row validation, backend checks duplicates inside the uploaded file:
- Duplicate email within file (per mode)
- Duplicate username within file (per mode)

### 7.6 Backend DB validations (uniqueness + existence)

After rows pass format validation, backend does DB checks:

- **ADD rows**:
  - email must not already exist
  - username must not already exist
- **EDIT rows**:
  - UserId must exist
  - email/username cannot belong to a different user

### 7.7 Validate vs Upload flow (dryRun)

#### Validate (dryRun=true)
- Backend returns:
  - `errorCount`
  - `errorDetails` (rowNumber + reason)
  - `errorFileBase64` (an Excel file containing failing rows + reasons)
- Frontend shows:
  - list of errors
  - enables “Download Error Excel”

#### Upload (dryRun=false)
- Backend runs a DB transaction:
  - Inserts new rows
  - Updates existing rows
  - Writes interests row (insert/upsert)
- Backend returns the same kind of result (including errors workbook if any failed rows remain).

---

## 8) “File Type” Validation Summary

### Frontend

- Uses browser-level file selection filter: `accept=".xlsx"`
- Adds **stronger safety** by validating the **filename pattern** before calling the backend.

### Backend

- Enforces **file size** (10MB).
- Requires the multipart file buffer to exist.
- Does **not** currently validate:
  - mimetype (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)
  - file extension
  - magic bytes / signature of xlsx

---

## 9) Consistency Matrix (Frontend vs Backend) — Important Differences

This section highlights validations that differ between pages or between frontend and backend. This matters because users may see one rule in UI but the API accepts something else (or vice versa).

### 9.1 Email rules differ by feature

- **Register page**: allows any TLD (e.g., `.com`, `.org`, `.net`) (frontend + backend).
- **User Form + Home inline edit**: requires `.com` specifically (frontend).
- **Excel upload**: allows any TLD with 2+ letters (backend).

### 9.2 Username rules differ by feature

- **Register page**: `^[a-zA-Z0-9_@]{4,20}$`
- **Login page**: `^[a-zA-Z0-9._-]{4,20}$` (and backend also allows login by email)
- **User Form**: `^[a-zA-Z0-9._-]{4,20}$`
- **Home inline edit**: `^[a-zA-Z0-9._-]+$` plus explicit 4–20 length check
- **Excel upload**: `^[a-zA-Z0-9._-]{4,20}$`

### 9.3 Credit card rules differ by feature

- **User Form**: requires **exactly 16 digits**
- **Home inline edit**: allows **4 or 16 digits**
- **Excel upload**: allows **4 or 16 digits**
- **Backend DB storage**: stores **last 4 digits** only (`credit_card_last4`)

### 9.4 Backend update endpoint is “trusting”

The `PUT /api/users/:id` update endpoint does not enforce most field-level validations.
That means the frontend validation is the main protection for manual edits, but direct API calls could bypass it.

---

## 10) Validation Entry Points (Cheat Sheet)

- **Register UI validators**: `RegisterComponent` reactive form validators
- **Login UI validators**: `LoginComponent` reactive form validators
- **User Form validators**: `UserFormComponent.buildForm()` + group mismatch validator
- **Inline edit validators**: `HomeComponent.validateUser()`
- **Excel filename check**: `HomeComponent.isValidTemplateFileName()`
- **Excel backend validation**:
  - template/header check + per-row validation + DB checks: `bulkUpsertFromExcel()`
  - per-row rules: `validateRow()`


