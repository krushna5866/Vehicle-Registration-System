import os
import shutil

source = r"d:\BC project\Vehicle_Registration_System_Mini_Project_Report_RefFormat.docx"
home = os.path.expanduser("~")

destinations = [
    os.path.join(home, "Desktop", "Vehicle_Registration_System_Mini_Project_Report_RefFormat.docx"),
    os.path.join(home, "Downloads", "Vehicle_Registration_System_Mini_Project_Report_RefFormat.docx"),
    r"C:\Users\Krushna\.gemini\antigravity\brain\05af4329-1e0d-4b3d-af5b-060ca7138a6d\Vehicle_Registration_System_Mini_Project_Report_RefFormat.docx"
]

print("Source file exists:", os.path.exists(source), f"({os.path.getsize(source) // 1024} KB)")

for dest in destinations:
    try:
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        shutil.copy2(source, dest)
        print("Copied successfully to:", dest)
    except Exception as e:
        print("Failed to copy to:", dest, "Error:", e)
