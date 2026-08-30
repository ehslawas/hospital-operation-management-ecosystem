// src/modules/mypriviledging/data/procedureCatalogData.ts
// Official Procedure Catalog Extracted from Hospital Lawas Clinical Credentialing Database (AHP Logbook)
// Contains all 14 clinical categories and 500+ procedures

import type { ProcedureCategory, CredentialRole, ProcedureItem } from '../types/priviledgingTypes';

export const COMMON_CATEGORIES: ProcedureCategory[] = [
  {
    "id": "peri-operative-care",
    "name": "Peri-Operative Care",
    "summary": "Operating theatre competencies across peri-operative services.",
    "groups": [
      {
        "label": "Core Procedures (43)",
        "items": [
          {
            "id": "peri-operative-care__assessment-of-patient-on-arrival-to-operating-theatre",
            "label": "Assessment of patient on arrival to operating theatre"
          },
          {
            "id": "peri-operative-care__preparation-for-general-anaesthesia",
            "label": "Preparation for general anaesthesia"
          },
          {
            "id": "peri-operative-care__preparation-for-regional-anaesthesia",
            "label": "Preparation for regional anaesthesia"
          },
          {
            "id": "peri-operative-care__assist-during-induction-of-anaesthesia",
            "label": "Assist during induction of anaesthesia"
          },
          {
            "id": "peri-operative-care__assist-during-regional-anaesthesia",
            "label": "Assist during regional anaesthesia"
          },
          {
            "id": "peri-operative-care__handling-and-safety-checks-for-electrosurgical-unit",
            "label": "Handling and safety checks for electrosurgical unit"
          },
          {
            "id": "peri-operative-care__care-of-patient-in-supine-position",
            "label": "Care of patient in supine position"
          },
          {
            "id": "peri-operative-care__care-of-patient-in-lateral-position",
            "label": "Care of patient in lateral position"
          },
          {
            "id": "peri-operative-care__care-of-patient-in-lithotomy-position",
            "label": "Care of patient in lithotomy position"
          },
          {
            "id": "peri-operative-care__care-of-patient-in-prone-position",
            "label": "Care of patient in prone position"
          },
          {
            "id": "peri-operative-care__care-of-patient-on-orthopaedic-extension-table",
            "label": "Care of patient on orthopaedic extension table"
          },
          {
            "id": "peri-operative-care__care-of-patient-in-trendelenburg-position",
            "label": "Care of patient in Trendelenburg position"
          },
          {
            "id": "peri-operative-care__surgical-scrub-technique",
            "label": "Surgical scrub technique"
          },
          {
            "id": "peri-operative-care__gowning-technique",
            "label": "Gowning technique"
          },
          {
            "id": "peri-operative-care__gloving-technique",
            "label": "Gloving technique"
          },
          {
            "id": "peri-operative-care__circulating-nurse-role-general-surgery",
            "label": "Circulating nurse role – General Surgery"
          },
          {
            "id": "peri-operative-care__instrument-nurse-role-general-surgery",
            "label": "Instrument nurse role – General Surgery"
          },
          {
            "id": "peri-operative-care__circulating-nurse-role-gynaecology-surgery",
            "label": "Circulating nurse role – Gynaecology Surgery"
          },
          {
            "id": "peri-operative-care__instrument-nurse-role-gynaecology-surgery",
            "label": "Instrument nurse role – Gynaecology Surgery"
          },
          {
            "id": "peri-operative-care__circulating-nurse-role-obstetric-surgery",
            "label": "Circulating nurse role – Obstetric Surgery"
          },
          {
            "id": "peri-operative-care__instrument-nurse-role-obstetric-surgery",
            "label": "Instrument nurse role – Obstetric Surgery"
          },
          {
            "id": "peri-operative-care__circulating-nurse-role-orthopaedic-surgery",
            "label": "Circulating nurse role – Orthopaedic Surgery"
          },
          {
            "id": "peri-operative-care__instrument-nurse-role-orthopaedic-surgery",
            "label": "Instrument nurse role – Orthopaedic Surgery"
          },
          {
            "id": "peri-operative-care__circulating-nurse-role-neurosurgery",
            "label": "Circulating nurse role – Neurosurgery"
          },
          {
            "id": "peri-operative-care__instrument-nurse-role-neurosurgery",
            "label": "Instrument nurse role – Neurosurgery"
          },
          {
            "id": "peri-operative-care__circulating-nurse-role-otorhinolaryngology-surgery",
            "label": "Circulating nurse role – Otorhinolaryngology Surgery"
          },
          {
            "id": "peri-operative-care__instrument-nurse-role-otorhinolaryngology-surgery",
            "label": "Instrument nurse role – Otorhinolaryngology Surgery"
          },
          {
            "id": "peri-operative-care__circulating-nurse-role-plastic-reconstructive-surgery",
            "label": "Circulating nurse role – Plastic & Reconstructive Surgery"
          },
          {
            "id": "peri-operative-care__instrument-nurse-role-plastic-reconstructive-surgery",
            "label": "Instrument nurse role – Plastic & Reconstructive Surgery"
          },
          {
            "id": "peri-operative-care__circulating-nurse-role-urology-surgery",
            "label": "Circulating nurse role – Urology Surgery"
          },
          {
            "id": "peri-operative-care__instrument-nurse-role-urology-surgery",
            "label": "Instrument nurse role – Urology Surgery"
          },
          {
            "id": "peri-operative-care__circulating-nurse-role-ophthalmic-surgery",
            "label": "Circulating nurse role – Ophthalmic Surgery"
          },
          {
            "id": "peri-operative-care__instrument-nurse-role-ophthalmic-surgery",
            "label": "Instrument nurse role – Ophthalmic Surgery"
          },
          {
            "id": "peri-operative-care__care-of-post-anaesthetic-patient",
            "label": "Care of post-anaesthetic patient"
          },
          {
            "id": "peri-operative-care__sterilization-procedures-steam-sterilization",
            "label": "Sterilization procedures – steam sterilization"
          },
          {
            "id": "peri-operative-care__sterilization-procedures-chemical-sterilization",
            "label": "Sterilization procedures – chemical sterilization"
          },
          {
            "id": "peri-operative-care__sterilization-procedures-sterilization-monitoring",
            "label": "Sterilization procedures – sterilization monitoring"
          },
          {
            "id": "peri-operative-care__cleaning-washing-and-packing-of-instruments",
            "label": "Cleaning, washing and packing of instruments"
          },
          {
            "id": "peri-operative-care__decontamination-of-environment-and-spillages",
            "label": "Decontamination of environment and spillages"
          },
          {
            "id": "peri-operative-care__decontamination-of-clinical-waste",
            "label": "Decontamination of clinical waste"
          },
          {
            "id": "peri-operative-care__decontamination-of-surgical-instruments",
            "label": "Decontamination of surgical instruments"
          },
          {
            "id": "peri-operative-care__decontamination-of-electrical-equipment",
            "label": "Decontamination of electrical equipment"
          },
          {
            "id": "peri-operative-care__cleaning-and-care-of-fibre-optic-scopes",
            "label": "Cleaning and care of fibre optic scopes"
          },
          {
            "id": "peri-operative-care__handling-and-dispatching-surgical-specimens",
            "label": "Handling and dispatching surgical specimens"
          }
        ]
      },
      {
        "label": "Optional Procedures (5)",
        "items": [
          {
            "id": "peri-operative-care__instrument-nurse-role-vascular-surgery",
            "label": "Instrument nurse role – Vascular Surgery"
          },
          {
            "id": "peri-operative-care__instrument-nurse-role-robotic-surgery",
            "label": "Instrument nurse role – Robotic Surgery"
          },
          {
            "id": "peri-operative-care__instrument-nurse-role-cardiothoracic-surgery",
            "label": "Instrument nurse role – Cardiothoracic Surgery"
          },
          {
            "id": "peri-operative-care__instrument-nurse-role-ophthalmic-subspecialty-surgery",
            "label": "Instrument nurse role – Ophthalmic subspecialty surgery"
          },
          {
            "id": "peri-operative-care__instrument-nurse-role-neurosurgical-subspecialty-surgery",
            "label": "Instrument nurse role – Neurosurgical subspecialty surgery"
          }
        ]
      }
    ],
    "applicableRole": "both"
  },
  {
    "id": "ophthalmology-care",
    "name": "Ophthalmology",
    "summary": "Clinical and surgical ophthalmology procedures in outpatient and theatre settings.",
    "groups": [
      {
        "label": "Clinical Procedures (29)",
        "items": [
          {
            "id": "ophthalmology-care__triaging-ophthalmology-patients",
            "label": "Triaging ophthalmology patients"
          },
          {
            "id": "ophthalmology-care__visual-acuity-measurement-adult",
            "label": "Visual acuity measurement – adult"
          },
          {
            "id": "ophthalmology-care__visual-acuity-measurement-children",
            "label": "Visual acuity measurement – children"
          },
          {
            "id": "ophthalmology-care__near-vision-measurement",
            "label": "Near vision measurement"
          },
          {
            "id": "ophthalmology-care__anterior-segment-examination",
            "label": "Anterior segment examination"
          },
          {
            "id": "ophthalmology-care__intraocular-pressure-measurement",
            "label": "Intraocular pressure measurement"
          },
          {
            "id": "ophthalmology-care__calibration-of-tonometer",
            "label": "Calibration of tonometer"
          },
          {
            "id": "ophthalmology-care__pre-operative-counselling-for-ophthalmic-procedures",
            "label": "Pre-operative counselling for ophthalmic procedures"
          },
          {
            "id": "ophthalmology-care__schirmer-s-test",
            "label": "Schirmer's test"
          },
          {
            "id": "ophthalmology-care__colour-vision-testing-ishihara",
            "label": "Colour vision testing (Ishihara)"
          },
          {
            "id": "ophthalmology-care__eyelid-hygiene-and-scrub",
            "label": "Eyelid hygiene and scrub"
          },
          {
            "id": "ophthalmology-care__eye-dressing-application",
            "label": "Eye dressing application"
          },
          {
            "id": "ophthalmology-care__instilling-eye-drops-with-punctal-occlusion",
            "label": "Instilling eye drops with punctal occlusion"
          },
          {
            "id": "ophthalmology-care__application-of-eye-pad-and-shield",
            "label": "Application of eye pad and shield"
          },
          {
            "id": "ophthalmology-care__bandage-contact-lens-insertion",
            "label": "Bandage contact lens insertion"
          },
          {
            "id": "ophthalmology-care__bandage-contact-lens-removal",
            "label": "Bandage contact lens removal"
          },
          {
            "id": "ophthalmology-care__contact-lens-wear-counselling",
            "label": "Contact lens wear counselling"
          },
          {
            "id": "ophthalmology-care__eye-rodding",
            "label": "Eye rodding"
          },
          {
            "id": "ophthalmology-care__ph-testing-of-tears",
            "label": "pH testing of tears"
          },
          {
            "id": "ophthalmology-care__eye-irrigation-procedure",
            "label": "Eye irrigation procedure"
          },
          {
            "id": "ophthalmology-care__corneal-staining",
            "label": "Corneal staining"
          },
          {
            "id": "ophthalmology-care__fundus-photography-preparation",
            "label": "Fundus photography preparation"
          },
          {
            "id": "ophthalmology-care__conjunctival-swab-collection",
            "label": "Conjunctival swab collection"
          },
          {
            "id": "ophthalmology-care__assist-corneal-scraping",
            "label": "Assist corneal scraping"
          },
          {
            "id": "ophthalmology-care__assist-retinopathy-of-prematurity-screening",
            "label": "Assist retinopathy of prematurity screening"
          },
          {
            "id": "ophthalmology-care__assist-ophthalmic-laser-therapy",
            "label": "Assist ophthalmic laser therapy"
          },
          {
            "id": "ophthalmology-care__assist-fundus-fluorescein-angiography",
            "label": "Assist fundus fluorescein angiography"
          },
          {
            "id": "ophthalmology-care__assist-lacrimal-syringing",
            "label": "Assist lacrimal syringing"
          },
          {
            "id": "ophthalmology-care__assist-incision-and-curettage",
            "label": "Assist incision and curettage"
          },
          {
            "id": "ophthalmology-care__assist-intravitreal-injection",
            "label": "Assist intravitreal injection"
          }
        ]
      },
      {
        "label": "Surgical Procedures (10)",
        "items": [
          {
            "id": "ophthalmology-care__microsurgical-instrument-cleaning-and-sterilization",
            "label": "Microsurgical instrument cleaning and sterilization"
          },
          {
            "id": "ophthalmology-care__assist-extracapsular-cataract-extraction",
            "label": "Assist extracapsular cataract extraction"
          },
          {
            "id": "ophthalmology-care__assist-phacoemulsification-surgery",
            "label": "Assist phacoemulsification surgery"
          },
          {
            "id": "ophthalmology-care__assist-pterygium-excision",
            "label": "Assist pterygium excision"
          },
          {
            "id": "ophthalmology-care__assist-vitreoretinal-surgery",
            "label": "Assist vitreoretinal surgery"
          },
          {
            "id": "ophthalmology-care__preparation-of-intraocular-gases",
            "label": "Preparation of intraocular gases"
          },
          {
            "id": "ophthalmology-care__assist-trabeculectomy-glaucoma-drainage-device-surgery",
            "label": "Assist trabeculectomy / glaucoma drainage device surgery"
          },
          {
            "id": "ophthalmology-care__assist-corneal-transplantation",
            "label": "Assist corneal transplantation"
          },
          {
            "id": "ophthalmology-care__assist-oculoplastic-surgery",
            "label": "Assist oculoplastic surgery"
          },
          {
            "id": "ophthalmology-care__assist-squint-surgery",
            "label": "Assist squint surgery"
          }
        ]
      }
    ],
    "applicableRole": "both"
  },
  {
    "id": "emergency-medicine",
    "name": "Emergency Medicine & Trauma Services",
    "summary": "Emergency and trauma competencies across triage, airway, resuscitation, surgical procedures and patient care.",
    "groups": [
      {
        "label": "Emergency Procedures (60+)",
        "items": [
          {
            "id": "emergency-medicine__hospital-triage",
            "label": "Hospital triage"
          },
          {
            "id": "emergency-medicine__field-triage",
            "label": "Field triage"
          },
          {
            "id": "emergency-medicine__insertion-of-airway-adjunct",
            "label": "Insertion of airway adjunct"
          },
          {
            "id": "emergency-medicine__insertion-of-supraglottic-airway-device",
            "label": "Insertion of supraglottic airway device"
          },
          {
            "id": "emergency-medicine__tracheal-bronchial-suctioning",
            "label": "Tracheal bronchial suctioning"
          },
          {
            "id": "emergency-medicine__prepare-and-assist-endotracheal-intubation",
            "label": "Prepare and assist endotracheal intubation"
          },
          {
            "id": "emergency-medicine__perform-or-assist-emergency-cricothyrotomy",
            "label": "Perform or assist emergency cricothyrotomy"
          },
          {
            "id": "emergency-medicine__bag-valve-mask-ventilation",
            "label": "Bag valve mask ventilation"
          },
          {
            "id": "emergency-medicine__assemble-and-test-ventilator-parameters",
            "label": "Assemble and test ventilator parameters"
          },
          {
            "id": "emergency-medicine__assess-severity-of-acute-bronchial-asthma-coad",
            "label": "Assess severity of acute bronchial asthma / COAD"
          },
          {
            "id": "emergency-medicine__prepare-prescribe-and-administer-nebulizers",
            "label": "Prepare, prescribe and administer nebulizers"
          },
          {
            "id": "emergency-medicine__administration-of-oxygen-therapy",
            "label": "Administration of oxygen therapy"
          },
          {
            "id": "emergency-medicine__intravenous-cannulation",
            "label": "Intravenous cannulation"
          },
          {
            "id": "emergency-medicine__preparation-and-administration-of-emergency-drugs",
            "label": "Preparation and administration of emergency drugs"
          },
          {
            "id": "emergency-medicine__iv-fluids-for-resuscitation",
            "label": "IV fluids for resuscitation"
          },
          {
            "id": "emergency-medicine__prepare-and-assist-cvp-line-insertion-and-monitoring",
            "label": "Prepare and assist CVP line insertion and monitoring"
          },
          {
            "id": "emergency-medicine__arterial-blood-sampling",
            "label": "Arterial blood sampling"
          },
          {
            "id": "emergency-medicine__perform-and-interpret-ecg",
            "label": "Perform and interpret ECG"
          },
          {
            "id": "emergency-medicine__recognition-of-lethal-arrhythmias",
            "label": "Recognition of lethal arrhythmias"
          },
          {
            "id": "emergency-medicine__application-and-usage-of-aed",
            "label": "Application and usage of AED"
          },
          {
            "id": "emergency-medicine__cardiopulmonary-resuscitation",
            "label": "Cardiopulmonary resuscitation"
          },
          {
            "id": "emergency-medicine__removal-of-superficial-foreign-body",
            "label": "Removal of superficial foreign body"
          },
          {
            "id": "emergency-medicine__eye-irrigation-for-chemical-injury",
            "label": "Eye irrigation for chemical injury"
          },
          {
            "id": "emergency-medicine__corneal-staining-in-emergency-setting",
            "label": "Corneal staining in emergency setting"
          },
          {
            "id": "emergency-medicine__basic-ent-nasal-packing",
            "label": "Basic ENT nasal packing"
          },
          {
            "id": "emergency-medicine__removal-of-ent-foreign-body",
            "label": "Removal of ENT foreign body"
          },
          {
            "id": "emergency-medicine__wound-toilet-and-suturing",
            "label": "Wound toilet and suturing"
          },
          {
            "id": "emergency-medicine__incision-and-drainage-of-superficial-abscess",
            "label": "Incision and drainage of superficial abscess"
          },
          {
            "id": "emergency-medicine__nail-avulsion-procedure",
            "label": "Nail avulsion procedure"
          },
          {
            "id": "emergency-medicine__prepare-and-assist-chest-tube-insertion",
            "label": "Prepare and assist chest tube insertion"
          },
          {
            "id": "emergency-medicine__assist-pericardiocentesis",
            "label": "Assist pericardiocentesis"
          },
          {
            "id": "emergency-medicine__care-of-patient-on-chest-tube",
            "label": "Care of patient on chest tube"
          },
          {
            "id": "emergency-medicine__care-of-patient-on-ventilator",
            "label": "Care of patient on ventilator"
          },
          {
            "id": "emergency-medicine__transport-of-critically-ill-patient",
            "label": "Transport of critically ill patient"
          },
          {
            "id": "emergency-medicine__assist-medico-legal-examination-of-oscc-patient",
            "label": "Assist medico-legal examination of OSCC patient"
          },
          {
            "id": "emergency-medicine__handling-of-medico-legal-specimens",
            "label": "Handling of medico legal specimens"
          },
          {
            "id": "emergency-medicine__cervical-collar-application",
            "label": "Cervical collar application"
          },
          {
            "id": "emergency-medicine__spine-immobilization",
            "label": "Spine immobilization"
          },
          {
            "id": "emergency-medicine__extremity-immobilization",
            "label": "Extremity immobilization"
          },
          {
            "id": "emergency-medicine__application-of-pelvic-immobilizer",
            "label": "Application of pelvic immobilizer"
          },
          {
            "id": "emergency-medicine__perform-log-roll-technique",
            "label": "Perform log roll technique"
          },
          {
            "id": "emergency-medicine__plaster-of-paris-application-and-care",
            "label": "Plaster of Paris application and care"
          },
          {
            "id": "emergency-medicine__reduction-of-simple-small-joint-dislocation",
            "label": "Reduction of simple small joint dislocation"
          },
          {
            "id": "emergency-medicine__comprehensive-wound-management",
            "label": "Comprehensive wound management"
          },
          {
            "id": "emergency-medicine__handling-of-amputated-limb",
            "label": "Handling of amputated limb"
          },
          {
            "id": "emergency-medicine__bladder-catheterization",
            "label": "Bladder catheterization"
          },
          {
            "id": "emergency-medicine__gastric-lavage-stomach-wash-out",
            "label": "Gastric lavage / stomach wash out"
          },
          {
            "id": "emergency-medicine__external-decontamination-procedures",
            "label": "External decontamination procedures"
          },
          {
            "id": "emergency-medicine__management-of-violent-patient",
            "label": "Management of violent patient"
          },
          {
            "id": "emergency-medicine__blood-cross-match-sampling",
            "label": "Blood cross-match sampling"
          },
          {
            "id": "emergency-medicine__transfusion-setup",
            "label": "Transfusion setup"
          },
          {
            "id": "emergency-medicine__assist-normal-delivery-in-emergency",
            "label": "Assist normal delivery in emergency"
          },
          {
            "id": "emergency-medicine__immediate-care-of-newborn-in-emergency",
            "label": "Immediate care of newborn in emergency"
          },
          {
            "id": "emergency-medicine__pelvic-immobilizer-application",
            "label": "Pelvic immobilizer application"
          },
          {
            "id": "emergency-medicine__extremity-splinting",
            "label": "Extremity splinting"
          },
          {
            "id": "emergency-medicine__application-of-traction-splints",
            "label": "Application of traction splints"
          }
        ]
      }
    ],
    "applicableRole": "both"
  },
  {
    "id": "dialysis-care",
    "name": "Dialysis Care",
    "summary": "Haemodialysis and peritoneal dialysis procedures for chronic renal replacement therapy.",
    "groups": [
      {
        "label": "Haemodialysis Procedures (17)",
        "items": [
          {
            "id": "dialysis-care__assessment-of-patient-prior-to-haemodialysis",
            "label": "Assessment of patient prior to haemodialysis"
          },
          {
            "id": "dialysis-care__care-of-arterio-venous-fistula-native",
            "label": "Care of arterio-venous fistula – native"
          },
          {
            "id": "dialysis-care__care-of-arterio-venous-fistula-graft",
            "label": "Care of arterio-venous fistula – graft"
          },
          {
            "id": "dialysis-care__care-of-haemodialysis-catheter-cuffed",
            "label": "Care of haemodialysis catheter – cuffed"
          },
          {
            "id": "dialysis-care__care-of-haemodialysis-catheter-non-cuffed",
            "label": "Care of haemodialysis catheter – non-cuffed"
          },
          {
            "id": "dialysis-care__anti-coagulation-therapy-management",
            "label": "Anti-coagulation therapy management"
          },
          {
            "id": "dialysis-care__preparation-of-haemodialysis-machine",
            "label": "Preparation of haemodialysis machine"
          },
          {
            "id": "dialysis-care__setting-up-dialyzer-and-bloodline",
            "label": "Setting up dialyzer and bloodline"
          },
          {
            "id": "dialysis-care__priming-of-dialyzer-and-bloodline",
            "label": "Priming of dialyzer and bloodline"
          },
          {
            "id": "dialysis-care__cannulation-technique-for-haemodialysis",
            "label": "Cannulation technique for haemodialysis"
          },
          {
            "id": "dialysis-care__initiation-of-haemodialysis-treatment",
            "label": "Initiation of haemodialysis treatment"
          },
          {
            "id": "dialysis-care__termination-of-haemodialysis-treatment",
            "label": "Termination of haemodialysis treatment"
          },
          {
            "id": "dialysis-care__disinfection-of-haemodialysis-machine",
            "label": "Disinfection of haemodialysis machine"
          },
          {
            "id": "dialysis-care__decalcification-of-haemodialysis-machine",
            "label": "Decalcification of haemodialysis machine"
          },
          {
            "id": "dialysis-care__reprocessing-of-dialyzer",
            "label": "Reprocessing of dialyzer"
          },
          {
            "id": "dialysis-care__management-of-intradialytic-complication",
            "label": "Management of intradialytic complication"
          },
          {
            "id": "dialysis-care__monitoring-water-treatment-system",
            "label": "Monitoring water treatment system"
          }
        ]
      },
      {
        "label": "Peritoneal Dialysis Procedures (19)",
        "items": [
          {
            "id": "dialysis-care__assessment-of-patient-assistant-for-pd-treatment",
            "label": "Assessment of patient / assistant for PD treatment"
          },
          {
            "id": "dialysis-care__care-of-pd-catheter-pre-operatively",
            "label": "Care of PD catheter pre-operatively"
          },
          {
            "id": "dialysis-care__care-of-pd-catheter-post-operatively",
            "label": "Care of PD catheter post-operatively"
          },
          {
            "id": "dialysis-care__flushing-of-pd-catheter",
            "label": "Flushing of PD catheter"
          },
          {
            "id": "dialysis-care__pd-prescription-planning",
            "label": "PD prescription planning"
          },
          {
            "id": "dialysis-care__continuous-ambulatory-peritoneal-dialysis-capd-training",
            "label": "Continuous ambulatory peritoneal dialysis (CAPD) training"
          },
          {
            "id": "dialysis-care__automated-peritoneal-dialysis-apd-training",
            "label": "Automated peritoneal dialysis (APD) training"
          },
          {
            "id": "dialysis-care__application-and-change-of-transfer-set",
            "label": "Application and change of transfer set"
          },
          {
            "id": "dialysis-care__exit-site-care-for-pd-catheter",
            "label": "Exit site care for PD catheter"
          },
          {
            "id": "dialysis-care__management-of-peritonitis",
            "label": "Management of peritonitis"
          },
          {
            "id": "dialysis-care__peritoneal-equilibration-test-pet",
            "label": "Peritoneal equilibration test (PET)"
          },
          {
            "id": "dialysis-care__assessment-of-dialysis-adequacy-pd",
            "label": "Assessment of dialysis adequacy – PD"
          },
          {
            "id": "dialysis-care__pd-effluent-sampling-for-microbiology",
            "label": "PD effluent sampling for microbiology"
          },
          {
            "id": "dialysis-care__exit-site-swab-sampling",
            "label": "Exit site swab sampling"
          },
          {
            "id": "dialysis-care__tunnel-infection-swab-sampling",
            "label": "Tunnel infection swab sampling"
          },
          {
            "id": "dialysis-care__nasal-swab-sampling-for-culture",
            "label": "Nasal swab sampling for culture"
          },
          {
            "id": "dialysis-care__intraperitoneal-antibiotic-administration",
            "label": "Intraperitoneal antibiotic administration"
          },
          {
            "id": "dialysis-care__parenteral-iron-administration-in-pd",
            "label": "Parenteral iron administration in PD"
          },
          {
            "id": "dialysis-care__handling-pd-effluent-with-infective-risk",
            "label": "Handling PD effluent with infective risk"
          }
        ]
      }
    ],
    "applicableRole": "both"
  },
  {
    "id": "pre-hospital-care",
    "name": "Pre Hospital Care Services",
    "summary": "Emergency medical services procedures from dispatch to on-scene care and transport.",
    "groups": [
      {
        "label": "Pre-hospital Procedures (70+)",
        "items": [
          {
            "id": "pre-hospital-care__provide-dispatch-cpr-instruction",
            "label": "Provide dispatch CPR instruction"
          },
          {
            "id": "pre-hospital-care__manage-and-triage-emergency-call-including-methane",
            "label": "Manage and triage emergency call including METHANE"
          },
          {
            "id": "pre-hospital-care__provide-delivery-and-newborn-management-instruction-over-phone",
            "label": "Provide delivery and newborn management instruction over phone"
          },
          {
            "id": "pre-hospital-care__scene-assessment-in-primary-response",
            "label": "Scene assessment in primary response"
          },
          {
            "id": "pre-hospital-care__scene-and-risk-assessment-for-medical-standby",
            "label": "Scene and risk assessment for medical standby"
          },
          {
            "id": "pre-hospital-care__scene-staging-in-multiple-casualty-incident",
            "label": "Scene staging in multiple casualty incident"
          },
          {
            "id": "pre-hospital-care__insertion-of-airway-adjuncts-in-pre-hospital-setting",
            "label": "Insertion of airway adjuncts in pre-hospital setting"
          },
          {
            "id": "pre-hospital-care__sellick-s-manoeuvre-application",
            "label": "Sellick's manoeuvre application"
          },
          {
            "id": "pre-hospital-care__insertion-of-supraglottic-airway-device",
            "label": "Insertion of supraglottic airway device"
          },
          {
            "id": "pre-hospital-care__tracheal-bronchial-suctioning-pre-hospital",
            "label": "Tracheal bronchial suctioning – pre-hospital"
          },
          {
            "id": "pre-hospital-care__adult-endotracheal-intubation-crash-airway",
            "label": "Adult endotracheal intubation (crash airway)"
          },
          {
            "id": "pre-hospital-care__ent-foreign-body-removal-pre-hospital",
            "label": "ENT foreign body removal (pre-hospital)"
          },
          {
            "id": "pre-hospital-care__administration-of-oxygen-therapy-ambulance-care",
            "label": "Administration of oxygen therapy – ambulance care"
          },
          {
            "id": "pre-hospital-care__bipap-cpap-usage-in-pre-hospital-environment",
            "label": "BiPAP / CPAP usage in pre-hospital environment"
          },
          {
            "id": "pre-hospital-care__needle-chest-decompression-in-field",
            "label": "Needle chest decompression in field"
          },
          {
            "id": "pre-hospital-care__chest-tube-monitoring-during-transport",
            "label": "Chest tube monitoring during transport"
          },
          {
            "id": "pre-hospital-care__end-tidal-co2-capnography-monitoring",
            "label": "End tidal CO2 / capnography monitoring"
          },
          {
            "id": "pre-hospital-care__bag-valve-mask-ventilation-pre-hospital",
            "label": "Bag valve mask ventilation – pre-hospital"
          },
          {
            "id": "pre-hospital-care__ventilator-assembly-and-management-during-transport",
            "label": "Ventilator assembly and management during transport"
          },
          {
            "id": "pre-hospital-care__assess-manage-acute-bronchial-asthma-coad-in-field",
            "label": "Assess/Manage acute bronchial asthma / COAD in field"
          },
          {
            "id": "pre-hospital-care__nebulizer-administration-ambulance",
            "label": "Nebulizer administration – ambulance"
          },
          {
            "id": "pre-hospital-care__intravenous-cannulation-pre-hospital",
            "label": "Intravenous cannulation – pre-hospital"
          },
          {
            "id": "pre-hospital-care__intraosseous-access-insertion",
            "label": "Intraosseous access insertion"
          },
          {
            "id": "pre-hospital-care__central-line-cannulation-femoral",
            "label": "Central line cannulation – femoral"
          },
          {
            "id": "pre-hospital-care__central-line-cannulation-external-jugular",
            "label": "Central line cannulation – external jugular"
          },
          {
            "id": "pre-hospital-care__aed-manual-defibrillation",
            "label": "AED / Manual defibrillation"
          },
          {
            "id": "pre-hospital-care__electrical-cardioversion-pre-hospital",
            "label": "Electrical cardioversion – pre-hospital"
          },
          {
            "id": "pre-hospital-care__carotid-massage-for-svt",
            "label": "Carotid massage for SVT"
          },
          {
            "id": "pre-hospital-care__transcutaneous-pacing",
            "label": "Transcutaneous pacing"
          },
          {
            "id": "pre-hospital-care__spinal-immobilization-trauma",
            "label": "Spinal immobilization – trauma"
          },
          {
            "id": "pre-hospital-care__extrication-of-seated-trauma-patient",
            "label": "Extrication of seated trauma patient"
          },
          {
            "id": "pre-hospital-care__extremity-splinting-in-field",
            "label": "Extremity splinting in field"
          },
          {
            "id": "pre-hospital-care__traction-splint-application",
            "label": "Traction splint application"
          },
          {
            "id": "pre-hospital-care__tourniquet-application-and-monitoring",
            "label": "Tourniquet application and monitoring"
          },
          {
            "id": "pre-hospital-care__cervical-immobilization",
            "label": "Cervical immobilization"
          },
          {
            "id": "pre-hospital-care__pelvic-immobilizer-application",
            "label": "Pelvic immobilizer application"
          },
          {
            "id": "pre-hospital-care__hemorrhage-control-in-open-wound",
            "label": "Hemorrhage control in open wound"
          },
          {
            "id": "pre-hospital-care__hemostatic-suturing-pre-hospital",
            "label": "Hemostatic suturing – pre-hospital"
          },
          {
            "id": "pre-hospital-care__management-of-evisceration-injury",
            "label": "Management of evisceration injury"
          },
          {
            "id": "pre-hospital-care__management-of-impaled-foreign-object",
            "label": "Management of impaled foreign object"
          },
          {
            "id": "pre-hospital-care__management-of-amputation-injury-and-amputated-limb",
            "label": "Management of amputation injury and amputated limb"
          },
          {
            "id": "pre-hospital-care__ppe-level-2-donning-and-doffing",
            "label": "PPE Level 2 donning and doffing"
          },
          {
            "id": "pre-hospital-care__ppe-level-3-donning-and-doffing",
            "label": "PPE Level 3 donning and doffing"
          },
          {
            "id": "pre-hospital-care__ppe-level-4-donning-and-doffing",
            "label": "PPE Level 4 donning and doffing"
          },
          {
            "id": "pre-hospital-care__decontamination-of-ambulance-vehicle",
            "label": "Decontamination of ambulance vehicle"
          },
          {
            "id": "pre-hospital-care__decontamination-of-equipment",
            "label": "Decontamination of equipment"
          },
          {
            "id": "pre-hospital-care__decontamination-of-patient-cbrn",
            "label": "Decontamination of patient (CBRN)"
          },
          {
            "id": "pre-hospital-care__emergency-move-of-patient",
            "label": "Emergency move of patient"
          },
          {
            "id": "pre-hospital-care__non-emergency-move-of-patient",
            "label": "Non-emergency move of patient"
          },
          {
            "id": "pre-hospital-care__radio-communication-protocols",
            "label": "Radio communication protocols"
          },
          {
            "id": "pre-hospital-care__medication-administration-adenosine",
            "label": "Medication administration – adenosine"
          },
          {
            "id": "pre-hospital-care__medication-administration-adrenaline",
            "label": "Medication administration – adrenaline"
          },
          {
            "id": "pre-hospital-care__medication-administration-amiodarone",
            "label": "Medication administration – amiodarone"
          },
          {
            "id": "pre-hospital-care__medication-administration-aspirin",
            "label": "Medication administration – aspirin"
          },
          {
            "id": "pre-hospital-care__medication-administration-atropine",
            "label": "Medication administration – atropine"
          },
          {
            "id": "pre-hospital-care__medication-administration-dextrose",
            "label": "Medication administration – dextrose"
          },
          {
            "id": "pre-hospital-care__medication-administration-diclofenac",
            "label": "Medication administration – diclofenac"
          },
          {
            "id": "pre-hospital-care__medication-administration-furosemide",
            "label": "Medication administration – furosemide"
          },
          {
            "id": "pre-hospital-care__medication-administration-lidocaine",
            "label": "Medication administration – lidocaine"
          },
          {
            "id": "pre-hospital-care__medication-administration-magnesium-sulphate",
            "label": "Medication administration – magnesium sulphate"
          },
          {
            "id": "pre-hospital-care__medication-administration-midazolam",
            "label": "Medication administration – midazolam"
          },
          {
            "id": "pre-hospital-care__medication-administration-morphine",
            "label": "Medication administration – morphine"
          },
          {
            "id": "pre-hospital-care__medication-administration-naloxone",
            "label": "Medication administration – naloxone"
          },
          {
            "id": "pre-hospital-care__medication-administration-nitroglycerine",
            "label": "Medication administration – nitroglycerine"
          },
          {
            "id": "pre-hospital-care__medication-administration-nitrous-oxide",
            "label": "Medication administration – nitrous oxide"
          },
          {
            "id": "pre-hospital-care__field-triage-during-disaster",
            "label": "Field triage during disaster"
          },
          {
            "id": "pre-hospital-care__scene-staging-in-mass-casualty-incident",
            "label": "Scene staging in mass casualty incident"
          },
          {
            "id": "pre-hospital-care__decontamination-in-cbrn-incident",
            "label": "Decontamination in CBRN incident"
          },
          {
            "id": "pre-hospital-care__simulation-respiratory-distress-management",
            "label": "Simulation – respiratory distress management"
          },
          {
            "id": "pre-hospital-care__simulation-bronchial-asthma-management",
            "label": "Simulation – bronchial asthma management"
          },
          {
            "id": "pre-hospital-care__simulation-unconscious-patient-management",
            "label": "Simulation – unconscious patient management"
          },
          {
            "id": "pre-hospital-care__simulation-trauma-with-haemorrhage",
            "label": "Simulation – trauma with haemorrhage"
          },
          {
            "id": "pre-hospital-care__simulation-chest-injury-scenario",
            "label": "Simulation – chest injury scenario"
          },
          {
            "id": "pre-hospital-care__simulation-abdominal-injury-scenario",
            "label": "Simulation – abdominal injury scenario"
          },
          {
            "id": "pre-hospital-care__simulation-failed-airway-management",
            "label": "Simulation – failed airway management"
          }
        ]
      }
    ],
    "applicableRole": "both"
  },
  {
    "id": "endoscopy-services",
    "name": "Endoscopy Services",
    "summary": "Endoscopy unit procedures including diagnostic and therapeutic interventions.",
    "groups": [
      {
        "label": "Core Procedures (12 categories)",
        "items": [
          {
            "id": "endoscopy-services__assessment-and-history-taking-for-endoscopy-patients",
            "label": "Assessment and history taking for endoscopy patients"
          },
          {
            "id": "endoscopy-services__discharge-planning-for-endoscopy-patients",
            "label": "Discharge planning for endoscopy patients"
          },
          {
            "id": "endoscopy-services__preparation-of-patient-for-ogds",
            "label": "Preparation of patient for OGDS"
          },
          {
            "id": "endoscopy-services__preparation-of-patient-for-colonoscopy",
            "label": "Preparation of patient for colonoscopy"
          },
          {
            "id": "endoscopy-services__preparation-of-trolleys-equipment-and-accessories",
            "label": "Preparation of trolleys, equipment and accessories"
          },
          {
            "id": "endoscopy-services__preparation-and-calibration-of-monitoring-system",
            "label": "Preparation and calibration of monitoring system"
          },
          {
            "id": "endoscopy-services__care-of-patient-during-ogds",
            "label": "Care of patient during OGDS"
          },
          {
            "id": "endoscopy-services__care-of-patient-during-colonoscopy",
            "label": "Care of patient during colonoscopy"
          },
          {
            "id": "endoscopy-services__immediate-care-post-endoscopy-procedure",
            "label": "Immediate care post endoscopy procedure"
          },
          {
            "id": "endoscopy-services__collection-and-dispatch-of-tissue-samples",
            "label": "Collection and dispatch of tissue samples"
          },
          {
            "id": "endoscopy-services__administration-of-sedation-for-endoscopy",
            "label": "Administration of sedation for endoscopy"
          },
          {
            "id": "endoscopy-services__reprocessing-of-endoscope-and-accessories",
            "label": "Reprocessing of endoscope and accessories"
          }
        ]
      },
      {
        "label": "Therapeutic Procedures (includes optional 17)",
        "items": [
          {
            "id": "endoscopy-services__diagnostic-ogds",
            "label": "Diagnostic OGDS"
          },
          {
            "id": "endoscopy-services__diagnostic-colonoscopy",
            "label": "Diagnostic colonoscopy"
          },
          {
            "id": "endoscopy-services__therapeutic-haemostasis-adrenalin-injection",
            "label": "Therapeutic haemostasis – adrenalin injection"
          },
          {
            "id": "endoscopy-services__therapeutic-haemostasis-rubber-band-ligation",
            "label": "Therapeutic haemostasis – rubber band ligation"
          },
          {
            "id": "endoscopy-services__therapeutic-haemostasis-argon-plasma-coagulation",
            "label": "Therapeutic haemostasis – argon plasma coagulation"
          },
          {
            "id": "endoscopy-services__therapeutic-haemostasis-heater-probe",
            "label": "Therapeutic haemostasis – heater probe"
          },
          {
            "id": "endoscopy-services__therapeutic-haemostasis-haemoclip",
            "label": "Therapeutic haemostasis – haemoclip"
          },
          {
            "id": "endoscopy-services__therapeutic-haemostasis-haemospray-endoclot",
            "label": "Therapeutic haemostasis – haemospray / endoclot"
          },
          {
            "id": "endoscopy-services__therapeutic-haemostasis-histoacryl-glue",
            "label": "Therapeutic haemostasis – histoacryl glue"
          },
          {
            "id": "endoscopy-services__polypectomy-procedure",
            "label": "Polypectomy procedure"
          },
          {
            "id": "endoscopy-services__endoscopic-retrograde-cholangiopancreatography-ercp",
            "label": "Endoscopic retrograde cholangiopancreatography (ERCP)"
          },
          {
            "id": "endoscopy-services__endoscopic-ultrasound-eus",
            "label": "Endoscopic ultrasound (EUS)"
          },
          {
            "id": "endoscopy-services__single-balloon-enteroscopy",
            "label": "Single balloon enteroscopy"
          },
          {
            "id": "endoscopy-services__double-balloon-enteroscopy",
            "label": "Double balloon enteroscopy"
          },
          {
            "id": "endoscopy-services__percutaneous-endoscopic-gastrostomy-peg",
            "label": "Percutaneous endoscopic gastrostomy (PEG)"
          },
          {
            "id": "endoscopy-services__percutaneous-endoscopic-jejunostomy-pej",
            "label": "Percutaneous endoscopic jejunostomy (PEJ)"
          },
          {
            "id": "endoscopy-services__endoscopic-mucosal-resection-emr",
            "label": "Endoscopic mucosal resection (EMR)"
          },
          {
            "id": "endoscopy-services__endoscopic-submucosal-dissection-esd",
            "label": "Endoscopic submucosal dissection (ESD)"
          },
          {
            "id": "endoscopy-services__peroral-endoscopic-myotomy-poem",
            "label": "Peroral endoscopic myotomy (POEM)"
          },
          {
            "id": "endoscopy-services__oesophageal-dilatation",
            "label": "Oesophageal dilatation"
          },
          {
            "id": "endoscopy-services__metallic-stenting",
            "label": "Metallic stenting"
          },
          {
            "id": "endoscopy-services__enteral-feeding-tube-placement",
            "label": "Enteral feeding tube placement"
          },
          {
            "id": "endoscopy-services__oesophageal-manometry",
            "label": "Oesophageal manometry"
          },
          {
            "id": "endoscopy-services__24-hour-ph-monitoring-and-impedance",
            "label": "24-hour pH monitoring and impedance"
          },
          {
            "id": "endoscopy-services__urea-breath-test-ubt",
            "label": "Urea breath test (UBT)"
          },
          {
            "id": "endoscopy-services__capsule-endoscopy",
            "label": "Capsule endoscopy"
          },
          {
            "id": "endoscopy-services__sengstaken-tube-insertion",
            "label": "Sengstaken tube insertion"
          },
          {
            "id": "endoscopy-services__pseudocyst-drainage",
            "label": "Pseudocyst drainage"
          },
          {
            "id": "endoscopy-services__spyglass-cholangioscopy",
            "label": "Spyglass cholangioscopy"
          },
          {
            "id": "endoscopy-services__endoscopic-marker-injection",
            "label": "Endoscopic marker injection"
          }
        ]
      }
    ],
    "applicableRole": "both"
  },
  {
    "id": "orthopaedic-services",
    "name": "Orthopaedic Services",
    "summary": "Orthopaedic ward and emergency procedures including casting, traction and rehabilitation.",
    "groups": [
      {
        "label": "Orthopaedic Procedures (54)",
        "items": [
          {
            "id": "orthopaedic-services__preparation-and-application-of-thomas-splint",
            "label": "Preparation and application of Thomas splint"
          },
          {
            "id": "orthopaedic-services__preparation-and-application-of-bohler-braun-frame",
            "label": "Preparation and application of Bohler Braun frame"
          },
          {
            "id": "orthopaedic-services__application-and-care-of-skin-traction",
            "label": "Application and care of skin traction"
          },
          {
            "id": "orthopaedic-services__application-and-care-of-skeletal-traction",
            "label": "Application and care of skeletal traction"
          },
          {
            "id": "orthopaedic-services__application-and-care-of-fixed-traction",
            "label": "Application and care of fixed traction"
          },
          {
            "id": "orthopaedic-services__care-of-patient-with-plaster-of-paris",
            "label": "Care of patient with plaster of Paris"
          },
          {
            "id": "orthopaedic-services__application-of-halter-traction",
            "label": "Application of halter traction"
          },
          {
            "id": "orthopaedic-services__assist-application-and-care-of-halovest",
            "label": "Assist application and care of halovest"
          },
          {
            "id": "orthopaedic-services__neurovascular-assessment-with-traction",
            "label": "Neurovascular assessment with traction"
          },
          {
            "id": "orthopaedic-services__neurovascular-assessment-post-cast-application",
            "label": "Neurovascular assessment post cast application"
          },
          {
            "id": "orthopaedic-services__neurovascular-assessment-post-operation",
            "label": "Neurovascular assessment post-operation"
          },
          {
            "id": "orthopaedic-services__pre-and-post-operative-care-for-amputation",
            "label": "Pre and post operative care for amputation"
          },
          {
            "id": "orthopaedic-services__pre-and-post-operative-care-for-trauma",
            "label": "Pre and post operative care for trauma"
          },
          {
            "id": "orthopaedic-services__pre-and-post-operative-care-for-non-trauma",
            "label": "Pre and post operative care for non-trauma"
          },
          {
            "id": "orthopaedic-services__application-of-cryo-cuff",
            "label": "Application of cryo cuff"
          },
          {
            "id": "orthopaedic-services__application-of-continuous-passive-motion-cpm",
            "label": "Application of continuous passive motion (CPM)"
          },
          {
            "id": "orthopaedic-services__immediate-management-of-spinal-injury-log-rolling",
            "label": "Immediate management of spinal injury – log rolling"
          },
          {
            "id": "orthopaedic-services__skin-care-for-spinal-injury-patient",
            "label": "Skin care for spinal injury patient"
          },
          {
            "id": "orthopaedic-services__bowel-training-for-spinal-injury-patient",
            "label": "Bowel training for spinal injury patient"
          },
          {
            "id": "orthopaedic-services__bladder-training-for-spinal-injury-patient",
            "label": "Bladder training for spinal injury patient"
          },
          {
            "id": "orthopaedic-services__range-of-motion-exercises",
            "label": "Range of motion exercises"
          },
          {
            "id": "orthopaedic-services__static-quadriceps-exercise-education",
            "label": "Static quadriceps exercise education"
          },
          {
            "id": "orthopaedic-services__ankle-foot-pump-exercise-education",
            "label": "Ankle foot pump exercise education"
          },
          {
            "id": "orthopaedic-services__deep-breathing-exercise-education",
            "label": "Deep breathing exercise education"
          },
          {
            "id": "orthopaedic-services__ambulating-patient-with-crutches",
            "label": "Ambulating patient with crutches"
          },
          {
            "id": "orthopaedic-services__ambulating-patient-with-walking-frame",
            "label": "Ambulating patient with walking frame"
          },
          {
            "id": "orthopaedic-services__ambulating-patient-with-wheelchair",
            "label": "Ambulating patient with wheelchair"
          },
          {
            "id": "orthopaedic-services__care-of-patient-with-cast-or-slab",
            "label": "Care of patient with cast or slab"
          },
          {
            "id": "orthopaedic-services__interpretation-of-musculoskeletal-upper-limb-x-ray",
            "label": "Interpretation of musculoskeletal upper limb x-ray"
          },
          {
            "id": "orthopaedic-services__interpretation-of-musculoskeletal-lower-limb-x-ray",
            "label": "Interpretation of musculoskeletal lower limb x-ray"
          },
          {
            "id": "orthopaedic-services__interpretation-of-spine-x-ray",
            "label": "Interpretation of spine x-ray"
          },
          {
            "id": "orthopaedic-services__application-of-arm-sling",
            "label": "Application of arm sling"
          },
          {
            "id": "orthopaedic-services__application-of-stump-bandage",
            "label": "Application of stump bandage"
          },
          {
            "id": "orthopaedic-services__application-of-limb-bandage",
            "label": "Application of limb bandage"
          },
          {
            "id": "orthopaedic-services__principles-and-care-of-knee-brace",
            "label": "Principles and care of knee brace"
          },
          {
            "id": "orthopaedic-services__principles-and-care-of-juwette-brace",
            "label": "Principles and care of JUWETTE brace"
          },
          {
            "id": "orthopaedic-services__principles-and-care-of-somi-brace",
            "label": "Principles and care of SOMI brace"
          },
          {
            "id": "orthopaedic-services__application-of-shoulder-strapping",
            "label": "Application of shoulder strapping"
          },
          {
            "id": "orthopaedic-services__application-of-volar-or-dorsal-slab",
            "label": "Application of volar or dorsal slab"
          },
          {
            "id": "orthopaedic-services__application-of-above-elbow-backslab",
            "label": "Application of above elbow backslab"
          },
          {
            "id": "orthopaedic-services__application-of-below-elbow-backslab",
            "label": "Application of below elbow backslab"
          },
          {
            "id": "orthopaedic-services__application-of-colles-cast",
            "label": "Application of Colles cast"
          },
          {
            "id": "orthopaedic-services__application-of-bennet-cast",
            "label": "Application of Bennet cast"
          },
          {
            "id": "orthopaedic-services__application-of-ulnar-gutter-cast",
            "label": "Application of ulnar gutter cast"
          },
          {
            "id": "orthopaedic-services__application-of-thumb-spica-cast",
            "label": "Application of thumb spica cast"
          },
          {
            "id": "orthopaedic-services__application-of-scaphoid-cast",
            "label": "Application of scaphoid cast"
          },
          {
            "id": "orthopaedic-services__application-of-hanging-cast",
            "label": "Application of hanging cast"
          },
          {
            "id": "orthopaedic-services__application-of-u-slab",
            "label": "Application of \"U\" slab"
          },
          {
            "id": "orthopaedic-services__application-of-above-knee-backslab",
            "label": "Application of above knee backslab"
          },
          {
            "id": "orthopaedic-services__application-of-below-knee-backslab",
            "label": "Application of below knee backslab"
          },
          {
            "id": "orthopaedic-services__application-of-cylinder-cast",
            "label": "Application of cylinder cast"
          },
          {
            "id": "orthopaedic-services__application-of-boot-cast",
            "label": "Application of boot cast"
          },
          {
            "id": "orthopaedic-services__application-of-patellar-tendon-bearing-cast",
            "label": "Application of patellar tendon bearing cast"
          },
          {
            "id": "orthopaedic-services__application-of-body-cast",
            "label": "Application of body cast"
          },
          {
            "id": "orthopaedic-services__application-of-minerva-jacket",
            "label": "Application of Minerva jacket"
          },
          {
            "id": "orthopaedic-services__application-of-hip-spica",
            "label": "Application of hip spica"
          },
          {
            "id": "orthopaedic-services__serial-casting-for-ctev-ponseti-cast",
            "label": "Serial casting for CTEV / Ponseti cast"
          },
          {
            "id": "orthopaedic-services__wedging-of-cast",
            "label": "Wedging of cast"
          },
          {
            "id": "orthopaedic-services__removal-of-halovest",
            "label": "Removal of halovest"
          },
          {
            "id": "orthopaedic-services__removal-of-external-fixator",
            "label": "Removal of external fixator"
          },
          {
            "id": "orthopaedic-services__removal-of-cast",
            "label": "Removal of cast"
          },
          {
            "id": "orthopaedic-services__perform-closed-manual-reduction-cmr",
            "label": "Perform closed manual reduction (CMR)"
          }
        ]
      }
    ],
    "applicableRole": "both"
  },
  {
    "id": "peri-anaesthesia-care",
    "name": "Peri-Anaesthesia Care (PAC)",
    "summary": "Peri-anaesthesia procedures covering airway, monitoring, anaesthetic equipment and recovery care.",
    "groups": [
      {
        "label": "Core Procedures (50)",
        "items": [
          {
            "id": "peri-anaesthesia-care__assemble-and-disassemble-laryngoscope",
            "label": "Assemble and disassemble laryngoscope"
          },
          {
            "id": "peri-anaesthesia-care__prepare-video-assisted-laryngoscope",
            "label": "Prepare video assisted laryngoscope"
          },
          {
            "id": "peri-anaesthesia-care__cleaning-decontamination-and-sterilization-of-breathing-system",
            "label": "Cleaning, decontamination and sterilization of breathing system"
          },
          {
            "id": "peri-anaesthesia-care__preparation-for-intubation",
            "label": "Preparation for intubation"
          },
          {
            "id": "peri-anaesthesia-care__preparation-and-assistance-in-awake-fibreoptic-intubation",
            "label": "Preparation and assistance in awake fibreoptic intubation"
          },
          {
            "id": "peri-anaesthesia-care__application-of-cricoid-pressure",
            "label": "Application of cricoid pressure"
          },
          {
            "id": "peri-anaesthesia-care__preparation-of-supraglottic-airway-adjuncts",
            "label": "Preparation of supraglottic airway adjuncts"
          },
          {
            "id": "peri-anaesthesia-care__preparation-of-difficult-airway-trolley",
            "label": "Preparation of difficult airway trolley"
          },
          {
            "id": "peri-anaesthesia-care__assist-in-difficult-intubation",
            "label": "Assist in difficult intubation"
          },
          {
            "id": "peri-anaesthesia-care__perform-endotracheal-intubation",
            "label": "Perform endotracheal intubation"
          },
          {
            "id": "peri-anaesthesia-care__perform-endotracheal-extubation",
            "label": "Perform endotracheal extubation"
          },
          {
            "id": "peri-anaesthesia-care__perform-supraglottic-airway-insertion",
            "label": "Perform supraglottic airway insertion"
          },
          {
            "id": "peri-anaesthesia-care__perform-supraglottic-airway-extubation",
            "label": "Perform supraglottic airway extubation"
          },
          {
            "id": "peri-anaesthesia-care__checking-and-calibrating-anaesthesia-machine",
            "label": "Checking and calibrating anaesthesia machine"
          },
          {
            "id": "peri-anaesthesia-care__identify-and-troubleshoot-anaesthesia-machine",
            "label": "Identify and troubleshoot anaesthesia machine"
          },
          {
            "id": "peri-anaesthesia-care__prepare-and-assist-total-intravenous-anaesthesia-tiva-tci",
            "label": "Prepare and assist total intravenous anaesthesia (TIVA / TCI)"
          },
          {
            "id": "peri-anaesthesia-care__assemble-bispectral-index-bis-monitor",
            "label": "Assemble bispectral index (BIS) monitor"
          },
          {
            "id": "peri-anaesthesia-care__prepare-and-assist-chest-tube-insertion",
            "label": "Prepare and assist chest tube insertion"
          },
          {
            "id": "peri-anaesthesia-care__refilling-vaporizers",
            "label": "Refilling vaporizers"
          },
          {
            "id": "peri-anaesthesia-care__emptying-vaporizers-safely",
            "label": "Emptying vaporizers safely"
          },
          {
            "id": "peri-anaesthesia-care__assemble-anaesthesia-breathing-circuit",
            "label": "Assemble anaesthesia breathing circuit"
          },
          {
            "id": "peri-anaesthesia-care__assemble-ayre-s-t-piece-circuit",
            "label": "Assemble Ayre's T-piece circuit"
          },
          {
            "id": "peri-anaesthesia-care__application-of-rapid-sequence-induction",
            "label": "Application of rapid sequence induction"
          },
          {
            "id": "peri-anaesthesia-care__assemble-passive-humidification-system",
            "label": "Assemble passive humidification system"
          },
          {
            "id": "peri-anaesthesia-care__prepare-anaesthetic-nebulizer-system",
            "label": "Prepare anaesthetic nebulizer system"
          },
          {
            "id": "peri-anaesthesia-care__prepare-and-check-anaesthesia-resuscitation-trolley",
            "label": "Prepare and check anaesthesia resuscitation trolley"
          },
          {
            "id": "peri-anaesthesia-care__setting-up-patient-controlled-analgesia-pca-pump",
            "label": "Setting up patient controlled analgesia (PCA) pump"
          },
          {
            "id": "peri-anaesthesia-care__care-during-positioning-supine",
            "label": "Care during positioning – supine"
          },
          {
            "id": "peri-anaesthesia-care__care-during-positioning-prone",
            "label": "Care during positioning – prone"
          },
          {
            "id": "peri-anaesthesia-care__care-during-positioning-lithotomy",
            "label": "Care during positioning – lithotomy"
          },
          {
            "id": "peri-anaesthesia-care__care-of-patient-on-pneumatic-tourniquet",
            "label": "Care of patient on pneumatic tourniquet"
          },
          {
            "id": "peri-anaesthesia-care__prepare-and-care-for-spinal-nerve-block",
            "label": "Prepare and care for spinal nerve block"
          },
          {
            "id": "peri-anaesthesia-care__prepare-and-care-for-epidural-block",
            "label": "Prepare and care for epidural block"
          },
          {
            "id": "peri-anaesthesia-care__prepare-pulse-oximeter-and-interpret",
            "label": "Prepare pulse oximeter and interpret"
          },
          {
            "id": "peri-anaesthesia-care__set-up-capnography-system",
            "label": "Set up capnography system"
          },
          {
            "id": "peri-anaesthesia-care__insert-temperature-probe",
            "label": "Insert temperature probe"
          },
          {
            "id": "peri-anaesthesia-care__assemble-pressure-transducer-system",
            "label": "Assemble pressure transducer system"
          },
          {
            "id": "peri-anaesthesia-care__care-of-patient-with-invasive-lines",
            "label": "Care of patient with invasive lines"
          },
          {
            "id": "peri-anaesthesia-care__assemble-oxygen-therapy-devices",
            "label": "Assemble oxygen therapy devices"
          },
          {
            "id": "peri-anaesthesia-care__application-of-peripheral-nerve-stimulator",
            "label": "Application of peripheral nerve stimulator"
          },
          {
            "id": "peri-anaesthesia-care__assemble-intraoperative-warming-device",
            "label": "Assemble intraoperative warming device"
          },
          {
            "id": "peri-anaesthesia-care__assemble-fluid-warming-device",
            "label": "Assemble fluid warming device"
          },
          {
            "id": "peri-anaesthesia-care__assemble-blood-warming-device",
            "label": "Assemble blood warming device"
          },
          {
            "id": "peri-anaesthesia-care__transportation-of-critically-ill-patient",
            "label": "Transportation of critically ill patient"
          },
          {
            "id": "peri-anaesthesia-care__preoperative-assessment-in-pac",
            "label": "Preoperative assessment in PAC"
          },
          {
            "id": "peri-anaesthesia-care__care-of-patient-in-recovery-area",
            "label": "Care of patient in recovery area"
          },
          {
            "id": "peri-anaesthesia-care__assess-level-of-block-for-regional-anaesthesia",
            "label": "Assess level of block for regional anaesthesia"
          },
          {
            "id": "peri-anaesthesia-care__assess-bromage-score",
            "label": "Assess Bromage score"
          },
          {
            "id": "peri-anaesthesia-care__assess-sedation-scale",
            "label": "Assess sedation scale"
          },
          {
            "id": "peri-anaesthesia-care__assess-recovery-score",
            "label": "Assess recovery score"
          },
          {
            "id": "peri-anaesthesia-care__assess-pain-score",
            "label": "Assess pain score"
          },
          {
            "id": "peri-anaesthesia-care__care-of-patient-under-acute-pain-service",
            "label": "Care of patient under acute pain service"
          }
        ]
      },
      {
        "label": "Optional Procedures (13)",
        "items": [
          {
            "id": "peri-anaesthesia-care__prepare-non-invasive-cardiac-output-monitoring",
            "label": "Prepare non-invasive cardiac output monitoring"
          },
          {
            "id": "peri-anaesthesia-care__prepare-invasive-cardiac-output-monitoring",
            "label": "Prepare invasive cardiac output monitoring"
          },
          {
            "id": "peri-anaesthesia-care__assemble-rapid-infusion-device",
            "label": "Assemble rapid infusion device"
          },
          {
            "id": "peri-anaesthesia-care__prepare-double-lumen-tube-or-endobronchial-blocker",
            "label": "Prepare double lumen tube or endobronchial blocker"
          },
          {
            "id": "peri-anaesthesia-care__assemble-and-calibrate-icp-monitoring",
            "label": "Assemble and calibrate ICP monitoring"
          },
          {
            "id": "peri-anaesthesia-care__assist-autologous-blood-transfusion",
            "label": "Assist autologous blood transfusion"
          },
          {
            "id": "peri-anaesthesia-care__assemble-jet-ventilation-system",
            "label": "Assemble jet ventilation system"
          },
          {
            "id": "peri-anaesthesia-care__prepare-and-assist-cricothyrotomy",
            "label": "Prepare and assist cricothyrotomy"
          },
          {
            "id": "peri-anaesthesia-care__assemble-cerebral-oximetry-monitoring",
            "label": "Assemble cerebral oximetry monitoring"
          },
          {
            "id": "peri-anaesthesia-care__care-of-echocardiography-ultrasound-machine",
            "label": "Care of echocardiography / ultrasound machine"
          },
          {
            "id": "peri-anaesthesia-care__assist-ga-in-mri-suite",
            "label": "Assist GA in MRI suite"
          },
          {
            "id": "peri-anaesthesia-care__assist-ga-in-ect-suite",
            "label": "Assist GA in ECT suite"
          },
          {
            "id": "peri-anaesthesia-care__assist-ga-in-remote-locations-ir-ct-oncology",
            "label": "Assist GA in remote locations (IR / CT / Oncology)"
          }
        ]
      }
    ],
    "applicableRole": "both"
  }
];

