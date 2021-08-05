const puppeteer = require("puppeteer");
const readline = require("readline");

const MYALGO_PASSWORD = "pa55word"; // MyAlgoWallet policy: At least one number. At least one character. Minimum length is 8.
const puppeteerSettings = {
    headless: true, // HIDE (true) OR DISPLAY (false) THE BROWSER WINDOW
    userDataDir: "./user_data"
}


/* DONT EDIT ANYTHING BELOW (but also feel free to mess around :)) */

const ENTER = String.fromCharCode(13);
let browser;

// PRINTS TERMINAL STUFF WAITING FOR USER INPUT
function terminalPrompt(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) =>
        rl.question(query, (ans) => {
            rl.close();
            resolve(ans);
        })
    );
}


// CHECK IF MYALGO ACCOUNT IS CREATED
const checkAlgoWallet = async () => {
    browser = await puppeteer.launch(puppeteerSettings);
    const page = (await browser.pages())[0];
    await page.goto('https://wallet.myalgo.com/');
    await page.waitForSelector('input.input-password, div.home-image-1');

    // CHECKS IF THERE'S AN <input> IN PAGE, INDICATING A WALLET HAS BEEN STORED LOCALLY
    const walletCreated = await page.evaluate(() => !!document.querySelector('input.input-password')) // !! converts anything to boolean
    if (!walletCreated) {

        // WAIT FOR USER INPUT ON THE TERMINAL AFTER THE LOGIN IS DONE
        await terminalPrompt("No wallet data, please create a wallet and press ENTER");
        await browser.close();
        process.exit();
    }
    await browser.close();
}


// CONNECTS MY ALGO WALLET
const connectAlgoWallet = async browser => {
    let pages = await browser.pages();
    const yieldlyPage = pages[0];

    const myAlgoOpened = () => new Promise(res => browser.on('targetcreated', res)) // WAITS UNTIL MYALGOWALLET POPUP IS LOADED

    await yieldlyPage.waitForTimeout(5000);
    const [connectBtn] = await yieldlyPage.$x("//button[contains(., 'Connect Wallet')]");
    await connectBtn.click();

    await myAlgoOpened();

    pages = await browser.pages();
    let myAlgoPage = pages.find(page => page.url().indexOf("wallet.myalgo.com") > -1)

    await myAlgoPage.waitForSelector('input.input-password');

    await myAlgoPage.type('input.input-password', [MYALGO_PASSWORD, ENTER]);
    try {
        await myAlgoPage.waitForSelector('.title-preview');
        await myAlgoPage.click('.title-preview')
        await myAlgoPage.click('.custom-btn')
    } catch (e) { }
}

// CLAIM NLL REWARDS
const claimNLLRewards = async () => {
    browser = await puppeteer.launch(puppeteerSettings);
    let pages = await browser.pages();
    const yieldlyPage = pages[0];

    const myAlgoOpened = () => new Promise(res => browser.on('targetcreated', res))
    await yieldlyPage.goto('https://app.yieldly.finance/prize-games');

    await connectAlgoWallet(browser);

    await yieldlyPage.waitForTimeout(5000);

    const [claimBtn] = await yieldlyPage.$x("//button[text() = 'Claim']");
    await claimBtn.click();

    await yieldlyPage.waitForTimeout(2000);

    const [claimAmountYLDY] = await yieldlyPage.$$eval('input', inputs => inputs.map((input) => parseFloat(input.value)))
    if (claimAmountYLDY == 0) {
        await browser.close();
        return claimAmountYLDY;
    }

    await yieldlyPage.waitForTimeout(2000);

    const [nextBtn] = await yieldlyPage.$x("//button[text() = 'Next']");
    await nextBtn.click();

    await myAlgoOpened();

    pages = await browser.pages();
    myAlgoPage = pages.find(page => page.url().indexOf("wallet.myalgo.com") > -1)
    await myAlgoPage.waitForSelector('.custom-btn');
    await myAlgoPage.click('.custom-btn')
    await myAlgoPage.type('input.input-password', [MYALGO_PASSWORD, ENTER]);

    await yieldlyPage.waitForTimeout(30000);

    await browser.close();
    return claimAmountYLDY
}


