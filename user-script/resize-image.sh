#! /usr/bin/env nix-shell
#! nix-shell -i bash -p imagemagick parallel

resize_percent=75   # Percentage to resize on each run
max_size=512       # Maximum file size in KB

# Find all files larger than max_size and check if they are images
files=$(find . -type f -size +${max_size}k | while read -r file; do
  if file "$file" | grep -qE 'image|bitmap'; then
    echo "$(realpath $file)"
  fi
done)

# Process images in parallel
echo "Resizing all of the following image(s) ONCE, please run this script multiple times to bring it below ${max_size}KB"
echo "$files"
echo "$files" | parallel --no-notice magick {} -resize ${resize_percent}% {}