export const NURSES_ONLY_CATEGORIES: ProcedureCategory[] = [
  {
    "id": "intensive-care-nursing",
    "name": "Intensive Care Nursing",
    "summary": "ICU, paediatric, cardiothoracic and neuro intensive care procedures for nurses.",
    "groups": [
      {
        "label": "General ICU Core Procedures (28)",
        "items": [
          {
            "id": "intensive-care-nursing__preparation-for-receiving-icu-patient",
            "label": "Preparation for receiving ICU patient"
          },
          {
            "id": "intensive-care-nursing__transport-of-critically-ill-patient",
            "label": "Transport of critically ill patient"
          },
          {
            "id": "intensive-care-nursing__charting-icu-observations",
            "label": "Charting ICU observations"
          },
          {
            "id": "intensive-care-nursing__icu-hand-hygiene-protocol",
            "label": "ICU hand hygiene protocol"
          },
          {
            "id": "intensive-care-nursing__dose-calculation-and-preparation-dopamine",
            "label": "Dose calculation and preparation – dopamine"
          },
          {
            "id": "intensive-care-nursing__dose-calculation-and-preparation-dobutamine",
            "label": "Dose calculation and preparation – dobutamine"
          },
          {
            "id": "intensive-care-nursing__dose-calculation-and-preparation-adrenaline",
            "label": "Dose calculation and preparation – adrenaline"
          },
          {
            "id": "intensive-care-nursing__dose-calculation-and-preparation-noradrenaline",
            "label": "Dose calculation and preparation – noradrenaline"
          },
          {
            "id": "intensive-care-nursing__dose-calculation-and-preparation-insulin-infusion",
            "label": "Dose calculation and preparation – insulin infusion"
          },
          {
            "id": "intensive-care-nursing__dose-calculation-and-preparation-fentanyl",
            "label": "Dose calculation and preparation – fentanyl"
          },
          {
            "id": "intensive-care-nursing__dose-calculation-and-preparation-midazolam",
            "label": "Dose calculation and preparation – midazolam"
          },
          {
            "id": "intensive-care-nursing__dose-calculation-and-preparation-morphine",
            "label": "Dose calculation and preparation – morphine"
          },
          {
            "id": "intensive-care-nursing__assemble-pressure-transducer-system",
            "label": "Assemble pressure transducer system"
          },
          {
            "id": "intensive-care-nursing__blood-sampling-from-arterial-line",
            "label": "Blood sampling from arterial line"
          },
          {
            "id": "intensive-care-nursing__care-of-patient-on-arterial-line",
            "label": "Care of patient on arterial line"
          },
          {
            "id": "intensive-care-nursing__care-of-patient-on-central-venous-line",
            "label": "Care of patient on central venous line"
          },
          {
            "id": "intensive-care-nursing__management-of-invasive-ventilation",
            "label": "Management of invasive ventilation"
          },
          {
            "id": "intensive-care-nursing__prepare-and-assist-intubation",
            "label": "Prepare and assist intubation"
          },
          {
            "id": "intensive-care-nursing__prepare-capnometry-equipment",
            "label": "Prepare capnometry equipment"
          },
          {
            "id": "intensive-care-nursing__manual-ventilation-for-intubated-patients",
            "label": "Manual ventilation for intubated patients"
          },
          {
            "id": "intensive-care-nursing__management-of-endotracheal-tube",
            "label": "Management of endotracheal tube"
          },
          {
            "id": "intensive-care-nursing__management-of-tracheostomy-tube",
            "label": "Management of tracheostomy tube"
          },
          {
            "id": "intensive-care-nursing__management-of-non-invasive-ventilation",
            "label": "Management of non-invasive ventilation"
          },
          {
            "id": "intensive-care-nursing__management-of-humidifier",
            "label": "Management of humidifier"
          },
          {
            "id": "intensive-care-nursing__assist-chest-physiotherapy",
            "label": "Assist chest physiotherapy"
          },
          {
            "id": "intensive-care-nursing__assist-incentive-spirometry",
            "label": "Assist incentive spirometry"
          },
          {
            "id": "intensive-care-nursing__tracheo-bronchial-suctioning-open-method",
            "label": "Tracheo-bronchial suctioning (open method)"
          },
          {
            "id": "intensive-care-nursing__tracheo-bronchial-suctioning-closed-method",
            "label": "Tracheo-bronchial suctioning (closed method)"
          },
          {
            "id": "intensive-care-nursing__administer-aerosol-drugs-via-mdi",
            "label": "Administer aerosol drugs via MDI"
          },
          {
            "id": "intensive-care-nursing__administer-aerosol-drugs-via-nebulizer",
            "label": "Administer aerosol drugs via nebulizer"
          },
          {
            "id": "intensive-care-nursing__prepare-and-extubate-patient",
            "label": "Prepare and extubate patient"
          },
          {
            "id": "intensive-care-nursing__interpret-abnormal-laboratory-results",
            "label": "Interpret abnormal laboratory results"
          },
          {
            "id": "intensive-care-nursing__perform-pain-scoring",
            "label": "Perform pain scoring"
          },
          {
            "id": "intensive-care-nursing__perform-sedation-scoring",
            "label": "Perform sedation scoring"
          },
          {
            "id": "intensive-care-nursing__management-of-continuous-enteral-nutrition",
            "label": "Management of continuous enteral nutrition"
          },
          {
            "id": "intensive-care-nursing__management-of-total-parenteral-nutrition",
            "label": "Management of total parenteral nutrition"
          },
          {
            "id": "intensive-care-nursing__recognition-of-life-threatening-arrhythmias",
            "label": "Recognition of life-threatening arrhythmias"
          },
          {
            "id": "intensive-care-nursing__assist-or-perform-defibrillation",
            "label": "Assist or perform defibrillation"
          }
        ]
      },
      {
        "label": "General ICU Optional Procedures (9)",
        "items": [
          {
            "id": "intensive-care-nursing__calculate-and-administer-neuromuscular-blockers",
            "label": "Calculate and administer neuromuscular blockers"
          },
          {
            "id": "intensive-care-nursing__apply-capnometer-and-interpret",
            "label": "Apply capnometer and interpret"
          },
          {
            "id": "intensive-care-nursing__apply-pneumatic-cuff-compressors-for-dvt-prophylaxis",
            "label": "Apply pneumatic cuff compressors for DVT prophylaxis"
          },
          {
            "id": "intensive-care-nursing__prepare-and-assist-percutaneous-tracheostomy",
            "label": "Prepare and assist percutaneous tracheostomy"
          },
          {
            "id": "intensive-care-nursing__care-of-patient-on-icp-monitoring-with-evd",
            "label": "Care of patient on ICP monitoring with EVD"
          },
          {
            "id": "intensive-care-nursing__prepare-and-assist-bronchoscopy",
            "label": "Prepare and assist bronchoscopy"
          },
          {
            "id": "intensive-care-nursing__care-of-patient-on-continuous-renal-replacement-therapy-crrt",
            "label": "Care of patient on continuous renal replacement therapy (CRRT)"
          },
          {
            "id": "intensive-care-nursing__administer-aerosol-drugs-during-non-invasive-ventilation",
            "label": "Administer aerosol drugs during non-invasive ventilation"
          },
          {
            "id": "intensive-care-nursing__prepare-and-assist-brain-stem-function-test",
            "label": "Prepare and assist brain stem function test"
          }
        ]
      },
      {
        "label": "Paediatric Intensive Care Core (9)",
        "items": [
          {
            "id": "intensive-care-nursing__physical-assessment-cns",
            "label": "Physical assessment – CNS"
          },
          {
            "id": "intensive-care-nursing__physical-assessment-cardiovascular",
            "label": "Physical assessment – cardiovascular"
          },
          {
            "id": "intensive-care-nursing__physical-assessment-respiratory",
            "label": "Physical assessment – respiratory"
          },
          {
            "id": "intensive-care-nursing__physical-assessment-genito-urinary",
            "label": "Physical assessment – genito-urinary"
          },
          {
            "id": "intensive-care-nursing__physical-assessment-gastrointestinal",
            "label": "Physical assessment – gastrointestinal"
          },
          {
            "id": "intensive-care-nursing__paediatric-pain-score-assessment",
            "label": "Paediatric pain score assessment"
          },
          {
            "id": "intensive-care-nursing__fluid-maintenance-and-resuscitation-calculation",
            "label": "Fluid maintenance and resuscitation calculation"
          },
          {
            "id": "intensive-care-nursing__care-of-child-on-ventilator",
            "label": "Care of child on ventilator"
          },
          {
            "id": "intensive-care-nursing__ett-tracheostomy-suctioning-with-manual-bagging",
            "label": "ETT / tracheostomy suctioning with manual bagging"
          }
        ]
      },
      {
        "label": "Paediatric Intensive Care Optional (1)",
        "items": [
          {
            "id": "intensive-care-nursing__glasgow-coma-scale-assessment-for-infant",
            "label": "Glasgow Coma Scale assessment for infant"
          }
        ]
      },
      {
        "label": "Cardiothoracic ICU Core (15)",
        "items": [
          {
            "id": "intensive-care-nursing__observe-coronary-artery-bypass-graft-surgery",
            "label": "Observe coronary artery bypass graft surgery"
          },
          {
            "id": "intensive-care-nursing__observe-valve-surgery",
            "label": "Observe valve surgery"
          },
          {
            "id": "intensive-care-nursing__preparation-for-admission-of-post-cardiac-surgery-patient",
            "label": "Preparation for admission of post cardiac surgery patient"
          },
          {
            "id": "intensive-care-nursing__charge-nurse-role-receiving-post-cardiac-surgery-patient",
            "label": "Charge nurse role receiving post cardiac surgery patient"
          },
          {
            "id": "intensive-care-nursing__set-up-temporary-epicardial-cardiac-pacemaker",
            "label": "Set up temporary epicardial cardiac pacemaker"
          },
          {
            "id": "intensive-care-nursing__remove-pulmonary-artery-catheter",
            "label": "Remove pulmonary artery catheter"
          },
          {
            "id": "intensive-care-nursing__perform-thermodilution-cardiac-output-study",
            "label": "Perform thermodilution cardiac output study"
          },
          {
            "id": "intensive-care-nursing__care-of-patient-on-intra-aortic-balloon-pump-iabp",
            "label": "Care of patient on intra-aortic balloon pump (IABP)"
          },
          {
            "id": "intensive-care-nursing__perform-doppler-ultrasound-for-arterial-pulsation",
            "label": "Perform Doppler ultrasound for arterial pulsation"
          },
          {
            "id": "intensive-care-nursing__manage-potassium-infusion-therapy",
            "label": "Manage potassium infusion therapy"
          },
          {
            "id": "intensive-care-nursing__manage-calcium-infusion-therapy",
            "label": "Manage calcium infusion therapy"
          },
          {
            "id": "intensive-care-nursing__manage-magnesium-infusion-therapy",
            "label": "Manage magnesium infusion therapy"
          },
          {
            "id": "intensive-care-nursing__care-of-patient-with-chest-drain-post-cardiac-surgery",
            "label": "Care of patient with chest drain post cardiac surgery"
          },
          {
            "id": "intensive-care-nursing__removal-of-chest-drain-post-cardiac-surgery",
            "label": "Removal of chest drain post cardiac surgery"
          },
          {
            "id": "intensive-care-nursing__care-of-patient-on-nitric-oxide-therapy",
            "label": "Care of patient on nitric oxide therapy"
          }
        ]
      },
      {
        "label": "Cardiothoracic ICU Optional (8)",
        "items": [
          {
            "id": "intensive-care-nursing__observe-thoracic-surgery",
            "label": "Observe thoracic surgery"
          },
          {
            "id": "intensive-care-nursing__assist-insertion-of-pulmonary-artery-catheter",
            "label": "Assist insertion of pulmonary artery catheter"
          },
          {
            "id": "intensive-care-nursing__assist-elective-cardioversion",
            "label": "Assist elective cardioversion"
          },
          {
            "id": "intensive-care-nursing__assist-insertion-of-iabp",
            "label": "Assist insertion of IABP"
          },
          {
            "id": "intensive-care-nursing__assist-removal-of-iabp",
            "label": "Assist removal of IABP"
          },
          {
            "id": "intensive-care-nursing__assist-removal-of-epicardial-pacing-wire",
            "label": "Assist removal of epicardial pacing wire"
          },
          {
            "id": "intensive-care-nursing__assist-emergency-chest-re-open-in-cicu",
            "label": "Assist emergency chest re-open in CICU"
          },
          {
            "id": "intensive-care-nursing__support-patient-post-iabp-removal",
            "label": "Support patient post IABP removal"
          }
        ]
      },
      {
        "label": "Neuro ICU Core (6)",
        "items": [
          {
            "id": "intensive-care-nursing__interpret-icp-waveform",
            "label": "Interpret ICP waveform"
          },
          {
            "id": "intensive-care-nursing__set-up-icp-monitoring-with-evd",
            "label": "Set up ICP monitoring with EVD"
          },
          {
            "id": "intensive-care-nursing__care-of-patient-on-icp-monitoring-with-evd",
            "label": "Care of patient on ICP monitoring with EVD"
          },
          {
            "id": "intensive-care-nursing__perform-csf-drainage-via-evd",
            "label": "Perform CSF drainage via EVD"
          },
          {
            "id": "intensive-care-nursing__care-of-patient-with-raised-icp",
            "label": "Care of patient with raised ICP"
          },
          {
            "id": "intensive-care-nursing__post-operative-care-of-neurosurgical-patient",
            "label": "Post-operative care of neurosurgical patient"
          }
        ]
      },
      {
        "label": "Neuro ICU Optional (2)",
        "items": [
          {
            "id": "intensive-care-nursing__collect-csf-sampling-via-evd",
            "label": "Collect CSF sampling via EVD"
          },
          {
            "id": "intensive-care-nursing__post-operative-care-of-cerebral-aneurysm-surgery-patient",
            "label": "Post-operative care of cerebral aneurysm surgery patient"
          }
        ]
      }
    ],
    "applicableRole": "nurses"
  },
  {
    "id": "general-paediatric-nursing",
    "name": "General Paediatric Nursing",
    "summary": "Paediatric ward procedures covering assessment, interventions and specialised paediatric care.",
    "groups": [
      {
        "label": "Core Procedures (21)",
        "items": [
          {
            "id": "general-paediatric-nursing__assess-paediatric-patient-on-admission",
            "label": "Assess paediatric patient on admission"
          },
          {
            "id": "general-paediatric-nursing__assess-level-of-consciousness-paediatric",
            "label": "Assess level of consciousness – paediatric"
          },
          {
            "id": "general-paediatric-nursing__paediatric-venepuncture",
            "label": "Paediatric venepuncture"
          },
          {
            "id": "general-paediatric-nursing__peripheral-venous-cannulation-paediatric",
            "label": "Peripheral venous cannulation – paediatric"
          },
          {
            "id": "general-paediatric-nursing__heel-prick-for-capillary-blood-sugar",
            "label": "Heel prick for capillary blood sugar"
          },
          {
            "id": "general-paediatric-nursing__finger-prick-for-capillary-blood-sugar",
            "label": "Finger prick for capillary blood sugar"
          },
          {
            "id": "general-paediatric-nursing__insertion-of-nasogastric-tube",
            "label": "Insertion of nasogastric tube"
          },
          {
            "id": "general-paediatric-nursing__insertion-of-orogastric-tube",
            "label": "Insertion of orogastric tube"
          },
          {
            "id": "general-paediatric-nursing__enteral-tube-feeding",
            "label": "Enteral tube feeding"
          },
          {
            "id": "general-paediatric-nursing__collection-of-urine-for-culture",
            "label": "Collection of urine for culture"
          },
          {
            "id": "general-paediatric-nursing__peak-flow-meter-measurement",
            "label": "Peak flow meter measurement"
          },
          {
            "id": "general-paediatric-nursing__administration-of-metered-dose-inhaler",
            "label": "Administration of metered dose inhaler"
          },
          {
            "id": "general-paediatric-nursing__nebulization-paediatric",
            "label": "Nebulization – paediatric"
          },
          {
            "id": "general-paediatric-nursing__assist-lumbar-puncture",
            "label": "Assist lumbar puncture"
          },
          {
            "id": "general-paediatric-nursing__paediatric-blood-transfusion",
            "label": "Paediatric blood transfusion"
          },
          {
            "id": "general-paediatric-nursing__administration-of-oral-sedation",
            "label": "Administration of oral sedation"
          },
          {
            "id": "general-paediatric-nursing__administration-of-rectal-medication",
            "label": "Administration of rectal medication"
          },
          {
            "id": "general-paediatric-nursing__monitoring-patient-under-sedation",
            "label": "Monitoring patient under sedation"
          },
          {
            "id": "general-paediatric-nursing__oro-nasopharyngeal-suctioning",
            "label": "Oro-nasopharyngeal suctioning"
          },
          {
            "id": "general-paediatric-nursing__bag-valve-mask-ventilation-paediatric",
            "label": "Bag valve mask ventilation – paediatric"
          },
          {
            "id": "general-paediatric-nursing__use-of-cardiorespiratory-monitor-and-alarm-limits",
            "label": "Use of cardiorespiratory monitor and alarm limits"
          },
          {
            "id": "general-paediatric-nursing__intra-inter-hospital-transfer-of-paediatric-patient",
            "label": "Intra / inter hospital transfer of paediatric patient"
          },
          {
            "id": "general-paediatric-nursing__assist-chest-tube-placement-paediatric",
            "label": "Assist chest tube placement – paediatric"
          }
        ]
      },
      {
        "label": "Optional Procedures (18)",
        "items": [
          {
            "id": "general-paediatric-nursing__assist-central-line-placement-paediatric",
            "label": "Assist central line placement – paediatric"
          },
          {
            "id": "general-paediatric-nursing__care-of-central-venous-line-paediatric",
            "label": "Care of central venous line – paediatric"
          },
          {
            "id": "general-paediatric-nursing__care-of-chemo-port-paediatric",
            "label": "Care of chemo port – paediatric"
          },
          {
            "id": "general-paediatric-nursing__setting-up-total-parenteral-nutrition-paediatric",
            "label": "Setting up total parenteral nutrition – paediatric"
          },
          {
            "id": "general-paediatric-nursing__assist-intubation-paediatric",
            "label": "Assist intubation – paediatric"
          },
          {
            "id": "general-paediatric-nursing__endotracheal-suctioning-paediatric",
            "label": "Endotracheal suctioning – paediatric"
          },
          {
            "id": "general-paediatric-nursing__care-of-tracheostomy-paediatric",
            "label": "Care of tracheostomy – paediatric"
          },
          {
            "id": "general-paediatric-nursing__blood-sampling-from-arterial-line-paediatric",
            "label": "Blood sampling from arterial line – paediatric"
          },
          {
            "id": "general-paediatric-nursing__care-of-patient-on-non-invasive-ventilation-paediatric",
            "label": "Care of patient on non-invasive ventilation – paediatric"
          },
          {
            "id": "general-paediatric-nursing__stoma-care-paediatric",
            "label": "Stoma care – paediatric"
          },
          {
            "id": "general-paediatric-nursing__phototherapy-paediatric",
            "label": "Phototherapy – paediatric"
          },
          {
            "id": "general-paediatric-nursing__checking-photolight-irradiance",
            "label": "Checking photolight irradiance"
          },
          {
            "id": "general-paediatric-nursing__assist-bone-marrow-aspiration",
            "label": "Assist bone marrow aspiration"
          },
          {
            "id": "general-paediatric-nursing__assist-chest-tube-placement-repeat",
            "label": "Assist chest tube placement (repeat)"
          },
          {
            "id": "general-paediatric-nursing__assist-bladder-catheterization-paediatric",
            "label": "Assist bladder catheterization – paediatric"
          },
          {
            "id": "general-paediatric-nursing__care-of-patient-on-peritoneal-dialysis-paediatric",
            "label": "Care of patient on peritoneal dialysis – paediatric"
          },
          {
            "id": "general-paediatric-nursing__wet-wrap-therapy",
            "label": "Wet wrap therapy"
          },
          {
            "id": "general-paediatric-nursing__basic-ecg-interpretation-paediatric",
            "label": "Basic ECG interpretation – paediatric"
          }
        ]
      }
    ],
    "applicableRole": "nurses"
  },
  {
    "id": "neonatal-nursing",
    "name": "Neonatal Nursing Services",
    "summary": "Neonatal intensive care procedures including ventilation, nutrition and specialist neonatal support.",
    "groups": [
      {
        "label": "Core Procedures (49)",
        "items": [
          {
            "id": "neonatal-nursing__admission-of-newborn-to-neonatal-unit",
            "label": "Admission of newborn to neonatal unit"
          },
          {
            "id": "neonatal-nursing__comprehensive-clinical-assessment-of-neonate",
            "label": "Comprehensive clinical assessment of neonate"
          },
          {
            "id": "neonatal-nursing__anthropometric-measurements-for-neonate",
            "label": "Anthropometric measurements for neonate"
          },
          {
            "id": "neonatal-nursing__thermoregulation-of-newborn",
            "label": "Thermoregulation of newborn"
          },
          {
            "id": "neonatal-nursing__stabilization-and-transfer-of-neonate",
            "label": "Stabilization and transfer of neonate"
          },
          {
            "id": "neonatal-nursing__discharge-planning-for-neonate",
            "label": "Discharge planning for neonate"
          },
          {
            "id": "neonatal-nursing__application-of-pulse-oximeter-and-interpretation",
            "label": "Application of pulse oximeter and interpretation"
          },
          {
            "id": "neonatal-nursing__setting-up-invasive-blood-pressure-monitoring-neonate",
            "label": "Setting up invasive blood pressure monitoring – neonate"
          },
          {
            "id": "neonatal-nursing__use-of-cardiorespiratory-monitor-and-alarm-limits-neonate",
            "label": "Use of cardiorespiratory monitor and alarm limits – neonate"
          },
          {
            "id": "neonatal-nursing__heel-prick-sampling",
            "label": "Heel prick sampling"
          },
          {
            "id": "neonatal-nursing__incubator-care-cleaning-and-disinfection",
            "label": "Incubator care – cleaning and disinfection"
          },
          {
            "id": "neonatal-nursing__care-of-neonate-in-humidified-incubator",
            "label": "Care of neonate in humidified incubator"
          },
          {
            "id": "neonatal-nursing__weaning-neonate-from-incubator",
            "label": "Weaning neonate from incubator"
          },
          {
            "id": "neonatal-nursing__use-of-radiant-warmer-manual-mode",
            "label": "Use of radiant warmer – manual mode"
          },
          {
            "id": "neonatal-nursing__use-of-radiant-warmer-servo-mode",
            "label": "Use of radiant warmer – servo mode"
          },
          {
            "id": "neonatal-nursing__phototherapy-setup",
            "label": "Phototherapy setup"
          },
          {
            "id": "neonatal-nursing__checking-photolight-irradiance-neonate",
            "label": "Checking photolight irradiance – neonate"
          },
          {
            "id": "neonatal-nursing__prepare-and-assist-exchange-transfusion",
            "label": "Prepare and assist exchange transfusion"
          },
          {
            "id": "neonatal-nursing__administer-nasal-prong-oxygen",
            "label": "Administer nasal prong oxygen"
          },
          {
            "id": "neonatal-nursing__setting-up-conventional-ventilator-neonate",
            "label": "Setting up conventional ventilator – neonate"
          },
          {
            "id": "neonatal-nursing__care-of-baby-on-conventional-ventilator",
            "label": "Care of baby on conventional ventilator"
          },
          {
            "id": "neonatal-nursing__setting-up-non-invasive-ventilator-neonate",
            "label": "Setting up non-invasive ventilator – neonate"
          },
          {
            "id": "neonatal-nursing__care-of-baby-on-non-invasive-ventilator",
            "label": "Care of baby on non-invasive ventilator"
          },
          {
            "id": "neonatal-nursing__blood-gas-interpretation-neonate",
            "label": "Blood gas interpretation – neonate"
          },
          {
            "id": "neonatal-nursing__assist-umbilical-venous-cannulation",
            "label": "Assist umbilical venous cannulation"
          },
          {
            "id": "neonatal-nursing__assist-umbilical-arterial-cannulation",
            "label": "Assist umbilical arterial cannulation"
          },
          {
            "id": "neonatal-nursing__peripherally-inserted-central-catheter-picc-assistance",
            "label": "Peripherally inserted central catheter (PICC) assistance"
          },
          {
            "id": "neonatal-nursing__care-of-central-line-neonate",
            "label": "Care of central line – neonate"
          },
          {
            "id": "neonatal-nursing__setting-up-total-parenteral-nutrition-neonate",
            "label": "Setting up total parenteral nutrition – neonate"
          },
          {
            "id": "neonatal-nursing__blood-sampling-from-arterial-line-neonate",
            "label": "Blood sampling from arterial line – neonate"
          },
          {
            "id": "neonatal-nursing__education-on-expressed-breast-milk-collection",
            "label": "Education on expressed breast milk collection"
          },
          {
            "id": "neonatal-nursing__handling-and-storage-of-expressed-breast-milk",
            "label": "Handling and storage of expressed breast milk"
          },
          {
            "id": "neonatal-nursing__cup-feeding-expressed-breast-milk",
            "label": "Cup feeding expressed breast milk"
          },
          {
            "id": "neonatal-nursing__spoon-feeding-expressed-breast-milk",
            "label": "Spoon feeding expressed breast milk"
          },
          {
            "id": "neonatal-nursing__enteral-tube-feeding-neonate",
            "label": "Enteral tube feeding – neonate"
          },
          {
            "id": "neonatal-nursing__administration-of-oral-medication-neonate",
            "label": "Administration of oral medication – neonate"
          },
          {
            "id": "neonatal-nursing__administration-of-rectal-medication-neonate",
            "label": "Administration of rectal medication – neonate"
          },
          {
            "id": "neonatal-nursing__bag-valve-mask-resuscitation-neonate",
            "label": "Bag valve mask resuscitation – neonate"
          },
          {
            "id": "neonatal-nursing__oro-nasopharyngeal-suctioning-neonate",
            "label": "Oro-nasopharyngeal suctioning – neonate"
          },
          {
            "id": "neonatal-nursing__assist-endotracheal-intubation-neonate",
            "label": "Assist endotracheal intubation – neonate"
          },
          {
            "id": "neonatal-nursing__endotracheal-suction-open-method",
            "label": "Endotracheal suction – open method"
          },
          {
            "id": "neonatal-nursing__endotracheal-suction-closed-method",
            "label": "Endotracheal suction – closed method"
          },
          {
            "id": "neonatal-nursing__extubation-of-neonate",
            "label": "Extubation of neonate"
          },
          {
            "id": "neonatal-nursing__assist-lumbar-puncture-neonate",
            "label": "Assist lumbar puncture – neonate"
          },
          {
            "id": "neonatal-nursing__neonatal-blood-transfusion",
            "label": "Neonatal blood transfusion"
          },
          {
            "id": "neonatal-nursing__assist-chest-tube-placement-neonate",
            "label": "Assist chest tube placement – neonate"
          },
          {
            "id": "neonatal-nursing__care-of-neonate-with-chest-tube",
            "label": "Care of neonate with chest tube"
          },
          {
            "id": "neonatal-nursing__preparation-for-rop-screening",
            "label": "Preparation for ROP screening"
          }
        ]
      },
      {
        "label": "Optional Procedures (9)",
        "items": [
          {
            "id": "neonatal-nursing__use-of-transcutaneous-bilirubinometer",
            "label": "Use of transcutaneous bilirubinometer"
          },
          {
            "id": "neonatal-nursing__use-of-transcutaneous-carbon-dioxide-monitor",
            "label": "Use of transcutaneous carbon dioxide monitor"
          },
          {
            "id": "neonatal-nursing__setting-up-high-frequency-ventilator",
            "label": "Setting up high frequency ventilator"
          },
          {
            "id": "neonatal-nursing__care-of-neonate-on-high-frequency-ventilation",
            "label": "Care of neonate on high frequency ventilation"
          },
          {
            "id": "neonatal-nursing__care-of-neonate-on-inhaled-nitric-oxide",
            "label": "Care of neonate on inhaled nitric oxide"
          },
          {
            "id": "neonatal-nursing__care-of-newborn-undergoing-hypothermia-therapy",
            "label": "Care of newborn undergoing hypothermia therapy"
          },
          {
            "id": "neonatal-nursing__neonatal-stoma-care",
            "label": "Neonatal stoma care"
          },
          {
            "id": "neonatal-nursing__care-of-neonate-with-tracheostomy",
            "label": "Care of neonate with tracheostomy"
          },
          {
            "id": "neonatal-nursing__newborn-hearing-screening",
            "label": "Newborn hearing screening"
          }
        ]
      }
    ],
    "applicableRole": "nurses"
  }
];

