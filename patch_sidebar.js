const fs = require('fs');
const path = require('path');

const directoryPath = 'c:\\Users\\DELL\\Downloads\\Telegram Desktop\\FAITHWAY 2\\FAITHWAY';
const files = [
    'categories.html', 'ceo-portal.html', 'company-portal.html', 'credit-customers.html',
    'customers.html', 'dashboard.html', 'inventory.html', 'locations.html',
    'pos-register.html', 'profitability.html', 'promotions.html', 'reports.html',
    'sales-dashboard.html', 'settings.html', 'tax-management.html'
];

files.forEach((file) => {
    const filePath = path.join(directoryPath, file);
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Reduce padding and font size in CSS
    content = content.replace(/\.nav-item \{([^}]+)padding: [^;]+;([^}]+)\}/g, (match, p1, p2) => {
        return `.nav-item {${p1}padding: 8px 20px; font-size: 13px;${p2}}`;
    });
    content = content.replace(/\.nav-section \{([^}]+)padding: [^;]+;([^}]+)\}/g, (match, p1, p2) => {
        return `.nav-section {${p1}padding: 8px 20px 2px; font-size: 10px;${p2}}`;
    });

    // 2. Consolidate items in HTML
    // We'll remove the headers and group some items if they exist
    
    // Remove "Sales & Finance" and "Operations" headers
    content = content.replace(/<div class="nav-section">Sales & Finance<\/div>/g, '');
    content = content.replace(/<div class="nav-section">Operations<\/div>/g, '');

    // Rename some items to be shorter
    content = content.replace(/Sales Dashboard/g, 'Sales');
    content = content.replace(/Profitability/g, 'Profits');
    content = content.replace(/Inventory & Supply Chain/g, 'Inventory');
    content = content.replace(/Staff Management/g, 'Staff');
    content = content.replace(/Credit Clients/g, 'Clients');

    // Remove Promotions from sidebar to save space (it's accessible via other ways or just keep it small)
    // content = content.replace(/<a href="promotions" class="nav-item"><i class="fas fa-tags"><\/i> Promotions<\/a>/g, '');

    fs.writeFileSync(filePath, content);
    console.log(`Patched sidebar in ${file}`);
});
