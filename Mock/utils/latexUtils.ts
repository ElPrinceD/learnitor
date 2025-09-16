// Utility functions for LaTeX and chemical formula handling

export interface ChemicalFormula {
  formula: string;
  latex: string;
  name?: string;
}

// Common chemical formulas database
export const CHEMICAL_FORMULAS: ChemicalFormula[] = [
  // Water and common molecules
  { formula: 'H2O', latex: 'H_2O', name: 'Water' },
  { formula: 'CO2', latex: 'CO_2', name: 'Carbon Dioxide' },
  { formula: 'CH4', latex: 'CH_4', name: 'Methane' },
  { formula: 'NH3', latex: 'NH_3', name: 'Ammonia' },
  { formula: 'O2', latex: 'O_2', name: 'Oxygen' },
  { formula: 'N2', latex: 'N_2', name: 'Nitrogen' },
  { formula: 'H2', latex: 'H_2', name: 'Hydrogen' },
  { formula: 'Cl2', latex: 'Cl_2', name: 'Chlorine' },
  { formula: 'Br2', latex: 'Br_2', name: 'Bromine' },
  { formula: 'I2', latex: 'I_2', name: 'Iodine' },
  { formula: 'F2', latex: 'F_2', name: 'Fluorine' },
  
  // Acids
  { formula: 'H2SO4', latex: 'H_2SO_4', name: 'Sulfuric Acid' },
  { formula: 'HNO3', latex: 'HNO_3', name: 'Nitric Acid' },
  { formula: 'HCl', latex: 'HCl', name: 'Hydrochloric Acid' },
  { formula: 'HBr', latex: 'HBr', name: 'Hydrobromic Acid' },
  { formula: 'HI', latex: 'HI', name: 'Hydroiodic Acid' },
  { formula: 'HF', latex: 'HF', name: 'Hydrofluoric Acid' },
  { formula: 'H3PO4', latex: 'H_3PO_4', name: 'Phosphoric Acid' },
  { formula: 'CH3COOH', latex: 'CH_3COOH', name: 'Acetic Acid' },
  
  // Bases
  { formula: 'NaOH', latex: 'NaOH', name: 'Sodium Hydroxide' },
  { formula: 'KOH', latex: 'KOH', name: 'Potassium Hydroxide' },
  { formula: 'Ca(OH)2', latex: 'Ca(OH)_2', name: 'Calcium Hydroxide' },
  { formula: 'Mg(OH)2', latex: 'Mg(OH)_2', name: 'Magnesium Hydroxide' },
  { formula: 'Al(OH)3', latex: 'Al(OH)_3', name: 'Aluminum Hydroxide' },
  
  // Salts
  { formula: 'NaCl', latex: 'NaCl', name: 'Sodium Chloride' },
  { formula: 'KCl', latex: 'KCl', name: 'Potassium Chloride' },
  { formula: 'CaCl2', latex: 'CaCl_2', name: 'Calcium Chloride' },
  { formula: 'MgCl2', latex: 'MgCl_2', name: 'Magnesium Chloride' },
  { formula: 'AlCl3', latex: 'AlCl_3', name: 'Aluminum Chloride' },
  { formula: 'Na2SO4', latex: 'Na_2SO_4', name: 'Sodium Sulfate' },
  { formula: 'KNO3', latex: 'KNO_3', name: 'Potassium Nitrate' },
  { formula: 'CaCO3', latex: 'CaCO_3', name: 'Calcium Carbonate' },
  { formula: 'MgSO4', latex: 'MgSO_4', name: 'Magnesium Sulfate' },
  
  // Organic compounds
  { formula: 'C6H12O6', latex: 'C_6H_{12}O_6', name: 'Glucose' },
  { formula: 'C2H5OH', latex: 'C_2H_5OH', name: 'Ethanol' },
  { formula: 'CH3OH', latex: 'CH_3OH', name: 'Methanol' },
  { formula: 'C2H4', latex: 'C_2H_4', name: 'Ethylene' },
  { formula: 'C2H2', latex: 'C_2H_2', name: 'Acetylene' },
  { formula: 'C6H6', latex: 'C_6H_6', name: 'Benzene' },
  { formula: 'C8H18', latex: 'C_8H_{18}', name: 'Octane' },
  
  // Ions
  { formula: 'SO4^2-', latex: 'SO_4^{2-}', name: 'Sulfate Ion' },
  { formula: 'NO3^-', latex: 'NO_3^-', name: 'Nitrate Ion' },
  { formula: 'CO3^2-', latex: 'CO_3^{2-}', name: 'Carbonate Ion' },
  { formula: 'PO4^3-', latex: 'PO_4^{3-}', name: 'Phosphate Ion' },
  { formula: 'OH^-', latex: 'OH^-', name: 'Hydroxide Ion' },
  { formula: 'NH4^+', latex: 'NH_4^+', name: 'Ammonium Ion' },
  { formula: 'H3O^+', latex: 'H_3O^+', name: 'Hydronium Ion' },
  { formula: 'Na^+', latex: 'Na^+', name: 'Sodium Ion' },
  { formula: 'K^+', latex: 'K^+', name: 'Potassium Ion' },
  { formula: 'Ca^2+', latex: 'Ca^{2+}', name: 'Calcium Ion' },
  { formula: 'Mg^2+', latex: 'Mg^{2+}', name: 'Magnesium Ion' },
  { formula: 'Al^3+', latex: 'Al^{3+}', name: 'Aluminum Ion' },
  { formula: 'Fe^2+', latex: 'Fe^{2+}', name: 'Iron(II) Ion' },
  { formula: 'Fe^3+', latex: 'Fe^{3+}', name: 'Iron(III) Ion' },
  { formula: 'Cu^2+', latex: 'Cu^{2+}', name: 'Copper(II) Ion' },
  { formula: 'Zn^2+', latex: 'Zn^{2+}', name: 'Zinc Ion' },
];

