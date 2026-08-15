/**
 * Automatic Drug Therapeutic & MOH Prescriber Categorizer
 * Implements WHO ATC classification & FUKKM (Formulari Ubat KKM) Prescriber Categories (A*, A, A/KK, B, C).
 */

export function getDrugTherapeuticCategory(drug: {
  drug_name?: string
  generic_name?: string
  nameFull?: string
  category_name?: string
  category_id?: string
  item_sub_class?: string
  category?: { category_name?: string; name?: string }
}): string {
  const nameToTest = [
    drug.drug_name,
    drug.generic_name,
    drug.nameFull,
    drug.item_sub_class
  ].filter(Boolean).join(' ').toLowerCase()

  if (!nameToTest) {
    return drug.category_name || drug.category?.category_name || drug.category?.name || 'General'
  }

  // 1. Antidote & Mucolytic
  if (/acetylcysteine|\bnac\b|naloxone|atropine|charcoal|pralidoxime|flumazenil|digoxin immune|protamine|sugammadex|deferoxamine|physostigmine|fomepizole/i.test(nameToTest)) {
    return 'Antidote'
  }

  // 2. Antibiotic & Antimicrobial
  if (/amoxicillin|ampicillin|clavulanate|sulbactam|piperacillin|tazobactam|cloxacillin|penicillin|ceftriaxone|cefuroxime|ceftazidime|cefazolin|cephalexin|cefotaxime|cefepime|azithromycin|clarithromycin|erythromycin|ciprofloxacin|levofloxacin|moxifloxacin|gentamicin|amikacin|vancomycin|teicoplanin|meropenem|ertapenem|imipenem|metronidazole|doxycycline|tetracycline|co-trimoxazole|trimethoprim|fusidic|antibiotic/i.test(nameToTest)) {
    return 'Antibiotic'
  }

  // 3. Antihypertensive & BPH / Cardiovascular
  if (/alfuzosin|tamsulosin|doxazosin|terazosin|amlodipine|felodipine|nifedipine|atenolol|bisoprolol|metoprolol|carvedilol|labetalol|propranolol|enalapril|captopril|ramipril|perindopril|losartan|valsartan|candesartan|irbesartan|telmisartan|hydrochlorothiazide|indapamide|frusemide|furosemide|spironolactone|methyldopa|hydralazine|verapamil|diltiazem|antihypertensive/i.test(nameToTest)) {
    return 'Antihypertensive'
  }

  // 4. Antipsychotic / Psychotropic
  if (/amisulpride|aripiprazole|chlorpromazine|haloperidol|olanzapine|quetiapine|risperidone|clozapine|sulpiride|fluphenazine|zuclopenthixol|trifluoperazine|paliperidone|ziprasidone|antipsychotic/i.test(nameToTest)) {
    return 'Antipsychotic'
  }

  // 5. Antiemetic & GI Agent
  if (/metoclopramide|ondansetron|domperidone|granisetron|prochlorperazine|omeprazole|pantoprazole|esomeprazole|rabeprazole|lansoprazole|ranitidine|famotidine|hyoscine|dicyclomine|loperamide|lactulose|smecta|gaviscon|macrogol|antiemetic/i.test(nameToTest)) {
    return 'Antiemetic'
  }

  // 6. Antidiabetic
  if (/metformin|gliclazide|glimepiride|glibenclamide|insulin|aspart|glargine|detemir|lispro|linagliptin|sitagliptin|vildagliptin|empagliflozin|dapagliflozin|canagliflozin|pioglitazone|acarbose|exenatide|liraglutide|semaglutide|antidiabetic/i.test(nameToTest)) {
    return 'Antidiabetic'
  }

  // 7. Analgesic & Anti-inflammatory / Antiplatelet
  if (/acetylsalicylic|aspirin|paracetamol|acetaminophen|ibuprofen|diclofenac|celecoxib|meloxicam|ketoprofen|naproxen|mefenamic|tramadol|morphine|fentanyl|oxycodone|pethidine|methadone|buprenorphine|etoricoxib|indomethacin|piroxicam|analgesic/i.test(nameToTest)) {
    return 'Analgesic'
  }

  // 8. Ophthalmic / Eye Care
  if (/artificial tears|eye lubricant|ophthalmic|timolol|latanoprost|bimatoprost|travoprost|brimonidine|chloramphenicol eye|tobramycin eye|hypromellose|carboxymethylcellulose/i.test(nameToTest)) {
    return 'Ophthalmic'
  }

  // 9. Anticonvulsant / Antiepileptic
  if (/valproate|valproic|carbamazepine|phenytoin|phenobarbital|levetiracetam|gabapentin|pregabalin|lamotrigine|topiramate|clonazepam|clobazam|oxcarbazepine|anticonvulsant/i.test(nameToTest)) {
    return 'Anticonvulsant'
  }

  // 10. Antihistamine & Respiratory
  if (/cetirizine|loratadine|fexofenadine|chlorpheniramine|promethazine|desloratadine|salbutamol|albuterol|ipratropium|tiotropium|budesonide|fluticasone|beclomethasone|montelukast|theophylline|terbutaline|aminophylline|antihistamine/i.test(nameToTest)) {
    return 'Antihistamine'
  }

  // 11. Anticoagulant & Antiplatelet
  if (/warfarin|heparin|enoxaparin|fondaparinux|clopidogrel|ticagrelor|rivaroxaban|apixaban|dabigatran|streptokinase|alteplase|anticoagulant/i.test(nameToTest)) {
    return 'Anticoagulant'
  }

  // 12. Corticosteroid
  if (/dexamethasone|hydrocortisone|prednisolone|methylprednisolone|triamcinolone|betamethasone|cyclosporine|tacrolimus|azathioprine|methotrexate|corticosteroid/i.test(nameToTest)) {
    return 'Corticosteroid'
  }

  // 13. Antihyperlipidemic
  if (/simvastatin|atorvastatin|rosuvastatin|pravastatin|fenofibrate|gemfibrozil|ezetimibe|statin/i.test(nameToTest)) {
    return 'Antihyperlipidemic'
  }

  // 14. Anesthetic & Muscle Relaxant
  if (/lignocaine|lidocaine|bupivacaine|ropivacaine|propofol|etomidate|ketamine|suxamethonium|succinylcholine|atracurium|rocuronium|cisatracurium|neostigmine|anesthetic/i.test(nameToTest)) {
    return 'Anesthetic'
  }

  // 15. Antifungal & Antiviral
  if (/fluconazole|ketoconazole|itraconazole|voriconazole|amphotericin|nystatin|clotrimazole|acyclovir|valacyclovir|oseltamivir|favipiravir|remdesivir|ritonavir|antifungal|antiviral/i.test(nameToTest)) {
    return 'Antifungal / Antiviral'
  }

  // 16. Supplement & Electrolyte
  if (/calcium|ferrous|iron|folic acid|vitamin|ascorbic|thiamine|pyridoxine|cyanocobalamin|potassium chloride|sodium chloride|multivitamin|cholecalciferol|calcitriol/i.test(nameToTest)) {
    return 'Supplement'
  }

  // Fallback to category object or General
  const rawCat = drug.category_name || drug.category?.category_name || drug.category?.name
  return (rawCat && rawCat !== 'General Drugs') ? rawCat : 'General'
}

