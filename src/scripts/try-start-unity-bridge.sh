#!/bin/bash

# Try to open the Unity bridge when on MacOs
if [[ "$OSTYPE" = "darwin"* ]]; then
    # Define the application name pattern (e.g., MyApp_v*.app)
    APP_NAME_PATTERN="ConjurerBridge_v*.app"

    # Look for all applications matching the pattern in /Applications
    APP_PATHS=($(find /Applications -maxdepth 1 -name "$APP_NAME_PATTERN"))

    # Check if any application was found
    if [[ ${#APP_PATHS[@]} -eq 0 ]]; then
        echo "No Unity bridge application found matching the pattern $APP_NAME_PATTERN in /Applications."
    else
        # Extract version numbers from the app names and sort them to find the latest
        LATEST_APP=""
        LATEST_VERSION=""

        for APP_PATH in "${APP_PATHS[@]}"; do
            echo "Found Unity bridge application: $APP_PATH"
            # Extract version number from the app name using regex
            VERSION=$(echo "$APP_PATH" | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+')
            if [[ -z "$VERSION" ]]; then
                continue
            fi

            # Compare versions and keep the latest
            if [[ -z "$LATEST_VERSION" || "$VERSION" > "$LATEST_VERSION" ]]; then
                LATEST_VERSION="$VERSION"
                LATEST_APP="$APP_PATH"
            fi
        done
    fi
    # Check if we found the latest app
    if [[ -z "$LATEST_APP" ]]; then
        echo "No valid versioned application found."
    else
        # Launch the latest application
        echo "Latest = $LATEST_VERSION"
        echo "Launching $LATEST_APP"
        open "$LATEST_APP"
    fi
fi