export const AMO_ONLY_CATEGORIES: ProcedureCategory[] = [
  {
    "id": "cardiovascular-perfusion",
    "name": "Cardiovascular Perfusion",
    "summary": "Perfusionist procedures for cardiac bypass and circulatory support.",
    "groups": [
      {
        "label": "Core Procedures (3)",
        "items": [
          {
            "id": "cardiovascular-perfusion__conduct-cardiopulmonary-bypass-for-cabg-valve-adult-congenital-surgery",
            "label": "Conduct cardiopulmonary bypass for CABG / valve / adult congenital surgery"
          },
          {
            "id": "cardiovascular-perfusion__set-up-intra-aortic-balloon-pump",
            "label": "Set-up intra-aortic balloon pump"
          },
          {
            "id": "cardiovascular-perfusion__perform-intraoperative-red-cell-salvage-with-cell-saver",
            "label": "Perform intraoperative red cell salvage with cell saver"
          }
        ]
      },
      {
        "label": "Optional Procedures (3)",
        "items": [
          {
            "id": "cardiovascular-perfusion__conduct-cpb-using-centrifugal-pump",
            "label": "Conduct CPB using centrifugal pump"
          },
          {
            "id": "cardiovascular-perfusion__conduct-cpb-using-vacuum-assisted-venous-drainage-vavd",
            "label": "Conduct CPB using vacuum assisted venous drainage (VAVD)"
          },
          {
            "id": "cardiovascular-perfusion__conduct-cpb-for-thoracic-aortic-surgery",
            "label": "Conduct CPB for thoracic aortic surgery"
          },
          {
            "id": "cardiovascular-perfusion__perform-ultrafiltration-during-cpb",
            "label": "Perform ultrafiltration during CPB"
          }
        ]
      },
      {
        "label": "Specialized Procedures (2)",
        "items": [
          {
            "id": "cardiovascular-perfusion__extracorporeal-membrane-oxygenation-ecmo",
            "label": "Extracorporeal membrane oxygenation (ECMO)"
          },
          {
            "id": "cardiovascular-perfusion__neonatal-and-paediatric-perfusion-support",
            "label": "Neonatal and paediatric perfusion support"
          }
        ]
      }
    ],
    "applicableRole": "amos"
  },
  {
    "id": "amo-anaesthesia",
    "name": "Anaesthesia (Assistant Medical Officers)",
    "summary": "Anaesthetic clinical procedures and nerve blocks performed by assistant medical officers.",
    "groups": [
      {
        "label": "Core Procedures (21)",
        "items": [
          {
            "id": "amo-anaesthesia__cleaning-and-sterilization-of-anaesthetic-equipment",
            "label": "Cleaning and sterilization of anaesthetic equipment"
          },
          {
            "id": "amo-anaesthesia__decontamination-of-anaesthetic-machine",
            "label": "Decontamination of anaesthetic machine"
          },
          {
            "id": "amo-anaesthesia__decontamination-of-anaesthetic-monitors",
            "label": "Decontamination of anaesthetic monitors"
          },
          {
            "id": "amo-anaesthesia__anaesthetic-machine-pre-use-check",
            "label": "Anaesthetic machine pre-use check"
          },
          {
            "id": "amo-anaesthesia__pre-anaesthetic-assessment",
            "label": "Pre-anaesthetic assessment"
          },
          {
            "id": "amo-anaesthesia__final-assessment-in-operating-theatre",
            "label": "Final assessment in operating theatre"
          },
          {
            "id": "amo-anaesthesia__preparation-of-anaesthetic-machine-and-equipment",
            "label": "Preparation of anaesthetic machine and equipment"
          },
          {
            "id": "amo-anaesthesia__preparation-of-anaesthetic-drugs",
            "label": "Preparation of anaesthetic drugs"
          },
          {
            "id": "amo-anaesthesia__preparation-of-patient-for-anaesthesia",
            "label": "Preparation of patient for anaesthesia"
          },
          {
            "id": "amo-anaesthesia__induction-of-anaesthesia",
            "label": "Induction of anaesthesia"
          },
          {
            "id": "amo-anaesthesia__endotracheal-intubation",
            "label": "Endotracheal intubation"
          },
          {
            "id": "amo-anaesthesia__rapid-sequence-induction",
            "label": "Rapid sequence induction"
          },
          {
            "id": "amo-anaesthesia__expected-difficult-intubation-drill",
            "label": "Expected difficult intubation drill"
          },
          {
            "id": "amo-anaesthesia__failed-intubation-drill",
            "label": "Failed intubation drill"
          },
          {
            "id": "amo-anaesthesia__extubation-procedure",
            "label": "Extubation procedure"
          },
          {
            "id": "amo-anaesthesia__administration-of-general-anaesthesia-with-ippv",
            "label": "Administration of general anaesthesia with IPPV"
          },
          {
            "id": "amo-anaesthesia__general-anaesthesia-spontaneous-with-mask",
            "label": "General anaesthesia (spontaneous) with mask"
          },
          {
            "id": "amo-anaesthesia__general-anaesthesia-spontaneous-with-supraglottic-airway",
            "label": "General anaesthesia (spontaneous) with supraglottic airway"
          },
          {
            "id": "amo-anaesthesia__administration-of-total-intravenous-anaesthesia-tiva",
            "label": "Administration of total intravenous anaesthesia (TIVA)"
          },
          {
            "id": "amo-anaesthesia__spinal-anaesthesia-administration",
            "label": "Spinal anaesthesia administration"
          },
          {
            "id": "amo-anaesthesia__monitored-sedation-technique",
            "label": "Monitored sedation technique"
          },
          {
            "id": "amo-anaesthesia__post-anaesthesia-care",
            "label": "Post anaesthesia care"
          }
        ]
      },
      {
        "label": "Optional Procedures (8)",
        "items": [
          {
            "id": "amo-anaesthesia__administration-of-anaesthesia-for-electroconvulsive-therapy-ect",
            "label": "Administration of anaesthesia for electroconvulsive therapy (ECT)"
          },
          {
            "id": "amo-anaesthesia__caudal-block",
            "label": "Caudal block"
          },
          {
            "id": "amo-anaesthesia__brachial-plexus-block-supraclavicular-approach",
            "label": "Brachial plexus block – supraclavicular approach"
          },
          {
            "id": "amo-anaesthesia__brachial-plexus-block-axillary-approach",
            "label": "Brachial plexus block – axillary approach"
          },
          {
            "id": "amo-anaesthesia__wrist-block",
            "label": "Wrist block"
          },
          {
            "id": "amo-anaesthesia__femoral-nerve-block-anterior-approach",
            "label": "Femoral nerve block – anterior approach"
          },
          {
            "id": "amo-anaesthesia__sciatic-nerve-block-posterior-approach",
            "label": "Sciatic nerve block – posterior approach"
          },
          {
            "id": "amo-anaesthesia__ankle-block",
            "label": "Ankle block"
          }
        ]
      }
    ],
    "applicableRole": "amos"
  },
  {
    "id": "amo-peri-anaesthesia",
    "name": "Peri-Anaesthesia (Assistant Medical Officers)",
    "summary": "Peri-anaesthetic airway and monitoring procedures performed by AMOs.",
    "groups": [
      {
        "label": "Core Procedures (50)",
        "items": [
          {
            "id": "amo-peri-anaesthesia__assemble-and-disassemble-laryngoscope",
            "label": "Assemble and disassemble laryngoscope"
          },
          {
            "id": "amo-peri-anaesthesia__prepare-and-handle-video-assisted-laryngoscope",
            "label": "Prepare and handle video assisted laryngoscope"
          },
          {
            "id": "amo-peri-anaesthesia__cleaning-decontamination-and-sterilization-of-breathing-system",
            "label": "Cleaning, decontamination and sterilization of breathing system"
          },
          {
            "id": "amo-peri-anaesthesia__preparation-for-intubation",
            "label": "Preparation for intubation"
          },
          {
            "id": "amo-peri-anaesthesia__application-of-cricoid-pressure",
            "label": "Application of cricoid pressure"
          },
          {
            "id": "amo-peri-anaesthesia__preparation-of-supraglottic-airway-adjuncts",
            "label": "Preparation of supraglottic airway adjuncts"
          },
          {
            "id": "amo-peri-anaesthesia__preparation-of-difficult-airway-adjuncts",
            "label": "Preparation of difficult airway adjuncts"
          },
          {
            "id": "amo-peri-anaesthesia__perform-endotracheal-intubation",
            "label": "Perform endotracheal intubation"
          },
          {
            "id": "amo-peri-anaesthesia__perform-endotracheal-extubation",
            "label": "Perform endotracheal extubation"
          },
          {
            "id": "amo-peri-anaesthesia__perform-supraglottic-airway-insertion",
            "label": "Perform supraglottic airway insertion"
          },
          {
            "id": "amo-peri-anaesthesia__perform-supraglottic-airway-extubation",
            "label": "Perform supraglottic airway extubation"
          },
          {
            "id": "amo-peri-anaesthesia__checking-and-calibrating-anaesthetic-machine",
            "label": "Checking and calibrating anaesthetic machine"
          },
          {
            "id": "amo-peri-anaesthesia__identify-and-troubleshoot-anaesthetic-machine",
            "label": "Identify and troubleshoot anaesthetic machine"
          },
          {
            "id": "amo-peri-anaesthesia__identify-and-troubleshoot-monitors",
            "label": "Identify and troubleshoot monitors"
          },
          {
            "id": "amo-peri-anaesthesia__refilling-vaporizers",
            "label": "Refilling vaporizers"
          },
          {
            "id": "amo-peri-anaesthesia__emptying-vaporizers",
            "label": "Emptying vaporizers"
          },
          {
            "id": "amo-peri-anaesthesia__assemble-anaesthesia-breathing-circuit",
            "label": "Assemble anaesthesia breathing circuit"
          },
          {
            "id": "amo-peri-anaesthesia__assemble-ayre-s-t-piece-breathing-circuit",
            "label": "Assemble Ayre's T-piece breathing circuit"
          },
          {
            "id": "amo-peri-anaesthesia__rapid-sequence-induction-protocol",
            "label": "Rapid sequence induction protocol"
          },
          {
            "id": "amo-peri-anaesthesia__assemble-passive-humidification-system",
            "label": "Assemble passive humidification system"
          },
          {
            "id": "amo-peri-anaesthesia__prepare-anaesthetic-nebulization",
            "label": "Prepare anaesthetic nebulization"
          },
          {
            "id": "amo-peri-anaesthesia__replenish-anaesthesia-resuscitation-trolley",
            "label": "Replenish anaesthesia resuscitation trolley"
          },
          {
            "id": "amo-peri-anaesthesia__replenish-difficult-intubation-trolley",
            "label": "Replenish difficult intubation trolley"
          },
          {
            "id": "amo-peri-anaesthesia__handling-of-pca-pump",
            "label": "Handling of PCA pump"
          },
          {
            "id": "amo-peri-anaesthesia__care-of-patient-during-various-operative-positions",
            "label": "Care of patient during various operative positions"
          },
          {
            "id": "amo-peri-anaesthesia__care-of-patient-on-pneumatic-tourniquet",
            "label": "Care of patient on pneumatic tourniquet"
          },
          {
            "id": "amo-peri-anaesthesia__preparation-and-care-for-spinal-anaesthesia",
            "label": "Preparation and care for spinal anaesthesia"
          },
          {
            "id": "amo-peri-anaesthesia__preparation-and-care-for-epidural-anaesthesia",
            "label": "Preparation and care for epidural anaesthesia"
          },
          {
            "id": "amo-peri-anaesthesia__apply-pulse-oximeter-and-clinical-interpretation",
            "label": "Apply pulse oximeter and clinical interpretation"
          },
          {
            "id": "amo-peri-anaesthesia__apply-capnometer-and-clinical-interpretation",
            "label": "Apply capnometer and clinical interpretation"
          },
          {
            "id": "amo-peri-anaesthesia__core-temperature-probe-insertion",
            "label": "Core temperature probe insertion"
          },
          {
            "id": "amo-peri-anaesthesia__preparation-of-pressure-transducer-system",
            "label": "Preparation of pressure transducer system"
          },
          {
            "id": "amo-peri-anaesthesia__preparation-of-central-venous-pressure-system",
            "label": "Preparation of central venous pressure system"
          },
          {
            "id": "amo-peri-anaesthesia__care-of-patient-with-arterial-line",
            "label": "Care of patient with arterial line"
          },
          {
            "id": "amo-peri-anaesthesia__care-of-patient-with-central-venous-line",
            "label": "Care of patient with central venous line"
          },
          {
            "id": "amo-peri-anaesthesia__assemble-oxygen-therapy-devices",
            "label": "Assemble oxygen therapy devices"
          },
          {
            "id": "amo-peri-anaesthesia__prepare-and-assist-peripheral-nerve-block",
            "label": "Prepare and assist peripheral nerve block"
          },
          {
            "id": "amo-peri-anaesthesia__assemble-intraoperative-warming-devices",
            "label": "Assemble intraoperative warming devices"
          },
          {
            "id": "amo-peri-anaesthesia__assemble-blood-warming-devices",
            "label": "Assemble blood warming devices"
          },
          {
            "id": "amo-peri-anaesthesia__transportation-of-critically-ill-patient",
            "label": "Transportation of critically ill patient"
          },
          {
            "id": "amo-peri-anaesthesia__assemble-set-and-troubleshoot-ventilators",
            "label": "Assemble, set and troubleshoot ventilators"
          },
          {
            "id": "amo-peri-anaesthesia__preoperative-assessment-amo-role",
            "label": "Preoperative assessment (AMO role)"
          },
          {
            "id": "amo-peri-anaesthesia__assist-in-difficult-intubation-drill",
            "label": "Assist in difficult intubation drill"
          },
          {
            "id": "amo-peri-anaesthesia__care-of-patient-in-recovery-area",
            "label": "Care of patient in recovery area"
          },
          {
            "id": "amo-peri-anaesthesia__check-level-of-regional-anaesthesia",
            "label": "Check level of regional anaesthesia"
          },
          {
            "id": "amo-peri-anaesthesia__assess-bromage-score",
            "label": "Assess Bromage score"
          },
          {
            "id": "amo-peri-anaesthesia__assess-sedation-scale",
            "label": "Assess sedation scale"
          },
          {
            "id": "amo-peri-anaesthesia__assess-recovery-score",
            "label": "Assess recovery score"
          },
          {
            "id": "amo-peri-anaesthesia__assess-pain-score",
            "label": "Assess pain score"
          },
          {
            "id": "amo-peri-anaesthesia__prepare-and-assist-flexible-fibreoptic-intubation",
            "label": "Prepare and assist flexible fibreoptic intubation"
          },
          {
            "id": "amo-peri-anaesthesia__prepare-and-assist-awake-fibreoptic-intubation",
            "label": "Prepare and assist awake fibreoptic intubation"
          }
        ]
      },
      {
        "label": "Optional Procedures (14)",
        "items": [
          {
            "id": "amo-peri-anaesthesia__handle-and-assist-in-tiva-tci-procedure",
            "label": "Handle and assist in TIVA / TCI procedure"
          },
          {
            "id": "amo-peri-anaesthesia__prepare-and-assist-non-invasive-cardiac-output-monitoring",
            "label": "Prepare and assist non-invasive cardiac output monitoring"
          },
          {
            "id": "amo-peri-anaesthesia__care-of-patient-in-combined-spinal-epidural-block",
            "label": "Care of patient in combined spinal epidural block"
          },
          {
            "id": "amo-peri-anaesthesia__prepare-and-assist-invasive-cardiac-output-monitoring",
            "label": "Prepare and assist invasive cardiac output monitoring"
          },
          {
            "id": "amo-peri-anaesthesia__assemble-rapid-infusion-device",
            "label": "Assemble rapid infusion device"
          },
          {
            "id": "amo-peri-anaesthesia__prepare-and-assist-one-lung-ventilation",
            "label": "Prepare and assist one-lung ventilation"
          },
          {
            "id": "amo-peri-anaesthesia__assemble-and-calibrate-icp-monitoring",
            "label": "Assemble and calibrate ICP monitoring"
          },
          {
            "id": "amo-peri-anaesthesia__assist-autologous-blood-transfusion",
            "label": "Assist autologous blood transfusion"
          },
          {
            "id": "amo-peri-anaesthesia__assemble-jet-ventilation",
            "label": "Assemble jet ventilation"
          },
          {
            "id": "amo-peri-anaesthesia__prepare-and-assist-cricothyrotomy",
            "label": "Prepare and assist cricothyrotomy"
          },
          {
            "id": "amo-peri-anaesthesia__prepare-and-assist-needle-cricothyrotomy",
            "label": "Prepare and assist needle cricothyrotomy"
          },
          {
            "id": "amo-peri-anaesthesia__application-of-peripheral-nerve-stimulator",
            "label": "Application of peripheral nerve stimulator"
          },
          {
            "id": "amo-peri-anaesthesia__assemble-bis-monitoring",
            "label": "Assemble BIS monitoring"
          },
          {
            "id": "amo-peri-anaesthesia__care-of-ultrasound-guidance-equipment",
            "label": "Care of ultrasound guidance equipment"
          }
        ]
      }
    ],
    "applicableRole": "amos"
  }
];