/**
 * FUKKM Prescriber Category Resolver (A*, A, A/KK, B, C)
 */
export function getDrugPrescriberCategory(drug: {
  drug_name?: string
  generic_name?: string
  nameFull?: string
  prescriber_category?: string
  kkm_category?: string
  category_code?: string
}): string {
  if (drug.prescriber_category) return drug.prescriber_category
  if (drug.kkm_category) return drug.kkm_category

  const nameToTest = [
    drug.drug_name,
    drug.generic_name,
    drug.nameFull
  ].filter(Boolean).join(' ').toLowerCase()

  // 1. Category A* (Consultant/Specialist for specific restricted indications)
  if (/acetylcysteine|amisulpride 400mg|aripiprazole|clozapine|sugammadex|meropenem|vancomycin|teicoplanin|tazobactam|voriconazole|paliperidone|botulinum/i.test(nameToTest)) {
    return 'A*'
  }

  // 2. Category A (Consultant / Specialist initiated)
  if (/amisulpride|olanzapine|quetiapine|risperidone|ondansetron|levetiracetam|pantoprazole|esomeprazole|triamcinolone|enoxaparin|rivaroxaban|apixaban|dabigatran|tacrolimus|cyclosporine/i.test(nameToTest)) {
    return 'A'
  }

  // 3. Category A/KK (Specialist & Family Physician Specialist in Klinik Kesihatan)
  if (/alfuzosin|tamsulosin|linagliptin|sitagliptin|vildagliptin|empagliflozin|dapagliflozin|rosuvastatin|insulin glargine|insulin aspart|budesonide|fluticasone|montelukast|telmisartan|valsartan/i.test(nameToTest)) {
    return 'A/KK'
  }

  // 4. Category B (Medical Officer / MO)
  if (/amoxicillin.*clavulanate|ampicillin.*sulbactam|ceftriaxone|cefuroxime|ciprofloxacin|levofloxacin|metronidazole|doxycycline|gentamicin|cloxacillin|simvastatin|atorvastatin|amlodipine|atenolol|bisoprolol|metoprolol|enalapril|losartan|metformin|gliclazide|glimepiride|omeprazole|ranitidine|tramadol|dexamethasone|prednisolone|hydrocortisone|frusemide|furosemide|spironolactone|diclofenac|celecoxib|mefenamic/i.test(nameToTest)) {
    return 'B'
  }

  // 5. Category C (Paramedic / AMO / Nurse)
  if (/amoxicillin|ampicillin|acetylsalicylic|aspirin|paracetamol|acetaminophen|ibuprofen|cetirizine|loratadine|chlorpheniramine|salbutamol|artificial tears|eye lubricant|antacid|gaviscon|calamine|lactulose|charcoal|folic acid|ferrous|calcium|multivitamin|vitamin/i.test(nameToTest)) {
    return 'C'
  }

  return 'B'
}

/**
 * Combined Category formatted as: [Therapeutic Category] / [Prescriber Category]
 * Example: "Antibiotic / C", "Antidote / A*"
 */
export function getDrugCombinedCategory(drug: any): string {
  const therapeutic = getDrugTherapeuticCategory(drug)
  const prescriber = getDrugPrescriberCategory(drug)
  return `${therapeutic} / ${prescriber}`
}
