
import React from 'react';
import { ViewState } from '../types';
import { X, Info, BookOpen } from 'lucide-react';

interface TutorialGuideProps {
  view: ViewState;
  onClose: () => void;
}

export const TutorialGuide: React.FC<TutorialGuideProps> = ({ view, onClose }) => {
  const getContent = () => {
    switch(view) {
      case 'dashboard':
        return (
          <>
            <h3 className="font-bold text-lg mb-2 text-indigo-300">Executive Dashboard</h3>
            <p className="mb-3 text-sm">Your real-time business command center.</p>
            <ul className="list-disc pl-4 space-y-2 text-xs opacity-90">
              <li><strong>Net Operating Profit:</strong> The ultimate truth. Calculated as <em className="text-indigo-200">Gross Sales - COGS - Expenses - Return Losses</em>.</li>
              <li><strong>Status Volume:</strong> Monitor the pulse of your orders. High 'Pending' means fulfillment is lagging.</li>
              <li><strong>Reconciliation Flow:</strong> Visualizes cash flow. Opening Balance (from last month) + Profit = Closing Balance. Use "Close Period" in Reports to lock this.</li>
            </ul>
          </>
        );
      case 'inventory':
        return (
          <>
            <h3 className="font-bold text-lg mb-2 text-indigo-300">Inventory Catalog</h3>
            <p className="mb-3 text-sm">The foundation of your ERP. Define what you sell.</p>
            <ul className="list-disc pl-4 space-y-2 text-xs opacity-90">
              <li><strong>Create Product:</strong> Click "+ New Product". Choose "Standard" for simple items or "Variable" for items with sizes/colors.</li>
              <li><strong>SKU Logic:</strong> Keep SKUs unique. The system auto-generates them based on category, but you can override.</li>
              <li><strong>Stock Levels:</strong> While you can edit stock here manually, it is <em>highly recommended</em> to use <strong>Procurement</strong> to add stock to maintain a cost history.</li>
            </ul>
          </>
        );
      case 'procurement':
        return (
          <>
            <h3 className="font-bold text-lg mb-2 text-indigo-300">Procurement Cycle</h3>
            <p className="mb-3 text-sm">How you buy stock and calculate costs.</p>
            <ul className="list-disc pl-4 space-y-2 text-xs opacity-90">
              <li><strong>Smart Restock:</strong> Click the sparkle icon to auto-fill items that are below their "Min Stock" level.</li>
              <li><strong>Create PO:</strong> Select a supplier and items. Status starts as 'Ordered'.</li>
              <li><strong>Receiving Goods:</strong> Click "Receive" when goods arrive. This <strong>Increases Stock</strong> and updates the <strong>Weighted Average Cost (AVCO)</strong> of your items automatically.</li>
            </ul>
          </>
        );
      case 'sales':
        return (
          <>
            <h3 className="font-bold text-lg mb-2 text-indigo-300">Point of Sale (POS)</h3>
            <p className="mb-3 text-sm">Processing orders and managing revenue.</p>
            <ul className="list-disc pl-4 space-y-2 text-xs opacity-90">
              <li><strong>New Order:</strong> Click "+" to open the terminal. Add items to cart. Search or quick-add customers.</li>
              <li><strong>Stock Logic:</strong>
                <br/>• <em>Pending:</em> Stock is reserved (safe to sell), but not deducted.
                <br/>• <em>Delivered:</em> Stock is permanently deducted. Revenue is recognized.
              </li>
              <li><strong>Invoice:</strong> Print professional thermal-ready receipts immediately after order creation.</li>
            </ul>
          </>
        );
      case 'customers':
        return (
          <>
            <h3 className="font-bold text-lg mb-2 text-indigo-300">CRM & Loyalty</h3>
            <p className="mb-3 text-sm">Track client relationships and value.</p>
            <ul className="list-disc pl-4 space-y-2 text-xs opacity-90">
              <li><strong>LTV (Lifetime Value):</strong> Auto-calculated total of all 'Delivered' orders for a client.</li>
              <li><strong>Tiers:</strong> Manually assign Gold/Silver/Bronze status based on LTV to offer exclusive perks.</li>
              <li><strong>History:</strong> Click the clock icon on any customer card to see their full purchase ledger.</li>
            </ul>
          </>
        );
      case 'suppliers':
        return (
          <>
            <h3 className="font-bold text-lg mb-2 text-indigo-300">Supply Chain</h3>
            <p className="mb-3 text-sm">Manage vendor relationships.</p>
            <ul className="list-disc pl-4 space-y-2 text-xs opacity-90">
              <li><strong>Database:</strong> Keep contact details for all your sourcing partners here.</li>
              <li><strong>Linkage:</strong> When creating products, link them to these suppliers to enable filtering in Procurement.</li>
            </ul>
          </>
        );
      case 'expenses':
        return (
          <>
            <h3 className="font-bold text-lg mb-2 text-indigo-300">Expense Ledger</h3>
            <p className="mb-3 text-sm">Track operational outflow.</p>
            <ul className="list-disc pl-4 space-y-2 text-xs opacity-90">
              <li><strong>Operational Costs:</strong> Log rent, salaries, and utility bills here.</li>
              <li><strong>Impact:</strong> These entries are deducted from your Gross Profit to calculate <strong>Net Operating Profit</strong> on the Dashboard.</li>
              <li><strong>Auto-Entries:</strong> The system automatically logs "Procurement" expenses when you receive a PO.</li>
            </ul>
          </>
        );
      case 'returns':
        return (
          <>
            <h3 className="font-bold text-lg mb-2 text-indigo-300">RMA & Refunds</h3>
            <p className="mb-3 text-sm">Handling product returns and losses.</p>
            <ul className="list-disc pl-4 space-y-2 text-xs opacity-90">
              <li><strong>Process:</strong> Select a 'Delivered' order. Choose the item.</li>
              <li><strong>Condition:</strong>
                <br/>• <em>Resellable:</em> Stock is added back to inventory.
                <br/>• <em>Damaged:</em> Stock is discarded (Loss recorded).
              </li>
              <li><strong>Delivery Refusal:</strong> If a customer refuses delivery, check the box to log the delivery fee as a business loss automatically.</li>
            </ul>
          </>
        );
      case 'calculator':
        return (
          <>
            <h3 className="font-bold text-lg mb-2 text-indigo-300">Import Costing Lab</h3>
            <p className="mb-3 text-sm">Determine true Landed Cost for imports.</p>
            <ul className="list-disc pl-4 space-y-2 text-xs opacity-90">
              <li><strong>Scenario:</strong> You bought items from China + paid a global shipping bill.</li>
              <li><strong>Action:</strong> Add items to the batch. Enter the <strong>Grand Total</strong> shipping/customs fee.</li>
              <li><strong>Result:</strong> The system spreads the fee across items based on value. Click "Update Inventory" to apply these new costs to your stock.</li>
            </ul>
          </>
        );
      case 'spreadsheet':
        return (
          <>
            <h3 className="font-bold text-lg mb-2 text-indigo-300">Master Grid</h3>
            <p className="mb-3 text-sm">Bulk editing interface.</p>
            <ul className="list-disc pl-4 space-y-2 text-xs opacity-90">
              <li><strong>Quick Edits:</strong> Click on Price, Cost, or Stock cells in the "Inventory" tab to edit them inline without opening modals.</li>
              <li><strong>Export:</strong> Download any table as a CSV file for external analysis in Excel/Sheets.</li>
            </ul>
          </>
        );
      case 'reports':
        return (
          <>
            <h3 className="font-bold text-lg mb-2 text-indigo-300">Financial Reports</h3>
            <p className="mb-3 text-sm">Closing books and analyzing trends.</p>
            <ul className="list-disc pl-4 space-y-2 text-xs opacity-90">
              <li><strong>Close Period:</strong> At month-end, use this to lock your profit and carry the cash balance forward to the next month's "Opening Balance".</li>
              <li><strong>Statements:</strong> Generate P&L statements or General Ledgers for tax and accounting purposes.</li>
            </ul>
          </>
        );
      case 'settings':
        return (
          <>
            <h3 className="font-bold text-lg mb-2 text-indigo-300">System Settings</h3>
            <p className="mb-3 text-sm">Configuration and Data Safety.</p>
            <ul className="list-disc pl-4 space-y-2 text-xs opacity-90">
              <li><strong>Business Profile:</strong> Update the info that appears on your printed invoices.</li>
              <li><strong>Backups:</strong> regularly download a JSON backup of your data. You can restore it here if you switch devices.</li>
              <li><strong>Factory Reset:</strong> Wipes everything to start fresh. Use with caution!</li>
            </ul>
          </>
        );
      default:
        return (
          <>
            <h3 className="font-bold text-lg mb-2 text-indigo-300">Welcome to DécorHub</h3>
            <p className="mb-3 text-sm">Explore the sidebar to manage your business.</p>
            <p className="text-xs">Select any page to see specific tutorials for that section.</p>
          </>
        );
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-[90] max-w-sm w-full animate-in slide-in-from-bottom-10 fade-in duration-300 origin-bottom-right">
      <div className="bg-slate-900/95 text-white p-6 rounded-[2rem] shadow-2xl border border-indigo-500/30 backdrop-blur-md relative">
        <div className="flex items-start gap-4">
           <div className="p-3 bg-indigo-600 rounded-xl shrink-0 shadow-lg shadow-indigo-900/50 mt-1">
             <BookOpen size={20} />
           </div>
           <div className="text-sm leading-relaxed text-slate-100">
             {getContent()}
           </div>
        </div>
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-1.5 hover:bg-white/20 rounded-full transition-colors text-slate-400 hover:text-white"
        >
          <X size={16} />
        </button>
        
        {/* Little triangle pointer pointing to the FAB */}
        <div className="absolute -bottom-2 right-8 w-4 h-4 bg-slate-900 transform rotate-45 border-r border-b border-indigo-500/30"></div>
      </div>
    </div>
  );
};
