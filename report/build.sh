#!/usr/bin/env bash
# Build the report with any standard LaTeX distribution (TeX Live >= 2015
# or MiKTeX) that provides: tikz (pgf), pgfgantt, booktabs, enumitem, caption,
# multirow, listings, hyperref, fancyhdr, titlesec, setspace, float, longtable.
# Three passes resolve the TOC / list entries / cross-references.
set -eu
cd "$(dirname "$0")"
for i in 1 2 3; do
  pdflatex -interaction=nonstopmode -halt-on-error main.tex > build_pass_$i.log
done
mv main.pdf StudyMate_AI_Project_Report.pdf
rm -f input.aux input.toc input.out input.lof input.lot input.log
echo "OK -> StudyMate_AI_Project_Report.pdf"
