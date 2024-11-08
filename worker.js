self.onmessage = async function(e) {
    const { start, end, type } = e.data;
    const startTime = performance.now();    

    let result;
    if (type === 'float') {
        result = await computeLightFloatTask(start, end);
    } else if (type === 'int') {
        result = await computeHeavyIntTask(start, end);
    } else if (type === 'AES') {

        // 动态加载 crypto-js
        await loadCryptoJS();

        result = await testEncryption(start, end);
    } else if (type === 'pi') {

        // 动态加载 decimal-js
        await loadDecimalJS();

        result = await testPI(start, end);
    }

    self.postMessage({ result, startTime });
};

async function loadCryptoJS() {
    return new Promise((resolve, reject) => {
        try {
            importScripts('crypto-js.min.js');
            resolve();
        } catch (error) {
            console.error('Failed to load crypto-js.min.js:', error);
            reject(error);
        }
    });
}

async function loadDecimalJS() {
    return new Promise((resolve, reject) => {
        try {
            importScripts('decimal.min.js');
            resolve();
        } catch (error) {
            console.error('Failed to load decimal.min.js:', error);
            reject(error);
        }
    });
}

async function testPI(start, end) {
    Decimal.set({ precision: end + 1 });

        let a = new Decimal(1);
        let b = new Decimal(1).div(Decimal.sqrt(2));
        let t = new Decimal(1).div(4);
        let p = new Decimal(1);

        for (let i = 0; i < start; i++) {
            const aNext = a.plus(b).div(2);
            const bNext = Decimal.sqrt(a.mul(b));
            const tNext = t.minus(p.mul(a.minus(aNext).pow(2)));
            p = p.mul(2);

            a = aNext;
            b = bNext;
            t = tNext;
        }

        const pi = a.plus(b).pow(2).div(4).div(t);
        
        return pi.toDecimalPlaces(end).toString();
}

async function computeLightFloatTask(start, end) {
    let sum = 0;
    for (let i = start; i < end; i++) {
        sum += Math.sqrt(i);
    }
    return sum;
}

async function computeHeavyIntTask(start, end) {
    let sum = 0;
    for (let i = start; i < end; i++) {
        sum += i * i + (i % 2 ? i : 0);
    }
    return sum;
}

// 内置的测试数据
const testData = 'Hello, World!';

// 测试加密和解密的函数
async function testEncryption(start, end) {    
        const key = CryptoJS.lib.WordArray.random(32); // 256-bit key
        const iv = CryptoJS.lib.WordArray.random(16);  // 128-bit IV

        // 执行加密和解密循环
        for (let i = start; i < end; i++) {
            const encryptedData = await encrypt(testData, key, iv);
            await decrypt(encryptedData, key, iv);
        }
}

// 加密函数
function encrypt(data, key, iv) {
    return new Promise((resolve) => {
        const encrypted = CryptoJS.AES.encrypt(data, key, { iv: iv });
        resolve(encrypted.toString());
    });
}

// 解密函数
function decrypt(encryptedData, key, iv) {
    return new Promise((resolve) => {
        const decrypted = CryptoJS.AES.decrypt(encryptedData, key, { iv: iv });
        resolve(CryptoJS.enc.Utf8.stringify(decrypted));
    });
}