for file in *.jpg; do
	convert "$file" -resize '25%' downscaled/"${file%.jpg}".jpg
done
