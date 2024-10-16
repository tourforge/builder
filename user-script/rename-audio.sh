#!/usr/bin/env bash

# Step 0: Check if 'tourforge.json' exists in the current directory
if [[ ! -f "tourforge.json" ]]; then
  echo "'tourforge.json' not found in the current directory!"
  exit 1
fi

# Step 1: Find all mp3 files without an extension and store their names
mp3_files=()
while IFS= read -r file; do
  mp3_files+=("$file")
done < <(find . -type f -exec file --mime-type {} + | grep 'audio/mpeg' | cut -d: -f1)

# Step 2: Search the 'tourforge.json' file for mp3 filenames and append ".mp3" to them
for mp3 in "${mp3_files[@]}"; do
  basename_mp3=$(basename "$mp3")
  sed -i "s/\b$basename_mp3\b/$basename_mp3.mp3/g" "tourforge.json"
done

# Step 3: Rename files to append ".mp3" extension
for mp3 in "${mp3_files[@]}"; do
  mv "$mp3" "$mp3.mp3"
done

echo "Operation completed successfully!"
