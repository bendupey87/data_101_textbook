import nbformat
import os
import re

INPUT_NOTEBOOK = "data_101_book.ipynb"
OUTPUT_DIR = "book"

def slugify(title):
    title = title.lower()
    title = re.sub(r'[^a-z0-9]+', '_', title)
    title = title.strip('_')
    return title

def split_notebook():
    nb = nbformat.read(INPUT_NOTEBOOK, as_version=4)
    sections = []
    current_section = []
    current_title = None

    for cell in nb.cells:
        if cell.cell_type == "markdown" and cell.source.strip().startswith("# "):
            if current_section:
                sections.append((current_title, current_section))
            current_title = cell.source.replace("#", "").strip()
            current_section = [cell]
        else:
            current_section.append(cell)

    if current_section:
        sections.append((current_title, current_section))

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    toc_entries = []
    for i, (title, cells) in enumerate(sections, start=1):
        filename = f"{i:02d}_{slugify(title)}.ipynb"
        new_nb = nbformat.v4.new_notebook()
        new_nb.cells = cells
        nbformat.write(new_nb, os.path.join(OUTPUT_DIR, filename))
        toc_entries.append((title, filename))

    # Write _toc.yml
    with open(os.path.join(OUTPUT_DIR, "_toc.yml"), "w") as f:
        f.write("format: jb-book\nroot: " + toc_entries[0][1] + "\nchapters:\n")
        for title, filename in toc_entries[1:]:
            f.write(f"  - file: {filename}\n")

    # Write _config.yml
    with open(os.path.join(OUTPUT_DIR, "_config.yml"), "w") as f:
        f.write("""\
html:
  search:
    enabled: false
  use_repository_button: false
  use_issues_button: false
  use_edit_page_button: false

execute:
  execute_notebooks: off
""")

if __name__ == "__main__":
    split_notebook()
    print("✅ Notebook split complete. Now run:\n\njupyter-book build book/")
