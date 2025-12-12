# /backend/workers/crispr_genomics/crispr_analysis.py (HIGHLY SIMPLIFIED)

import logging
import subprocess 
import tempfile
import os
from typing import Dict, Any, List, Union

logger = logging.getLogger('crispr-analysis')

# --- Placeholder Models ---
class CRISPRJobResult:
    # Minimal structure for the final output
    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)
    def model_dump(self): return self.__dict__

# --- Constants ---
GENOME_INDEX_BASE = "/genomes/Saccharomyces_cerevisiae/sacCer3.1"


# --- Core Alignment Execution ---
def run_alignment_tool(gRNA_sequence: str) -> int:
    """
    Executes Bowtie2 and returns only the total number of alignments found.
    """
    dna_query = gRNA_sequence.replace('U', 'T')

    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.fasta') as tmp_query:
        tmp_query.write(f">query_gRNA\n{dna_query}\n")
        query_filename = tmp_query.name

    try:
        command = [
            "bowtie2", "-f", "-a", "-N", "1",
            "-x", GENOME_INDEX_BASE, 
            "-U", query_filename
        ]
        
        # Execute the command
        result = subprocess.run(command, capture_output=True, text=True, check=True, timeout=30)
        sam_output = result.stdout
        
        # Count non-header lines to get the total number of hits
        hit_lines = [line for line in sam_output.strip().split('\n') if not line.startswith('@')]
        actual_hit_count = len(hit_lines)
        
        return actual_hit_count
        
    except subprocess.CalledProcessError as e:
        logger.error(f"Bowtie2 execution failed: {e.stderr}")
        raise RuntimeError(f"Alignment tool failed: Bowtie2 returned error code {e.returncode}.")
    finally:
        os.remove(query_filename) 


def run_crispr_genomics(job_id: str, gRNA_sequence: str, genome_id: str) -> CRISPRJobResult:
    """
    Runs the alignment and translates the hit count into a simplified specificity status.
    """
    
    # 1. Execute the alignment and get the raw count
    total_hits = run_alignment_tool(gRNA_sequence)
    
    # 2. Simplified Specificity Logic (Based on your request)
    if total_hits == 0:
        status = "FAIL"
        reason = "No alignments found. Target site likely missing or gRNA is poor."
        summary = "No Hits (Missing Target)"
    elif total_hits == 1:
        status = "PASS"
        reason = "Perfect specificity: Only one hit found (the on-target)."
        summary = "Perfect Specificity (1 Hit)"
    elif total_hits > 1 and total_hits <= 10:
        status = "WARNING"
        reason = f"Low risk off-targets found. Total alignments: {total_hits}."
        summary = f"Low Specificity ({total_hits} Hits)"
    else: # total_hits > 10
        status = "FAIL"
        reason = f"Extreme risk off-targets. Sequence is highly repetitive. Total alignments: {total_hits}."
        summary = f"Extreme Low Specificity ({total_hits} Hits)"


    # 3. Return the Final Simplified Result
    return CRISPRJobResult(
        job_id=job_id,
        service_type='crispr_genomics',
        qc_status=status,
        qc_reason=reason,
        specificity_summary=summary,
        total_alignments_found=total_hits
    )