const https = require('https');
const fs = require('fs');

async function fetchProducts() {
    return new Promise((resolve, reject) => {
        https.get('https://wievhaxedotrhktkjupg.supabase.co/functions/v1/make-server-52d68140/products', (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function validate() {
    console.log("Fetching products...");
    const data = await fetchProducts();
    const products = data.products || [];
    console.log(`Fetched ${products.length} products.`);

    const imageMap = {};
    const brokenImages = [];
    const supabaseImages = [];
    const cloudinaryImages = [];

    const ALL_CATEGORIES = [
        'Square', 'Circle', 'Landscape', 'Portrait',
        '2 Set', '3 Set', '2-Set', '3-Set' // Focus on the broken ones
    ];

    for (const product of products) {
        let firstImage = null;
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            firstImage = product.images[0];
        } else if (product.image) {
            firstImage = product.image;
        }

        if (!firstImage) {
            // console.log(`Product ${product.id} has no image.`);
            continue;
        }

        // Classify URL
        if (firstImage.includes('supabase.co')) supabaseImages.push(firstImage);
        else if (firstImage.includes('cloudinary.com')) cloudinaryImages.push(firstImage);

        // Simulate mapping logic
        const cats = [];
        if (product.layout) cats.push(product.layout.charAt(0).toUpperCase() + product.layout.slice(1).toLowerCase());
        if (product.subsection) cats.push(product.subsection.replace('-', ' '));

        for (const cat of cats) {
            if (ALL_CATEGORIES.includes(cat) && !imageMap[cat]) {
                imageMap[cat] = { url: firstImage, id: product.id, name: product.name };
                console.log(`[ASSIGNED] ${cat} -> ${firstImage} (Product: ${product.name})`);
            }
        }
    }

    const report = {
        imageMap,
        brokenCategories: ALL_CATEGORIES.filter(cat => !imageMap[cat]),
        supabaseCount: supabaseImages.length,
        cloudinaryCount: cloudinaryImages.length,
        supabaseExamples: supabaseImages.slice(0, 3)
    };
    fs.writeFileSync('validation_report.json', JSON.stringify(report, null, 2));
    console.log("Report written to validation_report.json");
}

validate().catch(console.error);
