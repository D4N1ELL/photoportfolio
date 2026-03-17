for file in *.jpg; do
	cwebp -q 100 "$file" -o "${file%.jpg}".webp 
done
