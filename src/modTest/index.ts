function walkObject(root: any, rootName = "mod", maxDepth = 2) {
    const seen = new WeakSet<object>();

    function walk(obj: any, path: string, depth: number) {
        if (!obj || (typeof obj !== "object" && typeof obj !== "function")) return;
        if (depth > maxDepth) return;
        if (typeof obj === "object" || typeof obj === "function") {
            if (seen.has(obj)) return;
            seen.add(obj);
        }

        for (const key of Reflect.ownKeys(obj)) {
            const k = String(key);
            const childPath = path + "." + k;

            let t = "unknown";
            let v: any;
            try {
                v = obj[key as any];
                t = typeof v;
            } catch {
                t = "inaccessible";
            }

            console.log(childPath, "=>", t);

            if (v && (typeof v === "object" || typeof v === "function")) {
                walk(v, childPath, depth + 1);
            }
        }
    }

    walk(root, rootName, 0);
}

function listModNamespace() {
    const modAny = (globalThis as any).mod;

    if (!modAny) {
        console.log("mod is not available on globalThis");
        return;
    }

    // Own keys (includes non-enumerable + symbols)
    const keys = Reflect.ownKeys(modAny);

    const rows = keys.map((k) => {
        const key = String(k);
        let valueType = "unknown";
        try {
            valueType = typeof modAny[k as any];
        } catch {
            valueType = "inaccessible";
        }
        return { key, type: valueType };
    });

    // Sort for readable output
    rows.sort((a, b) => a.key.localeCompare(b.key));

    console.log("mod.* members:", rows.length);
    for (const row of rows) {
        console.log(row.key, "=>", row.type);
    }
}

listModNamespace();
walkObject((globalThis as any).mod, "mod", 2);