// CLAIM STAKING POOL REWARDS
const claimPoolRewards = async () => {
    browser = await puppeteer.launch(puppeteerSettings);
    let pages = await browser.pages();
    const yieldlyPage = pages[0];

    const myAlgoOpened = () => new Promise(res => browser.on('targetcreated', res))
    await yieldlyPage.goto('https://app.yieldly.finance/staking');

    await connectAlgoWallet(browser);

    await yieldlyPage.waitForTimeout(5000);

    const [claimBtn] = await yieldlyPage.$x("//button[text() = 'Claim']");
    await claimBtn.click();

    await yieldlyPage.waitForTimeout(2000);

    const [claimAmountALGO, claimAmountYLDY] = await yieldlyPage.$$eval('input[type=number]', inputs => inputs.map((input) => parseFloat(input.value)))

    if (claimAmountALGO == 0 && claimAmountYLDY == 0) {
        await browser.close();
        return [claimAmountALGO, claimAmountYLDY];
    }

    await yieldlyPage.waitForTimeout(2000);

    const [nextBtn] = await yieldlyPage.$x("//button[text() = 'Next']");
    await nextBtn.click();

    await myAlgoOpened();

    pages = await browser.pages();
    myAlgoPage = pages.find(page => page.url().indexOf("wallet.myalgo.com") > -1)
    await myAlgoPage.waitForSelector('.custom-btn');
    await myAlgoPage.click('.custom-btn')
    await myAlgoPage.type('input.input-password', [MYALGO_PASSWORD, ENTER]);

    await yieldlyPage.waitForTimeout(30000);

    await browser.close();
    return [claimAmountALGO, claimAmountYLDY]
}


// STAKE AVAILABLE BALANCE
const stakeYLDY = async () => {
    browser = await puppeteer.launch(puppeteerSettings);
    let pages = await browser.pages();

    const yieldlyPage = pages[0];

    const myAlgoOpened = () => new Promise(res => browser.on('targetcreated', res))
    await yieldlyPage.goto('https://app.yieldly.finance/staking');

    await connectAlgoWallet(browser);

    await yieldlyPage.waitForTimeout(5000);

    await yieldlyPage.evaluate(() => {
        [...document.querySelectorAll('button')].find(element => element.textContent === 'Stake').click();
    });

    await yieldlyPage.waitForTimeout(2000);

    await yieldlyPage.evaluate(() => {
        [...document.querySelectorAll('button')].find(element => element.textContent === '100%').click();
    });

    await yieldlyPage.waitForTimeout(2000);

    const [stakedYLDY] = await yieldlyPage.$$eval('input[type=number]', inputs => inputs.map((input) => parseFloat(input.value)))
    if (stakedYLDY == 0) {
        await browser.close();
        return stakedYLDY;
    }

    await yieldlyPage.evaluate(() => {
        [...document.querySelectorAll('button')].find(element => element.textContent === 'Next').click();
    });

    await myAlgoOpened();

    pages = await browser.pages();
    myAlgoPage = pages.find(page => page.url().indexOf("wallet.myalgo.com") > -1)
    await myAlgoPage.waitForSelector('.custom-btn');
    await myAlgoPage.click('.custom-btn')
    await myAlgoPage.type('input.input-password', [MYALGO_PASSWORD, ENTER]);

    await yieldlyPage.waitForTimeout(30000);

    await browser.close();
    return stakedYLDY
}

(async () => {
    for (let i = 0; i < 10; i++) {
        try {
            console.log("YIELDLY AUTO COMPOUNDER v1.0.0")

            // CHECK IF MYALGO WALLET IS CREATED
            await checkAlgoWallet();

            // CLAIM NLL REWARDS
            const claimedNLLRewards = await claimNLLRewards();
            console.log(`Claimed NLL Assets: ${claimedNLLRewards} YLDY`)

            // CLAIM POOL REWARDS
            const claimedPoolRewards = await claimPoolRewards();
            console.log(`Claimed Pool Assets: ${claimedPoolRewards[0]} ALGO | ${claimedPoolRewards[1]} YLDY`)

            // STAKE EVERY YLDY IN WALLET
            const stakedAmount = await stakeYLDY();
            console.log(`Staked Amount: ${stakedAmount} YLDY`);

            break;
        } catch (e) {
            await browser.close();
            console.log(`AN ERROR OCCURRED, TRYING AGAIN...\n`)
        }
    }

})();