export const ALL_PROCEDURE_CATEGORIES: ProcedureCategory[] = [
  {
    "id": "peri-operative-care",
    "name": "Peri-Operative Care",
    "summary": "Operating theatre competencies across peri-operative services.",
    "groups": [
      {
        "label": "Core Procedures (43)",
        "items": [
          {
            "id": "peri-operative-care__assessment-of-patient-on-arrival-to-operating-theatre",
            "label": "Assessment of patient on arrival to operating theatre"
          },
          {
            "id": "peri-operative-care__preparation-for-general-anaesthesia",
            "label": "Preparation for general anaesthesia"
          },
          {
            "id": "peri-operative-care__preparation-for-regional-anaesthesia",
            "label": "Preparation for regional anaesthesia"
          },
          {
            "id": "peri-operative-care__assist-during-induction-of-anaesthesia",
            "label": "Assist during induction of anaesthesia"
          },
          {
            "id": "peri-operative-care__assist-during-regional-anaesthesia",
            "label": "Assist during regional anaesthesia"
          },
          {
            "id": "peri-operative-care__handling-and-safety-checks-for-electrosurgical-unit",
            "label": "Handling and safety checks for electrosurgical unit"
          },
          {
            "id": "peri-operative-care__care-of-patient-in-supine-position",
            "label": "Care of patient in supine position"
          },
          {
            "id": "peri-operative-care__care-of-patient-in-lateral-position",
            "label": "Care of patient in lateral position"
          },
          {
            "id": "peri-operative-care__care-of-patient-in-lithotomy-position",
            "label": "Care of patient in lithotomy position"
          },
          {
            "id": "peri-operative-care__care-of-patient-in-prone-position",
            "label": "Care of patient in prone position"
          },
          {
            "id": "peri-operative-care__care-of-patient-on-orthopaedic-extension-table",
            "label": "Care of patient on orthopaedic extension table"
          },
          {
            "id": "peri-operative-care__care-of-patient-in-trendelenburg-position",
            "label": "Care of patient in Trendelenburg position"
          },
          {
            "id": "peri-operative-care__surgical-scrub-technique",
            "label": "Surgical scrub technique"
          },
          {
            "id": "peri-operative-care__gowning-technique",
            "label": "Gowning technique"
          },
          {
            "id": "peri-operative-care__gloving-technique",
            "label": "Gloving technique"
          },
          {
            "id": "peri-operative-care__circulating-nurse-role-general-surgery",
            "label": "Circulating nurse role – General Surgery"
          },
          {
            "id": "peri-operative-care__instrument-nurse-role-general-surgery",
            "label": "Instrument nurse role – General Surgery"
          },
          {
            "id": "peri-operative-care__circulating-nurse-role-gynaecology-surgery",
            "label": "Circulating nurse role – Gynaecology Surgery"
          },
          {
            "id": "peri-operative-care__instrument-nurse-role-gynaecology-surgery",
            "label": "Instrument nurse role – Gynaecology Surgery"
          },
          {
            "id": "peri-operative-care__circulating-nurse-role-obstetric-surgery",
            "label": "Circulating nurse role – Obstetric Surgery"
          },
          {
            "id": "peri-operative-care__instrument-nurse-role-obstetric-surgery",
            "label": "Instrument nurse role – Obstetric Surgery"
          },
          {
            "id": "peri-operative-care__circulating-nurse-role-orthopaedic-surgery",
            "label": "Circulating nurse role – Orthopaedic Surgery"
          },
          {
            "id": "peri-operative-care__instrument-nurse-role-orthopaedic-surgery",
            "label": "Instrument nurse role – Orthopaedic Surgery"
          },
          {
            "id": "peri-operative-care__circulating-nurse-role-neurosurgery",
            "label": "Circulating nurse role – Neurosurgery"
          },
          {
            "id": "peri-operative-care__instrument-nurse-role-neurosurgery",
            "label": "Instrument nurse role – Neurosurgery"
          },
          {
            "id": "peri-operative-care__circulating-nurse-role-otorhinolaryngology-surgery",
            "label": "Circulating nurse role – Otorhinolaryngology Surgery"
          },
          {
            "id": "peri-operative-care__instrument-nurse-role-otorhinolaryngology-surgery",
            "label": "Instrument nurse role – Otorhinolaryngology Surgery"
          },
          {
            "id": "peri-operative-care__circulating-nurse-role-plastic-reconstructive-surgery",
            "label": "Circulating nurse role – Plastic & Reconstructive Surgery"
          },
          {
            "id": "peri-operative-care__instrument-nurse-role-plastic-reconstructive-surgery",
            "label": "Instrument nurse role – Plastic & Reconstructive Surgery"
          },
          {
            "id": "peri-operative-care__circulating-nurse-role-urology-surgery",
            "label": "Circulating nurse role – Urology Surgery"
          },
          {
            "id": "peri-operative-care__instrument-nurse-role-urology-surgery",
            "label": "Instrument nurse role – Urology Surgery"
          },
          {
            "id": "peri-operative-care__circulating-nurse-role-ophthalmic-surgery",
            "label": "Circulating nurse role – Ophthalmic Surgery"
          },
          {
            "id": "peri-operative-care__instrument-nurse-role-ophthalmic-surgery",
            "label": "Instrument nurse role – Ophthalmic Surgery"
          },
          {
            "id": "peri-operative-care__care-of-post-anaesthetic-patient",
            "label": "Care of post-anaesthetic patient"
          },
          {
            "id": "peri-operative-care__sterilization-procedures-steam-sterilization",
            "label": "Sterilization procedures – steam sterilization"
          },
          {
            "id": "peri-operative-care__sterilization-procedures-chemical-sterilization",
            "label": "Sterilization procedures – chemical sterilization"
          },
          {
            "id": "peri-operative-care__sterilization-procedures-sterilization-monitoring",
            "label": "Sterilization procedures – sterilization monitoring"
          },
          {
            "id": "peri-operative-care__cleaning-washing-and-packing-of-instruments",
            "label": "Cleaning, washing and packing of instruments"
          },
          {
            "id": "peri-operative-care__decontamination-of-environment-and-spillages",
            "label": "Decontamination of environment and spillages"
          },
          {
            "id": "peri-operative-care__decontamination-of-clinical-waste",
            "label": "Decontamination of clinical waste"
          },
          {
            "id": "peri-operative-care__decontamination-of-surgical-instruments",
            "label": "Decontamination of surgical instruments"
          },
          {
            "id": "peri-operative-care__decontamination-of-electrical-equipment",
            "label": "Decontamination of electrical equipment"
          },
          {
            "id": "peri-operative-care__cleaning-and-care-of-fibre-optic-scopes",
            "label": "Cleaning and care of fibre optic scopes"
          },
          {
            "id": "peri-operative-care__handling-and-dispatching-surgical-specimens",
            "label": "Handling and dispatching surgical specimens"
          }
        ]
      },
      {
        "label": "Optional Procedures (5)",
        "items": [
          {
            "id": "peri-operative-care__instrument-nurse-role-vascular-surgery",
            "label": "Instrument nurse role – Vascular Surgery"
          },
          {
            "id": "peri-operative-care__instrument-nurse-role-robotic-surgery",
            "label": "Instrument nurse role – Robotic Surgery"
          },
          {
            "id": "peri-operative-care__instrument-nurse-role-cardiothoracic-surgery",
            "label": "Instrument nurse role – Cardiothoracic Surgery"
          },
          {
            "id": "peri-operative-care__instrument-nurse-role-ophthalmic-subspecialty-surgery",
            "label": "Instrument nurse role – Ophthalmic subspecialty surgery"
          },
          {
            "id": "peri-operative-care__instrument-nurse-role-neurosurgical-subspecialty-surgery",
            "label": "Instrument nurse role – Neurosurgical subspecialty surgery"
          }
        ]
      }
    ],
    "applicableRole": "both"
  },
  {
    "id": "ophthalmology-care",
    "name": "Ophthalmology",
    "summary": "Clinical and surgical ophthalmology procedures in outpatient and theatre settings.",
    "groups": [
      {
        "label": "Clinical Procedures (29)",
        "items": [
          {
            "id": "ophthalmology-care__triaging-ophthalmology-patients",
            "label": "Triaging ophthalmology patients"
          },
          {
            "id": "ophthalmology-care__visual-acuity-measurement-adult",
            "label": "Visual acuity measurement – adult"
          },
          {
            "id": "ophthalmology-care__visual-acuity-measurement-children",
            "label": "Visual acuity measurement – children"
          },
          {
            "id": "ophthalmology-care__near-vision-measurement",
            "label": "Near vision measurement"
          },
          {
            "id": "ophthalmology-care__anterior-segment-examination",
            "label": "Anterior segment examination"
          },
          {
            "id": "ophthalmology-care__intraocular-pressure-measurement",
            "label": "Intraocular pressure measurement"
          },
          {
            "id": "ophthalmology-care__calibration-of-tonometer",
            "label": "Calibration of tonometer"
          },
          {
            "id": "ophthalmology-care__pre-operative-counselling-for-ophthalmic-procedures",
            "label": "Pre-operative counselling for ophthalmic procedures"
          },
          {
            "id": "ophthalmology-care__schirmer-s-test",
            "label": "Schirmer's test"
          },
          {
            "id": "ophthalmology-care__colour-vision-testing-ishihara",
            "label": "Colour vision testing (Ishihara)"
          },
          {
            "id": "ophthalmology-care__eyelid-hygiene-and-scrub",
            "label": "Eyelid hygiene and scrub"
          },
          {
            "id": "ophthalmology-care__eye-dressing-application",
            "label": "Eye dressing application"
          },
          {
            "id": "ophthalmology-care__instilling-eye-drops-with-punctal-occlusion",
            "label": "Instilling eye drops with punctal occlusion"
          },
          {
            "id": "ophthalmology-care__application-of-eye-pad-and-shield",
            "label": "Application of eye pad and shield"
          },
          {
            "id": "ophthalmology-care__bandage-contact-lens-insertion",
            "label": "Bandage contact lens insertion"
          },
          {
            "id": "ophthalmology-care__bandage-contact-lens-removal",
            "label": "Bandage contact lens removal"
          },
          {
            "id": "ophthalmology-care__contact-lens-wear-counselling",
            "label": "Contact lens wear counselling"
          },
          {
            "id": "ophthalmology-care__eye-rodding",
            "label": "Eye rodding"
          },
          {
            "id": "ophthalmology-care__ph-testing-of-tears",
            "label": "pH testing of tears"
          },
          {
            "id": "ophthalmology-care__eye-irrigation-procedure",
            "label": "Eye irrigation procedure"
          },
          {
            "id": "ophthalmology-care__corneal-staining",
            "label": "Corneal staining"
          },
          {
            "id": "ophthalmology-care__fundus-photography-preparation",
            "label": "Fundus photography preparation"
          },
          {
            "id": "ophthalmology-care__conjunctival-swab-collection",
            "label": "Conjunctival swab collection"
          },
          {
            "id": "ophthalmology-care__assist-corneal-scraping",
            "label": "Assist corneal scraping"
          },
          {
            "id": "ophthalmology-care__assist-retinopathy-of-prematurity-screening",
            "label": "Assist retinopathy of prematurity screening"
          },
          {
            "id": "ophthalmology-care__assist-ophthalmic-laser-therapy",
            "label": "Assist ophthalmic laser therapy"
          },
          {
            "id": "ophthalmology-care__assist-fundus-fluorescein-angiography",
            "label": "Assist fundus fluorescein angiography"
          },
          {
            "id": "ophthalmology-care__assist-lacrimal-syringing",
            "label": "Assist lacrimal syringing"
          },
          {
            "id": "ophthalmology-care__assist-incision-and-curettage",
            "label": "Assist incision and curettage"
          },
          {
            "id": "ophthalmology-care__assist-intravitreal-injection",
            "label": "Assist intravitreal injection"
          }
        ]
      },
      {
        "label": "Surgical Procedures (10)",
        "items": [
          {
            "id": "ophthalmology-care__microsurgical-instrument-cleaning-and-sterilization",
            "label": "Microsurgical instrument cleaning and sterilization"
          },
          {
            "id": "ophthalmology-care__assist-extracapsular-cataract-extraction",
            "label": "Assist extracapsular cataract extraction"
          },
          {
            "id": "ophthalmology-care__assist-phacoemulsification-surgery",
            "label": "Assist phacoemulsification surgery"
          },
          {
            "id": "ophthalmology-care__assist-pterygium-excision",
            "label": "Assist pterygium excision"
          },
          {
            "id": "ophthalmology-care__assist-vitreoretinal-surgery",
            "label": "Assist vitreoretinal surgery"
          },
          {
            "id": "ophthalmology-care__preparation-of-intraocular-gases",
            "label": "Preparation of intraocular gases"
          },
          {
            "id": "ophthalmology-care__assist-trabeculectomy-glaucoma-drainage-device-surgery",
            "label": "Assist trabeculectomy / glaucoma drainage device surgery"
          },
          {
            "id": "ophthalmology-care__assist-corneal-transplantation",
            "label": "Assist corneal transplantation"
          },
          {
            "id": "ophthalmology-care__assist-oculoplastic-surgery",
            "label": "Assist oculoplastic surgery"
          },
          {
            "id": "ophthalmology-care__assist-squint-surgery",
            "label": "Assist squint surgery"
          }
        ]
      }
    ],
    "applicableRole": "both"
  },
  {
    "id": "emergency-medicine",
    "name": "Emergency Medicine & Trauma Services",
    "summary": "Emergency and trauma competencies across triage, airway, resuscitation, surgical procedures and patient care.",
    "groups": [
      {
        "label": "Emergency Procedures (60+)",
        "items": [
          {
            "id": "emergency-medicine__hospital-triage",
            "label": "Hospital triage"
          },
          {
            "id": "emergency-medicine__field-triage",
            "label": "Field triage"
          },
          {
            "id": "emergency-medicine__insertion-of-airway-adjunct",
            "label": "Insertion of airway adjunct"
          },
          {
            "id": "emergency-medicine__insertion-of-supraglottic-airway-device",
            "label": "Insertion of supraglottic airway device"
          },
          {
            "id": "emergency-medicine__tracheal-bronchial-suctioning",
            "label": "Tracheal bronchial suctioning"
          },
          {
            "id": "emergency-medicine__prepare-and-assist-endotracheal-intubation",
            "label": "Prepare and assist endotracheal intubation"
          },
          {
            "id": "emergency-medicine__perform-or-assist-emergency-cricothyrotomy",
            "label": "Perform or assist emergency cricothyrotomy"
          },
          {
            "id": "emergency-medicine__bag-valve-mask-ventilation",
            "label": "Bag valve mask ventilation"
          },
          {
            "id": "emergency-medicine__assemble-and-test-ventilator-parameters",
            "label": "Assemble and test ventilator parameters"
          },
          {
            "id": "emergency-medicine__assess-severity-of-acute-bronchial-asthma-coad",
            "label": "Assess severity of acute bronchial asthma / COAD"
          },
          {
            "id": "emergency-medicine__prepare-prescribe-and-administer-nebulizers",
            "label": "Prepare, prescribe and administer nebulizers"
          },
          {
            "id": "emergency-medicine__administration-of-oxygen-therapy",
            "label": "Administration of oxygen therapy"
          },
          {
            "id": "emergency-medicine__intravenous-cannulation",
            "label": "Intravenous cannulation"
          },
          {
            "id": "emergency-medicine__preparation-and-administration-of-emergency-drugs",
            "label": "Preparation and administration of emergency drugs"
          },
          {
            "id": "emergency-medicine__iv-fluids-for-resuscitation",
            "label": "IV fluids for resuscitation"
          },
          {
            "id": "emergency-medicine__prepare-and-assist-cvp-line-insertion-and-monitoring",
            "label": "Prepare and assist CVP line insertion and monitoring"
          },
          {
            "id": "emergency-medicine__arterial-blood-sampling",
            "label": "Arterial blood sampling"
          },
          {
            "id": "emergency-medicine__perform-and-interpret-ecg",
            "label": "Perform and interpret ECG"
          },
          {
            "id": "emergency-medicine__recognition-of-lethal-arrhythmias",
            "label": "Recognition of lethal arrhythmias"
          },
          {
            "id": "emergency-medicine__application-and-usage-of-aed",
            "label": "Application and usage of AED"
          },
          {
            "id": "emergency-medicine__cardiopulmonary-resuscitation",
            "label": "Cardiopulmonary resuscitation"
          },
          {
            "id": "emergency-medicine__removal-of-superficial-foreign-body",
            "label": "Removal of superficial foreign body"
          },
          {
            "id": "emergency-medicine__eye-irrigation-for-chemical-injury",
            "label": "Eye irrigation for chemical injury"
          },
          {
            "id": "emergency-medicine__corneal-staining-in-emergency-setting",
            "label": "Corneal staining in emergency setting"
          },
          {
            "id": "emergency-medicine__basic-ent-nasal-packing",
            "label": "Basic ENT nasal packing"
          },
          {
            "id": "emergency-medicine__removal-of-ent-foreign-body",
            "label": "Removal of ENT foreign body"
          },
          {
            "id": "emergency-medicine__wound-toilet-and-suturing",
            "label": "Wound toilet and suturing"
          },
          {
            "id": "emergency-medicine__incision-and-drainage-of-superficial-abscess",
            "label": "Incision and drainage of superficial abscess"
          },
          {
            "id": "emergency-medicine__nail-avulsion-procedure",
            "label": "Nail avulsion procedure"
          },
          {
            "id": "emergency-medicine__prepare-and-assist-chest-tube-insertion",
            "label": "Prepare and assist chest tube insertion"
          },
          {
            "id": "emergency-medicine__assist-pericardiocentesis",
            "label": "Assist pericardiocentesis"
          },
          {
            "id": "emergency-medicine__care-of-patient-on-chest-tube",
            "label": "Care of patient on chest tube"
          },
          {
            "id": "emergency-medicine__care-of-patient-on-ventilator",
            "label": "Care of patient on ventilator"
          },
          {
            "id": "emergency-medicine__transport-of-critically-ill-patient",
            "label": "Transport of critically ill patient"
          },
          {
            "id": "emergency-medicine__assist-medico-legal-examination-of-oscc-patient",
            "label": "Assist medico-legal examination of OSCC patient"
          },
          {
            "id": "emergency-medicine__handling-of-medico-legal-specimens",
            "label": "Handling of medico legal specimens"
          },
          {
            "id": "emergency-medicine__cervical-collar-application",
            "label": "Cervical collar application"
          },
          {
            "id": "emergency-medicine__spine-immobilization",
            "label": "Spine immobilization"
          },
          {
            "id": "emergency-medicine__extremity-immobilization",
            "label": "Extremity immobilization"
          },
          {
            "id": "emergency-medicine__application-of-pelvic-immobilizer",
            "label": "Application of pelvic immobilizer"
          },
          {
            "id": "emergency-medicine__perform-log-roll-technique",
            "label": "Perform log roll technique"
          },
          {
            "id": "emergency-medicine__plaster-of-paris-application-and-care",
            "label": "Plaster of Paris application and care"
          },
          {
            "id": "emergency-medicine__reduction-of-simple-small-joint-dislocation",
            "label": "Reduction of simple small joint dislocation"
          },
          {
            "id": "emergency-medicine__comprehensive-wound-management",
            "label": "Comprehensive wound management"
          },
          {
            "id": "emergency-medicine__handling-of-amputated-limb",
            "label": "Handling of amputated limb"
          },
          {
            "id": "emergency-medicine__bladder-catheterization",
            "label": "Bladder catheterization"
          },
          {
            "id": "emergency-medicine__gastric-lavage-stomach-wash-out",
            "label": "Gastric lavage / stomach wash out"
          },
          {
            "id": "emergency-medicine__external-decontamination-procedures",
            "label": "External decontamination procedures"
          },
          {
            "id": "emergency-medicine__management-of-violent-patient",
            "label": "Management of violent patient"
          },
          {
            "id": "emergency-medicine__blood-cross-match-sampling",
            "label": "Blood cross-match sampling"
          },
          {
            "id": "emergency-medicine__transfusion-setup",
            "label": "Transfusion setup"
          },
          {
            "id": "emergency-medicine__assist-normal-delivery-in-emergency",
            "label": "Assist normal delivery in emergency"
          },
          {
            "id": "emergency-medicine__immediate-care-of-newborn-in-emergency",
            "label": "Immediate care of newborn in emergency"
          },
          {
            "id": "emergency-medicine__pelvic-immobilizer-application",
            "label": "Pelvic immobilizer application"
          },
          {
            "id": "emergency-medicine__extremity-splinting",
            "label": "Extremity splinting"
          },
          {
            "id": "emergency-medicine__application-of-traction-splints",
            "label": "Application of traction splints"
          }
        ]
      }
    ],
    "applicableRole": "both"
  },
  {
    "id": "dialysis-care",
    "name": "Dialysis Care",
    "summary": "Haemodialysis and peritoneal dialysis procedures for chronic renal replacement therapy.",
    "groups": [
      {
        "label": "Haemodialysis Procedures (17)",
        "items": [
          {
            "id": "dialysis-care__assessment-of-patient-prior-to-haemodialysis",
            "label": "Assessment of patient prior to haemodialysis"
          },
          {
            "id": "dialysis-care__care-of-arterio-venous-fistula-native",
            "label": "Care of arterio-venous fistula – native"
          },
          {
            "id": "dialysis-care__care-of-arterio-venous-fistula-graft",
            "label": "Care of arterio-venous fistula – graft"
          },
          {
            "id": "dialysis-care__care-of-haemodialysis-catheter-cuffed",
            "label": "Care of haemodialysis catheter – cuffed"
          },
          {
            "id": "dialysis-care__care-of-haemodialysis-catheter-non-cuffed",
            "label": "Care of haemodialysis catheter – non-cuffed"
          },
          {
            "id": "dialysis-care__anti-coagulation-therapy-management",
            "label": "Anti-coagulation therapy management"
          },
          {
            "id": "dialysis-care__preparation-of-haemodialysis-machine",
            "label": "Preparation of haemodialysis machine"
          },
          {
            "id": "dialysis-care__setting-up-dialyzer-and-bloodline",
            "label": "Setting up dialyzer and bloodline"
          },
          {
            "id": "dialysis-care__priming-of-dialyzer-and-bloodline",
            "label": "Priming of dialyzer and bloodline"
          },
          {
            "id": "dialysis-care__cannulation-technique-for-haemodialysis",
            "label": "Cannulation technique for haemodialysis"
          },
          {
            "id": "dialysis-care__initiation-of-haemodialysis-treatment",
            "label": "Initiation of haemodialysis treatment"
          },
          {
            "id": "dialysis-care__termination-of-haemodialysis-treatment",
            "label": "Termination of haemodialysis treatment"
          },
          {
            "id": "dialysis-care__disinfection-of-haemodialysis-machine",
            "label": "Disinfection of haemodialysis machine"
          },
          {
            "id": "dialysis-care__decalcification-of-haemodialysis-machine",
            "label": "Decalcification of haemodialysis machine"
          },
          {
            "id": "dialysis-care__reprocessing-of-dialyzer",
            "label": "Reprocessing of dialyzer"
          },
          {
            "id": "dialysis-care__management-of-intradialytic-complication",
            "label": "Management of intradialytic complication"
          },
          {
            "id": "dialysis-care__monitoring-water-treatment-system",
            "label": "Monitoring water treatment system"
          }
        ]
      },
      {
        "label": "Peritoneal Dialysis Procedures (19)",
        "items": [
          {
            "id": "dialysis-care__assessment-of-patient-assistant-for-pd-treatment",
            "label": "Assessment of patient / assistant for PD treatment"
          },
          {
            "id": "dialysis-care__care-of-pd-catheter-pre-operatively",
            "label": "Care of PD catheter pre-operatively"
          },
          {
            "id": "dialysis-care__care-of-pd-catheter-post-operatively",
            "label": "Care of PD catheter post-operatively"
          },
          {
            "id": "dialysis-care__flushing-of-pd-catheter",
            "label": "Flushing of PD catheter"
          },
          {
            "id": "dialysis-care__pd-prescription-planning",
            "label": "PD prescription planning"
          },
          {
            "id": "dialysis-care__continuous-ambulatory-peritoneal-dialysis-capd-training",
            "label": "Continuous ambulatory peritoneal dialysis (CAPD) training"
          },
          {
            "id": "dialysis-care__automated-peritoneal-dialysis-apd-training",
            "label": "Automated peritoneal dialysis (APD) training"
          },
          {
            "id": "dialysis-care__application-and-change-of-transfer-set",
            "label": "Application and change of transfer set"
          },
          {
            "id": "dialysis-care__exit-site-care-for-pd-catheter",
            "label": "Exit site care for PD catheter"
          },
          {
            "id": "dialysis-care__management-of-peritonitis",
            "label": "Management of peritonitis"
          },
          {
            "id": "dialysis-care__peritoneal-equilibration-test-pet",
            "label": "Peritoneal equilibration test (PET)"
          },
          {
            "id": "dialysis-care__assessment-of-dialysis-adequacy-pd",
            "label": "Assessment of dialysis adequacy – PD"
          },
          {
            "id": "dialysis-care__pd-effluent-sampling-for-microbiology",
            "label": "PD effluent sampling for microbiology"
          },
          {
            "id": "dialysis-care__exit-site-swab-sampling",
            "label": "Exit site swab sampling"
          },
          {
            "id": "dialysis-care__tunnel-infection-swab-sampling",
            "label": "Tunnel infection swab sampling"
          },
          {
            "id": "dialysis-care__nasal-swab-sampling-for-culture",
            "label": "Nasal swab sampling for culture"
          },
          {
            "id": "dialysis-care__intraperitoneal-antibiotic-administration",
            "label": "Intraperitoneal antibiotic administration"
          },
          {
            "id": "dialysis-care__parenteral-iron-administration-in-pd",
            "label": "Parenteral iron administration in PD"
          },
          {
            "id": "dialysis-care__handling-pd-effluent-with-infective-risk",
            "label": "Handling PD effluent with infective risk"
          }
        ]
      }
    ],
    "applicableRole": "both"
  },
  {
    "id": "pre-hospital-care",
    "name": "Pre Hospital Care Services",
    "summary": "Emergency medical services procedures from dispatch to on-scene care and transport.",
    "groups": [
      {
        "label": "Pre-hospital Procedures (70+)",
        "items": [
          {
            "id": "pre-hospital-care__provide-dispatch-cpr-instruction",
            "label": "Provide dispatch CPR instruction"
          },
          {
            "id": "pre-hospital-care__manage-and-triage-emergency-call-including-methane",
            "label": "Manage and triage emergency call including METHANE"
          },
          {
            "id": "pre-hospital-care__provide-delivery-and-newborn-management-instruction-over-phone",
            "label": "Provide delivery and newborn management instruction over phone"
          },
          {
            "id": "pre-hospital-care__scene-assessment-in-primary-response",
            "label": "Scene assessment in primary response"
          },
          {
            "id": "pre-hospital-care__scene-and-risk-assessment-for-medical-standby",
            "label": "Scene and risk assessment for medical standby"
          },
          {
            "id": "pre-hospital-care__scene-staging-in-multiple-casualty-incident",
            "label": "Scene staging in multiple casualty incident"
          },
          {
            "id": "pre-hospital-care__insertion-of-airway-adjuncts-in-pre-hospital-setting",
            "label": "Insertion of airway adjuncts in pre-hospital setting"
          },
          {
            "id": "pre-hospital-care__sellick-s-manoeuvre-application",
            "label": "Sellick's manoeuvre application"
          },
          {
            "id": "pre-hospital-care__insertion-of-supraglottic-airway-device",
            "label": "Insertion of supraglottic airway device"
          },
          {
            "id": "pre-hospital-care__tracheal-bronchial-suctioning-pre-hospital",
            "label": "Tracheal bronchial suctioning – pre-hospital"
          },
          {
            "id": "pre-hospital-care__adult-endotracheal-intubation-crash-airway",
            "label": "Adult endotracheal intubation (crash airway)"
          },
          {
            "id": "pre-hospital-care__ent-foreign-body-removal-pre-hospital",
            "label": "ENT foreign body removal (pre-hospital)"
          },
          {
            "id": "pre-hospital-care__administration-of-oxygen-therapy-ambulance-care",
            "label": "Administration of oxygen therapy – ambulance care"
          },
          {
            "id": "pre-hospital-care__bipap-cpap-usage-in-pre-hospital-environment",
            "label": "BiPAP / CPAP usage in pre-hospital environment"
          },
          {
            "id": "pre-hospital-care__needle-chest-decompression-in-field",
            "label": "Needle chest decompression in field"
          },
          {
            "id": "pre-hospital-care__chest-tube-monitoring-during-transport",
            "label": "Chest tube monitoring during transport"
          },
          {
            "id": "pre-hospital-care__end-tidal-co2-capnography-monitoring",
            "label": "End tidal CO2 / capnography monitoring"
          },
          {
            "id": "pre-hospital-care__bag-valve-mask-ventilation-pre-hospital",
            "label": "Bag valve mask ventilation – pre-hospital"
          },
          {
            "id": "pre-hospital-care__ventilator-assembly-and-management-during-transport",
            "label": "Ventilator assembly and management during transport"
          },
          {
            "id": "pre-hospital-care__assess-manage-acute-bronchial-asthma-coad-in-field",
            "label": "Assess/Manage acute bronchial asthma / COAD in field"
          },
          {
            "id": "pre-hospital-care__nebulizer-administration-ambulance",
            "label": "Nebulizer administration – ambulance"
          },
          {
            "id": "pre-hospital-care__intravenous-cannulation-pre-hospital",
            "label": "Intravenous cannulation – pre-hospital"
          },
          {
            "id": "pre-hospital-care__intraosseous-access-insertion",
            "label": "Intraosseous access insertion"
          },
          {
            "id": "pre-hospital-care__central-line-cannulation-femoral",
            "label": "Central line cannulation – femoral"
          },
          {
            "id": "pre-hospital-care__central-line-cannulation-external-jugular",
            "label": "Central line cannulation – external jugular"
          },
          {
            "id": "pre-hospital-care__aed-manual-defibrillation",
            "label": "AED / Manual defibrillation"
          },
          {
            "id": "pre-hospital-care__electrical-cardioversion-pre-hospital",
            "label": "Electrical cardioversion – pre-hospital"
          },
          {
            "id": "pre-hospital-care__carotid-massage-for-svt",
            "label": "Carotid massage for SVT"
          },
          {
            "id": "pre-hospital-care__transcutaneous-pacing",
            "label": "Transcutaneous pacing"
          },
          {
            "id": "pre-hospital-care__spinal-immobilization-trauma",
            "label": "Spinal immobilization – trauma"
          },
          {
            "id": "pre-hospital-care__extrication-of-seated-trauma-patient",
            "label": "Extrication of seated trauma patient"
          },
          {
            "id": "pre-hospital-care__extremity-splinting-in-field",
            "label": "Extremity splinting in field"
          },
          {
            "id": "pre-hospital-care__traction-splint-application",
            "label": "Traction splint application"
          },
          {
            "id": "pre-hospital-care__tourniquet-application-and-monitoring",
            "label": "Tourniquet application and monitoring"
          },
          {
            "id": "pre-hospital-care__cervical-immobilization",
            "label": "Cervical immobilization"
          },
          {
            "id": "pre-hospital-care__pelvic-immobilizer-application",
            "label": "Pelvic immobilizer application"
          },
          {
            "id": "pre-hospital-care__hemorrhage-control-in-open-wound",
            "label": "Hemorrhage control in open wound"
          },
          {
            "id": "pre-hospital-care__hemostatic-suturing-pre-hospital",
            "label": "Hemostatic suturing – pre-hospital"
          },
          {
            "id": "pre-hospital-care__management-of-evisceration-injury",
            "label": "Management of evisceration injury"
          },
          {
            "id": "pre-hospital-care__management-of-impaled-foreign-object",
            "label": "Management of impaled foreign object"
          },
          {
            "id": "pre-hospital-care__management-of-amputation-injury-and-amputated-limb",
            "label": "Management of amputation injury and amputated limb"
          },
          {
            "id": "pre-hospital-care__ppe-level-2-donning-and-doffing",
            "label": "PPE Level 2 donning and doffing"
          },
          {
            "id": "pre-hospital-care__ppe-level-3-donning-and-doffing",
            "label": "PPE Level 3 donning and doffing"
          },
          {
            "id": "pre-hospital-care__ppe-level-4-donning-and-doffing",
            "label": "PPE Level 4 donning and doffing"
          },
          {
            "id": "pre-hospital-care__decontamination-of-ambulance-vehicle",
            "label": "Decontamination of ambulance vehicle"
          },
          {
            "id": "pre-hospital-care__decontamination-of-equipment",
            "label": "Decontamination of equipment"
          },
          {
            "id": "pre-hospital-care__decontamination-of-patient-cbrn",
            "label": "Decontamination of patient (CBRN)"
          },
          {
            "id": "pre-hospital-care__emergency-move-of-patient",
            "label": "Emergency move of patient"
          },
          {
            "id": "pre-hospital-care__non-emergency-move-of-patient",
            "label": "Non-emergency move of patient"
          },
          {
            "id": "pre-hospital-care__radio-communication-protocols",
            "label": "Radio communication protocols"
          },
          {
            "id": "pre-hospital-care__medication-administration-adenosine",
            "label": "Medication administration – adenosine"
          },
          {
            "id": "pre-hospital-care__medication-administration-adrenaline",
            "label": "Medication administration – adrenaline"
          },
          {
            "id": "pre-hospital-care__medication-administration-amiodarone",
            "label": "Medication administration – amiodarone"
          },
          {
            "id": "pre-hospital-care__medication-administration-aspirin",
            "label": "Medication administration – aspirin"
          },
          {
            "id": "pre-hospital-care__medication-administration-atropine",
            "label": "Medication administration – atropine"
          },
          {
            "id": "pre-hospital-care__medication-administration-dextrose",
            "label": "Medication administration – dextrose"
          },
          {
            "id": "pre-hospital-care__medication-administration-diclofenac",
            "label": "Medication administration – diclofenac"
          },
          {
            "id": "pre-hospital-care__medication-administration-furosemide",
            "label": "Medication administration – furosemide"
          },
          {
            "id": "pre-hospital-care__medication-administration-lidocaine",
            "label": "Medication administration – lidocaine"
          },
          {
            "id": "pre-hospital-care__medication-administration-magnesium-sulphate",
            "label": "Medication administration – magnesium sulphate"
          },
          {
            "id": "pre-hospital-care__medication-administration-midazolam",
            "label": "Medication administration – midazolam"
          },
          {
            "id": "pre-hospital-care__medication-administration-morphine",
            "label": "Medication administration – morphine"
          },
          {
            "id": "pre-hospital-care__medication-administration-naloxone",
            "label": "Medication administration – naloxone"
          },
          {
            "id": "pre-hospital-care__medication-administration-nitroglycerine",
            "label": "Medication administration – nitroglycerine"
          },
          {
            "id": "pre-hospital-care__medication-administration-nitrous-oxide",
            "label": "Medication administration – nitrous oxide"
          },
          {
            "id": "pre-hospital-care__field-triage-during-disaster",
            "label": "Field triage during disaster"
          },
          {
            "id": "pre-hospital-care__scene-staging-in-mass-casualty-incident",
            "label": "Scene staging in mass casualty incident"
          },
          {
            "id": "pre-hospital-care__decontamination-in-cbrn-incident",
            "label": "Decontamination in CBRN incident"
          },
          {
            "id": "pre-hospital-care__simulation-respiratory-distress-management",
            "label": "Simulation – respiratory distress management"
          },
          {
            "id": "pre-hospital-care__simulation-bronchial-asthma-management",
            "label": "Simulation – bronchial asthma management"
          },
          {
            "id": "pre-hospital-care__simulation-unconscious-patient-management",
            "label": "Simulation – unconscious patient management"
          },
          {
            "id": "pre-hospital-care__simulation-trauma-with-haemorrhage",
            "label": "Simulation – trauma with haemorrhage"
          },
          {
            "id": "pre-hospital-care__simulation-chest-injury-scenario",
            "label": "Simulation – chest injury scenario"
          },
          {
            "id": "pre-hospital-care__simulation-abdominal-injury-scenario",
            "label": "Simulation – abdominal injury scenario"
          },
          {
            "id": "pre-hospital-care__simulation-failed-airway-management",
            "label": "Simulation – failed airway management"
          }
        ]
      }
    ],
    "applicableRole": "both"
  },
  {
    "id": "endoscopy-services",
    "name": "Endoscopy Services",
    "summary": "Endoscopy unit procedures including diagnostic and therapeutic interventions.",
    "groups": [
      {
        "label": "Core Procedures (12 categories)",
        "items": [
          {
            "id": "endoscopy-services__assessment-and-history-taking-for-endoscopy-patients",
            "label": "Assessment and history taking for endoscopy patients"
          },
          {
            "id": "endoscopy-services__discharge-planning-for-endoscopy-patients",
            "label": "Discharge planning for endoscopy patients"
          },
          {
            "id": "endoscopy-services__preparation-of-patient-for-ogds",
            "label": "Preparation of patient for OGDS"
          },
          {
            "id": "endoscopy-services__preparation-of-patient-for-colonoscopy",
            "label": "Preparation of patient for colonoscopy"
          },
          {
            "id": "endoscopy-services__preparation-of-trolleys-equipment-and-accessories",
            "label": "Preparation of trolleys, equipment and accessories"
          },
          {
            "id": "endoscopy-services__preparation-and-calibration-of-monitoring-system",
            "label": "Preparation and calibration of monitoring system"
          },
          {
            "id": "endoscopy-services__care-of-patient-during-ogds",
            "label": "Care of patient during OGDS"
          },
          {
            "id": "endoscopy-services__care-of-patient-during-colonoscopy",
            "label": "Care of patient during colonoscopy"
          },
          {
            "id": "endoscopy-services__immediate-care-post-endoscopy-procedure",
            "label": "Immediate care post endoscopy procedure"
          },
          {
            "id": "endoscopy-services__collection-and-dispatch-of-tissue-samples",
            "label": "Collection and dispatch of tissue samples"
          },
          {
            "id": "endoscopy-services__administration-of-sedation-for-endoscopy",
            "label": "Administration of sedation for endoscopy"
          },
          {
            "id": "endoscopy-services__reprocessing-of-endoscope-and-accessories",
            "label": "Reprocessing of endoscope and accessories"
          }
        ]
      },
      {
        "label": "Therapeutic Procedures (includes optional 17)",
        "items": [
          {
            "id": "endoscopy-services__diagnostic-ogds",
            "label": "Diagnostic OGDS"
          },
          {
            "id": "endoscopy-services__diagnostic-colonoscopy",
            "label": "Diagnostic colonoscopy"
          },
          {
            "id": "endoscopy-services__therapeutic-haemostasis-adrenalin-injection",
            "label": "Therapeutic haemostasis – adrenalin injection"
          },
          {
            "id": "endoscopy-services__therapeutic-haemostasis-rubber-band-ligation",
            "label": "Therapeutic haemostasis – rubber band ligation"
          },
          {
            "id": "endoscopy-services__therapeutic-haemostasis-argon-plasma-coagulation",
            "label": "Therapeutic haemostasis – argon plasma coagulation"
          },
          {
            "id": "endoscopy-services__therapeutic-haemostasis-heater-probe",
            "label": "Therapeutic haemostasis – heater probe"
          },
          {
            "id": "endoscopy-services__therapeutic-haemostasis-haemoclip",
            "label": "Therapeutic haemostasis – haemoclip"
          },
          {
            "id": "endoscopy-services__therapeutic-haemostasis-haemospray-endoclot",
            "label": "Therapeutic haemostasis – haemospray / endoclot"
          },
          {
            "id": "endoscopy-services__therapeutic-haemostasis-histoacryl-glue",
            "label": "Therapeutic haemostasis – histoacryl glue"
          },
          {
            "id": "endoscopy-services__polypectomy-procedure",
            "label": "Polypectomy procedure"
          },
          {
            "id": "endoscopy-services__endoscopic-retrograde-cholangiopancreatography-ercp",
            "label": "Endoscopic retrograde cholangiopancreatography (ERCP)"
          },
          {
            "id": "endoscopy-services__endoscopic-ultrasound-eus",
            "label": "Endoscopic ultrasound (EUS)"
          },
          {
            "id": "endoscopy-services__single-balloon-enteroscopy",
            "label": "Single balloon enteroscopy"
          },
          {
            "id": "endoscopy-services__double-balloon-enteroscopy",
            "label": "Double balloon enteroscopy"
          },
          {
            "id": "endoscopy-services__percutaneous-endoscopic-gastrostomy-peg",
            "label": "Percutaneous endoscopic gastrostomy (PEG)"
          },
          {
            "id": "endoscopy-services__percutaneous-endoscopic-jejunostomy-pej",
            "label": "Percutaneous endoscopic jejunostomy (PEJ)"
          },
          {
            "id": "endoscopy-services__endoscopic-mucosal-resection-emr",
            "label": "Endoscopic mucosal resection (EMR)"
          },
          {
            "id": "endoscopy-services__endoscopic-submucosal-dissection-esd",
            "label": "Endoscopic submucosal dissection (ESD)"
          },
          {
            "id": "endoscopy-services__peroral-endoscopic-myotomy-poem",
            "label": "Peroral endoscopic myotomy (POEM)"
          },
          {
            "id": "endoscopy-services__oesophageal-dilatation",
            "label": "Oesophageal dilatation"
          },
          {
            "id": "endoscopy-services__metallic-stenting",
            "label": "Metallic stenting"
          },
          {
            "id": "endoscopy-services__enteral-feeding-tube-placement",
            "label": "Enteral feeding tube placement"
          },
          {
            "id": "endoscopy-services__oesophageal-manometry",
            "label": "Oesophageal manometry"
          },
          {
            "id": "endoscopy-services__24-hour-ph-monitoring-and-impedance",
            "label": "24-hour pH monitoring and impedance"
          },
          {
            "id": "endoscopy-services__urea-breath-test-ubt",
            "label": "Urea breath test (UBT)"
          },
          {
            "id": "endoscopy-services__capsule-endoscopy",
            "label": "Capsule endoscopy"
          },
          {
            "id": "endoscopy-services__sengstaken-tube-insertion",
            "label": "Sengstaken tube insertion"
          },
          {
            "id": "endoscopy-services__pseudocyst-drainage",
            "label": "Pseudocyst drainage"
          },
          {
            "id": "endoscopy-services__spyglass-cholangioscopy",
            "label": "Spyglass cholangioscopy"
          },
          {
            "id": "endoscopy-services__endoscopic-marker-injection",
            "label": "Endoscopic marker injection"
          }
        ]
      }
    ],
    "applicableRole": "both"
  },
  {
    "id": "orthopaedic-services",
    "name": "Orthopaedic Services",
    "summary": "Orthopaedic ward and emergency procedures including casting, traction and rehabilitation.",
    "groups": [
      {
        "label": "Orthopaedic Procedures (54)",
        "items": [
          {
            "id": "orthopaedic-services__preparation-and-application-of-thomas-splint",
            "label": "Preparation and application of Thomas splint"
          },
          {
            "id": "orthopaedic-services__preparation-and-application-of-bohler-braun-frame",
            "label": "Preparation and application of Bohler Braun frame"
          },
          {
            "id": "orthopaedic-services__application-and-care-of-skin-traction",
            "label": "Application and care of skin traction"
          },
          {
            "id": "orthopaedic-services__application-and-care-of-skeletal-traction",
            "label": "Application and care of skeletal traction"
          },
          {
            "id": "orthopaedic-services__application-and-care-of-fixed-traction",
            "label": "Application and care of fixed traction"
          },
          {
            "id": "orthopaedic-services__care-of-patient-with-plaster-of-paris",
            "label": "Care of patient with plaster of Paris"
          },
          {
            "id": "orthopaedic-services__application-of-halter-traction",
            "label": "Application of halter traction"
          },
          {
            "id": "orthopaedic-services__assist-application-and-care-of-halovest",
            "label": "Assist application and care of halovest"
          },
          {
            "id": "orthopaedic-services__neurovascular-assessment-with-traction",
            "label": "Neurovascular assessment with traction"
          },
          {
            "id": "orthopaedic-services__neurovascular-assessment-post-cast-application",
            "label": "Neurovascular assessment post cast application"
          },
          {
            "id": "orthopaedic-services__neurovascular-assessment-post-operation",
            "label": "Neurovascular assessment post-operation"
          },
          {
            "id": "orthopaedic-services__pre-and-post-operative-care-for-amputation",
            "label": "Pre and post operative care for amputation"
          },
          {
            "id": "orthopaedic-services__pre-and-post-operative-care-for-trauma",
            "label": "Pre and post operative care for trauma"
          },
          {
            "id": "orthopaedic-services__pre-and-post-operative-care-for-non-trauma",
            "label": "Pre and post operative care for non-trauma"
          },
          {
            "id": "orthopaedic-services__application-of-cryo-cuff",
            "label": "Application of cryo cuff"
          },
          {
            "id": "orthopaedic-services__application-of-continuous-passive-motion-cpm",
            "label": "Application of continuous passive motion (CPM)"
          },
          {
            "id": "orthopaedic-services__immediate-management-of-spinal-injury-log-rolling",
            "label": "Immediate management of spinal injury – log rolling"
          },
          {
            "id": "orthopaedic-services__skin-care-for-spinal-injury-patient",
            "label": "Skin care for spinal injury patient"
          },
          {
            "id": "orthopaedic-services__bowel-training-for-spinal-injury-patient",
            "label": "Bowel training for spinal injury patient"
          },
          {
            "id": "orthopaedic-services__bladder-training-for-spinal-injury-patient",
            "label": "Bladder training for spinal injury patient"
          },
          {
            "id": "orthopaedic-services__range-of-motion-exercises",
            "label": "Range of motion exercises"
          },
          {
            "id": "orthopaedic-services__static-quadriceps-exercise-education",
            "label": "Static quadriceps exercise education"
          },
          {
            "id": "orthopaedic-services__ankle-foot-pump-exercise-education",
            "label": "Ankle foot pump exercise education"
          },
          {
            "id": "orthopaedic-services__deep-breathing-exercise-education",
            "label": "Deep breathing exercise education"
          },
          {
            "id": "orthopaedic-services__ambulating-patient-with-crutches",
            "label": "Ambulating patient with crutches"
          },
          {
            "id": "orthopaedic-services__ambulating-patient-with-walking-frame",
            "label": "Ambulating patient with walking frame"
          },
          {
            "id": "orthopaedic-services__ambulating-patient-with-wheelchair",
            "label": "Ambulating patient with wheelchair"
          },
          {
            "id": "orthopaedic-services__care-of-patient-with-cast-or-slab",
            "label": "Care of patient with cast or slab"
          },
          {
            "id": "orthopaedic-services__interpretation-of-musculoskeletal-upper-limb-x-ray",
            "label": "Interpretation of musculoskeletal upper limb x-ray"
          },
          {
            "id": "orthopaedic-services__interpretation-of-musculoskeletal-lower-limb-x-ray",
            "label": "Interpretation of musculoskeletal lower limb x-ray"
          },
          {
            "id": "orthopaedic-services__interpretation-of-spine-x-ray",
            "label": "Interpretation of spine x-ray"
          },
          {
            "id": "orthopaedic-services__application-of-arm-sling",
            "label": "Application of arm sling"
          },
          {
            "id": "orthopaedic-services__application-of-stump-bandage",
            "label": "Application of stump bandage"
          },
          {
            "id": "orthopaedic-services__application-of-limb-bandage",
            "label": "Application of limb bandage"
          },
          {
            "id": "orthopaedic-services__principles-and-care-of-knee-brace",
            "label": "Principles and care of knee brace"
          },
          {
            "id": "orthopaedic-services__principles-and-care-of-juwette-brace",
            "label": "Principles and care of JUWETTE brace"
          },
          {
            "id": "orthopaedic-services__principles-and-care-of-somi-brace",
            "label": "Principles and care of SOMI brace"
          },
          {
            "id": "orthopaedic-services__application-of-shoulder-strapping",
            "label": "Application of shoulder strapping"
          },
          {
            "id": "orthopaedic-services__application-of-volar-or-dorsal-slab",
            "label": "Application of volar or dorsal slab"
          },
          {
            "id": "orthopaedic-services__application-of-above-elbow-backslab",
            "label": "Application of above elbow backslab"
          },
          {
            "id": "orthopaedic-services__application-of-below-elbow-backslab",
            "label": "Application of below elbow backslab"
          },
          {
            "id": "orthopaedic-services__application-of-colles-cast",
            "label": "Application of Colles cast"
          },
          {
            "id": "orthopaedic-services__application-of-bennet-cast",
            "label": "Application of Bennet cast"
          },
          {
            "id": "orthopaedic-services__application-of-ulnar-gutter-cast",
            "label": "Application of ulnar gutter cast"
          },
          {
            "id": "orthopaedic-services__application-of-thumb-spica-cast",
            "label": "Application of thumb spica cast"
          },
          {
            "id": "orthopaedic-services__application-of-scaphoid-cast",
            "label": "Application of scaphoid cast"
          },
          {
            "id": "orthopaedic-services__application-of-hanging-cast",
            "label": "Application of hanging cast"
          },
          {
            "id": "orthopaedic-services__application-of-u-slab",
            "label": "Application of \"U\" slab"
          },
          {
            "id": "orthopaedic-services__application-of-above-knee-backslab",
            "label": "Application of above knee backslab"
          },
          {
            "id": "orthopaedic-services__application-of-below-knee-backslab",
            "label": "Application of below knee backslab"
          },
          {
            "id": "orthopaedic-services__application-of-cylinder-cast",
            "label": "Application of cylinder cast"
          },
          {
            "id": "orthopaedic-services__application-of-boot-cast",
            "label": "Application of boot cast"
          },
          {
            "id": "orthopaedic-services__application-of-patellar-tendon-bearing-cast",
            "label": "Application of patellar tendon bearing cast"
          },
          {
            "id": "orthopaedic-services__application-of-body-cast",
            "label": "Application of body cast"
          },
          {
            "id": "orthopaedic-services__application-of-minerva-jacket",
            "label": "Application of Minerva jacket"
          },
          {
            "id": "orthopaedic-services__application-of-hip-spica",
            "label": "Application of hip spica"
          },
          {
            "id": "orthopaedic-services__serial-casting-for-ctev-ponseti-cast",
            "label": "Serial casting for CTEV / Ponseti cast"
          },
          {
            "id": "orthopaedic-services__wedging-of-cast",
            "label": "Wedging of cast"
          },
          {
            "id": "orthopaedic-services__removal-of-halovest",
            "label": "Removal of halovest"
          },
          {
            "id": "orthopaedic-services__removal-of-external-fixator",
            "label": "Removal of external fixator"
          },
          {
            "id": "orthopaedic-services__removal-of-cast",
            "label": "Removal of cast"
          },
          {
            "id": "orthopaedic-services__perform-closed-manual-reduction-cmr",
            "label": "Perform closed manual reduction (CMR)"
          }
        ]
      }
    ],
    "applicableRole": "both"
  },
  {
    "id": "peri-anaesthesia-care",
    "name": "Peri-Anaesthesia Care (PAC)",
    "summary": "Peri-anaesthesia procedures covering airway, monitoring, anaesthetic equipment and recovery care.",
    "groups": [
      {
        "label": "Core Procedures (50)",
        "items": [
          {
            "id": "peri-anaesthesia-care__assemble-and-disassemble-laryngoscope",
            "label": "Assemble and disassemble laryngoscope"
          },
          {
            "id": "peri-anaesthesia-care__prepare-video-assisted-laryngoscope",
            "label": "Prepare video assisted laryngoscope"
          },
          {
            "id": "peri-anaesthesia-care__cleaning-decontamination-and-sterilization-of-breathing-system",
            "label": "Cleaning, decontamination and sterilization of breathing system"
          },
          {
            "id": "peri-anaesthesia-care__preparation-for-intubation",
            "label": "Preparation for intubation"
          },
          {
            "id": "peri-anaesthesia-care__preparation-and-assistance-in-awake-fibreoptic-intubation",
            "label": "Preparation and assistance in awake fibreoptic intubation"
          },
          {
            "id": "peri-anaesthesia-care__application-of-cricoid-pressure",
            "label": "Application of cricoid pressure"
          },
          {
            "id": "peri-anaesthesia-care__preparation-of-supraglottic-airway-adjuncts",
            "label": "Preparation of supraglottic airway adjuncts"
          },
          {
            "id": "peri-anaesthesia-care__preparation-of-difficult-airway-trolley",
            "label": "Preparation of difficult airway trolley"
          },
          {
            "id": "peri-anaesthesia-care__assist-in-difficult-intubation",
            "label": "Assist in difficult intubation"
          },
          {
            "id": "peri-anaesthesia-care__perform-endotracheal-intubation",
            "label": "Perform endotracheal intubation"
          },
          {
            "id": "peri-anaesthesia-care__perform-endotracheal-extubation",
            "label": "Perform endotracheal extubation"
          },
          {
            "id": "peri-anaesthesia-care__perform-supraglottic-airway-insertion",
            "label": "Perform supraglottic airway insertion"
          },
          {
            "id": "peri-anaesthesia-care__perform-supraglottic-airway-extubation",
            "label": "Perform supraglottic airway extubation"
          },
          {
            "id": "peri-anaesthesia-care__checking-and-calibrating-anaesthesia-machine",
            "label": "Checking and calibrating anaesthesia machine"
          },
          {
            "id": "peri-anaesthesia-care__identify-and-troubleshoot-anaesthesia-machine",
            "label": "Identify and troubleshoot anaesthesia machine"
          },
          {
            "id": "peri-anaesthesia-care__prepare-and-assist-total-intravenous-anaesthesia-tiva-tci",
            "label": "Prepare and assist total intravenous anaesthesia (TIVA / TCI)"
          },
          {
            "id": "peri-anaesthesia-care__assemble-bispectral-index-bis-monitor",
            "label": "Assemble bispectral index (BIS) monitor"
          },
          {
            "id": "peri-anaesthesia-care__prepare-and-assist-chest-tube-insertion",
            "label": "Prepare and assist chest tube insertion"
          },
          {
            "id": "peri-anaesthesia-care__refilling-vaporizers",
            "label": "Refilling vaporizers"
          },
          {
            "id": "peri-anaesthesia-care__emptying-vaporizers-safely",
            "label": "Emptying vaporizers safely"
          },
          {
            "id": "peri-anaesthesia-care__assemble-anaesthesia-breathing-circuit",
            "label": "Assemble anaesthesia breathing circuit"
          },
          {
            "id": "peri-anaesthesia-care__assemble-ayre-s-t-piece-circuit",
            "label": "Assemble Ayre's T-piece circuit"
          },
          {
            "id": "peri-anaesthesia-care__application-of-rapid-sequence-induction",
            "label": "Application of rapid sequence induction"
          },
          {
            "id": "peri-anaesthesia-care__assemble-passive-humidification-system",
            "label": "Assemble passive humidification system"
          },
          {
            "id": "peri-anaesthesia-care__prepare-anaesthetic-nebulizer-system",
            "label": "Prepare anaesthetic nebulizer system"
          },
          {
            "id": "peri-anaesthesia-care__prepare-and-check-anaesthesia-resuscitation-trolley",
            "label": "Prepare and check anaesthesia resuscitation trolley"
          },
          {
            "id": "peri-anaesthesia-care__setting-up-patient-controlled-analgesia-pca-pump",
            "label": "Setting up patient controlled analgesia (PCA) pump"
          },
          {
            "id": "peri-anaesthesia-care__care-during-positioning-supine",
            "label": "Care during positioning – supine"
          },
          {
            "id": "peri-anaesthesia-care__care-during-positioning-prone",
            "label": "Care during positioning – prone"
          },
          {
            "id": "peri-anaesthesia-care__care-during-positioning-lithotomy",
            "label": "Care during positioning – lithotomy"
          },
          {
            "id": "peri-anaesthesia-care__care-of-patient-on-pneumatic-tourniquet",
            "label": "Care of patient on pneumatic tourniquet"
          },
          {
            "id": "peri-anaesthesia-care__prepare-and-care-for-spinal-nerve-block",
            "label": "Prepare and care for spinal nerve block"
          },
          {
            "id": "peri-anaesthesia-care__prepare-and-care-for-epidural-block",
            "label": "Prepare and care for epidural block"
          },
          {
            "id": "peri-anaesthesia-care__prepare-pulse-oximeter-and-interpret",
            "label": "Prepare pulse oximeter and interpret"
          },
          {
            "id": "peri-anaesthesia-care__set-up-capnography-system",
            "label": "Set up capnography system"
          },
          {
            "id": "peri-anaesthesia-care__insert-temperature-probe",
            "label": "Insert temperature probe"
          },
          {
            "id": "peri-anaesthesia-care__assemble-pressure-transducer-system",
            "label": "Assemble pressure transducer system"
          },
          {
            "id": "peri-anaesthesia-care__care-of-patient-with-invasive-lines",
            "label": "Care of patient with invasive lines"
          },
          {
            "id": "peri-anaesthesia-care__assemble-oxygen-therapy-devices",
            "label": "Assemble oxygen therapy devices"
          },
          {
            "id": "peri-anaesthesia-care__application-of-peripheral-nerve-stimulator",
            "label": "Application of peripheral nerve stimulator"
          },
          {
            "id": "peri-anaesthesia-care__assemble-intraoperative-warming-device",
            "label": "Assemble intraoperative warming device"
          },
          {
            "id": "peri-anaesthesia-care__assemble-fluid-warming-device",
            "label": "Assemble fluid warming device"
          },
          {
            "id": "peri-anaesthesia-care__assemble-blood-warming-device",
            "label": "Assemble blood warming device"
          },
          {
            "id": "peri-anaesthesia-care__transportation-of-critically-ill-patient",
            "label": "Transportation of critically ill patient"
          },
          {
            "id": "peri-anaesthesia-care__preoperative-assessment-in-pac",
            "label": "Preoperative assessment in PAC"
          },
          {
            "id": "peri-anaesthesia-care__care-of-patient-in-recovery-area",
            "label": "Care of patient in recovery area"
          },
          {
            "id": "peri-anaesthesia-care__assess-level-of-block-for-regional-anaesthesia",
            "label": "Assess level of block for regional anaesthesia"
          },
          {
            "id": "peri-anaesthesia-care__assess-bromage-score",
            "label": "Assess Bromage score"
          },
          {
            "id": "peri-anaesthesia-care__assess-sedation-scale",
            "label": "Assess sedation scale"
          },
          {
            "id": "peri-anaesthesia-care__assess-recovery-score",
            "label": "Assess recovery score"
          },
          {
            "id": "peri-anaesthesia-care__assess-pain-score",
            "label": "Assess pain score"
          },
          {
            "id": "peri-anaesthesia-care__care-of-patient-under-acute-pain-service",
            "label": "Care of patient under acute pain service"
          }
        ]
      },
      {
        "label": "Optional Procedures (13)",
        "items": [
          {
            "id": "peri-anaesthesia-care__prepare-non-invasive-cardiac-output-monitoring",
            "label": "Prepare non-invasive cardiac output monitoring"
          },
          {
            "id": "peri-anaesthesia-care__prepare-invasive-cardiac-output-monitoring",
            "label": "Prepare invasive cardiac output monitoring"
          },
          {
            "id": "peri-anaesthesia-care__assemble-rapid-infusion-device",
            "label": "Assemble rapid infusion device"
          },
          {
            "id": "peri-anaesthesia-care__prepare-double-lumen-tube-or-endobronchial-blocker",
            "label": "Prepare double lumen tube or endobronchial blocker"
          },
          {
            "id": "peri-anaesthesia-care__assemble-and-calibrate-icp-monitoring",
            "label": "Assemble and calibrate ICP monitoring"
          },
          {
            "id": "peri-anaesthesia-care__assist-autologous-blood-transfusion",
            "label": "Assist autologous blood transfusion"
          },
          {
            "id": "peri-anaesthesia-care__assemble-jet-ventilation-system",
            "label": "Assemble jet ventilation system"
          },
          {
            "id": "peri-anaesthesia-care__prepare-and-assist-cricothyrotomy",
            "label": "Prepare and assist cricothyrotomy"
          },
          {
            "id": "peri-anaesthesia-care__assemble-cerebral-oximetry-monitoring",
            "label": "Assemble cerebral oximetry monitoring"
          },
          {
            "id": "peri-anaesthesia-care__care-of-echocardiography-ultrasound-machine",
            "label": "Care of echocardiography / ultrasound machine"
          },
          {
            "id": "peri-anaesthesia-care__assist-ga-in-mri-suite",
            "label": "Assist GA in MRI suite"
          },
          {
            "id": "peri-anaesthesia-care__assist-ga-in-ect-suite",
            "label": "Assist GA in ECT suite"
          },
          {
            "id": "peri-anaesthesia-care__assist-ga-in-remote-locations-ir-ct-oncology",
            "label": "Assist GA in remote locations (IR / CT / Oncology)"
          }
        ]
      }
    ],
    "applicableRole": "both"
  },
  {
    "id": "intensive-care-nursing",
    "name": "Intensive Care Nursing",
    "summary": "ICU, paediatric, cardiothoracic and neuro intensive care procedures for nurses.",
    "groups": [
      {
        "label": "General ICU Core Procedures (28)",
        "items": [
          {
            "id": "intensive-care-nursing__preparation-for-receiving-icu-patient",
            "label": "Preparation for receiving ICU patient"
          },
          {
            "id": "intensive-care-nursing__transport-of-critically-ill-patient",
            "label": "Transport of critically ill patient"
          },
          {
            "id": "intensive-care-nursing__charting-icu-observations",
            "label": "Charting ICU observations"
          },
          {
            "id": "intensive-care-nursing__icu-hand-hygiene-protocol",
            "label": "ICU hand hygiene protocol"
          },
          {
            "id": "intensive-care-nursing__dose-calculation-and-preparation-dopamine",
            "label": "Dose calculation and preparation – dopamine"
          },
          {
            "id": "intensive-care-nursing__dose-calculation-and-preparation-dobutamine",
            "label": "Dose calculation and preparation – dobutamine"
          },
          {
            "id": "intensive-care-nursing__dose-calculation-and-preparation-adrenaline",
            "label": "Dose calculation and preparation – adrenaline"
          },
          {
            "id": "intensive-care-nursing__dose-calculation-and-preparation-noradrenaline",
            "label": "Dose calculation and preparation – noradrenaline"
          },
          {
            "id": "intensive-care-nursing__dose-calculation-and-preparation-insulin-infusion",
            "label": "Dose calculation and preparation – insulin infusion"
          },
          {
            "id": "intensive-care-nursing__dose-calculation-and-preparation-fentanyl",
            "label": "Dose calculation and preparation – fentanyl"
          },
          {
            "id": "intensive-care-nursing__dose-calculation-and-preparation-midazolam",
            "label": "Dose calculation and preparation – midazolam"
          },
          {
            "id": "intensive-care-nursing__dose-calculation-and-preparation-morphine",
            "label": "Dose calculation and preparation – morphine"
          },
          {
            "id": "intensive-care-nursing__assemble-pressure-transducer-system",
            "label": "Assemble pressure transducer system"
          },
          {
            "id": "intensive-care-nursing__blood-sampling-from-arterial-line",
            "label": "Blood sampling from arterial line"
          },
          {
            "id": "intensive-care-nursing__care-of-patient-on-arterial-line",
            "label": "Care of patient on arterial line"
          },
          {
            "id": "intensive-care-nursing__care-of-patient-on-central-venous-line",
            "label": "Care of patient on central venous line"
          },
          {
            "id": "intensive-care-nursing__management-of-invasive-ventilation",
            "label": "Management of invasive ventilation"
          },
          {
            "id": "intensive-care-nursing__prepare-and-assist-intubation",
            "label": "Prepare and assist intubation"
          },
          {
            "id": "intensive-care-nursing__prepare-capnometry-equipment",
            "label": "Prepare capnometry equipment"
          },
          {
            "id": "intensive-care-nursing__manual-ventilation-for-intubated-patients",
            "label": "Manual ventilation for intubated patients"
          },
          {
            "id": "intensive-care-nursing__management-of-endotracheal-tube",
            "label": "Management of endotracheal tube"
          },
          {
            "id": "intensive-care-nursing__management-of-tracheostomy-tube",
            "label": "Management of tracheostomy tube"
          },
          {
            "id": "intensive-care-nursing__management-of-non-invasive-ventilation",
            "label": "Management of non-invasive ventilation"
          },
          {
            "id": "intensive-care-nursing__management-of-humidifier",
            "label": "Management of humidifier"
          },
          {
            "id": "intensive-care-nursing__assist-chest-physiotherapy",
            "label": "Assist chest physiotherapy"
          },
          {
            "id": "intensive-care-nursing__assist-incentive-spirometry",
            "label": "Assist incentive spirometry"
          },
          {
            "id": "intensive-care-nursing__tracheo-bronchial-suctioning-open-method",
            "label": "Tracheo-bronchial suctioning (open method)"
          },
          {
            "id": "intensive-care-nursing__tracheo-bronchial-suctioning-closed-method",
            "label": "Tracheo-bronchial suctioning (closed method)"
          },
          {
            "id": "intensive-care-nursing__administer-aerosol-drugs-via-mdi",
            "label": "Administer aerosol drugs via MDI"
          },
          {
            "id": "intensive-care-nursing__administer-aerosol-drugs-via-nebulizer",
            "label": "Administer aerosol drugs via nebulizer"
          },
          {
            "id": "intensive-care-nursing__prepare-and-extubate-patient",
            "label": "Prepare and extubate patient"
          },
          {
            "id": "intensive-care-nursing__interpret-abnormal-laboratory-results",
            "label": "Interpret abnormal laboratory results"
          },
          {
            "id": "intensive-care-nursing__perform-pain-scoring",
            "label": "Perform pain scoring"
          },
          {
            "id": "intensive-care-nursing__perform-sedation-scoring",
            "label": "Perform sedation scoring"
          },
          {
            "id": "intensive-care-nursing__management-of-continuous-enteral-nutrition",
            "label": "Management of continuous enteral nutrition"
          },
          {
            "id": "intensive-care-nursing__management-of-total-parenteral-nutrition",
            "label": "Management of total parenteral nutrition"
          },
          {
            "id": "intensive-care-nursing__recognition-of-life-threatening-arrhythmias",
            "label": "Recognition of life-threatening arrhythmias"
          },
          {
            "id": "intensive-care-nursing__assist-or-perform-defibrillation",
            "label": "Assist or perform defibrillation"
          }
        ]
      },
      {
        "label": "General ICU Optional Procedures (9)",
        "items": [
          {
            "id": "intensive-care-nursing__calculate-and-administer-neuromuscular-blockers",
            "label": "Calculate and administer neuromuscular blockers"
          },
          {
            "id": "intensive-care-nursing__apply-capnometer-and-interpret",
            "label": "Apply capnometer and interpret"
          },
          {
            "id": "intensive-care-nursing__apply-pneumatic-cuff-compressors-for-dvt-prophylaxis",
            "label": "Apply pneumatic cuff compressors for DVT prophylaxis"
          },
          {
            "id": "intensive-care-nursing__prepare-and-assist-percutaneous-tracheostomy",
            "label": "Prepare and assist percutaneous tracheostomy"
          },
          {
            "id": "intensive-care-nursing__care-of-patient-on-icp-monitoring-with-evd",
            "label": "Care of patient on ICP monitoring with EVD"
          },
          {
            "id": "intensive-care-nursing__prepare-and-assist-bronchoscopy",
            "label": "Prepare and assist bronchoscopy"
          },
          {
            "id": "intensive-care-nursing__care-of-patient-on-continuous-renal-replacement-therapy-crrt",
            "label": "Care of patient on continuous renal replacement therapy (CRRT)"
          },
          {
            "id": "intensive-care-nursing__administer-aerosol-drugs-during-non-invasive-ventilation",
            "label": "Administer aerosol drugs during non-invasive ventilation"
          },
          {
            "id": "intensive-care-nursing__prepare-and-assist-brain-stem-function-test",
            "label": "Prepare and assist brain stem function test"
          }
        ]
      },
      {
        "label": "Paediatric Intensive Care Core (9)",
        "items": [
          {
            "id": "intensive-care-nursing__physical-assessment-cns",
            "label": "Physical assessment – CNS"
          },
          {
            "id": "intensive-care-nursing__physical-assessment-cardiovascular",
            "label": "Physical assessment – cardiovascular"
          },
          {
            "id": "intensive-care-nursing__physical-assessment-respiratory",
            "label": "Physical assessment – respiratory"
          },
          {
            "id": "intensive-care-nursing__physical-assessment-genito-urinary",
            "label": "Physical assessment – genito-urinary"
          },
          {
            "id": "intensive-care-nursing__physical-assessment-gastrointestinal",
            "label": "Physical assessment – gastrointestinal"
          },
          {
            "id": "intensive-care-nursing__paediatric-pain-score-assessment",
            "label": "Paediatric pain score assessment"
          },
          {
            "id": "intensive-care-nursing__fluid-maintenance-and-resuscitation-calculation",
            "label": "Fluid maintenance and resuscitation calculation"
          },
          {
            "id": "intensive-care-nursing__care-of-child-on-ventilator",
            "label": "Care of child on ventilator"
          },
          {
            "id": "intensive-care-nursing__ett-tracheostomy-suctioning-with-manual-bagging",
            "label": "ETT / tracheostomy suctioning with manual bagging"
          }
        ]
      },
      {
        "label": "Paediatric Intensive Care Optional (1)",
        "items": [
          {
            "id": "intensive-care-nursing__glasgow-coma-scale-assessment-for-infant",
            "label": "Glasgow Coma Scale assessment for infant"
          }
        ]
      },
      {
        "label": "Cardiothoracic ICU Core (15)",
        "items": [
          {
            "id": "intensive-care-nursing__observe-coronary-artery-bypass-graft-surgery",
            "label": "Observe coronary artery bypass graft surgery"
          },
          {
            "id": "intensive-care-nursing__observe-valve-surgery",
            "label": "Observe valve surgery"
          },
          {
            "id": "intensive-care-nursing__preparation-for-admission-of-post-cardiac-surgery-patient",
            "label": "Preparation for admission of post cardiac surgery patient"
          },
          {
            "id": "intensive-care-nursing__charge-nurse-role-receiving-post-cardiac-surgery-patient",
            "label": "Charge nurse role receiving post cardiac surgery patient"
          },
          {
            "id": "intensive-care-nursing__set-up-temporary-epicardial-cardiac-pacemaker",
            "label": "Set up temporary epicardial cardiac pacemaker"
          },
          {
            "id": "intensive-care-nursing__remove-pulmonary-artery-catheter",
            "label": "Remove pulmonary artery catheter"
          },
          {
            "id": "intensive-care-nursing__perform-thermodilution-cardiac-output-study",
            "label": "Perform thermodilution cardiac output study"
          },
          {
            "id": "intensive-care-nursing__care-of-patient-on-intra-aortic-balloon-pump-iabp",
            "label": "Care of patient on intra-aortic balloon pump (IABP)"
          },
          {
            "id": "intensive-care-nursing__perform-doppler-ultrasound-for-arterial-pulsation",
            "label": "Perform Doppler ultrasound for arterial pulsation"
          },
          {
            "id": "intensive-care-nursing__manage-potassium-infusion-therapy",
            "label": "Manage potassium infusion therapy"
          },
          {
            "id": "intensive-care-nursing__manage-calcium-infusion-therapy",
            "label": "Manage calcium infusion therapy"
          },
          {
            "id": "intensive-care-nursing__manage-magnesium-infusion-therapy",
            "label": "Manage magnesium infusion therapy"
          },
          {
            "id": "intensive-care-nursing__care-of-patient-with-chest-drain-post-cardiac-surgery",
            "label": "Care of patient with chest drain post cardiac surgery"
          },
          {
            "id": "intensive-care-nursing__removal-of-chest-drain-post-cardiac-surgery",
            "label": "Removal of chest drain post cardiac surgery"
          },
          {
            "id": "intensive-care-nursing__care-of-patient-on-nitric-oxide-therapy",
            "label": "Care of patient on nitric oxide therapy"
          }
        ]
      },
      {
        "label": "Cardiothoracic ICU Optional (8)",
        "items": [
          {
            "id": "intensive-care-nursing__observe-thoracic-surgery",
            "label": "Observe thoracic surgery"
          },
          {
            "id": "intensive-care-nursing__assist-insertion-of-pulmonary-artery-catheter",
            "label": "Assist insertion of pulmonary artery catheter"
          },
          {
            "id": "intensive-care-nursing__assist-elective-cardioversion",
            "label": "Assist elective cardioversion"
          },
          {
            "id": "intensive-care-nursing__assist-insertion-of-iabp",
            "label": "Assist insertion of IABP"
          },
          {
            "id": "intensive-care-nursing__assist-removal-of-iabp",
            "label": "Assist removal of IABP"
          },
          {
            "id": "intensive-care-nursing__assist-removal-of-epicardial-pacing-wire",
            "label": "Assist removal of epicardial pacing wire"
          },
          {
            "id": "intensive-care-nursing__assist-emergency-chest-re-open-in-cicu",
            "label": "Assist emergency chest re-open in CICU"
          },
          {
            "id": "intensive-care-nursing__support-patient-post-iabp-removal",
            "label": "Support patient post IABP removal"
          }
        ]
      },
      {
        "label": "Neuro ICU Core (6)",
        "items": [
          {
            "id": "intensive-care-nursing__interpret-icp-waveform",
            "label": "Interpret ICP waveform"
          },
          {
            "id": "intensive-care-nursing__set-up-icp-monitoring-with-evd",
            "label": "Set up ICP monitoring with EVD"
          },
          {
            "id": "intensive-care-nursing__care-of-patient-on-icp-monitoring-with-evd",
            "label": "Care of patient on ICP monitoring with EVD"
          },
          {
            "id": "intensive-care-nursing__perform-csf-drainage-via-evd",
            "label": "Perform CSF drainage via EVD"
          },
          {
            "id": "intensive-care-nursing__care-of-patient-with-raised-icp",
            "label": "Care of patient with raised ICP"
          },
          {
            "id": "intensive-care-nursing__post-operative-care-of-neurosurgical-patient",
            "label": "Post-operative care of neurosurgical patient"
          }
        ]
      },
      {
        "label": "Neuro ICU Optional (2)",
        "items": [
          {
            "id": "intensive-care-nursing__collect-csf-sampling-via-evd",
            "label": "Collect CSF sampling via EVD"
          },
          {
            "id": "intensive-care-nursing__post-operative-care-of-cerebral-aneurysm-surgery-patient",
            "label": "Post-operative care of cerebral aneurysm surgery patient"
          }
        ]
      }
    ],
    "applicableRole": "nurses"
  },
  {
    "id": "general-paediatric-nursing",
    "name": "General Paediatric Nursing",
    "summary": "Paediatric ward procedures covering assessment, interventions and specialised paediatric care.",
    "groups": [
      {
        "label": "Core Procedures (21)",
        "items": [
          {
            "id": "general-paediatric-nursing__assess-paediatric-patient-on-admission",
            "label": "Assess paediatric patient on admission"
          },
          {
            "id": "general-paediatric-nursing__assess-level-of-consciousness-paediatric",
            "label": "Assess level of consciousness – paediatric"
          },
          {
            "id": "general-paediatric-nursing__paediatric-venepuncture",
            "label": "Paediatric venepuncture"
          },
          {
            "id": "general-paediatric-nursing__peripheral-venous-cannulation-paediatric",
            "label": "Peripheral venous cannulation – paediatric"
          },
          {
            "id": "general-paediatric-nursing__heel-prick-for-capillary-blood-sugar",
            "label": "Heel prick for capillary blood sugar"
          },
          {
            "id": "general-paediatric-nursing__finger-prick-for-capillary-blood-sugar",
            "label": "Finger prick for capillary blood sugar"
          },
          {
            "id": "general-paediatric-nursing__insertion-of-nasogastric-tube",
            "label": "Insertion of nasogastric tube"
          },
          {
            "id": "general-paediatric-nursing__insertion-of-orogastric-tube",
            "label": "Insertion of orogastric tube"
          },
          {
            "id": "general-paediatric-nursing__enteral-tube-feeding",
            "label": "Enteral tube feeding"
          },
          {
            "id": "general-paediatric-nursing__collection-of-urine-for-culture",
            "label": "Collection of urine for culture"
          },
          {
            "id": "general-paediatric-nursing__peak-flow-meter-measurement",
            "label": "Peak flow meter measurement"
          },
          {
            "id": "general-paediatric-nursing__administration-of-metered-dose-inhaler",
            "label": "Administration of metered dose inhaler"
          },
          {
            "id": "general-paediatric-nursing__nebulization-paediatric",
            "label": "Nebulization – paediatric"
          },
          {
            "id": "general-paediatric-nursing__assist-lumbar-puncture",
            "label": "Assist lumbar puncture"
          },
          {
            "id": "general-paediatric-nursing__paediatric-blood-transfusion",
            "label": "Paediatric blood transfusion"
          },
          {
            "id": "general-paediatric-nursing__administration-of-oral-sedation",
            "label": "Administration of oral sedation"
          },
          {
            "id": "general-paediatric-nursing__administration-of-rectal-medication",
            "label": "Administration of rectal medication"
          },
          {
            "id": "general-paediatric-nursing__monitoring-patient-under-sedation",
            "label": "Monitoring patient under sedation"
          },
          {
            "id": "general-paediatric-nursing__oro-nasopharyngeal-suctioning",
            "label": "Oro-nasopharyngeal suctioning"
          },
          {
            "id": "general-paediatric-nursing__bag-valve-mask-ventilation-paediatric",
            "label": "Bag valve mask ventilation – paediatric"
          },
          {
            "id": "general-paediatric-nursing__use-of-cardiorespiratory-monitor-and-alarm-limits",
            "label": "Use of cardiorespiratory monitor and alarm limits"
          },
          {
            "id": "general-paediatric-nursing__intra-inter-hospital-transfer-of-paediatric-patient",
            "label": "Intra / inter hospital transfer of paediatric patient"
          },
          {
            "id": "general-paediatric-nursing__assist-chest-tube-placement-paediatric",
            "label": "Assist chest tube placement – paediatric"
          }
        ]
      },
      {
        "label": "Optional Procedures (18)",
        "items": [
          {
            "id": "general-paediatric-nursing__assist-central-line-placement-paediatric",
            "label": "Assist central line placement – paediatric"
          },
          {
            "id": "general-paediatric-nursing__care-of-central-venous-line-paediatric",
            "label": "Care of central venous line – paediatric"
          },
          {
            "id": "general-paediatric-nursing__care-of-chemo-port-paediatric",
            "label": "Care of chemo port – paediatric"
          },
          {
            "id": "general-paediatric-nursing__setting-up-total-parenteral-nutrition-paediatric",
            "label": "Setting up total parenteral nutrition – paediatric"
          },
          {
            "id": "general-paediatric-nursing__assist-intubation-paediatric",
            "label": "Assist intubation – paediatric"
          },
          {
            "id": "general-paediatric-nursing__endotracheal-suctioning-paediatric",
            "label": "Endotracheal suctioning – paediatric"
          },
          {
            "id": "general-paediatric-nursing__care-of-tracheostomy-paediatric",
            "label": "Care of tracheostomy – paediatric"
          },
          {
            "id": "general-paediatric-nursing__blood-sampling-from-arterial-line-paediatric",
            "label": "Blood sampling from arterial line – paediatric"
          },
          {
            "id": "general-paediatric-nursing__care-of-patient-on-non-invasive-ventilation-paediatric",
            "label": "Care of patient on non-invasive ventilation – paediatric"
          },
          {
            "id": "general-paediatric-nursing__stoma-care-paediatric",
            "label": "Stoma care – paediatric"
          },
          {
            "id": "general-paediatric-nursing__phototherapy-paediatric",
            "label": "Phototherapy – paediatric"
          },
          {
            "id": "general-paediatric-nursing__checking-photolight-irradiance",
            "label": "Checking photolight irradiance"
          },
          {
            "id": "general-paediatric-nursing__assist-bone-marrow-aspiration",
            "label": "Assist bone marrow aspiration"
          },
          {
            "id": "general-paediatric-nursing__assist-chest-tube-placement-repeat",
            "label": "Assist chest tube placement (repeat)"
          },
          {
            "id": "general-paediatric-nursing__assist-bladder-catheterization-paediatric",
            "label": "Assist bladder catheterization – paediatric"
          },
          {
            "id": "general-paediatric-nursing__care-of-patient-on-peritoneal-dialysis-paediatric",
            "label": "Care of patient on peritoneal dialysis – paediatric"
          },
          {
            "id": "general-paediatric-nursing__wet-wrap-therapy",
            "label": "Wet wrap therapy"
          },
          {
            "id": "general-paediatric-nursing__basic-ecg-interpretation-paediatric",
            "label": "Basic ECG interpretation – paediatric"
          }
        ]
      }
    ],
    "applicableRole": "nurses"
  },
  {
    "id": "neonatal-nursing",
    "name": "Neonatal Nursing Services",
    "summary": "Neonatal intensive care procedures including ventilation, nutrition and specialist neonatal support.",
    "groups": [
      {
        "label": "Core Procedures (49)",
        "items": [
          {
            "id": "neonatal-nursing__admission-of-newborn-to-neonatal-unit",
            "label": "Admission of newborn to neonatal unit"
          },
          {
            "id": "neonatal-nursing__comprehensive-clinical-assessment-of-neonate",
            "label": "Comprehensive clinical assessment of neonate"
          },
          {
            "id": "neonatal-nursing__anthropometric-measurements-for-neonate",
            "label": "Anthropometric measurements for neonate"
          },
          {
            "id": "neonatal-nursing__thermoregulation-of-newborn",
            "label": "Thermoregulation of newborn"
          },
          {
            "id": "neonatal-nursing__stabilization-and-transfer-of-neonate",
            "label": "Stabilization and transfer of neonate"
          },
          {
            "id": "neonatal-nursing__discharge-planning-for-neonate",
            "label": "Discharge planning for neonate"
          },
          {
            "id": "neonatal-nursing__application-of-pulse-oximeter-and-interpretation",
            "label": "Application of pulse oximeter and interpretation"
          },
          {
            "id": "neonatal-nursing__setting-up-invasive-blood-pressure-monitoring-neonate",
            "label": "Setting up invasive blood pressure monitoring – neonate"
          },
          {
            "id": "neonatal-nursing__use-of-cardiorespiratory-monitor-and-alarm-limits-neonate",
            "label": "Use of cardiorespiratory monitor and alarm limits – neonate"
          },
          {
            "id": "neonatal-nursing__heel-prick-sampling",
            "label": "Heel prick sampling"
          },
          {
            "id": "neonatal-nursing__incubator-care-cleaning-and-disinfection",
            "label": "Incubator care – cleaning and disinfection"
          },
          {
            "id": "neonatal-nursing__care-of-neonate-in-humidified-incubator",
            "label": "Care of neonate in humidified incubator"
          },
          {
            "id": "neonatal-nursing__weaning-neonate-from-incubator",
            "label": "Weaning neonate from incubator"
          },
          {
            "id": "neonatal-nursing__use-of-radiant-warmer-manual-mode",
            "label": "Use of radiant warmer – manual mode"
          },
          {
            "id": "neonatal-nursing__use-of-radiant-warmer-servo-mode",
            "label": "Use of radiant warmer – servo mode"
          },
          {
            "id": "neonatal-nursing__phototherapy-setup",
            "label": "Phototherapy setup"
          },
          {
            "id": "neonatal-nursing__checking-photolight-irradiance-neonate",
            "label": "Checking photolight irradiance – neonate"
          },
          {
            "id": "neonatal-nursing__prepare-and-assist-exchange-transfusion",
            "label": "Prepare and assist exchange transfusion"
          },
          {
            "id": "neonatal-nursing__administer-nasal-prong-oxygen",
            "label": "Administer nasal prong oxygen"
          },
          {
            "id": "neonatal-nursing__setting-up-conventional-ventilator-neonate",
            "label": "Setting up conventional ventilator – neonate"
          },
          {
            "id": "neonatal-nursing__care-of-baby-on-conventional-ventilator",
            "label": "Care of baby on conventional ventilator"
          },
          {
            "id": "neonatal-nursing__setting-up-non-invasive-ventilator-neonate",
            "label": "Setting up non-invasive ventilator – neonate"
          },
          {
            "id": "neonatal-nursing__care-of-baby-on-non-invasive-ventilator",
            "label": "Care of baby on non-invasive ventilator"
          },
          {
            "id": "neonatal-nursing__blood-gas-interpretation-neonate",
            "label": "Blood gas interpretation – neonate"
          },
          {
            "id": "neonatal-nursing__assist-umbilical-venous-cannulation",
            "label": "Assist umbilical venous cannulation"
          },
          {
            "id": "neonatal-nursing__assist-umbilical-arterial-cannulation",
            "label": "Assist umbilical arterial cannulation"
          },
          {
            "id": "neonatal-nursing__peripherally-inserted-central-catheter-picc-assistance",
            "label": "Peripherally inserted central catheter (PICC) assistance"
          },
          {
            "id": "neonatal-nursing__care-of-central-line-neonate",
            "label": "Care of central line – neonate"
          },
          {
            "id": "neonatal-nursing__setting-up-total-parenteral-nutrition-neonate",
            "label": "Setting up total parenteral nutrition – neonate"
          },
          {
            "id": "neonatal-nursing__blood-sampling-from-arterial-line-neonate",
            "label": "Blood sampling from arterial line – neonate"
          },
          {
            "id": "neonatal-nursing__education-on-expressed-breast-milk-collection",
            "label": "Education on expressed breast milk collection"
          },
          {
            "id": "neonatal-nursing__handling-and-storage-of-expressed-breast-milk",
            "label": "Handling and storage of expressed breast milk"
          },
          {
            "id": "neonatal-nursing__cup-feeding-expressed-breast-milk",
            "label": "Cup feeding expressed breast milk"
          },
          {
            "id": "neonatal-nursing__spoon-feeding-expressed-breast-milk",
            "label": "Spoon feeding expressed breast milk"
          },
          {
            "id": "neonatal-nursing__enteral-tube-feeding-neonate",
            "label": "Enteral tube feeding – neonate"
          },
          {
            "id": "neonatal-nursing__administration-of-oral-medication-neonate",
            "label": "Administration of oral medication – neonate"
          },
          {
            "id": "neonatal-nursing__administration-of-rectal-medication-neonate",
            "label": "Administration of rectal medication – neonate"
          },
          {
            "id": "neonatal-nursing__bag-valve-mask-resuscitation-neonate",
            "label": "Bag valve mask resuscitation – neonate"
          },
          {
            "id": "neonatal-nursing__oro-nasopharyngeal-suctioning-neonate",
            "label": "Oro-nasopharyngeal suctioning – neonate"
          },
          {
            "id": "neonatal-nursing__assist-endotracheal-intubation-neonate",
            "label": "Assist endotracheal intubation – neonate"
          },
          {
            "id": "neonatal-nursing__endotracheal-suction-open-method",
            "label": "Endotracheal suction – open method"
          },
          {
            "id": "neonatal-nursing__endotracheal-suction-closed-method",
            "label": "Endotracheal suction – closed method"
          },
          {
            "id": "neonatal-nursing__extubation-of-neonate",
            "label": "Extubation of neonate"
          },
          {
            "id": "neonatal-nursing__assist-lumbar-puncture-neonate",
            "label": "Assist lumbar puncture – neonate"
          },
          {
            "id": "neonatal-nursing__neonatal-blood-transfusion",
            "label": "Neonatal blood transfusion"
          },
          {
            "id": "neonatal-nursing__assist-chest-tube-placement-neonate",
            "label": "Assist chest tube placement – neonate"
          },
          {
            "id": "neonatal-nursing__care-of-neonate-with-chest-tube",
            "label": "Care of neonate with chest tube"
          },
          {
            "id": "neonatal-nursing__preparation-for-rop-screening",
            "label": "Preparation for ROP screening"
          }
        ]
      },
      {
        "label": "Optional Procedures (9)",
        "items": [
          {
            "id": "neonatal-nursing__use-of-transcutaneous-bilirubinometer",
            "label": "Use of transcutaneous bilirubinometer"
          },
          {
            "id": "neonatal-nursing__use-of-transcutaneous-carbon-dioxide-monitor",
            "label": "Use of transcutaneous carbon dioxide monitor"
          },
          {
            "id": "neonatal-nursing__setting-up-high-frequency-ventilator",
            "label": "Setting up high frequency ventilator"
          },
          {
            "id": "neonatal-nursing__care-of-neonate-on-high-frequency-ventilation",
            "label": "Care of neonate on high frequency ventilation"
          },
          {
            "id": "neonatal-nursing__care-of-neonate-on-inhaled-nitric-oxide",
            "label": "Care of neonate on inhaled nitric oxide"
          },
          {
            "id": "neonatal-nursing__care-of-newborn-undergoing-hypothermia-therapy",
            "label": "Care of newborn undergoing hypothermia therapy"
          },
          {
            "id": "neonatal-nursing__neonatal-stoma-care",
            "label": "Neonatal stoma care"
          },
          {
            "id": "neonatal-nursing__care-of-neonate-with-tracheostomy",
            "label": "Care of neonate with tracheostomy"
          },
          {
            "id": "neonatal-nursing__newborn-hearing-screening",
            "label": "Newborn hearing screening"
          }
        ]
      }
    ],
    "applicableRole": "nurses"
  },
  {
    "id": "cardiovascular-perfusion",
    "name": "Cardiovascular Perfusion",
    "summary": "Perfusionist procedures for cardiac bypass and circulatory support.",
    "groups": [
      {
        "label": "Core Procedures (3)",
        "items": [
          {
            "id": "cardiovascular-perfusion__conduct-cardiopulmonary-bypass-for-cabg-valve-adult-congenital-surgery",
            "label": "Conduct cardiopulmonary bypass for CABG / valve / adult congenital surgery"
          },
          {
            "id": "cardiovascular-perfusion__set-up-intra-aortic-balloon-pump",
            "label": "Set-up intra-aortic balloon pump"
          },
          {
            "id": "cardiovascular-perfusion__perform-intraoperative-red-cell-salvage-with-cell-saver",
            "label": "Perform intraoperative red cell salvage with cell saver"
          }
        ]
      },
      {
        "label": "Optional Procedures (3)",
        "items": [
          {
            "id": "cardiovascular-perfusion__conduct-cpb-using-centrifugal-pump",
            "label": "Conduct CPB using centrifugal pump"
          },
          {
            "id": "cardiovascular-perfusion__conduct-cpb-using-vacuum-assisted-venous-drainage-vavd",
            "label": "Conduct CPB using vacuum assisted venous drainage (VAVD)"
          },
          {
            "id": "cardiovascular-perfusion__conduct-cpb-for-thoracic-aortic-surgery",
            "label": "Conduct CPB for thoracic aortic surgery"
          },
          {
            "id": "cardiovascular-perfusion__perform-ultrafiltration-during-cpb",
            "label": "Perform ultrafiltration during CPB"
          }
        ]
      },
      {
        "label": "Specialized Procedures (2)",
        "items": [
          {
            "id": "cardiovascular-perfusion__extracorporeal-membrane-oxygenation-ecmo",
            "label": "Extracorporeal membrane oxygenation (ECMO)"
          },
          {
            "id": "cardiovascular-perfusion__neonatal-and-paediatric-perfusion-support",
            "label": "Neonatal and paediatric perfusion support"
          }
        ]
      }
    ],
    "applicableRole": "amos"
  },
  {
    "id": "amo-anaesthesia",
    "name": "Anaesthesia (Assistant Medical Officers)",
    "summary": "Anaesthetic clinical procedures and nerve blocks performed by assistant medical officers.",
    "groups": [
      {
        "label": "Core Procedures (21)",
        "items": [
          {
            "id": "amo-anaesthesia__cleaning-and-sterilization-of-anaesthetic-equipment",
            "label": "Cleaning and sterilization of anaesthetic equipment"
          },
          {
            "id": "amo-anaesthesia__decontamination-of-anaesthetic-machine",
            "label": "Decontamination of anaesthetic machine"
          },
          {
            "id": "amo-anaesthesia__decontamination-of-anaesthetic-monitors",
            "label": "Decontamination of anaesthetic monitors"
          },
          {
            "id": "amo-anaesthesia__anaesthetic-machine-pre-use-check",
            "label": "Anaesthetic machine pre-use check"
          },
          {
            "id": "amo-anaesthesia__pre-anaesthetic-assessment",
            "label": "Pre-anaesthetic assessment"
          },
          {
            "id": "amo-anaesthesia__final-assessment-in-operating-theatre",
            "label": "Final assessment in operating theatre"
          },
          {
            "id": "amo-anaesthesia__preparation-of-anaesthetic-machine-and-equipment",
            "label": "Preparation of anaesthetic machine and equipment"
          },
          {
            "id": "amo-anaesthesia__preparation-of-anaesthetic-drugs",
            "label": "Preparation of anaesthetic drugs"
          },
          {
            "id": "amo-anaesthesia__preparation-of-patient-for-anaesthesia",
            "label": "Preparation of patient for anaesthesia"
          },
          {
            "id": "amo-anaesthesia__induction-of-anaesthesia",
            "label": "Induction of anaesthesia"
          },
          {
            "id": "amo-anaesthesia__endotracheal-intubation",
            "label": "Endotracheal intubation"
          },
          {
            "id": "amo-anaesthesia__rapid-sequence-induction",
            "label": "Rapid sequence induction"
          },
          {
            "id": "amo-anaesthesia__expected-difficult-intubation-drill",
            "label": "Expected difficult intubation drill"
          },
          {
            "id": "amo-anaesthesia__failed-intubation-drill",
            "label": "Failed intubation drill"
          },
          {
            "id": "amo-anaesthesia__extubation-procedure",
            "label": "Extubation procedure"
          },
          {
            "id": "amo-anaesthesia__administration-of-general-anaesthesia-with-ippv",
            "label": "Administration of general anaesthesia with IPPV"
          },
          {
            "id": "amo-anaesthesia__general-anaesthesia-spontaneous-with-mask",
            "label": "General anaesthesia (spontaneous) with mask"
          },
          {
            "id": "amo-anaesthesia__general-anaesthesia-spontaneous-with-supraglottic-airway",
            "label": "General anaesthesia (spontaneous) with supraglottic airway"
          },
          {
            "id": "amo-anaesthesia__administration-of-total-intravenous-anaesthesia-tiva",
            "label": "Administration of total intravenous anaesthesia (TIVA)"
          },
          {
            "id": "amo-anaesthesia__spinal-anaesthesia-administration",
            "label": "Spinal anaesthesia administration"
          },
          {
            "id": "amo-anaesthesia__monitored-sedation-technique",
            "label": "Monitored sedation technique"
          },
          {
            "id": "amo-anaesthesia__post-anaesthesia-care",
            "label": "Post anaesthesia care"
          }
        ]
      },
      {
        "label": "Optional Procedures (8)",
        "items": [
          {
            "id": "amo-anaesthesia__administration-of-anaesthesia-for-electroconvulsive-therapy-ect",
            "label": "Administration of anaesthesia for electroconvulsive therapy (ECT)"
          },
          {
            "id": "amo-anaesthesia__caudal-block",
            "label": "Caudal block"
          },
          {
            "id": "amo-anaesthesia__brachial-plexus-block-supraclavicular-approach",
            "label": "Brachial plexus block – supraclavicular approach"
          },
          {
            "id": "amo-anaesthesia__brachial-plexus-block-axillary-approach",
            "label": "Brachial plexus block – axillary approach"
          },
          {
            "id": "amo-anaesthesia__wrist-block",
            "label": "Wrist block"
          },
          {
            "id": "amo-anaesthesia__femoral-nerve-block-anterior-approach",
            "label": "Femoral nerve block – anterior approach"
          },
          {
            "id": "amo-anaesthesia__sciatic-nerve-block-posterior-approach",
            "label": "Sciatic nerve block – posterior approach"
          },
          {
            "id": "amo-anaesthesia__ankle-block",
            "label": "Ankle block"
          }
        ]
      }
    ],
    "applicableRole": "amos"
  },
  {
    "id": "amo-peri-anaesthesia",
    "name": "Peri-Anaesthesia (Assistant Medical Officers)",
    "summary": "Peri-anaesthetic airway and monitoring procedures performed by AMOs.",
    "groups": [
      {
        "label": "Core Procedures (50)",
        "items": [
          {
            "id": "amo-peri-anaesthesia__assemble-and-disassemble-laryngoscope",
            "label": "Assemble and disassemble laryngoscope"
          },
          {
            "id": "amo-peri-anaesthesia__prepare-and-handle-video-assisted-laryngoscope",
            "label": "Prepare and handle video assisted laryngoscope"
          },
          {
            "id": "amo-peri-anaesthesia__cleaning-decontamination-and-sterilization-of-breathing-system",
            "label": "Cleaning, decontamination and sterilization of breathing system"
          },
          {
            "id": "amo-peri-anaesthesia__preparation-for-intubation",
            "label": "Preparation for intubation"
          },
          {
            "id": "amo-peri-anaesthesia__application-of-cricoid-pressure",
            "label": "Application of cricoid pressure"
          },
          {
            "id": "amo-peri-anaesthesia__preparation-of-supraglottic-airway-adjuncts",
            "label": "Preparation of supraglottic airway adjuncts"
          },
          {
            "id": "amo-peri-anaesthesia__preparation-of-difficult-airway-adjuncts",
            "label": "Preparation of difficult airway adjuncts"
          },
          {
            "id": "amo-peri-anaesthesia__perform-endotracheal-intubation",
            "label": "Perform endotracheal intubation"
          },
          {
            "id": "amo-peri-anaesthesia__perform-endotracheal-extubation",
            "label": "Perform endotracheal extubation"
          },
          {
            "id": "amo-peri-anaesthesia__perform-supraglottic-airway-insertion",
            "label": "Perform supraglottic airway insertion"
          },
          {
            "id": "amo-peri-anaesthesia__perform-supraglottic-airway-extubation",
            "label": "Perform supraglottic airway extubation"
          },
          {
            "id": "amo-peri-anaesthesia__checking-and-calibrating-anaesthetic-machine",
            "label": "Checking and calibrating anaesthetic machine"
          },
          {
            "id": "amo-peri-anaesthesia__identify-and-troubleshoot-anaesthetic-machine",
            "label": "Identify and troubleshoot anaesthetic machine"
          },
          {
            "id": "amo-peri-anaesthesia__identify-and-troubleshoot-monitors",
            "label": "Identify and troubleshoot monitors"
          },
          {
            "id": "amo-peri-anaesthesia__refilling-vaporizers",
            "label": "Refilling vaporizers"
          },
          {
            "id": "amo-peri-anaesthesia__emptying-vaporizers",
            "label": "Emptying vaporizers"
          },
          {
            "id": "amo-peri-anaesthesia__assemble-anaesthesia-breathing-circuit",
            "label": "Assemble anaesthesia breathing circuit"
          },
          {
            "id": "amo-peri-anaesthesia__assemble-ayre-s-t-piece-breathing-circuit",
            "label": "Assemble Ayre's T-piece breathing circuit"
          },
          {
            "id": "amo-peri-anaesthesia__rapid-sequence-induction-protocol",
            "label": "Rapid sequence induction protocol"
          },
          {
            "id": "amo-peri-anaesthesia__assemble-passive-humidification-system",
            "label": "Assemble passive humidification system"
          },
          {
            "id": "amo-peri-anaesthesia__prepare-anaesthetic-nebulization",
            "label": "Prepare anaesthetic nebulization"
          },
          {
            "id": "amo-peri-anaesthesia__replenish-anaesthesia-resuscitation-trolley",
            "label": "Replenish anaesthesia resuscitation trolley"
          },
          {
            "id": "amo-peri-anaesthesia__replenish-difficult-intubation-trolley",
            "label": "Replenish difficult intubation trolley"
          },
          {
            "id": "amo-peri-anaesthesia__handling-of-pca-pump",
            "label": "Handling of PCA pump"
          },
          {
            "id": "amo-peri-anaesthesia__care-of-patient-during-various-operative-positions",
            "label": "Care of patient during various operative positions"
          },
          {
            "id": "amo-peri-anaesthesia__care-of-patient-on-pneumatic-tourniquet",
            "label": "Care of patient on pneumatic tourniquet"
          },
          {
            "id": "amo-peri-anaesthesia__preparation-and-care-for-spinal-anaesthesia",
            "label": "Preparation and care for spinal anaesthesia"
          },
          {
            "id": "amo-peri-anaesthesia__preparation-and-care-for-epidural-anaesthesia",
            "label": "Preparation and care for epidural anaesthesia"
          },
          {
            "id": "amo-peri-anaesthesia__apply-pulse-oximeter-and-clinical-interpretation",
            "label": "Apply pulse oximeter and clinical interpretation"
          },
          {
            "id": "amo-peri-anaesthesia__apply-capnometer-and-clinical-interpretation",
            "label": "Apply capnometer and clinical interpretation"
          },
          {
            "id": "amo-peri-anaesthesia__core-temperature-probe-insertion",
            "label": "Core temperature probe insertion"
          },
          {
            "id": "amo-peri-anaesthesia__preparation-of-pressure-transducer-system",
            "label": "Preparation of pressure transducer system"
          },
          {
            "id": "amo-peri-anaesthesia__preparation-of-central-venous-pressure-system",
            "label": "Preparation of central venous pressure system"
          },
          {
            "id": "amo-peri-anaesthesia__care-of-patient-with-arterial-line",
            "label": "Care of patient with arterial line"
          },
          {
            "id": "amo-peri-anaesthesia__care-of-patient-with-central-venous-line",
            "label": "Care of patient with central venous line"
          },
          {
            "id": "amo-peri-anaesthesia__assemble-oxygen-therapy-devices",
            "label": "Assemble oxygen therapy devices"
          },
          {
            "id": "amo-peri-anaesthesia__prepare-and-assist-peripheral-nerve-block",
            "label": "Prepare and assist peripheral nerve block"
          },
          {
            "id": "amo-peri-anaesthesia__assemble-intraoperative-warming-devices",
            "label": "Assemble intraoperative warming devices"
          },
          {
            "id": "amo-peri-anaesthesia__assemble-blood-warming-devices",
            "label": "Assemble blood warming devices"
          },
          {
            "id": "amo-peri-anaesthesia__transportation-of-critically-ill-patient",
            "label": "Transportation of critically ill patient"
          },
          {
            "id": "amo-peri-anaesthesia__assemble-set-and-troubleshoot-ventilators",
            "label": "Assemble, set and troubleshoot ventilators"
          },
          {
            "id": "amo-peri-anaesthesia__preoperative-assessment-amo-role",
            "label": "Preoperative assessment (AMO role)"
          },
          {
            "id": "amo-peri-anaesthesia__assist-in-difficult-intubation-drill",
            "label": "Assist in difficult intubation drill"
          },
          {
            "id": "amo-peri-anaesthesia__care-of-patient-in-recovery-area",
            "label": "Care of patient in recovery area"
          },
          {
            "id": "amo-peri-anaesthesia__check-level-of-regional-anaesthesia",
            "label": "Check level of regional anaesthesia"
          },
          {
            "id": "amo-peri-anaesthesia__assess-bromage-score",
            "label": "Assess Bromage score"
          },
          {
            "id": "amo-peri-anaesthesia__assess-sedation-scale",
            "label": "Assess sedation scale"
          },
          {
            "id": "amo-peri-anaesthesia__assess-recovery-score",
            "label": "Assess recovery score"
          },
          {
            "id": "amo-peri-anaesthesia__assess-pain-score",
            "label": "Assess pain score"
          },
          {
            "id": "amo-peri-anaesthesia__prepare-and-assist-flexible-fibreoptic-intubation",
            "label": "Prepare and assist flexible fibreoptic intubation"
          },
          {
            "id": "amo-peri-anaesthesia__prepare-and-assist-awake-fibreoptic-intubation",
            "label": "Prepare and assist awake fibreoptic intubation"
          }
        ]
      },
      {
        "label": "Optional Procedures (14)",
        "items": [
          {
            "id": "amo-peri-anaesthesia__handle-and-assist-in-tiva-tci-procedure",
            "label": "Handle and assist in TIVA / TCI procedure"
          },
          {
            "id": "amo-peri-anaesthesia__prepare-and-assist-non-invasive-cardiac-output-monitoring",
            "label": "Prepare and assist non-invasive cardiac output monitoring"
          },
          {
            "id": "amo-peri-anaesthesia__care-of-patient-in-combined-spinal-epidural-block",
            "label": "Care of patient in combined spinal epidural block"
          },
          {
            "id": "amo-peri-anaesthesia__prepare-and-assist-invasive-cardiac-output-monitoring",
            "label": "Prepare and assist invasive cardiac output monitoring"
          },
          {
            "id": "amo-peri-anaesthesia__assemble-rapid-infusion-device",
            "label": "Assemble rapid infusion device"
          },
          {
            "id": "amo-peri-anaesthesia__prepare-and-assist-one-lung-ventilation",
            "label": "Prepare and assist one-lung ventilation"
          },
          {
            "id": "amo-peri-anaesthesia__assemble-and-calibrate-icp-monitoring",
            "label": "Assemble and calibrate ICP monitoring"
          },
          {
            "id": "amo-peri-anaesthesia__assist-autologous-blood-transfusion",
            "label": "Assist autologous blood transfusion"
          },
          {
            "id": "amo-peri-anaesthesia__assemble-jet-ventilation",
            "label": "Assemble jet ventilation"
          },
          {
            "id": "amo-peri-anaesthesia__prepare-and-assist-cricothyrotomy",
            "label": "Prepare and assist cricothyrotomy"
          },
          {
            "id": "amo-peri-anaesthesia__prepare-and-assist-needle-cricothyrotomy",
            "label": "Prepare and assist needle cricothyrotomy"
          },
          {
            "id": "amo-peri-anaesthesia__application-of-peripheral-nerve-stimulator",
            "label": "Application of peripheral nerve stimulator"
          },
          {
            "id": "amo-peri-anaesthesia__assemble-bis-monitoring",
            "label": "Assemble BIS monitoring"
          },
          {
            "id": "amo-peri-anaesthesia__care-of-ultrasound-guidance-equipment",
            "label": "Care of ultrasound guidance equipment"
          }
        ]
      }
    ],
    "applicableRole": "amos"
  }
];

