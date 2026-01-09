const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const xl = require('excel4node');
const xlsx = require('xlsx');

// Helper function to sanitize string values (null/empty string handling)
const sanitizeValue = (value) => {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  return String(value).trim();
};

// Helper function to parse JSON fields
const parseJsonField = (field) => {
  if (!field) return [];
  return typeof field === 'string' ? JSON.parse(field) : field;
};

// Helper function to extract credit card last 4 digits
const extractCreditCardLast4 = (creditCard) => {
  if (!creditCard) return null;
  const digitsOnly = creditCard.replace(/\D/g, '');
  return digitsOnly.length >= 4 ? digitsOnly.slice(-4) : null;
};

// Helper function to format timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp) return null;
  return timestamp instanceof Date ? timestamp.toISOString() : timestamp;
};

// -------------------- Excel Bulk Add/Edit (excel4node + multer + xlsx) --------------------
const EXCEL_SHEETS = {
  COVER: 'Cover',
  MAIN: 'Application Portfolio',
  FORMAT: 'Data Format'
};

// NOTE: We include UserId to detect EDIT vs ADD (required by bulk spec).
const EXCEL_COLUMNS = [
  { key: 'id', header: 'UserId', requiredForAdd: false },
  { key: 'name', header: 'Name', requiredForAdd: true },
  { key: 'email', header: 'Email', requiredForAdd: true },
  { key: 'username', header: 'Username', requiredForAdd: true },
  { key: 'mobile', header: 'Mobile', requiredForAdd: true },
  { key: 'creditCard', header: 'Credit Card', requiredForAdd: true },
  { key: 'state', header: 'State', requiredForAdd: true },
  { key: 'city', header: 'City', requiredForAdd: true },
  { key: 'gender', header: 'Gender', requiredForAdd: true },
  { key: 'hobbies', header: 'Hobbies', requiredForAdd: true }, // comma-separated
  { key: 'techInterests', header: 'Tech Interests', requiredForAdd: true }, // comma-separated
  { key: 'address', header: 'Address', requiredForAdd: false },
  { key: 'dob', header: 'DOB', requiredForAdd: true }, // YYYY-MM-DD
  { key: 'password', header: 'Password', requiredForAdd: true } // ADD only; ignored for EDIT
];

const getLocationsFromFrontendAssets = () => {
  // backend/controllers -> ../../src/assets/locations.json
  const p = path.join(__dirname, '..', '..', 'src', 'assets', 'locations.json');
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw);
};

const buildLookups = () => {
  const loc = getLocationsFromFrontendAssets();
  const states = (loc?.states || []).map((s) => s.stateName).filter(Boolean);
  const citiesByState = Object.fromEntries(
    (loc?.states || []).map((s) => [s.stateName, (s.cities || []).map((c) => c.cityName).filter(Boolean)])
  );
  const cities = Array.from(new Set(Object.values(citiesByState).flat()));

  // Keep these aligned with frontend options to avoid confusion.
  const genders = ['Male', 'Female', 'Other'];
  const hobbies = ['Reading', 'Music', 'Sports'];
  const techInterests = ['Angular', 'React', 'Node.js', 'Java'];

  // Requested in spec for dropdown sheet (not stored in DB currently).
  const roles = ['Member', 'Admin'];
  const departments = ['IT', 'HR', 'Finance', 'Operations'];
  const statuses = ['Active', 'Inactive'];

  return { genders, hobbies, techInterests, states, cities, citiesByState, roles, departments, statuses };
};

const normalizeListCell = (v) => {
  if (v === null || v === undefined) return [];
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  const s = String(v).trim();
  if (!s) return [];
  return s.split(',').map((x) => x.trim()).filter(Boolean);
};

