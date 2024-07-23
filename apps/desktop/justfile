download-deno:
    #!/usr/bin/env bash
    set -euo pipefail

    DENO_VERSION="$(curl -sSf https://api.github.com/repos/denoland/deno/releases/latest | grep -o '"tag_name": "v[^"]*' | cut -d'"' -f4)"
    BINARIES_DIR="src-tauri/binaries"
    mkdir -p "$BINARIES_DIR"

    platforms=("aarch64-apple-darwin" "x86_64-apple-darwin" "x86_64-pc-windows-msvc" "x86_64-unknown-linux-gnu")

    for platform in "${platforms[@]}"; do
        echo "Downloading Deno for $platform..."
        DOWNLOAD_URL="https://github.com/denoland/deno/releases/download/${DENO_VERSION}/deno-${platform}.zip"
        TEMP_ZIP="${BINARIES_DIR}/deno-${platform}.zip"

        if [[ "$platform" == *"windows"* ]]; then
            DENO_EXE="${BINARIES_DIR}/deno-${platform}.exe"
            EXTRACTED_NAME="deno.exe"
        else
            DENO_EXE="${BINARIES_DIR}/deno-${platform}"
            EXTRACTED_NAME="deno"
        fi

        curl -L "$DOWNLOAD_URL" -o "$TEMP_ZIP"
        
        if command -v unzip >/dev/null; then
            unzip -jo "$TEMP_ZIP" -d "$BINARIES_DIR"
        else
            7z e -y "$TEMP_ZIP" -o"$BINARIES_DIR"
        fi

        mv "${BINARIES_DIR}/${EXTRACTED_NAME}" "$DENO_EXE"
        chmod +x "$DENO_EXE"
        rm "$TEMP_ZIP"

        echo "Downloaded and extracted Deno for $platform"
    done

    echo "Deno binaries for all platforms have been downloaded to $BINARIES_DIR"