/**
 * Detects if a text string contains LaTeX or chemical formulas
 */
export const containsLatex = (text: string): boolean => {
  if (!text) return false;
  
  // Check for LaTeX delimiters
  if (text.includes('$') || text.includes('\\(') || text.includes('\\[')) {
    return true;
  }
  
  // Check for chemical formula patterns
  const chemicalPattern = /[A-Z][a-z]?\d+|[A-Z][a-z]?\^[+-]?\d*|\([^)]+\)\d+/;
  return chemicalPattern.test(text);
};

/**
 * Converts chemical formulas to proper LaTeX format
 */
export const convertChemicalFormula = (text: string): string => {
  let convertedText = text;
  
  // Replace known chemical formulas
  CHEMICAL_FORMULAS.forEach(({ formula, latex }) => {
    const regex = new RegExp(`\\b${formula.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    convertedText = convertedText.replace(regex, `$${latex}$`);
  });
  
  // Handle general chemical formula patterns
  // Pattern for molecules like H2O, CO2, etc.
  convertedText = convertedText.replace(/([A-Z][a-z]?)(\d+)/g, '$1_$2');
  
  // Pattern for ions with charges
  convertedText = convertedText.replace(/([A-Z][a-z]?)(\d*)\^([+-]?\d*)/g, '$1_$2^{$3}');
  
  // Pattern for parentheses with subscripts
  convertedText = convertedText.replace(/\(([^)]+)\)(\d+)/g, '($1)_$2');
  
  return convertedText;
};

/**
 * Processes text to convert chemical formulas to LaTeX
 */
export const processTextForLatex = (text: string): string => {
  if (containsLatex(text)) {
    return convertChemicalFormula(text);
  }
  return text;
};

/**
 * Finds chemical formulas in text and returns them with their LaTeX equivalents
 */
export const findChemicalFormulas = (text: string): ChemicalFormula[] => {
  const foundFormulas: ChemicalFormula[] = [];
  
  CHEMICAL_FORMULAS.forEach(({ formula, latex, name }) => {
    if (text.includes(formula)) {
      foundFormulas.push({ formula, latex, name });
    }
  });
  
  return foundFormulas;
};

/**
 * Validates if a chemical formula is properly formatted
 */
export const isValidChemicalFormula = (formula: string): boolean => {
  // Basic validation for chemical formulas
  const pattern = /^[A-Z][a-z]?(\d+)?(\^[+-]?\d+)?([A-Z][a-z]?(\d+)?(\^[+-]?\d+)?)*$/;
  return pattern.test(formula);
};
