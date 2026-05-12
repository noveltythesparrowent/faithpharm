const fs = require('fs');
const path = require('path');

const dir = './';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

let updated = 0;
for (const file of files) {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf8');
    
    // Check if it has a sidebar definition with height: 100vh
    if (content.includes('.sidebar {') && content.includes('height: 100vh;')) {
        // Look for the specific pattern to replace
        // Note: ceo-portal and dashboard already have 100dvh
        if (!content.includes('height: 100dvh;')) {
            // Replace `height: 100vh;` inside the `.sidebar` block
            // A safer approach: find `height: 100vh;` and replace with `height: 100vh; height: 100dvh; overflow-y: auto;`
            // only if it's accompanied by `.sidebar {`
            content = content.replace(/(position:\s*fixed;\s*)height:\s*100vh;/g, '$1height: 100vh; height: 100dvh; overflow-y: auto;');
            fs.writeFileSync(p, content);
            updated++;
            console.log('Updated ' + file);
        }
    }
}
console.log(`Updated ${updated} files.`);
