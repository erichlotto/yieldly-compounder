# yieldly-compounder
Script to claim rewards from Yieldly's No Loss Lottery and Staking Pool and adding these rewards to your Staking Pool

Please bear in mind this is a proof of concept created for personal usage and released so the comunity can benefit from it. It fills my personal needs until Yieldly implements auto-compounding with TEAL4 in Q4.

## Usage:
This is a Node.js project and relies on Puppeteer (a library to interact with a browser session programatically), so we're basically simulating user inputs here as if we were using the browser to claim our rewards from Yieldly. Tested on Ubuntu only, I can't tell if it'll work on another OS.

There's some manual work involved, so let's get to it:

1. Clone this repository to your desired location on your development machine (not a server, as we'll need access to the GUI for some steps)
2. Navigate to the project directory: `cd yieldly-compounder`
3. Install nodejs dependencies: `npm i`
4. Edit `index.js` file and change **MYALGO_PASSWORD** to the password you want your wallet to use (keep in mind we only need to sign in manually once, so be safe here and go for a strong password!)
5. Edit `index.js` file and change **puppeteerSettings.headless** from **true** to **false** (this will make browser sessions visible)
6. Run the project using `node index.js`: the script will open a browser window, see there's no wallet created and prompt you to create one, so you'll have to import your existing wallet using your seed phrase. This is a manual proccess, so go on the web page and fill in your info. **Make sure to use the same password you typed in MYALGO_PASSWORD**
7. After you import your wallet, head back to the terminal and press ENTER. This will close your browser and end your current session.
8. Open again the `index.js` file and change the **puppeteerSettings.headless** from **false** back to **true**
9. Run `node index.js` and voila, everything should be working. You can leave puppeteerSettings.headless as false if you want to see how the browser interaction is working and debug possible errors.

### Using on a server
I personally like to keep this on a server as I dont have my computer powered on all the time. The reason we need to start from a Desktop environment is because we need to interact with the browser window to import our wallet. All browser data will be stored in the `user_data` directory, so if we upload everything (this dir included) we should be good to go. Doing this is simple:
1. Upload the entire `yieldly-compounder` directory to your server
2. On your server, run `node index.js`
3. I had to install a lot of dependencies on Ubuntu server to get puppeteer working, you might have to aswell. [This issue page helped me]( https://github.com/puppeteer/puppeteer/issues/3443) (I've installed everything listed in the last message including `libgbm-dev`)
4. Once you confirm everything is working as intended, create a new contab entry running `crontab -e` and schedule this script's execution with `50 4 * * * /usr/bin/node /home/ubuntu/yieldly-compounder/index.js` (please check your node binary location as it might vary)
5. Your script should now be setup for daily running everyday at 4:50 localtime (my machine is in UTC so 4:50 is the optimal time for me)

### Considerations:
I'm telling you to import your existing seed phrase instead of creating a whole new wallet, because you have to opt-in in Yieldly's contracts, and the script is not ready for this.
