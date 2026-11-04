import { Database } from 'lucide-react';
import LeadImporter from '@/components/ui/LeadImporter';

export default function AdminImportPage() {
  return (
    <div className="p-4 lg:p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Database className="h-6 w-6 text-gray-400" />
          Data Import
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Import leads and other data into the CRM system using our flexible importer.
        </p>
      </div>

      {/* Enhanced Import Description */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <h3 className="font-medium mb-2">Flexible Lead Importer</h3>
        <p className="text-sm text-gray-600">
          Our enhanced importer can handle CSV or Excel files from any source - perfect for AI-generated leads 
          or data with varying completeness. You can map your column names to our lead fields, and missing 
          information will be handled gracefully.
        </p>
      </div>

      {/* Lead Import Section */}
      <div className="mb-8">
        <LeadImporter />
      </div>

      {/* Future import sections can be added here */}
      {/* 
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Client Import</h2>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <p className="text-gray-600">Client import feature coming soon...</p>
        </div>
      </div>
      */}
    </div>
  );
}