/**
 * Get categories filtered by staff role
 */
export const getCategoriesForRole = (role: CredentialRole): ProcedureCategory[] => {
  if (role === 'nurses') {
    return [...COMMON_CATEGORIES, ...NURSES_ONLY_CATEGORIES];
  }
  if (role === 'amos') {
    return [...COMMON_CATEGORIES, ...AMO_ONLY_CATEGORIES];
  }
  return ALL_PROCEDURE_CATEGORIES;
};

/**
 * Find a specific category by ID
 */
export const findCategoryById = (categoryId: string): ProcedureCategory | undefined => {
  return ALL_PROCEDURE_CATEGORIES.find(c => c.id === categoryId);
};

/**
 * Find a specific procedure across all categories
 */
export const findProcedureById = (
  categoryId: string,
  procedureKey: string
): { category?: ProcedureCategory; procedure?: ProcedureItem } => {
  const category = findCategoryById(categoryId);
  if (!category) return {};

  for (const group of category.groups) {
    const procedure = group.items.find(item => item.id === procedureKey);
    if (procedure) {
      return { category, procedure };
    }
  }

  return { category };
};

/**
 * Search procedure catalog by term
 */
export const searchProcedureCatalog = (
  query: string,
  role?: CredentialRole
): { category: ProcedureCategory; matchedItems: ProcedureItem[] }[] => {
  const q = query.trim().toLowerCase();
  const categories = role ? getCategoriesForRole(role) : ALL_PROCEDURE_CATEGORIES;

  if (!q) {
    return categories.map(c => ({
      category: c,
      matchedItems: c.groups.flatMap(g => g.items)
    }));
  }

  const results: { category: ProcedureCategory; matchedItems: ProcedureItem[] }[] = [];

  for (const cat of categories) {
    const isCatMatch = cat.name.toLowerCase().includes(q) || cat.summary.toLowerCase().includes(q);
    const matchedItems: ProcedureItem[] = [];

    for (const group of cat.groups) {
      for (const item of group.items) {
        if (isCatMatch || item.label.toLowerCase().includes(q)) {
          matchedItems.push(item);
        }
      }
    }

    if (matchedItems.length > 0) {
      results.push({ category: cat, matchedItems });
    }
  }

  return results;
};

