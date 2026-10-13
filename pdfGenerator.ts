
const renderHTMLToPDF = async (htmlString: string, filename: string) => {
  const container = document.createElement('div');

  Object.assign(container.style, {
    position: 'absolute',
    left: '0',
    top: '0',
    width: '794px',
    zIndex: '9999',
    opacity: '1',
    visibility: 'visible',
    pointerEvents: 'none',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    overflow: 'visible'
  });

  container.innerHTML = htmlString;
  document.body.appendChild(container);

  try {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    const images = Array.from(
      container.querySelectorAll('img')
    );

    await Promise.all(
      images.map(async (img) => {
        if (img.complete && img.naturalWidth > 0) return;

        await new Promise<void>((resolve) => {
          const finish = () => resolve();
          img.addEventListener('load', finish, { once: true });
          img.addEventListener('error', finish, { once: true });
        });
      })
    );

    await new Promise<void>((resolve) =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => resolve())
      )
    );

    const content = container.firstElementChild as HTMLElement | null;

    if (!content) {
      throw new Error('PDF content is empty.');
    }

    const canvas = await html2canvas(content, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      width: 794,
      windowWidth: 1000
    });

    if (!canvas.width || !canvas.height) {
      throw new Error('PDF image could not be generated.');
    }

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pdfWidth = 210;
    const pdfHeight = 297;
    const pageHeightPx = Math.floor(
      (canvas.width * pdfHeight) / pdfWidth
    );

    let currentY = 0;
    let pageIndex = 0;

    while (currentY < canvas.height) {
      if (pageIndex > 0) {
        pdf.addPage();
      }

      const sliceHeight = Math.min(
        pageHeightPx,
        canvas.height - currentY
      );

      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;

      const context = pageCanvas.getContext('2d');

      if (!context) {
        throw new Error('Could not prepare PDF page.');
      }

      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

      context.drawImage(
        canvas,
        0,
        currentY,
        canvas.width,
        sliceHeight,
        0,
        0,
        canvas.width,
        sliceHeight
      );

      const imageData = pageCanvas.toDataURL('image/jpeg', 0.95);
      const imageHeightMm =
        (sliceHeight * pdfWidth) / canvas.width;

      pdf.addImage(
        imageData,
        'JPEG',
        0,
        0,
        pdfWidth,
        imageHeightMm
      );

      currentY += sliceHeight;
      pageIndex++;
    }

    pdf.save(filename);
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error;
  } finally {
    container.remove();
  }
};