const normalizeDateCell = (v) => {
  if (!v) return '';
  // Excel Date object (cellDates: true) - use local date parts
  if (v instanceof Date) {
    if (isNaN(v.getTime())) return '';
    const y = v.getFullYear(), m = String(v.getMonth() + 1).padStart(2, '0'), d = String(v.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  // Only accept YYYY-MM-DD string format (keep it simple and consistent)
  const s = String(v).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
};

const validateRow = (row, lookups, mode) => {
  const errors = [];
  const isAdd = mode === 'ADD';

  if (isAdd) {
    EXCEL_COLUMNS.filter((c) => c.requiredForAdd).forEach((c) => {
      const v = row[c.key];
      const ok = c.key === 'hobbies' || c.key === 'techInterests' ? normalizeListCell(v).length > 0 : !!String(v ?? '').trim();
      if (!ok) errors.push(`${c.header} is required`);
    });
  } else if (!String(row.id || '').trim()) {
    errors.push('UserId is required for EDIT');
  }

  const email = String(row.email ?? '').trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email)) errors.push('Invalid email format');

  const username = String(row.username ?? '').trim();
  if (username && !/^[a-zA-Z0-9._-]{4,20}$/.test(username)) errors.push('Username must be 4-20 characters (letters/numbers/._-)');

  const mobile = String(row.mobile ?? '').replace(/\D/g, '');
  if (mobile && !/^\d{10}$/.test(mobile)) errors.push('Mobile must be exactly 10 digits');

  const cc = String(row.creditCard ?? '').replace(/\D/g, '');
  if (cc && !(cc.length === 16 || cc.length === 4)) errors.push('Credit Card must be 16 digits or last 4 digits');

  const gender = String(row.gender ?? '').trim();
  if (gender && !lookups.genders.includes(gender)) errors.push(`Gender must be one of: ${lookups.genders.join(', ')}`);

  const state = String(row.state ?? '').trim();
  if (state && !lookups.states.includes(state)) errors.push('State must be one of the available states');

  const city = String(row.city ?? '').trim();
  if (city && !lookups.cities.includes(city)) errors.push('City must be one of the available cities');

  if (state && city) {
    const allowed = lookups.citiesByState[state] || [];
    if (allowed.length && !allowed.includes(city)) errors.push('City does not belong to selected State');
  }

  const hobbies = normalizeListCell(row.hobbies);
  if (hobbies.length && hobbies.some((h) => !lookups.hobbies.includes(h))) errors.push('Hobbies contain invalid value(s)');

  const tech = normalizeListCell(row.techInterests);
  if (tech.length && tech.some((t) => !lookups.techInterests.includes(t))) errors.push('Tech Interests contain invalid value(s)');

  const dob = normalizeDateCell(row.dob);
  if ((isAdd || row.dob) && !dob) errors.push('DOB must be valid date (YYYY-MM-DD)');

  const pw = String(row.password ?? '').trim();
  if (isAdd) {
    if (!pw) errors.push('Password is required for ADD');
    else if (pw.length < 8 || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/.test(pw)) {
      errors.push('Password must be strong (uppercase/lowercase/number/special, min 8)');
    }
  } else if (pw) {
    if (pw.length < 8 || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/.test(pw)) {
      errors.push('Password (if provided) must be strong (uppercase/lowercase/number/special, min 8)');
    }
  }

  return { ok: errors.length === 0, errors, normalized: { ...row, mobile, creditCard: cc, dob, email: email.trim().toLowerCase(), username } };
};

const colLetter = (n) => {
  let s = '';
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
};

const buildErrorWorkbookBase64 = async (failedRows) => {
  const wb = new xl.Workbook();
  const ws = wb.addWorksheet('Errors');
  const headerStyle = wb.createStyle({
    font: { bold: true, color: '#FFFFFF' },
    fill: { type: 'pattern', patternType: 'solid', fgColor: '#C00000' },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
  });
  const headers = [...EXCEL_COLUMNS.map((c) => c.header), 'Error Reason'];
  headers.forEach((h, i) => {
    ws.column(i + 1).setWidth(Math.min(35, Math.max(12, h.length + 2)));
    ws.cell(1, i + 1).string(h).style(headerStyle);
  });
  failedRows.forEach((r, idx) => {
    const rowNum = 2 + idx;
    EXCEL_COLUMNS.forEach((c, i) => ws.cell(rowNum, i + 1).string(String(r[c.key] ?? '')));
    ws.cell(rowNum, headers.length).string(String(r.__errorReason || ''));
  });
  const buf = await wb.writeToBuffer();
  return buf.toString('base64');
};

// GET /api/users/lookups
const getLookups = () => async (_req, res) => {
  try {
    return res.json(buildLookups());
  } catch (err) {
    console.error('Error building lookups:', err.message);
    return res.status(500).json({ message: 'Internal server error: ' + err.message });
  }
};

