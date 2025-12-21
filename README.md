HelixGuard - Molecular Manufacturing Quality Hub is a distributed, microservices-based platform designed for high-throughput biological validation and quality control. Designed to handle the high-concurrency demands of modern biotechnology, this platform orchestrates a decentralized fleet of specialized workers to automate the verification of molecular products. It serves as a PoC for replacing fragmented, manual QC workflows with a unified, high-throughput data pipeline.

The platform consits of the following specialized Worker Nodes:

(1) CRISPR Genomics Worker: 
* Executes high-throughput sequence alignment via Bowtie2 to validate gene-editing targets.Automates the detection of off-target mutations by comparing NGS reads against reference genomes.
(2) Peptide QC Worker (Mass Spec Analytics):
* Implements $m/z$ (mass-to-charge) deconvolution to verify molecular identity in real-time.Conducts automated purity quantification by integrating LC-MS peak areas and comparing theoretical vs. observed isotopic distributions.
(3) Colony Counter Worker (Computer Vision):
* A specialized OpenCV service that automates biological yield assessment.Performs contour detection and morphological filtering to quantify growth in high-density plate assays.

Here's some snapshots of the application workflow

New User Registration
<img width="600" height="600" alt="image" src="https://github.com/user-attachments/assets/f1cd055b-f79f-472a-b973-3740983346f8" />

User Login
<img width="600" height="600" alt="image" src="https://github.com/user-attachments/assets/8679de00-a7e2-484e-a200-93b0b757aaf9" />

User upon login will be able to view a dashboard of the jobs that they have executed through the platform and their results
<img width="600" height="600" alt="image" src="https://github.com/user-attachments/assets/d0aa4aa8-3c3c-4234-9217-b417f25718dd" />

User can submit a crispr assessment job
<img width="600" height="600" alt="image" src="https://github.com/user-attachments/assets/bf902297-dce6-4548-8270-7439047666a4" />

Users can also attach their mass spectrascopy files and detect the presence of a peptide
<img width="600" height="600" alt="image" src="https://github.com/user-attachments/assets/268b44a3-c7cd-44cd-9fdc-ceb402fb637d" />

Lastly, users can attach their colony plate scans to get an instant report of any detected colonies
<img width="600" height="600" alt="image" src="https://github.com/user-attachments/assets/5ff10273-c46b-4fe1-98e8-9fe429145f78" />

They will notified of successful job submission
<img width="600" height="600" alt="image" src="https://github.com/user-attachments/assets/757038ac-9561-4bc2-8e58-e4fc1f11d3c0" />

<img width="600" height="600" alt="image" src="https://github.com/user-attachments/assets/770211e8-1c31-493b-a9d3-51fb332498fc" />
