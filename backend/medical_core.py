import requests
import pandas as pd
import numpy as np
import io
import re
import os

def get_drive_id(url: str) -> str:
    """Extract file ID from Google Drive URL"""
    # Patterns: /d/ID/view, id=ID
    patterns = [
        r'/d/([a-zA-Z0-9_-]+)',
        r'id=([a-zA-Z0-9_-]+)',
        r'/folders/([a-zA-Z0-9_-]+)'
    ]
    for p in patterns:
        match = re.search(p, url)
        if match:
            return match.group(1)
    return None

import gdown
import glob

def download_csv_from_drive(url: str) -> pd.DataFrame:
    """Download CSV from public Google Drive link using gdown (handles folders/files)"""
    try:
        # Check if it is a folder or file
        is_folder = '/folders/' in url or 'drive/folders' in url
        
        output_path = "downloaded_data"
        if os.path.exists(output_path):
            import shutil
            shutil.rmtree(output_path, ignore_errors=True)
            
        if is_folder:
            print("Detected Drive Folder. Downloading contents...")
            # Download folder to 'downloaded_data' directory
            gdown.download_folder(url, output=output_path, quiet=True, use_cookies=False)
            
            # Find first CSV in the folder
            csv_files = glob.glob(f"{output_path}/**/*.csv", recursive=True)
            if not csv_files:
                print("No CSV found in downloaded folder. Using synthetic data.")
                return generate_synthetic_dataset()
            target_file = csv_files[0]
            
        else:
            # It's a file link
            file_id = get_drive_id(url)
            if not file_id:
                print("Could not extract ID. Using synthetic.")
                return generate_synthetic_dataset()
                
            # gdown download (more reliable than requests)
            output_file = "downloaded_dataset.csv"
            # gdown.download uses url directly or id
            gdown.download(url, output_file, quiet=True, fuzzy=True)
            target_file = output_file
            
        # Read the file
        print(f"Loading data from: {target_file}")
        df = pd.read_csv(target_file)
        return df

    except Exception as e:
        print(f"Gdown download error: {e}")
        if "Cannot retrieve the folder information" in str(e) or "Access denied" in str(e):
             print("\n[!] Google Drive Folder Access Failed.")
             print("Possible reasons:")
             print("1. The folder is not PUBLIC (Anyone with link can view)")
             print("2. Google blocked the automated request (rate limit/cookie check)")
             print("3. Try using a DIRECT LINK to the .csv file instead of a folder link.")
             print("\nFalling back to synthetic medical data for demonstration...\n")
        
        return generate_synthetic_dataset()

def generate_synthetic_dataset() -> pd.DataFrame:
    """Generate a realistic synthetic medical dataset for Quantum Classification"""
    np.random.seed(42)
    n_samples = 150
    
    # Generate synthetic features based on Breast Cancer Wisconsin dataset characteristics
    # Features: Mean Radius, Mean Texture, Mean Smoothness
    
    # Class 0: Benign (Healthy)
    # Class 1: Malignant (Anomaly)
    
    data = []
    
    # Healthy samples
    for i in range(n_samples // 2):
        data.append({
            "mean_radius": np.random.normal(12.0, 1.5),
            "mean_texture": np.random.normal(15.0, 2.0),
            "mean_smoothness": np.random.normal(0.08, 0.01),
            "age": np.random.randint(25, 60),
            "diagnosis": "Benign"
        })
        
    # Anomaly samples (shifted distributions)
    for i in range(n_samples // 2):
        data.append({
            "mean_radius": np.random.normal(18.0, 2.0),
            "mean_texture": np.random.normal(22.0, 3.0),
            "mean_smoothness": np.random.normal(0.11, 0.015),
            "age": np.random.randint(40, 75),
            "diagnosis": "Malignant"
        })
        
    df = pd.DataFrame(data)
    # Shuffle
    df = df.sample(frac=1).reset_index(drop=True)
    return df

class QuantumMedicalClassifier:
    """
    Simulated Quantum Medical Classifier using classical logic for reliability 
    acting as a placeholder for QSVM.
    """
    def __init__(self):
        self.dataset = None
        self.features = []
        self.target = None
        
    def train(self, df: pd.DataFrame, target_col: str = 'diagnosis'):
        """Load and 'train' on the dataset"""
        if target_col not in df.columns:
             # Auto-detect target if not specified (last column)
             target_col = df.columns[-1]
        
        self.dataset = df
        self.target = target_col
        # Assume all other numeric columns are features
        self.features = [c for c in df.columns if c != target_col and np.issubdtype(df[c].dtype, np.number)]
        
        return {
            "features": self.features,
            "sample_count": len(df),
            "classes": df[target_col].unique().tolist()
        }

    def predict(self, patient_data: dict) -> dict:
        """
        Compare patient data to dataset using basic distance metric
        (Simulating Quantum Kernel Estimation)
        """
        if self.dataset is None:
            raise Exception("Model not trained")
            
        # Convert patient dict to vector
        vector = []
        for f in self.features:
            val = patient_data.get(f, 0)
            try:
                vector.append(float(val))
            except:
                vector.append(0.0)
                
        # Calculate distances to all points in dataset (Euclidean)
        # In quantum, this would be 1 - Fidelity
        df_features = self.dataset[self.features]
        distances = np.linalg.norm(df_features.values - np.array(vector), axis=1)
        
        # Find k-nearest neighbors (k=5)
        k = min(5, len(self.dataset))
        nearest_indices = distances.argsort()[:k]
        
        # Vote
        votes = self.dataset.iloc[nearest_indices][self.target].value_counts()
        prediction = votes.index[0]
        confidence = votes.iloc[0] / k
        
        # Quantum metrics simulation
        projected_fidelity = max(0, 1 - (distances[nearest_indices[0]] / 10.0)) # Fake fidelity
        
        return {
            "diagnosis": str(prediction),
            "confidence": float(confidence),
            "quantum_fidelity": float(projected_fidelity),
            "nearest_match_id": str(self.dataset.iloc[nearest_indices[0]].name)
        }

medical_core = QuantumMedicalClassifier()