// GET /api/users/excel-template?mode=blank|data&downloadedBy=...
const downloadExcelTemplate = (pool) => async (req, res) => {
  try {
    const mode = String(req.query.mode || 'blank').toLowerCase() === 'data' ? 'data' : 'blank';
    const downloadedBy = String(req.query.downloadedBy || 'Unknown');
    const downloadedAt = new Date().toISOString();
    const lookups = buildLookups();

    const wb = new xl.Workbook();
    const headerStyle = wb.createStyle({
      font: { bold: true, color: '#FFFFFF' },
      fill: { type: 'pattern', patternType: 'solid', fgColor: '#4F81BD' },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
    });
    const wrapStyle = wb.createStyle({ alignment: { wrapText: true, vertical: 'top' } });

    // Sheet 1: Cover
    const wsCover = wb.addWorksheet(EXCEL_SHEETS.COVER);
    wsCover.column(1).setWidth(28);
    wsCover.column(2).setWidth(80);
    wsCover.cell(1, 1).string('Users Bulk Template').style(wb.createStyle({ font: { bold: true, size: 18 } }));
    wsCover.cell(3, 1).string('Downloaded by').style(wb.createStyle({ font: { bold: true } }));
    wsCover.cell(3, 2).string(downloadedBy);
    wsCover.cell(4, 1).string('Download timestamp').style(wb.createStyle({ font: { bold: true } }));
    wsCover.cell(4, 2).string(downloadedAt);
    wsCover.cell(5, 1).string('Template mode').style(wb.createStyle({ font: { bold: true } }));
    wsCover.cell(5, 2).string(mode === 'data' ? 'With Data' : 'Blank');
    wsCover.cell(6, 1).string('Record count').style(wb.createStyle({ font: { bold: true } }));

    const instructions = [
      'Instructions:',
      '1) Fill the "Application Portfolio" sheet only. Do not rename columns.',
      '2) ADD rows: leave UserId blank; Password is required.',
      '3) EDIT rows: provide UserId; Password is ignored (leave blank).',
      '4) Hobbies/Tech Interests: comma-separated from allowed lists in "Data Format".',
      '5) State/City must match mapping.'
    ].join('\n');
    wsCover.cell(8, 1).string('Usage Notes').style(wb.createStyle({ font: { bold: true } }));
    wsCover.cell(8, 2).string(instructions).style(wrapStyle);

    // Sheet 3: Data Format
    const wsFmt = wb.addWorksheet(EXCEL_SHEETS.FORMAT);
    wsFmt.column(1).setWidth(22);
    wsFmt.column(2).setWidth(70);
    wsFmt.column(4).setWidth(22);
    wsFmt.column(5).setWidth(22);
    wsFmt.column(6).setWidth(22);
    wsFmt.column(7).setWidth(22);
    wsFmt.column(8).setWidth(22);
    wsFmt.column(10).setWidth(22);
    wsFmt.column(11).setWidth(22);
    wsFmt.cell(1, 1).string('Column').style(headerStyle);
    wsFmt.cell(1, 2).string('How to Fill / Rules').style(headerStyle);

    EXCEL_COLUMNS.forEach((c, idx) => {
      const r = 2 + idx;
      wsFmt.cell(r, 1).string(c.header);
      let rule = '';
      if (c.key === 'id') rule = 'Leave blank to ADD. Provide UUID to EDIT.';
      else if (c.key === 'hobbies') rule = `Comma-separated. Allowed: ${lookups.hobbies.join(', ')}`;
      else if (c.key === 'techInterests') rule = `Comma-separated. Allowed: ${lookups.techInterests.join(', ')}`;
      else if (c.key === 'gender') rule = `Dropdown. Allowed: ${lookups.genders.join(', ')}`;
      else if (c.key === 'state') rule = 'Dropdown. Must be valid State.';
      else if (c.key === 'city') rule = 'Dropdown. Must be valid City (and match State).';
      else if (c.key === 'dob') rule = 'Date in YYYY-MM-DD format. Future dates not allowed.';
      else if (c.key === 'creditCard') rule = '16 digits (or last 4 digits for edits). Stored as last 4 only.';
      else if (c.key === 'password') rule = 'Required for ADD. Ignored for EDIT.';
      else rule = c.requiredForAdd ? 'Required for ADD.' : 'Optional.';
      wsFmt.cell(r, 2).string(rule).style(wrapStyle);
    });

    // Dropdown lists used in sheet validations
    const writeList = (col, title, values) => {
      wsFmt.cell(1, col).string(title).style(headerStyle);
      values.forEach((v, i) => wsFmt.cell(2 + i, col).string(String(v)));
      return { startRow: 2, endRow: 1 + values.length, col };
    };
    const genderRange = writeList(4, 'Genders', lookups.genders);
    const stateRange = writeList(5, 'States', lookups.states);
    const cityRange = writeList(6, 'Cities', lookups.cities);
    const hobbyRange = writeList(7, 'Hobbies', lookups.hobbies);
    const techRange = writeList(8, 'Tech Interests', lookups.techInterests);

    // State → City mapping table for dependent dropdowns (used by City validation formula)
    // Column J: StateKey, Column K: CityValue (grouped by state)
    wsFmt.cell(1, 10).string('StateKey').style(headerStyle);
    wsFmt.cell(1, 11).string('CityValue').style(headerStyle);
    let mapRow = 2;
    (lookups.states || []).forEach((s) => {
      const cities = lookups.citiesByState?.[s] || [];
      cities.forEach((c) => {
        wsFmt.cell(mapRow, 10).string(String(s));
        wsFmt.cell(mapRow, 11).string(String(c));
        mapRow += 1;
      });
    });
    const mapEndRow = Math.max(2, mapRow - 1);

    // Sheet 2: Main
    const wsMain = wb.addWorksheet(EXCEL_SHEETS.MAIN);
    EXCEL_COLUMNS.forEach((c, i) => {
      wsMain.column(1 + i).setWidth(Math.min(30, Math.max(12, c.header.length + 2)));
      wsMain.cell(1, 1 + i).string(c.header).style(headerStyle);
    });

    let dataRows = [];
    if (mode === 'data') {
      const [rows] = await pool.query(`
        SELECT 
          u.id, u.name, u.email, u.username,
          ui.mobile, ui.credit_card_last4, ui.state, ui.city, ui.gender,
          ui.hobbies, ui.tech_interests, ui.address, ui.dob
        FROM users u
        LEFT JOIN user_interests ui ON u.id = ui.user_id
        ORDER BY u.created_at DESC
      `);
      dataRows = rows.map((r) => {
        // Format DOB as YYYY-MM-DD for Excel (string)
        let dobFormatted = '';
        if (r.dob) {
          const d = r.dob instanceof Date ? r.dob : new Date(r.dob);
          if (!isNaN(d.getTime())) {
            dobFormatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          }
        }
        return {
          id: r.id || '',
          name: r.name || '',
          email: r.email || '',
          username: r.username || '',
          mobile: sanitizeValue(r.mobile) || '',
          creditCard: sanitizeValue(r.credit_card_last4) || '',
          state: sanitizeValue(r.state) || '',
          city: sanitizeValue(r.city) || '',
          gender: r.gender || 'Male',
          hobbies: (Array.isArray(parseJsonField(r.hobbies)) ? parseJsonField(r.hobbies) : []).join(', '),
          techInterests: (Array.isArray(parseJsonField(r.tech_interests)) ? parseJsonField(r.tech_interests) : []).join(', '),
          address: sanitizeValue(r.address) || '',
          dob: dobFormatted,
          password: ''
        };
      });
    }

    wsCover.cell(6, 2).number(mode === 'data' ? dataRows.length : 0);

    dataRows.forEach((r, idx) => {
      const rowNum = 2 + idx;
      EXCEL_COLUMNS.forEach((c, i) => {
        wsMain.cell(rowNum, 1 + i).string(String(r[c.key] ?? ''));
      });
    });

    // Dropdown validations (values are in "Data Format" sheet)
    const lastRow = Math.max(2000, 1 + dataRows.length + 50);
    const idxByKey = Object.fromEntries(EXCEL_COLUMNS.map((c, i) => [c.key, 1 + i]));
    // Excel list validation references must start with "=" (otherwise Excel treats it as plain text)
    const mkRange = (rng) => `='${EXCEL_SHEETS.FORMAT}'!$${colLetter(rng.col)}$${rng.startRow}:$${colLetter(rng.col)}$${rng.endRow}`;

    // NOTE: excel validation flag "showDropDown" is inverted in the underlying XML (1 hides the arrow).
    // To ensure dropdowns always show, we don't set showDropDown at all.
    const addListValidation = (colKey, rng) => wsMain.addDataValidation({
      type: 'list',
      allowBlank: 1,
      sqref: `${colLetter(idxByKey[colKey])}2:${colLetter(idxByKey[colKey])}${lastRow}`,
      formulas: [mkRange(rng)]
    });
    addListValidation('gender', genderRange);
    addListValidation('state', stateRange);
    // City is dependent on State (same behavior as UI) using OFFSET+MATCH+COUNTIF over Data Format mapping table.
    // Data Format!$J$2:$J$N contains state keys (repeated), $K$2:$K$N contains cities.
    const stateColLetter = colLetter(idxByKey.state);
    const cityColLetter = colLetter(idxByKey.city);
    wsMain.addDataValidation({
      type: 'list',
      allowBlank: 1,
      sqref: `${cityColLetter}2:${cityColLetter}${lastRow}`,
      formulas: [
        `=OFFSET('${EXCEL_SHEETS.FORMAT}'!$K$2, MATCH($${stateColLetter}2,'${EXCEL_SHEETS.FORMAT}'!$J$2:$J$${mapEndRow},0)-1, 0, COUNTIF('${EXCEL_SHEETS.FORMAT}'!$J$2:$J$${mapEndRow}, $${stateColLetter}2), 1)`
      ]
    });
    addListValidation('hobbies', hobbyRange);
    addListValidation('techInterests', techRange);

    // DOB: prevent future dates (Excel-side). Users can still type, but invalid values are blocked.
    wsMain.addDataValidation({
      type: 'date',
      operator: 'lessThanOrEqual',
      allowBlank: 1,
      sqref: `${colLetter(idxByKey.dob)}2:${colLetter(idxByKey.dob)}${lastRow}`,
      formulas: ['=TODAY()']
    });

    const fileName = `Users_Template_${mode === 'data' ? 'With_Data' : 'Blank'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    const buf = await wb.writeToBuffer();
    return res.status(200).end(buf);
  } catch (err) {
    console.error('Error generating excel template:', err.message);
    return res.status(500).json({ message: 'Internal server error: ' + err.message });
  }
};

// POST /api/users/bulk?dryRun=true|false (expects multer field: file)
const bulkUpsertFromExcel = (pool) => async (req, res) => {
  const dryRun = String(req.query.dryRun || 'false').toLowerCase() === 'true';
  try {
    if (!req.file?.buffer) return res.status(400).json({ message: 'Excel file is required (multipart field: file)' });
    const lookups = buildLookups();

    const wb = xlsx.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const sheetName = wb.SheetNames.find((n) => n === EXCEL_SHEETS.MAIN) || wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    if (!ws) return res.status(400).json({ message: 'No sheets found in Excel file' });

    // Read as raw matrix to avoid header casing issues from Excel (e.g., Userid vs UserId)
    const matrix = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' });
    if (!matrix.length) return res.status(400).json({ message: 'Excel sheet is empty' });
    const headerRow = matrix[0].map((h) => String(h || '').trim());
    const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    const headerIndex = Object.fromEntries(headerRow.map((h, i) => [norm(h), i]));
    const expected = EXCEL_COLUMNS.map((c) => c.header);
    const missing = expected.filter((h) => headerIndex[norm(h)] === undefined);
    if (missing.length) return res.status(400).json({ message: 'Template columns mismatch. Missing: ' + missing.join(', ') });

    const rows = matrix.slice(1).filter((r) => r.some((c) => String(c || '').trim() !== ''));

    const addList = [];
    const editList = [];
    const errorDetails = [];
    const failedRows = [];

    const seenEmails = new Set();
    const seenUsernames = new Set();

    rows.forEach((r, idx) => {
      const rowNumber = 2 + idx;
      const obj = {};
      EXCEL_COLUMNS.forEach((c) => {
        obj[c.key] = r[headerIndex[norm(c.header)]];
      });

      const id = String(obj.id ?? '').trim();
      const mode = id ? 'EDIT' : 'ADD';

      // normalize list/date inputs for validation + DB
      obj.hobbies = normalizeListCell(obj.hobbies);
      obj.techInterests = normalizeListCell(obj.techInterests);
      obj.dob = normalizeDateCell(obj.dob);

      const { errors, normalized } = validateRow(obj, lookups, mode);

      const emailKey = String(normalized.email || '').trim().toLowerCase();
      const userKey = String(normalized.username || '').trim();
      if (emailKey) {
        const k = `${mode}:${emailKey}`;
        if (seenEmails.has(k)) errors.push('Duplicate email within file');
        seenEmails.add(k);
      }
      if (userKey) {
        const k = `${mode}:${userKey}`;
        if (seenUsernames.has(k)) errors.push('Duplicate username within file');
        seenUsernames.add(k);
      }

      if (errors.length) {
        const reason = errors.join('; ');
        errorDetails.push({ rowNumber, reason });
        failedRows.push({ ...normalized, __errorReason: reason });
        return;
      }

      if (mode === 'ADD') addList.push({ rowNumber, ...normalized });
      else editList.push({ rowNumber, ...normalized, id });
    });

    // DB-level uniqueness + id existence checks for valid rows
    if (addList.length || editList.length) {
      const emails = [...new Set([...addList, ...editList].map((r) => String(r.email || '').trim().toLowerCase()).filter(Boolean))];
      const usernames = [...new Set([...addList, ...editList].map((r) => String(r.username || '').trim()).filter(Boolean))];
      const ids = [...new Set(editList.map((r) => String(r.id || '').trim()).filter(Boolean))];

      const params = [];
      const where = [];
      if (emails.length) { where.push(`LOWER(email) IN (${emails.map(() => '?').join(',')})`); params.push(...emails); }
      if (usernames.length) { where.push(`username IN (${usernames.map(() => '?').join(',')})`); params.push(...usernames); }
      const existingByEmail = new Map();
      const existingByUsername = new Map();
      if (where.length) {
        const [existing] = await pool.query(`SELECT id, LOWER(email) as email, username FROM users WHERE ${where.join(' OR ')}`, params);
        existing.forEach((u) => { if (u.email) existingByEmail.set(u.email, u.id); if (u.username) existingByUsername.set(u.username, u.id); });
      }

      let existingIds = new Set();
      if (ids.length) {
        const [idRows] = await pool.query(`SELECT id FROM users WHERE id IN (${ids.map(() => '?').join(',')})`, ids);
        existingIds = new Set(idRows.map((r) => r.id));
      }

      const markError = (row, reason) => {
        errorDetails.push({ rowNumber: row.rowNumber, reason });
        failedRows.push({ ...row, __errorReason: reason });
      };

      const addOk = [];
      addList.forEach((r) => {
        if (r.email && existingByEmail.has(r.email)) return markError(r, 'Email already exists');
        if (r.username && existingByUsername.has(r.username)) return markError(r, 'Username already exists');
        addOk.push(r);
      });

      const editOk = [];
      editList.forEach((r) => {
        if (!existingIds.has(r.id)) return markError(r, 'UserId not found');
        if (r.email && existingByEmail.has(r.email) && existingByEmail.get(r.email) !== r.id) return markError(r, 'Email belongs to another user');
        if (r.username && existingByUsername.has(r.username) && existingByUsername.get(r.username) !== r.id) return markError(r, 'Username belongs to another user');
        editOk.push(r);
      });

      addList.length = 0; addList.push(...addOk);
      editList.length = 0; editList.push(...editOk);
    }

    // IMPORTANT: If user downloads "template with data", all rows contain UserId.

    if (dryRun) {
      return res.json({
        errorCount: errorDetails.length,
        errorDetails,
        errorFileBase64: failedRows.length ? await buildErrorWorkbookBase64(failedRows) : null
      });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Bulk INSERT for ADD (2 queries: users + interests)
      if (addList.length) {
        const userRows = [];
        const interestRows = [];
        for (const r of addList) {
          const id = uuidv4();
          const saltRounds = await bcrypt.genSalt(10);
          const passwordHash = await bcrypt.hash(String(r.password), saltRounds);
          userRows.push([id, String(r.name).trim(), String(r.email).trim().toLowerCase(), String(r.username).trim(), passwordHash]);
          interestRows.push([
            id,
            sanitizeValue(r.mobile),
            extractCreditCardLast4(String(r.creditCard || '')),
            sanitizeValue(r.state),
            sanitizeValue(r.city),
            String(r.gender || 'Male'),
            JSON.stringify(normalizeListCell(r.hobbies)),
            JSON.stringify(normalizeListCell(r.techInterests)),
            sanitizeValue(r.address),
            sanitizeValue(normalizeDateCell(r.dob))
          ]);
        }
        await connection.query('INSERT INTO users (id, name, email, username, password_hash) VALUES ?', [userRows]);
        await connection.query(
          'INSERT INTO user_interests (user_id, mobile, credit_card_last4, state, city, gender, hobbies, tech_interests, address, dob) VALUES ?',
          [interestRows]
        );
      }

      // Bulk UPDATE for EDIT (2 queries total: users UPDATE + interests UPSERT)
      if (editList.length) {
        const ids = editList.map((r) => r.id);

        // 1) UPDATE users with CASE (single query)
        const mkCase = (field) =>
          `CASE id ${editList.map(() => 'WHEN ? THEN ?').join(' ')} ELSE ${field} END`;

        const caseParams = [];
        const pushCaseParams = (mapFn) => {
          editList.forEach((r) => { caseParams.push(r.id, mapFn(r)); });
        };
        pushCaseParams((r) => String(r.name).trim());
        pushCaseParams((r) => String(r.username).trim());
        pushCaseParams((r) => String(r.email).trim().toLowerCase());

        await connection.query(
          `UPDATE users
           SET name = ${mkCase('name')},
               username = ${mkCase('username')},
               email = ${mkCase('email')},
               updated_at = CURRENT_TIMESTAMP
           WHERE id IN (${ids.map(() => '?').join(',')})`,
          [...caseParams, ...ids]
        );

        // 2) UPSERT user_interests using ON DUPLICATE KEY UPDATE (single query)
        const interestValues = editList.map((r) => ([
          r.id,
          sanitizeValue(r.mobile),
          extractCreditCardLast4(String(r.creditCard || '')),
          sanitizeValue(r.state),
          sanitizeValue(r.city),
          String(r.gender || 'Male'),
          JSON.stringify(normalizeListCell(r.hobbies)),
          JSON.stringify(normalizeListCell(r.techInterests)),
          sanitizeValue(r.address),
          sanitizeValue(normalizeDateCell(r.dob))
        ]));

        await connection.query(
          `INSERT INTO user_interests
           (user_id, mobile, credit_card_last4, state, city, gender, hobbies, tech_interests, address, dob)
           VALUES ?
           ON DUPLICATE KEY UPDATE
             mobile = VALUES(mobile),
             credit_card_last4 = VALUES(credit_card_last4),
             state = VALUES(state),
             city = VALUES(city),
             gender = VALUES(gender),
             hobbies = VALUES(hobbies),
             tech_interests = VALUES(tech_interests),
             address = VALUES(address),
             dob = VALUES(dob)`,
          [interestValues]
        );
      }

      await connection.commit();
      return res.json({
        errorCount: errorDetails.length,
        errorDetails,
        errorFileBase64: failedRows.length ? await buildErrorWorkbookBase64(failedRows) : null
      });
    } catch (err) {
      await connection.rollback();
      console.error('Bulk upsert DB error:', err.message);
      return res.status(500).json({ message: 'Internal server error: ' + err.message });
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Bulk upsert parse/validate error:', err.message);
    return res.status(500).json({ message: 'Internal server error: ' + err.message });
  }
};

// List all users with joined interests
const getAllUsers = (pool) => async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.username,
        u.created_at,
        u.updated_at,
        ui.mobile,
        ui.credit_card_last4,
        ui.state,
        ui.city,
        ui.gender,
        ui.hobbies,
        ui.tech_interests,
        ui.address,
        ui.dob
      FROM users u
      LEFT JOIN user_interests ui ON u.id = ui.user_id
      ORDER BY u.created_at DESC
    `);

    const users = rows.map((r) => {
      const creditCardLast4 = sanitizeValue(r.credit_card_last4);
      // Format DOB as YYYY-MM-DD string (MySQL DATE type comes as Date object)
      let dobFormatted = null;
      if (r.dob) {
        const d = r.dob instanceof Date ? r.dob : new Date(r.dob);
        if (!isNaN(d.getTime())) {
          dobFormatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
      }
      
      return {
        id: r.id,
        name: r.name,
        email: r.email,
        username: r.username,
        created_at: formatTimestamp(r.created_at),
        updated_at: formatTimestamp(r.updated_at),
        mobile: sanitizeValue(r.mobile),
        creditCard: creditCardLast4 ? '************' + creditCardLast4 : null,
        state: sanitizeValue(r.state),
        city: sanitizeValue(r.city),
        gender: r.gender || 'Male',
        hobbies: Array.isArray(parseJsonField(r.hobbies)) ? parseJsonField(r.hobbies) : [],
        techInterests: Array.isArray(parseJsonField(r.tech_interests)) ? parseJsonField(r.tech_interests) : [],
        address: sanitizeValue(r.address),
        dob: dobFormatted
      };
    });


    return res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err.message);
    return res.status(500).json({
      message: 'Internal server error: ' + err.message
    });
  }
};

