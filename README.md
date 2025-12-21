# HelixGuard — Molecular Manufacturing Quality Hub

HelixGuard is a distributed, microservices-based platform for high-throughput biological validation and quality control.

Built to handle the high-concurrency demands of modern biotechnology, the platform orchestrates a decentralized fleet of specialized worker services to automate molecular verification workflows. It serves as a proof-of-concept for replacing fragmented, manual QC processes with a unified, scalable, data-driven pipeline.

## Application Workflow

Below are snapshots illustrating the end-to-end user workflow within the HelixGuard platform.

<img width="600" height="600" alt="image" src="https://github.com/user-attachments/assets/3d92745d-3c9f-4c82-a738-37eda709499a" />


### New User Registration
<img width="600" height="600" alt="New user registration" src="https://github.com/user-attachments/assets/f1cd055b-f79f-472a-b973-3740983346f8" />



### User Login
<img width="600" height="600" alt="User login" src="https://github.com/user-attachments/assets/8679de00-a7e2-484e-a200-93b0b757aaf9" />



### Job Dashboard
Upon login, users are presented with a dashboard displaying all previously submitted jobs along with their execution status and results.

<img width="600" height="600" alt="Job dashboard" src="https://github.com/user-attachments/assets/d0aa4aa8-3c3c-4234-9217-b417f25718dd" />



### CRISPR Assessment Submission
Users can submit CRISPR genomics assessment jobs directly through the UI.

<img width="600" height="600" alt="CRISPR job submission" src="https://github.com/user-attachments/assets/bf902297-dce6-4548-8270-7439047666a4" />



### Peptide Detection via Mass Spectrometry
Users may upload LC-MS data files to detect and validate the presence of target peptides.

<img width="600" height="600" alt="Peptide QC submission" src="https://github.com/user-attachments/assets/268b44a3-c7cd-44cd-9fdc-ceb402fb637d" />



### Colony Counting and Yield Assessment
Plate scan images can be uploaded to generate automated colony detection and quantification reports.

<img width="600" height="600" alt="Colony counter results" src="https://github.com/user-attachments/assets/5ff10273-c46b-4fe1-98e8-9fe429145f78" />



### Job Submission Confirmation
Users receive immediate confirmation upon successful job submission.

<img width="600" height="600" alt="Job submission confirmation" src="https://github.com/user-attachments/assets/757038ac-9561-4bc2-8e58-e4fc1f11d3c0" />


## Specialized Worker Nodes

HelixGuard is composed of independently scalable worker services, each responsible for a distinct biological validation task.

### CRISPR Genomics Worker
- Executes high-throughput sequence alignment using Bowtie2
- Validates gene-editing targets against reference genomes
- Automates off-target mutation detection by comparing NGS reads to genomic references

### Peptide QC Worker (Mass Spectrometry Analytics)
- Performs m/z (mass-to-charge) deconvolution to verify molecular identity
- Conducts automated purity quantification using LC-MS peak integration
- Compares theoretical and observed isotopic distributions for validation



### Colony Counter Worker (Computer Vision)
- OpenCV-based service for automated biological yield assessment
- Uses contour detection and morphological filtering
- Quantifies colony growth in high-density plate assays
