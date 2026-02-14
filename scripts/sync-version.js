import fs from 'node:fs';
import path from 'node:path';

const packageJsonPath = path.join(process.cwd(), 'package.json');
const stringsJsonPath = path.join(process.cwd(), 'src', 'strings.json');

try {
    // Read package.json
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const version = packageJson.version;

    // Generate timestamp in UTC
    const now = new Date();
    const timestamp = now.toISOString();

    process.stdout.write(`Syncing version ${version} and build ${timestamp} to strings.json...`);

    // Read strings.json
    const stringsJson = JSON.parse(fs.readFileSync(stringsJsonPath, 'utf8'));

    // Update metadata
    if (stringsJson.payload && stringsJson.payload.meta) {
        stringsJson.payload.meta.version = version;
        stringsJson.payload.meta.build = timestamp;
    } else {
        throw new Error('Could not find payload.meta in strings.json');
    }

    // Write strings.json
    fs.writeFileSync(stringsJsonPath, JSON.stringify(stringsJson, null, 2) + '\n');
    process.stdout.write(' Done.\n');

} catch (error) {
    console.error('\nError syncing version to strings.json:');
    console.error(error.message);
    process.exit(1);
}