// Get single user by id with details
const getUserById = (pool) => async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.username,
        ui.mobile,
        ui.credit_card_last4,
        ui.state,
        ui.city,
        ui.gender,
        ui.hobbies,
        ui.tech_interests,
        ui.address,
        ui.dob
      FROM users u
      LEFT JOIN user_interests ui ON u.id = ui.user_id
      WHERE u.id = ?
    `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = rows[0];
    const creditCardLast4 = sanitizeValue(user.credit_card_last4);
    
    // Format DOB as YYYY-MM-DD string
    let dobFormatted = null;
    if (user.dob) {
      const d = user.dob instanceof Date ? user.dob : new Date(user.dob);
      if (!isNaN(d.getTime())) {
        dobFormatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
    }

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      mobile: sanitizeValue(user.mobile),
      creditCard: creditCardLast4 ? '************' + creditCardLast4 : null,
      state: sanitizeValue(user.state),
      city: sanitizeValue(user.city),
      gender: user.gender || 'Male',
      hobbies: Array.isArray(parseJsonField(user.hobbies)) ? parseJsonField(user.hobbies) : [],
      techInterests: Array.isArray(parseJsonField(user.tech_interests)) ? parseJsonField(user.tech_interests) : [],
      address: sanitizeValue(user.address),
      dob: dobFormatted
    });
  } catch (err) {
    console.error('Error fetching user:', err.message);
    return res.status(500).json({
      message: 'Internal server error: ' + err.message
    });
  }
};

// Create new user + interests (Cafeteria member registration)
const createUser = (pool) => async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
      name,
      email,
      mobile,
      creditCard,
      state,
      city,
      gender,
      hobbies,
      techInterests,
      address,
      username,
      password,
      dob
    } = req.body;


    // Validate required fields (aligned with frontend form)
    if (!name || !email || !mobile || !state || !city || !username || !password) {
      await connection.release();
      return res.status(400).json({
        message:
          'Required fields: name, email, mobile, state, city, username, password'
      });
    }

    if (!Array.isArray(hobbies) || hobbies.length === 0) {
      await connection.release();
      return res.status(400).json({
        message: 'Please select at least one hobby'
      });
    }

    if (!Array.isArray(techInterests) || techInterests.length === 0) {
      await connection.release();
      return res.status(400).json({
        message: 'Please select at least one tech interest'
      });
    }

    await connection.beginTransaction();

    // Check if user exists by username or email
    const [existing] = await connection.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existing.length > 0) {
      await connection.rollback();
      await connection.release();
      return res.status(400).json({
        message: 'Username or email already exists.'
      });
    }

    // Generate UUID and hash password
    const userId = uuidv4();
    const saltRounds = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert into users table
    await connection.query(
      'INSERT INTO users (id, name, email, username, password_hash) VALUES (?, ?, ?, ?, ?)',
      [userId, name, email, username, passwordHash]
    );

    await connection.query(
      `
      INSERT INTO user_interests 
      (user_id, mobile, credit_card_last4, state, city, gender, hobbies, tech_interests, address, dob)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        userId,
        sanitizeValue(mobile),
        extractCreditCardLast4(creditCard),
        sanitizeValue(state),
        sanitizeValue(city),
        gender || 'Male',
        JSON.stringify(hobbies),
        JSON.stringify(techInterests),
        sanitizeValue(address),
        sanitizeValue(dob)
      ]
    );

    await connection.commit();

    return res.status(201).json({
      message: 'User created successfully',
      id: userId
    });
  } catch (err) {
    await connection.rollback();
    console.error('Error creating user:', err.message);
    return res.status(500).json({
      message: 'Internal server error: ' + err.message
    });
  } finally {
    connection.release();
  }
};

