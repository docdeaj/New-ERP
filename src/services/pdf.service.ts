import { Injectable, createComponent, ApplicationRef, EnvironmentInjector, inject } from '@angular/core';
import { Invoice, Quotation, PurchaseOrder, Receipt } from '../models/types';
import { InvoicePdfComponent } from '../components/invoice-pdf/invoice-pdf.component';
import { UiStateService } from './ui-state.service';

type PrintableDocument = Invoice | Quotation | PurchaseOrder | Receipt;

interface DocumentInfo {
  type: string;
  typePlural: string;
  number: string;
}

@Injectable({
  providedIn: 'root'
})
export class PdfGenerationService {
  private appRef = inject(ApplicationRef);
  private injector = inject(EnvironmentInjector);
  private uiState = inject(UiStateService);
  private scriptsReadyPromise: Promise<void> | null = null;

  private getDocumentInfo(data: PrintableDocument): DocumentInfo {
    if ('invoiceNumber' in data && 'dueDate' in data) return { type: 'Invoice', typePlural: 'Invoices', number: data.invoiceNumber };
    if ('quotationNumber' in data) return { type: 'Quotation', typePlural: 'Quotations', number: data.quotationNumber };
    if ('poNumber' in data) return { type: 'Purchase Order', typePlural: 'Purchase Orders', number: data.poNumber };
    if ('receiptNumber' in data) return { type: 'Receipt', typePlural: 'Receipts', number: data.receiptNumber };
    return { type: 'Document', typePlural: 'Documents', number: String((data as any).id) };
  }

  private getFilename(data: PrintableDocument): string {
    const { type, number } = this.getDocumentInfo(data);
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const time = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    const safeNumber = number.replace(/[^a-z0-9-]/gi, '_');
    const safeType = type.replace(' ', '-');
    return `${safeType}-${safeNumber}_${date}_${time}.pdf`;
  }

  private ensureScriptsLoaded(): Promise<void> {
    if (this.scriptsReadyPromise) {
      return this.scriptsReadyPromise;
    }

    const win = window as any;
    // Check if they are already available
    if (typeof win.jspdf?.jsPDF === 'function' && typeof win.html2canvas === 'function') {
      return Promise.resolve();
    }

    this.scriptsReadyPromise = new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkInterval = 100; // ms
      const timeout = 10000; // 10 seconds

      const check = () => {
        if (typeof win.jspdf?.jsPDF === 'function' && typeof win.html2canvas === 'function') {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('PDF generation libraries (jspdf, html2canvas) failed to load within 10 seconds. Check script tags in index.html.'));
        } else {
          setTimeout(check, checkInterval);
        }
      };

      check();
    });
    
    return this.scriptsReadyPromise;
  }
  
  private async _generatePdfBlob(data: PrintableDocument): Promise<Blob | null> {
    try {
      await this.ensureScriptsLoaded();
    } catch (error) {
      console.error("PDF generation libraries could not be loaded.", error);
      alert("Error: PDF generation libraries could not be loaded. Please check your network connection and try again.");
      return null;
    }

    const win = window as any;
    // This check is now a safeguard
    if (typeof win.jspdf?.jsPDF !== 'function' || typeof win.html2canvas !== 'function') {
      console.error("PDF generation libraries are not available on the window object after waiting.");
      alert("An unexpected error occurred during PDF library initialization.");
      return null;
    }

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '210mm'; // A4 width
    
    const componentRef = createComponent(InvoicePdfComponent, { environmentInjector: this.injector });
    componentRef.setInput('data', data);
    
    this.appRef.attachView(componentRef.hostView);
    container.appendChild(componentRef.location.nativeElement);
    document.body.appendChild(container);
    
    // Allow a moment for rendering
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const { jsPDF } = win.jspdf;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      
      await pdf.html(container.children[0] as HTMLElement, {
        html2canvas: { scale: 2, useCORS: true },
        autoPaging: 'text',
        width: 210,
        windowWidth: 794,
      });
      return pdf.output('blob');
    } finally {
      this.appRef.detachView(componentRef.hostView);
      componentRef.destroy();
      document.body.removeChild(container);
    }
  }

  async generatePdf(data: PrintableDocument) {
    try {
      const blob = await this._generatePdfBlob(data);
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = this.getFilename(data);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert(`An error occurred while generating the PDF: ${error}`);
    }
  }
  
  async generateBulkPdfZip(documents: PrintableDocument[]) {
    if (documents.length === 0) return;
    
    const win = window as any;
     if (typeof win.JSZip !== 'function') {
        const errorMsg = "ZIP library could not be loaded. Please check your internet connection or ad blocker.";
        console.error(errorMsg);
        alert(errorMsg);
        return;
      }
    
    this.uiState.showProgress('Exporting PDFs', documents.length, true);
    const zip = new win.JSZip();

    try {
      for (let i = 0; i < documents.length; i++) {
        const state = this.uiState.progressState();
        if (state?.isCancelled) {
          console.log('Bulk export cancelled by user.');
          break;
        }

        const doc = documents[i];
        this.uiState.updateProgress(i + 1);
        const blob = await this._generatePdfBlob(doc);
        if (blob) {
          zip.file(this.getFilename(doc), blob);
        } else {
          console.warn(`Skipped failed PDF generation for document: ${this.getDocumentInfo(doc).number}`);
        }
      }
        
      const state = this.uiState.progressState();
      if (state?.isCancelled) {
        this.uiState.hideProgress();
        return;
      }

      this.uiState.updateProgress(documents.length);
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      
      const { typePlural } = this.getDocumentInfo(documents[0]);
      const now = new Date();
      const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const time = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
      
      a.href = url;
      a.download = `${typePlural}_${documents.length}_${date}_${time}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
        console.error("Bulk PDF export failed:", error);
        alert(`An error occurred during bulk export: ${error}`);
    } finally {
        setTimeout(() => this.uiState.hideProgress(), 1000);
    }
  }

  async generatePdfFromElement(element: HTMLElement, filename: string) {
    try {
      await this.ensureScriptsLoaded();
      this.uiState.showProgress('Generating PDF...', 1, false);
      
      const win = window as any;
      const { jsPDF } = win.jspdf;
      const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
      
      const canvas = await win.html2canvas(element, { 
        useCORS: true,
        scale: 2,
        backgroundColor: '#0a0a0c' // Match body bg
      });

      const imgData = canvas.toDataURL('image/png');
      const imgProps= pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(filename);

    } catch (error) {
      console.error("PDF generation from element failed:", error);
      alert(`An error occurred while generating the PDF: ${error}`);
    } finally {
      this.uiState.hideProgress();
    }
  }
}