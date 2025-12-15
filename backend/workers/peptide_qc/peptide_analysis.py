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
    # Handle pymzML version differences for peak access
    try:
        peaks = spectrum.peaks('centroided')
    except:
        peaks = spectrum.peaks
        
    if len(peaks) == 0:
        return None, 0.0

    logger.debug(f"Searching spectrum {spectrum.ID} with {len(peaks)} peaks for target m/z {target_mz}")
    # Vectorized Numpy Search
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
        return matches_mzs[best_idx], matches_intensities[best_idx]
    
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
    logger.info(f"[{job_id}] Sequence {target_sequence} was validated")
    theoretical_mz = calculate_theoretical_mz(target_sequence, target_charge)
    
    if not os.path.exists(local_file_path):
        raise FileNotFoundError(f"MZML file not found at: {local_file_path}")

    # B. Targeted Scanning Loop (The "Metal Detector")
    run = pymzml.run.Reader(local_file_path)
    
    logger.info(f"[{job_id}] Opened MZML file: {local_file_path}")
    max_peptide_intensity = 0.0
    best_scan_total_intensity = 0.0 # TIC of the specific scan where the peptide was highest
    best_observed_mz = None
    
    # Iterate through every scan in the file
    for spectrum in run:
        if spectrum.ms_level == 1:
            # Search this specific spectrum
            found_mz, intensity = find_peak_in_spectrum(spectrum, theoretical_mz, PPM_TOLERANCE)
            
            # If we found a signal stronger than any previous scan, record it
            if intensity > max_peptide_intensity:
                max_peptide_intensity = intensity
                best_observed_mz = found_mz
                
                # Calculate the total intensity of THIS specific scan 
                # (Used for correct relative abundance calculation)
                try:
                    peaks = spectrum.peaks('centroided')
                except:
                    peaks = spectrum.peaks
                best_scan_total_intensity = np.sum(peaks[:, 1])

    # C. Compile Final Results
    logger.info(f"Computing final results for job {job_id}")
    found = max_peptide_intensity > 0
    relative_abundance = 0.0
    
    if found and best_scan_total_intensity > 0:
        # Calculate purity relative to the specific scan's background
        relative_abundance = (max_peptide_intensity / best_scan_total_intensity) * 100
    
    # QC Status logic (example threshold > 0.05% relative abundance)
    qc_status = "PASS" if relative_abundance > 0.05 else "FAIL"

    logger.info(f"[{job_id}] Result: Found={found}, Abundance={relative_abundance:.3f}%")

    return {
        "job_id": job_id,
        "sequence": target_sequence,
        "charge": target_charge,
        "theoretical_mz": round(theoretical_mz, 4),
        "found_in_sample": found,
        "best_observed_mz": round(best_observed_mz, 4) if best_observed_mz else None,
        "max_intensity": int(max_peptide_intensity),
        "relative_abundance_pct": round(relative_abundance, 3),
        "qc_status": qc_status
    }