// Update existing user + interests
const updateUser = (pool) => async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const {
      name,
      username,
      email,
      mobile,
      creditCard,
      state,
      city,
      gender,
      hobbies,
      techInterests,
      address,
      dob
    } = req.body;

    await connection.beginTransaction();

    // Update users table (username is not editable)
    await connection.query(
      'UPDATE users SET name = ?,username=?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name,username, email, id]
    );

    // Check if user_interests row exists for this user
    const [interestRows] = await connection.query(
      'SELECT user_id FROM user_interests WHERE user_id = ?',
      [id]
    );

    const creditCardLast4 = extractCreditCardLast4(creditCard);

    if (interestRows.length === 0) {
      // No interests row yet (e.g. user registered via /register) → INSERT one
      await connection.query(
        `
        INSERT INTO user_interests
        (user_id, mobile, credit_card_last4, state, city, gender, hobbies, tech_interests, address, dob)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          id,
          sanitizeValue(mobile),
          creditCardLast4,
          sanitizeValue(state),
          sanitizeValue(city),
          gender || 'Male',
          JSON.stringify(hobbies || []),
          JSON.stringify(techInterests || []),
          sanitizeValue(address),
          sanitizeValue(dob)
        ]
      );
    } else {
      // Update existing interests row
      await connection.query(
        `
        UPDATE user_interests 
        SET mobile = ?, credit_card_last4 = ?, state = ?, city = ?, gender = ?, 
            hobbies = ?, tech_interests = ?, address = ?, dob = ?
        WHERE user_id = ?
      `,
        [
          sanitizeValue(mobile),
          creditCardLast4,
          sanitizeValue(state),
          sanitizeValue(city),
          gender || 'Male',
          JSON.stringify(hobbies || []),
          JSON.stringify(techInterests || []),
          sanitizeValue(address),
          sanitizeValue(dob),
          id
        ]
      );
    }

    await connection.commit();

    return res.json({ message: 'User updated successfully' });
  } catch (err) {
    await connection.rollback();
    console.error('Error updating user:', err.message);
    return res.status(500).json({
      message: 'Internal server error: ' + err.message
    });
  } finally {
    connection.release();
  }
};

// Delete user
const deleteUser = (pool) => async (req, res) => {
  try {
    const { id } = req.params;

    // Foreign key constraint will automatically delete user_interests
    await pool.query('DELETE FROM users WHERE id = ?', [id]);

    return res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err.message);
    return res.status(500).json({
      message: 'Internal server error: ' + err.message
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getLookups,
  downloadExcelTemplate,
  bulkUpsertFromExcel
};

