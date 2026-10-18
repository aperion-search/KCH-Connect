const fs = require('fs');
const path = require('path');

const csvFilePath = path.join(__dirname, 'KCH Madrasa Wajihiyah Attendance List 2025-26 - Sheet1.csv');
const jsonFilePath = path.join(__dirname, 'data', 'students.json');

function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length === 0) return [];

    // Parse line respecting quotes
    function parseLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    }

    const headers = parseLine(lines[0]);
    const students = [];

    for (let i = 1; i < lines.length; i++) {
        const row = parseLine(lines[i]);
        if (row.length >= 2 && row[0]) {
            students.push({
                id: row[0],
                rollId: row[0],
                name: row[1],
                grade: row[2] || '',
                division: row[3] || '',
                phone: row[4] || '',
                gender: row[5] || '',
                email: row[6] || '',
                contactNos: row[7] || '',
                arabicName: row[8] || '',
                hdob: row[10] || ''
            });
        }
    }
    return students;
}

const csvData = fs.readFileSync(csvFilePath, 'utf8');
const students = parseCSV(csvData);
fs.writeFileSync(jsonFilePath, JSON.stringify(students, null, 2), 'utf8');
console.log(`Successfully converted ${students.length} students to ${jsonFilePath}`);
