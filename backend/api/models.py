from pydantic import BaseModel, Field
from typing import Optional, List

# --- Shared Utility Models ---
class JobStatus(str):
    """Enforce specific status values for a job."""
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class JobBase(BaseModel):
    """Base model for all jobs' results."""
    job_id: str
    service_type: str
    status: JobStatus = JobStatus.PENDING
    s3_uri: Optional[str] = None # S3 URI of the input file

# --------------------------------------------------------------------------------
# --- 1. Authentication Models ---
# --------------------------------------------------------------------------------

class UserCreate(BaseModel):
    """Schema for user registration input."""
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)
    organization: Optional[str] = None

class UserLogin(BaseModel):
    """Schema for user login input."""
    username: str
    password: str

class Token(BaseModel):
    """Schema for the JWT token returned upon successful login/registration."""
    access_token: str
    token_type: str = "bearer"
    
# --------------------------------------------------------------------------------
# --- 2. PEPTIDE QC Worker Models (Service 2) ---
# --------------------------------------------------------------------------------

class PeptideJobSubmission(BaseModel):
    """Schema for user submitting a new peptide QC job. (Purity threshold remains 
    for completeness but is not used for PASS/FAIL in the new logic)."""
    sequence: str = Field(..., min_length=3, max_length=50, 
                          description="The amino acid sequence to check (e.g., 'ACDEF').")
    purity_threshold: float = Field(default=90.0, ge=50.0, le=100.0,
                                    description="Original target threshold (kept for parameter logging).")

class PeptideJobResult(JobBase):
    """Schema for the final result saved by the worker (saved to results.output_data JSONB).
    Updated: QC status determined by target_detected flag."""
    qc_status: str = Field(..., description="Final outcome: PASS if target_detected is True.")
    target_detected: bool = Field(..., description="True if the target peptide's mass was found within tolerance.")
    relative_abundance_pct: float = Field(..., description="Target peak intensity as a percentage of total major peak intensity.")
    target_mz: float = Field(..., description="Theoretical m/z of the target peptide.")
    observed_mz: float = Field(..., description="Observed m/z of the best matching peak.")
    ppm_error: float = Field(..., description="Accuracy error between target and observed m/z.")

# --------------------------------------------------------------------------------
# --- 3. COLONY COUNTER Worker Models (Service 3) ---
# --------------------------------------------------------------------------------

class ColonyJobSubmission(BaseModel):
    """Schema for user submitting a new colony counting job."""
    min_diameter_mm: float = Field(default=0.5, ge=0.1, 
                                   description="Minimum colony diameter to count (in mm).")

class ColonyJobResult(JobBase):
    """Schema for the final result saved by the worker (saved to results.output_data JSONB)."""
    qc_status: str = Field(..., description="Final outcome: PASS (if count > 0) or FAIL.")
    colony_count: int = Field(..., description="Total number of colonies detected.")
    total_area_cm2: float = Field(..., description="Calculated area of the colonies.")
    image_result_uri: str = Field(..., description="S3 URI of the image with colonies marked.")

# --------------------------------------------------------------------------------
# --- 4. CRISPR GENOMICS Worker Models (Service 1) ---
# --------------------------------------------------------------------------------

class CRISPRJobSubmission(BaseModel):
    """Schema for user submitting a new CRISPR job."""
    guide_rna_sequence: str = Field(..., min_length=15, max_length=25, 
                                    description="The gRNA sequence to check for off-targets.")
    genome_id: str = Field(..., description="Reference genome ID (e.g., 'GRCh38').")

class OffTargetHit(BaseModel):
    """Details for a single off-target binding location."""
    chromosome: str
    coordinate: str
    mismatch_count: int
    sequence_context: str # The DNA sequence snippet

class CRISPRJobResult(JobBase):
    """Schema for the final result saved by the worker (saved to results.output_data JSONB)."""
    qc_status: str = Field(..., description="Final outcome: PASS, FAIL, or WARNING.")
    off_target_risk_score: float = Field(..., description="Normalized risk score (0-1).")
    on_target_location: str = Field(..., description="Chromosomal location of the intended cut.")
    total_off_target_hits: int = Field(..., description="Total count of significant off-target matches.")
    hits_report: List[OffTargetHit] = Field(..., description="Detailed list of all off-target binding sites.")