import React from 'react';

/**
 * A simple component to test PDF generation
 */
const PDFTest: React.FC = () => {
  const generateTestPDF = async () => {
    try {
      console.log('Starting PDF generation test...');
      
      // Import jsPDF
      const jspdfModule = await import('jspdf');
      console.log('jsPDF module imported:', jspdfModule);
      
      const jsPDF = jspdfModule.default || jspdfModule.jsPDF;
      console.log('jsPDF constructor:', jsPDF);
      
      // Create a new document
      const doc = new jsPDF();
      console.log('PDF document created:', doc);
      
      // Add some text
      doc.text('PDF Test Document', 20, 20);
      console.log('Added text to PDF');
      
      // Try to import autotable
      try {
        const autoTableModule = await import('jspdf-autotable');
        console.log('jspdf-autotable module imported:', autoTableModule);
        
        // @ts-ignore
        doc.autoTable({
          head: [['Name', 'Email', 'Country']],
          body: [
            ['David', 'david@example.com', 'Sweden'],
            ['Castille', 'castille@example.com', 'Spain']
          ],
          startY: 30
        });
        console.log('Added table to PDF');
      } catch (autoTableError) {
        console.error('Error importing or using jspdf-autotable:', autoTableError);
      }
      
      // Save the PDF
      doc.save('test.pdf');
      console.log('PDF saved successfully');
      
      return 'PDF generated successfully';
    } catch (error) {
      console.error('Error in PDF generation test:', error);
      return `PDF generation failed: ${error instanceof Error ? error.message : String(error)}`;
    }
  };

  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <h2 className="text-lg font-semibold mb-4">PDF Generation Test</h2>
      <button
        onClick={generateTestPDF}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Test PDF Generation
      </button>
    </div>
  );
};

export default PDFTest;
