# Onsite setup

This is the one stop shop for everything related to setting up Conjurer. Just followed these 47 easy steps. What could go wrong?

It is assumed that there is no internet at the event.

## Before leaving for the event

### Update Conjurer

1. Run `git pull` to fetch the latest code (or `git clone` this repository)
1. Run `node -v` to ensure you are using node 20
   - For easy node version management, [install `nvm`](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating)
   - Once it is installed, run `nvm install 20`
   - If nvm and node 20 are already installed, simply run `nvm use 20`
   - Run `node -v` again to verify you are using node 20
1. Run `yarn` to install dependencies
1. Run `yarn dev` to run conjurer locally
1. Visit http://localhost:3000 to test it out
   - Note that the first load will be slow

### Setup Conjurer to use local data

These steps can be skipped if you will have internet at the event.

1. Run `yarn downloadCloudAudio` to download all cloud audio into the folder `public/cloud-assets`
   - This could take a little while depending on internet speed
2. Run `yarn db:prod:download` to replace the local database with all prod data. Refer to the Database access section of the README if you encounter errors.
3. Run `yarn dev` to run conjurer locally if it is not already running
4. Visit the app at http://localhost:3000
5. Ensure that at the top of the app it says `using local data` in orange. If it says `using prod data` in green, click it to toggle to local data.
6. Reload the page.
7. Verify your setup by turning off your internet and make sure you can load and play experiences still.
8. Terminate `yarn dev` and run `yarn canopy` to test the unity bridge app. Click Tools->"Transmit data to canopy". Verify that the unity bridge app shows data from Conjurer.

You are good to go! From now on, you should not need internet access for any functionality. Whenever you open an experience or audio file, it will be loaded from the local database and `public/cloud-audio` directory respectively, and whenever you save an experience file, it will be saved locally.

## At the event

### Start up and configure Conjurer

1. Run `yarn canopy` to run Conjurer locally
2. Visit http://localhost:3000 to test it out
   - Log in as someone, play any experience on the default Emcee page.
   - Verify visuals and audio are working
3. If you don't have internet, make sure you see `using local assets` in orange
4. Set the texture size to 1024 on the bottom right of the canvas (optimizations section for details)

### Transmit data via Unity Bridge app

1. Transmit data from Conjurer to the unity bridge app by clicking Tools->"Transmit data to canopy".
2. Open the unity bridge app and:
   Set HSV value (V) to 0.5
   Set IP to 192.168.1.71 (this may be change)
   Click Set IP
   Click Reconnect?
   Set Mirror port to 4
   Set Mirror offset to 27
   Click Use double density
3. The canopy should be displaying Conjurer data at this point!

# Optimizations

- Make sure that the conjurer texture size is set to 1024. To the bottom right of the canopy is a button that will say either 256, 512, or 1024. Click it until it says 1024.
- Tools->Set audio latency. (Does this even work??)

# Troubleshooting

Here are some issues we have run into in the past. Add to this list as problems occur!

- (No longer relevant) **Conjurer opens but there is an error modal.** try logging in or opening a different experience. Because of the janky login situation, you may be in a funky state.
- (No longer relevant) **The canopy is showing something different from Conjurer.** Make sure that in the unity app, the Conjurer node is in "polarized" mode.
