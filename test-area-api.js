// Test script to check GetAreaClass API response format
// Usage: node test-area-api.js <applicationId> <accessKey>

const appId = process.argv[2];
const accessKey = process.argv[3];

if (!appId || !accessKey) {
    console.log('Usage: node test-area-api.js <applicationId> <accessKey>');
    process.exit(1);
}

async function main() {
    const params = new URLSearchParams({
        applicationId: appId,
        accessKey,
        formatVersion: '2',
        format: 'json',
    });

    const url = `https://openapi.rakuten.co.jp/engine/api/Travel/GetAreaClass/20140210?${params.toString()}`;

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${accessKey}`,
            'Referer': 'https://rlist-seven.vercel.app/',
            'Origin': 'https://rlist-seven.vercel.app',
        },
    });

    const data = await response.json();

    // Show top-level keys
    console.log('=== TOP LEVEL KEYS ===');
    console.log(Object.keys(data));

    // Show structure of areaClasses
    if (data.areaClasses) {
        console.log('\n=== areaClasses keys ===');
        console.log(Object.keys(data.areaClasses));

        const largeClasses = data.areaClasses.largeClasses;
        if (largeClasses) {
            console.log('\n=== largeClasses (count) ===');
            console.log(largeClasses.length);

            // Show first largeClass structure
            console.log('\n=== First largeClass structure ===');
            console.log(JSON.stringify(largeClasses[0], null, 2).slice(0, 2000));

            // Find shizuoka
            for (const large of largeClasses) {
                const middleClasses = large.middleClasses || [];
                for (const middle of middleClasses) {
                    // Check for shizuoka
                    const mInfo = middle.middleClass;
                    const code = Array.isArray(mInfo) ? mInfo[0]?.middleClassCode : mInfo?.middleClassCode;
                    if (code === 'shizuoka') {
                        console.log('\n=== SHIZUOKA FULL STRUCTURE ===');
                        console.log(JSON.stringify(middle, null, 2));
                    }
                }
            }
        }
    } else {
        console.log('\n=== FULL RESPONSE (first 3000 chars) ===');
        console.log(JSON.stringify(data, null, 2).slice(0, 3000));
    }
}

main().catch(err => console.error(err));
