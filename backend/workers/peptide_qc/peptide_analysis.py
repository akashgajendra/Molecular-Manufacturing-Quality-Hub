# peptide_analysis.py
import pymzml
import numpy as np
import os
from Bio.SeqUtils import molecular_weight

# Placeholder for DB model import (Adjust this based on your actual model structure)
class PeptideResultModel:
    def __init__(self, job_id, sequence, found, abundance, qc_status):
        self.job_id = job_id
        self.sequence = sequence
        self.found_in_sample = found
        self.relative_abundance_pct = abundance
        self.qc_status = qc_status

PPM_TOLERANCE = 5.0  # Tolerance for grouping and matching peaks
MIN_INTENSITY_THRESHOLD = 5000.0 # Filter out very low noise peaks
PROTON_MASS = 1.007276

# --- CORE SCIENTIFIC LOGIC FUNCTIONS ---
def calculate_theoretical_mz(sequence, charge: int) -> float:
    """Calculates the theoretical mass-to-charge (m/z) ratio."""
    mass = molecular_weight(sequence, 'protein')
    # m/z = (M + z*H+) / z
    mz = (mass + charge * PROTON_MASS) / charge
    return mz

def calculate_ppm_error(actual_mz, theoretical_mz):
    """Calculates the parts-per-million (ppm) mass error."""
    return abs(actual_mz - theoretical_mz) / theoretical_mz * 1e6

def get_unique_features(mzml_file: str, ppm_tolerance: float, min_intensity: float) -> list:
    """
    Reads the mzML file and groups unique m/z features.
    (This is your adapted feature extraction logic)
    """
    if not os.path.exists(mzml_file):
        raise FileNotFoundError(f"MZML file not found at: {mzml_file}")

    run = pymzml.run.Reader(mzml_file)
    features = {} 

    for spectrum in run:
        if spectrum.ms_level == 1:
            try:
                mz_intensity_data = spectrum.peaks('centroided')
            except KeyError:
                mz_intensity_data = spectrum.peaks
            
            if mz_intensity_data.size == 0:
                continue
            
            for mz, intensity in mz_intensity_data:
                if intensity < min_intensity:
                    continue
                
                # --- Feature Grouping Logic ---
                matched_feature = False
                for feature_mz in sorted(features.keys()):
                    if calculate_ppm_error(mz, feature_mz) <= ppm_tolerance:
                        # Consolidate feature
                        max_intensity = max(features[feature_mz], intensity)
                        del features[feature_mz] 
                        features[mz] = max_intensity 
                        matched_feature = True
                        break 
                
                if not matched_feature:
                    features[mz] = intensity

    return sorted(features.items(), key=lambda item: item[1], reverse=True)

def find_target_peptide(all_features: list, theoretical_mz: float, ppm_tolerance: float) -> dict:
    """Searches the extracted features for the target peptide's m/z."""
    for actual_mz, max_intensity in all_features:
        ppm_error = calculate_ppm_error(actual_mz, theoretical_mz)
        
        if ppm_error <= ppm_tolerance:
            return {
                "found": True,
                "mz": actual_mz,
                "intensity": max_intensity,
                "ppm_error": ppm_error
            }
    
    return {"found": False}

# --- MAIN INTEGRATION FUNCTION ---

def run_peptide_qc(db_session, job_id: int, local_file_path: str, message_data: dict) -> PeptideResultModel:
    """
    Executes the full peptide QC workflow.
    
    Returns:
        PeptideResultModel: An object representing the final analysis result for DB storage.
    """
    target_sequence = message_data.get("target_sequence", "DEFAULT_SEQUENCE") 
    target_charge = message_data.get("target_charge", 2) # Assume 2+ charge by default

    logger.info(f"[{job_id}] Analyzing target: {target_sequence} @ {target_charge}+")

    # 1. Calculate Theoretical m/z
    theoretical_mz = calculate_theoretical_mz(target_sequence, target_charge)
    
    # 2. Extract All Features
    all_features = get_unique_features(local_file_path, PPM_TOLERANCE, MIN_INTENSITY_THRESHOLD)
    
    if not all_features:
        raise ValueError("No features were extracted from the mzML file.")
    
    total_intensity = sum(intensity for mz, intensity in all_features)

    # 3. Search for Target Peptide
    target_result = find_target_peptide(all_features, theoretical_mz, PPM_TOLERANCE)
    
    # 4. Compile Final Results
    if target_result["found"]:
        relative_abundance = (target_result["intensity"] / total_intensity) * 100
        qc_status = "PASS" if relative_abundance > 0.05 else "FAIL" # Example QC threshold
        
        return PeptideResultModel(
            job_id=job_id,
            sequence=target_sequence,
            found=True,
            abundance=round(relative_abundance, 3),
            qc_status=qc_status
        )
    else:
        return PeptideResultModel(
            job_id=job_id,
            sequence=target_sequence,
            found=False,
            abundance=0.0,
            qc_status="FAIL"
        )