
export type SettingType = 'boolean' | 'string' | 'number' | 'enum';
export type SettingScope = 'tenant' | 'user';
export type UIControl = 'switch' | 'text' | 'select' | 'number' | 'textarea';

export interface SettingDefinition {
  key: string;
  section: string;
  scope: SettingScope;
  type: SettingType;
  ui_control: UIControl;
  default: any;
  label: string;
  description: string;
  options?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
}

export const SETTINGS_REGISTRY: SettingDefinition[] = [
  // --- Organization ---
  {
    key: 'org.company_name',
    section: 'Organization',
    scope: 'tenant',
    type: 'string',
    ui_control: 'text',
    default: 'M Leather',
    label: 'Company Name',
    description: 'The legal name of your business, which appears on official documents.'
  },
  {
    key: 'org.currency',
    section: 'Organization',
    scope: 'tenant',
    type: 'enum',
    ui_control: 'select',
    options: ['LKR', 'USD', 'EUR'],
    default: 'LKR',
    label: 'Default Currency',
    description: 'The primary currency for all financial transactions and reports.'
  },
  {
    key: 'org.week_start',
    section: 'Organization',
    scope: 'tenant',
    type: 'enum',
    ui_control: 'select',
    options: ['Sunday', 'Monday'],
    default: 'Monday',
    label: 'Week Start Day',
    description: 'Determines the first day of the week for calendars and reports.'
  },
  {
    key: 'org.invoice_prefix',
    section: 'Organization',
    scope: 'tenant',
    type: 'string',
    ui_control: 'text',
    default: 'INV-',
    label: 'Invoice Prefix',
    description: 'The prefix used for all new invoice numbers (e.g., INV-2024-001).'
  },
  // --- Auth & Security ---
  {
    key: 'security.session_length_minutes',
    section: 'Auth & Security',
    scope: 'tenant',
    type: 'number',
    ui_control: 'number',
    default: 60,
    min: 15,
    max: 1440,
    label: 'Session Length (Minutes)',
    description: 'The duration a user can be inactive before being automatically logged out.'
  },
  {
    key: 'security.require_2fa',
    section: 'Auth & Security',
    scope: 'tenant',
    type: 'boolean',
    ui_control: 'switch',
    default: false,
    label: 'Require Two-Factor Authentication',
    description: 'Enforce 2FA for all users to enhance account security.'
  },
  // --- Regional & Tax ---
  {
    key: 'regional.tax.mode',
    section: 'Regional & Tax',
    scope: 'tenant',
    type: 'enum',
    ui_control: 'select',
    options: ['None', 'VAT'],
    default: 'VAT',
    label: 'Tax Mode',
    description: 'The tax system applied to sales and purchases.'
  },
  {
    key: 'regional.tax.vat_rate',
    section: 'Regional & Tax',
    scope: 'tenant',
    type: 'number',
    ui_control: 'number',
    default: 10,
    label: 'VAT Rate (%)',
    description: 'The standard Value Added Tax rate to be applied.',
    min: 0,
    max: 100
  },
   {
    key: 'regional.tax.inclusive_by_default',
    section: 'Regional & Tax',
    scope: 'tenant',
    type: 'boolean',
    ui_control: 'switch',
    default: false,
    label: 'Prices are Tax Inclusive',
    description: 'Enable if the product prices you enter already include the tax amount.'
  },
  // --- POS ---
  {
    key: 'pos.barcode_mode_auto_submit',
    section: 'POS',
    scope: 'user',
    type: 'boolean',
    ui_control: 'switch',
    default: true,
    label: 'Barcode Auto-Submit',
    description: 'Automatically add product to cart after a barcode is scanned (detects Enter key).'
  },
  {
    key: 'pos.receipt.print_header',
    section: 'POS',
    scope: 'tenant',
    type: 'string',
    ui_control: 'textarea',
    default: 'Thank you for shopping with us!',
    label: 'Receipt Header Text',
    description: 'Custom text to appear at the top of printed POS receipts.'
  },
  {
    key: 'pos.receipt.footer_text',
    section: 'POS',
    scope: 'tenant',
    type: 'string',
    ui_control: 'textarea',
    default: 'Please visit again!',
    label: 'Receipt Footer Text',
    description: 'Custom text to appear at the bottom of printed POS receipts.'
  },
  {
    key: 'pos.receipt.show_logo',
    section: 'POS',
    scope: 'tenant',
    type: 'boolean',
    ui_control: 'switch',
    default: true,
    label: 'Show Logo on Receipts',
    description: 'Display your company logo on POS receipts.'
  },
   {
    key: 'pos.max_discount_percent',
    section: 'POS',
    scope: 'tenant',
    type: 'number',
    ui_control: 'number',
    default: 25,
    min: 0,
    max: 100,
    label: 'Maximum Discount (%)',
    description: 'The maximum discount percentage a cashier can apply to a sale.'
  },
   // --- Sales & Invoices ---
  {
    key: 'sales.default_payment_terms',
    section: 'Sales & Invoices',
    scope: 'tenant',
    type: 'number',
    ui_control: 'number',
    default: 30,
    min: 0,
    label: 'Default Payment Terms (Days)',
    description: 'The default number of days until an invoice is due.'
  },
  {
    key: 'sales.invoice_grace_days',
    section: 'Sales & Invoices',
    scope: 'tenant',
    type: 'number',
    ui_control: 'number',
    default: 5,
    min: 0,
    label: 'Overdue Grace Period (Days)',
    description: 'How many days after the due date before an invoice is marked as "Overdue".'
  },
  {
    key: 'sales.quotation_validity',
    section: 'Sales & Invoices',
    scope: 'tenant',
    type: 'number',
    ui_control: 'number',
    default: 14,
    min: 1,
    label: 'Quotation Validity (Days)',
    description: 'How many days a quotation remains valid before expiring.'
  },
  // --- Inventory & Purchasing ---
  {
    key: 'inventory.low_stock_threshold',
    section: 'Inventory & Purchasing',
    scope: 'tenant',
    type: 'number',
    ui_control: 'number',
    default: 10,
    min: 0,
    label: 'Low Stock Threshold',
    description: 'Receive alerts when product stock falls below this quantity.'
  },
  {
    key: 'inventory.require_transfer_approval',
    section: 'Inventory & Purchasing',
    scope: 'tenant',
    type: 'boolean',
    ui_control: 'switch',
    default: false,
    label: 'Require Transfer Approvals',
    description: 'If enabled, stock transfers between locations will require manager approval.'
  },
  // --- Appearance ---
  {
    key: 'appearance.theme',
    section: 'Appearance',
    scope: 'user',
    type: 'enum',
    ui_control: 'select',
    options: ['Dark', 'Light', 'System'],
    default: 'Dark',
    label: 'Theme',
    description: 'Choose the color theme for the application interface.'
  },
  {
    key: 'appearance.density',
    section: 'Appearance',
    scope: 'user',
    type: 'enum',
    ui_control: 'select',
    options: ['Comfortable', 'Compact'],
    default: 'Comfortable',
    label: 'Interface Density',
    description: 'Adjust the spacing and size of UI elements for a more compact or spacious view.'
  },
];