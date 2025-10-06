import { Injectable, createComponent, ApplicationRef, EnvironmentInjector, inject } from '@angular/core';
import { Invoice } from '../models/types';
import { InvoicePdfComponent } from '../components/invoice-pdf/invoice-pdf.component';

@Injectable({
  providedIn: 'root'
})
export class PdfGenerationService {
  private appRef = inject(ApplicationRef);
  private injector = inject(EnvironmentInjector);

  async generateInvoicePdf(invoice: Invoice) {
    // 1. Create a container element
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px'; // Position off-screen
    container.style.width = '210mm'; // A4 width
    
    // 2. Create component ref
    const componentRef = createComponent(InvoicePdfComponent, {
      environmentInjector: this.injector,
    });
    
    // 3. Set component input using .set() for signal inputs
    componentRef.instance.invoice.set(invoice);
    
    // 4. Attach component to the app so that it's rendered
    this.appRef.attachView(componentRef.hostView);
    container.appendChild(componentRef.location.nativeElement);
    document.body.appendChild(container);
    
    // Allow time for rendering
    await new Promise(resolve => setTimeout(resolve, 100));

    // 5. Use html2canvas from the window object to capture the component
    const canvas = await (window as any).html2canvas(container, {
      scale: 2, // Higher scale for better quality
      useCORS: true
    });

    // 6. Use jspdf from the window object to create PDF from canvas
    const imgData = canvas.toDataURL('image/png');
    const pdf = new (window as any).jspdf.jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    // 7. Download PDF
    pdf.save(`invoice-${invoice.invoiceNumber}.pdf`);

    // 8. Clean up
    this.appRef.detachView(componentRef.hostView);
    componentRef.destroy();
    document.body.removeChild(container);
  }
}