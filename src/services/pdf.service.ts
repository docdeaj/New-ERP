import { Injectable, createComponent, ApplicationRef, EnvironmentInjector, inject } from '@angular/core';
import { Invoice, Quotation } from '../models/types';
import { InvoicePdfComponent } from '../components/invoice-pdf/invoice-pdf.component';

@Injectable({
  providedIn: 'root'
})
export class PdfGenerationService {
  private appRef = inject(ApplicationRef);
  private injector = inject(EnvironmentInjector);

  async generatePdf(data: Invoice | Quotation) {
    // 1. Create a container element that will be captured
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px'; // Position off-screen
    container.style.width = '210mm'; // A4 width
    
    // 2. Create the Angular component dynamically
    const componentRef = createComponent(InvoicePdfComponent, {
      environmentInjector: this.injector,
    });
    
    // 3. Set the component's input data
    componentRef.setInput('data', data);
    
    // 4. Attach the component to the DOM to be rendered
    this.appRef.attachView(componentRef.hostView);
    container.appendChild(componentRef.location.nativeElement);
    document.body.appendChild(container);
    
    // Allow a brief moment for the component to render fully
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const win = window as any;
      // 5. Check if the required PDF generation libraries are loaded from the CDN
      if (typeof win.jspdf?.jsPDF !== 'function' || typeof win.html2canvas !== 'function') {
        const errorMsg = "PDF generation libraries could not be loaded. Please check your internet connection or ad blocker.";
        console.error(errorMsg);
        alert(errorMsg);
        return;
      }

      // 6. Initialize jsPDF
      const pdf = new win.jspdf.jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const docType = 'invoiceNumber' in data ? 'invoice' : 'quotation';
      const docNumber = 'invoiceNumber' in data ? data.invoiceNumber : data.quotationNumber;
      
      // 7. Use the .html() method which internally uses html2canvas and returns a Promise
      await pdf.html(container, {
        html2canvas: {
          scale: 2, // Use a higher scale for better image quality
          useCORS: true
        },
        autoPaging: 'text',
        width: 210, // A4 width in mm
        windowWidth: 794, // Approx A4 width in pixels for scaling
      });
      
      // 8. Save the generated PDF
      pdf.save(`${docType}-${docNumber}.pdf`);

    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("An error occurred while generating the PDF.");
    } finally {
      // 9. Clean up: destroy the component and remove the container from the DOM
      this.appRef.detachView(componentRef.hostView);
      componentRef.destroy();
      document.body.removeChild(container);
    }
  }
}