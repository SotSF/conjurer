# Onsite setup

This is the one stop shop for everything related to setting up Conjurer. It is assumed that there is not internet at the event.

## Before leaving for the event

### Update Conjurer

1. Run `git pull` to fetch the latest code, or `git clone` this repository if needed
1. Run `node -v` to ensure you are using node 18. If you use nvm simply run `nvm use 18`
1. Run `yarn` to install dependencies
1. Run `yarn dev` to run conjurer locally
1. Visit http://localhost:3000 to test it out

### Download cloud assets

1. Run `yarn downloadCloudAssets` to download all cloud assets into the folder `public/cloud-assets`
   - Note that you are getting a snapshot of all of the experiences and audio files. If anyone makes more changes to these cloud saved files, you will have to rerun this script to download the latest changed assets

### Set up Conjurer to use local assets

1. Run `yarn build` (to be confirmed if this is really necessary)
1. Run `yarn dev` to run conjurer locally if it is not already running
1. Visit the app at http://localhost:3000
1. Toggle the `Use local assets` button on such that it becomes orange:

![Use local assets button](public/use-local-assets-button.png)

6. Reload the page.

You are good to go! From now on, you should not need internet access for any functionality. Whenever you open an experience or audio file, it will be loaded from the local `public/cloud-assets` directory, and whenever you save an experience file, it will be saved locally into that same directory.

You can toggle the same button again to return to opening/saving files to the cloud. Just be careful of potentially overwriting the wrong thing.

## At the event

### Start up Conjurer

1. Run `node -v` to ensure you are using node 18. If you use nvm simply run `nvm use 18`
1. Run `yarn` to install dependencies
1. Run `yarn dev` to run conjurer locally
1. Visit http://localhost:3000 to test it out

### Transmit data

TODO

# Troubleshooting + optimization

Here are some issues we have run into in the past.

## Conjurer-side

- Make sure that the conjurer texture size is set to 1024. To the bottom right of the canopy is a button that will say either 256, 512, or 1024. Click it until it says 1024.
-

## Unity-side

- Make sure that the conjurer node is in "polarized" mode (to be confirmed)
