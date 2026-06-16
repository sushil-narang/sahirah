// ================================================================
// assets/js/csv-handler.js — CSV parsing & validation utilities
// ================================================================

const CSVHandler = {
  /**
   * Parse CSV string into array of objects
   * @param {string} csvText - Raw CSV text
   * @param {string} filename - Original filename for validation
   * @returns {Object} {headers, rows, errors}
   */
  parseCSV(csvText, filename) {
    const lines = csvText.trim().split('\n');

    if (lines.length < 2) {
      return {
        success: false,
        error: 'CSV must have headers and at least one data row',
        headers: [],
        rows: [],
        errors: []
      };
    }

    // Check file size (max 5000 rows)
    if (lines.length - 1 > 5000) {
      return {
        success: false,
        error: 'CSV exceeds maximum of 5,000 student records',
        headers: [],
        rows: [],
        errors: [],
        warning: `File has ${lines.length - 1} rows. Only first 5,000 will be imported.`
      };
    }

    // Parse headers
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    // Validate required fields
    const requiredFields = ['student_first_name', 'student_last_name', 'student_class', 'student_email'];
    const missingRequired = requiredFields.filter(f => !headers.includes(f));

    if (missingRequired.length > 0) {
      return {
        success: false,
        error: `Missing required columns: ${missingRequired.join(', ')}`,
        headers: [],
        rows: [],
        errors: []
      };
    }

    // Parse data rows
    const rows = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const values = CSVHandler.parseCSVLine(lines[i]);
      const row = {};
      const rowErrors = [];

      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });

      // Validate each row
      const validation = CSVHandler.validateRow(row, i + 1, rows);

      if (!validation.valid) {
        errors.push({
          lineNumber: i + 1,
          row: row,
          errors: validation.errors
        });
      } else {
        rows.push({
          lineNumber: i + 1,
          ...row,
          valid: true
        });
      }
    }

    return {
      success: true,
      headers: headers,
      rows: rows,
      validCount: rows.length,
      errorCount: errors.length,
      errors: errors,
      warning: errors.length > 0 ? `${errors.length} rows have errors and will be skipped` : null
    };
  },

  /**
   * Parse a single CSV line (handles quoted fields)
   */
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  },

  /**
   * Validate a single row
   */
  validateRow(row, lineNumber, previousRows = []) {
    const errors = [];

    // Required fields
    if (!row.student_first_name || row.student_first_name.length === 0) {
      errors.push('First name is required');
    }
    if (!row.student_last_name || row.student_last_name.length === 0) {
      errors.push('Last name is required');
    }
    if (!row.student_class || row.student_class.length === 0) {
      errors.push('Class/Grade is required');
    }
    if (!row.student_email || row.student_email.length === 0) {
      errors.push('Email is required');
    }

    // Field length checks
    if (row.student_first_name && row.student_first_name.length > 50) {
      errors.push('First name exceeds 50 characters');
    }
    if (row.student_last_name && row.student_last_name.length > 50) {
      errors.push('Last name exceeds 50 characters');
    }

    // Email validation
    if (row.student_email) {
      if (!CSVHandler.isValidEmail(row.student_email)) {
        errors.push('Invalid email format');
      }

      // Check for duplicates in same upload
      if (previousRows.some(r => r.student_email === row.student_email)) {
        errors.push('Duplicate email in upload');
      }
    }

    // DOB validation
    if (row.student_dob) {
      if (!CSVHandler.isValidDate(row.student_dob)) {
        errors.push('Invalid DOB format (use YYYY-MM-DD)');
      } else {
        const age = CSVHandler.getAge(row.student_dob);
        if (age < 8 || age > 25) {
          errors.push('Student age must be between 8-25 years');
        }
      }
    }

    // Phone validation
    if (row.parent_phone && !/^\d{10,15}$/.test(row.parent_phone.replace(/\D/g, ''))) {
      errors.push('Parent phone must be 10-15 digits');
    }
    if (row.student_phone && !/^\d{10,15}$/.test(row.student_phone.replace(/\D/g, ''))) {
      errors.push('Student phone must be 10-15 digits');
    }

    // Optional field length checks
    if (row.parent_name && row.parent_name.length > 100) {
      errors.push('Parent name exceeds 100 characters');
    }
    if (row.city && row.city.length > 50) {
      errors.push('City exceeds 50 characters');
    }
    if (row.notes && row.notes.length > 200) {
      errors.push('Notes exceed 200 characters');
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  },

  /**
   * Validate email format
   */
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  /**
   * Validate date format (YYYY-MM-DD)
   */
  isValidDate(dateString) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  },

  /**
   * Calculate age from DOB
   */
  getAge(dob) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  },

  /**
   * Generate downloadable CSV template
   */
  generateTemplate() {
    const headers = [
      'student_first_name',
      'student_last_name',
      'student_dob',
      'student_class',
      'student_email',
      'parent_name',
      'parent_email',
      'parent_phone',
      'city',
      'notes'
    ];

    const sampleRows = [
      ['Aarav', 'Sharma', '2008-03-15', 'Class 12', 'aarav@example.com', 'Rajesh Sharma', 'rajesh@example.com', '9876543210', 'Delhi', 'Science student'],
      ['Ananya', 'Patel', '2008-05-22', 'Class 12', 'ananya@example.com', 'Priya Patel', 'priya@example.com', '9876543211', 'Mumbai', 'Top performer'],
      ['Arjun', 'Verma', '2007-11-10', 'Class 11', 'arjun@example.com', 'Vikram Verma', 'vikram@example.com', '9876543212', 'Bangalore', '']
    ];

    const allRows = [headers, ...sampleRows];
    const csv = allRows
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return {
      filename: `sahirah_student_template_${new Date().toISOString().split('T')[0]}.csv`,
      content: csv
    };
  },

  /**
   * Download CSV file
   */
  downloadCSV(filename, csvContent) {
    const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Download template with sample data
   */
  downloadTemplate() {
    const {filename, content} = CSVHandler.generateTemplate();
    CSVHandler.downloadCSV(filename, content);
  },

  /**
   * Sanitize text input
   */
  sanitizeText(text, maxLength = null) {
    let sanitized = String(text || '')
      .trim()
      .substring(0, maxLength || text.length)
      .replace(/[<>\"']/g, '');

    return sanitized;
  },

  /**
   * Format student data for database insertion
   */
  formatStudentData(row) {
    return {
      first_name: CSVHandler.sanitizeText(row.student_first_name, 50),
      last_name: CSVHandler.sanitizeText(row.student_last_name, 50),
      dob: row.student_dob || null,
      class: CSVHandler.sanitizeText(row.student_class),
      email: CSVHandler.sanitizeText(row.student_email),
      phone: row.student_phone ? CSVHandler.sanitizeText(row.student_phone) : null,
      parent_name: row.parent_name ? CSVHandler.sanitizeText(row.parent_name, 100) : null,
      parent_email: row.parent_email ? CSVHandler.sanitizeText(row.parent_email) : null,
      parent_phone: row.parent_phone ? CSVHandler.sanitizeText(row.parent_phone) : null,
      city: row.city ? CSVHandler.sanitizeText(row.city, 50) : null,
      notes: row.notes ? CSVHandler.sanitizeText(row.notes, 200) : null
    };
  }
};