const calcTotalProcedures = () => {
  return [{"id":"peri-operative-care","name":"Peri-Operative Care","summary":"Operating theatre competencies across peri-operative services.","groups":[{"label":"Core Procedures (43)","items":[{"id":"peri-operative-care__assessment-of-patient-on-arrival-to-operating-theatre","label":"Assessment of patient on arrival to operating theatre"},{"id":"peri-operative-care__preparation-for-general-anaesthesia","label":"Preparation for general anaesthesia"},{"id":"peri-operative-care__preparation-for-regional-anaesthesia","label":"Preparation for regional anaesthesia"},{"id":"peri-operative-care__assist-during-induction-of-anaesthesia","label":"Assist during induction of anaesthesia"},{"id":"peri-operative-care__assist-during-regional-anaesthesia","label":"Assist during regional anaesthesia"},{"id":"peri-operative-care__handling-and-safety-checks-for-electrosurgical-unit","label":"Handling and safety checks for electrosurgical unit"},{"id":"peri-operative-care__care-of-patient-in-supine-position","label":"Care of patient in supine position"},{"id":"peri-operative-care__care-of-patient-in-lateral-position","label":"Care of patient in lateral position"},{"id":"peri-operative-care__care-of-patient-in-lithotomy-position","label":"Care of patient in lithotomy position"},{"id":"peri-operative-care__care-of-patient-in-prone-position","label":"Care of patient in prone position"},{"id":"peri-operative-care__care-of-patient-on-orthopaedic-extension-table","label":"Care of patient on orthopaedic extension table"},{"id":"peri-operative-care__care-of-patient-in-trendelenburg-position","label":"Care of patient in Trendelenburg position"},{"id":"peri-operative-care__surgical-scrub-technique","label":"Surgical scrub technique"},{"id":"peri-operative-care__gowning-technique","label":"Gowning technique"},{"id":"peri-operative-care__gloving-technique","label":"Gloving technique"},{"id":"peri-operative-care__circulating-nurse-role-general-surgery","label":"Circulating nurse role – General Surgery"},{"id":"peri-operative-care__instrument-nurse-role-general-surgery","label":"Instrument nurse role – General Surgery"},{"id":"peri-operative-care__circulating-nurse-role-gynaecology-surgery","label":"Circulating nurse role – Gynaecology Surgery"},{"id":"peri-operative-care__instrument-nurse-role-gynaecology-surgery","label":"Instrument nurse role – Gynaecology Surgery"},{"id":"peri-operative-care__circulating-nurse-role-obstetric-surgery","label":"Circulating nurse role – Obstetric Surgery"},{"id":"peri-operative-care__instrument-nurse-role-obstetric-surgery","label":"Instrument nurse role – Obstetric Surgery"},{"id":"peri-operative-care__circulating-nurse-role-orthopaedic-surgery","label":"Circulating nurse role – Orthopaedic Surgery"},{"id":"peri-operative-care__instrument-nurse-role-orthopaedic-surgery","label":"Instrument nurse role – Orthopaedic Surgery"},{"id":"peri-operative-care__circulating-nurse-role-neurosurgery","label":"Circulating nurse role – Neurosurgery"},{"id":"peri-operative-care__instrument-nurse-role-neurosurgery","label":"Instrument nurse role – Neurosurgery"},{"id":"peri-operative-care__circulating-nurse-role-otorhinolaryngology-surgery","label":"Circulating nurse role – Otorhinolaryngology Surgery"},{"id":"peri-operative-care__instrument-nurse-role-otorhinolaryngology-surgery","label":"Instrument nurse role – Otorhinolaryngology Surgery"},{"id":"peri-operative-care__circulating-nurse-role-plastic-reconstructive-surgery","label":"Circulating nurse role – Plastic & Reconstructive Surgery"},{"id":"peri-operative-care__instrument-nurse-role-plastic-reconstructive-surgery","label":"Instrument nurse role – Plastic & Reconstructive Surgery"},{"id":"peri-operative-care__circulating-nurse-role-urology-surgery","label":"Circulating nurse role – Urology Surgery"},{"id":"peri-operative-care__instrument-nurse-role-urology-surgery","label":"Instrument nurse role – Urology Surgery"},{"id":"peri-operative-care__circulating-nurse-role-ophthalmic-surgery","label":"Circulating nurse role – Ophthalmic Surgery"},{"id":"peri-operative-care__instrument-nurse-role-ophthalmic-surgery","label":"Instrument nurse role – Ophthalmic Surgery"},{"id":"peri-operative-care__care-of-post-anaesthetic-patient","label":"Care of post-anaesthetic patient"},{"id":"peri-operative-care__sterilization-procedures-steam-sterilization","label":"Sterilization procedures – steam sterilization"},{"id":"peri-operative-care__sterilization-procedures-chemical-sterilization","label":"Sterilization procedures – chemical sterilization"},{"id":"peri-operative-care__sterilization-procedures-sterilization-monitoring","label":"Sterilization procedures – sterilization monitoring"},{"id":"peri-operative-care__cleaning-washing-and-packing-of-instruments","label":"Cleaning, washing and packing of instruments"},{"id":"peri-operative-care__decontamination-of-environment-and-spillages","label":"Decontamination of environment and spillages"},{"id":"peri-operative-care__decontamination-of-clinical-waste","label":"Decontamination of clinical waste"},{"id":"peri-operative-care__decontamination-of-surgical-instruments","label":"Decontamination of surgical instruments"},{"id":"peri-operative-care__decontamination-of-electrical-equipment","label":"Decontamination of electrical equipment"},{"id":"peri-operative-care__cleaning-and-care-of-fibre-optic-scopes","label":"Cleaning and care of fibre optic scopes"},{"id":"peri-operative-care__handling-and-dispatching-surgical-specimens","label":"Handling and dispatching surgical specimens"}]},{"label":"Optional Procedures (5)","items":[{"id":"peri-operative-care__instrument-nurse-role-vascular-surgery","label":"Instrument nurse role – Vascular Surgery"},{"id":"peri-operative-care__instrument-nurse-role-robotic-surgery","label":"Instrument nurse role – Robotic Surgery"},{"id":"peri-operative-care__instrument-nurse-role-cardiothoracic-surgery","label":"Instrument nurse role – Cardiothoracic Surgery"},{"id":"peri-operative-care__instrument-nurse-role-ophthalmic-subspecialty-surgery","label":"Instrument nurse role – Ophthalmic subspecialty surgery"},{"id":"peri-operative-care__instrument-nurse-role-neurosurgical-subspecialty-surgery","label":"Instrument nurse role – Neurosurgical subspecialty surgery"}]}],"applicableRole":"both"},{"id":"ophthalmology-care","name":"Ophthalmology","summary":"Clinical and surgical ophthalmology procedures in outpatient and theatre settings.","groups":[{"label":"Clinical Procedures (29)","items":[{"id":"ophthalmology-care__triaging-ophthalmology-patients","label":"Triaging ophthalmology patients"},{"id":"ophthalmology-care__visual-acuity-measurement-adult","label":"Visual acuity measurement – adult"},{"id":"ophthalmology-care__visual-acuity-measurement-children","label":"Visual acuity measurement – children"},{"id":"ophthalmology-care__near-vision-measurement","label":"Near vision measurement"},{"id":"ophthalmology-care__anterior-segment-examination","label":"Anterior segment examination"},{"id":"ophthalmology-care__intraocular-pressure-measurement","label":"Intraocular pressure measurement"},{"id":"ophthalmology-care__calibration-of-tonometer","label":"Calibration of tonometer"},{"id":"ophthalmology-care__pre-operative-counselling-for-ophthalmic-procedures","label":"Pre-operative counselling for ophthalmic procedures"},{"id":"ophthalmology-care__schirmer-s-test","label":"Schirmer's test"},{"id":"ophthalmology-care__colour-vision-testing-ishihara","label":"Colour vision testing (Ishihara)"},{"id":"ophthalmology-care__eyelid-hygiene-and-scrub","label":"Eyelid hygiene and scrub"},{"id":"ophthalmology-care__eye-dressing-application","label":"Eye dressing application"},{"id":"ophthalmology-care__instilling-eye-drops-with-punctal-occlusion","label":"Instilling eye drops with punctal occlusion"},{"id":"ophthalmology-care__application-of-eye-pad-and-shield","label":"Application of eye pad and shield"},{"id":"ophthalmology-care__bandage-contact-lens-insertion","label":"Bandage contact lens insertion"},{"id":"ophthalmology-care__bandage-contact-lens-removal","label":"Bandage contact lens removal"},{"id":"ophthalmology-care__contact-lens-wear-counselling","label":"Contact lens wear counselling"},{"id":"ophthalmology-care__eye-rodding","label":"Eye rodding"},{"id":"ophthalmology-care__ph-testing-of-tears","label":"pH testing of tears"},{"id":"ophthalmology-care__eye-irrigation-procedure","label":"Eye irrigation procedure"},{"id":"ophthalmology-care__corneal-staining","label":"Corneal staining"},{"id":"ophthalmology-care__fundus-photography-preparation","label":"Fundus photography preparation"},{"id":"ophthalmology-care__conjunctival-swab-collection","label":"Conjunctival swab collection"},{"id":"ophthalmology-care__assist-corneal-scraping","label":"Assist corneal scraping"},{"id":"ophthalmology-care__assist-retinopathy-of-prematurity-screening","label":"Assist retinopathy of prematurity screening"},{"id":"ophthalmology-care__assist-ophthalmic-laser-therapy","label":"Assist ophthalmic laser therapy"},{"id":"ophthalmology-care__assist-fundus-fluorescein-angiography","label":"Assist fundus fluorescein angiography"},{"id":"ophthalmology-care__assist-lacrimal-syringing","label":"Assist lacrimal syringing"},{"id":"ophthalmology-care__assist-incision-and-curettage","label":"Assist incision and curettage"},{"id":"ophthalmology-care__assist-intravitreal-injection","label":"Assist intravitreal injection"}]},{"label":"Surgical Procedures (10)","items":[{"id":"ophthalmology-care__microsurgical-instrument-cleaning-and-sterilization","label":"Microsurgical instrument cleaning and sterilization"},{"id":"ophthalmology-care__assist-extracapsular-cataract-extraction","label":"Assist extracapsular cataract extraction"},{"id":"ophthalmology-care__assist-phacoemulsification-surgery","label":"Assist phacoemulsification surgery"},{"id":"ophthalmology-care__assist-pterygium-excision","label":"Assist pterygium excision"},{"id":"ophthalmology-care__assist-vitreoretinal-surgery","label":"Assist vitreoretinal surgery"},{"id":"ophthalmology-care__preparation-of-intraocular-gases","label":"Preparation of intraocular gases"},{"id":"ophthalmology-care__assist-trabeculectomy-glaucoma-drainage-device-surgery","label":"Assist trabeculectomy / glaucoma drainage device surgery"},{"id":"ophthalmology-care__assist-corneal-transplantation","label":"Assist corneal transplantation"},{"id":"ophthalmology-care__assist-oculoplastic-surgery","label":"Assist oculoplastic surgery"},{"id":"ophthalmology-care__assist-squint-surgery","label":"Assist squint surgery"}]}],"applicableRole":"both"},{"id":"emergency-medicine","name":"Emergency Medicine & Trauma Services","summary":"Emergency and trauma competencies across triage, airway, resuscitation, surgical procedures and patient care.","groups":[{"label":"Emergency Procedures (60+)","items":[{"id":"emergency-medicine__hospital-triage","label":"Hospital triage"},{"id":"emergency-medicine__field-triage","label":"Field triage"},{"id":"emergency-medicine__insertion-of-airway-adjunct","label":"Insertion of airway adjunct"},{"id":"emergency-medicine__insertion-of-supraglottic-airway-device","label":"Insertion of supraglottic airway device"},{"id":"emergency-medicine__tracheal-bronchial-suctioning","label":"Tracheal bronchial suctioning"},{"id":"emergency-medicine__prepare-and-assist-endotracheal-intubation","label":"Prepare and assist endotracheal intubation"},{"id":"emergency-medicine__perform-or-assist-emergency-cricothyrotomy","label":"Perform or assist emergency cricothyrotomy"},{"id":"emergency-medicine__bag-valve-mask-ventilation","label":"Bag valve mask ventilation"},{"id":"emergency-medicine__assemble-and-test-ventilator-parameters","label":"Assemble and test ventilator parameters"},{"id":"emergency-medicine__assess-severity-of-acute-bronchial-asthma-coad","label":"Assess severity of acute bronchial asthma / COAD"},{"id":"emergency-medicine__prepare-prescribe-and-administer-nebulizers","label":"Prepare, prescribe and administer nebulizers"},{"id":"emergency-medicine__administration-of-oxygen-therapy","label":"Administration of oxygen therapy"},{"id":"emergency-medicine__intravenous-cannulation","label":"Intravenous cannulation"},{"id":"emergency-medicine__preparation-and-administration-of-emergency-drugs","label":"Preparation and administration of emergency drugs"},{"id":"emergency-medicine__iv-fluids-for-resuscitation","label":"IV fluids for resuscitation"},{"id":"emergency-medicine__prepare-and-assist-cvp-line-insertion-and-monitoring","label":"Prepare and assist CVP line insertion and monitoring"},{"id":"emergency-medicine__arterial-blood-sampling","label":"Arterial blood sampling"},{"id":"emergency-medicine__perform-and-interpret-ecg","label":"Perform and interpret ECG"},{"id":"emergency-medicine__recognition-of-lethal-arrhythmias","label":"Recognition of lethal arrhythmias"},{"id":"emergency-medicine__application-and-usage-of-aed","label":"Application and usage of AED"},{"id":"emergency-medicine__cardiopulmonary-resuscitation","label":"Cardiopulmonary resuscitation"},{"id":"emergency-medicine__removal-of-superficial-foreign-body","label":"Removal of superficial foreign body"},{"id":"emergency-medicine__eye-irrigation-for-chemical-injury","label":"Eye irrigation for chemical injury"},{"id":"emergency-medicine__corneal-staining-in-emergency-setting","label":"Corneal staining in emergency setting"},{"id":"emergency-medicine__basic-ent-nasal-packing","label":"Basic ENT nasal packing"},{"id":"emergency-medicine__removal-of-ent-foreign-body","label":"Removal of ENT foreign body"},{"id":"emergency-medicine__wound-toilet-and-suturing","label":"Wound toilet and suturing"},{"id":"emergency-medicine__incision-and-drainage-of-superficial-abscess","label":"Incision and drainage of superficial abscess"},{"id":"emergency-medicine__nail-avulsion-procedure","label":"Nail avulsion procedure"},{"id":"emergency-medicine__prepare-and-assist-chest-tube-insertion","label":"Prepare and assist chest tube insertion"},{"id":"emergency-medicine__assist-pericardiocentesis","label":"Assist pericardiocentesis"},{"id":"emergency-medicine__care-of-patient-on-chest-tube","label":"Care of patient on chest tube"},{"id":"emergency-medicine__care-of-patient-on-ventilator","label":"Care of patient on ventilator"},{"id":"emergency-medicine__transport-of-critically-ill-patient","label":"Transport of critically ill patient"},{"id":"emergency-medicine__assist-medico-legal-examination-of-oscc-patient","label":"Assist medico-legal examination of OSCC patient"},{"id":"emergency-medicine__handling-of-medico-legal-specimens","label":"Handling of medico legal specimens"},{"id":"emergency-medicine__cervical-collar-application","label":"Cervical collar application"},{"id":"emergency-medicine__spine-immobilization","label":"Spine immobilization"},{"id":"emergency-medicine__extremity-immobilization","label":"Extremity immobilization"},{"id":"emergency-medicine__application-of-pelvic-immobilizer","label":"Application of pelvic immobilizer"},{"id":"emergency-medicine__perform-log-roll-technique","label":"Perform log roll technique"},{"id":"emergency-medicine__plaster-of-paris-application-and-care","label":"Plaster of Paris application and care"},{"id":"emergency-medicine__reduction-of-simple-small-joint-dislocation","label":"Reduction of simple small joint dislocation"},{"id":"emergency-medicine__comprehensive-wound-management","label":"Comprehensive wound management"},{"id":"emergency-medicine__handling-of-amputated-limb","label":"Handling of amputated limb"},{"id":"emergency-medicine__bladder-catheterization","label":"Bladder catheterization"},{"id":"emergency-medicine__gastric-lavage-stomach-wash-out","label":"Gastric lavage / stomach wash out"},{"id":"emergency-medicine__external-decontamination-procedures","label":"External decontamination procedures"},{"id":"emergency-medicine__management-of-violent-patient","label":"Management of violent patient"},{"id":"emergency-medicine__blood-cross-match-sampling","label":"Blood cross-match sampling"},{"id":"emergency-medicine__transfusion-setup","label":"Transfusion setup"},{"id":"emergency-medicine__assist-normal-delivery-in-emergency","label":"Assist normal delivery in emergency"},{"id":"emergency-medicine__immediate-care-of-newborn-in-emergency","label":"Immediate care of newborn in emergency"},{"id":"emergency-medicine__pelvic-immobilizer-application","label":"Pelvic immobilizer application"},{"id":"emergency-medicine__extremity-splinting","label":"Extremity splinting"},{"id":"emergency-medicine__application-of-traction-splints","label":"Application of traction splints"}]}],"applicableRole":"both"},{"id":"dialysis-care","name":"Dialysis Care","summary":"Haemodialysis and peritoneal dialysis procedures for chronic renal replacement therapy.","groups":[{"label":"Haemodialysis Procedures (17)","items":[{"id":"dialysis-care__assessment-of-patient-prior-to-haemodialysis","label":"Assessment of patient prior to haemodialysis"},{"id":"dialysis-care__care-of-arterio-venous-fistula-native","label":"Care of arterio-venous fistula – native"},{"id":"dialysis-care__care-of-arterio-venous-fistula-graft","label":"Care of arterio-venous fistula – graft"},{"id":"dialysis-care__care-of-haemodialysis-catheter-cuffed","label":"Care of haemodialysis catheter – cuffed"},{"id":"dialysis-care__care-of-haemodialysis-catheter-non-cuffed","label":"Care of haemodialysis catheter – non-cuffed"},{"id":"dialysis-care__anti-coagulation-therapy-management","label":"Anti-coagulation therapy management"},{"id":"dialysis-care__preparation-of-haemodialysis-machine","label":"Preparation of haemodialysis machine"},{"id":"dialysis-care__setting-up-dialyzer-and-bloodline","label":"Setting up dialyzer and bloodline"},{"id":"dialysis-care__priming-of-dialyzer-and-bloodline","label":"Priming of dialyzer and bloodline"},{"id":"dialysis-care__cannulation-technique-for-haemodialysis","label":"Cannulation technique for haemodialysis"},{"id":"dialysis-care__initiation-of-haemodialysis-treatment","label":"Initiation of haemodialysis treatment"},{"id":"dialysis-care__termination-of-haemodialysis-treatment","label":"Termination of haemodialysis treatment"},{"id":"dialysis-care__disinfection-of-haemodialysis-machine","label":"Disinfection of haemodialysis machine"},{"id":"dialysis-care__decalcification-of-haemodialysis-machine","label":"Decalcification of haemodialysis machine"},{"id":"dialysis-care__reprocessing-of-dialyzer","label":"Reprocessing of dialyzer"},{"id":"dialysis-care__management-of-intradialytic-complication","label":"Management of intradialytic complication"},{"id":"dialysis-care__monitoring-water-treatment-system","label":"Monitoring water treatment system"}]},{"label":"Peritoneal Dialysis Procedures (19)","items":[{"id":"dialysis-care__assessment-of-patient-assistant-for-pd-treatment","label":"Assessment of patient / assistant for PD treatment"},{"id":"dialysis-care__care-of-pd-catheter-pre-operatively","label":"Care of PD catheter pre-operatively"},{"id":"dialysis-care__care-of-pd-catheter-post-operatively","label":"Care of PD catheter post-operatively"},{"id":"dialysis-care__flushing-of-pd-catheter","label":"Flushing of PD catheter"},{"id":"dialysis-care__pd-prescription-planning","label":"PD prescription planning"},{"id":"dialysis-care__continuous-ambulatory-peritoneal-dialysis-capd-training","label":"Continuous ambulatory peritoneal dialysis (CAPD) training"},{"id":"dialysis-care__automated-peritoneal-dialysis-apd-training","label":"Automated peritoneal dialysis (APD) training"},{"id":"dialysis-care__application-and-change-of-transfer-set","label":"Application and change of transfer set"},{"id":"dialysis-care__exit-site-care-for-pd-catheter","label":"Exit site care for PD catheter"},{"id":"dialysis-care__management-of-peritonitis","label":"Management of peritonitis"},{"id":"dialysis-care__peritoneal-equilibration-test-pet","label":"Peritoneal equilibration test (PET)"},{"id":"dialysis-care__assessment-of-dialysis-adequacy-pd","label":"Assessment of dialysis adequacy – PD"},{"id":"dialysis-care__pd-effluent-sampling-for-microbiology","label":"PD effluent sampling for microbiology"},{"id":"dialysis-care__exit-site-swab-sampling","label":"Exit site swab sampling"},{"id":"dialysis-care__tunnel-infection-swab-sampling","label":"Tunnel infection swab sampling"},{"id":"dialysis-care__nasal-swab-sampling-for-culture","label":"Nasal swab sampling for culture"},{"id":"dialysis-care__intraperitoneal-antibiotic-administration","label":"Intraperitoneal antibiotic administration"},{"id":"dialysis-care__parenteral-iron-administration-in-pd","label":"Parenteral iron administration in PD"},{"id":"dialysis-care__handling-pd-effluent-with-infective-risk","label":"Handling PD effluent with infective risk"}]}],"applicableRole":"both"},{"id":"pre-hospital-care","name":"Pre Hospital Care Services","summary":"Emergency medical services procedures from dispatch to on-scene care and transport.","groups":[{"label":"Pre-hospital Procedures (70+)","items":[{"id":"pre-hospital-care__provide-dispatch-cpr-instruction","label":"Provide dispatch CPR instruction"},{"id":"pre-hospital-care__manage-and-triage-emergency-call-including-methane","label":"Manage and triage emergency call including METHANE"},{"id":"pre-hospital-care__provide-delivery-and-newborn-management-instruction-over-phone","label":"Provide delivery and newborn management instruction over phone"},{"id":"pre-hospital-care__scene-assessment-in-primary-response","label":"Scene assessment in primary response"},{"id":"pre-hospital-care__scene-and-risk-assessment-for-medical-standby","label":"Scene and risk assessment for medical standby"},{"id":"pre-hospital-care__scene-staging-in-multiple-casualty-incident","label":"Scene staging in multiple casualty incident"},{"id":"pre-hospital-care__insertion-of-airway-adjuncts-in-pre-hospital-setting","label":"Insertion of airway adjuncts in pre-hospital setting"},{"id":"pre-hospital-care__sellick-s-manoeuvre-application","label":"Sellick's manoeuvre application"},{"id":"pre-hospital-care__insertion-of-supraglottic-airway-device","label":"Insertion of supraglottic airway device"},{"id":"pre-hospital-care__tracheal-bronchial-suctioning-pre-hospital","label":"Tracheal bronchial suctioning – pre-hospital"},{"id":"pre-hospital-care__adult-endotracheal-intubation-crash-airway","label":"Adult endotracheal intubation (crash airway)"},{"id":"pre-hospital-care__ent-foreign-body-removal-pre-hospital","label":"ENT foreign body removal (pre-hospital)"},{"id":"pre-hospital-care__administration-of-oxygen-therapy-ambulance-care","label":"Administration of oxygen therapy – ambulance care"},{"id":"pre-hospital-care__bipap-cpap-usage-in-pre-hospital-environment","label":"BiPAP / CPAP usage in pre-hospital environment"},{"id":"pre-hospital-care__needle-chest-decompression-in-field","label":"Needle chest decompression in field"},{"id":"pre-hospital-care__chest-tube-monitoring-during-transport","label":"Chest tube monitoring during transport"},{"id":"pre-hospital-care__end-tidal-co2-capnography-monitoring","label":"End tidal CO2 / capnography monitoring"},{"id":"pre-hospital-care__bag-valve-mask-ventilation-pre-hospital","label":"Bag valve mask ventilation – pre-hospital"},{"id":"pre-hospital-care__ventilator-assembly-and-management-during-transport","label":"Ventilator assembly and management during transport"},{"id":"pre-hospital-care__assess-manage-acute-bronchial-asthma-coad-in-field","label":"Assess/Manage acute bronchial asthma / COAD in field"},{"id":"pre-hospital-care__nebulizer-administration-ambulance","label":"Nebulizer administration – ambulance"},{"id":"pre-hospital-care__intravenous-cannulation-pre-hospital","label":"Intravenous cannulation – pre-hospital"},{"id":"pre-hospital-care__intraosseous-access-insertion","label":"Intraosseous access insertion"},{"id":"pre-hospital-care__central-line-cannulation-femoral","label":"Central line cannulation – femoral"},{"id":"pre-hospital-care__central-line-cannulation-external-jugular","label":"Central line cannulation – external jugular"},{"id":"pre-hospital-care__aed-manual-defibrillation","label":"AED / Manual defibrillation"},{"id":"pre-hospital-care__electrical-cardioversion-pre-hospital","label":"Electrical cardioversion – pre-hospital"},{"id":"pre-hospital-care__carotid-massage-for-svt","label":"Carotid massage for SVT"},{"id":"pre-hospital-care__transcutaneous-pacing","label":"Transcutaneous pacing"},{"id":"pre-hospital-care__spinal-immobilization-trauma","label":"Spinal immobilization – trauma"},{"id":"pre-hospital-care__extrication-of-seated-trauma-patient","label":"Extrication of seated trauma patient"},{"id":"pre-hospital-care__extremity-splinting-in-field","label":"Extremity splinting in field"},{"id":"pre-hospital-care__traction-splint-application","label":"Traction splint application"},{"id":"pre-hospital-care__tourniquet-application-and-monitoring","label":"Tourniquet application and monitoring"},{"id":"pre-hospital-care__cervical-immobilization","label":"Cervical immobilization"},{"id":"pre-hospital-care__pelvic-immobilizer-application","label":"Pelvic immobilizer application"},{"id":"pre-hospital-care__hemorrhage-control-in-open-wound","label":"Hemorrhage control in open wound"},{"id":"pre-hospital-care__hemostatic-suturing-pre-hospital","label":"Hemostatic suturing – pre-hospital"},{"id":"pre-hospital-care__management-of-evisceration-injury","label":"Management of evisceration injury"},{"id":"pre-hospital-care__management-of-impaled-foreign-object","label":"Management of impaled foreign object"},{"id":"pre-hospital-care__management-of-amputation-injury-and-amputated-limb","label":"Management of amputation injury and amputated limb"},{"id":"pre-hospital-care__ppe-level-2-donning-and-doffing","label":"PPE Level 2 donning and doffing"},{"id":"pre-hospital-care__ppe-level-3-donning-and-doffing","label":"PPE Level 3 donning and doffing"},{"id":"pre-hospital-care__ppe-level-4-donning-and-doffing","label":"PPE Level 4 donning and doffing"},{"id":"pre-hospital-care__decontamination-of-ambulance-vehicle","label":"Decontamination of ambulance vehicle"},{"id":"pre-hospital-care__decontamination-of-equipment","label":"Decontamination of equipment"},{"id":"pre-hospital-care__decontamination-of-patient-cbrn","label":"Decontamination of patient (CBRN)"},{"id":"pre-hospital-care__emergency-move-of-patient","label":"Emergency move of patient"},{"id":"pre-hospital-care__non-emergency-move-of-patient","label":"Non-emergency move of patient"},{"id":"pre-hospital-care__radio-communication-protocols","label":"Radio communication protocols"},{"id":"pre-hospital-care__medication-administration-adenosine","label":"Medication administration – adenosine"},{"id":"pre-hospital-care__medication-administration-adrenaline","label":"Medication administration – adrenaline"},{"id":"pre-hospital-care__medication-administration-amiodarone","label":"Medication administration – amiodarone"},{"id":"pre-hospital-care__medication-administration-aspirin","label":"Medication administration – aspirin"},{"id":"pre-hospital-care__medication-administration-atropine","label":"Medication administration – atropine"},{"id":"pre-hospital-care__medication-administration-dextrose","label":"Medication administration – dextrose"},{"id":"pre-hospital-care__medication-administration-diclofenac","label":"Medication administration – diclofenac"},{"id":"pre-hospital-care__medication-administration-furosemide","label":"Medication administration – furosemide"},{"id":"pre-hospital-care__medication-administration-lidocaine","label":"Medication administration – lidocaine"},{"id":"pre-hospital-care__medication-administration-magnesium-sulphate","label":"Medication administration – magnesium sulphate"},{"id":"pre-hospital-care__medication-administration-midazolam","label":"Medication administration – midazolam"},{"id":"pre-hospital-care__medication-administration-morphine","label":"Medication administration – morphine"},{"id":"pre-hospital-care__medication-administration-naloxone","label":"Medication administration – naloxone"},{"id":"pre-hospital-care__medication-administration-nitroglycerine","label":"Medication administration – nitroglycerine"},{"id":"pre-hospital-care__medication-administration-nitrous-oxide","label":"Medication administration – nitrous oxide"},{"id":"pre-hospital-care__field-triage-during-disaster","label":"Field triage during disaster"},{"id":"pre-hospital-care__scene-staging-in-mass-casualty-incident","label":"Scene staging in mass casualty incident"},{"id":"pre-hospital-care__decontamination-in-cbrn-incident","label":"Decontamination in CBRN incident"},{"id":"pre-hospital-care__simulation-respiratory-distress-management","label":"Simulation – respiratory distress management"},{"id":"pre-hospital-care__simulation-bronchial-asthma-management","label":"Simulation – bronchial asthma management"},{"id":"pre-hospital-care__simulation-unconscious-patient-management","label":"Simulation – unconscious patient management"},{"id":"pre-hospital-care__simulation-trauma-with-haemorrhage","label":"Simulation – trauma with haemorrhage"},{"id":"pre-hospital-care__simulation-chest-injury-scenario","label":"Simulation – chest injury scenario"},{"id":"pre-hospital-care__simulation-abdominal-injury-scenario","label":"Simulation – abdominal injury scenario"},{"id":"pre-hospital-care__simulation-failed-airway-management","label":"Simulation – failed airway management"}]}],"applicableRole":"both"},{"id":"endoscopy-services","name":"Endoscopy Services","summary":"Endoscopy unit procedures including diagnostic and therapeutic interventions.","groups":[{"label":"Core Procedures (12 categories)","items":[{"id":"endoscopy-services__assessment-and-history-taking-for-endoscopy-patients","label":"Assessment and history taking for endoscopy patients"},{"id":"endoscopy-services__discharge-planning-for-endoscopy-patients","label":"Discharge planning for endoscopy patients"},{"id":"endoscopy-services__preparation-of-patient-for-ogds","label":"Preparation of patient for OGDS"},{"id":"endoscopy-services__preparation-of-patient-for-colonoscopy","label":"Preparation of patient for colonoscopy"},{"id":"endoscopy-services__preparation-of-trolleys-equipment-and-accessories","label":"Preparation of trolleys, equipment and accessories"},{"id":"endoscopy-services__preparation-and-calibration-of-monitoring-system","label":"Preparation and calibration of monitoring system"},{"id":"endoscopy-services__care-of-patient-during-ogds","label":"Care of patient during OGDS"},{"id":"endoscopy-services__care-of-patient-during-colonoscopy","label":"Care of patient during colonoscopy"},{"id":"endoscopy-services__immediate-care-post-endoscopy-procedure","label":"Immediate care post endoscopy procedure"},{"id":"endoscopy-services__collection-and-dispatch-of-tissue-samples","label":"Collection and dispatch of tissue samples"},{"id":"endoscopy-services__administration-of-sedation-for-endoscopy","label":"Administration of sedation for endoscopy"},{"id":"endoscopy-services__reprocessing-of-endoscope-and-accessories","label":"Reprocessing of endoscope and accessories"}]},{"label":"Therapeutic Procedures (includes optional 17)","items":[{"id":"endoscopy-services__diagnostic-ogds","label":"Diagnostic OGDS"},{"id":"endoscopy-services__diagnostic-colonoscopy","label":"Diagnostic colonoscopy"},{"id":"endoscopy-services__therapeutic-haemostasis-adrenalin-injection","label":"Therapeutic haemostasis – adrenalin injection"},{"id":"endoscopy-services__therapeutic-haemostasis-rubber-band-ligation","label":"Therapeutic haemostasis – rubber band ligation"},{"id":"endoscopy-services__therapeutic-haemostasis-argon-plasma-coagulation","label":"Therapeutic haemostasis – argon plasma coagulation"},{"id":"endoscopy-services__therapeutic-haemostasis-heater-probe","label":"Therapeutic haemostasis – heater probe"},{"id":"endoscopy-services__therapeutic-haemostasis-haemoclip","label":"Therapeutic haemostasis – haemoclip"},{"id":"endoscopy-services__therapeutic-haemostasis-haemospray-endoclot","label":"Therapeutic haemostasis – haemospray / endoclot"},{"id":"endoscopy-services__therapeutic-haemostasis-histoacryl-glue","label":"Therapeutic haemostasis – histoacryl glue"},{"id":"endoscopy-services__polypectomy-procedure","label":"Polypectomy procedure"},{"id":"endoscopy-services__endoscopic-retrograde-cholangiopancreatography-ercp","label":"Endoscopic retrograde cholangiopancreatography (ERCP)"},{"id":"endoscopy-services__endoscopic-ultrasound-eus","label":"Endoscopic ultrasound (EUS)"},{"id":"endoscopy-services__single-balloon-enteroscopy","label":"Single balloon enteroscopy"},{"id":"endoscopy-services__double-balloon-enteroscopy","label":"Double balloon enteroscopy"},{"id":"endoscopy-services__percutaneous-endoscopic-gastrostomy-peg","label":"Percutaneous endoscopic gastrostomy (PEG)"},{"id":"endoscopy-services__percutaneous-endoscopic-jejunostomy-pej","label":"Percutaneous endoscopic jejunostomy (PEJ)"},{"id":"endoscopy-services__endoscopic-mucosal-resection-emr","label":"Endoscopic mucosal resection (EMR)"},{"id":"endoscopy-services__endoscopic-submucosal-dissection-esd","label":"Endoscopic submucosal dissection (ESD)"},{"id":"endoscopy-services__peroral-endoscopic-myotomy-poem","label":"Peroral endoscopic myotomy (POEM)"},{"id":"endoscopy-services__oesophageal-dilatation","label":"Oesophageal dilatation"},{"id":"endoscopy-services__metallic-stenting","label":"Metallic stenting"},{"id":"endoscopy-services__enteral-feeding-tube-placement","label":"Enteral feeding tube placement"},{"id":"endoscopy-services__oesophageal-manometry","label":"Oesophageal manometry"},{"id":"endoscopy-services__24-hour-ph-monitoring-and-impedance","label":"24-hour pH monitoring and impedance"},{"id":"endoscopy-services__urea-breath-test-ubt","label":"Urea breath test (UBT)"},{"id":"endoscopy-services__capsule-endoscopy","label":"Capsule endoscopy"},{"id":"endoscopy-services__sengstaken-tube-insertion","label":"Sengstaken tube insertion"},{"id":"endoscopy-services__pseudocyst-drainage","label":"Pseudocyst drainage"},{"id":"endoscopy-services__spyglass-cholangioscopy","label":"Spyglass cholangioscopy"},{"id":"endoscopy-services__endoscopic-marker-injection","label":"Endoscopic marker injection"}]}],"applicableRole":"both"},{"id":"orthopaedic-services","name":"Orthopaedic Services","summary":"Orthopaedic ward and emergency procedures including casting, traction and rehabilitation.","groups":[{"label":"Orthopaedic Procedures (54)","items":[{"id":"orthopaedic-services__preparation-and-application-of-thomas-splint","label":"Preparation and application of Thomas splint"},{"id":"orthopaedic-services__preparation-and-application-of-bohler-braun-frame","label":"Preparation and application of Bohler Braun frame"},{"id":"orthopaedic-services__application-and-care-of-skin-traction","label":"Application and care of skin traction"},{"id":"orthopaedic-services__application-and-care-of-skeletal-traction","label":"Application and care of skeletal traction"},{"id":"orthopaedic-services__application-and-care-of-fixed-traction","label":"Application and care of fixed traction"},{"id":"orthopaedic-services__care-of-patient-with-plaster-of-paris","label":"Care of patient with plaster of Paris"},{"id":"orthopaedic-services__application-of-halter-traction","label":"Application of halter traction"},{"id":"orthopaedic-services__assist-application-and-care-of-halovest","label":"Assist application and care of halovest"},{"id":"orthopaedic-services__neurovascular-assessment-with-traction","label":"Neurovascular assessment with traction"},{"id":"orthopaedic-services__neurovascular-assessment-post-cast-application","label":"Neurovascular assessment post cast application"},{"id":"orthopaedic-services__neurovascular-assessment-post-operation","label":"Neurovascular assessment post-operation"},{"id":"orthopaedic-services__pre-and-post-operative-care-for-amputation","label":"Pre and post operative care for amputation"},{"id":"orthopaedic-services__pre-and-post-operative-care-for-trauma","label":"Pre and post operative care for trauma"},{"id":"orthopaedic-services__pre-and-post-operative-care-for-non-trauma","label":"Pre and post operative care for non-trauma"},{"id":"orthopaedic-services__application-of-cryo-cuff","label":"Application of cryo cuff"},{"id":"orthopaedic-services__application-of-continuous-passive-motion-cpm","label":"Application of continuous passive motion (CPM)"},{"id":"orthopaedic-services__immediate-management-of-spinal-injury-log-rolling","label":"Immediate management of spinal injury – log rolling"},{"id":"orthopaedic-services__skin-care-for-spinal-injury-patient","label":"Skin care for spinal injury patient"},{"id":"orthopaedic-services__bowel-training-for-spinal-injury-patient","label":"Bowel training for spinal injury patient"},{"id":"orthopaedic-services__bladder-training-for-spinal-injury-patient","label":"Bladder training for spinal injury patient"},{"id":"orthopaedic-services__range-of-motion-exercises","label":"Range of motion exercises"},{"id":"orthopaedic-services__static-quadriceps-exercise-education","label":"Static quadriceps exercise education"},{"id":"orthopaedic-services__ankle-foot-pump-exercise-education","label":"Ankle foot pump exercise education"},{"id":"orthopaedic-services__deep-breathing-exercise-education","label":"Deep breathing exercise education"},{"id":"orthopaedic-services__ambulating-patient-with-crutches","label":"Ambulating patient with crutches"},{"id":"orthopaedic-services__ambulating-patient-with-walking-frame","label":"Ambulating patient with walking frame"},{"id":"orthopaedic-services__ambulating-patient-with-wheelchair","label":"Ambulating patient with wheelchair"},{"id":"orthopaedic-services__care-of-patient-with-cast-or-slab","label":"Care of patient with cast or slab"},{"id":"orthopaedic-services__interpretation-of-musculoskeletal-upper-limb-x-ray","label":"Interpretation of musculoskeletal upper limb x-ray"},{"id":"orthopaedic-services__interpretation-of-musculoskeletal-lower-limb-x-ray","label":"Interpretation of musculoskeletal lower limb x-ray"},{"id":"orthopaedic-services__interpretation-of-spine-x-ray","label":"Interpretation of spine x-ray"},{"id":"orthopaedic-services__application-of-arm-sling","label":"Application of arm sling"},{"id":"orthopaedic-services__application-of-stump-bandage","label":"Application of stump bandage"},{"id":"orthopaedic-services__application-of-limb-bandage","label":"Application of limb bandage"},{"id":"orthopaedic-services__principles-and-care-of-knee-brace","label":"Principles and care of knee brace"},{"id":"orthopaedic-services__principles-and-care-of-juwette-brace","label":"Principles and care of JUWETTE brace"},{"id":"orthopaedic-services__principles-and-care-of-somi-brace","label":"Principles and care of SOMI brace"},{"id":"orthopaedic-services__application-of-shoulder-strapping","label":"Application of shoulder strapping"},{"id":"orthopaedic-services__application-of-volar-or-dorsal-slab","label":"Application of volar or dorsal slab"},{"id":"orthopaedic-services__application-of-above-elbow-backslab","label":"Application of above elbow backslab"},{"id":"orthopaedic-services__application-of-below-elbow-backslab","label":"Application of below elbow backslab"},{"id":"orthopaedic-services__application-of-colles-cast","label":"Application of Colles cast"},{"id":"orthopaedic-services__application-of-bennet-cast","label":"Application of Bennet cast"},{"id":"orthopaedic-services__application-of-ulnar-gutter-cast","label":"Application of ulnar gutter cast"},{"id":"orthopaedic-services__application-of-thumb-spica-cast","label":"Application of thumb spica cast"},{"id":"orthopaedic-services__application-of-scaphoid-cast","label":"Application of scaphoid cast"},{"id":"orthopaedic-services__application-of-hanging-cast","label":"Application of hanging cast"},{"id":"orthopaedic-services__application-of-u-slab","label":"Application of \"U\" slab"},{"id":"orthopaedic-services__application-of-above-knee-backslab","label":"Application of above knee backslab"},{"id":"orthopaedic-services__application-of-below-knee-backslab","label":"Application of below knee backslab"},{"id":"orthopaedic-services__application-of-cylinder-cast","label":"Application of cylinder cast"},{"id":"orthopaedic-services__application-of-boot-cast","label":"Application of boot cast"},{"id":"orthopaedic-services__application-of-patellar-tendon-bearing-cast","label":"Application of patellar tendon bearing cast"},{"id":"orthopaedic-services__application-of-body-cast","label":"Application of body cast"},{"id":"orthopaedic-services__application-of-minerva-jacket","label":"Application of Minerva jacket"},{"id":"orthopaedic-services__application-of-hip-spica","label":"Application of hip spica"},{"id":"orthopaedic-services__serial-casting-for-ctev-ponseti-cast","label":"Serial casting for CTEV / Ponseti cast"},{"id":"orthopaedic-services__wedging-of-cast","label":"Wedging of cast"},{"id":"orthopaedic-services__removal-of-halovest","label":"Removal of halovest"},{"id":"orthopaedic-services__removal-of-external-fixator","label":"Removal of external fixator"},{"id":"orthopaedic-services__removal-of-cast","label":"Removal of cast"},{"id":"orthopaedic-services__perform-closed-manual-reduction-cmr","label":"Perform closed manual reduction (CMR)"}]}],"applicableRole":"both"},{"id":"peri-anaesthesia-care","name":"Peri-Anaesthesia Care (PAC)","summary":"Peri-anaesthesia procedures covering airway, monitoring, anaesthetic equipment and recovery care.","groups":[{"label":"Core Procedures (50)","items":[{"id":"peri-anaesthesia-care__assemble-and-disassemble-laryngoscope","label":"Assemble and disassemble laryngoscope"},{"id":"peri-anaesthesia-care__prepare-video-assisted-laryngoscope","label":"Prepare video assisted laryngoscope"},{"id":"peri-anaesthesia-care__cleaning-decontamination-and-sterilization-of-breathing-system","label":"Cleaning, decontamination and sterilization of breathing system"},{"id":"peri-anaesthesia-care__preparation-for-intubation","label":"Preparation for intubation"},{"id":"peri-anaesthesia-care__preparation-and-assistance-in-awake-fibreoptic-intubation","label":"Preparation and assistance in awake fibreoptic intubation"},{"id":"peri-anaesthesia-care__application-of-cricoid-pressure","label":"Application of cricoid pressure"},{"id":"peri-anaesthesia-care__preparation-of-supraglottic-airway-adjuncts","label":"Preparation of supraglottic airway adjuncts"},{"id":"peri-anaesthesia-care__preparation-of-difficult-airway-trolley","label":"Preparation of difficult airway trolley"},{"id":"peri-anaesthesia-care__assist-in-difficult-intubation","label":"Assist in difficult intubation"},{"id":"peri-anaesthesia-care__perform-endotracheal-intubation","label":"Perform endotracheal intubation"},{"id":"peri-anaesthesia-care__perform-endotracheal-extubation","label":"Perform endotracheal extubation"},{"id":"peri-anaesthesia-care__perform-supraglottic-airway-insertion","label":"Perform supraglottic airway insertion"},{"id":"peri-anaesthesia-care__perform-supraglottic-airway-extubation","label":"Perform supraglottic airway extubation"},{"id":"peri-anaesthesia-care__checking-and-calibrating-anaesthesia-machine","label":"Checking and calibrating anaesthesia machine"},{"id":"peri-anaesthesia-care__identify-and-troubleshoot-anaesthesia-machine","label":"Identify and troubleshoot anaesthesia machine"},{"id":"peri-anaesthesia-care__prepare-and-assist-total-intravenous-anaesthesia-tiva-tci","label":"Prepare and assist total intravenous anaesthesia (TIVA / TCI)"},{"id":"peri-anaesthesia-care__assemble-bispectral-index-bis-monitor","label":"Assemble bispectral index (BIS) monitor"},{"id":"peri-anaesthesia-care__prepare-and-assist-chest-tube-insertion","label":"Prepare and assist chest tube insertion"},{"id":"peri-anaesthesia-care__refilling-vaporizers","label":"Refilling vaporizers"},{"id":"peri-anaesthesia-care__emptying-vaporizers-safely","label":"Emptying vaporizers safely"},{"id":"peri-anaesthesia-care__assemble-anaesthesia-breathing-circuit","label":"Assemble anaesthesia breathing circuit"},{"id":"peri-anaesthesia-care__assemble-ayre-s-t-piece-circuit","label":"Assemble Ayre's T-piece circuit"},{"id":"peri-anaesthesia-care__application-of-rapid-sequence-induction","label":"Application of rapid sequence induction"},{"id":"peri-anaesthesia-care__assemble-passive-humidification-system","label":"Assemble passive humidification system"},{"id":"peri-anaesthesia-care__prepare-anaesthetic-nebulizer-system","label":"Prepare anaesthetic nebulizer system"},{"id":"peri-anaesthesia-care__prepare-and-check-anaesthesia-resuscitation-trolley","label":"Prepare and check anaesthesia resuscitation trolley"},{"id":"peri-anaesthesia-care__setting-up-patient-controlled-analgesia-pca-pump","label":"Setting up patient controlled analgesia (PCA) pump"},{"id":"peri-anaesthesia-care__care-during-positioning-supine","label":"Care during positioning – supine"},{"id":"peri-anaesthesia-care__care-during-positioning-prone","label":"Care during positioning – prone"},{"id":"peri-anaesthesia-care__care-during-positioning-lithotomy","label":"Care during positioning – lithotomy"},{"id":"peri-anaesthesia-care__care-of-patient-on-pneumatic-tourniquet","label":"Care of patient on pneumatic tourniquet"},{"id":"peri-anaesthesia-care__prepare-and-care-for-spinal-nerve-block","label":"Prepare and care for spinal nerve block"},{"id":"peri-anaesthesia-care__prepare-and-care-for-epidural-block","label":"Prepare and care for epidural block"},{"id":"peri-anaesthesia-care__prepare-pulse-oximeter-and-interpret","label":"Prepare pulse oximeter and interpret"},{"id":"peri-anaesthesia-care__set-up-capnography-system","label":"Set up capnography system"},{"id":"peri-anaesthesia-care__insert-temperature-probe","label":"Insert temperature probe"},{"id":"peri-anaesthesia-care__assemble-pressure-transducer-system","label":"Assemble pressure transducer system"},{"id":"peri-anaesthesia-care__care-of-patient-with-invasive-lines","label":"Care of patient with invasive lines"},{"id":"peri-anaesthesia-care__assemble-oxygen-therapy-devices","label":"Assemble oxygen therapy devices"},{"id":"peri-anaesthesia-care__application-of-peripheral-nerve-stimulator","label":"Application of peripheral nerve stimulator"},{"id":"peri-anaesthesia-care__assemble-intraoperative-warming-device","label":"Assemble intraoperative warming device"},{"id":"peri-anaesthesia-care__assemble-fluid-warming-device","label":"Assemble fluid warming device"},{"id":"peri-anaesthesia-care__assemble-blood-warming-device","label":"Assemble blood warming device"},{"id":"peri-anaesthesia-care__transportation-of-critically-ill-patient","label":"Transportation of critically ill patient"},{"id":"peri-anaesthesia-care__preoperative-assessment-in-pac","label":"Preoperative assessment in PAC"},{"id":"peri-anaesthesia-care__care-of-patient-in-recovery-area","label":"Care of patient in recovery area"},{"id":"peri-anaesthesia-care__assess-level-of-block-for-regional-anaesthesia","label":"Assess level of block for regional anaesthesia"},{"id":"peri-anaesthesia-care__assess-bromage-score","label":"Assess Bromage score"},{"id":"peri-anaesthesia-care__assess-sedation-scale","label":"Assess sedation scale"},{"id":"peri-anaesthesia-care__assess-recovery-score","label":"Assess recovery score"},{"id":"peri-anaesthesia-care__assess-pain-score","label":"Assess pain score"},{"id":"peri-anaesthesia-care__care-of-patient-under-acute-pain-service","label":"Care of patient under acute pain service"}]},{"label":"Optional Procedures (13)","items":[{"id":"peri-anaesthesia-care__prepare-non-invasive-cardiac-output-monitoring","label":"Prepare non-invasive cardiac output monitoring"},{"id":"peri-anaesthesia-care__prepare-invasive-cardiac-output-monitoring","label":"Prepare invasive cardiac output monitoring"},{"id":"peri-anaesthesia-care__assemble-rapid-infusion-device","label":"Assemble rapid infusion device"},{"id":"peri-anaesthesia-care__prepare-double-lumen-tube-or-endobronchial-blocker","label":"Prepare double lumen tube or endobronchial blocker"},{"id":"peri-anaesthesia-care__assemble-and-calibrate-icp-monitoring","label":"Assemble and calibrate ICP monitoring"},{"id":"peri-anaesthesia-care__assist-autologous-blood-transfusion","label":"Assist autologous blood transfusion"},{"id":"peri-anaesthesia-care__assemble-jet-ventilation-system","label":"Assemble jet ventilation system"},{"id":"peri-anaesthesia-care__prepare-and-assist-cricothyrotomy","label":"Prepare and assist cricothyrotomy"},{"id":"peri-anaesthesia-care__assemble-cerebral-oximetry-monitoring","label":"Assemble cerebral oximetry monitoring"},{"id":"peri-anaesthesia-care__care-of-echocardiography-ultrasound-machine","label":"Care of echocardiography / ultrasound machine"},{"id":"peri-anaesthesia-care__assist-ga-in-mri-suite","label":"Assist GA in MRI suite"},{"id":"peri-anaesthesia-care__assist-ga-in-ect-suite","label":"Assist GA in ECT suite"},{"id":"peri-anaesthesia-care__assist-ga-in-remote-locations-ir-ct-oncology","label":"Assist GA in remote locations (IR / CT / Oncology)"}]}],"applicableRole":"both"},{"id":"intensive-care-nursing","name":"Intensive Care Nursing","summary":"ICU, paediatric, cardiothoracic and neuro intensive care procedures for nurses.","groups":[{"label":"General ICU Core Procedures (28)","items":[{"id":"intensive-care-nursing__preparation-for-receiving-icu-patient","label":"Preparation for receiving ICU patient"},{"id":"intensive-care-nursing__transport-of-critically-ill-patient","label":"Transport of critically ill patient"},{"id":"intensive-care-nursing__charting-icu-observations","label":"Charting ICU observations"},{"id":"intensive-care-nursing__icu-hand-hygiene-protocol","label":"ICU hand hygiene protocol"},{"id":"intensive-care-nursing__dose-calculation-and-preparation-dopamine","label":"Dose calculation and preparation – dopamine"},{"id":"intensive-care-nursing__dose-calculation-and-preparation-dobutamine","label":"Dose calculation and preparation – dobutamine"},{"id":"intensive-care-nursing__dose-calculation-and-preparation-adrenaline","label":"Dose calculation and preparation – adrenaline"},{"id":"intensive-care-nursing__dose-calculation-and-preparation-noradrenaline","label":"Dose calculation and preparation – noradrenaline"},{"id":"intensive-care-nursing__dose-calculation-and-preparation-insulin-infusion","label":"Dose calculation and preparation – insulin infusion"},{"id":"intensive-care-nursing__dose-calculation-and-preparation-fentanyl","label":"Dose calculation and preparation – fentanyl"},{"id":"intensive-care-nursing__dose-calculation-and-preparation-midazolam","label":"Dose calculation and preparation – midazolam"},{"id":"intensive-care-nursing__dose-calculation-and-preparation-morphine","label":"Dose calculation and preparation – morphine"},{"id":"intensive-care-nursing__assemble-pressure-transducer-system","label":"Assemble pressure transducer system"},{"id":"intensive-care-nursing__blood-sampling-from-arterial-line","label":"Blood sampling from arterial line"},{"id":"intensive-care-nursing__care-of-patient-on-arterial-line","label":"Care of patient on arterial line"},{"id":"intensive-care-nursing__care-of-patient-on-central-venous-line","label":"Care of patient on central venous line"},{"id":"intensive-care-nursing__management-of-invasive-ventilation","label":"Management of invasive ventilation"},{"id":"intensive-care-nursing__prepare-and-assist-intubation","label":"Prepare and assist intubation"},{"id":"intensive-care-nursing__prepare-capnometry-equipment","label":"Prepare capnometry equipment"},{"id":"intensive-care-nursing__manual-ventilation-for-intubated-patients","label":"Manual ventilation for intubated patients"},{"id":"intensive-care-nursing__management-of-endotracheal-tube","label":"Management of endotracheal tube"},{"id":"intensive-care-nursing__management-of-tracheostomy-tube","label":"Management of tracheostomy tube"},{"id":"intensive-care-nursing__management-of-non-invasive-ventilation","label":"Management of non-invasive ventilation"},{"id":"intensive-care-nursing__management-of-humidifier","label":"Management of humidifier"},{"id":"intensive-care-nursing__assist-chest-physiotherapy","label":"Assist chest physiotherapy"},{"id":"intensive-care-nursing__assist-incentive-spirometry","label":"Assist incentive spirometry"},{"id":"intensive-care-nursing__tracheo-bronchial-suctioning-open-method","label":"Tracheo-bronchial suctioning (open method)"},{"id":"intensive-care-nursing__tracheo-bronchial-suctioning-closed-method","label":"Tracheo-bronchial suctioning (closed method)"},{"id":"intensive-care-nursing__administer-aerosol-drugs-via-mdi","label":"Administer aerosol drugs via MDI"},{"id":"intensive-care-nursing__administer-aerosol-drugs-via-nebulizer","label":"Administer aerosol drugs via nebulizer"},{"id":"intensive-care-nursing__prepare-and-extubate-patient","label":"Prepare and extubate patient"},{"id":"intensive-care-nursing__interpret-abnormal-laboratory-results","label":"Interpret abnormal laboratory results"},{"id":"intensive-care-nursing__perform-pain-scoring","label":"Perform pain scoring"},{"id":"intensive-care-nursing__perform-sedation-scoring","label":"Perform sedation scoring"},{"id":"intensive-care-nursing__management-of-continuous-enteral-nutrition","label":"Management of continuous enteral nutrition"},{"id":"intensive-care-nursing__management-of-total-parenteral-nutrition","label":"Management of total parenteral nutrition"},{"id":"intensive-care-nursing__recognition-of-life-threatening-arrhythmias","label":"Recognition of life-threatening arrhythmias"},{"id":"intensive-care-nursing__assist-or-perform-defibrillation","label":"Assist or perform defibrillation"}]},{"label":"General ICU Optional Procedures (9)","items":[{"id":"intensive-care-nursing__calculate-and-administer-neuromuscular-blockers","label":"Calculate and administer neuromuscular blockers"},{"id":"intensive-care-nursing__apply-capnometer-and-interpret","label":"Apply capnometer and interpret"},{"id":"intensive-care-nursing__apply-pneumatic-cuff-compressors-for-dvt-prophylaxis","label":"Apply pneumatic cuff compressors for DVT prophylaxis"},{"id":"intensive-care-nursing__prepare-and-assist-percutaneous-tracheostomy","label":"Prepare and assist percutaneous tracheostomy"},{"id":"intensive-care-nursing__care-of-patient-on-icp-monitoring-with-evd","label":"Care of patient on ICP monitoring with EVD"},{"id":"intensive-care-nursing__prepare-and-assist-bronchoscopy","label":"Prepare and assist bronchoscopy"},{"id":"intensive-care-nursing__care-of-patient-on-continuous-renal-replacement-therapy-crrt","label":"Care of patient on continuous renal replacement therapy (CRRT)"},{"id":"intensive-care-nursing__administer-aerosol-drugs-during-non-invasive-ventilation","label":"Administer aerosol drugs during non-invasive ventilation"},{"id":"intensive-care-nursing__prepare-and-assist-brain-stem-function-test","label":"Prepare and assist brain stem function test"}]},{"label":"Paediatric Intensive Care Core (9)","items":[{"id":"intensive-care-nursing__physical-assessment-cns","label":"Physical assessment – CNS"},{"id":"intensive-care-nursing__physical-assessment-cardiovascular","label":"Physical assessment – cardiovascular"},{"id":"intensive-care-nursing__physical-assessment-respiratory","label":"Physical assessment – respiratory"},{"id":"intensive-care-nursing__physical-assessment-genito-urinary","label":"Physical assessment – genito-urinary"},{"id":"intensive-care-nursing__physical-assessment-gastrointestinal","label":"Physical assessment – gastrointestinal"},{"id":"intensive-care-nursing__paediatric-pain-score-assessment","label":"Paediatric pain score assessment"},{"id":"intensive-care-nursing__fluid-maintenance-and-resuscitation-calculation","label":"Fluid maintenance and resuscitation calculation"},{"id":"intensive-care-nursing__care-of-child-on-ventilator","label":"Care of child on ventilator"},{"id":"intensive-care-nursing__ett-tracheostomy-suctioning-with-manual-bagging","label":"ETT / tracheostomy suctioning with manual bagging"}]},{"label":"Paediatric Intensive Care Optional (1)","items":[{"id":"intensive-care-nursing__glasgow-coma-scale-assessment-for-infant","label":"Glasgow Coma Scale assessment for infant"}]},{"label":"Cardiothoracic ICU Core (15)","items":[{"id":"intensive-care-nursing__observe-coronary-artery-bypass-graft-surgery","label":"Observe coronary artery bypass graft surgery"},{"id":"intensive-care-nursing__observe-valve-surgery","label":"Observe valve surgery"},{"id":"intensive-care-nursing__preparation-for-admission-of-post-cardiac-surgery-patient","label":"Preparation for admission of post cardiac surgery patient"},{"id":"intensive-care-nursing__charge-nurse-role-receiving-post-cardiac-surgery-patient","label":"Charge nurse role receiving post cardiac surgery patient"},{"id":"intensive-care-nursing__set-up-temporary-epicardial-cardiac-pacemaker","label":"Set up temporary epicardial cardiac pacemaker"},{"id":"intensive-care-nursing__remove-pulmonary-artery-catheter","label":"Remove pulmonary artery catheter"},{"id":"intensive-care-nursing__perform-thermodilution-cardiac-output-study","label":"Perform thermodilution cardiac output study"},{"id":"intensive-care-nursing__care-of-patient-on-intra-aortic-balloon-pump-iabp","label":"Care of patient on intra-aortic balloon pump (IABP)"},{"id":"intensive-care-nursing__perform-doppler-ultrasound-for-arterial-pulsation","label":"Perform Doppler ultrasound for arterial pulsation"},{"id":"intensive-care-nursing__manage-potassium-infusion-therapy","label":"Manage potassium infusion therapy"},{"id":"intensive-care-nursing__manage-calcium-infusion-therapy","label":"Manage calcium infusion therapy"},{"id":"intensive-care-nursing__manage-magnesium-infusion-therapy","label":"Manage magnesium infusion therapy"},{"id":"intensive-care-nursing__care-of-patient-with-chest-drain-post-cardiac-surgery","label":"Care of patient with chest drain post cardiac surgery"},{"id":"intensive-care-nursing__removal-of-chest-drain-post-cardiac-surgery","label":"Removal of chest drain post cardiac surgery"},{"id":"intensive-care-nursing__care-of-patient-on-nitric-oxide-therapy","label":"Care of patient on nitric oxide therapy"}]},{"label":"Cardiothoracic ICU Optional (8)","items":[{"id":"intensive-care-nursing__observe-thoracic-surgery","label":"Observe thoracic surgery"},{"id":"intensive-care-nursing__assist-insertion-of-pulmonary-artery-catheter","label":"Assist insertion of pulmonary artery catheter"},{"id":"intensive-care-nursing__assist-elective-cardioversion","label":"Assist elective cardioversion"},{"id":"intensive-care-nursing__assist-insertion-of-iabp","label":"Assist insertion of IABP"},{"id":"intensive-care-nursing__assist-removal-of-iabp","label":"Assist removal of IABP"},{"id":"intensive-care-nursing__assist-removal-of-epicardial-pacing-wire","label":"Assist removal of epicardial pacing wire"},{"id":"intensive-care-nursing__assist-emergency-chest-re-open-in-cicu","label":"Assist emergency chest re-open in CICU"},{"id":"intensive-care-nursing__support-patient-post-iabp-removal","label":"Support patient post IABP removal"}]},{"label":"Neuro ICU Core (6)","items":[{"id":"intensive-care-nursing__interpret-icp-waveform","label":"Interpret ICP waveform"},{"id":"intensive-care-nursing__set-up-icp-monitoring-with-evd","label":"Set up ICP monitoring with EVD"},{"id":"intensive-care-nursing__care-of-patient-on-icp-monitoring-with-evd","label":"Care of patient on ICP monitoring with EVD"},{"id":"intensive-care-nursing__perform-csf-drainage-via-evd","label":"Perform CSF drainage via EVD"},{"id":"intensive-care-nursing__care-of-patient-with-raised-icp","label":"Care of patient with raised ICP"},{"id":"intensive-care-nursing__post-operative-care-of-neurosurgical-patient","label":"Post-operative care of neurosurgical patient"}]},{"label":"Neuro ICU Optional (2)","items":[{"id":"intensive-care-nursing__collect-csf-sampling-via-evd","label":"Collect CSF sampling via EVD"},{"id":"intensive-care-nursing__post-operative-care-of-cerebral-aneurysm-surgery-patient","label":"Post-operative care of cerebral aneurysm surgery patient"}]}],"applicableRole":"nurses"},{"id":"general-paediatric-nursing","name":"General Paediatric Nursing","summary":"Paediatric ward procedures covering assessment, interventions and specialised paediatric care.","groups":[{"label":"Core Procedures (21)","items":[{"id":"general-paediatric-nursing__assess-paediatric-patient-on-admission","label":"Assess paediatric patient on admission"},{"id":"general-paediatric-nursing__assess-level-of-consciousness-paediatric","label":"Assess level of consciousness – paediatric"},{"id":"general-paediatric-nursing__paediatric-venepuncture","label":"Paediatric venepuncture"},{"id":"general-paediatric-nursing__peripheral-venous-cannulation-paediatric","label":"Peripheral venous cannulation – paediatric"},{"id":"general-paediatric-nursing__heel-prick-for-capillary-blood-sugar","label":"Heel prick for capillary blood sugar"},{"id":"general-paediatric-nursing__finger-prick-for-capillary-blood-sugar","label":"Finger prick for capillary blood sugar"},{"id":"general-paediatric-nursing__insertion-of-nasogastric-tube","label":"Insertion of nasogastric tube"},{"id":"general-paediatric-nursing__insertion-of-orogastric-tube","label":"Insertion of orogastric tube"},{"id":"general-paediatric-nursing__enteral-tube-feeding","label":"Enteral tube feeding"},{"id":"general-paediatric-nursing__collection-of-urine-for-culture","label":"Collection of urine for culture"},{"id":"general-paediatric-nursing__peak-flow-meter-measurement","label":"Peak flow meter measurement"},{"id":"general-paediatric-nursing__administration-of-metered-dose-inhaler","label":"Administration of metered dose inhaler"},{"id":"general-paediatric-nursing__nebulization-paediatric","label":"Nebulization – paediatric"},{"id":"general-paediatric-nursing__assist-lumbar-puncture","label":"Assist lumbar puncture"},{"id":"general-paediatric-nursing__paediatric-blood-transfusion","label":"Paediatric blood transfusion"},{"id":"general-paediatric-nursing__administration-of-oral-sedation","label":"Administration of oral sedation"},{"id":"general-paediatric-nursing__administration-of-rectal-medication","label":"Administration of rectal medication"},{"id":"general-paediatric-nursing__monitoring-patient-under-sedation","label":"Monitoring patient under sedation"},{"id":"general-paediatric-nursing__oro-nasopharyngeal-suctioning","label":"Oro-nasopharyngeal suctioning"},{"id":"general-paediatric-nursing__bag-valve-mask-ventilation-paediatric","label":"Bag valve mask ventilation – paediatric"},{"id":"general-paediatric-nursing__use-of-cardiorespiratory-monitor-and-alarm-limits","label":"Use of cardiorespiratory monitor and alarm limits"},{"id":"general-paediatric-nursing__intra-inter-hospital-transfer-of-paediatric-patient","label":"Intra / inter hospital transfer of paediatric patient"},{"id":"general-paediatric-nursing__assist-chest-tube-placement-paediatric","label":"Assist chest tube placement – paediatric"}]},{"label":"Optional Procedures (18)","items":[{"id":"general-paediatric-nursing__assist-central-line-placement-paediatric","label":"Assist central line placement – paediatric"},{"id":"general-paediatric-nursing__care-of-central-venous-line-paediatric","label":"Care of central venous line – paediatric"},{"id":"general-paediatric-nursing__care-of-chemo-port-paediatric","label":"Care of chemo port – paediatric"},{"id":"general-paediatric-nursing__setting-up-total-parenteral-nutrition-paediatric","label":"Setting up total parenteral nutrition – paediatric"},{"id":"general-paediatric-nursing__assist-intubation-paediatric","label":"Assist intubation – paediatric"},{"id":"general-paediatric-nursing__endotracheal-suctioning-paediatric","label":"Endotracheal suctioning – paediatric"},{"id":"general-paediatric-nursing__care-of-tracheostomy-paediatric","label":"Care of tracheostomy – paediatric"},{"id":"general-paediatric-nursing__blood-sampling-from-arterial-line-paediatric","label":"Blood sampling from arterial line – paediatric"},{"id":"general-paediatric-nursing__care-of-patient-on-non-invasive-ventilation-paediatric","label":"Care of patient on non-invasive ventilation – paediatric"},{"id":"general-paediatric-nursing__stoma-care-paediatric","label":"Stoma care – paediatric"},{"id":"general-paediatric-nursing__phototherapy-paediatric","label":"Phototherapy – paediatric"},{"id":"general-paediatric-nursing__checking-photolight-irradiance","label":"Checking photolight irradiance"},{"id":"general-paediatric-nursing__assist-bone-marrow-aspiration","label":"Assist bone marrow aspiration"},{"id":"general-paediatric-nursing__assist-chest-tube-placement-repeat","label":"Assist chest tube placement (repeat)"},{"id":"general-paediatric-nursing__assist-bladder-catheterization-paediatric","label":"Assist bladder catheterization – paediatric"},{"id":"general-paediatric-nursing__care-of-patient-on-peritoneal-dialysis-paediatric","label":"Care of patient on peritoneal dialysis – paediatric"},{"id":"general-paediatric-nursing__wet-wrap-therapy","label":"Wet wrap therapy"},{"id":"general-paediatric-nursing__basic-ecg-interpretation-paediatric","label":"Basic ECG interpretation – paediatric"}]}],"applicableRole":"nurses"},{"id":"neonatal-nursing","name":"Neonatal Nursing Services","summary":"Neonatal intensive care procedures including ventilation, nutrition and specialist neonatal support.","groups":[{"label":"Core Procedures (49)","items":[{"id":"neonatal-nursing__admission-of-newborn-to-neonatal-unit","label":"Admission of newborn to neonatal unit"},{"id":"neonatal-nursing__comprehensive-clinical-assessment-of-neonate","label":"Comprehensive clinical assessment of neonate"},{"id":"neonatal-nursing__anthropometric-measurements-for-neonate","label":"Anthropometric measurements for neonate"},{"id":"neonatal-nursing__thermoregulation-of-newborn","label":"Thermoregulation of newborn"},{"id":"neonatal-nursing__stabilization-and-transfer-of-neonate","label":"Stabilization and transfer of neonate"},{"id":"neonatal-nursing__discharge-planning-for-neonate","label":"Discharge planning for neonate"},{"id":"neonatal-nursing__application-of-pulse-oximeter-and-interpretation","label":"Application of pulse oximeter and interpretation"},{"id":"neonatal-nursing__setting-up-invasive-blood-pressure-monitoring-neonate","label":"Setting up invasive blood pressure monitoring – neonate"},{"id":"neonatal-nursing__use-of-cardiorespiratory-monitor-and-alarm-limits-neonate","label":"Use of cardiorespiratory monitor and alarm limits – neonate"},{"id":"neonatal-nursing__heel-prick-sampling","label":"Heel prick sampling"},{"id":"neonatal-nursing__incubator-care-cleaning-and-disinfection","label":"Incubator care – cleaning and disinfection"},{"id":"neonatal-nursing__care-of-neonate-in-humidified-incubator","label":"Care of neonate in humidified incubator"},{"id":"neonatal-nursing__weaning-neonate-from-incubator","label":"Weaning neonate from incubator"},{"id":"neonatal-nursing__use-of-radiant-warmer-manual-mode","label":"Use of radiant warmer – manual mode"},{"id":"neonatal-nursing__use-of-radiant-warmer-servo-mode","label":"Use of radiant warmer – servo mode"},{"id":"neonatal-nursing__phototherapy-setup","label":"Phototherapy setup"},{"id":"neonatal-nursing__checking-photolight-irradiance-neonate","label":"Checking photolight irradiance – neonate"},{"id":"neonatal-nursing__prepare-and-assist-exchange-transfusion","label":"Prepare and assist exchange transfusion"},{"id":"neonatal-nursing__administer-nasal-prong-oxygen","label":"Administer nasal prong oxygen"},{"id":"neonatal-nursing__setting-up-conventional-ventilator-neonate","label":"Setting up conventional ventilator – neonate"},{"id":"neonatal-nursing__care-of-baby-on-conventional-ventilator","label":"Care of baby on conventional ventilator"},{"id":"neonatal-nursing__setting-up-non-invasive-ventilator-neonate","label":"Setting up non-invasive ventilator – neonate"},{"id":"neonatal-nursing__care-of-baby-on-non-invasive-ventilator","label":"Care of baby on non-invasive ventilator"},{"id":"neonatal-nursing__blood-gas-interpretation-neonate","label":"Blood gas interpretation – neonate"},{"id":"neonatal-nursing__assist-umbilical-venous-cannulation","label":"Assist umbilical venous cannulation"},{"id":"neonatal-nursing__assist-umbilical-arterial-cannulation","label":"Assist umbilical arterial cannulation"},{"id":"neonatal-nursing__peripherally-inserted-central-catheter-picc-assistance","label":"Peripherally inserted central catheter (PICC) assistance"},{"id":"neonatal-nursing__care-of-central-line-neonate","label":"Care of central line – neonate"},{"id":"neonatal-nursing__setting-up-total-parenteral-nutrition-neonate","label":"Setting up total parenteral nutrition – neonate"},{"id":"neonatal-nursing__blood-sampling-from-arterial-line-neonate","label":"Blood sampling from arterial line – neonate"},{"id":"neonatal-nursing__education-on-expressed-breast-milk-collection","label":"Education on expressed breast milk collection"},{"id":"neonatal-nursing__handling-and-storage-of-expressed-breast-milk","label":"Handling and storage of expressed breast milk"},{"id":"neonatal-nursing__cup-feeding-expressed-breast-milk","label":"Cup feeding expressed breast milk"},{"id":"neonatal-nursing__spoon-feeding-expressed-breast-milk","label":"Spoon feeding expressed breast milk"},{"id":"neonatal-nursing__enteral-tube-feeding-neonate","label":"Enteral tube feeding – neonate"},{"id":"neonatal-nursing__administration-of-oral-medication-neonate","label":"Administration of oral medication – neonate"},{"id":"neonatal-nursing__administration-of-rectal-medication-neonate","label":"Administration of rectal medication – neonate"},{"id":"neonatal-nursing__bag-valve-mask-resuscitation-neonate","label":"Bag valve mask resuscitation – neonate"},{"id":"neonatal-nursing__oro-nasopharyngeal-suctioning-neonate","label":"Oro-nasopharyngeal suctioning – neonate"},{"id":"neonatal-nursing__assist-endotracheal-intubation-neonate","label":"Assist endotracheal intubation – neonate"},{"id":"neonatal-nursing__endotracheal-suction-open-method","label":"Endotracheal suction – open method"},{"id":"neonatal-nursing__endotracheal-suction-closed-method","label":"Endotracheal suction – closed method"},{"id":"neonatal-nursing__extubation-of-neonate","label":"Extubation of neonate"},{"id":"neonatal-nursing__assist-lumbar-puncture-neonate","label":"Assist lumbar puncture – neonate"},{"id":"neonatal-nursing__neonatal-blood-transfusion","label":"Neonatal blood transfusion"},{"id":"neonatal-nursing__assist-chest-tube-placement-neonate","label":"Assist chest tube placement – neonate"},{"id":"neonatal-nursing__care-of-neonate-with-chest-tube","label":"Care of neonate with chest tube"},{"id":"neonatal-nursing__preparation-for-rop-screening","label":"Preparation for ROP screening"}]},{"label":"Optional Procedures (9)","items":[{"id":"neonatal-nursing__use-of-transcutaneous-bilirubinometer","label":"Use of transcutaneous bilirubinometer"},{"id":"neonatal-nursing__use-of-transcutaneous-carbon-dioxide-monitor","label":"Use of transcutaneous carbon dioxide monitor"},{"id":"neonatal-nursing__setting-up-high-frequency-ventilator","label":"Setting up high frequency ventilator"},{"id":"neonatal-nursing__care-of-neonate-on-high-frequency-ventilation","label":"Care of neonate on high frequency ventilation"},{"id":"neonatal-nursing__care-of-neonate-on-inhaled-nitric-oxide","label":"Care of neonate on inhaled nitric oxide"},{"id":"neonatal-nursing__care-of-newborn-undergoing-hypothermia-therapy","label":"Care of newborn undergoing hypothermia therapy"},{"id":"neonatal-nursing__neonatal-stoma-care","label":"Neonatal stoma care"},{"id":"neonatal-nursing__care-of-neonate-with-tracheostomy","label":"Care of neonate with tracheostomy"},{"id":"neonatal-nursing__newborn-hearing-screening","label":"Newborn hearing screening"}]}],"applicableRole":"nurses"},{"id":"cardiovascular-perfusion","name":"Cardiovascular Perfusion","summary":"Perfusionist procedures for cardiac bypass and circulatory support.","groups":[{"label":"Core Procedures (3)","items":[{"id":"cardiovascular-perfusion__conduct-cardiopulmonary-bypass-for-cabg-valve-adult-congenital-surgery","label":"Conduct cardiopulmonary bypass for CABG / valve / adult congenital surgery"},{"id":"cardiovascular-perfusion__set-up-intra-aortic-balloon-pump","label":"Set-up intra-aortic balloon pump"},{"id":"cardiovascular-perfusion__perform-intraoperative-red-cell-salvage-with-cell-saver","label":"Perform intraoperative red cell salvage with cell saver"}]},{"label":"Optional Procedures (3)","items":[{"id":"cardiovascular-perfusion__conduct-cpb-using-centrifugal-pump","label":"Conduct CPB using centrifugal pump"},{"id":"cardiovascular-perfusion__conduct-cpb-using-vacuum-assisted-venous-drainage-vavd","label":"Conduct CPB using vacuum assisted venous drainage (VAVD)"},{"id":"cardiovascular-perfusion__conduct-cpb-for-thoracic-aortic-surgery","label":"Conduct CPB for thoracic aortic surgery"},{"id":"cardiovascular-perfusion__perform-ultrafiltration-during-cpb","label":"Perform ultrafiltration during CPB"}]},{"label":"Specialized Procedures (2)","items":[{"id":"cardiovascular-perfusion__extracorporeal-membrane-oxygenation-ecmo","label":"Extracorporeal membrane oxygenation (ECMO)"},{"id":"cardiovascular-perfusion__neonatal-and-paediatric-perfusion-support","label":"Neonatal and paediatric perfusion support"}]}],"applicableRole":"amos"},{"id":"amo-anaesthesia","name":"Anaesthesia (Assistant Medical Officers)","summary":"Anaesthetic clinical procedures and nerve blocks performed by assistant medical officers.","groups":[{"label":"Core Procedures (21)","items":[{"id":"amo-anaesthesia__cleaning-and-sterilization-of-anaesthetic-equipment","label":"Cleaning and sterilization of anaesthetic equipment"},{"id":"amo-anaesthesia__decontamination-of-anaesthetic-machine","label":"Decontamination of anaesthetic machine"},{"id":"amo-anaesthesia__decontamination-of-anaesthetic-monitors","label":"Decontamination of anaesthetic monitors"},{"id":"amo-anaesthesia__anaesthetic-machine-pre-use-check","label":"Anaesthetic machine pre-use check"},{"id":"amo-anaesthesia__pre-anaesthetic-assessment","label":"Pre-anaesthetic assessment"},{"id":"amo-anaesthesia__final-assessment-in-operating-theatre","label":"Final assessment in operating theatre"},{"id":"amo-anaesthesia__preparation-of-anaesthetic-machine-and-equipment","label":"Preparation of anaesthetic machine and equipment"},{"id":"amo-anaesthesia__preparation-of-anaesthetic-drugs","label":"Preparation of anaesthetic drugs"},{"id":"amo-anaesthesia__preparation-of-patient-for-anaesthesia","label":"Preparation of patient for anaesthesia"},{"id":"amo-anaesthesia__induction-of-anaesthesia","label":"Induction of anaesthesia"},{"id":"amo-anaesthesia__endotracheal-intubation","label":"Endotracheal intubation"},{"id":"amo-anaesthesia__rapid-sequence-induction","label":"Rapid sequence induction"},{"id":"amo-anaesthesia__expected-difficult-intubation-drill","label":"Expected difficult intubation drill"},{"id":"amo-anaesthesia__failed-intubation-drill","label":"Failed intubation drill"},{"id":"amo-anaesthesia__extubation-procedure","label":"Extubation procedure"},{"id":"amo-anaesthesia__administration-of-general-anaesthesia-with-ippv","label":"Administration of general anaesthesia with IPPV"},{"id":"amo-anaesthesia__general-anaesthesia-spontaneous-with-mask","label":"General anaesthesia (spontaneous) with mask"},{"id":"amo-anaesthesia__general-anaesthesia-spontaneous-with-supraglottic-airway","label":"General anaesthesia (spontaneous) with supraglottic airway"},{"id":"amo-anaesthesia__administration-of-total-intravenous-anaesthesia-tiva","label":"Administration of total intravenous anaesthesia (TIVA)"},{"id":"amo-anaesthesia__spinal-anaesthesia-administration","label":"Spinal anaesthesia administration"},{"id":"amo-anaesthesia__monitored-sedation-technique","label":"Monitored sedation technique"},{"id":"amo-anaesthesia__post-anaesthesia-care","label":"Post anaesthesia care"}]},{"label":"Optional Procedures (8)","items":[{"id":"amo-anaesthesia__administration-of-anaesthesia-for-electroconvulsive-therapy-ect","label":"Administration of anaesthesia for electroconvulsive therapy (ECT)"},{"id":"amo-anaesthesia__caudal-block","label":"Caudal block"},{"id":"amo-anaesthesia__brachial-plexus-block-supraclavicular-approach","label":"Brachial plexus block – supraclavicular approach"},{"id":"amo-anaesthesia__brachial-plexus-block-axillary-approach","label":"Brachial plexus block – axillary approach"},{"id":"amo-anaesthesia__wrist-block","label":"Wrist block"},{"id":"amo-anaesthesia__femoral-nerve-block-anterior-approach","label":"Femoral nerve block – anterior approach"},{"id":"amo-anaesthesia__sciatic-nerve-block-posterior-approach","label":"Sciatic nerve block – posterior approach"},{"id":"amo-anaesthesia__ankle-block","label":"Ankle block"}]}],"applicableRole":"amos"},{"id":"amo-peri-anaesthesia","name":"Peri-Anaesthesia (Assistant Medical Officers)","summary":"Peri-anaesthetic airway and monitoring procedures performed by AMOs.","groups":[{"label":"Core Procedures (50)","items":[{"id":"amo-peri-anaesthesia__assemble-and-disassemble-laryngoscope","label":"Assemble and disassemble laryngoscope"},{"id":"amo-peri-anaesthesia__prepare-and-handle-video-assisted-laryngoscope","label":"Prepare and handle video assisted laryngoscope"},{"id":"amo-peri-anaesthesia__cleaning-decontamination-and-sterilization-of-breathing-system","label":"Cleaning, decontamination and sterilization of breathing system"},{"id":"amo-peri-anaesthesia__preparation-for-intubation","label":"Preparation for intubation"},{"id":"amo-peri-anaesthesia__application-of-cricoid-pressure","label":"Application of cricoid pressure"},{"id":"amo-peri-anaesthesia__preparation-of-supraglottic-airway-adjuncts","label":"Preparation of supraglottic airway adjuncts"},{"id":"amo-peri-anaesthesia__preparation-of-difficult-airway-adjuncts","label":"Preparation of difficult airway adjuncts"},{"id":"amo-peri-anaesthesia__perform-endotracheal-intubation","label":"Perform endotracheal intubation"},{"id":"amo-peri-anaesthesia__perform-endotracheal-extubation","label":"Perform endotracheal extubation"},{"id":"amo-peri-anaesthesia__perform-supraglottic-airway-insertion","label":"Perform supraglottic airway insertion"},{"id":"amo-peri-anaesthesia__perform-supraglottic-airway-extubation","label":"Perform supraglottic airway extubation"},{"id":"amo-peri-anaesthesia__checking-and-calibrating-anaesthetic-machine","label":"Checking and calibrating anaesthetic machine"},{"id":"amo-peri-anaesthesia__identify-and-troubleshoot-anaesthetic-machine","label":"Identify and troubleshoot anaesthetic machine"},{"id":"amo-peri-anaesthesia__identify-and-troubleshoot-monitors","label":"Identify and troubleshoot monitors"},{"id":"amo-peri-anaesthesia__refilling-vaporizers","label":"Refilling vaporizers"},{"id":"amo-peri-anaesthesia__emptying-vaporizers","label":"Emptying vaporizers"},{"id":"amo-peri-anaesthesia__assemble-anaesthesia-breathing-circuit","label":"Assemble anaesthesia breathing circuit"},{"id":"amo-peri-anaesthesia__assemble-ayre-s-t-piece-breathing-circuit","label":"Assemble Ayre's T-piece breathing circuit"},{"id":"amo-peri-anaesthesia__rapid-sequence-induction-protocol","label":"Rapid sequence induction protocol"},{"id":"amo-peri-anaesthesia__assemble-passive-humidification-system","label":"Assemble passive humidification system"},{"id":"amo-peri-anaesthesia__prepare-anaesthetic-nebulization","label":"Prepare anaesthetic nebulization"},{"id":"amo-peri-anaesthesia__replenish-anaesthesia-resuscitation-trolley","label":"Replenish anaesthesia resuscitation trolley"},{"id":"amo-peri-anaesthesia__replenish-difficult-intubation-trolley","label":"Replenish difficult intubation trolley"},{"id":"amo-peri-anaesthesia__handling-of-pca-pump","label":"Handling of PCA pump"},{"id":"amo-peri-anaesthesia__care-of-patient-during-various-operative-positions","label":"Care of patient during various operative positions"},{"id":"amo-peri-anaesthesia__care-of-patient-on-pneumatic-tourniquet","label":"Care of patient on pneumatic tourniquet"},{"id":"amo-peri-anaesthesia__preparation-and-care-for-spinal-anaesthesia","label":"Preparation and care for spinal anaesthesia"},{"id":"amo-peri-anaesthesia__preparation-and-care-for-epidural-anaesthesia","label":"Preparation and care for epidural anaesthesia"},{"id":"amo-peri-anaesthesia__apply-pulse-oximeter-and-clinical-interpretation","label":"Apply pulse oximeter and clinical interpretation"},{"id":"amo-peri-anaesthesia__apply-capnometer-and-clinical-interpretation","label":"Apply capnometer and clinical interpretation"},{"id":"amo-peri-anaesthesia__core-temperature-probe-insertion","label":"Core temperature probe insertion"},{"id":"amo-peri-anaesthesia__preparation-of-pressure-transducer-system","label":"Preparation of pressure transducer system"},{"id":"amo-peri-anaesthesia__preparation-of-central-venous-pressure-system","label":"Preparation of central venous pressure system"},{"id":"amo-peri-anaesthesia__care-of-patient-with-arterial-line","label":"Care of patient with arterial line"},{"id":"amo-peri-anaesthesia__care-of-patient-with-central-venous-line","label":"Care of patient with central venous line"},{"id":"amo-peri-anaesthesia__assemble-oxygen-therapy-devices","label":"Assemble oxygen therapy devices"},{"id":"amo-peri-anaesthesia__prepare-and-assist-peripheral-nerve-block","label":"Prepare and assist peripheral nerve block"},{"id":"amo-peri-anaesthesia__assemble-intraoperative-warming-devices","label":"Assemble intraoperative warming devices"},{"id":"amo-peri-anaesthesia__assemble-blood-warming-devices","label":"Assemble blood warming devices"},{"id":"amo-peri-anaesthesia__transportation-of-critically-ill-patient","label":"Transportation of critically ill patient"},{"id":"amo-peri-anaesthesia__assemble-set-and-troubleshoot-ventilators","label":"Assemble, set and troubleshoot ventilators"},{"id":"amo-peri-anaesthesia__preoperative-assessment-amo-role","label":"Preoperative assessment (AMO role)"},{"id":"amo-peri-anaesthesia__assist-in-difficult-intubation-drill","label":"Assist in difficult intubation drill"},{"id":"amo-peri-anaesthesia__care-of-patient-in-recovery-area","label":"Care of patient in recovery area"},{"id":"amo-peri-anaesthesia__check-level-of-regional-anaesthesia","label":"Check level of regional anaesthesia"},{"id":"amo-peri-anaesthesia__assess-bromage-score","label":"Assess Bromage score"},{"id":"amo-peri-anaesthesia__assess-sedation-scale","label":"Assess sedation scale"},{"id":"amo-peri-anaesthesia__assess-recovery-score","label":"Assess recovery score"},{"id":"amo-peri-anaesthesia__assess-pain-score","label":"Assess pain score"},{"id":"amo-peri-anaesthesia__prepare-and-assist-flexible-fibreoptic-intubation","label":"Prepare and assist flexible fibreoptic intubation"},{"id":"amo-peri-anaesthesia__prepare-and-assist-awake-fibreoptic-intubation","label":"Prepare and assist awake fibreoptic intubation"}]},{"label":"Optional Procedures (14)","items":[{"id":"amo-peri-anaesthesia__handle-and-assist-in-tiva-tci-procedure","label":"Handle and assist in TIVA / TCI procedure"},{"id":"amo-peri-anaesthesia__prepare-and-assist-non-invasive-cardiac-output-monitoring","label":"Prepare and assist non-invasive cardiac output monitoring"},{"id":"amo-peri-anaesthesia__care-of-patient-in-combined-spinal-epidural-block","label":"Care of patient in combined spinal epidural block"},{"id":"amo-peri-anaesthesia__prepare-and-assist-invasive-cardiac-output-monitoring","label":"Prepare and assist invasive cardiac output monitoring"},{"id":"amo-peri-anaesthesia__assemble-rapid-infusion-device","label":"Assemble rapid infusion device"},{"id":"amo-peri-anaesthesia__prepare-and-assist-one-lung-ventilation","label":"Prepare and assist one-lung ventilation"},{"id":"amo-peri-anaesthesia__assemble-and-calibrate-icp-monitoring","label":"Assemble and calibrate ICP monitoring"},{"id":"amo-peri-anaesthesia__assist-autologous-blood-transfusion","label":"Assist autologous blood transfusion"},{"id":"amo-peri-anaesthesia__assemble-jet-ventilation","label":"Assemble jet ventilation"},{"id":"amo-peri-anaesthesia__prepare-and-assist-cricothyrotomy","label":"Prepare and assist cricothyrotomy"},{"id":"amo-peri-anaesthesia__prepare-and-assist-needle-cricothyrotomy","label":"Prepare and assist needle cricothyrotomy"},{"id":"amo-peri-anaesthesia__application-of-peripheral-nerve-stimulator","label":"Application of peripheral nerve stimulator"},{"id":"amo-peri-anaesthesia__assemble-bis-monitoring","label":"Assemble BIS monitoring"},{"id":"amo-peri-anaesthesia__care-of-ultrasound-guidance-equipment","label":"Care of ultrasound guidance equipment"}]}],"applicableRole":"amos"}].reduce(
    (acc, cat) => acc + cat.groups.reduce((gAcc, g) => gAcc + g.items.length, 0),
    0
  );
};

/**
 * Summary totals for dashboard
 */
export const CATALOG_METRICS = {
  totalCategories: ALL_PROCEDURE_CATEGORIES.length,
  commonCategoriesCount: COMMON_CATEGORIES.length,
  nursesCategoriesCount: NURSES_ONLY_CATEGORIES.length,
  amoCategoriesCount: AMO_ONLY_CATEGORIES.length,
  totalProcedures: calcTotalProcedures()
};
