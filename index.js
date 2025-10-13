// Net speed test (image download based)
// This implementation fetches the image as a blob to reliably read its size
// and runs tests sequentially to avoid racing and inaccurate timings.

let bitSpeedEl = document.getElementById("bits");
let kbSpeedEl = document.getElementById("kbs");
let mbSpeedEl = document.getElementById("mbs");
let infoEl = document.getElementById("info");
let runBtn = document.getElementById("runBtn");

let numTests = 3; // number of tests to average
let currentTest = 0;
let totals = { bits: 0, kb: 0, mb: 0 };

let abortController = null;

// Use picsum.photos for random images (more predictable for direct fetch/blob)
// We'll append a timestamp to avoid cached responses.
const imageApiBase = "https://picsum.photos/800/600";

async function runTest() {
    infoEl.textContent = `Testing... (${currentTest + 1}/${numTests})`;
    // Disable the run button while running
    if (runBtn) runBtn.disabled = true;

    // Start timer
    const start = performance.now();

    // Fetch the image as a blob to get exact size
    try {
    // support cancellation if user triggers another run
    abortController = new AbortController();
    // append a cache-busting timestamp so each request is unique
    const url = `${imageApiBase}?_=${Date.now()}_${Math.random()}`;
    const response = await fetch(url, { cache: "no-store", signal: abortController.signal });
        const blob = await response.blob();
        const end = performance.now();

        const bytes = blob.size;
        const seconds = (end - start) / 1000;

        // Avoid division by zero
        if (seconds <= 0) throw new Error("Measured time is zero");

        const bits = bytes * 8;
        const bitsPerSec = bits / seconds;
        const kbPerSec = bitsPerSec / 1024;
        const mbPerSec = kbPerSec / 1024;

        totals.bits += bitsPerSec;
        totals.kb += kbPerSec;
        totals.mb += mbPerSec;

        currentTest++;

        if (currentTest < numTests) {
            // small delay between tests to reduce server-side caching effects
            await new Promise((r) => setTimeout(r, 300));
            return runTest();
        }

        // All tests done — calculate averages
        const avgBits = (totals.bits / numTests).toFixed(2);
        const avgKb = (totals.kb / numTests).toFixed(2);
        const avgMb = (totals.mb / numTests).toFixed(2);

        bitSpeedEl.querySelector("span").textContent = ` ${avgBits} bps`;
        kbSpeedEl.querySelector("span").textContent = ` ${avgKb} Kbps`;
        mbSpeedEl.querySelector("span").textContent = ` ${avgMb} Mbps`;
        infoEl.textContent = "Test Completed!";
        if (runBtn) runBtn.disabled = false;
    } catch (err) {
        if (err.name === 'AbortError') {
            infoEl.textContent = 'Test aborted.';
        } else {
            console.error("Speed test error:", err);
            infoEl.textContent = "Error running test. Check console.";
        }
        if (runBtn) runBtn.disabled = false;
    }
}

// Start tests when page loads
window.addEventListener("load", () => {
    // Reset state (useful if script is re-run)
    currentTest = 0;
    totals = { bits: 0, kb: 0, mb: 0 };

    // Ensure spans exist before running
    if (!bitSpeedEl || !kbSpeedEl || !mbSpeedEl || !infoEl) {
        console.error("Required DOM elements not found");
        return;
    }

    // Wire run button
    if (runBtn) {
        runBtn.addEventListener('click', () => {
            // If a test is already running, abort it and reset
            if (abortController) {
                abortController.abort();
                abortController = null;
            }

            // reset UI
            bitSpeedEl.querySelector("span").textContent = " Speed In Bps: ";
            kbSpeedEl.querySelector("span").textContent = " Speed In Kbs: ";
            mbSpeedEl.querySelector("span").textContent = " Speed In Mbs: ";
            currentTest = 0;
            totals = { bits: 0, kb: 0, mb: 0 };

            runTest();
        });
    }

    // Optionally start automatically once on load
    // runTest();
});