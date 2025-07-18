const fs = require('fs');

// Llegir el fitxer CSV
const filePath = '3a avaluació 24-25 - Assoliments - 3r ESO.csv';
const fileContent = fs.readFileSync(filePath, 'utf8');
const lines = fileContent.split('\n').filter(line => line.trim() !== '');

console.log('=== ANÀLISI DEL FITXER CSV ===');
console.log(`Total de línies: ${lines.length}`);
console.log('');

// Mostrar les primeres 5 línies amb més detall
for (let i = 0; i < Math.min(5, lines.length); i++) {
    console.log(`Línia ${i + 1} (${lines[i].length} caràcters):`);
    console.log(`Raw: "${lines[i]}"`);
    console.log(`Primers 10 caràcters: "${lines[i].substring(0, 10)}"`);
    console.log(`Últims 10 caràcters: "${lines[i].substring(lines[i].length - 10)}"`);
    console.log(`Comença amb ": ${lines[i].startsWith('"')}`);
    console.log(`Acaba amb ": ${lines[i].endsWith('"')}`);
    console.log('');
}

// Funció per parsejar una línia CSV amb comilles escapades
function parseCSVLine(line) {
    const fields = [];
    let currentField = '';
    let insideQuotes = false;
    let i = 0;
    
    while (i < line.length) {
        const char = line[i];
        
        if (char === '"') {
            if (insideQuotes) {
                // Comprovar si és una comilla escapada
                if (i + 1 < line.length && line[i + 1] === '"') {
                    currentField += '"';
                    i += 2; // Saltar les dues comilles
                    continue;
                } else {
                    // Tancar comilles
                    insideQuotes = false;
                }
            } else {
                // Obrir comilles
                insideQuotes = true;
            }
        } else if (char === ',' && !insideQuotes) {
            // Separador de camp
            fields.push(currentField.trim());
            currentField = '';
        } else {
            currentField += char;
        }
        
        i++;
    }
    
    // Afegir l'últim camp
    fields.push(currentField.trim());
    
    return fields;
}

// Provar el parsing amb les primeres línies
console.log('=== PROVA DE PARSING ===');
for (let i = 0; i < Math.min(3, lines.length); i++) {
    console.log(`\nLínia ${i + 1}:`);
    const fields = parseCSVLine(lines[i]);
    console.log(`Camps trobats: ${fields.length}`);
    if (fields.length === 1) {
        console.log('PROBLEMA: Només 1 camp trobat!');
        console.log('Camp complet:', fields[0]);
    } else {
        console.log('Primers 5 camps:', fields.slice(0, 5));
        console.log('Últims 5 camps:', fields.slice(-5));
    }
}

// Provar netejant les comilles al inici i final
console.log('\n=== PROVA NETEGANT COMILLES ===');
for (let i = 2; i < Math.min(4, lines.length); i++) {
    console.log(`\nLínia ${i + 1} (original):`);
    console.log(`Raw: "${lines[i]}"`);
    
    // Netejar comilles al inici i final
    let cleanLine = lines[i];
    if (cleanLine.startsWith('"') && cleanLine.endsWith('"')) {
        cleanLine = cleanLine.substring(1, cleanLine.length - 1);
    }
    
    console.log(`Línia ${i + 1} (neteja):`);
    console.log(`Raw: "${cleanLine}"`);
    
    const fields = parseCSVLine(cleanLine);
    console.log(`Camps trobats: ${fields.length}`);
    console.log('Primers 5 camps:', fields.slice(0, 5));
} 