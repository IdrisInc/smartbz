// Tanzania Payroll Calculator
// Compliant with TRA, NSSF, WCF, SDL regulations

export interface PayrollInput {
  basicSalary: number;
  housingAllowance?: number;
  transportAllowance?: number;
  otherAllowances?: number;
  otherDeductions?: number;
  totalEmployees?: number; // For SDL calculation
}

export interface PayrollResult {
  // Earnings
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  grossSalary: number;
  
  // Employee Deductions
  nssfEmployee: number;
  taxableIncome: number;
  paye: number;
  otherDeductions: number;
  totalDeductions: number;
  
  // Employer Contributions
  nssfEmployer: number;
  wcfEmployer: number;
  sdlEmployer: number;
  totalEmployerContributions: number;
  
  // Net Pay
  netSalary: number;
  
  // Tax Breakdown for audit
  payeBreakdown: {
    bracket: string;
    rate: string;
    amount: number;
  }[];
}

// PAYE Tax Brackets (Monthly) - Tanzania 2024
// These are configurable and should be stored in database
export const DEFAULT_PAYE_BRACKETS = [
  { min: 0, max: 270000, rate: 0, fixedAmount: 0 },
  { min: 270001, max: 520000, rate: 0.08, fixedAmount: 0 },
  { min: 520001, max: 760000, rate: 0.20, fixedAmount: 20000 },
  { min: 760001, max: 1040000, rate: 0.25, fixedAmount: 68000 },
  { min: 1040001, max: Infinity, rate: 0.30, fixedAmount: 128000 },
];

// Statutory Contribution Rates
export const STATUTORY_RATES = {
  NSSF_EMPLOYEE: 0.10, // 10%
  NSSF_EMPLOYER: 0.10, // 10%
  WCF_EMPLOYER: 0.005, // 0.5%
  SDL_EMPLOYER: 0.035, // 3.5% (if company has ≥10 employees)
  SDL_THRESHOLD: 10, // Minimum employees for SDL
};

/**
 * Calculate PAYE (Pay As You Earn) tax based on Tanzania tax brackets
 */
export function calculatePAYE(
  taxableIncome: number,
  brackets = DEFAULT_PAYE_BRACKETS
): { totalPaye: number; breakdown: PayrollResult['payeBreakdown'] } {
  const breakdown: PayrollResult['payeBreakdown'] = [];
  let totalPaye = 0;

  if (taxableIncome <= 0) {
    return { totalPaye: 0, breakdown: [] };
  }

  // Find the applicable bracket
  for (const bracket of brackets) {
    if (taxableIncome >= bracket.min && taxableIncome <= bracket.max) {
      if (bracket.rate === 0) {
        breakdown.push({
          bracket: `0 - 270,000 TZS`,
          rate: '0%',
          amount: 0,
        });
        totalPaye = 0;
      } else {
        const excessAmount = taxableIncome - (bracket.min - 1);
        const taxOnExcess = excessAmount * bracket.rate;
        totalPaye = bracket.fixedAmount + taxOnExcess;
        
        breakdown.push({
          bracket: `${bracket.min.toLocaleString()} - ${bracket.max === Infinity ? 'Above' : bracket.max.toLocaleString()} TZS`,
          rate: `${(bracket.rate * 100).toFixed(0)}%`,
          amount: totalPaye,
        });
      }
      break;
    }
  }

  return { totalPaye: Math.round(totalPaye), breakdown };
}

/**
 * Calculate NSSF contributions (both employee and employer)
 */
export function calculateNSSF(grossSalary: number): { employee: number; employer: number } {
  const employeeContribution = Math.round(grossSalary * STATUTORY_RATES.NSSF_EMPLOYEE);
  const employerContribution = Math.round(grossSalary * STATUTORY_RATES.NSSF_EMPLOYER);
  
  return {
    employee: employeeContribution,
    employer: employerContribution,
  };
}

/**
 * Calculate WCF (Workers Compensation Fund) - Employer only
 */
export function calculateWCF(grossSalary: number): number {
  return Math.round(grossSalary * STATUTORY_RATES.WCF_EMPLOYER);
}

