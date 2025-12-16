import json
import os
import cv2
import numpy as np

# --- CONFIGURATION ---
# Base path is the project root where this script should be run from
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_ROOT = os.path.join(BASE_DIR, "colony_dataset")

# The only class name in your JSONs is "S.aureus". We map it to the required Class ID (0).
CLASS_MAP = {"S.aureus": 0, "colony": 0} 

# List of the train/val directories to process
SUBDIRS = ['train', 'val'] 

def convert_json_to_yolo(json_data, image_path):
    """
    Converts JSON labels (x, y, w, h) to YOLO normalized format (cx, cy, nw, nh) 
    using the image size for normalization.
    """
    
    # 1. Get Image Dimensions (Needed for normalization)
    img = cv2.imread(image_path)
    if img is None:
        return None, "Image not found."
        
    img_h, img_w = img.shape[:2]
    yolo_lines = []
    
    for label in json_data.get("labels", []):
        class_name = label.get("class", "S.aureus")
        class_id = CLASS_MAP.get(class_name)
        
        # Original coordinates are TOP-LEFT (x, y)
        x_tl = label["x"] 
        y_tl = label["y"]
        w_px = label["width"]
        h_px = label["height"]
        
        # 2. Convert to Normalized Center Coordinates
        center_x = (x_tl + w_px / 2) / img_w
        center_y = (y_tl + h_px / 2) / img_h
        
        # Normalized width/height
        norm_w = w_px / img_w
        norm_h = h_px / img_h
        
        # 3. Format the YOLO line
        yolo_line = f"{class_id} {center_x:.6f} {center_y:.6f} {norm_w:.6f} {norm_h:.6f}"
        yolo_lines.append(yolo_line)
        
    return yolo_lines, None

# --- MAIN PROCESSING LOOP ---
print(f"Starting conversion in: {DATASET_ROOT}\n")

for subdir in SUBDIRS:
    label_dir = os.path.join(DATASET_ROOT, 'labels', subdir)
    image_dir = os.path.join(DATASET_ROOT, 'images', subdir)
    
    if not os.path.exists(label_dir) or not os.path.exists(image_dir):
        print(f"Skipping {subdir}: Directory structure not found.")
        continue
        
    print(f"--- Processing {label_dir} ---")
    
    for filename in os.listdir(label_dir):
        if filename.endswith('.json'):
            base_name = os.path.splitext(filename)[0]
            json_path = os.path.join(label_dir, filename)
            image_path = os.path.join(image_dir, f"{base_name}.jpg") 
            
            try:
                with open(json_path, 'r') as f:
                    data = json.load(f)

                yolo_labels, error = convert_json_to_yolo(data, image_path)
                
                if error:
                    print(f"  [ERROR] {base_name}: {error}")
                    continue

                # --- 4. Write new .txt and delete old .json ---
                output_path = os.path.join(label_dir, f"{base_name}.txt")
                
                with open(output_path, 'w') as f:
                    f.write('\n'.join(yolo_labels))
                
                os.remove(json_path)
                print(f"  ✅ Converted {filename} to {base_name}.txt ({len(yolo_labels)} boxes)")

            except Exception as e:
                print(f"  [CRITICAL ERROR] Failed to process {filename}: {e}")
                
print("\nConversion complete! JSON files replaced by TXT files.")