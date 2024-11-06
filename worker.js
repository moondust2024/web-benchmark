self.onmessage = function(e) {
    const { start, end, type } = e.data;
    const startTime = performance.now();

    let result;
    if (type === 'float') {
        result = computeLightFloatTask(start, end);
    } else if (type === 'int') {
        result = computeHeavyIntTask(start, end);
    }

    self.postMessage({ result, startTime });
};

function computeLightFloatTask(start, end) {
    let sum = 0;
    for (let i = start; i < end; i++) {
        sum += Math.sqrt(i);
    }
    return sum;
}

function computeHeavyIntTask(start, end) {
    let sum = 0;
    for (let i = start; i < end; i++) {
        sum += i * i + ((i & 1) ? i : 0);
    }
    return sum;
}