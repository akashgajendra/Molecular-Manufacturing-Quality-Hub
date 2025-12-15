# peptide_analysis.py
import pymzml
import numpy as np
import os
import logging

# --- LOGGING SETUP ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('peptide-worker')

# --- CONFIGURATION ---
PPM_TOLERANCE = 20.0  # Tightened slightly for targeted search accuracy
PROTON_MASS = 1.00727647
WATER_MASS = 18.01056
DEFAULT_SEQUENCE = "DRVYIHPF"
VALID_AA = set("ACDEFGHIKLMNPQRSTVWY")

# Explicit mass dictionary for precise calculation
AMINO_ACID_MASSES = {
    'G': 57.02146, 'A': 71.03711, 'V': 99.06841, 'L': 113.08406, 'I': 113.08406, 
    'M': 131.04049, 'P': 97.05276, 'F': 147.06841, 'Y': 163.06333, 'W': 186.07931,
    'S': 87.03203, 'T': 101.04768, 'N': 114.04293, 'Q': 128.05858, 'C': 103.00919,
    'D': 115.02694, 'E': 129.04259, 'K': 128.09496, 'R': 156.10111, 'H': 137.05891
}

# --- 1. HELPER FUNCTIONS ---

def validate_peptide_sequence(seq: str):
    """Ensures the sequence only contains valid amino acids."""
    invalid = set(seq) - VALID_AA
    if invalid:
        raise ValueError(f"Invalid amino acids in peptide sequence: {invalid}")

def calculate_theoretical_mz(sequence: str, charge: int) -> float:
    """Calculates the exact theoretical m/z for the target sequence."""
    if charge <= 0:
        raise ValueError("Charge must be positive.")
        
    mass = sum(AMINO_ACID_MASSES[aa] for aa in sequence.upper()) + WATER_MASS
    mz = (mass + (charge * PROTON_MASS)) / charge
    return mz

def find_peak_in_spectrum(spectrum, target_mz, ppm_tol=20.0):
    """
    Searches a single spectrum for the target m/z.
    Returns: (found_mz, intensity) or (None, 0.0) if not found.
    """
    try:
        peaks = spectrum.peaks('centroided')
    except:
        peaks = spectrum.peaks
        
    if len(peaks) == 0:
        return None, 0.0

    mzs = peaks[:, 0]
    intensities = peaks[:, 1]
    
    # Calculate search window boundaries
    tolerance_da = target_mz * (ppm_tol / 1e6)
    low_bound = target_mz - tolerance_da
    high_bound = target_mz + tolerance_da
    
    # Create a boolean mask for peaks inside the window
    mask = (mzs >= low_bound) & (mzs <= high_bound)
    
    if np.any(mask):
        # If multiple peaks fall in the window, take the most intense one
        matches_intensities = intensities[mask]
        matches_mzs = mzs[mask]
        best_idx = np.argmax(matches_intensities)
        
        # NOTE: np.True_ (from np.any) and np.float64 (from indexing) 
        # are generated here.
        return matches_mzs[best_idx], matches_intensities[best_idx]
    
    # NOTE: The return of 0.0 is a standard Python float, which is fine.
    return None, 0.0

# --- 2. MAIN INTEGRATION FUNCTION ---

def run_peptide_qc(job_id: int, local_file_path: str, message_data: dict) -> dict:
    """
    Executes the peptide QC workflow using the Targeted Scanning approach.
    """
    target_sequence = message_data.get("target_sequence", DEFAULT_SEQUENCE) 
    target_charge = message_data.get("target_charge", 2) 

    logger.info(f"[{job_id}] Analyzing target: {target_sequence} @ {target_charge}+")

    # A. Validation and Calculation
    validate_peptide_sequence(target_sequence)
    theoretical_mz = calculate_theoretical_mz(target_sequence, target_charge)
    
    if not os.path.exists(local_file_path):
        raise FileNotFoundError(f"MZML file not found at: {local_file_path}")

    # B. Targeted Scanning Loop (The "Metal Detector")
    run = pymzml.run.Reader(local_file_path)
    
    max_peptide_intensity = 0.0
    best_scan_total_intensity = 0.0 
    best_observed_mz = None
    
    for spectrum in run:
        if spectrum.ms_level == 1:
            found_mz, intensity = find_peak_in_spectrum(spectrum, theoretical_mz, PPM_TOLERANCE)
            
            if intensity > max_peptide_intensity:
                max_peptide_intensity = intensity
                best_observed_mz = found_mz
                
                try:
                    peaks = spectrum.peaks('centroided')
                except:
                    peaks = spectrum.peaks
                
                # NOTE: The sum() here will result in a standard Python float 
                # if max_peptide_intensity was set via standard Python assignment (0.0).
                # To be absolutely safe with potential NumPy interactions, we can cast it.
                best_scan_total_intensity = float(np.sum(peaks[:, 1]))

    # C. Compile Final Results
    logger.info(f"Computing final results for job {job_id}")
    
    # --- FIX APPLIED HERE: CONVERTING NUMPY TYPES TO NATIVE PYTHON TYPES ---
    found = bool(max_peptide_intensity > 0) # Use bool() for explicit conversion
    relative_abundance = 0.0
    
    if found and best_scan_total_intensity > 0:
        relative_abundance = (float(max_peptide_intensity) / best_scan_total_intensity) * 100
    
    qc_status = "PASS" if relative_abundance > 0.05 else "FAIL"

    logger.info(f"[{job_id}] Result: Found={found}, Abundance={relative_abundance:.3f}%")

    # --- FINAL RESULT CASTING (The most critical fix area) ---
    return {
        "job_id": job_id,
        "sequence": target_sequence,
        "charge": target_charge,
        "theoretical_mz": round(float(theoretical_mz), 4), # Ensure float
        # This field was logging as np.True_, so we explicitly convert the result of the comparison:
        "found_in_sample": bool(found), 
        # These values were likely np.float64, so we use .item() or float()
        "best_observed_mz": round(float(best_observed_mz), 4) if best_observed_mz is not None else None,
        "max_intensity": int(max_peptide_intensity), # Ensure int
        "relative_abundance_pct": round(float(relative_abundance), 3), # Ensure float
        "qc_status": qc_status
    }