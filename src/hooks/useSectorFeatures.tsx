import { useMemo } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { getSectorConfiguration, getSectorFeatures, getSectorProductCategories, SectorConfiguration, SectorFeature, ProductCategory } from '@/config/sectorConfigurations';

interface UseSectorFeaturesReturn {
  sectorConfig: SectorConfiguration;
  features: SectorFeature[];
  productCategories: ProductCategory[];
  hasFeature: (featureId: string) => boolean;
  getDashboardMetrics: () => string[];
  getWorkflows: () => string[];
  getReportTypes: () => string[];
  getRequiredFields: () => string[];
  getCustomFields: () => Array<{ name: string; type: string; options?: string[] }>;
  isSectorSpecific: boolean;
}

export function useSectorFeatures(): UseSectorFeaturesReturn {
  const { currentOrganization } = useOrganization();
  
  const sectorId = currentOrganization?.business_sector || 'other';
  
  const sectorConfig = useMemo(() => getSectorConfiguration(sectorId), [sectorId]);
  const features = useMemo(() => getSectorFeatures(sectorId), [sectorId]);
  const productCategories = useMemo(() => getSectorProductCategories(sectorId), [sectorId]);
  
  const hasFeature = (featureId: string): boolean => {
    return features.some(feature => feature.id === featureId);
  };
  
  const getDashboardMetrics = (): string[] => {
    return sectorConfig.dashboardMetrics;
  };
  
  const getWorkflows = (): string[] => {
    return sectorConfig.workflows;
  };
  
  const getReportTypes = (): string[] => {
    return sectorConfig.reportTypes;
  };
  
  const getRequiredFields = (): string[] => {
    return sectorConfig.requiredFields;
  };
  
  const getCustomFields = (): Array<{ name: string; type: string; options?: string[] }> => {
    return sectorConfig.customFields;
  };
  
  const isSectorSpecific = sectorId !== 'other';
  
  return {
    sectorConfig,
    features,
    productCategories,
    hasFeature,
    getDashboardMetrics,
    getWorkflows,
    getReportTypes,
    getRequiredFields,
    getCustomFields,
    isSectorSpecific
  };
}