import os

# Define folder structure
structure = {
    "src": {
        "files": ["App.jsx", "main.jsx"],
        "folders": {
            "components": {"files": [], "folders": {}},
            "pages": {"files": [], "folders": {}},
            "hooks": {"files": [], "folders": {}},
            "context": {"files": [], "folders": {}},
            "utils": {"files": [], "folders": {}},
            "styles": {
                "files": ["App.css", "index.css"],
                "folders": {}
            },
        },
    }
}

# Recursive function to create directories and files
def create_structure(base_path, structure):
    for folder_name, contents in structure.items():
        folder_path = os.path.join(base_path, folder_name)
        os.makedirs(folder_path, exist_ok=True)

        # Create files in this folder
        for file_name in contents.get("files", []):
            file_path = os.path.join(folder_path, file_name)
            open(file_path, "a").close()  # create empty file

        # Recursively create subfolders
        if "folders" in contents:
            create_structure(folder_path, contents["folders"])

# Run the function
create_structure(".", structure)

print("✅ Frontend src directory structure created successfully!")
