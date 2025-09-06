export interface SectorFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  fields?: { name: string; type: 'text' | 'number' | 'date' | 'select'; options?: string[] }[];
}

export interface SectorConfiguration {
  id: string;
  name: string;
  features: SectorFeature[];
  productCategories: ProductCategory[];
  dashboardMetrics: string[];
  workflows: string[];
  reportTypes: string[];
  requiredFields: string[];
  customFields: { name: string; type: string; options?: string[] }[];
}

export const sectorConfigurations: Record<string, SectorConfiguration> = {
  retail: {
    id: 'retail',
    name: 'Retail',
    features: [
      { id: 'loyalty_programs', name: 'Customer Loyalty Programs', description: 'Manage customer points and rewards', enabled: true },
      { id: 'seasonal_inventory', name: 'Seasonal Inventory', description: 'Track seasonal product performance', enabled: true },
      { id: 'pos_integration', name: 'Advanced POS', description: 'Enhanced point of sale features', enabled: true },
      { id: 'price_management', name: 'Dynamic Pricing', description: 'Manage sales, discounts, and pricing tiers', enabled: true }
    ],
    productCategories: [
      { id: 'clothing', name: 'Clothing & Apparel', fields: [{ name: 'size', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] }, { name: 'color', type: 'text' }, { name: 'material', type: 'text' }] },
      { id: 'electronics', name: 'Electronics', fields: [{ name: 'brand', type: 'text' }, { name: 'model', type: 'text' }, { name: 'warranty_period', type: 'number' }] },
      { id: 'food_beverage', name: 'Food & Beverages', fields: [{ name: 'expiry_date', type: 'date' }, { name: 'supplier', type: 'text' }, { name: 'organic', type: 'select', options: ['Yes', 'No'] }] },
      { id: 'home_garden', name: 'Home & Garden', fields: [{ name: 'room_type', type: 'select', options: ['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Garden'] }] },
      { id: 'books_media', name: 'Books & Media', fields: [{ name: 'author_artist', type: 'text' }, { name: 'genre', type: 'text' }, { name: 'format', type: 'select', options: ['Physical', 'Digital'] }] }
    ],
    dashboardMetrics: ['Daily Sales', 'Top Products', 'Customer Traffic', 'Inventory Turnover', 'Average Transaction Value'],
    workflows: ['point_of_sale', 'inventory_reorder', 'customer_loyalty', 'seasonal_promotions'],
    reportTypes: ['sales_by_category', 'customer_analytics', 'inventory_performance', 'seasonal_trends'],
    requiredFields: ['barcode', 'retail_price', 'supplier_info'],
    customFields: [
      { name: 'seasonal_category', type: 'select', options: ['Spring', 'Summer', 'Fall', 'Winter', 'Year-round'] },
      { name: 'target_demographic', type: 'select', options: ['Children', 'Teens', 'Adults', 'Seniors', 'All Ages'] }
    ]
  },

  manufacturing: {
    id: 'manufacturing',
    name: 'Manufacturing',
    features: [
      { id: 'production_planning', name: 'Production Planning', description: 'Plan and track production schedules', enabled: true },
      { id: 'quality_control', name: 'Quality Control', description: 'Track quality metrics and inspections', enabled: true },
      { id: 'supply_chain', name: 'Supply Chain Management', description: 'Manage suppliers and raw materials', enabled: true },
      { id: 'work_orders', name: 'Work Orders', description: 'Create and track production work orders', enabled: true }
    ],
    productCategories: [
      { id: 'raw_materials', name: 'Raw Materials', fields: [{ name: 'grade', type: 'text' }, { name: 'purity', type: 'number' }, { name: 'supplier_cert', type: 'text' }] },
      { id: 'components', name: 'Components', fields: [{ name: 'specification', type: 'text' }, { name: 'tolerance', type: 'text' }, { name: 'material_type', type: 'text' }] },
      { id: 'finished_goods', name: 'Finished Goods', fields: [{ name: 'batch_number', type: 'text' }, { name: 'production_date', type: 'date' }, { name: 'quality_grade', type: 'select', options: ['A', 'B', 'C'] }] },
      { id: 'machinery', name: 'Machinery & Equipment', fields: [{ name: 'maintenance_schedule', type: 'date' }, { name: 'operating_hours', type: 'number' }, { name: 'efficiency_rating', type: 'number' }] }
    ],
    dashboardMetrics: ['Production Output', 'Quality Rate', 'Machine Efficiency', 'Raw Material Usage', 'Work Order Status'],
    workflows: ['production_order', 'quality_inspection', 'maintenance_schedule', 'supplier_management'],
    reportTypes: ['production_efficiency', 'quality_metrics', 'material_consumption', 'equipment_utilization'],
    requiredFields: ['production_cost', 'lead_time', 'quality_standards'],
    customFields: [
      { name: 'production_line', type: 'select', options: ['Line A', 'Line B', 'Line C', 'Manual'] },
      { name: 'safety_rating', type: 'select', options: ['Low Risk', 'Medium Risk', 'High Risk'] }
    ]
  },

  technology: {
    id: 'technology',
    name: 'Technology',
    features: [
      { id: 'license_management', name: 'Software License Management', description: 'Track software licenses and renewals', enabled: true },
      { id: 'project_tracking', name: 'Project Tracking', description: 'Manage development projects and milestones', enabled: true },
      { id: 'support_tickets', name: 'Support Ticketing', description: 'Handle customer support requests', enabled: true },
      { id: 'asset_management', name: 'IT Asset Management', description: 'Track hardware and software assets', enabled: true }
    ],
    productCategories: [
      { id: 'software', name: 'Software Products', fields: [{ name: 'version', type: 'text' }, { name: 'license_type', type: 'select', options: ['Individual', 'Team', 'Enterprise'] }, { name: 'platform', type: 'select', options: ['Windows', 'Mac', 'Linux', 'Web', 'Mobile'] }] },
      { id: 'hardware', name: 'Hardware Products', fields: [{ name: 'specifications', type: 'text' }, { name: 'warranty_period', type: 'number' }, { name: 'manufacturer', type: 'text' }] },
      { id: 'services', name: 'Services', fields: [{ name: 'service_type', type: 'select', options: ['Consulting', 'Development', 'Support', 'Training'] }, { name: 'duration_hours', type: 'number' }] },
      { id: 'subscriptions', name: 'Subscription Services', fields: [{ name: 'billing_cycle', type: 'select', options: ['Monthly', 'Quarterly', 'Annually'] }, { name: 'user_limit', type: 'number' }] }
    ],
    dashboardMetrics: ['Active Projects', 'License Utilization', 'Support Tickets', 'Revenue per User', 'System Uptime'],
    workflows: ['project_lifecycle', 'support_resolution', 'license_renewal', 'asset_deployment'],
    reportTypes: ['project_performance', 'license_compliance', 'support_analytics', 'revenue_analysis'],
    requiredFields: ['license_key', 'support_level', 'deployment_requirements'],
    customFields: [
      { name: 'technology_stack', type: 'select', options: ['Frontend', 'Backend', 'Database', 'DevOps', 'Mobile'] },
      { name: 'security_level', type: 'select', options: ['Public', 'Internal', 'Confidential', 'Restricted'] }
    ]
  },

  healthcare: {
    id: 'healthcare',
    name: 'Healthcare',
    features: [
      { id: 'appointment_scheduling', name: 'Appointment Scheduling', description: 'Schedule and manage patient appointments', enabled: true },
      { id: 'patient_records', name: 'Patient Records', description: 'Maintain patient health records', enabled: true },
      { id: 'insurance_billing', name: 'Insurance Billing', description: 'Process insurance claims and billing', enabled: true },
      { id: 'compliance_tracking', name: 'Compliance Tracking', description: 'Track regulatory compliance requirements', enabled: true }
    ],
    productCategories: [
      { id: 'medical_equipment', name: 'Medical Equipment', fields: [{ name: 'calibration_date', type: 'date' }, { name: 'certification', type: 'text' }, { name: 'maintenance_schedule', type: 'text' }] },
      { id: 'pharmaceuticals', name: 'Pharmaceuticals', fields: [{ name: 'expiry_date', type: 'date' }, { name: 'batch_number', type: 'text' }, { name: 'storage_requirements', type: 'text' }] },
      { id: 'medical_supplies', name: 'Medical Supplies', fields: [{ name: 'sterility_date', type: 'date' }, { name: 'supplier_certification', type: 'text' }] },
      { id: 'services', name: 'Medical Services', fields: [{ name: 'service_code', type: 'text' }, { name: 'duration_minutes', type: 'number' }, { name: 'specialization', type: 'text' }] }
    ],
    dashboardMetrics: ['Patient Visits', 'Appointment Utilization', 'Equipment Status', 'Compliance Rate', 'Revenue per Patient'],
    workflows: ['patient_intake', 'appointment_booking', 'insurance_processing', 'equipment_maintenance'],
    reportTypes: ['patient_analytics', 'appointment_efficiency', 'equipment_utilization', 'compliance_status'],
    requiredFields: ['medical_certification', 'compliance_code', 'safety_classification'],
    customFields: [
      { name: 'department', type: 'select', options: ['Cardiology', 'Pediatrics', 'Orthopedics', 'Emergency', 'General'] },
      { name: 'risk_category', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] }
    ]
  },

  finance: {
    id: 'finance',
    name: 'Finance',
    features: [
      { id: 'portfolio_management', name: 'Portfolio Management', description: 'Manage client investment portfolios', enabled: true },
      { id: 'risk_assessment', name: 'Risk Assessment', description: 'Evaluate and track financial risks', enabled: true },
      { id: 'regulatory_reporting', name: 'Regulatory Reporting', description: 'Generate compliance reports', enabled: true },
      { id: 'audit_trails', name: 'Audit Trails', description: 'Maintain detailed transaction logs', enabled: true }
    ],
    productCategories: [
      { id: 'investment_products', name: 'Investment Products', fields: [{ name: 'risk_rating', type: 'select', options: ['Conservative', 'Moderate', 'Aggressive'] }, { name: 'minimum_investment', type: 'number' }, { name: 'maturity_period', type: 'text' }] },
      { id: 'insurance_products', name: 'Insurance Products', fields: [{ name: 'policy_type', type: 'select', options: ['Life', 'Health', 'Property', 'Auto'] }, { name: 'coverage_amount', type: 'number' }, { name: 'premium_frequency', type: 'select', options: ['Monthly', 'Quarterly', 'Semi-annual', 'Annual'] }] },
      { id: 'banking_services', name: 'Banking Services', fields: [{ name: 'account_type', type: 'select', options: ['Checking', 'Savings', 'Investment', 'Loan'] }, { name: 'interest_rate', type: 'number' }] },
      { id: 'advisory_services', name: 'Advisory Services', fields: [{ name: 'service_level', type: 'select', options: ['Basic', 'Premium', 'VIP'] }, { name: 'meeting_frequency', type: 'select', options: ['Monthly', 'Quarterly', 'Bi-annual', 'Annual'] }] }
    ],
    dashboardMetrics: ['Assets Under Management', 'Client Portfolio Performance', 'Risk Exposure', 'Compliance Score', 'Revenue per Client'],
    workflows: ['client_onboarding', 'portfolio_review', 'risk_assessment', 'compliance_check'],
    reportTypes: ['portfolio_performance', 'risk_analysis', 'compliance_report', 'client_profitability'],
    requiredFields: ['regulatory_classification', 'risk_profile', 'compliance_status'],
    customFields: [
      { name: 'client_tier', type: 'select', options: ['Retail', 'High Net Worth', 'Ultra High Net Worth', 'Institutional'] },
      { name: 'investment_objective', type: 'select', options: ['Growth', 'Income', 'Preservation', 'Speculation'] }
    ]
  },

  education: {
    id: 'education',
    name: 'Education',
    features: [
      { id: 'student_management', name: 'Student Management', description: 'Manage student enrollment and records', enabled: true },
      { id: 'course_scheduling', name: 'Course Scheduling', description: 'Schedule classes and manage curricula', enabled: true },
      { id: 'academic_reporting', name: 'Academic Reporting', description: 'Generate academic performance reports', enabled: true },
      { id: 'resource_booking', name: 'Resource Booking', description: 'Book classrooms and equipment', enabled: true }
    ],
    productCategories: [
      { id: 'courses', name: 'Courses', fields: [{ name: 'duration_weeks', type: 'number' }, { name: 'level', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced'] }, { name: 'prerequisites', type: 'text' }] },
      { id: 'educational_materials', name: 'Educational Materials', fields: [{ name: 'subject', type: 'text' }, { name: 'grade_level', type: 'select', options: ['K-2', '3-5', '6-8', '9-12', 'College'] }, { name: 'format', type: 'select', options: ['Print', 'Digital', 'Audio', 'Video'] }] },
      { id: 'equipment', name: 'Educational Equipment', fields: [{ name: 'location', type: 'text' }, { name: 'capacity', type: 'number' }, { name: 'maintenance_schedule', type: 'date' }] },
      { id: 'services', name: 'Educational Services', fields: [{ name: 'service_type', type: 'select', options: ['Tutoring', 'Counseling', 'Career Services', 'Library'] }, { name: 'availability', type: 'text' }] }
    ],
    dashboardMetrics: ['Student Enrollment', 'Course Completion Rate', 'Resource Utilization', 'Academic Performance', 'Faculty Efficiency'],
    workflows: ['student_enrollment', 'course_registration', 'academic_assessment', 'resource_allocation'],
    reportTypes: ['enrollment_analytics', 'academic_performance', 'resource_usage', 'financial_aid'],
    requiredFields: ['accreditation_status', 'academic_level', 'enrollment_capacity'],
    customFields: [
      { name: 'institution_type', type: 'select', options: ['Elementary', 'Middle School', 'High School', 'College', 'University', 'Vocational'] },
      { name: 'delivery_method', type: 'select', options: ['In-Person', 'Online', 'Hybrid', 'Distance Learning'] }
    ]
  },

  hospitality: {
    id: 'hospitality',
    name: 'Hospitality',
    features: [
      { id: 'reservation_system', name: 'Reservation System', description: 'Manage room and table bookings', enabled: true },
      { id: 'guest_services', name: 'Guest Services', description: 'Track guest preferences and requests', enabled: true },
      { id: 'event_management', name: 'Event Management', description: 'Plan and coordinate events', enabled: true },
      { id: 'housekeeping', name: 'Housekeeping Management', description: 'Schedule and track cleaning services', enabled: true }
    ],
    productCategories: [
      { id: 'accommodations', name: 'Accommodations', fields: [{ name: 'room_type', type: 'select', options: ['Standard', 'Deluxe', 'Suite', 'Executive'] }, { name: 'capacity', type: 'number' }, { name: 'amenities', type: 'text' }] },
      { id: 'food_beverage', name: 'Food & Beverage', fields: [{ name: 'cuisine_type', type: 'text' }, { name: 'dietary_restrictions', type: 'text' }, { name: 'preparation_time', type: 'number' }] },
      { id: 'event_services', name: 'Event Services', fields: [{ name: 'event_type', type: 'select', options: ['Wedding', 'Conference', 'Banquet', 'Meeting'] }, { name: 'max_capacity', type: 'number' }, { name: 'setup_time', type: 'number' }] },
      { id: 'amenities', name: 'Hotel Amenities', fields: [{ name: 'availability_hours', type: 'text' }, { name: 'booking_required', type: 'select', options: ['Yes', 'No'] }, { name: 'additional_cost', type: 'number' }] }
    ],
    dashboardMetrics: ['Occupancy Rate', 'Average Daily Rate', 'Guest Satisfaction', 'Event Bookings', 'Food & Beverage Revenue'],
    workflows: ['guest_checkin', 'reservation_management', 'housekeeping_schedule', 'event_coordination'],
    reportTypes: ['occupancy_analytics', 'revenue_management', 'guest_satisfaction', 'event_performance'],
    requiredFields: ['booking_status', 'guest_capacity', 'seasonal_pricing'],
    customFields: [
      { name: 'season_category', type: 'select', options: ['Peak', 'High', 'Regular', 'Low', 'Off-season'] },
      { name: 'target_market', type: 'select', options: ['Business', 'Leisure', 'Group', 'Wedding', 'Conference'] }
    ]
  },

  real_estate: {
    id: 'real_estate',
    name: 'Real Estate',
    features: [
      { id: 'property_management', name: 'Property Management', description: 'Manage property listings and details', enabled: true },
      { id: 'client_matching', name: 'Client Matching', description: 'Match clients with suitable properties', enabled: true },
      { id: 'document_management', name: 'Document Management', description: 'Handle contracts and legal documents', enabled: true },
      { id: 'market_analysis', name: 'Market Analysis', description: 'Analyze property market trends', enabled: true }
    ],
    productCategories: [
      { id: 'residential', name: 'Residential Properties', fields: [{ name: 'bedrooms', type: 'number' }, { name: 'bathrooms', type: 'number' }, { name: 'square_footage', type: 'number' }, { name: 'property_type', type: 'select', options: ['House', 'Condo', 'Townhouse', 'Apartment'] }] },
      { id: 'commercial', name: 'Commercial Properties', fields: [{ name: 'zoning', type: 'text' }, { name: 'parking_spaces', type: 'number' }, { name: 'lease_terms', type: 'text' }] },
      { id: 'land', name: 'Land Properties', fields: [{ name: 'acreage', type: 'number' }, { name: 'zoning_classification', type: 'text' }, { name: 'utilities_available', type: 'text' }] },
      { id: 'services', name: 'Real Estate Services', fields: [{ name: 'service_type', type: 'select', options: ['Buying', 'Selling', 'Renting', 'Property Management'] }, { name: 'commission_rate', type: 'number' }] }
    ],
    dashboardMetrics: ['Active Listings', 'Properties Sold', 'Average Sale Price', 'Days on Market', 'Commission Revenue'],
    workflows: ['property_listing', 'client_consultation', 'property_showing', 'contract_processing'],
    reportTypes: ['market_trends', 'sales_performance', 'property_analytics', 'client_activity'],
    requiredFields: ['listing_status', 'property_address', 'market_value'],
    customFields: [
      { name: 'neighborhood', type: 'text' },
      { name: 'school_district', type: 'text' },
      { name: 'hoa_fees', type: 'number' }
    ]
  },

  construction: {
    id: 'construction',
    name: 'Construction',
    features: [
      { id: 'project_management', name: 'Project Management', description: 'Manage construction projects and timelines', enabled: true },
      { id: 'resource_planning', name: 'Resource Planning', description: 'Plan material and labor resources', enabled: true },
      { id: 'safety_compliance', name: 'Safety Compliance', description: 'Track safety protocols and incidents', enabled: true },
      { id: 'equipment_tracking', name: 'Equipment Tracking', description: 'Monitor construction equipment usage', enabled: true }
    ],
    productCategories: [
      { id: 'materials', name: 'Construction Materials', fields: [{ name: 'grade', type: 'text' }, { name: 'delivery_date', type: 'date' }, { name: 'storage_requirements', type: 'text' }] },
      { id: 'tools_equipment', name: 'Tools & Equipment', fields: [{ name: 'rental_daily_rate', type: 'number' }, { name: 'operator_required', type: 'select', options: ['Yes', 'No'] }, { name: 'maintenance_interval', type: 'number' }] },
      { id: 'labor_services', name: 'Labor Services', fields: [{ name: 'skill_level', type: 'select', options: ['Apprentice', 'Journeyman', 'Master'] }, { name: 'hourly_rate', type: 'number' }, { name: 'certification', type: 'text' }] },
      { id: 'subcontractor_services', name: 'Subcontractor Services', fields: [{ name: 'specialty', type: 'text' }, { name: 'license_number', type: 'text' }, { name: 'insurance_status', type: 'select', options: ['Current', 'Expired', 'Pending'] }] }
    ],
    dashboardMetrics: ['Active Projects', 'Resource Utilization', 'Safety Incidents', 'Project Completion Rate', 'Equipment Efficiency'],
    workflows: ['project_planning', 'resource_allocation', 'safety_inspection', 'progress_tracking'],
    reportTypes: ['project_progress', 'resource_utilization', 'safety_compliance', 'cost_analysis'],
    requiredFields: ['safety_rating', 'project_phase', 'compliance_status'],
    customFields: [
      { name: 'project_type', type: 'select', options: ['Residential', 'Commercial', 'Industrial', 'Infrastructure'] },
      { name: 'permit_status', type: 'select', options: ['Pending', 'Approved', 'Under Review', 'Rejected'] }
    ]
  },

  transportation: {
    id: 'transportation',
    name: 'Transportation',
    features: [
      { id: 'fleet_management', name: 'Fleet Management', description: 'Manage vehicle fleet and maintenance', enabled: true },
      { id: 'route_optimization', name: 'Route Optimization', description: 'Optimize delivery and transportation routes', enabled: true },
      { id: 'driver_management', name: 'Driver Management', description: 'Manage driver schedules and certifications', enabled: true },
      { id: 'cargo_tracking', name: 'Cargo Tracking', description: 'Track cargo and shipment status', enabled: true }
    ],
    productCategories: [
      { id: 'vehicles', name: 'Vehicles', fields: [{ name: 'vehicle_type', type: 'select', options: ['Truck', 'Van', 'Car', 'Motorcycle'] }, { name: 'capacity', type: 'number' }, { name: 'fuel_type', type: 'select', options: ['Gasoline', 'Diesel', 'Electric', 'Hybrid'] }] },
      { id: 'transportation_services', name: 'Transportation Services', fields: [{ name: 'service_type', type: 'select', options: ['Local Delivery', 'Long Distance', 'Express', 'Freight'] }, { name: 'rate_per_mile', type: 'number' }] },
      { id: 'maintenance_parts', name: 'Maintenance Parts', fields: [{ name: 'vehicle_compatibility', type: 'text' }, { name: 'replacement_interval', type: 'number' }, { name: 'warranty_period', type: 'number' }] },
      { id: 'fuel_supplies', name: 'Fuel & Supplies', fields: [{ name: 'fuel_grade', type: 'text' }, { name: 'supplier', type: 'text' }, { name: 'delivery_schedule', type: 'text' }] }
    ],
    dashboardMetrics: ['Fleet Utilization', 'Fuel Efficiency', 'Delivery Performance', 'Maintenance Costs', 'Driver Performance'],
    workflows: ['route_planning', 'vehicle_maintenance', 'driver_scheduling', 'cargo_dispatch'],
    reportTypes: ['fleet_performance', 'route_efficiency', 'maintenance_analytics', 'driver_reports'],
    requiredFields: ['vehicle_registration', 'driver_license', 'insurance_status'],
    customFields: [
      { name: 'route_type', type: 'select', options: ['Urban', 'Highway', 'Mixed', 'Rural'] },
      { name: 'cargo_type', type: 'select', options: ['General', 'Fragile', 'Hazardous', 'Perishable'] }
    ]
  },

  agriculture: {
    id: 'agriculture',
    name: 'Agriculture',
    features: [
      { id: 'crop_management', name: 'Crop Management', description: 'Track crop planting, growth, and harvest', enabled: true },
      { id: 'livestock_tracking', name: 'Livestock Tracking', description: 'Monitor animal health and breeding', enabled: true },
      { id: 'weather_monitoring', name: 'Weather Monitoring', description: 'Track weather conditions for farming decisions', enabled: true },
      { id: 'equipment_scheduling', name: 'Equipment Scheduling', description: 'Schedule farm equipment usage', enabled: true }
    ],
    productCategories: [
      { id: 'crops', name: 'Crops', fields: [{ name: 'planting_season', type: 'select', options: ['Spring', 'Summer', 'Fall', 'Winter'] }, { name: 'harvest_time', type: 'date' }, { name: 'yield_per_acre', type: 'number' }] },
      { id: 'livestock', name: 'Livestock', fields: [{ name: 'breed', type: 'text' }, { name: 'age_months', type: 'number' }, { name: 'health_status', type: 'select', options: ['Healthy', 'Sick', 'Quarantine'] }] },
      { id: 'farm_supplies', name: 'Farm Supplies', fields: [{ name: 'application_rate', type: 'text' }, { name: 'safety_period', type: 'number' }, { name: 'storage_temp', type: 'text' }] },
      { id: 'equipment', name: 'Farm Equipment', fields: [{ name: 'horsepower', type: 'number' }, { name: 'fuel_consumption', type: 'number' }, { name: 'maintenance_hours', type: 'number' }] }
    ],
    dashboardMetrics: ['Crop Yield', 'Livestock Health', 'Equipment Efficiency', 'Seasonal Revenue', 'Weather Impact'],
    workflows: ['crop_planning', 'livestock_care', 'equipment_maintenance', 'harvest_processing'],
    reportTypes: ['crop_performance', 'livestock_analytics', 'equipment_usage', 'seasonal_analysis'],
    requiredFields: ['growing_season', 'land_area', 'organic_certification'],
    customFields: [
      { name: 'irrigation_method', type: 'select', options: ['Drip', 'Sprinkler', 'Flood', 'Rain-fed'] },
      { name: 'soil_type', type: 'select', options: ['Clay', 'Sandy', 'Loam', 'Silt'] }
    ]
  },

  entertainment: {
    id: 'entertainment',
    name: 'Entertainment',
    features: [
      { id: 'event_planning', name: 'Event Planning', description: 'Plan and coordinate entertainment events', enabled: true },
      { id: 'talent_management', name: 'Talent Management', description: 'Manage performers and crew schedules', enabled: true },
      { id: 'venue_booking', name: 'Venue Booking', description: 'Book and manage entertainment venues', enabled: true },
      { id: 'ticket_sales', name: 'Ticket Sales', description: 'Manage ticket sales and seating', enabled: true }
    ],
    productCategories: [
      { id: 'events', name: 'Events', fields: [{ name: 'event_type', type: 'select', options: ['Concert', 'Theater', 'Sports', 'Festival'] }, { name: 'capacity', type: 'number' }, { name: 'duration_hours', type: 'number' }] },
      { id: 'equipment_rental', name: 'Equipment Rental', fields: [{ name: 'equipment_type', type: 'text' }, { name: 'rental_rate', type: 'number' }, { name: 'setup_time', type: 'number' }] },
      { id: 'talent_services', name: 'Talent Services', fields: [{ name: 'performance_type', type: 'text' }, { name: 'fee_structure', type: 'select', options: ['Hourly', 'Per Show', 'Per Event', 'Contract'] }] },
      { id: 'merchandise', name: 'Merchandise', fields: [{ name: 'event_specific', type: 'select', options: ['Yes', 'No'] }, { name: 'size_options', type: 'text' }] }
    ],
    dashboardMetrics: ['Event Attendance', 'Ticket Sales', 'Venue Utilization', 'Talent Costs', 'Merchandise Revenue'],
    workflows: ['event_creation', 'talent_booking', 'venue_setup', 'ticket_management'],
    reportTypes: ['event_performance', 'sales_analytics', 'audience_demographics', 'venue_efficiency'],
    requiredFields: ['event_date', 'venue_capacity', 'performance_rating'],
    customFields: [
      { name: 'age_restriction', type: 'select', options: ['All Ages', '13+', '16+', '18+', '21+'] },
      { name: 'genre', type: 'text' }
    ]
  },

  consulting: {
    id: 'consulting',
    name: 'Consulting',
    features: [
      { id: 'project_management', name: 'Project Management', description: 'Manage consulting projects and deliverables', enabled: true },
      { id: 'time_tracking', name: 'Time Tracking', description: 'Track billable hours and project time', enabled: true },
      { id: 'client_portal', name: 'Client Portal', description: 'Provide clients access to project updates', enabled: true },
      { id: 'knowledge_base', name: 'Knowledge Base', description: 'Maintain consulting methodologies and templates', enabled: true }
    ],
    productCategories: [
      { id: 'consulting_services', name: 'Consulting Services', fields: [{ name: 'expertise_area', type: 'text' }, { name: 'hourly_rate', type: 'number' }, { name: 'project_duration', type: 'text' }] },
      { id: 'training_programs', name: 'Training Programs', fields: [{ name: 'training_type', type: 'select', options: ['Workshop', 'Seminar', 'Online Course', 'Certification'] }, { name: 'participant_limit', type: 'number' }] },
      { id: 'research_reports', name: 'Research Reports', fields: [{ name: 'industry_focus', type: 'text' }, { name: 'report_type', type: 'select', options: ['Market Analysis', 'Competitive Intelligence', 'Industry Trends'] }] },
      { id: 'tools_templates', name: 'Tools & Templates', fields: [{ name: 'methodology', type: 'text' }, { name: 'customization_level', type: 'select', options: ['Standard', 'Customized', 'Bespoke'] }] }
    ],
    dashboardMetrics: ['Project Revenue', 'Utilization Rate', 'Client Satisfaction', 'Project Completion', 'Knowledge Assets'],
    workflows: ['client_engagement', 'project_delivery', 'time_billing', 'knowledge_capture'],
    reportTypes: ['project_profitability', 'consultant_utilization', 'client_analytics', 'knowledge_metrics'],
    requiredFields: ['billing_rate', 'expertise_level', 'project_status'],
    customFields: [
      { name: 'engagement_type', type: 'select', options: ['Strategy', 'Implementation', 'Advisory', 'Training'] },
      { name: 'industry_vertical', type: 'text' }
    ]
  },

  non_profit: {
    id: 'non_profit',
    name: 'Non-Profit',
    features: [
      { id: 'donor_management', name: 'Donor Management', description: 'Track donations and donor relationships', enabled: true },
      { id: 'volunteer_coordination', name: 'Volunteer Coordination', description: 'Manage volunteer schedules and activities', enabled: true },
      { id: 'grant_tracking', name: 'Grant Tracking', description: 'Track grant applications and funding', enabled: true },
      { id: 'impact_reporting', name: 'Impact Reporting', description: 'Measure and report organizational impact', enabled: true }
    ],
    productCategories: [
      { id: 'programs', name: 'Programs', fields: [{ name: 'beneficiary_count', type: 'number' }, { name: 'program_duration', type: 'text' }, { name: 'funding_source', type: 'text' }] },
      { id: 'services', name: 'Services', fields: [{ name: 'service_category', type: 'select', options: ['Education', 'Healthcare', 'Housing', 'Food Security', 'Environment'] }, { name: 'target_population', type: 'text' }] },
      { id: 'events', name: 'Fundraising Events', fields: [{ name: 'event_type', type: 'select', options: ['Gala', 'Auction', 'Run/Walk', 'Campaign'] }, { name: 'fundraising_goal', type: 'number' }] },
      { id: 'resources', name: 'Resources', fields: [{ name: 'resource_type', type: 'select', options: ['Educational', 'Medical', 'Food', 'Shelter'] }, { name: 'distribution_method', type: 'text' }] }
    ],
    dashboardMetrics: ['Donation Amount', 'Volunteer Hours', 'Program Reach', 'Grant Success Rate', 'Administrative Ratio'],
    workflows: ['donor_cultivation', 'volunteer_management', 'grant_application', 'impact_measurement'],
    reportTypes: ['fundraising_performance', 'volunteer_analytics', 'program_effectiveness', 'financial_transparency'],
    requiredFields: ['tax_exempt_status', 'program_category', 'beneficiary_impact'],
    customFields: [
      { name: 'cause_area', type: 'select', options: ['Education', 'Health', 'Environment', 'Social Services', 'Arts', 'Religion'] },
      { name: 'geographic_focus', type: 'select', options: ['Local', 'Regional', 'National', 'International'] }
    ]
  },

  other: {
    id: 'other',
    name: 'Other',
    features: [
      { id: 'custom_workflows', name: 'Custom Workflows', description: 'Create custom business workflows', enabled: true },
      { id: 'flexible_categories', name: 'Flexible Categories', description: 'Define custom product/service categories', enabled: true },
      { id: 'custom_reporting', name: 'Custom Reporting', description: 'Build custom reports and analytics', enabled: true },
      { id: 'integration_support', name: 'Integration Support', description: 'Connect with external systems', enabled: true }
    ],
    productCategories: [
      { id: 'products', name: 'Products', fields: [{ name: 'custom_field_1', type: 'text' }, { name: 'custom_field_2', type: 'text' }] },
      { id: 'services', name: 'Services', fields: [{ name: 'service_duration', type: 'number' }, { name: 'delivery_method', type: 'text' }] },
      { id: 'resources', name: 'Resources', fields: [{ name: 'resource_type', type: 'text' }, { name: 'availability', type: 'text' }] }
    ],
    dashboardMetrics: ['Total Revenue', 'Customer Count', 'Product Sales', 'Service Delivery', 'Resource Utilization'],
    workflows: ['general_sales', 'customer_service', 'inventory_management', 'financial_tracking'],
    reportTypes: ['sales_analysis', 'customer_insights', 'operational_metrics', 'financial_summary'],
    requiredFields: ['business_type', 'primary_offering'],
    customFields: [
      { name: 'business_model', type: 'select', options: ['B2B', 'B2C', 'B2B2C', 'Marketplace'] },
      { name: 'revenue_model', type: 'select', options: ['Product Sales', 'Service Fees', 'Subscription', 'Commission'] }
    ]
  }
};

export function getSectorConfiguration(sectorId: string): SectorConfiguration {
  return sectorConfigurations[sectorId] || sectorConfigurations.other;
}

export function getSectorFeatures(sectorId: string): SectorFeature[] {
  const config = getSectorConfiguration(sectorId);
  return config.features.filter(feature => feature.enabled);
}

export function getSectorProductCategories(sectorId: string): ProductCategory[] {
  const config = getSectorConfiguration(sectorId);
  return config.productCategories;
}