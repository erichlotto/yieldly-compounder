const puppeteer = require("puppeteer");
const readline = require("readline");
const settings = require("./settings");
const axios = require('axios');

////////////////////////////////////////////
//                                        //
//  NO NEED TO EDIT THIS SCRIPT ANYMORE,  //
//  PLEASE CHECK settings.js              //
//                                        //
////////////////////////////////////////////

const MYALGO_PASSWORD = settings.password;
const DEBUG = settings.debug;
const PUPPETEER_SETTINGS = {
    headless: settings.headless,
    userDataDir: "./user_data"
};
const ENTER = String.fromCharCode(13);
const ESC = String.fromCharCode(27);

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
    browser = await puppeteer.launch(PUPPETEER_SETTINGS);
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
    browser = await puppeteer.launch(PUPPETEER_SETTINGS);
    let pages = await browser.pages();
    const yieldlyPage = pages[0];

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
    await myAlgoPage.type('input.input-password', [MYALGO_PASSWORD, DEBUG ? ESC : ENTER]);

    await yieldlyPage.waitForTimeout(30000);

    await browser.close();
    return claimAmountYLDY
}


// CLAIM STAKING POOL REWARDS
const claimPoolRewards = async () => {
    browser = await puppeteer.launch(PUPPETEER_SETTINGS);
    let pages = await browser.pages();
    const yieldlyPage = pages[0];

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
    await yieldlyPage.waitForTimeout(3000);

    pages = await browser.pages();
    myAlgoPage = pages.find(page => page.url().indexOf("wallet.myalgo.com") > -1)
    await myAlgoPage.waitForSelector('.custom-btn');
    await myAlgoPage.click('.custom-btn')
    await myAlgoPage.type('input.input-password', [MYALGO_PASSWORD, DEBUG ? ESC : ENTER]);

    await yieldlyPage.waitForTimeout(30000);

    await browser.close();
    return [claimAmountALGO, claimAmountYLDY]
}


// STAKE AVAILABLE BALANCE
const stakeYLDY = async () => {
    browser = await puppeteer.launch(PUPPETEER_SETTINGS);
    let pages = await browser.pages();

    const yieldlyPage = pages[0];

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
    await yieldlyPage.waitForTimeout(3000);

    pages = await browser.pages();
    myAlgoPage = pages.find(page => page.url().indexOf("wallet.myalgo.com") > -1)
    await myAlgoPage.waitForSelector('.custom-btn');
    await myAlgoPage.click('.custom-btn')
    await myAlgoPage.type('input.input-password', [MYALGO_PASSWORD, DEBUG ? ESC : ENTER]);

    await yieldlyPage.waitForTimeout(30000);

    await browser.close();
    return stakedYLDY
}


// WAITS FOR MYALGO OPENED, TIMEOUT IS 30 SECONDS (60*500)
const myAlgoOpened = async () => {
    for (let i = 0; i < 60; i++) {
        let pages = await browser.pages();
        let myAlgoPage = pages.find(page => page.url().indexOf("wallet.myalgo.com") > -1)
        if (myAlgoPage != undefined) return;
        await sleep(500)
    }
    throw "MyAlgoWallet not oppenened. Check your connection"
}


// PAUSE EXECUTION FOR THE SPECIFIED AMOUNT OF TIME
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));


// LOGS OUTPUT TO CONSOLE AND (OPTIONALLY) TO TELEGRAM, IF VARIABLES ARE PRESENT IN SETTINGS.JS
const log = message => {
    console.log(message);
    settings.telegram_api && settings.telegram_chatid &&
        axios.get(`https://api.telegram.org/bot${settings.telegram_api}/sendmessage?chat_id=${settings.telegram_chatid}&disable_web_page_preview=1&disable_notification=true&text=${encodeURI(message)}`);
}


// RUNS THIS SCRIPT
(async () => {
    for (let i = 0; i < 10; i++) { // TRY TO RUN THE SCRIPT 10 TIMES TO BYPASS POSSIBLE NETWORK ERRORS
        try {
            log(`YIELDLY AUTO COMPOUNDER v1.0.1${DEBUG ? " => [DEBUG] No transactions will be made!" : ""}`)

            // CHECK IF MYALGO WALLET IS CREATED
            await checkAlgoWallet();

            // CLAIM NLL REWARDS
            const claimedNLLRewards = await claimNLLRewards();
            log(`Claimed NLL Assets: ${claimedNLLRewards} YLDY`)

            // CLAIM POOL REWARDS
            const claimedPoolRewards = await claimPoolRewards();
            log(`Claimed Pool Assets: ${claimedPoolRewards[0]} ALGO | ${claimedPoolRewards[1]} YLDY`)

            // STAKE EVERY YLDY IN WALLET
            const stakedAmount = await stakeYLDY();
            log(`Staked Amount: ${stakedAmount} YLDY`);

            break;
        } catch (e) {
            await browser.close();
            log(`ERROR: ${e}\n`)
        }
    }

})();