/**
 * Calculate SDL (Skills Development Levy) - Employer only
 * Only applicable if company has 10 or more employees
 */
export function calculateSDL(grossSalary: number, totalEmployees: number): number {
  if (totalEmployees < STATUTORY_RATES.SDL_THRESHOLD) {
    return 0;
  }
  return Math.round(grossSalary * STATUTORY_RATES.SDL_EMPLOYER);
}

/**
 * Complete payroll calculation for a single employee
 */
export function calculatePayroll(input: PayrollInput): PayrollResult {
  const {
    basicSalary,
    housingAllowance = 0,
    transportAllowance = 0,
    otherAllowances = 0,
    otherDeductions = 0,
    totalEmployees = 10, // Default to 10 for SDL
  } = input;

  // Step 1: Calculate Gross Salary
  const grossSalary = basicSalary + housingAllowance + transportAllowance + otherAllowances;

  // Step 2: Calculate NSSF (Employee & Employer)
  const nssf = calculateNSSF(grossSalary);

  // Step 3: Calculate Taxable Income (Gross - Employee NSSF)
  const taxableIncome = grossSalary - nssf.employee;

  // Step 4: Calculate PAYE
  const { totalPaye, breakdown } = calculatePAYE(taxableIncome);

  // Step 5: Calculate Employer Contributions
  const wcfEmployer = calculateWCF(grossSalary);
  const sdlEmployer = calculateSDL(grossSalary, totalEmployees);

  // Step 6: Calculate Total Deductions
  const totalDeductions = nssf.employee + totalPaye + otherDeductions;

  // Step 7: Calculate Net Salary
  const netSalary = grossSalary - totalDeductions;

  // Step 8: Calculate Total Employer Contributions
  const totalEmployerContributions = nssf.employer + wcfEmployer + sdlEmployer;

  return {
    // Earnings
    basicSalary,
    housingAllowance,
    transportAllowance,
    otherAllowances,
    grossSalary,
    
    // Employee Deductions
    nssfEmployee: nssf.employee,
    taxableIncome,
    paye: totalPaye,
    otherDeductions,
    totalDeductions,
    
    // Employer Contributions
    nssfEmployer: nssf.employer,
    wcfEmployer,
    sdlEmployer,
    totalEmployerContributions,
    
    // Net Pay
    netSalary,
    
    // Tax Breakdown
    payeBreakdown: breakdown,
  };
}

/**
 * Format currency for display (TZS)
 */
export function formatTZS(amount: number): string {
  return new Intl.NumberFormat('sw-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Validate employee payroll data
 */
export function validatePayrollInput(input: PayrollInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (input.basicSalary < 0) {
    errors.push('Basic salary cannot be negative');
  }

  if (input.housingAllowance && input.housingAllowance < 0) {
    errors.push('Housing allowance cannot be negative');
  }

  if (input.transportAllowance && input.transportAllowance < 0) {
    errors.push('Transport allowance cannot be negative');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate payroll summary for TRA submission
 */
export function generateTRASummary(payrollResults: PayrollResult[]): {
  totalGross: number;
  totalPAYE: number;
  employeeCount: number;
} {
  return {
    totalGross: payrollResults.reduce((sum, r) => sum + r.grossSalary, 0),
    totalPAYE: payrollResults.reduce((sum, r) => sum + r.paye, 0),
    employeeCount: payrollResults.length,
  };
}

/**
 * Generate NSSF contribution report
 */
export function generateNSSFReport(payrollResults: PayrollResult[]): {
  totalEmployeeContribution: number;
  totalEmployerContribution: number;
  totalContribution: number;
  employeeCount: number;
} {
  const totalEmployee = payrollResults.reduce((sum, r) => sum + r.nssfEmployee, 0);
  const totalEmployer = payrollResults.reduce((sum, r) => sum + r.nssfEmployer, 0);
  
  return {
    totalEmployeeContribution: totalEmployee,
    totalEmployerContribution: totalEmployer,
    totalContribution: totalEmployee + totalEmployer,
    employeeCount: payrollResults.length,
  };
}
