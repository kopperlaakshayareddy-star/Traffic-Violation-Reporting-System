export const VEHICLE_TYPES = [
  'Car',
  'Motorcycle',
  'Truck',
  'Bus',
  'Auto Rickshaw',
  'Van',
  'Bicycle',
  'Scooter',
  'Tractor',
  'Other',
] as const;

export const VIOLATION_TYPES = [
  'Speeding',
  'Red Light Violation',
  'No Parking',
  'Wrong Way Driving',
  'No Helmet',
  'No Seat Belt',
  'Drunken Driving',
  'Using Mobile While Driving',
  'Overloading',
  'Illegal Overtaking',
  'Document Expired',
  'Pollution / Emission',
  'Other',
] as const;

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-300',
  approved: 'bg-green-100 text-green-800 border-green-300',
  rejected: 'bg-red-100 text-red-800 border-red-300',
};

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  officer: 'Traffic Officer',
  citizen: 'Citizen',
};

export const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-gov-orange-100 text-gov-orange-800 border-gov-orange-300',
  officer: 'bg-gov-blue-100 text-gov-blue-800 border-gov-blue-300',
  citizen: 'bg-gray-100 text-gray-700 border-gray-300',
};

export const ITEMS_PER_PAGE = 10;
