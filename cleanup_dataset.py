#!/usr/bin/env python
"""
Cleanup script to remove duplicate dataset folders.
Run this before training to ensure clean dataset structure.
"""

import shutil
from pathlib import Path

def cleanup_dataset():
    """Remove duplicate dataset folders."""
    base_dir = Path(__file__).parent / "dataset" / "chest_xray"
    
    if not base_dir.exists():
        print(f"Dataset directory not found: {base_dir}")
        return False
    
    # Folders to remove
    duplicates = [
        base_dir / "__MACOSX",
        base_dir / "chest_xray",
    ]
    
    # Folders that should exist
    required = ["train", "val", "test"]
    
    print(f"Checking dataset at: {base_dir}")
    print()
    
    # Remove duplicates
    for dup_folder in duplicates:
        if dup_folder.exists():
            print(f"Removing: {dup_folder.name}")
            shutil.rmtree(dup_folder)
            print(f"  ✓ Deleted")
        else:
            print(f"Not found (OK): {dup_folder.name}")
    
    print()
    
    # Verify required folders exist
    print("Verifying required folders:")
    all_exist = True
    for req_folder in required:
        folder_path = base_dir / req_folder
        if folder_path.exists():
            print(f"  ✓ {req_folder}/ exists")
        else:
            print(f"  ✗ {req_folder}/ NOT FOUND")
            all_exist = False
    
    print()
    
    if all_exist:
        print("✓ Dataset cleanup successful!")
        print(f"Ready to train from: {base_dir}")
        return True
    else:
        print("✗ Some required folders are missing")
        return False

if __name__ == "__main__":
    import sys
    try:
        success = cleanup_dataset()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
